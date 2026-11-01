import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ReturnSectionDto } from './return-section.dto';

export class UpdateReturnsPageDto {
  @ApiPropertyOptional({
    example: 'Return Policy',
    description: 'Header/title of the Return page',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Easy 7-day returns & doorstep exchange',
    description: 'Main display heading of the Return page',
  })
  @IsString()
  @IsOptional()
  heading?: string;

  @ApiPropertyOptional({
    type: [ReturnSectionDto],
    description: 'List of return policy sections (e.g. Return window, Non-returnable items, Exchanges)',
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
}

