import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product with images, variants, and collection associations
   */
  async create(dto: CreateProductDto, tenantId?: string) {
    const targetTenantId =
      dto.tenantId || tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    // 2. Validate & resolve Category (supports UUID or slug)
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: dto.categoryId }, { slug: dto.categoryId }],
        tenantId: targetTenantId,
        deletedAt: null,
      },
    });
    if (!category) {
      throw new NotFoundException('Category');
    }

    // 3. Validate & resolve Subcategory if provided
    let resolvedSubcategoryId: string | undefined = undefined;
    if (dto.subcategoryId) {
      const subcategory = await this.prisma.category.findFirst({
        where: {
          OR: [{ id: dto.subcategoryId }, { slug: dto.subcategoryId }],
          tenantId: targetTenantId,
          deletedAt: null,
        },
      });

      if (!subcategory) {
        throw new NotFoundException('Subcategory');
      }
      resolvedSubcategoryId = subcategory.id;
    }

    // 4. Validate & resolve Brand if provided
    let resolvedBrandId: string | undefined = undefined;
    if (dto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: {
          OR: [{ id: dto.brandId }, { slug: dto.brandId }],
          tenantId: targetTenantId,
          deletedAt: null,
        },
      });

      if (!brand) {
        throw new NotFoundException('Brand');
      }
      resolvedBrandId = brand.id;
    }

    // 5. Generate and validate unique slug
    const slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.title);

    const existingProduct = await this.prisma.product.findUnique({
      where: {
        tenantId_slug: {
          tenantId: targetTenantId,
          slug,
        },
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `Product with slug '${slug}' already exists in this store.`,
      );
    }

    // 6. Validate Collection IDs if provided
    let validCollectionIds: string[] = [];
    if (dto.collectionIds && dto.collectionIds.length > 0) {
      const collections = await this.prisma.collection.findMany({
        where: {
          OR: [
            { id: { in: dto.collectionIds } },
            { slug: { in: dto.collectionIds } },
          ],
          tenantId: targetTenantId,
          deletedAt: null,
        },
        select: { id: true },
      });
      validCollectionIds = collections.map((c) => c.id);
    }

    // 7. Validate and Prepare Nested Variants
    const variantsData = [];
    if (dto.variants && dto.variants.length > 0) {
      const seenVariantCombos = new Set<string>();

      for (let idx = 0; idx < dto.variants.length; idx++) {
        const v = dto.variants[idx];
        const color = v.color.trim();
        const size = v.size.trim();
        const comboKey = `${color.toLowerCase()}__${size.toLowerCase()}`;

        if (seenVariantCombos.has(comboKey)) {
          throw new ConflictException(
            `Duplicate variant detected: Color '${color}' with Size '${size}'.`,
          );
        }
        seenVariantCombos.add(comboKey);

        const variantSku =
          v.sku?.trim() ||
          `${slug}-${this.generateSlug(color || 'std')}-${this.generateSlug(size || 'free')}-${idx + 1}`;

        variantsData.push({
          sku: variantSku,
          color,
          colorHex: v.colorHex?.trim() || undefined,
          size,
          price: v.price ?? dto.price,
          salePrice: v.salePrice !== undefined ? v.salePrice : dto.salePrice,
          stock: v.stock ?? 0,
          enabled: v.enabled ?? true,
          barcode: v.barcode?.trim() || undefined,
        });
      }
    } else {
      // Default single variant fallback for simple products
      variantsData.push({
        sku: `${slug}-std-free`,
        color: 'Standard',
        colorHex: '#000000',
        size: 'Free Size',
        price: dto.price,
        salePrice: dto.salePrice,
        stock: 10,
        enabled: true,
      });
    }

    // 8. Prepare Nested Images
    const imagesData =
      dto.images && dto.images.length > 0
        ? dto.images.map((img, idx) => ({
            url: img.url.trim(),
            alt: img.alt?.trim() || dto.title,
            isCover: img.isCover ?? idx === 0,
            order: img.order ?? idx,
          }))
        : [];

    // 9. Create Product with all relations in database
    const product = await this.prisma.product.create({
      data: {
        tenantId: targetTenantId,
        title: dto.title.trim(),
        slug,
        shortDescription: dto.shortDescription?.trim() || undefined,
        description: dto.description?.trim() || undefined,
        status: (dto.status as any) || 'DRAFT',
        price: dto.price,
        salePrice: dto.salePrice !== undefined ? dto.salePrice : undefined,
        cost: dto.cost ?? 0,
        weightGrams: dto.weightGrams ?? 0,
        preorder: dto.preorder ?? false,
        isNew: dto.isNew ?? false,
        isBestseller: dto.isBestseller ?? false,
        tags: dto.tags || [],
        specs: dto.specs || undefined,
        seoTitle: dto.seoTitle?.trim() || undefined,
        seoDescription: dto.seoDescription?.trim() || undefined,
        categoryId: category.id,
        subcategoryId: resolvedSubcategoryId,
        brandId: resolvedBrandId,

        // Nested Images
        images:
          imagesData.length > 0
            ? {
                create: imagesData,
              }
            : undefined,

        // Nested Variants
        variants: {
          create: variantsData,
        },

        // Nested Collections
        collections:
          validCollectionIds.length > 0
            ? {
                create: validCollectionIds.map((colId, index) => ({
                  collectionId: colId,
                  position: index,
                })),
              }
            : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategory: {
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
            logo: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        variants: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            variants: true,
            images: true,
            reviews: true,
          },
        },
      },
    });

    return ResponseHelper.created(product, 'Product created successfully');
  }

  /**
   * Get all products with filters, search, and pagination
   */
  async findAll(query?: QueryProductDto, tenantId?: string) {
    const targetTenantId =
      query?.tenantId || tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const where: any = {
      tenantId: targetTenantId,
      deletedAt: null,
    };

    // Filter by Status
    if (query?.status) {
      where.status = query.status;
    }

    // Filter by Category (UUID or Slug)
    if (query?.category && query.category !== 'all') {
      where.category = {
        OR: [{ id: query.category }, { slug: query.category }],
      };
    }

    // Filter by Subcategory (UUID or Slug)
    if (query?.subcategory && query.subcategory !== 'all') {
      where.subcategory = {
        OR: [{ id: query.subcategory }, { slug: query.subcategory }],
      };
    }

    // Filter by Brand (UUID or Slug)
    if (query?.brand && query.brand !== 'all') {
      where.brand = {
        OR: [{ id: query.brand }, { slug: query.brand }],
      };
    }

    // Filter by Collection (UUID or Slug)
    if (query?.collection && query.collection !== 'all') {
      where.collections = {
        some: {
          collection: {
            OR: [{ id: query.collection }, { slug: query.collection }],
          },
        },
      };
    }

    // Filter by Flags
    if (query?.isBestseller !== undefined) {
      where.isBestseller = query.isBestseller;
    }
    if (query?.isNew !== undefined) {
      where.isNew = query.isNew;
    }

    // Filter by Price Range
    if (query?.minPrice !== undefined || query?.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    // Search Filter (Title, ShortDescription, Slug, Tags)
    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'price', 'title', 'sold', 'rating'];
    const sortBy = allowedSortFields.includes(query?.sortBy || '')
      ? query!.sortBy!
      : 'createdAt';
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategory: {
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
            logo: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        variants: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            variants: true,
            images: true,
            reviews: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return ResponseHelper.success(
      products,
      'Products retrieved successfully',
    );
  }

  /**
   * Get single product details by ID or Slug
   */
  async findOne(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subcategory: {
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
            logo: true,
          },
        },
        images: {
          orderBy: { order: 'asc' },
        },
        variants: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        collections: {
          include: {
            collection: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            variants: true,
            images: true,
            reviews: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product');
    }

    return ResponseHelper.success(product, 'Product details retrieved successfully');
  }

  /**
   * Helper to format text into URL-friendly slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
