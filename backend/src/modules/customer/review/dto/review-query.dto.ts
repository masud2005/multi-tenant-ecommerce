import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min, IsString } from 'class-validator';

export class ReviewQueryDto {
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
    description: 'Filter reviews that contain photos only',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  withPhotosOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Sort criteria for reviews',
    enum: ['recent', 'rating_high', 'rating_low', 'helpful', 'createdAt', 'rating'],
    default: 'recent',
    example: 'recent',
  })
  @IsIn(['recent', 'rating_high', 'rating_low', 'helpful', 'createdAt', 'rating'])
  @IsOptional()
  sortBy?: 'recent' | 'rating_high' | 'rating_low' | 'helpful' | 'createdAt' | 'rating' = 'recent';

  @ApiPropertyOptional({
    description: 'Sort direction order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc',
  })
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

