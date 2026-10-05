import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SectionOrderItemDto {
  @ApiProperty({ example: '8665ba18-e374-4b5b-80a5-f483c6ea62a6' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 0 })
  @IsInt()
  orderIndex: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;
}

export class ReorderSectionsDto {
  @ApiProperty({ type: [SectionOrderItemDto], description: 'List of sections with updated orderIndex and visibility' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItemDto)
  sections: SectionOrderItemDto[];
}
