import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateTicketStatusDto {
  @ApiProperty({
    description: 'Ticket status: open, pending, resolved, closed',
    example: 'resolved',
    enum: ['open', 'pending', 'resolved', 'closed'],
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['open', 'pending', 'resolved', 'closed'], {
    message: 'Status must be one of: open, pending, resolved, closed',
  })
  status: string;
}
