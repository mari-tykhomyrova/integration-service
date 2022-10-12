import { HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { SentOrderStatusEnum } from '../../common/enum/sent-order-status.enum';
import { Order } from '../models/order.model';
import { PrismaService } from '../../database/prisma.service';
import * as prisma from '@prisma/client';
import { SentOrder } from '../models/sent-order.model';

export class OpTigerOrderService {
  private readonly logger = new Logger(OpTigerOrderService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
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
    const orders = await this.findWithParams({
      processingStatus: OrderStatusEnum.PROCESSING,
    });

    // check if they are finished
    for (const order of orders) {
      try {
        // todo: add auth
        const result = await firstValueFrom(
          this.httpService.get(
            `${process.env.OP_API}/api/orders/${order.sendOrder.OrderID}/state`,
          ),
        );

        // if some is finished - update db and client
        // todo: synchronize integration-service status and OP Tiger status order
        // todo: also save status into received order
        if (result.data.state === SentOrderStatusEnum.FINISHED) {
          order.processingStatus = OrderStatusEnum.FINISHED;
          await this.update(order);
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

  private async findWithParams(
    whereOptions: prisma.Prisma.OrderWhereInput,
  ): Promise<Order[]> {
    // todo: try to implement repository
    const orders = await this.prisma.order.findMany({
      where: whereOptions,
      include: {
        sendOrder: { include: { Products: true } },
      } as prisma.Prisma.OrderInclude,
    });

    return orders as Order[];
  }

  private async update(data: Order): Promise<Order> {
    // todo: try to implement repository
    const updatedOrder = await this.prisma.order.update({
      where: { id: data.id },
      data,
    });

    return updatedOrder as Order;
  }
}
