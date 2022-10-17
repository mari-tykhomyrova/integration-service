import { IsEnum, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

// instead of enum
const AuthEnum = {
  AUTH: process.env.PARTNER_AUTHORIZATION_ME,
};
Object.freeze(AuthEnum);

export class HeaderDTO {
  @IsEnum(AuthEnum)
  @IsNotEmpty()
  @Expose({ name: 'x-api-key' })
  'X-API-KEY': string;
}
