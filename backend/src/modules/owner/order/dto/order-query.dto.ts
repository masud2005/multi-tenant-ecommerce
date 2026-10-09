import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  PaymentMethod,
  OrderChannel,
} from '../../../../../prisma/generated/client';

export class OrderQueryDto {
  @ApiPropertyOptional({
    example: 'TN-10024',
    description: 'Search string matching order number, customer name, email, or phone',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'unfulfilled',
    description: 'Tab filter: all, unfulfilled, unpaid, packed, shipped, returns, closed',
  })
  @IsString()
  @IsOptional()
  tab?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by order status (e.g. PENDING_PAYMENT, CONFIRMED, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by payment status (PENDING, PAID, FAILED, REFUNDED)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  paymentStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by fulfillment status (UNFULFILLED, PARTIALLY_FULFILLED, FULFILLED)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  fulfillmentStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by payment method (BKASH, NAGAD, SSLCOMMERZ, STRIPE, COD)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  paymentMethod?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by sales channel (ONLINE, MANUAL)',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  channel?: string;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Filter orders created on or after this date (YYYY-MM-DD or ISO)',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'Filter orders created on or before this date (YYYY-MM-DD or ISO)',
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    default: 1,
    description: 'Page number for pagination',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 50,
    description: 'Number of orders per page',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    default: 'createdAt',
    enum: ['createdAt', 'total', 'number'],
    description: 'Field to sort by',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'total' | 'number' = 'createdAt';

  @ApiPropertyOptional({
    default: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
