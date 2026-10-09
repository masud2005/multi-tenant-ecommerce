import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AcceptStaffInviteDto {
  @ApiProperty({
    description: 'Invitation token received via email',
    example: 'a1b2c3d4e5f6...',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password for the staff account',
    example: 'Password@123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    description: 'Staff member full name',
    example: 'Farzana Yasmin',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
