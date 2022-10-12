import * as prisma from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { SentOrder } from '../models/sent-order.model';
import { Order } from '../models/order.model';
import { OpTigerOrderService } from './op-tiger-order.service';
import { OrderRepository } from '../order.repository';

@Injectable()
export class PartnerOrderService {
  private readonly logger = new Logger(PartnerOrderService.name);

  constructor(
    private readonly opTigerService: OpTigerOrderService,
    private readonly orderRepo: OrderRepository,
  ) {}

  public async handleNewOrder(data: CreateOrderDto): Promise<void> {
    // todo: validate

    const order = await this.orderRepo.create(data);

    const transformedOrder = await this.transform(order);
    if (transformedOrder.processingStatus === OrderStatusEnum.ERROR) {
      // todo: fix errors
    }
    const filledOrder = await this.orderRepo.update(transformedOrder, {
      include: { sentOrder: { include: { Products: true } } },
    } as prisma.Prisma.OrderUpdateArgs);

    await this.opTigerService.sendToOP(filledOrder.sentOrder);
    filledOrder.processingStatus = OrderStatusEnum.PROCESSING;
    await this.orderRepo.update(filledOrder, null);
  }

  private async transform(order: Order): Promise<Order> {
    try {
      // todo: transform received order from partner
      order.sentOrder = new SentOrder();
      return order;
    } catch (e) {
      this.logger.error('Error during order transforming');
      order.processingStatus = OrderStatusEnum.ERROR;
      await this.orderRepo.update(order, null);
      return order;
    }
  }
}
