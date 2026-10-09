import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';

@ApiTags('(Customer) Orders')
@ApiBearerAuth()
@Controller('customer/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Place a new order (requires authenticated customer login)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create and place a new order from checkout (Login required)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Customer login required' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Please log in to place an order');
    }
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.createOrder(tenantId, userId, dto);
  }

  // Retrieve previous order history for the authenticated customer
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order history for authenticated customer' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCustomerOrders(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to view order history');
    }
    const tenantId = tenantHeader || user?.tenantId;
    return this.orderService.getCustomerOrders(userId, tenantId);
  }

  // Retrieve details and tracking timeline of a specific order
  @Get(':orderNumber')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get specific order details by order number' })
  @ApiResponse({ status: 200, description: 'Order details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderByNumber(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    const userId = user?.id || user?.sub;
    return this.orderService.getOrderByNumber(orderNumber, tenantId, userId);
  }
}
