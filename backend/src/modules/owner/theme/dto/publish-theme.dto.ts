import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class PublishThemeDto {
  @ApiProperty({ example: 'Published Eid 2026 Collection', required: false, description: 'Optional audit note or release label' })
  @IsString()
  @IsOptional()
  label?: string;
}
