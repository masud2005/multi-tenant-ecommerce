import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class MilestoneDto {
  @ApiProperty({
    example: '2019',
    description: 'Year or milestone time label',
  })
  @IsString()
  @IsNotEmpty({ message: 'Year is required' })
  year: string;

  @ApiProperty({
    example: 'Started with 40 block-printed kurtas made with three families in Tangail.',
    description: 'Description of the milestone',
  })
  @IsString()
  @IsNotEmpty({ message: 'Milestone text is required' })
  text: string;
}
