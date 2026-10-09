import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  ApplyDiscountDto,
  DiscountQueryDto,
} from './dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  ConflictException,
  NotFoundException,
} from '../../../common/exceptions/business.exception';
import {
  DiscountMethod,
  DiscountStatus,
  DiscountType,
} from '../../../../prisma/generated/client';

@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to resolve fallback tenant if none provided (for public storefronts or dev)
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId) return tenantId;
    const defaultTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    if (!defaultTenant) {
      throw new NotFoundException('Tenant');
    }
    return defaultTenant.id;
  }

  // 1. Create a new discount / coupon
  async create(dto: CreateDiscountDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant');
    }

    const cleanCode = dto.code.trim().toUpperCase();

    // Check code duplication for this store
    const existing = await this.prisma.discount.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: cleanCode,
        },
      },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(`Discount code '${cleanCode}' already exists for this store.`);
    }

    // Validate start and end dates
    const startsAt = new Date(dto.startsAt);
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : undefined;
    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('End date must be after the start date.');
    }

    // Determine initial status based on start/end dates
    let initialStatus = dto.status ?? DiscountStatus.ACTIVE;
    const now = new Date();
    if (startsAt > now) {
      initialStatus = DiscountStatus.SCHEDULED;
    } else if (endsAt && endsAt < now) {
      initialStatus = DiscountStatus.EXPIRED;
    }

    const discount = await this.prisma.discount.create({
      data: {
        tenantId,
        code: cleanCode,
        title: dto.title.trim(),
        type: dto.type,
        method: dto.method ?? DiscountMethod.CODE,
        status: initialStatus,
        value: dto.value,
        minSubtotal: dto.minSubtotal !== undefined ? dto.minSubtotal : undefined,
        maxDiscountAmount: dto.maxDiscountAmount !== undefined ? dto.maxDiscountAmount : undefined,
        usageLimit: dto.usageLimit !== undefined ? dto.usageLimit : undefined,
        usageLimitPerUser: dto.usageLimitPerUser !== undefined ? dto.usageLimitPerUser : 1,
        startsAt,
        endsAt,
      },
    });

    return ResponseHelper.created(discount, 'Discount created successfully');
  }

  // 2. Get all discounts with pagination, search, and status filtering
  async findAll(query: DiscountQueryDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: targetTenantId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { title: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.discount.count({ where }),
      this.prisma.discount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { redemptions: true },
          },
        },
      }),
    ]);

    const meta = ResponseHelper.buildPaginationMeta(total, page, limit);
    return ResponseHelper.paginated(items, meta, 'Discounts retrieved successfully');
  }

  // 3. Get single discount details by ID or Code
  async findOne(idOrCode: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const discount = await this.prisma.discount.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
        tenantId: targetTenantId,
        deletedAt: null,
      },
      include: {
        redemptions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount');
    }

    return ResponseHelper.success(discount, 'Discount details retrieved successfully');
  }

  // 4. Apply discount in cart/checkout (Validation & Calculation Engine)
  async applyDiscount(dto: ApplyDiscountDto, userId?: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const cleanCode = dto.code.trim().toUpperCase();

    // ১. টেন্যান্ট ও কোড ভেরিফিকেশন
    const discount = await this.prisma.discount.findUnique({
      where: {
        tenantId_code: {
          tenantId: targetTenantId,
          code: cleanCode,
        },
      },
    });

    if (!discount || discount.deletedAt) {
      throw new BadRequestException(`Invalid coupon code '${cleanCode}'.`);
    }

    // ২. স্ট্যাটাস ভেরিফিকেশন
    if (discount.status !== DiscountStatus.ACTIVE) {
      throw new BadRequestException(`Coupon '${cleanCode}' is currently inactive.`);
    }

    // ৩. ডেট ও টাইম শিডিউল চেক (startsAt ও endsAt)
    const now = new Date();
    if (discount.startsAt > now) {
      throw new BadRequestException(
        `Coupon '${cleanCode}' is not active yet. Starts on ${discount.startsAt.toLocaleDateString()}.`
      );
    }
    if (discount.endsAt && discount.endsAt < now) {
      throw new BadRequestException(`Coupon '${cleanCode}' has expired.`);
    }

    // ৪. গ্লোবাল লিমিট চেক (usedCount < usageLimit)
    if (
      discount.usageLimit !== null &&
      discount.usageLimit !== undefined &&
      discount.usedCount >= discount.usageLimit
    ) {
      throw new BadRequestException(`Coupon '${cleanCode}' has reached its total usage limit.`);
    }

    // ৫. পার-ইউজার লিমিট চেক (DiscountRedemption টেবিল থেকে)
    const userLimit = discount.usageLimitPerUser ?? 1;
    if (userId) {
      const userRedemptions = await this.prisma.discountRedemption.count({
        where: {
          tenantId: targetTenantId,
          discountId: discount.id,
          userId,
        },
      });
      if (userRedemptions >= userLimit) {
        throw new BadRequestException(
          `You have already used coupon '${cleanCode}' the maximum allowed number of times (${userLimit}x).`
        );
      }
    } else if (dto.customerEmail) {
      const emailRedemptions = await this.prisma.discountRedemption.count({
        where: {
          tenantId: targetTenantId,
          discountId: discount.id,
          customerEmail: dto.customerEmail.toLowerCase().trim(),
        },
      });
      if (emailRedemptions >= userLimit) {
        throw new BadRequestException(
          `Email '${dto.customerEmail}' has already used coupon '${cleanCode}' (${userLimit}x).`
        );
      }
    }

    // ৬. ন্যূনতম অর্ডার মূল্য (minSubtotal) যাচাই
    const subtotal = Number(dto.subtotal);
    if (discount.minSubtotal && subtotal < Number(discount.minSubtotal)) {
      throw new BadRequestException(
        `Minimum order subtotal of ৳${discount.minSubtotal} required to use coupon '${cleanCode}'. Current cart subtotal is ৳${subtotal}.`
      );
    }

    // ৭. টাইপ অনুযায়ী সঠিক ছাড় হিসাব (PERCENTAGE সাথে maxDiscountAmount ক্যাপ, FIXED_AMOUNT, FREE_SHIPPING)
    let discountAmount = 0;
    const val = Number(discount.value);

    if (discount.type === DiscountType.PERCENTAGE) {
      discountAmount = (subtotal * val) / 100;
      if (discount.maxDiscountAmount && discountAmount > Number(discount.maxDiscountAmount)) {
        discountAmount = Number(discount.maxDiscountAmount);
      }
      discountAmount = Math.min(discountAmount, subtotal);
    } else if (discount.type === DiscountType.FIXED_AMOUNT) {
      discountAmount = Math.min(val, subtotal);
    } else if (discount.type === DiscountType.FREE_SHIPPING) {
      discountAmount = 0;
    }

    const newSubtotal = Math.max(0, subtotal - discountAmount);

    return ResponseHelper.success(
      {
        discountId: discount.id,
        code: discount.code,
        title: discount.title,
        type: discount.type,
        value: val,
        discountAmount: Number(discountAmount.toFixed(2)),
        originalSubtotal: subtotal,
        newSubtotal: Number(newSubtotal.toFixed(2)),
        isFreeShipping: discount.type === DiscountType.FREE_SHIPPING,
      },
      `Coupon '${cleanCode}' applied successfully!`
    );
  }

  // 5. Update an existing discount
  async update(id: string, dto: UpdateDiscountDto, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const discount = await this.prisma.discount.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount');
    }

    // Check code uniqueness if code is changed
    let updatedCode = discount.code;
    if (dto.code && dto.code.trim().toUpperCase() !== discount.code) {
      updatedCode = dto.code.trim().toUpperCase();
      const duplicate = await this.prisma.discount.findFirst({
        where: {
          tenantId,
          code: updatedCode,
          id: { not: discount.id },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new ConflictException(`Discount code '${updatedCode}' is already in use.`);
      }
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : discount.startsAt;
    const endsAt = dto.endsAt !== undefined ? (dto.endsAt ? new Date(dto.endsAt) : null) : discount.endsAt;

    if (endsAt && endsAt <= startsAt) {
      throw new BadRequestException('End date must be after start date.');
    }

    const updated = await this.prisma.discount.update({
      where: { id: discount.id },
      data: {
        code: updatedCode,
        title: dto.title !== undefined ? dto.title.trim() : undefined,
        type: dto.type !== undefined ? dto.type : undefined,
        method: dto.method !== undefined ? dto.method : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        value: dto.value !== undefined ? dto.value : undefined,
        minSubtotal: dto.minSubtotal !== undefined ? dto.minSubtotal : undefined,
        maxDiscountAmount: dto.maxDiscountAmount !== undefined ? dto.maxDiscountAmount : undefined,
        usageLimit: dto.usageLimit !== undefined ? dto.usageLimit : undefined,
        usageLimitPerUser: dto.usageLimitPerUser !== undefined ? dto.usageLimitPerUser : undefined,
        startsAt,
        endsAt,
      },
    });

    return ResponseHelper.success(updated, 'Discount updated successfully');
  }

  // 6. Delete discount (Soft delete)
  async remove(id: string, tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException('Tenant could not be resolved from authenticated user token.');
    }

    const discount = await this.prisma.discount.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!discount) {
      throw new NotFoundException('Discount');
    }

    await this.prisma.discount.update({
      where: { id: discount.id },
      data: { deletedAt: new Date() },
    });

    return ResponseHelper.success(null, 'Discount deleted successfully');
  }
}
