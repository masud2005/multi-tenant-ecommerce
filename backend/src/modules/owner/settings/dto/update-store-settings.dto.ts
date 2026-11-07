import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StoreContactDto } from './store-contact.dto';
import { StoreSocialsDto } from './store-socials.dto';

export class UpdateStoreSettingsDto {
  @ApiPropertyOptional({
    description: 'Store public brand name',
    example: 'Tanti Fashion',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Store tagline or slogan',
    example: 'Handloom & Contemporary Bangladeshi Fashion',
  })
  @IsString()
  @IsOptional()
  tagline?: string;

  @ApiPropertyOptional({
    description: 'Store logo image URL (empty string clears the logo)',
    example: 'https://res.cloudinary.com/demo/image/upload/store-logo.png',
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Store favicon image URL (empty string clears the favicon)',
    example: 'https://res.cloudinary.com/demo/image/upload/favicon.png',
  })
  @IsString()
  @IsOptional()
  favicon?: string;

  @ApiPropertyOptional({
    description: 'Default store currency code',
    example: 'BDT',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Default store currency symbol',
    example: '৳',
  })
  @IsString()
  @IsOptional()
  currencySymbol?: string;

  @ApiPropertyOptional({
    description: 'Currency symbol display position',
    enum: ['prefix', 'suffix'],
    example: 'prefix',
  })
  @IsIn(['prefix', 'suffix'])
  @IsOptional()
  currencyPosition?: 'prefix' | 'suffix';

  @ApiPropertyOptional({
    description: 'Public contact details (email, phone, whatsapp, address, hours, response time)',
    type: () => StoreContactDto,
  })
  @ValidateNested()
  @Type(() => StoreContactDto)
  @IsOptional()
  contact?: StoreContactDto;

  @ApiPropertyOptional({
    description: 'Public social media links (facebook, instagram, twitter, etc.)',
    type: () => StoreSocialsDto,
  })
  @ValidateNested()
  @Type(() => StoreSocialsDto)
  @IsOptional()
  socials?: StoreSocialsDto;

  @ApiPropertyOptional({
    description: 'Store-wide general configuration flags and settings',
    example: {
      guestCheckout: true,
      phoneOtp: true,
      vatRate: 7.5,
      binNumber: '004512876-0101',
      vatIncluded: true,
      maintenance: false,
      returnWindowDays: 7,
      orderNumberFormat: 'TN-{number}',
    },
  })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Store-wide announcement banner text',
    example: 'Use EID500 for ৳500 off orders over ৳3,000.',
  })
  @IsString()
  @IsOptional()
  announcement?: string;

  @ApiPropertyOptional({
    description: 'Whether the announcement banner is currently displayed',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  announcementEnabled?: boolean;
}
