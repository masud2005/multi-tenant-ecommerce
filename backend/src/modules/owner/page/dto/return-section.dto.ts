import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReturnSectionDto {
  @ApiProperty({
    example: 'Return window',
    description: 'Heading or title of the policy section',
  })
  @IsString()
  @IsNotEmpty()
  heading: string;

  @ApiProperty({
    example: 'You may request a return within 7 days of delivery.',
    description: 'Detailed description or terms of the policy section',
  })
  @IsString()
  @IsNotEmpty()
  body: string;
}
