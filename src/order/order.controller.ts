import { PartnerOrderService } from './services/partner-order.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Response } from 'express';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: PartnerOrderService) {}

  // todo: add auth
  @Post()
  async create(
    @Body() data: CreateOrderDto,
    @Res() res: Response,
  ): Promise<any> {
    // silently process order
    this.orderService.handleNewOrder(data);

    return res.status(HttpStatus.OK).send();
  }
}
