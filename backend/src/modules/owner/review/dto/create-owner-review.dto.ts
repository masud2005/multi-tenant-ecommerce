import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ReviewStatus } from '../../../../../prisma/generated/client';

export class CreateOwnerReviewDto {
  @ApiProperty({
    description: 'Author / customer name',
    example: 'Ayesha Siddiqua',
  })
  @IsString()
  @IsNotEmpty({ message: 'Author name is required' })
  @MaxLength(100)
  author: string;

  @ApiProperty({ description: 'Rating score (1 to 5)', example: 5, default: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Review title',
    example: 'Exceptional Quality',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @ApiProperty({
    description: 'Review body text',
    example: 'The product arrived on time and exceeded expectations.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Review body text is required' })
  @MaxLength(2000)
  body: string;

  @ApiProperty({ description: 'Product ID this review belongs to' })
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @ApiPropertyOptional({
    description: 'Whether the purchase is verified',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @ApiPropertyOptional({
    description: 'Customer location or note',
    example: 'Gulshan, Dhaka',
  })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ enum: ReviewStatus, default: ReviewStatus.PUBLISHED })
  @IsEnum(ReviewStatus)
  @IsOptional()
  status?: ReviewStatus;
}
