import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
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
      // todo: add auth
      const result = await firstValueFrom(
        this.httpService.post(
          `${process.env.OP_API}/api/orders`,
          orderToSending,
        ),
      );

      if (result.status !== HttpStatus.OK) {
        this.logger.error('Error with sent order to OP');
        this.logger.error(result.data);
      }
    } catch (e) {
      this.logger.error('Error during order sending to OP');
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
        // todo: add auth
        const result = await firstValueFrom(
          this.httpService.get(
            `${process.env.OP_API}/api/orders/${order.sentOrder.OrderID}/state`,
          ),
        );

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
      }
    }
  }

  private async updateClientStatusOrder(order: Order): Promise<void> {
    try {
      // todo: add auth
      const result = await firstValueFrom(
        this.httpService.get(
          `${process.env.PARTNER_API}/orders/${order.receivedOrder}`,
        ),
      );

      if (result.status !== HttpStatus.OK) {
        this.logger.error('Error with status order Partner');
        this.logger.error(result.data);
      }
    } catch (e) {
      this.logger.error('Error during order sending to Partner');
    }
  }
}
