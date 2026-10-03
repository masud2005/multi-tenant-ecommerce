import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { CollectionType } from '../../../../../prisma/generated/client';

export class CreateCollectionDto {
  @ApiProperty({
    example: 'Eid Collection 2026',
    description: 'The title/name of the collection',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'eid-collection-2026',
    required: false,
    description: 'URL-friendly slug (auto-generated from name if omitted)',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Exclusive handwoven pieces curated for Eid festivities.',
    required: false,
    description: 'Description for the storefront and SEO',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Collection cover image file to upload',
  })
  @IsOptional()
  image?: any;

  @ApiProperty({
    example: 'Eid Collection 2026 | Tanti Fashion',
    required: false,
    description: 'Meta title for SEO',
  })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({
    example: 'Shop the newest Eid collection at Tanti Fashion.',
    required: false,
    description: 'Meta description for SEO',
  })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({
    enum: CollectionType,
    default: CollectionType.MANUAL,
    required: false,
    description: 'Collection type (MANUAL or RULE)',
  })
  @IsEnum(CollectionType)
  @IsOptional()
  type?: CollectionType;

  @ApiProperty({
    example: { field: 'tag', operator: 'equals', value: 'eid' },
    required: false,
    description: 'Automated rules for dynamic collections (JSON)',
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsOptional()
  rule?: any;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
    description: 'Whether the collection is publicly visible',
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
    example: false,
    required: false,
    default: false,
    description: 'Whether to highlight in featured sections on home page',
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({
    example: 0,
    required: false,
    default: 0,
    description: 'Display order priority',
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  order?: number;

  @ApiProperty({
    example: '2026-03-01T00:00:00.000Z',
    required: false,
    description: 'Optional campaign start datetime',
  })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiProperty({
    example: '2026-04-15T23:59:59.000Z',
    required: false,
    description: 'Optional campaign end datetime',
  })
  @IsDateString()
  @IsOptional()
  endsAt?: string;
}
