import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StatItemDto {
  @ApiProperty({
    example: '1,200+',
    description: 'Numeric or highlighted statistic value',
  })
  @IsString()
  @IsNotEmpty({ message: 'Stat value is required' })
  value: string;

  @ApiProperty({
    example: 'artisans we work with directly',
    description: 'Label describing the statistic',
  })
  @IsString()
  @IsNotEmpty({ message: 'Stat label is required' })
  label: string;
}
