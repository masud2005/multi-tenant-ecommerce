import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCartItemDto {
  @ApiPropertyOptional({
    description: 'Updated item quantity (0 or more, 0 removes item)',
    example: 2,
  })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  qty?: number;

  @ApiPropertyOptional({
    description: 'Save item for later toggle',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  savedForLater?: boolean;

  @ApiPropertyOptional({
    description: 'Session token for guest visitors',
    example: 'guest_sess_17909382104',
  })
  @IsString()
  @IsOptional()
  sessionToken?: string;

  @ApiPropertyOptional({
    description: 'Tenant ID',
    example: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
