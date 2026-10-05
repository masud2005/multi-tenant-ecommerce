import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddToWishlistDto {
  @ApiProperty({
    description: 'Product ID to add or toggle in wishlist',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsString()
  @IsNotEmpty({ message: 'Product ID is required' })
  productId: string;

  @ApiPropertyOptional({
    description: 'Tenant ID (Store identifier)',
    example: 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
