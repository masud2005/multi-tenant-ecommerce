import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Customer tags (e.g., ["wholesale", "frequent-buyer"])',
    type: [String],
    example: ['frequent-buyer'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Store credit amount to grant or set for customer',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  storeCredit?: number;

  @ApiPropertyOptional({
    description: 'Customer full name',
    example: 'Rahim Ahmed',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Customer phone number',
    example: '+8801700000000',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
