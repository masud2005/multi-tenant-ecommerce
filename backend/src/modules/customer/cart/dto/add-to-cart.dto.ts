import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product variant ID to add to cart',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({
    description: 'Parent Product ID',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantity to add (minimum 1)',
    default: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsNotEmpty()
  qty: number = 1;

  @ApiPropertyOptional({
    description: 'Session token for guest visitors (if not logged in)',
    example: 'guest_sess_17909382104',
  })
  @IsString()
  @IsOptional()
  sessionToken?: string;

  @ApiPropertyOptional({
    description: 'Tenant ID (Store identifier)',
    example: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
