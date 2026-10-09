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
import { OptionalJwtAuthGuard } from '../../../common/guards/optional-jwt-auth.guard';

@ApiTags('(Customer) Reviews')
@ApiBearerAuth()
@Controller('customer')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // 1. Submit a new customer review (Immediately PUBLISHED & Live)
  @Post('reviews')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Submit a new customer review for a product' })
  @ApiResponse({ status: 201, description: 'Review published successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or missing fields' })
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

  // 2. Fetch all published reviews for a product with statistics and filters
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

  // 3. Mark a review as helpful (increment upvotes)
  @Post('reviews/:id/helpful')
  @HttpCode(HttpStatus.OK)
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
