import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StockMovementReason } from '../../../../../prisma/generated/client';

export enum StockAdjustmentType {
  ADD = 'ADD',             // স্টক যোগ করা (e.g. +10)
  SUBTRACT = 'SUBTRACT',   // স্টক কমানো (e.g. -5)
  SET = 'SET',             // নির্দিষ্ট স্টক সংখ্যা সেট করা (e.g. exact 50)
}

export class AdjustStockDto {
  @ApiProperty({
    description: 'Product variant ID to adjust stock for',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    enum: StockAdjustmentType,
    description: 'Adjustment action type: ADD, SUBTRACT, or SET',
    example: StockAdjustmentType.ADD,
  })
  @IsEnum(StockAdjustmentType)
  @IsNotEmpty()
  type: StockAdjustmentType;

  @ApiProperty({
    description: 'Quantity to add, subtract, or set (positive integer)',
    example: 10,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    enum: StockMovementReason,
    description: 'Reason for stock change',
    example: 'RECEIVED',
  })
  @IsEnum(StockMovementReason)
  @IsNotEmpty()
  reason: StockMovementReason;

  @ApiPropertyOptional({
    description: 'Reference invoice, PO, or order number (optional)',
    example: 'PO-2026-001',
  })
  @IsString()
  @IsOptional()
  ref?: string;

  @ApiPropertyOptional({
    description: 'Detailed note or remarks about the stock change (optional)',
    example: 'Received new batch from supplier',
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    description: 'Tenant ID (store identifier, optional)',
    example: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
