import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { Order } from './models/order.model';
import { ReceivedOrder } from './models/received-order.model';
import { CustomerPortalOrderService } from './services/customer-portal-order.service';
import { OrderRepository } from './order.repository';
import { ForbiddenException } from '@nestjs/common';

@Resolver(() => Order)
export class OrderResolver {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderService: CustomerPortalOrderService,
  ) {}

  @Query(() => String)
  sayHello(): string {
    return 'Hello World!';
  }

  @Query(() => [ReceivedOrder])
  async orders(
    @Args('createdAfter') createdAfter: string,
    @Context() context,
  ): Promise<ReceivedOrder[]> {
    // todo: move it to decorator
    const headers = context.req.headers;
    if (
      !Object.keys(headers).find(
        (key) =>
          process.env.CUSTOMER_AUTHORIZATION_KEY === key &&
          headers.key === process.env.CUSTOMER_AUTHORIZATION_ME,
      )
    ) {
      throw new ForbiddenException();
    }

    const orders = await this.orderRepo.findWithParams(
      { createdAt: { gte: createdAfter } },
      { receivedOrder: { include: { details: true } } },
    );

    return this.orderService.transformReceivedOrders(orders);
  }
}
