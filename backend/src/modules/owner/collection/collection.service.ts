import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';
import { CollectionType } from '../../../../prisma/generated/client';

@Injectable()
export class CollectionService {
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

  // Create a new collection with optional image upload and rollback support
  async create(dto: CreateCollectionDto, file?: Express.Multer.File, tenantId?: string) {
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

    // Check if collection with this slug already exists for the tenant
    const existingCollection = await this.prisma.collection.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug,
        },
      },
    });

    if (existingCollection) {
      throw new ConflictException(
        `Collection with slug '${slug}' already exists in this store.`,
      );
    }

    // Upload image to storage if provided
    let uploadedImageUrl: string | undefined;
    if (file) {
      const uploadResult = await this.storageService.uploadFile(file, {
        folder: 'collections',
      });
      uploadedImageUrl = uploadResult.url;
    }

    try {
      // Create collection in database
      const collection = await this.prisma.collection.create({
        data: {
          tenantId,
          name: dto.name,
          slug,
          description: dto.description,
          image: uploadedImageUrl || dto.image,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          type: dto.type ?? CollectionType.MANUAL,
          rule: dto.rule ?? undefined,
          isActive: dto.isActive ?? true,
          isFeatured: dto.isFeatured ?? false,
          order: dto.order ?? 0,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
      });

      return ResponseHelper.created(collection, 'Collection created successfully');
    } catch (error) {
      // Rollback uploaded image from storage if database operation fails
      if (uploadedImageUrl) {
        await this.storageService.deleteFile(uploadedImageUrl).catch(() => {});
      }
      throw error;
    }
  }

  // Update an existing collection with image replacement and cleanup
  async update(idOrSlug: string, dto: UpdateCollectionDto, file?: Express.Multer.File, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    // Find collection by id or slug
    const collection = await this.prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId,
        deletedAt: null,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection');
    }

    // Check slug conflicts if slug or name changes
    let slug = collection.slug;
    if (dto.slug) {
      slug = this.generateSlug(dto.slug);
    } else if (dto.name && !dto.slug && dto.name !== collection.name) {
      slug = this.generateSlug(dto.name);
    }

    if (slug !== collection.slug) {
      const existingWithSlug = await this.prisma.collection.findFirst({
        where: {
          tenantId: collection.tenantId,
          slug,
          id: { not: collection.id },
          deletedAt: null,
        },
      });

      if (existingWithSlug) {
        throw new ConflictException(
          `Collection with slug '${slug}' already exists in this store.`,
        );
      }
    }

    // Upload new image if provided
    let newImageUrl: string | undefined;
    if (file) {
      const uploadResult = await this.storageService.uploadFile(file, {
        folder: 'collections',
      });
      newImageUrl = uploadResult.url;
    }

    try {
      // Update collection in database
      const updatedCollection = await this.prisma.collection.update({
        where: { id: collection.id },
        data: {
          name: dto.name ?? undefined,
          slug: slug !== collection.slug ? slug : undefined,
          description: dto.description !== undefined ? dto.description : undefined,
          image: newImageUrl !== undefined ? newImageUrl : dto.image !== undefined ? dto.image : undefined,
          seoTitle: dto.seoTitle !== undefined ? dto.seoTitle : undefined,
          seoDescription: dto.seoDescription !== undefined ? dto.seoDescription : undefined,
          type: dto.type ?? undefined,
          rule: dto.rule !== undefined ? dto.rule : undefined,
          isActive: dto.isActive !== undefined ? dto.isActive : undefined,
          isFeatured: dto.isFeatured !== undefined ? dto.isFeatured : undefined,
          order: dto.order !== undefined ? dto.order : undefined,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        },
      });

      // Cleanup old image from storage if replaced
      if (newImageUrl && collection.image && collection.image !== newImageUrl) {
        this.storageService.deleteFile(collection.image).catch(() => {});
      }

      return ResponseHelper.success(updatedCollection, 'Collection updated successfully');
    } catch (error) {
      // Rollback newly uploaded image if database update fails
      if (newImageUrl) {
        await this.storageService.deleteFile(newImageUrl).catch(() => {});
      }
      throw error;
    }
  }

  // Get all collections for a tenant
  async findAll(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const collections = await this.prisma.collection.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return ResponseHelper.success(
      collections,
      'Collections retrieved successfully',
    );
  }

  // Get single collection details by ID or Slug
  async findOne(idOrSlug: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const collection = await this.prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId,
        deletedAt: null,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection');
    }

    return ResponseHelper.success(
      collection,
      'Collection details retrieved successfully',
    );
  }

  // Delete a collection (soft delete) and remove its image from storage
  async remove(idOrSlug: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const collection = await this.prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        tenantId,
        deletedAt: null,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection');
    }

    await this.prisma.collection.update({
      where: { id: collection.id },
      data: { deletedAt: new Date() },
    });

    // Cleanup image from storage if exists
    if (collection.image) {
      await this.storageService.deleteFile(collection.image).catch(() => {});
    }

    return ResponseHelper.success(null, 'Collection deleted successfully');
  }
}
