import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({ example: 'silk-kurta-ivory.jpg' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Ivory handloom silk kurta front view' })
  @IsString()
  @IsOptional()
  alt?: string;
}

