import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Inventory Manager' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Short description of the role responsibilities',
    example: 'Manages warehouse stock movements and purchase inventory',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Granular module permission matrix',
    example: {
      dashboard: ['view'],
      orders: ['view'],
      inventory: ['view', 'create', 'update'],
      products: ['view'],
    },
  })
  @IsNotEmpty()
  @IsObject()
  permissions: Record<string, string[]>;
}
