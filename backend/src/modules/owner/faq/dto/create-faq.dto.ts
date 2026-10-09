import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({
    example: 'Orders',
    description: 'Category of the FAQ item',
  })
  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @ApiProperty({
    example: 'How can I track my order?',
    description: 'Question text',
  })
  @IsString()
  @IsNotEmpty({ message: 'Question is required' })
  question: string;

  @ApiProperty({
    example: 'Use the Track order page with your order number and phone number, or see live status in My Account -> Orders.',
    description: 'Answer text',
  })
  @IsString()
  @IsNotEmpty({ message: 'Answer is required' })
  answer: string;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order index',
    default: 0,
  })
  @IsInt()
  @IsOptional()
  order?: number;
}
