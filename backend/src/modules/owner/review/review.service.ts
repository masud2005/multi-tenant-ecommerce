import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateOwnerReviewDto,
  OwnerReviewQueryDto,
  ReplyReviewDto,
  UpdateOwnerReviewDto,
  UpdateReviewStatusDto,
} from './dto';
import { ReviewStatus } from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Helper to resolve active tenant context
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
      throw new NotFoundException('Store tenant context not found');
    }

    return defaultTenant.id;
  }

  // 1. Fetch all store reviews with multi-search, filters, pagination, and analytics
  async getReviews(query: OwnerReviewQueryDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const where: any = {
      tenantId: targetTenantId,
      deletedAt: null,
    };

    // Rating star filter
    if (query.rating && query.rating >= 1 && query.rating <= 5) {
      where.rating = query.rating;
    }

    // Product specific filter
    if (query.productId) {
      where.productId = query.productId;
    }

    // Reply status filter
    if (typeof query.hasReply === 'boolean') {
      if (query.hasReply) {
        where.reply = { not: null };
      } else {
        where.reply = null;
      }
    }

    // Photos only filter
    if (query.withPhotosOnly) {
      where.photos = { isEmpty: false };
    }

    // Search query across customer author, title, body, and product title
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { author: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
        { body: { contains: s, mode: 'insensitive' } },
        { product: { title: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder };

    // Parallel execution for review list, total count, and overview stats
    const [reviews, total, allStoreReviews] = await Promise.all([
      this.prisma.review.findMany({
        where,
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
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where: { tenantId: targetTenantId, deletedAt: null },
        select: {
          rating: true,
          reply: true,
          photos: true,
        },
      }),
    ]);

    // Compute aggregate store metrics
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;
    let repliedCount = 0;
    let withPhotosCount = 0;

    allStoreReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      totalScore += star;
      if (r.reply && r.reply.trim().length > 0) {
        repliedCount++;
      }
      if (r.photos && r.photos.length > 0) {
        withPhotosCount++;
      }
    });

    const totalStoreReviews = allStoreReviews.length;
    const averageRating =
      totalStoreReviews > 0 ? Number((totalScore / totalStoreReviews).toFixed(1)) : 5.0;

    return ResponseHelper.success(
      {
        reviews,
        stats: {
          totalReviews: totalStoreReviews,
          averageRating,
          distribution,
          repliedCount,
          pendingReplyCount: Math.max(0, totalStoreReviews - repliedCount),
          withPhotosCount,
        },
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Store reviews retrieved successfully',
    );
  }

  // 2. Retrieve detailed single review
  async getReviewById(id: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const review = await this.prisma.review.findFirst({
      where: {
        id,
        tenantId: targetTenantId,
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
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    return ResponseHelper.success(review, 'Review details retrieved successfully');
  }

  // 3. Add or update official store admin reply to a review
  async replyToReview(
    id: string,
    dto: ReplyReviewDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.review.findFirst({
      where: {
        id,
        tenantId: targetTenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id: existing.id },
      data: {
        reply: dto.reply.trim(),
        updatedAt: new Date(),
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

    const adminName = adminUser?.name || adminUser?.email || 'Admin';
    this.logger.log(`Admin [${adminName}] replied to review "${id}" for product "${updated.product?.title}"`);

    return ResponseHelper.success(updated, 'Admin reply posted successfully');
  }

  // 4. Create review manually by Owner / Admin
  async createReviewManually(
    dto: CreateOwnerReviewDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    // If productId is not provided, find the first product in tenant or fallback
    let targetProductId = dto.productId;
    if (!targetProductId) {
      const firstProduct = await this.prisma.product.findFirst({
        where: { tenantId: targetTenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (firstProduct) {
        targetProductId = firstProduct.id;
      } else {
        throw new BadRequestException('A product must exist in the catalog to attach a review');
      }
    } else {
      const productExists = await this.prisma.product.findFirst({
        where: { id: targetProductId, tenantId: targetTenantId, deletedAt: null },
      });
      if (!productExists) {
        throw new NotFoundException(`Product with ID "${targetProductId}" not found`);
      }
    }

    const review = await this.prisma.review.create({
      data: {
        tenantId: targetTenantId,
        productId: targetProductId,
        author: dto.author.trim(),
        rating: dto.rating,
        title: dto.title?.trim() || 'Verified Customer Review',
        body: dto.body.trim(),
        verified: dto.verified !== undefined ? dto.verified : true,
        size: dto.size?.trim() || null,
        status: dto.status || ReviewStatus.PUBLISHED,
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

    const adminName = adminUser?.name || adminUser?.email || 'Admin';
    this.logger.log(`Admin [${adminName}] created review "${review.id}" for product "${review.product?.title}"`);
    return ResponseHelper.success(review, 'Review created successfully');
  }

  // 5. Update review status (PUBLISHED, HIDDEN, REJECTED, PENDING)
  async updateReviewStatus(
    id: string,
    dto: UpdateReviewStatusDto,
    tenantId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.review.findFirst({
      where: { id, tenantId: targetTenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    const normalizedStatus = (
      dto.status ? (dto.status as string).toUpperCase() : 'PUBLISHED'
    ) as ReviewStatus;

    const updated = await this.prisma.review.update({
      where: { id: existing.id },
      data: {
        status: normalizedStatus,
        updatedAt: new Date(),
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

    return ResponseHelper.success(updated, `Review status updated to ${dto.status}`);
  }

  // 6. Update review details
  async updateReview(
    id: string,
    dto: UpdateOwnerReviewDto,
    tenantId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.review.findFirst({
      where: { id, tenantId: targetTenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    const data: any = {
      updatedAt: new Date(),
    };

    if (dto.author !== undefined) data.author = dto.author.trim();
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.body !== undefined) data.body = dto.body.trim();
    if (dto.verified !== undefined) data.verified = dto.verified;
    if (dto.size !== undefined) data.size = dto.size.trim();
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.productId) {
      const productExists = await this.prisma.product.findFirst({
        where: { id: dto.productId, tenantId: targetTenantId, deletedAt: null },
      });
      if (!productExists) {
        throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
      }
      data.productId = dto.productId;
    }

    const updated = await this.prisma.review.update({
      where: { id: existing.id },
      data,
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

    return ResponseHelper.success(updated, 'Review updated successfully');
  }

  // 7. Delete review (soft delete)
  async deleteReview(id: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.review.findFirst({
      where: { id, tenantId: targetTenantId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Review with id "${id}" not found`);
    }

    await this.prisma.review.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
      },
    });

    return ResponseHelper.success({ id }, 'Review deleted successfully');
  }
}
