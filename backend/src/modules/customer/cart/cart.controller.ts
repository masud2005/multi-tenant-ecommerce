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
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { QueryCartDto } from './dto/query-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('(Customer) Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get shopping cart for authenticated customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  async getCart(
    @Query() query: QueryCartDto,
    @Headers('x-session-token') sessionHeader?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Please log in to view your cart');
    }
    return this.cartService.getCart(
      query,
      userId,
      sessionHeader,
    );
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add product variant to cart and persist in database',
  })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully',
  })
  async addToCart(
    @Body() dto: AddToCartDto,
    @Headers('x-session-token') sessionHeader?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Please log in to add items to your cart');
    }
    return this.cartService.addToCart(
      dto,
      userId,
      sessionHeader,
    );
  }

  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update cart item quantity or savedForLater state',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
  })
  async updateCartItem(
    @Param('id') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-session-token') sessionHeader?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Please log in to update your cart');
    }
    return this.cartService.updateCartItemQuantity(
      itemId,
      dto,
      userId,
      sessionHeader,
    );
  }

  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove item from shopping cart',
  })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  async removeFromCart(
    @Param('id') itemId: string,
    @Headers('x-session-token') sessionHeader?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Please log in to update your cart');
    }
    return this.cartService.removeFromCart(
      itemId,
      userId,
      sessionHeader,
    );
  }
}
