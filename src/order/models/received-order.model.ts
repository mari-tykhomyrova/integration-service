import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ReceivedOrderDetail } from './received-order-detail.model';

@ObjectType()
export class ReceivedOrder {
  @Field(() => Int)
  id: number;

  @Field()
  fullName: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  addressLine1: string;

  @Field()
  addressLine2: string;

  @Field()
  company: string;

  @Field()
  zipCode: string;

  @Field()
  city: string;

  @Field()
  country: string;

  // todo: format properly these fields
  @Field({ nullable: true })
  carrierKey?: string;
  @Field({ nullable: true })
  partnerCarrierKey?: string;
  @Field({ nullable: true })
  optCarrierKey?: string;

  @Field()
  status: string;

  // todo: format properly these fields
  @Field(() => [ReceivedOrderDetail], { nullable: true })
  details?: ReceivedOrderDetail[];
  @Field(() => [ReceivedOrderDetail], { nullable: true })
  items?: ReceivedOrderDetail[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
