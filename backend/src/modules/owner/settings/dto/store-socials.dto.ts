import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StoreSocialsDto {
  @ApiPropertyOptional({
    description: 'Facebook page URL',
    example: 'https://facebook.com/tanti',
  })
  @IsString()
  @IsOptional()
  facebook?: string;

  @ApiPropertyOptional({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/tanti',
  })
  @IsString()
  @IsOptional()
  instagram?: string;

  @ApiPropertyOptional({
    description: 'Twitter / X profile URL',
    example: 'https://twitter.com/tanti',
  })
  @IsString()
  @IsOptional()
  twitter?: string;

  @ApiPropertyOptional({
    description: 'YouTube channel URL',
    example: 'https://youtube.com/@tanti',
  })
  @IsString()
  @IsOptional()
  youtube?: string;

  @ApiPropertyOptional({
    description: 'TikTok profile URL',
    example: 'https://tiktok.com/@tanti',
  })
  @IsString()
  @IsOptional()
  tiktok?: string;
}
