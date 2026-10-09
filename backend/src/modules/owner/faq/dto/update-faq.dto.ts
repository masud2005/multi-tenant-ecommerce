import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateFaqDto {
  @ApiPropertyOptional({
    example: 'Orders',
    description: 'Category of the FAQ item',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 'How can I track my order?',
    description: 'Question text',
  })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiPropertyOptional({
    example: 'Use the Track order page with your order number and phone number.',
    description: 'Answer text',
  })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order index',
  })
  @IsInt()
  @IsOptional()
  order?: number;
}
