import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export enum NotificationType {
  ORDER = 'ORDER',
  INVENTORY = 'INVENTORY',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

export class QueryNotificationDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter only unread notifications' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;
}

export interface SendNotificationOptions {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type?: NotificationType | string;
  link?: string;
  email?: {
    to: string;
    subject: string;
    html: string;
  };
}
