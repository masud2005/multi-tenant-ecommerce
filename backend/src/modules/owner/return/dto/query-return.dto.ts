import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ReturnResolution, ReturnStatus } from '../../../../../prisma/generated/client';

export class QueryReturnDto {
  @ApiPropertyOptional({
    example: 'Awaiting Review',
    description: 'Tab filter: all, open, requested, awaiting_review, in_progress, closed',
  })
  @IsString()
  @IsOptional()
  tab?: string;

  @ApiPropertyOptional({
    enum: ReturnStatus,
    description: 'Filter by specific return status (REQUESTED, APPROVED, REJECTED, IN_TRANSIT, RECEIVED, REFUNDED, EXCHANGED)',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @ApiPropertyOptional({
    enum: ReturnResolution,
    description: 'Filter by resolution preference (REFUND, STORE_CREDIT, EXCHANGE)',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value))
  @IsEnum(ReturnResolution)
  resolution?: ReturnResolution;

  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by customer name, reason, return ID, or order number',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: '2026-10-01',
    description: 'Filter return requests created on or after this date (YYYY-MM-DD or ISO)',
  })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-31',
    description: 'Filter return requests created on or before this date (YYYY-MM-DD or ISO)',
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    default: 1,
    description: 'Page number for pagination',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    default: 50,
    description: 'Number of return requests per page',
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 50;

  @ApiPropertyOptional({
    default: 'createdAt',
    enum: ['createdAt', 'amount', 'status', 'updatedAt'],
    description: 'Field to sort by',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'amount' | 'status' | 'updatedAt' = 'createdAt';

  @ApiPropertyOptional({
    default: 'desc',
    enum: ['asc', 'desc'],
    description: 'Sort direction',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
