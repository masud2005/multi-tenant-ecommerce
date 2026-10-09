import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../../../../prisma/generated/client';

// Delivery shipping address details
export class OrderAddressDto {
  @ApiProperty({
    description: 'Recipient full name',
    example: 'Sumona Yeasmin',
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
  @Matches(/^01[3-9]\d{2}-?\d{6}$|^01[3-9]\d{8}$/, {
    message: 'Please enter a valid 11-digit Bangladeshi mobile number',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone: string;

  @ApiProperty({
    description: 'Detailed street / delivery address',
    example: 'House 42, Road 9/A, Block C',
  })
  @IsString()
  @IsNotEmpty({ message: 'Delivery address details are required' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  line1: string;

  @ApiProperty({
    description: 'Thana or upazila name',
    example: 'Dhanmondi',
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

// Ordered item details
export class OrderItemDto {
  @ApiPropertyOptional({
    description: 'Product ID in catalog',
    example: 'prod-123',
  })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Variant ID of the product',
    example: 'var-456',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({
    description: 'Product title at time of order',
    example: 'Handloom Jamdani Cotton Kurta',
  })
  @IsString()
  @IsNotEmpty({ message: 'Item title is required' })
  title: string;

  @ApiPropertyOptional({
    description: 'Image URL of the item',
    example: 'https://images.unsplash.com/...',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description: 'Variant color name',
    example: 'Natural Ivory',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    description: 'Variant size name',
    example: 'M',
  })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({
    description: 'SKU code of the item',
    example: 'KURTA-IVR-M',
  })
  @IsString()
  @IsNotEmpty({ message: 'SKU is required' })
  sku: string;

  @ApiProperty({
    description: 'Unit price of the item in BDT',
    example: 3800,
  })
  @IsNumber()
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 1,
  })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  qty: number;
}

// Main create order payload
export class CreateOrderDto {
  // Shipping delivery address (required)
  @ApiProperty({
    description: 'Delivery shipping address details',
    type: OrderAddressDto,
  })
  @ValidateNested()
  @Type(() => OrderAddressDto)
  shippingAddress: OrderAddressDto;

  // List of cart items (required)
  @ApiProperty({
    description: 'List of ordered items',
    type: [OrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Customer identity (optional: fallback to shippingAddress if omitted)
  @ApiPropertyOptional({
    description: 'Customer name (optional: defaults to shippingAddress.name)',
    example: 'Sumona Yeasmin',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Customer email address for invoice and updates',
    example: 'customer@example.com',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
  email?: string;

  @ApiPropertyOptional({
    description: 'Customer contact phone (optional: defaults to shippingAddress.phone)',
    example: '01712345678',
  })
  @IsString()
  @IsOptional()
  @Matches(/^01[3-9]\d{2}-?\d{6}$|^01[3-9]\d{8}$/, {
    message: 'Please enter a valid 11-digit Bangladeshi mobile number',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  // Shipping and pricing financials
  @ApiProperty({
    description: 'Selected shipping method name',
    example: 'Home delivery',
  })
  @IsString()
  @IsNotEmpty({ message: 'Shipping method is required' })
  shippingMethod: string;

  @ApiProperty({
    description: 'Shipping delivery fee in BDT',
    example: 150,
  })
  @IsNumber()
  @Min(0)
  shippingCost: number;

  @ApiProperty({
    description: 'Cart subtotal before shipping and discount in BDT',
    example: 3800,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({
    description: 'Discount amount deducted from subtotal',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discount?: number = 0;

  @ApiProperty({
    description: 'Grand total payable amount in BDT',
    example: 3950,
  })
  @IsNumber()
  @Min(0)
  total: number;

  // Payment method and status
  @ApiProperty({
    description: 'Selected payment method',
    enum: PaymentMethod,
    example: PaymentMethod.COD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Initial payment status (e.g. PENDING or PAID)',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus = PaymentStatus.PENDING;

  @ApiPropertyOptional({
    description: 'Coupon code applied to this order',
    example: 'EID500',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : undefined))
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Optional customer delivery notes',
    example: 'Please call before arrival',
  })
  @IsString()
  @IsOptional()
  customerNote?: string;
}
