import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
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
import { ReviewService } from './review.service';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';

@ApiTags('(Customer) Reviews')
@ApiBearerAuth()
@Controller('customer')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a new customer review for a product' })
  @ApiResponse({ status: 201, description: 'Review published successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or missing fields' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 409, description: 'Customer already reviewed this product' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async createReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    const userId = user?.id || user?.sub;
    const userRole = user?.role;
    return this.reviewService.createReview(tenantId, userId, userRole, dto);
  }

  @Get('reviews/me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get my reviews and delivered products awaiting review',
  })
  @ApiResponse({ status: 200, description: 'Customer reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async getMyReviews(
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    const userId = user?.id || user?.sub;
    return this.reviewService.getMyReviews(tenantId, userId);
  }

  @Get('reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get published reviews for store testimonials' })
  @ApiResponse({ status: 200, description: 'Store reviews retrieved successfully' })
  async getStoreReviews(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('rating') rating?: number,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.getStoreReviews({ page, limit, rating }, tenantId);
  }

  @Get('products/:productId/reviews')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all reviews and rating distribution for a product' })
  @ApiResponse({ status: 200, description: 'Product reviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: ReviewQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.getProductReviews(productId, query, tenantId);
  }

  @Post('reviews/:id/helpful')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Mark a review as helpful' })
  @ApiResponse({ status: 200, description: 'Review marked as helpful' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async markHelpful(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.markHelpful(id, tenantId);
  }
}
