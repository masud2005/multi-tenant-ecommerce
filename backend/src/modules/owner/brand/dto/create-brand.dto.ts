import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Brand logo image file to upload',
  })
  @IsOptional()
  logo?: any;

  @ApiProperty({
    example: true,
    required: false,
    default: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
