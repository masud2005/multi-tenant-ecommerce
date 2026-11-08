import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class RefundOrderDto {
  @ApiProperty({
    example: 1500,
    description: 'Refund amount in BDT (manual bKash/Nagad/COD ledger only)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({
    example: 'Customer request',
    description: 'Reason recorded on the order timeline',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Restore item stock when recording this refund',
  })
  @IsBoolean()
  @IsOptional()
  restock?: boolean;
}
