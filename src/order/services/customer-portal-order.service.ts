import * as prisma from '@prisma/client';
import { Order } from '../models/order.model';
import { PrismaService } from '../../database/prisma.service';
import { ReceivedOrder } from '../models/received-order.model';

export class CustomerPortalOrderService {
  constructor(private readonly prisma: PrismaService) {}

  public async findWithParams(
    whereOptions: prisma.Prisma.OrderWhereInput,
    includeOptions: prisma.Prisma.OrderInclude,
  ): Promise<Order[]> {
    // todo: try to implement repository
    const orders = await this.prisma.order.findMany({
      where: whereOptions,
      include: includeOptions,
    });

    return orders as Order[];
  }

  public transformReceivedOrders(orders: Order[]): ReceivedOrder[] {
    return orders.reduce((acc, order) => {
      const { carrierKey, details, ...transformedOrder } = order.receivedOrder;
      transformedOrder.items = order.receivedOrder.details;
      // todo: is partnerCarrierKey and optCarrierKey the same as carrierKey?
      transformedOrder.partnerCarrierKey = order.receivedOrder.carrierKey;
      transformedOrder.optCarrierKey = order.receivedOrder.carrierKey;
      // todo: do it during getting status
      transformedOrder.status = order.processingStatus;

      acc.push(transformedOrder);
      return acc;
    }, []);
  }
}
