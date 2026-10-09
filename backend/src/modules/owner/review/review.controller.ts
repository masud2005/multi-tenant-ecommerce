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
import { OwnerReviewQueryDto, ReplyReviewDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
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
  @ApiOperation({ summary: 'List all store reviews with ratings, metrics, and filtering' })
  @ApiResponse({ status: 200, description: 'Store reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Owner role required' })
  async getReviews(
    @Query() query: OwnerReviewQueryDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.getReviews(query, tenantId);
  }

  // 2. Fetch specific review details by ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single review details with product and customer' })
  @ApiResponse({ status: 200, description: 'Review details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReviewById(
    @Param('id') id: string,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.getReviewById(id, tenantId);
  }

  // 3. Post or update official store reply to customer review
  @Post(':id/reply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add or update public store reply to a customer review' })
  @ApiResponse({ status: 200, description: 'Admin reply posted successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async replyToReview(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentUser() user?: any,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    const tenantId = tenantHeader || user?.tenantId;
    return this.reviewService.replyToReview(id, dto, tenantId, user);
  }
}
