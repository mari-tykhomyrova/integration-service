import { PartnerOrderService } from './services/partner-order.service';
import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Response } from 'express';
import { HeaderDTO } from './dto/header.dto';
import { RequestHeader } from './decorators/request-header.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: PartnerOrderService) {}

  // todo: add auth
  @Post()
  async create(
    @RequestHeader() headers: HeaderDTO,
    @Body() data: CreateOrderDto,
    @Res() res: Response,
  ): Promise<any> {
    // silently process order
    this.orderService.handleNewOrder(data);

    return res.status(HttpStatus.OK).send();
  }
}
