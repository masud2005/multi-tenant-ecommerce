import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryCartDto {
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
