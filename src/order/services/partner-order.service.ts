import * as prisma from '@prisma/client';
import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderStatusEnum } from '../../common/enum/order-status.enum';
import { SentOrder } from '../models/sent-order.model';
import { Order } from '../models/order.model';
import { OpTigerOrderService } from './op-tiger-order.service';
import { OrderRepository } from '../order.repository';
import { CarrierKeyEnum } from '../../common/enum/carrier-key.enum';
import { catchError, firstValueFrom, of } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class PartnerOrderService {
  private readonly logger = new Logger(PartnerOrderService.name);

  constructor(
    @Inject(forwardRef(() => OpTigerOrderService))
    private readonly opTigerService: OpTigerOrderService,
    private readonly orderRepo: OrderRepository,
    private readonly httpService: HttpService,
  ) {}

  public async handleNewOrder(data: CreateOrderDto): Promise<void> {
    // todo: validate

    const order = await this.orderRepo.create({
      processingStatus: OrderStatusEnum.NEW,
      receivedOrder: data,
    });

    const transformedOrder = await this.transform(order);
    if (transformedOrder.processingStatus === OrderStatusEnum.ERROR) {
      // todo: fix errors
    }
    const filledOrder = await this.orderRepo.update(transformedOrder, {
      include: { sentOrder: { include: { Products: true } } },
    } as prisma.Prisma.OrderUpdateArgs);

    await this.opTigerService.sendToOP(filledOrder.sentOrder);
    filledOrder.processingStatus = OrderStatusEnum.PROCESSING;
    const { sentOrder, ...processingOrder } = filledOrder;
    await this.orderRepo.update(processingOrder, null);
  }

  public async updateClientStatusOrder(order: Order): Promise<void> {
    try {
      // todo: create separate method with these headers
      const headersRequest = {
        'Content-Type': 'application/json',
        'X-API-KEY': `${process.env.PARTNER_AUTHORIZATION_API}`,
      };

      const result = await firstValueFrom(
        this.httpService
          .get(`${process.env.PARTNER_API}/orders/${order.receivedOrder}`, {
            headers: headersRequest,
          })
          .pipe(
            catchError((err) =>
              of({ message: err.response.data, status: err.response.status }),
            ),
          ),
      );

      if (result.status !== HttpStatus.OK) {
        this.logger.error('Error with status order Partner');
        this.logger.error(result);
      } else {
        this.logger.log('Success updating Partner');
      }
    } catch (e) {
      this.logger.error('Error during order sending to Partner');
      this.logger.error(e.message);
    }
  }

  private async transform(order: Order): Promise<Order> {
    try {
      order.sentOrder = {
        OrderID: String(order.receivedOrder.orderId),
        Issued: order.receivedOrder.createdAt.toISOString(),
        Shipping: {
          CarrierID: CarrierKeyEnum[order.receivedOrder.carrierKey], // required, mapped from carriers list
          DeliveryAddress: {
            AddressLine1: order.receivedOrder.addressLine1,
            AddressLine2: order.receivedOrder.addressLine2,
            City: order.receivedOrder.city,
            Company: order.receivedOrder.company,
            CountryCode: 'CZ', // todo: implement grabbing correct code
            Email: order.receivedOrder.email,
            PersonName: order.receivedOrder.fullName,
            Phone: order.receivedOrder.phone,
            State: 'CZ', // todo: implement grabbing correct state
            Zip: order.receivedOrder.zipCode,
          },
        },
        Products: order.receivedOrder.details.map((d) => ({
          Barcode: d.eanCode,
          OPTProductID: String(d.productId),
          Qty: d.quantity,
          Weight: d.weight,
        })),
      } as SentOrder;
      // exclude receiveOrder
      const { receivedOrder, ...transformedOrder } = order;

      return transformedOrder;
    } catch (e) {
      this.logger.error('Error during order transforming');
      order.processingStatus = OrderStatusEnum.ERROR;
      await this.orderRepo.update(order, null);
      return order;
    }
  }
}
