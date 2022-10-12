import { ReceivedOrder } from './received-order.model';
import { SentOrder } from './sent-order.model';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';

export class Order {
  id: number;
  processingStatus: OrderStatusEnum;
  receivedOrder?: ReceivedOrder;
  sentOrder?: SentOrder;

  createdAt: Date;
  updatedAt: Date;
}
