import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ApplyDiscountDto {
  @ApiProperty({
    example: 'EID500',
    description: 'Coupon code entered by customer in cart or checkout',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({
    example: 3500,
    description: 'Current cart items subtotal amount before shipping and discounts',
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal: number;

  @ApiPropertyOptional({
    example: 'customer@example.com',
    description: 'Customer email address for guest checkout per-user limit verification',
  })
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  customerEmail?: string;
}
