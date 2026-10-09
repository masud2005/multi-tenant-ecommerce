import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogClickDto {
  @ApiProperty({ description: 'Search term or keyword that led to the product click' })
  @IsString()
  @IsNotEmpty()
  term: string;
}
