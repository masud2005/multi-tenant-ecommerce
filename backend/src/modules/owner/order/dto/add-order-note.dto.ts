import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddOrderNoteDto {
  @ApiProperty({
    example: 'Customer requested delivery after 5 PM due to office hours.',
    description: 'Text content of the note',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether this note is internal (staff only) or customer-visible',
  })
  @IsBoolean()
  @IsOptional()
  internal?: boolean = true;
}
