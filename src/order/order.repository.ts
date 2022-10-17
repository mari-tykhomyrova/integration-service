import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Order } from './models/order.model';
import * as prisma from '@prisma/client';

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  public async create(data: Partial<Order>): Promise<Order> {
    const preparedData = this.transforming(data);

    try {
      const order = await this.prisma.order.create({
        data: preparedData,
        include: { receivedOrder: { include: { details: true } } },
      });
      return order as Order;
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  public async update(
    data: Order,
    params: prisma.Prisma.OrderUpdateArgs,
  ): Promise<Order> {
    const { include } = params || {};
    const preparedData = this.transforming(data);

    try {
      const updatedOrder = await this.prisma.order.update({
        where: { id: data.id },
        include,
        data: preparedData,
      });
      return updatedOrder as Order;
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  public async findWithParams(
    whereOptions: prisma.Prisma.OrderWhereInput,
    includeOptions: prisma.Prisma.OrderInclude,
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: whereOptions,
      include: includeOptions,
    });

    return orders as Order[];
  }

  /**
   * Transform Order to Prisma object for creating nested related record
   */
  private transforming(
    data: Partial<Order>,
  ): prisma.Prisma.OrderUncheckedCreateInput {
    const { receivedOrder: rOrder, sentOrder: sOrder, ...order } = data;
    const preparedData: prisma.Prisma.OrderUncheckedCreateInput = {
      processingStatus: order.processingStatus,
    };

    if (rOrder && Object.keys(rOrder).length !== 0) {
      const { details, id: orderId, ...receivedOrder } = rOrder;
      preparedData.receivedOrder = {
        create: {
          ...receivedOrder,
          orderId,
          details: {
            create: details,
          },
        },
      };
    }
    if (sOrder && Object.keys(sOrder).length !== 0) {
      const { Products, ...sentOrder } = sOrder;
      preparedData.sentOrder = {
        create: {
          ...sentOrder,
          Products: {
            create: Products,
          },
        },
      };
    }

    return preparedData;
  }
}
