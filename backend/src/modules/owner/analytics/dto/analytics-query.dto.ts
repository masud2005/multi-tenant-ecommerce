import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Date range filter: Today, 7 days, 30 days, 90 days, or all',
    default: '30 days',
  })
  @IsOptional()
  @IsString()
  range?: string;
}
