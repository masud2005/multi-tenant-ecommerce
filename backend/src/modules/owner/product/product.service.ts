import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Create a new product with images, variants, collection associations, and rollback on failure
  async create(dto: CreateProductDto, files?: Express.Multer.File[], tenantId?: string) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      resolvedTenantId = activeTenant?.id;
    }

    if (!resolvedTenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    // 1. Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resolvedTenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    // 2. Validate and resolve Category
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: dto.categoryId }, { slug: dto.categoryId }],
        tenantId: resolvedTenantId,
        deletedAt: null,
      },
    });
    if (!category) {
      throw new NotFoundException('Category');
    }

    // 3. Validate and resolve Subcategory if provided
    let resolvedSubcategoryId: string | undefined = undefined;
    if (dto.subcategoryId) {
      const subcategory = await this.prisma.category.findFirst({
        where: {
          OR: [{ id: dto.subcategoryId }, { slug: dto.subcategoryId }],
          tenantId: resolvedTenantId,
          deletedAt: null,
        },
      });

      if (!subcategory) {
        throw new NotFoundException('Subcategory');
      }
      resolvedSubcategoryId = subcategory.id;
    }

    // 4. Validate and resolve Brand if provided
    let resolvedBrandId: string | undefined = undefined;
    if (dto.brandId) {
      const brand = await this.prisma.brand.findFirst({
        where: {
          OR: [{ id: dto.brandId }, { slug: dto.brandId }],
          tenantId: resolvedTenantId,
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
          tenantId: resolvedTenantId,
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
          tenantId: resolvedTenantId,
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

    // 8. Upload files to Cloudinary storage if provided
    const uploadedImageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadResults = await this.storageService.uploadFiles(files, {
        folder: 'products',
      });
      uploadedImageUrls.push(...uploadResults.map((r) => r.url));
    }

    // Combine explicit DTO images and uploaded image files
    const explicitImages: { url: string; alt?: string; isCover?: boolean; order?: number }[] = [];
    if (Array.isArray(dto.images)) {
      dto.images.forEach((img: any, idx: number) => {
        if (typeof img === 'string' && img.trim().length > 0) {
          explicitImages.push({
            url: img.trim(),
            alt: dto.title,
            isCover: idx === 0,
            order: idx,
          });
        } else if (img && typeof img === 'object' && img.url) {
          explicitImages.push({
            url: String(img.url).trim(),
            alt: img.alt?.trim() || dto.title,
            isCover: img.isCover ?? idx === 0,
            order: img.order ?? idx,
          });
        }
      });
    }

    const uploadedImagesData = uploadedImageUrls.map((url, idx) => ({
      url,
      alt: dto.title,
      isCover: explicitImages.length === 0 && idx === 0,
      order: explicitImages.length + idx,
    }));

    const allImagesData = [...explicitImages, ...uploadedImagesData];

    // 9. Create Product in database with transaction rollback for Cloudinary storage
    try {
      const product = await this.prisma.product.create({
        data: {
          tenantId: resolvedTenantId,
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

          images:
            allImagesData.length > 0
              ? {
                  create: allImagesData,
                }
              : undefined,

          variants: {
            create: variantsData,
          },

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
    } catch (error) {
      // Rollback uploaded files from storage if database creation fails
      if (uploadedImageUrls.length > 0) {
        await this.storageService.deleteFiles(uploadedImageUrls).catch(() => {});
      }
      throw error;
    }
  }

  // Update an existing product with image upload, rollback, and cleanup
  async update(
    idOrSlug: string,
    dto: UpdateProductDto,
    files?: Express.Multer.File[],
    tenantId?: string,
  ) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      resolvedTenantId = activeTenant?.id;
    }

    if (!resolvedTenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    // 1. Find existing product
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId: resolvedTenantId,
        deletedAt: null,
      },
      include: {
        images: true,
        variants: { where: { deletedAt: null } },
        collections: true,
      },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product');
    }

    // 2. Validate category if updating
    let resolvedCategoryId = existingProduct.categoryId;
    if (dto.categoryId) {
      const cat = await this.prisma.category.findFirst({
        where: {
          OR: [{ id: dto.categoryId }, { slug: dto.categoryId }],
          tenantId: existingProduct.tenantId,
          deletedAt: null,
        },
      });
      if (!cat) {
        throw new NotFoundException('Category');
      }
      resolvedCategoryId = cat.id;
    }

    // 3. Validate subcategory if updating
    let resolvedSubcategoryId = existingProduct.subcategoryId;
    if (dto.subcategoryId !== undefined) {
      if (dto.subcategoryId === null || dto.subcategoryId === '') {
        resolvedSubcategoryId = null;
      } else {
        const subcat = await this.prisma.category.findFirst({
          where: {
            OR: [{ id: dto.subcategoryId }, { slug: dto.subcategoryId }],
            tenantId: existingProduct.tenantId,
            deletedAt: null,
          },
        });
        if (!subcat) {
          throw new NotFoundException('Subcategory');
        }
        resolvedSubcategoryId = subcat.id;
      }
    }

    // 4. Validate brand if updating
    let resolvedBrandId = existingProduct.brandId;
    if (dto.brandId !== undefined) {
      if (dto.brandId === null || dto.brandId === '') {
        resolvedBrandId = null;
      } else {
        const br = await this.prisma.brand.findFirst({
          where: {
            OR: [{ id: dto.brandId }, { slug: dto.brandId }],
            tenantId: existingProduct.tenantId,
            deletedAt: null,
          },
        });
        if (!br) {
          throw new NotFoundException('Brand');
        }
        resolvedBrandId = br.id;
      }
    }

    // 5. Validate slug uniqueness if slug or title changed
    let slug = existingProduct.slug;
    if (dto.slug) {
      slug = this.generateSlug(dto.slug);
    } else if (dto.title && !dto.slug && dto.title !== existingProduct.title) {
      slug = this.generateSlug(dto.title);
    }

    if (slug !== existingProduct.slug) {
      const conflict = await this.prisma.product.findFirst({
        where: {
          tenantId: existingProduct.tenantId,
          slug,
          id: { not: existingProduct.id },
          deletedAt: null,
        },
      });
      if (conflict) {
        throw new ConflictException(`Product with slug '${slug}' already exists in this store.`);
      }
    }

    // 6. Validate collection IDs if provided
    let validCollectionIds: string[] | undefined = undefined;
    if (dto.collectionIds !== undefined) {
      if (dto.collectionIds.length > 0) {
        const collections = await this.prisma.collection.findMany({
          where: {
            OR: [
              { id: { in: dto.collectionIds } },
              { slug: { in: dto.collectionIds } },
            ],
            tenantId: existingProduct.tenantId,
            deletedAt: null,
          },
          select: { id: true },
        });
        validCollectionIds = collections.map((c) => c.id);
      } else {
        validCollectionIds = [];
      }
    }

    // 7. Validate variants if provided
    let preparedVariants: any[] | undefined = undefined;
    if (dto.variants && dto.variants.length > 0) {
      preparedVariants = [];
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

        preparedVariants.push({
          sku: variantSku,
          color,
          colorHex: v.colorHex?.trim() || undefined,
          size,
          price: v.price ?? Number(existingProduct.price),
          salePrice: v.salePrice !== undefined ? v.salePrice : undefined,
          stock: v.stock ?? 0,
          enabled: v.enabled ?? true,
          barcode: v.barcode?.trim() || undefined,
        });
      }
    }

    // 8. Upload any new files to Cloudinary
    const uploadedImageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadResults = await this.storageService.uploadFiles(files, {
        folder: 'products',
      });
      uploadedImageUrls.push(...uploadResults.map((r) => r.url));
    }

    // Prepare images to retain, add, and clean up
    let finalImagesToSet: any[] | undefined = undefined;
    let imagesToDeleteFromStorage: string[] = [];

    if (files?.length || dto.images !== undefined) {
      const baseImages: { url: string; alt?: string; isCover?: boolean; order?: number }[] = [];
      if (Array.isArray(dto.images)) {
        dto.images.forEach((img: any, idx: number) => {
          if (typeof img === 'string' && img.trim().length > 0) {
            baseImages.push({
              url: img.trim(),
              alt: dto.title || existingProduct.title,
              isCover: idx === 0,
              order: idx,
            });
          } else if (img && typeof img === 'object' && img.url) {
            baseImages.push({
              url: String(img.url).trim(),
              alt: img.alt?.trim() || dto.title || existingProduct.title,
              isCover: img.isCover ?? idx === 0,
              order: img.order ?? idx,
            });
          }
        });
      } else if (!files?.length && dto.images === undefined) {
        baseImages.push(
          ...existingProduct.images.map((img) => ({
            url: img.url,
            alt: img.alt || existingProduct.title,
            isCover: img.isCover,
            order: img.order,
          })),
        );
      } else if (files?.length && dto.images === undefined) {
        // If uploading new files without explicitly specifying images, keep existing ones
        baseImages.push(
          ...existingProduct.images.map((img) => ({
            url: img.url,
            alt: img.alt || existingProduct.title,
            isCover: img.isCover,
            order: img.order,
          })),
        );
      }

      const newUploadedData = uploadedImageUrls.map((url, idx) => ({
        url,
        alt: dto.title || existingProduct.title,
        isCover: baseImages.length === 0 && idx === 0,
        order: baseImages.length + idx,
      }));

      finalImagesToSet = [...baseImages, ...newUploadedData];

      // Identify images removed by user to delete from Cloudinary
      const currentKeepUrls = new Set(finalImagesToSet.map((i) => i.url));
      imagesToDeleteFromStorage = existingProduct.images
        .map((i) => i.url)
        .filter((url) => !currentKeepUrls.has(url));
    }

    // 9. Update product in DB with transaction
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id: existingProduct.id },
          data: {
            title: dto.title?.trim() ?? undefined,
            slug: slug !== existingProduct.slug ? slug : undefined,
            shortDescription: dto.shortDescription !== undefined ? dto.shortDescription?.trim() : undefined,
            description: dto.description !== undefined ? dto.description?.trim() : undefined,
            status: (dto.status as any) ?? undefined,
            price: dto.price !== undefined ? dto.price : undefined,
            salePrice: dto.salePrice !== undefined ? dto.salePrice : undefined,
            cost: dto.cost !== undefined ? dto.cost : undefined,
            weightGrams: dto.weightGrams !== undefined ? dto.weightGrams : undefined,
            preorder: dto.preorder !== undefined ? dto.preorder : undefined,
            isNew: dto.isNew !== undefined ? dto.isNew : undefined,
            isBestseller: dto.isBestseller !== undefined ? dto.isBestseller : undefined,
            tags: dto.tags !== undefined ? dto.tags : undefined,
            specs: dto.specs !== undefined ? dto.specs : undefined,
            seoTitle: dto.seoTitle !== undefined ? dto.seoTitle?.trim() : undefined,
            seoDescription: dto.seoDescription !== undefined ? dto.seoDescription?.trim() : undefined,
            categoryId: resolvedCategoryId,
            subcategoryId: resolvedSubcategoryId,
            brandId: resolvedBrandId,
          },
        });

        // Update product images if changed
        if (finalImagesToSet !== undefined) {
          await tx.productImage.deleteMany({
            where: { productId: existingProduct.id },
          });

          if (finalImagesToSet.length > 0) {
            await tx.productImage.createMany({
              data: finalImagesToSet.map((img) => ({
                productId: existingProduct.id,
                url: img.url,
                alt: img.alt,
                isCover: img.isCover,
                order: img.order,
              })),
            });
          }
        }

        // Update collection relations if provided
        if (validCollectionIds !== undefined) {
          await tx.productCollection.deleteMany({
            where: { productId: existingProduct.id },
          });

          if (validCollectionIds.length > 0) {
            await tx.productCollection.createMany({
              data: validCollectionIds.map((colId, index) => ({
                productId: existingProduct.id,
                collectionId: colId,
                position: index,
              })),
            });
          }
        }

        // Update variants if provided
        if (preparedVariants && preparedVariants.length > 0) {
          await tx.productVariant.deleteMany({
            where: { productId: existingProduct.id },
          });

          await tx.productVariant.createMany({
            data: preparedVariants.map((v) => ({
              ...v,
              productId: existingProduct.id,
            })),
          });
        }
      });

      // Cleanup deleted images from Cloudinary storage asynchronously
      if (imagesToDeleteFromStorage.length > 0) {
        this.storageService.deleteFiles(imagesToDeleteFromStorage).catch(() => {});
      }

      return this.findOne(existingProduct.id, tenantId);
    } catch (error) {
      // Rollback newly uploaded images from Cloudinary if update failed
      if (uploadedImageUrls.length > 0) {
        await this.storageService.deleteFiles(uploadedImageUrls).catch(() => {});
      }
      throw error;
    }
  }

  // Get all products with filters, search, and pagination
  async findAll(query?: QueryProductDto, tenantId?: string) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      resolvedTenantId = activeTenant?.id;
    }

    if (!resolvedTenantId) {
      return ResponseHelper.success([], 'Products retrieved successfully');
    }

    const where: any = {
      tenantId: resolvedTenantId,
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

  // Get single product details by ID or Slug
  async findOne(idOrSlug: string, tenantId?: string) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      resolvedTenantId = activeTenant?.id;
    }

    if (!resolvedTenantId) {
      throw new NotFoundException('Product');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId: resolvedTenantId,
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

  // Delete product (soft delete) and remove its images from Cloudinary storage
  async remove(idOrSlug: string, tenantId?: string) {
    let resolvedTenantId = tenantId;
    if (!resolvedTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      resolvedTenantId = activeTenant?.id;
    }

    if (!resolvedTenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId: resolvedTenantId,
        deletedAt: null,
      },
      include: {
        images: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product');
    }

    // Soft delete product and its variants in database transaction
    await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id: product.id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.productVariant.updateMany({
        where: { productId: product.id },
        data: { deletedAt: new Date() },
      }),
    ]);

    // Delete all product images from Cloudinary storage
    if (product.images && product.images.length > 0) {
      const urls = product.images.map((img) => img.url);
      await this.storageService.deleteFiles(urls).catch(() => {});
    }

    return ResponseHelper.success(null, 'Product deleted successfully');
  }

  // Helper to format text into URL-friendly slug
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
