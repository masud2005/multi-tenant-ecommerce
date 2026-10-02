import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to generate a URL-friendly slug from string
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  /**
   * Create a new category or subcategory
   */
  async create(dto: CreateCategoryDto, tenantId?: string) {
    const targetTenantId = dto.tenantId || tenantId;

    if (!targetTenantId) {
      throw new ConflictException('Tenant ID is required to create a category.');
    }

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    // Generate or format slug
    const slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.name);

    // Check if category with this slug already exists for the tenant
    const existingSlug = await this.prisma.category.findUnique({
      where: {
        tenantId_slug: {
          tenantId: targetTenantId,
          slug,
        },
      },
    });

    if (existingSlug) {
      throw new ConflictException(
        `Category with slug '${slug}' already exists in this store.`,
      );
    }

    let resolvedParentId: string | null = null;

    // If parentId is provided, validate parent category
    if (dto.parentId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          OR: [
            { id: dto.parentId },
            { slug: dto.parentId },
          ],
          tenantId: targetTenantId,
          deletedAt: null,
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category');
      }

      resolvedParentId = parentCategory.id;

      // Check for duplicate subcategory name under the same parent
      const duplicateChild = await this.prisma.category.findFirst({
        where: {
          tenantId: targetTenantId,
          parentId: resolvedParentId,
          name: dto.name,
          deletedAt: null,
        },
      });

      if (duplicateChild) {
        throw new ConflictException(
          `Subcategory with name '${dto.name}' already exists under this parent category.`,
        );
      }
    }

    // Create the category in the database
    const category = await this.prisma.category.create({
      data: {
        tenantId: targetTenantId,
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        status: dto.status ?? 'published',
        isActive: dto.isActive ?? true,
        showInNav: dto.showInNav ?? true,
        order: dto.order ?? 0,
        parentId: resolvedParentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return ResponseHelper.created(category, 'Category created successfully');
  }

  /**
   * Update an existing category or subcategory
   */
  async update(idOrSlug: string, dto: UpdateCategoryDto, tenantId?: string) {
    const targetTenantId = dto.tenantId || tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    // Find existing category
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category');
    }

    // Slug conflict check
    let slug = category.slug;
    if (dto.slug) {
      slug = this.generateSlug(dto.slug);
    } else if (dto.name && !dto.slug && dto.name !== category.name) {
      slug = this.generateSlug(dto.name);
    }

    if (slug !== category.slug) {
      const existingSlug = await this.prisma.category.findFirst({
        where: {
          tenantId: category.tenantId,
          slug,
          id: { not: category.id },
          deletedAt: null,
        },
      });

      if (existingSlug) {
        throw new ConflictException(
          `Category with slug '${slug}' already exists in this store.`,
        );
      }
    }

    // Validate parentId if provided
    let resolvedParentId: string | null | undefined = undefined;
    if (dto.parentId !== undefined) {
      if (dto.parentId === null || dto.parentId === '') {
        resolvedParentId = null;
      } else {
        if (dto.parentId === category.id || dto.parentId === category.slug) {
          throw new ConflictException('A category cannot be its own parent.');
        }

        const parentCategory = await this.prisma.category.findFirst({
          where: {
            OR: [{ id: dto.parentId }, { slug: dto.parentId }],
            tenantId: category.tenantId,
            deletedAt: null,
          },
        });

        if (!parentCategory) {
          throw new NotFoundException('Parent category');
        }

        resolvedParentId = parentCategory.id;
      }
    }

    // Update in database
    const updatedCategory = await this.prisma.category.update({
      where: { id: category.id },
      data: {
        name: dto.name ?? undefined,
        slug: slug !== category.slug ? slug : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        image: dto.image !== undefined ? dto.image : undefined,
        seoTitle: dto.seoTitle !== undefined ? dto.seoTitle : undefined,
        seoDescription: dto.seoDescription !== undefined ? dto.seoDescription : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        showInNav: dto.showInNav !== undefined ? dto.showInNav : undefined,
        order: dto.order !== undefined ? dto.order : undefined,
        parentId: resolvedParentId !== undefined ? resolvedParentId : undefined,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    return ResponseHelper.success(updatedCategory, 'Category updated successfully');
  }

  /**
   * Get all categories for a tenant
   */
  async findAll(tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const categories = await this.prisma.category.findMany({
      where: {
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { deletedAt: null },
          include: {
            _count: {
              select: { products: true },
            },
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: { products: true, children: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return ResponseHelper.success(categories, 'Categories retrieved successfully');
  }

  /**
   * Get single category details by ID or Slug
   */
  async findOne(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { deletedAt: null },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category');
    }

    return ResponseHelper.success(category, 'Category details retrieved successfully');
  }

  /**
   * Delete a category (soft delete, cascade to child categories)
   */
  async remove(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const category = await this.prisma.category.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        children: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category');
    }

    const now = new Date();
    await this.prisma.$transaction([
      // Soft delete child categories (subcategories)
      this.prisma.category.updateMany({
        where: {
          parentId: category.id,
          deletedAt: null,
        },
        data: { deletedAt: now },
      }),
      // Soft delete category itself
      this.prisma.category.update({
        where: { id: category.id },
        data: { deletedAt: now },
      }),
    ]);

    return ResponseHelper.success(null, 'Category deleted successfully');
  }
}


