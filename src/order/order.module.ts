import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OrderResolver } from './order.resolver';
import { PartnerOrderService } from './services/partner-order.service';
import { OrderController } from './order.controller';
import { HttpModule } from '@nestjs/axios';
import { OpTigerOrderService } from './services/op-tiger-order.service';
import { CustomerPortalOrderService } from './services/customer-portal-order.service';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [OrderController],
  providers: [
    OrderResolver,
    PartnerOrderService,
    OpTigerOrderService,
    CustomerPortalOrderService,
  ],
  exports: [],
})
export class OrderModule {}
