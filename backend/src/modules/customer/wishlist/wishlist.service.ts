import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { QueryWishlistDto } from './dto/query-wishlist.dto';
import { SyncWishlistDto } from './dto/sync-wishlist.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to dynamically resolve target tenant
   */
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
      throw new NotFoundException('Tenant not found');
    }
    return defaultTenant.id;
  }

  /**
   * কাস্টমার প্রোফাইল আইডি খুঁজে বের করা বা স্বয়ংক্রিয়ভাবে তৈরি করা
   */
  private async resolveCustomerId(
    userIdOrCustomerId: string,
    tenantId: string,
  ): Promise<string | null> {
    if (!userIdOrCustomerId) return null;

    // ১. সরাসরি CustomerProfile ID দিয়ে খোঁজা
    const profileById = await this.prisma.customerProfile.findFirst({
      where: {
        id: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (profileById) return profileById.id;

    // ২. Auth User ID দিয়ে CustomerProfile খোঁজা
    const profileByUserId = await this.prisma.customerProfile.findFirst({
      where: {
        userId: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (profileByUserId) return profileByUserId.id;

    // ৩. যদি CustomerProfile না থাকে, তবে User টেবিল থেকে তথ্য নিয়ে প্রোফাইল তৈরি করা
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

  /**
   * ইউজারের সেভ করা প্রোডাক্টগুলোর তালিকা নিয়ে আসা (Get User Wishlist Items)
   */
  async getWishlist(
    userIdOrCustomerId: string,
    query?: QueryWishlistDto,
  ) {
    const targetTenantId = await this.resolveTenantId(query?.tenantId);
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 20;
    const skip = (page - 1) * limit;

    const customerId = await this.resolveCustomerId(
      userIdOrCustomerId,
      targetTenantId,
    );

    if (!customerId) {
      return ResponseHelper.paginated(
        [],
        ResponseHelper.buildPaginationMeta(0, page, limit),
        'No wishlist items found',
      );
    }

    // ১. মোট উইশলিস্ট আইটেম গণনা
    const total = await this.prisma.wishlistItem.count({
      where: {
        customerId,
        tenantId: targetTenantId,
      },
    });

    // ২. উইশলিস্ট আইটেম ও প্রোডাক্টের বিস্তারিত তথ্য ফেচ করা
    const items = await this.prisma.wishlistItem.findMany({
      where: {
        customerId,
        tenantId: targetTenantId,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                url: true,
                alt: true,
                isCover: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            brand: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variants: {
              where: { enabled: true },
              select: {
                id: true,
                sku: true,
                color: true,
                colorHex: true,
                size: true,
                price: true,
                salePrice: true,
                stock: true,
                reserved: true,
              },
            },
          },
        },
      },
    });

    // ৩. ফ্রন্টএন্ডের সুবিধার জন্য রেসপন্স ফরম্যাটিং
    const formattedData = items
      .filter((item) => item.product && !item.product.deletedAt)
      .map((item) => {
        const prod = item.product;
        const totalStock = prod.variants.reduce(
          (acc: number, v) => acc + Math.max(0, v.stock - v.reserved),
          0,
        );

        const cover =
          prod.images.find((img) => img.isCover)?.url ||
          prod.images[0]?.url ||
          null;

        return {
          wishlistItemId: item.id,
          savedAt: item.createdAt,
          product: {
            id: prod.id,
            title: prod.title,
            slug: prod.slug,
            shortDescription: prod.shortDescription,
            price: Number(prod.price),
            salePrice: prod.salePrice ? Number(prod.salePrice) : null,
            preorder: prod.preorder,
            isNew: prod.isNew,
            isBestseller: prod.isBestseller,
            rating: Number(prod.rating),
            reviewCount: prod.reviewCount,
            totalStock,
            inStock: prod.preorder || totalStock > 0,
            category: prod.category,
            brand: prod.brand,
            images: prod.images,
            coverImage: cover,
            variantsCount: prod.variants.length,
            availableSizes: Array.from(
              new Set(prod.variants.map((v) => v.size).filter(Boolean)),
            ),
            availableColors: Array.from(
              new Set(prod.variants.map((v) => v.color).filter(Boolean)),
            ),
          },
        };
      });

    const meta = ResponseHelper.buildPaginationMeta(total, page, limit);
    return ResponseHelper.paginated(
      formattedData,
      meta,
      'Wishlist items retrieved successfully',
    );
  }

  /**
   * উইশলিস্টে প্রোডাক্ট যুক্ত বা রিমুভ করা (Toggle Wishlist Item)
   */
  async toggleWishlist(
    userIdOrCustomerId: string,
    dto: AddToWishlistDto,
  ) {
    const targetTenantId = await this.resolveTenantId(dto.tenantId);

    const customerId = await this.resolveCustomerId(
      userIdOrCustomerId,
      targetTenantId,
    );

    if (!customerId) {
      throw new NotFoundException('Customer profile could not be resolved for this user');
    }

    // প্রোডাক্টটি ডাটাবেজে সক্রিয় কি না চেক করা
    const product = await this.prisma.product.findFirst({
      where: {
        id: dto.productId,
        tenantId: targetTenantId,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found or unavailable');
    }

    // পূর্বে উইশলিস্টে আছে কি না চেক
    const existing = await this.prisma.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId: dto.productId,
        },
      },
    });

    if (existing) {
      // থাকলে ডাটাবেজ থেকে রিমুভ (Delete) করা
      await this.prisma.wishlistItem.delete({
        where: { id: existing.id },
      });

      return ResponseHelper.success(
        { wished: false, productId: dto.productId },
        'Removed from wishlist',
      );
    }

    // না থাকলে ডাটাবেজে যুক্ত (Insert) করা
    const created = await this.prisma.wishlistItem.create({
      data: {
        tenantId: targetTenantId,
        customerId,
        productId: dto.productId,
      },
    });

    return ResponseHelper.created(
      { wished: true, productId: dto.productId, wishlistItemId: created.id },
      'Added to wishlist',
    );
  }

  /**
   * উইশলিস্ট থেকে নির্দিষ্ট আইটেম মুছে ফেলা (Remove Item)
   */
  async removeFromWishlist(
    userIdOrCustomerId: string,
    productId: string,
    tenantId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const customerId = await this.resolveCustomerId(
      userIdOrCustomerId,
      targetTenantId,
    );

    if (!customerId) {
      throw new NotFoundException('Customer profile not found');
    }

    await this.prisma.wishlistItem.deleteMany({
      where: {
        customerId,
        productId,
        tenantId: targetTenantId,
      },
    });

    return ResponseHelper.noContent('Item removed from wishlist');
  }

  /**
   * গেস্ট উইশলিস্ট প্রোডাক্টগুলো লগইন করা কাস্টমারের সাথে সিঙ্ক ও মার্জ করা (Sync Guest Wishlist)
   */
  async syncWishlist(
    userIdOrCustomerId: string,
    dto: SyncWishlistDto,
  ) {
    const targetTenantId = await this.resolveTenantId(dto.tenantId);

    const customerId = await this.resolveCustomerId(
      userIdOrCustomerId,
      targetTenantId,
    );

    if (!customerId) {
      throw new NotFoundException('Customer profile not found for this user');
    }

    const requestedIds = Array.isArray(dto.productIds)
      ? Array.from(new Set(dto.productIds.filter(Boolean)))
      : [];

    if (requestedIds.length > 0) {
      // ১. আগে থেকেই কাস্টমারের ডাটাবেজে কোন কোন প্রোডাক্ট আছে তা দেখা
      const existingItems = await this.prisma.wishlistItem.findMany({
        where: {
          customerId,
          tenantId: targetTenantId,
        },
        select: { productId: true },
      });
      const existingProductIds = new Set(existingItems.map((i) => i.productId));

      // ২. শুধুমাত্র যে প্রোডাক্টগুলো এখনো ডাটাবেজে নেই, সেগুলো ফিল্টার করা
      const newProductIds = requestedIds.filter((id) => !existingProductIds.has(id));

      // ৩. প্রোডাক্টগুলো ডাটাবেজে সক্রিয় কি না চেক করা
      if (newProductIds.length > 0) {
        const validProducts = await this.prisma.product.findMany({
          where: {
            id: { in: newProductIds },
            tenantId: targetTenantId,
            deletedAt: null,
          },
          select: { id: true },
        });

        const validProductIds = validProducts.map((p) => p.id);

        if (validProductIds.length > 0) {
          await this.prisma.wishlistItem.createMany({
            data: validProductIds.map((productId) => ({
              tenantId: targetTenantId,
              customerId,
              productId,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    // ৪. সম্পূর্ণ মার্জ হওয়া উইশলিস্ট রিটার্ন করা
    return this.getWishlist(userIdOrCustomerId, {
      tenantId: targetTenantId,
      limit: 100,
    });
  }
}
