import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateThemeDto {
  @ApiProperty({ example: 'My Custom Theme Updated', required: false })
  @IsString()
  @IsOptional()
  name?: string;

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

  @ApiProperty({ example: '/* custom css */', required: false })
  @IsString()
  @IsOptional()
  customCss?: string;
}
