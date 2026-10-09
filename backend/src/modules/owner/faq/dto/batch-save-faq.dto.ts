import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateFaqDto } from './create-faq.dto';

export class BatchSaveFaqDto {
  @ApiPropertyOptional({
    example: 'Help & FAQ',
    description: 'Title of the FAQ page',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    type: [CreateFaqDto],
    description: 'List of FAQ items to save',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFaqDto)
  items: CreateFaqDto[];
}
