import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCustomerStatusDto {
  @ApiPropertyOptional({
    description: 'Active status of the customer (true = Active, false = Inactive / Ban)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
