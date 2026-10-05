import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SyncWishlistDto {
  @ApiProperty({
    description: 'Array of product IDs collected during guest browsing to sync into account',
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  productIds: string[];

  @ApiPropertyOptional({
    description: 'Tenant ID (Store identifier)',
    example: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
