import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReturnStatus } from '../../../../../prisma/generated/client';

export class UpdateReturnStatusDto {
  @ApiProperty({
    enum: ReturnStatus,
    example: ReturnStatus.APPROVED,
    description:
      'Updated return status (REQUESTED, APPROVED, REJECTED, IN_TRANSIT, RECEIVED, REFUNDED, EXCHANGED)',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '_') : value,
  )
  @IsEnum(ReturnStatus)
  status: ReturnStatus;

  @ApiPropertyOptional({
    example: 'Item inspected: quality checked and approved for replacement.',
    description: 'Inspection notes by owner / staff',
  })
  @IsString()
  @IsOptional()
  inspectionNote?: string;

  @ApiPropertyOptional({
    example: 'Customer contacted via phone and agreed on exchange item.',
    description: 'Optional note for timeline audit entry',
  })
  @IsString()
  @IsOptional()
  note?: string;
}
