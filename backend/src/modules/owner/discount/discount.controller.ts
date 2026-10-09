import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DiscountService } from './discount.service';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ApplyDiscountDto,
  DiscountQueryDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Discounts')
@Controller('owner/discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new discount or coupon campaign' })
  @ApiResponse({ status: 201, description: 'Discount created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error in request payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 409, description: 'Discount code already exists for this store' })
  async create(
    @Body() dto: CreateDiscountDto,
    @CurrentUser() user?: any,
  ) {
    return this.discountService.create(dto, user?.tenantId);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all discounts for store with pagination, search, and status filters' })
  @ApiResponse({ status: 200, description: 'Discounts list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async findAll(
    @Query() query: DiscountQueryDto,
    @CurrentUser() user?: any,
  ) {
    return this.discountService.findAll(query, user?.tenantId);
  }

  @Get(':idOrCode')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single discount details and redemption history by ID or Code' })
  @ApiResponse({ status: 200, description: 'Discount details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async findOne(
    @Param('idOrCode') idOrCode: string,
    @CurrentUser() user?: any,
  ) {
    return this.discountService.findOne(idOrCode, user?.tenantId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing discount campaign by ID' })
  @ApiResponse({ status: 200, description: 'Discount updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation error in request payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @ApiResponse({ status: 409, description: 'Updated discount code conflicts with an existing code' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @CurrentUser() user?: any,
  ) {
    return this.discountService.update(id, dto, user?.tenantId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a discount campaign by ID (Soft delete)' })
  @ApiResponse({ status: 200, description: 'Discount deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return this.discountService.remove(id, user?.tenantId);
  }
}

@ApiTags('(Storefront) Discounts')
@Controller('discounts')
export class StorefrontDiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post('apply')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply and calculate coupon discount for cart / checkout' })
  @ApiHeader({
    name: 'x-tenant-id',
    required: false,
    description: 'Target store tenant ID (optional if fallback or authenticated user tenant exists)',
  })
  @ApiResponse({ status: 200, description: 'Discount applied and calculated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid, expired, limit-reached, or subtotal too low' })
  async applyDiscount(
    @Body() dto: ApplyDiscountDto,
    @Headers('x-tenant-id') tenantHeader?: string,
    @CurrentUser() user?: any,
  ) {
    const tenantId = user?.tenantId || tenantHeader;
    const userId = user?.id || user?.sub;
    return this.discountService.applyDiscount(dto, userId, tenantId);
  }
}
