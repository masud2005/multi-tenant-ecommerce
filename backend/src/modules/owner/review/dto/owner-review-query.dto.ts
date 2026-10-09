import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class OwnerReviewQueryDto {
  @ApiPropertyOptional({
    description: 'Search query across customer author, title, body, or product title',
    example: 'Jamdani',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter reviews by specific star rating (1 to 5)',
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({
    description: 'Filter by specific product ID',
    example: '8a8353c7-2fa9-4090-a493-d1c27898f404',
  })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter by replied status (true = has admin reply, false = pending reply)',
    example: false,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  hasReply?: boolean;

  @ApiPropertyOptional({
    description: 'Filter reviews containing customer photos only',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  withPhotosOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of reviews per page',
    default: 20,
    example: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['createdAt', 'rating', 'helpful'],
    default: 'createdAt',
  })
  @IsIn(['createdAt', 'rating', 'helpful'])
  @IsOptional()
  sortBy?: 'createdAt' | 'rating' | 'helpful' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
