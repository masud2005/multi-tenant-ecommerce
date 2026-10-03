import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ProductStatus } from './create-product.dto';

export class QueryProductDto {
  @ApiPropertyOptional({ description: 'Filter by Category ID or Slug' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by Subcategory ID or Slug' })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiPropertyOptional({ description: 'Filter by Brand ID or Slug' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: 'Filter by Collection ID or Slug' })
  @IsString()
  @IsOptional()
  collection?: string;

  @ApiPropertyOptional({
    enum: ProductStatus,
    description: 'Filter by Status (DRAFT, PUBLISHED, ARCHIVED)',
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({
    description: 'Search term for title, short description, tags, or variant SKU',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by bestseller flag' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isBestseller?: boolean;

  @ApiPropertyOptional({ description: 'Filter by new arrivals flag' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isNew?: boolean;

  @ApiPropertyOptional({ description: 'Filter by minimum price' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Sort by field: createdAt, price, title, sold, rating',
    default: 'createdAt',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction: asc or desc',
    default: 'desc',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
