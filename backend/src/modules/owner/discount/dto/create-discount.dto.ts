import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import {
  DiscountMethod,
  DiscountStatus,
  DiscountType,
} from '../../../../../prisma/generated/client';

export class CreateDiscountDto {
  @ApiProperty({
    example: 'EID500',
    description: 'Unique coupon code for the store (automatically uppercased and trimmed)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  code: string;

  @ApiProperty({
    example: 'Eid Special ৳500 Flat Off',
    description: 'Human-readable title or campaign name',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    enum: DiscountType,
    example: DiscountType.FIXED_AMOUNT,
    description: 'Type of discount (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING)',
  })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  type: DiscountType;

  @ApiPropertyOptional({
    enum: DiscountMethod,
    default: DiscountMethod.CODE,
    example: DiscountMethod.CODE,
    description: 'Application method: CODE (coupon input) or AUTOMATIC (applied at cart)',
  })
  @IsEnum(DiscountMethod)
  @IsOptional()
  method?: DiscountMethod = DiscountMethod.CODE;

  @ApiPropertyOptional({
    enum: DiscountStatus,
    default: DiscountStatus.ACTIVE,
    example: DiscountStatus.ACTIVE,
    description: 'Current status of the discount campaign',
  })
  @IsEnum(DiscountStatus)
  @IsOptional()
  status?: DiscountStatus = DiscountStatus.ACTIVE;

  @ApiProperty({
    example: 500,
    description: 'Discount value (Percentage rate or Fixed deduction amount)',
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  value: number;

  @ApiPropertyOptional({
    example: 3000,
    description: 'Minimum cart subtotal required to qualify for this discount',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minSubtotal?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Maximum discount limit in currency (Cap limit for PERCENTAGE type discounts)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Total global redemption limit across all customers',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  usageLimit?: number;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Maximum times a single customer can redeem this discount',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  usageLimitPerUser?: number = 1;

  @ApiProperty({
    example: '2026-03-01T00:00:00.000Z',
    description: 'Start datetime when the discount becomes active',
  })
  @IsDateString()
  @IsNotEmpty()
  startsAt: string;

  @ApiPropertyOptional({
    example: '2026-04-15T23:59:59.000Z',
    description: 'Optional expiry datetime of the discount campaign',
  })
  @IsDateString()
  @IsOptional()
  endsAt?: string;
}
