import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReceivedOrderDetail {
  @Field(() => Int)
  id?: number;

  @Field()
  productId: number;

  @Field()
  name: string;

  @Field()
  quantity: number;

  @Field()
  weight: number;

  @Field()
  eanCode: string;

  @Field()
  createdAt?: Date;

  @Field()
  updatedAt?: Date;
}
