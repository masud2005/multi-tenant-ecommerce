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
  @ValidateIf(
    (input: { attachments?: unknown[] }) =>
      !Array.isArray(input.attachments) || input.attachments.length === 0,
  )
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
