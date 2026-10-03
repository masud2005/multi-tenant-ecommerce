import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum InventoryStockFilter {
  ALL = 'all',
  LOW = 'low', // লো স্টক (১ থেকে ৫ এর মধ্যে)
  OUT = 'out', // স্টক শূন্য (০)
}

export class QueryInventoryDto {
  @ApiPropertyOptional({
    description: 'Search term for product title or variant SKU',
    example: 'Cotton Panjabi',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: InventoryStockFilter,
    default: InventoryStockFilter.ALL,
    description: 'Filter by inventory stock status (all, low, out)',
  })
  @IsEnum(InventoryStockFilter)
  @IsOptional()
  stockStatus?: InventoryStockFilter = InventoryStockFilter.ALL;

  @ApiPropertyOptional({
    description: 'Filter by Category ID or Slug',
    example: 'men',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by Brand ID or Slug',
    example: 'tanti-studio',
  })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
    example: 50,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Sort by field: stock, title, sku, updatedAt',
    default: 'updatedAt',
    example: 'updatedAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort direction: asc or desc',
    default: 'desc',
    example: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
