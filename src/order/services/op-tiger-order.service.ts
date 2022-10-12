import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { catchError, firstValueFrom, of } from 'rxjs';
import { SentOrderStatusEnum } from '../../common/enum/sent-order-status.enum';
import { Order } from '../models/order.model';
import { SentOrder } from '../models/sent-order.model';
import { OrderRepository } from '../order.repository';

@Injectable()
export class OpTigerOrderService {
  private readonly logger = new Logger(OpTigerOrderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly orderRepo: OrderRepository,
  ) {}

  public async sendToOP(orderToSending: SentOrder): Promise<void> {
    try {
      // todo: create separate method with these headers
      const headersRequest = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.AUTHORIZATION}`,
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
          Authorization: `Basic ${process.env.AUTHORIZATION}`,
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
          this.logger.log('Success check order');
        }

        // if some is finished - update db and client
        // todo: synchronize integration-service status and OP Tiger status order
        // todo: also save status into received order
        if (result.data.state === SentOrderStatusEnum.FINISHED) {
          order.processingStatus = OrderStatusEnum.FINISHED;
          await this.orderRepo.update(order, null);
          await this.updateClientStatusOrder(order);
        }
      } catch (e) {
        this.logger.error('Error during checking status in OP Tiger');
        this.logger.error(e.message);
      }
    }
  }

  private async updateClientStatusOrder(order: Order): Promise<void> {
    try {
      // todo: create separate method with these headers
      const headersRequest = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${process.env.AUTHORIZATION}`,
      };

      const result = await firstValueFrom(
        this.httpService
          .get(`${process.env.PARTNER_API}/orders/${order.receivedOrder}`, {
            headers: headersRequest,
          })
          .pipe(
            catchError((err) =>
              of({ message: err.response.data, status: err.response.status }),
            ),
          ),
      );

      if (result.status !== HttpStatus.OK) {
        this.logger.error('Error with status order Partner');
        this.logger.error(result);
      } else {
        this.logger.log('Success updating Partner');
      }
    } catch (e) {
      this.logger.error('Error during order sending to Partner');
      this.logger.error(e.message);
    }
  }
}
