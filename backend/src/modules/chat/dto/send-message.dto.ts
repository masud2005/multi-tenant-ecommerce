import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty({ message: 'Message text is required' })
  @IsString()
  @MaxLength(3000, { message: 'Message text cannot exceed 3000 characters' })
  text: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  senderRole?: 'CUSTOMER' | 'OWNER' | 'STAFF';
}
