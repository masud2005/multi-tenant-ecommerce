import {
  Body,
  Controller,
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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import {
  OrderQueryDto,
  UpdateOrderStatusDto,
  AddOrderNoteDto,
  CreateDraftOrderDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Orders')
@Controller('owner/orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Get all store orders with search, filters, pagination, and status counters
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all store orders with metrics and filtering' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Staff role required' })
  async getOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.getOrders(query, tenantId);
  }

  // Create manual or draft order for phone, showroom, or wholesale customers
  @Post('drafts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create manual/draft order for phone, showroom, or wholesale' })
  @ApiResponse({ status: 201, description: 'Draft order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or item list empty' })
  async createDraftOrder(
    @Body() dto: CreateDraftOrderDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.createDraftOrder(dto, tenantId, user);
  }

  // List all draft and manual orders
  @Get('drafts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all draft and manual orders' })
  @ApiResponse({ status: 200, description: 'Draft orders retrieved successfully' })
  async getDraftOrders(
    @Query() query: OrderQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.getDraftOrders(query, tenantId);
  }

  // Get full details of a specific order by ID or order number
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single order details by id or order number' })
  @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.getOrderById(id, tenantId);
  }

  // Update order status, courier provider, and tracking number
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update order status, fulfillment, and courier tracking' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.updateOrderStatus(id, dto, tenantId, user);
  }

  // Add an internal or customer-visible note to the order
  @Post(':id/notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a note to the order' })
  @ApiResponse({ status: 201, description: 'Order note created successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async addOrderNote(
    @Param('id') id: string,
    @Body() dto: AddOrderNoteDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.addOrderNote(id, dto, tenantId, user);
  }
}
