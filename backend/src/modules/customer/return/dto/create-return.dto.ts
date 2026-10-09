import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReturnResolution } from '../../../../../prisma/generated/client';

export class CreateReturnItemDto {
  @ApiProperty({
    description: 'Product or item title',
    example: 'Artisan Full-Grain Leather Sandal',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Image URL of the item',
    example: 'https://images.unsplash.com/photo-1549298916-b41d501d3772',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({
    description: 'Quantity to return',
    example: 1,
    default: 1,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({
    description: 'Unit price of the item',
    example: 3200,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Variant size',
    example: '41',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: 'Variant color',
    example: 'Tan Brown',
  })
  @IsOptional()
  @IsString()
  color?: string;
}

export class CreateReturnDto {
  @ApiProperty({
    description: 'Order ID or Order Number for the return',
    example: '2d88664a-3aeb-45e8-a969-5f3ba49971a4',
  })
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Customer full name (optional, defaults to order customer name)',
    example: 'Sumona Yeasmin',
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({
    description: 'Reason for return',
    example: 'Defective or damaged item',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Detailed explanation of the issue',
    example: 'The buckle on the sandal is broken on arrival.',
  })
  @IsOptional()
  @IsString()
  details?: string;

  @ApiPropertyOptional({
    description: 'Uploaded photo URLs showing the product issue',
    type: [String],
    example: ['https://example.com/photos/defect1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Preferred resolution (REFUND, STORE_CREDIT, EXCHANGE)',
    enum: ReturnResolution,
    default: ReturnResolution.REFUND,
    example: ReturnResolution.REFUND,
  })
  @IsOptional()
  @IsEnum(ReturnResolution)
  resolution?: ReturnResolution = ReturnResolution.REFUND;

  @ApiProperty({
    description: 'List of items to return',
    type: [CreateReturnItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];
}
