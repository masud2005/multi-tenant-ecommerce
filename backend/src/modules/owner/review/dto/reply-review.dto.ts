import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReplyReviewDto {
  @ApiProperty({
    description: 'Admin public response / thank you reply to the review',
    example: 'Thank you for your valuable feedback! We are thrilled that you loved the handloom craftsmanship.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reply text cannot be empty' })
  @MaxLength(1000, { message: 'Reply cannot exceed 1000 characters' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  reply: string;
}
