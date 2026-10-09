import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ReplyTicketDto {
  @ApiProperty({
    description: 'Admin response reply text',
    example: 'Hello! Yes, you can exchange the size within 7 days in Dhaka.',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reply message cannot be empty' })
  @MinLength(2, { message: 'Reply must be at least 2 characters' })
  reply: string;
}
