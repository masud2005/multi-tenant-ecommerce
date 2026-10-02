import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateProductImageDto {
  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c',
    description: 'Image URL',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: 'Front view of Olive Panjabi',
    required: false,
    description: 'Alt text for image and accessibility',
  })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiProperty({
    example: true,
    required: false,
    default: false,
    description: 'Whether this image is the main cover image',
  })
  @IsBoolean()
  @IsOptional()
  isCover?: boolean;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
    description: 'Display order index for images',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  order?: number;
}

export class CreateProductVariantDto {
  @ApiProperty({
    example: 'p01-olive-m',
    required: false,
    description: 'Unique Stock Keeping Unit (auto-generated if omitted)',
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({
    example: 'Olive Green',
    description: 'Color name of the variant',
  })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    example: '#556B2F',
    required: false,
    description: 'Hex code for color swatch display',
  })
  @IsString()
  @IsOptional()
  colorHex?: string;

  @ApiProperty({
    example: 'M',
    description: 'Size of the variant (e.g. S, M, L, XL, Free Size)',
  })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({
    example: 3850,
    description: 'Variant price in BDT',
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: 3450,
    required: false,
    description: 'Variant sale/discount price in BDT',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @ApiProperty({
    example: 15,
    required: false,
    default: 0,
    description: 'Available inventory stock count',
  })
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
    description: 'Whether this variant is enabled for purchase',
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({
    example: '8901234567890',
    required: false,
    description: 'Barcode or EAN number',
  })
  @IsString()
  @IsOptional()
  barcode?: string;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'Handloom Cotton Olive Panjabi',
    description: 'Product title / name',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'handloom-cotton-olive-panjabi',
    required: false,
    description: 'Unique URL slug (auto-generated from title if omitted)',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Pure handloom cotton with subtle embroidery details.',
    required: false,
    description: 'Short summary for product cards and quick views',
  })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({
    example: '<p>Crafted from 100% breathable organic cotton...</p>',
    required: false,
    description: 'Full rich-text description of the product',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ProductStatus,
    example: ProductStatus.DRAFT,
    required: false,
    default: ProductStatus.DRAFT,
    description: 'Product publishing status',
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiProperty({
    example: 3850,
    description: 'Base / Regular price in BDT',
  })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    example: 3450,
    required: false,
    description: 'Sale / Discounted price in BDT',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  salePrice?: number;

  @ApiProperty({
    example: 1800,
    required: false,
    default: 0,
    description: 'Cost price per unit for profit calculation',
  })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  cost?: number;

  @ApiProperty({
    example: 450,
    required: false,
    default: 0,
    description: 'Weight in grams for shipping charge calculations',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  weightGrams?: number;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description: 'Whether product is open for pre-orders',
  })
  @IsBoolean()
  @IsOptional()
  preorder?: boolean;

  @ApiProperty({
    example: true,
    required: false,
    default: false,
    description: 'Display "New" arrival badge',
  })
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    default: false,
    description: 'Display "Bestseller" badge',
  })
  @IsBoolean()
  @IsOptional()
  isBestseller?: boolean;

  @ApiProperty({
    example: ['Eid 2026', 'Handloom', 'Cotton'],
    required: false,
    description: 'Product search and filter tags',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    example: { Fabric: '100% Organic Cotton', Fit: 'Regular', Care: 'Hand wash cold' },
    required: false,
    description: 'Key-value technical specifications or attributes',
  })
  @IsObject()
  @IsOptional()
  specs?: Record<string, any>;

  @ApiProperty({
    example: 'Handloom Cotton Panjabi | Tanti Studio',
    required: false,
    description: 'Custom SEO meta title tag',
  })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({
    example: 'Shop authentic Bangladeshi handloom cotton panjabi online at best price.',
    required: false,
    description: 'Custom SEO meta description',
  })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({
    example: 'men',
    description: 'Category ID or slug (Required)',
  })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    example: 'panjabi',
    required: false,
    description: 'Subcategory ID or slug',
  })
  @IsString()
  @IsOptional()
  subcategoryId?: string;

  @ApiProperty({
    example: 'tanti-studio',
    required: false,
    description: 'Brand ID or slug',
  })
  @IsString()
  @IsOptional()
  brandId?: string;

  @ApiProperty({
    example: ['eid-collection-2026', 'summer-specials'],
    required: false,
    description: 'Array of collection IDs or slugs to assign product to',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  collectionIds?: string[];

  @ApiProperty({
    type: [CreateProductImageDto],
    required: false,
    description: 'Gallery images for the product',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];

  @ApiProperty({
    type: [CreateProductVariantDto],
    required: false,
    description: 'Size and color variants with specific pricing and inventory',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  @IsOptional()
  variants?: CreateProductVariantDto[];

  @ApiProperty({
    example: 'uuid-of-tenant',
    required: false,
    description: 'Tenant ID (can be extracted from authenticated user)',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
