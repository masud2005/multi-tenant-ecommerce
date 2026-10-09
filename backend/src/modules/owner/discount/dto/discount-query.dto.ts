import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DiscountStatus, DiscountType } from '../../../../../prisma/generated/client';

export class DiscountQueryDto {
  @ApiPropertyOptional({
    example: 'EID',
    description: 'Search string matching discount code or title',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: DiscountStatus,
    description: 'Filter discounts by status (ACTIVE, SCHEDULED, EXPIRED)',
  })
  @IsEnum(DiscountStatus)
  @IsOptional()
  status?: DiscountStatus;

  @ApiPropertyOptional({
    enum: DiscountType,
    description: 'Filter discounts by type (PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING)',
  })
  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

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
    default: 20,
    description: 'Number of items per page',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
