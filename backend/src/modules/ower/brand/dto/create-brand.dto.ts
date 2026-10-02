import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({
    example: 'Tanti Studio',
    description: 'The name of the brand',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'tanti-studio',
    required: false,
    description: 'Custom slug for the brand (auto-generated if not provided)',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: 'Our in-house label for modern everyday Bangladeshi wear.',
    required: false,
    description: 'Description of the brand',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com/logos/tanti-studio.png',
    required: false,
    description: 'Brand logo image URL',
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 'uuid-of-tenant',
    required: false,
    description: 'Tenant ID (can be extracted from authenticated user)',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
