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
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { QueryCartDto } from './dto/query-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('(Customer) Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get or initialize shopping cart for customer or guest visitor',
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
    return this.cartService.getCart(
      query,
      user?.id || user?.sub,
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
    return this.cartService.addToCart(
      dto,
      user?.id || user?.sub,
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
    return this.cartService.updateCartItemQuantity(
      itemId,
      dto,
      user?.id || user?.sub,
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
    return this.cartService.removeFromCart(
      itemId,
      user?.id || user?.sub,
      sessionHeader,
    );
  }
}
