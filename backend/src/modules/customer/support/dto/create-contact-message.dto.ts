import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'Karim Ahmed',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiPropertyOptional({
    description: 'Customer contact email address (optional)',
    example: 'karim@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Customer contact phone number or WhatsApp',
    example: '01712345678',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Inquiry topic or subject',
    example: 'Order enquiry',
  })
  @IsString()
  @IsNotEmpty({ message: 'Topic is required' })
  topic: string;

  @ApiPropertyOptional({
    description: 'Related order number if applicable',
    example: 'TN-10492',
  })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiProperty({
    description: 'Inquiry message content',
    example: 'Hello, I want to know if size exchange is available for this product?',
  })
  @IsString()
  @MinLength(5, { message: 'Message must be at least 5 characters long' })
  message: string;
}
