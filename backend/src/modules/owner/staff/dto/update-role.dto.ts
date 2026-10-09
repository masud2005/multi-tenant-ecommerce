import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Updated role name', example: 'Lead Inventory Manager' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated role description',
    example: 'Oversees inventory stock, purchase orders, and supplier receipts',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated module permission matrix',
    example: {
      dashboard: ['view'],
      orders: ['view', 'update'],
      inventory: ['view', 'create', 'update', 'delete'],
    },
  })
  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;
}
