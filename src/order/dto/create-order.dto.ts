import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsPostalCode,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CarrierKeyEnum } from '../../common/enum/carrier-key.enum';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsNotEmpty()
  @IsString()
  addressLine2: string;

  @IsNotEmpty()
  @IsString()
  company: string;

  @IsNotEmpty()
  @IsPostalCode()
  zipCode: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsEnum(CarrierKeyEnum)
  @IsString()
  carrierKey: string;

  @IsNotEmpty()
  @IsString()
  status: string;

  @Type(() => Details)
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  details: Details[];
}

export class Details {
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @IsNotEmpty()
  @IsString()
  eanCode: string;
}
