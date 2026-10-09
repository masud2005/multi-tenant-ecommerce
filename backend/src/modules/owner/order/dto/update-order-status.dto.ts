import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
} from '../../../../../prisma/generated/client';

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({
    enum: OrderStatus,
    example: OrderStatus.SHIPPED,
    description: 'New status for the order (e.g. PROCESSING, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)',
  })
  @IsEnum(OrderStatus, { message: 'Invalid order status' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  status?: OrderStatus;

  @ApiPropertyOptional({
    enum: FulfillmentStatus,
    example: FulfillmentStatus.FULFILLED,
    description: 'Optional fulfillment status update',
  })
  @IsEnum(FulfillmentStatus, { message: 'Invalid fulfillment status' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  fulfillmentStatus?: FulfillmentStatus;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
    description: 'Optional payment status update (e.g. PAID, REFUNDED)',
  })
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    example: 'Pathao Courier',
    description: 'Courier service provider name (e.g. Pathao, Steadfast, Paperfly, RedX)',
  })
  @IsString()
  @IsOptional()
  courier?: string;

  @ApiPropertyOptional({
    example: 'CID-94827103',
    description: 'Consignment tracking number from the courier service',
  })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({
    example: 'Handed over to Pathao delivery hub for final dispatch',
    description: 'Optional audit note to record in the order timeline',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
