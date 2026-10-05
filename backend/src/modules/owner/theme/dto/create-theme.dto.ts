import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateThemeDto {
  @ApiProperty({ example: 'My Custom Summer Theme', description: 'Name of the theme' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'b0e01fd7-1b03-4c91-9a72-73a7281f6214', required: false, description: 'Base preset ID to clone settings from' })
  @IsString()
  @IsOptional()
  presetId?: string;

  @ApiProperty({ example: '#B5562F', required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ example: '#2E3A67', required: false })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({ example: '#5C6B4E', required: false })
  @IsString()
  @IsOptional()
  accentColor?: string;

  @ApiProperty({ example: '#F7F4EF', required: false })
  @IsString()
  @IsOptional()
  canvasColor?: string;

  @ApiProperty({ example: '#FFFFFF', required: false })
  @IsString()
  @IsOptional()
  surfaceColor?: string;

  @ApiProperty({ example: '#1C1A17', required: false })
  @IsString()
  @IsOptional()
  inkColor?: string;

  @ApiProperty({ example: 'Fraunces', required: false })
  @IsString()
  @IsOptional()
  fontHeading?: string;

  @ApiProperty({ example: 'Inter', required: false })
  @IsString()
  @IsOptional()
  fontBody?: string;

  @ApiProperty({ example: '0.5rem', required: false })
  @IsString()
  @IsOptional()
  borderRadius?: string;

  @ApiProperty({ example: 'portrait-hover', required: false })
  @IsString()
  @IsOptional()
  cardStyle?: string;

  @ApiProperty({ example: '/* custom overrides */', required: false })
  @IsString()
  @IsOptional()
  customCss?: string;
}
