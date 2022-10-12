import * as prisma from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { SentOrder } from '../models/sent-order.model';
import { Order } from '../models/order.model';
import { PrismaService } from '../../database/prisma.service';
import { OpTigerOrderService } from './op-tiger-order.service';

@Injectable()
export class PartnerOrderService {
  private readonly logger = new Logger(PartnerOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly opTigerService: OpTigerOrderService,
  ) {}

  public async handleNewOrder(data: CreateOrderDto): Promise<void> {
    // todo: validate

    const order = await this.create(data);

    const transformedOrder = await this.transform(order);
    if (transformedOrder.processingStatus === OrderStatusEnum.ERROR) {
      // todo: fix errors
    }
    const filledOrder = await this.update(transformedOrder, null);

    await this.opTigerService.sendToOP(filledOrder.sendOrder);
    filledOrder.processingStatus = OrderStatusEnum.PROCESSING;
    await this.update(filledOrder, null);
  }

  private async create(data: CreateOrderDto): Promise<Order> {
    // todo: try to implement repository
    const order = await this.prisma.order.create({
      data: {
        processingStatus: OrderStatusEnum.NEW,
        receivedOrder: { create: data },
      },
      include: { receivedOrder: { include: { details: true } } },
    });

    return order as Order;
  }

  private async update(
    data: Order,
    params: prisma.Prisma.OrderUpdateArgs,
  ): Promise<Order> {
    const { include } = params;
    // todo: try to implement repository
    const updatedOrder = await this.prisma.order.update({
      where: { id: data.id },
      include,
      data,
    });

    return updatedOrder as Order;
  }

  private async transform(order: Order): Promise<Order> {
    try {
      // todo: transform received order from partner
      order.sendOrder = new SentOrder();
      return order;
    } catch (e) {
      this.logger.error('Error during order transforming');
      order.processingStatus = OrderStatusEnum.ERROR;
      await this.update(order, {
        include: { sentOrder: { include: { Products: true } } },
      } as prisma.Prisma.OrderUpdateArgs);
      return order;
    }
  }
}
