import { Prisma } from '../../../../prisma/generated/client';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { CreateReviewDto, ReviewQueryDto } from './dto';
import {
  OrderStatus,
  ReviewStatus,
  UserRole,
} from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { syncProductReviewAggregates } from '../../../common/helpers/product-review-stats.helper';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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

  private async resolveCustomerId(
    userIdOrCustomerId: string | null | undefined,
    tenantId: string,
  ): Promise<string | null> {
    if (!userIdOrCustomerId) return null;

    const profileById = await this.prisma.customerProfile.findFirst({
      where: {
        id: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (profileById) return profileById.id;

    const profileByUserId = await this.prisma.customerProfile.findFirst({
      where: {
        userId: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (profileByUserId) return profileByUserId.id;

    const user = await this.prisma.user.findUnique({
      where: { id: userIdOrCustomerId },
    });
    if (user) {
      const userEmail = user.email || `${user.id}@customer.store`;
      const profileName =
        user.name || (user.email ? user.email.split('@')[0] : 'Customer');
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

  private async resolveProduct(
    productIdOrSlugOrTitle: string,
    tenantId: string,
  ) {
    if (!productIdOrSlugOrTitle) {
      throw new BadRequestException('Product identifier is required');
    }

    const clean = productIdOrSlugOrTitle.trim();
    const tenantFilter = { tenantId, deletedAt: null };

    let product = await this.prisma.product.findFirst({
      where: {
        ...tenantFilter,
        OR: [
          { id: clean },
          { slug: clean },
          { slug: clean.toLowerCase() },
          { title: { equals: clean, mode: 'insensitive' } },
        ],
      },
    });

    if (!product) {
      product = await this.prisma.product.findFirst({
        where: {
          ...tenantFilter,
          OR: [
            { slug: { contains: clean, mode: 'insensitive' } },
            { title: { contains: clean, mode: 'insensitive' } },
          ],
        },
      });
    }

    if (!product) {
      throw new NotFoundException(
        `Product "${productIdOrSlugOrTitle}" not found in store catalog`,
      );
    }

    return product;
  }

  private async hasDeliveredPurchase(
    customerId: string,
    productId: string,
    orderId?: string,
  ): Promise<boolean> {
    const orderWhere: Prisma.OrderWhereInput = {
      customerId,
      deletedAt: null,
      status: OrderStatus.DELIVERED,
    };

    if (orderId?.trim()) {
      const ref = orderId.trim();
      orderWhere.OR = [{ id: ref }, { number: ref }];
    }

    const count = await this.prisma.orderItem.count({
      where: {
        productId,
        order: orderWhere,
      },
    });
    return count > 0;
  }

  async createReview(
    tenantId: string | undefined,
    userId: string | null | undefined,
    userRole: string | undefined,
    dto: CreateReviewDto,
  ) {
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

    if (!userId) {
      throw new UnauthorizedException('Please sign in to submit a review');
    }

    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const resolvedCustomerId = await this.resolveCustomerId(
      userId,
      resolvedTenantId,
    );

    if (!resolvedCustomerId) {
      throw new UnauthorizedException(
        'Customer profile not found. Please sign in again and try.',
      );
    }

    const product = await this.resolveProduct(dto.productId, resolvedTenantId);

    const existing = await this.prisma.review.findFirst({
      where: {
        tenantId: resolvedTenantId,
        productId: product.id,
        customerId: resolvedCustomerId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'You have already reviewed this product. You can only submit one review per product.',
      );
    }

    const verifiedBuyer = await this.hasDeliveredPurchase(
      resolvedCustomerId,
      product.id,
      dto.orderId,
    );

    if (dto.orderId?.trim() && !verifiedBuyer) {
      throw new BadRequestException(
        'The provided order does not include a delivered purchase of this product.',
      );
    }

    // Customer form only collects review body — no separate title field
    const trimmedBody = dto.body.trim();
    const trimmedTitle = dto.title?.trim() || '';
    const resolvedTitle =
      trimmedTitle && trimmedTitle.toLowerCase() !== trimmedBody.toLowerCase()
        ? trimmedTitle
        : '';

    const review = await this.prisma.review.create({
      data: {
        tenantId: product.tenantId || resolvedTenantId,
        productId: product.id,
        customerId: resolvedCustomerId,
        author: dto.author.trim(),
        rating: dto.rating,
        title: resolvedTitle,
        body: trimmedBody,
        verified: verifiedBuyer,
        photos: dto.photos && Array.isArray(dto.photos) ? dto.photos : [],
        size: dto.size?.trim() || null,
        status: ReviewStatus.PUBLISHED,
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

    await syncProductReviewAggregates(this.prisma, product.id);

    this.logger.log(
      `New review created for product "${product.title}" (${review.id}) - Status: PUBLISHED`,
    );

    void (async () => {
      try {
        const staffWithUsers = await this.prisma.tenantMember.findMany({
          where: {
            tenantId: product.tenantId || resolvedTenantId,
            deletedAt: null,
            status: 'active',
          },
          include: { user: true },
        });
        for (const member of staffWithUsers) {
          if (!member.userId) continue;
          await this.notificationService.sendFromTemplate({
            tenantId: product.tenantId || resolvedTenantId,
            key: 'NEW_REVIEW',
            userId: member.userId,
            emailTo: member.user?.email,
            type: 'SYSTEM',
            link: `/admin/reviews`,
            vars: {
              customer_name: dto.author.trim(),
              product_title: product.title,
              review_rating: String(dto.rating),
              review_text: trimmedBody.slice(0, 120),
            },
          });
        }
      } catch (err) {
        this.logger.error('Failed to dispatch review notification', err);
      }
    })();

    return ResponseHelper.created(
      review,
      'Review submitted and published successfully',
    );
  }

  async getMyReviews(
    tenantId: string | undefined,
    userId: string | null | undefined,
  ) {
    if (!userId) {
      throw new UnauthorizedException('Please sign in to view your reviews');
    }

    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const resolvedCustomerId = await this.resolveCustomerId(
      userId,
      resolvedTenantId,
    );

    if (!resolvedCustomerId) {
      return ResponseHelper.success(
        { reviews: [], reviewableProducts: [] },
        'No customer reviews found',
      );
    }

    const [reviews, deliveredItems] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          tenantId: resolvedTenantId,
          customerId: resolvedCustomerId,
          deletedAt: null,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
              price: true,
              salePrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.orderItem.findMany({
        where: {
          productId: { not: null },
          order: {
            tenantId: resolvedTenantId,
            customerId: resolvedCustomerId,
            deletedAt: null,
            status: OrderStatus.DELIVERED,
          },
          product: {
            deletedAt: null,
          },
        },
        select: {
          productId: true,
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
              price: true,
              salePrice: true,
            },
          },
        },
      }),
    ]);

    const reviewedProductIds = new Set(reviews.map((r) => r.productId));
    const reviewableMap = new Map<
      string,
      NonNullable<(typeof deliveredItems)[number]['product']>
    >();

    for (const item of deliveredItems) {
      if (!item.productId || !item.product) continue;
      if (reviewedProductIds.has(item.productId)) continue;
      if (!reviewableMap.has(item.productId)) {
        reviewableMap.set(item.productId, item.product);
      }
    }

    return ResponseHelper.success(
      {
        reviews,
        reviewableProducts: Array.from(reviewableMap.values()),
      },
      'Customer reviews retrieved successfully',
    );
  }

  async getProductReviews(
    productIdOrSlug: string,
    query: ReviewQueryDto = {},
    tenantId?: string,
    userId?: string | null,
  ) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const product = await this.resolveProduct(
      productIdOrSlug,
      resolvedTenantId,
    );

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: 'desc' };
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (
      query.sortBy === 'rating_high' ||
      (query.sortBy === 'rating' && sortOrder === 'desc')
    ) {
      orderBy = { rating: 'desc' };
    } else if (
      query.sortBy === 'rating_low' ||
      (query.sortBy === 'rating' && sortOrder === 'asc')
    ) {
      orderBy = { rating: 'asc' };
    } else if (query.sortBy === 'helpful') {
      orderBy = { helpful: sortOrder };
    } else if (query.sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (query.sortBy === 'recent') {
      orderBy = { createdAt: 'desc' };
    }

    const where: Prisma.ReviewWhereInput = {
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

    const distribution: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
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
    const averageRating =
      totalReviews > 0 ? Number((totalScore / totalReviews).toFixed(1)) : 0;

    let votedReviewIds = new Set<string>();
    if (userId && reviews.length > 0) {
      const votes = await this.prisma.reviewHelpfulVote.findMany({
        where: {
          userId,
          reviewId: { in: reviews.map((r) => r.id) },
        },
        select: { reviewId: true },
      });
      votedReviewIds = new Set(votes.map((v) => v.reviewId));
    }

    return ResponseHelper.success(
      {
        reviews: reviews.map((r) => ({
          ...r,
          helpfulVotedByMe: votedReviewIds.has(r.id),
        })),
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

  async toggleHelpful(
    id: string,
    tenantId: string | undefined,
    userId: string | null | undefined,
  ) {
    if (!userId) {
      throw new UnauthorizedException(
        'Please sign in to mark a review as helpful',
      );
    }

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

    const existing = await this.prisma.reviewHelpfulVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId: review.id,
          userId,
        },
      },
    });

    if (existing) {
      const nextHelpful = Math.max(0, review.helpful - 1);
      await this.prisma.$transaction([
        this.prisma.reviewHelpfulVote.delete({ where: { id: existing.id } }),
        this.prisma.review.update({
          where: { id: review.id },
          data: { helpful: nextHelpful },
        }),
      ]);

      return ResponseHelper.success(
        {
          id: review.id,
          helpful: nextHelpful,
          helpfulVotedByMe: false,
        },
        'Helpful vote removed',
      );
    }

    await this.prisma.$transaction([
      this.prisma.reviewHelpfulVote.create({
        data: {
          reviewId: review.id,
          userId,
        },
      }),
      this.prisma.review.update({
        where: { id: review.id },
        data: { helpful: { increment: 1 } },
      }),
    ]);

    const updated = await this.prisma.review.findUnique({
      where: { id: review.id },
      select: { id: true, helpful: true },
    });

    return ResponseHelper.success(
      {
        id: updated!.id,
        helpful: updated!.helpful,
        helpfulVotedByMe: true,
      },
      'Review marked as helpful',
    );
  }

  async getStoreReviews(
    query: { page?: number; limit?: number; rating?: number } = {},
    tenantId?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const page = query.page && Number(query.page) > 0 ? Number(query.page) : 1;
    const limit =
      query.limit && Number(query.limit) > 0 ? Number(query.limit) : 15;
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      tenantId: resolvedTenantId,
      status: ReviewStatus.PUBLISHED,
      deletedAt: null,
    };

    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      where.rating = Number(query.rating);
    }

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
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
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return ResponseHelper.success(
      {
        reviews,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
      'Store reviews retrieved successfully',
    );
  }
}
