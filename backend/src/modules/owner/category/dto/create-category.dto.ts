import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Clothing',
    description: 'The name of the category',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'clothing',
    required: false,
    description: 'Custom slug (auto-generated if not provided)',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'All kinds of fashionable clothing and apparel',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Category image file to upload',
  })
  @IsOptional()
  image?: any;

  @ApiProperty({
    example: 'Best Clothing Online Store',
    required: false,
  })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({
    example: 'Buy premium clothing at the best prices.',
    required: false,
  })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({
    example: 'published',
    required: false,
    default: 'published',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  showInNav?: boolean;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @ApiProperty({
    example: 'uuid-of-parent-category',
    required: false,
    description: 'Parent category ID if this is a subcategory',
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
