import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../../../../prisma/generated/client';

// Draft order shipping address
export class DraftOrderAddressDto {
  @ApiProperty({
    description: 'Recipient full name',
    example: 'Ayesha Siddiqua',
  })
  @IsString()
  @IsNotEmpty({ message: 'Recipient name is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @ApiProperty({
    description: '11-digit Bangladeshi mobile number',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'Recipient mobile number is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '').trim() : value))
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/, {
    message: 'Please enter a valid 11-digit Bangladeshi mobile number',
  })
  phone: string;

  @ApiProperty({
    description: 'Detailed street / delivery address',
    example: 'House 12, Road 4, Sector 7',
  })
  @IsString()
  @IsNotEmpty({ message: 'Delivery address details are required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  line1: string;

  @ApiProperty({
    description: 'Thana or area name',
    example: 'Uttara',
  })
  @IsString()
  @IsNotEmpty({ message: 'Thana / area is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  area: string;

  @ApiProperty({
    description: 'District name in Bangladesh',
    example: 'Dhaka',
  })
  @IsString()
  @IsNotEmpty({ message: 'District is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  district: string;
}

// Single item in draft order
export class DraftOrderItemDto {
  @ApiPropertyOptional({
    description: 'Product UUID in catalog',
    example: 'prod-uuid-123',
  })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Variant UUID of the selected product',
    example: 'var-uuid-456',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({
    description: 'Product title at time of draft creation',
    example: 'Handloom Jamdani Cotton Kurta',
  })
  @IsString()
  @IsNotEmpty({ message: 'Item title is required' })
  title: string;

  @ApiPropertyOptional({
    description: 'Item image URL',
    example: 'https://images.unsplash.com/...',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description: 'Selected color variant',
    example: 'Natural Ivory',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Selected size variant',
    example: 'M',
  })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiPropertyOptional({
    description: 'Stock keeping unit (SKU)',
    example: 'TN-JAM-IVO-M',
  })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiProperty({
    description: 'Unit price or negotiated wholesale price in BDT',
    example: 3800,
  })
  @IsNumber({}, { message: 'Unit price must be a valid number' })
  @Min(0, { message: 'Unit price cannot be negative' })
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Quantity of items to order',
    example: 2,
  })
  @IsInt({ message: 'Quantity must be an integer' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Type(() => Number)
  qty: number;
}

// Create draft / manual order payload
export class CreateDraftOrderDto {
  @ApiPropertyOptional({
    description: 'Optional registered customer ID',
    example: 'cust-uuid-123',
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Ayesha Siddiqua',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer name is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  customerName: string;

  @ApiPropertyOptional({
    description: 'Optional customer email address for invoice / notifications',
    example: 'ayesha.siddiqua@example.com',
  })
  @ValidateIf((o) => typeof o.email === 'string' && o.email.trim().length > 0)
  @IsEmail({}, { message: 'Please provide a valid customer email' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim().length > 0 ? value.trim().toLowerCase() : undefined,
  )
  email?: string;

  @ApiProperty({
    description: 'Customer contact phone number',
    example: '01712345678',
  })
  @IsString()
  @IsNotEmpty({ message: 'Customer phone number is required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '').trim() : value))
  @Matches(/^(?:\+8801|8801|01)[3-9]\d{8}$/, {
    message: 'Please enter a valid 11-digit Bangladeshi mobile number',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Delivery shipping address',
    type: DraftOrderAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DraftOrderAddressDto)
  shippingAddress?: DraftOrderAddressDto;

  @ApiProperty({
    description: 'List of ordered items in the draft',
    type: [DraftOrderItemDto],
  })
  @IsArray({ message: 'Items must be a list' })
  @ValidateNested({ each: true })
  @Type(() => DraftOrderItemDto)
  items: DraftOrderItemDto[];

  @ApiPropertyOptional({
    description: 'Shipping / delivery charge in BDT',
    example: 70,
    default: 0,
  })
  @IsNumber({}, { message: 'Shipping charge must be a valid number' })
  @Min(0, { message: 'Shipping fee cannot be negative' })
  @IsOptional()
  @Type(() => Number)
  shippingFee?: number;

  @ApiPropertyOptional({
    description: 'Custom discount or wholesale concession amount in BDT',
    example: 500,
    default: 0,
  })
  @IsNumber({}, { message: 'Discount must be a valid number' })
  @Min(0, { message: 'Discount cannot be negative' })
  @IsOptional()
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Applied coupon code or promo tag',
    example: 'WHOLESALE10',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Chosen payment method',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  @IsEnum(PaymentMethod, { message: 'Invalid payment method' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? (value.toUpperCase() as PaymentMethod) : value))
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Draft action mode: "invoice" to send payment link, "paid" to mark immediately as completed paid order, "draft" to keep open',
    example: 'invoice',
    enum: ['invoice', 'paid', 'draft'],
    default: 'invoice',
  })
  @IsString()
  @IsOptional()
  mode?: 'invoice' | 'paid' | 'draft';

  @ApiPropertyOptional({
    description: 'Note provided by customer',
    example: 'Please call before delivery',
  })
  @IsString()
  @IsOptional()
  customerNote?: string;

  @ApiPropertyOptional({
    description: 'Internal note for staff / warehouse',
    example: 'Showroom cash collection / Special wholesale order',
  })
  @IsString()
  @IsOptional()
  staffNote?: string;
}
