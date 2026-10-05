import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateSectionDto {
  @ApiProperty({ example: 'Summer Linen Spotlight', required: false })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @ApiProperty({ example: { subtitle: 'New Arrivals' }, required: false })
  @IsOptional()
  settings?: Record<string, any>;
}
