import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class BrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // Helper to generate a URL-friendly slug from string
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  // Create a new brand for authenticated owner's tenant
  async create(dto: CreateBrandDto, file?: Express.Multer.File, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    // Verify tenant exists
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
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
          tenantId,
          slug,
        },
      },
    });

    if (existingBrand) {
      throw new ConflictException(
        `Brand with slug '${slug}' already exists in this store.`,
      );
    }

    // Upload logo to storage if provided
    let uploadedLogoUrl: string | undefined;
    if (file) {
      const uploadResult = await this.storageService.uploadFile(file, {
        folder: 'brands',
      });
      uploadedLogoUrl = uploadResult.url;
    }

    try {
      // Create the brand in the database
      const brand = await this.prisma.brand.create({
        data: {
          tenantId,
          name: dto.name,
          slug,
          description: dto.description,
          logo: uploadedLogoUrl || (typeof dto.logo === 'string' ? dto.logo : undefined),
          isActive: dto.isActive ?? true,
        },
      });

      return ResponseHelper.created(brand, 'Brand created successfully');
    } catch (error) {
      // Rollback uploaded logo from storage if database creation fails
      if (uploadedLogoUrl) {
        await this.storageService.deleteFile(uploadedLogoUrl).catch(() => {});
      }
      throw error;
    }
  }

  // Update an existing brand for authenticated owner's tenant
  async update(
    idOrSlug: string,
    dto: UpdateBrandDto,
    file?: Express.Multer.File,
    tenantId?: string,
  ) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    // Find brand by id or slug
    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId,
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

    // Upload new logo if provided
    let newLogoUrl: string | undefined;
    if (file) {
      const uploadResult = await this.storageService.uploadFile(file, {
        folder: 'brands',
      });
      newLogoUrl = uploadResult.url;
    }

    try {
      // Update in database
      const updatedBrand = await this.prisma.brand.update({
        where: { id: brand.id },
        data: {
          name: dto.name ?? undefined,
          slug: slug !== brand.slug ? slug : undefined,
          description: dto.description !== undefined ? dto.description : undefined,
          logo: newLogoUrl !== undefined ? newLogoUrl : (typeof dto.logo === 'string' ? dto.logo : undefined),
          isActive: dto.isActive !== undefined ? dto.isActive : undefined,
        },
      });

      // Cleanup old logo from storage if replaced
      if (newLogoUrl && brand.logo && brand.logo !== newLogoUrl) {
        this.storageService.deleteFile(brand.logo).catch(() => {});
      }

      return ResponseHelper.success(updatedBrand, 'Brand updated successfully');
    } catch (error) {
      // Rollback newly uploaded logo if database update fails
      if (newLogoUrl) {
        await this.storageService.deleteFile(newLogoUrl).catch(() => {});
      }
      throw error;
    }
  }

  // Get all brands for the authenticated owner tenant
  async findAll(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const brands = await this.prisma.brand.findMany({
      where: {
        tenantId,
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

  // Get single brand details by ID or Slug for the owner tenant
  async findOne(idOrSlug: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId,
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

  // Delete a brand (soft delete) and clean up logo from storage
  async remove(idOrSlug: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const brand = await this.prisma.brand.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId,
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

    // Clean up logo from storage if exists
    if (brand.logo) {
      await this.storageService.deleteFile(brand.logo).catch(() => {});
    }

    return ResponseHelper.success(null, 'Brand deleted successfully');
  }
}
