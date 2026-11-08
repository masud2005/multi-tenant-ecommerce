import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteChatAttachmentDto {
  @ApiProperty({
    description: 'Cloudinary public_id or full secure URL of the pending attachment',
  })
  @IsString()
  @IsNotEmpty()
  publicIdOrUrl: string;

  @ApiPropertyOptional({
    enum: ['image', 'raw', 'video'],
    description: 'Cloudinary resource type (defaults from URL / mime)',
  })
  @IsOptional()
  @IsIn(['image', 'raw', 'video'])
  resourceType?: 'image' | 'raw' | 'video';
}
