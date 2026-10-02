import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class BrandService {
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
   * Create a new brand
   */
  async create(dto: CreateBrandDto, tenantId?: string) {
    const targetTenantId = dto.tenantId || tenantId;

    if (!targetTenantId) {
      throw new ConflictException('Tenant ID is required to create a brand.');
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

    // Check if brand with this slug already exists for the tenant
    const existingBrand = await this.prisma.brand.findUnique({
      where: {
        tenantId_slug: {
          tenantId: targetTenantId,
          slug,
        },
      },
    });

    if (existingBrand) {
      throw new ConflictException(
        `Brand with slug '${slug}' already exists in this store.`,
      );
    }

    // Create the brand in the database
    const brand = await this.prisma.brand.create({
      data: {
        tenantId: targetTenantId,
        name: dto.name,
        slug,
        description: dto.description,
        logo: dto.logo,
        isActive: dto.isActive ?? true,
      },
    });

    return ResponseHelper.created(brand, 'Brand created successfully');
  }

  /**
   * Update an existing brand
   */
  async update(idOrSlug: string, dto: UpdateBrandDto, tenantId?: string) {
    const targetTenantId = dto.tenantId || tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    // Find brand by id or slug
    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand');
    }

    // If new slug or name is provided, check for conflicts
    let slug = brand.slug;
    if (dto.slug) {
      slug = this.generateSlug(dto.slug);
    } else if (dto.name && !dto.slug && dto.name !== brand.name) {
      slug = this.generateSlug(dto.name);
    }

    if (slug !== brand.slug) {
      const existingWithSlug = await this.prisma.brand.findFirst({
        where: {
          tenantId: brand.tenantId,
          slug,
          id: { not: brand.id },
          deletedAt: null,
        },
      });

      if (existingWithSlug) {
        throw new ConflictException(
          `Brand with slug '${slug}' already exists in this store.`,
        );
      }
    }

    // Update in database
    const updatedBrand = await this.prisma.brand.update({
      where: { id: brand.id },
      data: {
        name: dto.name ?? undefined,
        slug: slug !== brand.slug ? slug : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        logo: dto.logo !== undefined ? dto.logo : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
    });

    return ResponseHelper.success(updatedBrand, 'Brand updated successfully');
  }

  /**
   * Get all brands for a tenant
   */
  async findAll(tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const brands = await this.prisma.brand.findMany({
      where: {
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ResponseHelper.success(
      brands,
      'Brands retrieved successfully',
    );
  }

  /**
   * Get single brand details by ID or Slug
   */
  async findOne(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          where: { deletedAt: null },
          include: {
            images: {
              where: { isCover: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand');
    }

    return ResponseHelper.success(
      brand,
      'Brand details retrieved successfully',
    );
  }

  /**
   * Delete a brand (soft delete)
   */
  async remove(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException('Brand');
    }

    await this.prisma.brand.update({
      where: { id: brand.id },
      data: { deletedAt: new Date() },
    });

    return ResponseHelper.success(null, 'Brand deleted successfully');
  }
}

