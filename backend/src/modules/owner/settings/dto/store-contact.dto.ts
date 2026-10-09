import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class StoreContactDto {
  @ApiPropertyOptional({
    description: 'Public customer support email address',
    example: 'care@tanti.com.bd',
  })
  @IsEmail({}, { message: 'Invalid support email format' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Customer service hotline or phone number',
    example: '09612-826842',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    description: 'WhatsApp number for customer inquiries',
    example: '+8801712345678',
  })
  @IsString()
  @IsOptional()
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Physical flagship store / office address (road, area, city, postal code)',
    example: 'House 14, Road 27 (old), Dhanmondi, Dhaka 1209',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Store business and operating hours',
    example: 'Sat–Thu, 10 AM – 9 PM',
  })
  @IsString()
  @IsOptional()
  workingHours?: string;

  @ApiPropertyOptional({
    description: 'Average support response time description',
    example: 'Replies within 2 to 4 working hours',
  })
  @IsString()
  @IsOptional()
  responseTime?: string;

  @ApiPropertyOptional({
    description: 'Support team or customer care department name',
    example: 'Tanti Care team',
  })
  @IsString()
  @IsOptional()
  supportTeam?: string;
}
