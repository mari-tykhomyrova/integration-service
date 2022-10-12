import { Order } from '../models/order.model';
import { ReceivedOrder } from '../models/received-order.model';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomerPortalOrderService {
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
