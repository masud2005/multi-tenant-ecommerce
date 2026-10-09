import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({
    description: 'Address label category (e.g. Home, Office, Parents home)',
    example: 'Home',
    default: 'Home',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : 'Home'))
  label?: string = 'Home';

  @ApiProperty({
    description: 'Full name of the package recipient',
    example: 'Nusrat Jahan',
  })
  @IsString()
  @IsNotEmpty({ message: 'Recipient name is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: '11-digit Bangladeshi mobile number for courier rider communication',
    example: '01712-345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'Recipient mobile number is required' })
  @Matches(/^01[3-9]\d{2}-?\d{6}$|^01[3-9]\d{8}$/, {
    message: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712-345678 or 01712345678)',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @ApiProperty({
    description: 'Detailed street address (House number, road number, block, flat/apartment)',
    example: 'House 42, Road 9/A, Block C',
  })
  @IsString()
  @IsNotEmpty({ message: 'Street address details (House/Road/Area) are required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  line1: string;

  @ApiProperty({
    description: 'District name in Bangladesh',
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty({ message: 'District is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  district: string;

  @ApiProperty({
    description: 'Thana or sub-area name within the district',
    example: 'Dhanmondi',
  })
  @IsString()
  @IsNotEmpty({ message: 'Thana or area is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  area: string;

  @ApiPropertyOptional({
    description: 'Set this address as primary/default shipping address',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefaultShipping?: boolean = false;

  @ApiPropertyOptional({
    description: 'Set this address as primary/default billing address',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefaultBilling?: boolean = false;

  @ApiPropertyOptional({
    description: 'Store tenant ID (resolved automatically if omitted)',
    example: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
