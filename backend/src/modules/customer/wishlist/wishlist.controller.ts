import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
import { SyncWishlistDto } from './dto/sync-wishlist.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('(Customer) Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user saved wishlist items with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Wishlist items retrieved successfully',
  })
  async getWishlist(
    @Query() query: QueryWishlistDto,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to view wishlist');
    }
    const tenantId = user?.tenantId || query?.tenantId;
    return this.wishlistService.getWishlist(userId, { ...query, tenantId });
  }

  @Post('toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Toggle product in wishlist (Add if not exists, remove if exists)',
  })
  @ApiResponse({
    status: 200,
    description: 'Product toggled in wishlist successfully',
  })
  async toggleWishlist(
    @Body() dto: AddToWishlistDto,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to manage wishlist');
    }
    const tenantId = user?.tenantId || dto?.tenantId;
    return this.wishlistService.toggleWishlist(userId, { ...dto, tenantId });
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sync and merge guest wishlist items into user database wishlist upon login',
  })
  @ApiResponse({
    status: 200,
    description: 'Guest wishlist items synchronized successfully',
  })
  async syncWishlist(
    @Body() dto: SyncWishlistDto,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to sync wishlist');
    }
    const tenantId = user?.tenantId || dto?.tenantId;
    return this.wishlistService.syncWishlist(userId, { ...dto, tenantId });
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove product from current user wishlist',
  })
  @ApiResponse({
    status: 200,
    description: 'Product removed from wishlist successfully',
  })
  async removeFromWishlist(
    @Param('productId') productId: string,
    @Query('tenantId') queryTenantId?: string,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Authentication required to update wishlist');
    }
    const tenantId = user?.tenantId || queryTenantId;
    return this.wishlistService.removeFromWishlist(userId, productId, tenantId);
  }
}
