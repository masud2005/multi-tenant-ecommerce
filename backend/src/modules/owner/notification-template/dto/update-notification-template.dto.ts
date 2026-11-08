import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateNotificationTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiPropertyOptional({ description: 'Email subject with {{variables}}' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  subject?: string;

  @ApiPropertyOptional({ description: 'Email body with {{variables}}' })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  body?: string;

  @ApiPropertyOptional({ description: 'In-app bell title' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  inAppTitle?: string;

  @ApiPropertyOptional({ description: 'In-app bell message' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  inAppMessage?: string;
}
