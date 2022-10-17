import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { catchError, firstValueFrom, of } from 'rxjs';
import { SentOrderStatusEnum } from '../../common/enum/sent-order-status.enum';
import { SentOrder } from '../models/sent-order.model';
import { OrderRepository } from '../order.repository';
import { PartnerOrderService } from './partner-order.service';

@Injectable()
export class OpTigerOrderService {
  private readonly logger = new Logger(OpTigerOrderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly orderRepo: OrderRepository,
    @Inject(forwardRef(() => PartnerOrderService))
    private readonly partnerOrderService: PartnerOrderService,
  ) {}

  public async sendToOP(orderToSending: SentOrder): Promise<void> {
    try {
      // todo: create separate method with these headers
      const headersRequest = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.OP_AUTHORIZATION_API}`,
      };

      const result = await firstValueFrom(
        this.httpService
          .post(`${process.env.OP_API}/api/orders`, orderToSending, {
            headers: headersRequest,
          })
          .pipe(
            catchError((err) =>
              of({ message: err.response.data, status: err.response.status }),
            ),
          ),
      );

      if (result.status !== HttpStatus.OK) {
        this.logger.error('Error with sent order to OP');
        this.logger.error(JSON.stringify(result));
      } else {
        this.logger.log('Success sending order');
      }
    } catch (e) {
      this.logger.error('Error during order sending to OP');
      this.logger.error(e.message);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron(): Promise<void> {
    this.logger.debug('Called every minute');

    // find all not finished orders
    const orders = await this.orderRepo.findWithParams(
      {
        processingStatus: OrderStatusEnum.PROCESSING,
      },
      {
        sentOrder: { include: { Products: true } },
      },
    );

    // check if they are finished
    for (const order of orders) {
      try {
        // todo: create separate method with these headers
        const headersRequest = {
          'Content-Type': 'application/json',
          Authorization: `Basic ${process.env.OP_AUTHORIZATION_API}`,
        };

        const result = await firstValueFrom(
          this.httpService
            .get(
              `${process.env.OP_API}/api/orders/${order.sentOrder.OrderID}/state`,
              { headers: headersRequest },
            )
            .pipe(
              catchError(
                (err) =>
                  of({
                    message: err.response.data,
                    status: err.response.status,
                  } as any), // todo: create proper typing
              ),
            ),
        );

        if (result.status !== HttpStatus.OK) {
          this.logger.error('Error with check order status to OP');
          this.logger.error(result);
        } else {
          this.logger.log(`Success check order >> ${result.data.state}`);
        }

        // if some is finished - update db and client
        // todo: synchronize integration-service status and OP Tiger status order
        // todo: also save status into received order
        if (result.data.state === SentOrderStatusEnum.FINISHED) {
          order.processingStatus = OrderStatusEnum.FINISHED;
          await this.orderRepo.update(order, null);
          await this.partnerOrderService.updateClientStatusOrder(order);
        }
      } catch (e) {
        this.logger.error('Error during checking status in OP Tiger');
        this.logger.error(e.message);
      }
    }
  }
}
