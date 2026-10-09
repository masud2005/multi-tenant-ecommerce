import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Product ID being reviewed',
    example: '8a8353c7-2fa9-4090-a493-d1c27898f404',
  })
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @ApiProperty({
    description: 'Author display name',
    example: 'Sumona Yeasmin',
  })
  @IsString()
  @IsNotEmpty({ message: 'Author name is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  author: string;

  @ApiProperty({
    description: 'Star rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Minimum rating is 1 star' })
  @Max(5, { message: 'Maximum rating is 5 stars' })
  rating: number;

  @ApiPropertyOptional({
    description: 'Optional review headline / summary',
    example: 'Exceptional handloom quality and fit!',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiProperty({
    description: 'Detailed review comments and feedback',
    example: 'The fabric is pure cotton and the Jamdani motifs are finely woven. Truly authentic craftsmanship.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Review body is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  body: string;

  @ApiPropertyOptional({
    description: 'Optional customer review photo URLs',
    example: ['https://images.unsplash.com/...'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Size / fit feedback (e.g. "True to size", "Runs small", "M")',
    example: 'True to size',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  size?: string;

  @ApiPropertyOptional({
    description: 'Associated Order ID to verify purchase',
    example: 'a6ef7fc6-c754-4d65-a006-657ea78c8008',
  })
  @IsString()
  @IsOptional()
  orderId?: string;
}
