import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
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

    // If parentId is provided, validate parent category
    if (dto.parentId) {
      const parentCategory = await this.prisma.category.findFirst({
        where: {
          id: dto.parentId,
          tenantId: targetTenantId,
          deletedAt: null,
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category');
      }

      // Check for duplicate subcategory name under the same parent
      const duplicateChild = await this.prisma.category.findFirst({
        where: {
          tenantId: targetTenantId,
          parentId: dto.parentId,
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
        parentId: dto.parentId || null,
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
}
