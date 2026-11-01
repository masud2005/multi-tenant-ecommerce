import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { MilestoneDto } from './milestone.dto';
import { StatItemDto } from './stat-item.dto';

export class UpdateAboutPageDto {
  @ApiPropertyOptional({
    example: 'Our story',
    description: 'Header/category badge title of the About page',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Clothing that carries the hands that made it',
    description: 'Main display heading of the About page',
  })
  @IsString()
  @IsOptional()
  heading?: string;

  @ApiPropertyOptional({
    example: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e',
    description: 'Hero banner image URL',
  })
  @IsString()
  @IsOptional()
  heroImage?: string;

  @ApiPropertyOptional({
    example: 'Two people in festive artisan wear in a courtyard',
    description: 'Hero banner image alt text',
  })
  @IsString()
  @IsOptional()
  heroImageAlt?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'Tanti means weaver. We started because the most beautiful textiles in the world were being made a few hours from Dhaka.',
      'Today we work directly with weavers, block-printers, cobblers and silversmiths across Bangladesh.',
    ],
    description: 'Array of narrative paragraphs detailing the brand story',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  storyParagraphs?: string[];

  @ApiPropertyOptional({
    type: [MilestoneDto],
    description: 'Chronological timeline of company milestones and history',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneDto)
  @IsOptional()
  milestones?: MilestoneDto[];

  @ApiPropertyOptional({
    type: [StatItemDto],
    description: 'Key highlight statistics displayed on the About page',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StatItemDto)
  @IsOptional()
  stats?: StatItemDto[];

  @ApiPropertyOptional({
    example: 'Read stories from our makers',
    description: 'Call to action button label',
  })
  @IsString()
  @IsOptional()
  ctaText?: string;

  @ApiPropertyOptional({
    example: '/journal',
    description: 'Call to action button destination link',
  })
  @IsString()
  @IsOptional()
  ctaLink?: string;

  @ApiPropertyOptional({
    example: 'published',
    enum: ['published', 'draft', 'scheduled'],
    description: 'Page publication status',
    default: 'published',
  })
  @IsString()
  @IsIn(['published', 'draft', 'scheduled'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'Our Story | Tanti',
    description: 'Custom SEO meta title',
  })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional({
    example: 'Clothing that carries the hands that made it. Fair rates and craft empowerment across Bangladesh.',
    description: 'Custom SEO meta description',
  })
  @IsString()
  @IsOptional()
  seoDescription?: string;
}
