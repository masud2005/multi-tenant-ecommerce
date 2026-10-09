import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import { ReviewStatus, UserRole } from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Helper to resolve active tenant ID
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId && tenantId.length > 10) {
      const exists = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (exists) return exists.id;
    }

    const defaultTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!defaultTenant) {
      throw new NotFoundException('Active store tenant not found');
    }

    return defaultTenant.id;
  }

  // Helper to resolve customer profile ID if user is authenticated
  private async resolveCustomerId(
    userIdOrCustomerId: string | null | undefined,
    tenantId: string,
  ): Promise<string | null> {
    if (!userIdOrCustomerId) return null;

    // Direct CustomerProfile ID match
    const profileById = await this.prisma.customerProfile.findFirst({
      where: {
        id: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (profileById) return profileById.id;

    // Auth User ID match
    const profileByUserId = await this.prisma.customerProfile.findFirst({
      where: {
        userId: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (profileByUserId) return profileByUserId.id;

    // Auto-upsert customer profile if auth user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userIdOrCustomerId },
    });
    if (user) {
      const userEmail = user.email || `${user.id}@customer.store`;
      const profileName = user.name || (user.email ? user.email.split('@')[0] : 'Customer');
      const newProfile = await this.prisma.customerProfile.upsert({
        where: {
          tenantId_email: {
            tenantId,
            email: userEmail,
          },
        },
        update: {
          userId: user.id,
          name: profileName,
        },
        create: {
          tenantId,
          userId: user.id,
          email: userEmail,
          name: profileName,
        },
      });
      return newProfile.id;
    }

    return null;
  }

  // Helper to resolve product record by ID, slug, or title
  private async resolveProduct(productIdOrSlugOrTitle: string, tenantId?: string) {
    if (!productIdOrSlugOrTitle) {
      throw new BadRequestException('Product identifier is required');
    }

    const clean = productIdOrSlugOrTitle.trim();

    // 1. Direct ID, Slug or exact Title match
    let product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { id: clean },
          { slug: clean },
          { slug: clean.toLowerCase() },
          { title: { equals: clean, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
    });

    // 2. Partial match if slug or title has variation
    if (!product) {
      product = await this.prisma.product.findFirst({
        where: {
          OR: [
            { slug: { contains: clean, mode: 'insensitive' } },
            { title: { contains: clean, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });
    }

    if (!product) {
      throw new NotFoundException(`Product "${productIdOrSlugOrTitle}" not found in store catalog`);
    }

    return product;
  }

  // 1. Submit a new customer review (Immediately PUBLISHED & Live on product page)
  async createReview(
    tenantId: string | undefined,
    userId: string | null | undefined,
    userRole: string | undefined,
    dto: CreateReviewDto,
  ) {
    // Prevent Admins, Owners, and Staff from writing customer reviews
    if (
      userRole === UserRole.OWNER ||
      userRole === 'OWNER' ||
      userRole === 'ADMIN' ||
      userRole === 'SUPER_ADMIN' ||
      userRole === 'STAFF'
    ) {
      throw new ForbiddenException(
        'Store administrators and staff cannot submit customer reviews. Customer reviews are meant for shoppers. Admins can view and reply to reviews from the Admin Dashboard.',
      );
    }

    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const resolvedCustomerId = await this.resolveCustomerId(userId, resolvedTenantId);
    const product = await this.resolveProduct(dto.productId, resolvedTenantId);

    // Verify if customer is a verified buyer of this product
    let verifiedBuyer = false;
    if (resolvedCustomerId) {
      const purchaseCount = await this.prisma.orderItem.count({
        where: {
          productId: product.id,
          order: {
            customerId: resolvedCustomerId,
            deletedAt: null,
          },
        },
      });
      verifiedBuyer = purchaseCount > 0;
    }

    const resolvedTitle =
      dto.title?.trim() ||
      (dto.body.trim().length > 40
        ? `${dto.body.trim().slice(0, 37)}...`
        : dto.body.trim() || `${dto.rating} Star Review`);

    // Direct creation with status: PUBLISHED for immediate visibility
    const review = await this.prisma.review.create({
      data: {
        tenantId: product.tenantId || resolvedTenantId,
        productId: product.id,
        customerId: resolvedCustomerId,
        author: dto.author.trim(),
        rating: dto.rating,
        title: resolvedTitle,
        body: dto.body.trim(),
        verified: verifiedBuyer,
        photos: dto.photos && Array.isArray(dto.photos) ? dto.photos : [],
        size: dto.size?.trim() || null,
        status: ReviewStatus.PUBLISHED, // Instant publication without moderation delay
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    this.logger.log(`New review created for product "${product.title}" (${review.id}) - Status: PUBLISHED`);
    return ResponseHelper.created(review, 'Review submitted and published successfully');
  }

  // 2. Fetch all published reviews for a specific product with rating analytics
  async getProductReviews(
    productIdOrSlug: string,
    query: ReviewQueryDto = {},
    tenantId?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const product = await this.resolveProduct(productIdOrSlug, resolvedTenantId);

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    // Sorting order determination
    let orderBy: any = { createdAt: 'desc' };
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (query.sortBy === 'rating_high' || (query.sortBy === 'rating' && sortOrder === 'desc')) {
      orderBy = { rating: 'desc' };
    } else if (query.sortBy === 'rating_low' || (query.sortBy === 'rating' && sortOrder === 'asc')) {
      orderBy = { rating: 'asc' };
    } else if (query.sortBy === 'helpful') {
      orderBy = { helpful: sortOrder };
    } else if (query.sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (query.sortBy === 'recent') {
      orderBy = { createdAt: 'desc' };
    }

    const where: any = {
      productId: product.id,
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      where.rating = query.rating;
    }

    if (query.withPhotosOnly) {
      where.photos = { isEmpty: false };
    }

    // Run parallel queries for reviews list, total count, and star distribution
    const [reviews, totalCount, allProductReviews] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where: {
          productId: product.id,
          status: ReviewStatus.PUBLISHED,
          deletedAt: null,
        },
        select: {
          rating: true,
          photos: true,
        },
      }),
    ]);

    // Compute star distribution breakdown and average rating
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let withPhotosCount = 0;

    allProductReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      totalScore += star;
      if (r.photos && r.photos.length > 0) {
        withPhotosCount++;
      }
    });

    const totalReviews = allProductReviews.length;
    const averageRating = totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 5.0;

    return ResponseHelper.success(
      {
        reviews,
        stats: {
          totalReviews,
          averageRating,
          distribution,
          withPhotosCount,
        },
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Product reviews retrieved successfully',
    );
  }

  // 3. Increment "Helpful" upvote counter for a review
  async markHelpful(id: string, tenantId?: string) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const review = await this.prisma.review.findFirst({
      where: {
        id,
        tenantId: resolvedTenantId,
        status: ReviewStatus.PUBLISHED,
        deletedAt: null,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        helpful: { increment: 1 },
      },
      select: {
        id: true,
        helpful: true,
      },
    });

    return ResponseHelper.success(updated, 'Review marked as helpful');
  }
}
