import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateStaffDto {
  @ApiPropertyOptional({ description: 'New dynamic TenantRole ID to assign' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'New role name (e.g. Store Manager, Fulfillment Staff, Customer Care, Content Editor)',
    example: 'Store Manager',
  })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({
    description: 'Member status',
    enum: ['active', 'invited', 'deactivated'],
    example: 'active',
  })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'invited', 'deactivated'], {
    message: 'Status must be one of: active, invited, deactivated',
  })
  status?: string;

  @ApiPropertyOptional({ description: 'Staff full name', example: 'Rahim Ahmed' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Staff phone number', example: '01712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Two-factor authentication enabled flag' })
  @IsOptional()
  @IsBoolean()
  twoFactor?: boolean;
}
