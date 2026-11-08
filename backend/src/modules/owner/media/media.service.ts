import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { QueryMediaDto } from './dto/query-media.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

  // List store media assets with filtering by status/alt/unused
  async getMedia(query: QueryMediaDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const where: any = {
      tenantId: targetTenantId,
    };

    if (query.filter === 'noalt') {
      where.OR = [{ alt: null }, { alt: '' }];
    } else if (query.filter === 'unused') {
      where.usedIn = 0;
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.name = { contains: s, mode: 'insensitive' };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 30;
    const skip = (page - 1) * limit;

    const [assets, total, noAltCount, unusedCount] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mediaAsset.count({ where }),
      this.prisma.mediaAsset.count({
        where: {
          tenantId: targetTenantId,
          OR: [{ alt: null }, { alt: '' }],
        },
      }),
      this.prisma.mediaAsset.count({
        where: {
          tenantId: targetTenantId,
          usedIn: 0,
        },
      }),
    ]);

    return ResponseHelper.success(
      {
        assets,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        counts: {
          all: total,
          noalt: noAltCount,
          unused: unusedCount,
        },
      },
      'Media assets retrieved successfully',
    );
  }

  // Create new media asset entry in database
  async createMedia(dto: CreateMediaDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const asset = await this.prisma.mediaAsset.create({
      data: {
        tenantId: targetTenantId,
        name: dto.name,
        url: dto.url,
        size: dto.size || '300 KB',
        dimensions: dto.dimensions || '1200×1600',
        alt: dto.alt,
      },
    });

    return ResponseHelper.created(asset, 'Media asset added successfully');
  }

  // Update media asset alt text or title
  async updateMedia(id: string, dto: UpdateMediaDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.mediaAsset.findFirst({
      where: { id, tenantId: targetTenantId },
    });

    if (!existing) {
      throw new NotFoundException('Media asset not found');
    }

    const updated = await this.prisma.mediaAsset.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.alt !== undefined ? { alt: dto.alt } : {}),
      },
    });

    return ResponseHelper.success(updated, 'Media asset updated successfully');
  }

  // Delete media asset
  async deleteMedia(id: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.mediaAsset.findFirst({
      where: { id, tenantId: targetTenantId },
    });

    if (!existing) {
      throw new NotFoundException('Media asset not found');
    }

    await this.prisma.mediaAsset.delete({
      where: { id: existing.id },
    });

    if (existing.url?.includes('cloudinary.com') || existing.url?.includes('/upload/')) {
      const resourceType =
        this.storageService.inferResourceType(existing.url) || 'image';
      this.storageService
        .deleteFile(existing.url, resourceType)
        .catch((err) => {
          this.logger.warn(
            `Media DB deleted but Cloudinary cleanup failed for ${existing.id}: ${err?.message || err}`,
          );
        });
    }

    return ResponseHelper.success(null, 'Media asset deleted successfully');
  }
}

