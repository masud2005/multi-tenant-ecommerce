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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import {
  CreateOwnerReviewDto,
  OwnerReviewQueryDto,
  ReplyReviewDto,
  UpdateOwnerReviewDto,
  UpdateReviewStatusDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../../prisma/generated/client';

@ApiTags('(Owner) Reviews')
@Controller('owner/reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // 1. Fetch all store reviews with filters, search, metrics, and pagination
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all store reviews with ratings, metrics, and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Store reviews retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async getReviews(
    @Query() query: OwnerReviewQueryDto,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.getReviews(query, tenantId);
  }

  // 2. Fetch specific review details by ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get single review details with product and customer',
  })
  @ApiResponse({
    status: 200,
    description: 'Review details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReviewById(
    @Param('id') id: string,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.getReviewById(id, tenantId);
  }

  // 3. Post or update official store reply to customer review
  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add or update public store reply to a customer review',
  })
  @ApiResponse({ status: 200, description: 'Admin reply posted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async replyToReview(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.replyToReview(id, dto, tenantId, user);
  }

  // 4. Create a new review manually (by store admin / owner)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new review manually by store admin' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(
    @Body() dto: CreateOwnerReviewDto,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.createReviewManually(dto, tenantId, user);
  }

  // 5. Update review moderation status (PUBLISHED, HIDDEN, REJECTED, PENDING)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update review moderation status' })
  @ApiResponse({
    status: 200,
    description: 'Review status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReviewStatusDto,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.updateReviewStatus(id, dto, tenantId);
  }

  // 6. Update review details
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update review details' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async updateReview(
    @Param('id') id: string,
    @Body() dto: UpdateOwnerReviewDto,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.updateReview(id, dto, tenantId);
  }

  // 7. Delete review (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async deleteReview(
    @Param('id') id: string,
    @CurrentUser() user?: AuthUser,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.deleteReview(id, tenantId);
  }
}
