import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({ example: 'HERO_BANNER', description: 'Section component type identifier' })
  @IsString()
  @IsNotEmpty()
  sectionType: string;

  @ApiProperty({ example: 'Main Hero Banner', description: 'Readable label for admin UI' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({ example: { title: 'Eid Edit 2026', ctaText: 'Shop Now' }, required: false })
  @IsOptional()
  settings?: Record<string, any>;
}
