import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatusEnum } from '../common/enum/order-status.enum';
import { Order } from './models/order.model';
import * as prisma from '@prisma/client';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async create(data: CreateOrderDto): Promise<Order> {
    const order = await this.prisma.order.create({
      data: {
        processingStatus: OrderStatusEnum.NEW,
        receivedOrder: { create: data },
      },
      include: { receivedOrder: { include: { details: true } } },
    });

    return order as Order;
  }

  public async update(
    data: Order,
    params: prisma.Prisma.OrderUpdateArgs,
  ): Promise<Order> {
    const { include } = params;

    const updatedOrder = await this.prisma.order.update({
      where: { id: data.id },
      include,
      data,
    });

    return updatedOrder as Order;
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
}
