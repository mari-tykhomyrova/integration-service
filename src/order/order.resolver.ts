import { Resolver, Query, Args } from '@nestjs/graphql';
import { Order } from './models/order.model';
import { ReceivedOrder } from './models/received-order.model';
import { CustomerPortalOrderService } from './services/customer-portal-order.service';

@Resolver(() => Order)
export class OrderResolver {
  constructor(private readonly orderService: CustomerPortalOrderService) {}

  @Query(() => String)
  sayHello(): string {
    return 'Hello World!';
  }

  @Query(() => [ReceivedOrder])
  async orders(
    @Args('createdAfter') createdAfter: string,
  ): Promise<ReceivedOrder[]> {
    const orders = await this.orderService.findWithParams(
      { createdAt: { gte: createdAfter } },
      { receivedOrder: { include: { details: true } } },
    );

    return this.orderService.transformReceivedOrders(orders);
  }
}
