import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class LogSearchDto {
  @ApiProperty({ description: 'Search term or keywords' })
  @IsString()
  @IsNotEmpty()
  term: string;

  @ApiPropertyOptional({ description: 'Number of product results found', default: 0 })
  @IsNumber()
  @IsOptional()
  results?: number;
}
