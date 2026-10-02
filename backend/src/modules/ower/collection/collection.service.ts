import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
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
   * Create a new collection
   */
  async create(dto: CreateCollectionDto, tenantId?: string) {
    const targetTenantId = dto.tenantId || tenantId;

    if (!targetTenantId) {
      throw new ConflictException('Tenant ID is required to create a collection.');
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

    // Check if collection with this slug already exists for the tenant
    const existingCollection = await this.prisma.collection.findUnique({
      where: {
        tenantId_slug: {
          tenantId: targetTenantId,
          slug,
        },
      },
    });

    if (existingCollection) {
      throw new ConflictException(
        `Collection with slug '${slug}' already exists in this store.`,
      );
    }

    // Create the collection in the database
    const collection = await this.prisma.collection.create({
      data: {
        tenantId: targetTenantId,
        name: dto.name,
        slug,
        description: dto.description,
        image: dto.image,
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
  }

  /**
   * Update an existing collection
   */
  async update(idOrSlug: string, dto: UpdateCollectionDto, tenantId?: string) {
    const targetTenantId = dto.tenantId || tenantId;

    // Find collection by id or slug
    const collection = await this.prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection');
    }

    // If new slug or name is provided, check for conflicts
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

    // Update in database
    const updatedCollection = await this.prisma.collection.update({
      where: { id: collection.id },
      data: {
        name: dto.name ?? undefined,
        slug: slug !== collection.slug ? slug : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        image: dto.image !== undefined ? dto.image : undefined,
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

    return ResponseHelper.success(updatedCollection, 'Collection updated successfully');
  }

  /**
   * Get all collections for a tenant
   */
  async findAll(tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const collections = await this.prisma.collection.findMany({
      where: {
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    return ResponseHelper.success(
      collections,
      'Collections retrieved successfully',
    );
  }

  /**
   * Get single collection details by ID or Slug
   */
  async findOne(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const collection = await this.prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
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

  /**
   * Delete a collection (soft delete)
   */
  async remove(idOrSlug: string, tenantId?: string) {
    const targetTenantId = tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';

    const collection = await this.prisma.collection.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
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

    return ResponseHelper.success(null, 'Collection deleted successfully');
  }
}
