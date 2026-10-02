import { ApiProperty } from '@nestjs/swagger';
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
    example: 'https://example.com/images/eid-banner.jpg',
    required: false,
    description: 'Cover image or banner URL for the collection',
  })
  @IsString()
  @IsOptional()
  image?: string;

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
  @IsOptional()
  rule?: any;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
    description: 'Whether the collection is publicly visible',
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

  @ApiProperty({
    example: 'uuid-of-tenant',
    required: false,
    description: 'Tenant ID',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
