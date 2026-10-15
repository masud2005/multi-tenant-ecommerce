import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ReturnSectionDto } from './return-section.dto';

export class UpdateReturnsPageDto {
  @ApiPropertyOptional({
    example: 'Return & Refund Policy',
    description: 'Header/title of the Returns page',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Easy 7-day returns & Cash on Delivery refunds',
    description: 'Main display heading of the Returns page',
  })
  @IsString()
  @IsOptional()
  heading?: string;

  @ApiPropertyOptional({
    type: [ReturnSectionDto],
    description: 'List of policy sections (e.g. Return window, Non-returnable items, COD Refunds, Exchanges)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnSectionDto)
  @IsOptional()
  sections?: ReturnSectionDto[];

  @ApiPropertyOptional({
    example: 'published',
    enum: ['published', 'draft'],
    description: 'Publish status of the page',
  })
  @IsIn(['published', 'draft'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'Return & Refund Policy | Tanti',
    description: 'SEO title for meta tags',
  })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiPropertyOptional({
    example: 'Learn about our easy 7-day return process, cash on delivery refund terms and doorstep size exchange.',
    description: 'SEO description for meta tags',
  })
  @IsString()
  @IsOptional()
  seoDescription?: string;
}
