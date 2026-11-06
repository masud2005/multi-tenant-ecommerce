import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMediaDto {
  @ApiProperty({ example: 'silk-kurta-ivory.jpg' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: '240 KB' })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({ example: '1200×1600' })
  @IsString()
  @IsOptional()
  dimensions?: string;

  @ApiPropertyOptional({ example: 'Ivory handloom silk kurta front view' })
  @IsString()
  @IsOptional()
  alt?: string;
}

