import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ReturnSectionDto } from './return-section.dto';

/** Shared DTO for returns / shipping / privacy / terms / cookies policy pages */
export class UpdatePolicyPageDto {
  @ApiPropertyOptional({ example: 'Shipping Policy' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Delivery across Bangladesh' })
  @IsString()
  @IsOptional()
  heading?: string;

  @ApiPropertyOptional({ type: [ReturnSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnSectionDto)
  @IsOptional()
  sections?: ReturnSectionDto[];

  @ApiPropertyOptional({ enum: ['published', 'draft'] })
  @IsIn(['published', 'draft'])
  @IsOptional()
  status?: string;
}
