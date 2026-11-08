import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class SendMessageDto {
  @ValidateIf((o) => !o.attachments?.length)
  @IsNotEmpty({ message: 'Message text or attachment is required' })
  @IsString()
  @MaxLength(3000, { message: 'Message text cannot exceed 3000 characters' })
  text?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  senderRole?: 'CUSTOMER' | 'OWNER' | 'STAFF';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  attachments?: string[];
}
