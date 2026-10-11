import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class InviteStaffDto {
  @ApiProperty({ description: 'Staff email address', example: 'staff@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Staff full name', example: 'Rahim Ahmed' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Staff phone number', example: '01712345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Dynamic TenantRole ID to assign' })
  @IsOptional()
  @IsString()
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Role name if roleId is not known (e.g., Store Manager, Fulfillment Staff)',
    example: 'Store Manager',
  })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({
    description: 'Initial password for the staff user',
    example: 'SecureStaffPass123!',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
