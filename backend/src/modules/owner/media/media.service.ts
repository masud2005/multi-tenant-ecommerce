import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { StorageService } from '../../../shared/storage/storage.service';
import { QueryMediaDto } from './dto/query-media.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

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

  /** Upload an image file to Cloudinary and register it in the media library. */
  async uploadMediaFile(
    file: Express.Multer.File,
    alt?: string,
    tenantId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only PNG, JPG, WebP, AVIF, or GIF images are allowed',
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Image must be under 5MB');
    }

    const targetTenantId = await this.resolveTenantId(tenantId);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: targetTenantId },
      select: { id: true, slug: true },
    });
    if (!tenant) {
      throw new NotFoundException('Store tenant context not found');
    }

    const baseName = (file.originalname || 'image')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      .replace(/^-|-$/g, '');

    const uploadResult = await this.storageService.uploadFile(file, {
      folder: `store/${tenant.slug || tenant.id}/media`,
      publicId: `${baseName || 'image'}-${Date.now()}`,
      overwrite: false,
      resourceType: 'image',
      tags: ['media-library', tenant.slug || tenant.id],
    });

    const sizeKb = Math.max(1, Math.round(uploadResult.bytes / 1024));
    const dimensions =
      uploadResult.width && uploadResult.height
        ? `${uploadResult.width}×${uploadResult.height}`
        : undefined;
    const displayName = file.originalname || `${baseName}.${uploadResult.format}`;

    try {
      const asset = await this.prisma.mediaAsset.create({
        data: {
          tenantId: targetTenantId,
          name: displayName,
          url: uploadResult.secureUrl || uploadResult.url,
          size: `${sizeKb} KB`,
          dimensions: dimensions || null,
          alt: alt?.trim() || null,
        },
      });

      this.logger.log(
        `Media uploaded [${asset.id}] for tenant [${targetTenantId}]`,
      );

      return ResponseHelper.created(asset, 'Image uploaded successfully');
    } catch (error) {
      await this.storageService
        .deleteFile(uploadResult.secureUrl || uploadResult.url)
        .catch(() => {});
      throw error;
    }
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

