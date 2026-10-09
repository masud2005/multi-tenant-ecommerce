import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  QueryCustomerDto,
  UpdateCustomerDto,
  UpdateCustomerStatusDto,
} from './dto';
import {
  NotFoundException,
  ConflictException,
} from '../../../common/exceptions/business.exception';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to resolve tenant ID from token or fallback to active tenant
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId) return tenantId;

    const activeTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!activeTenant) {
      throw new ConflictException('Tenant could not be resolved.');
    }

    return activeTenant.id;
  }

  // 1. GET /api/v1/owner/customers (without segment and location filters)
  async findAll(query?: QueryCustomerDto, tenantId?: string) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const where: any = {
      tenantId: resolvedTenantId,
      deletedAt: null,
    };

    // Search query across name, email, phone, tags
    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { tags: { has: q } },
      ];
    }

    const page = query?.page && query.page > 0 ? Number(query.page) : 1;
    const limit = query?.limit && query.limit > 0 ? Number(query.limit) : 50;
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'totalSpent', 'ordersCount', 'name', 'lastLoginAt'];
    const sortBy = allowedSortFields.includes(query?.sortBy || '')
      ? query!.sortBy!
      : 'createdAt';
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';

    const [customers, total] = await Promise.all([
      this.prisma.customerProfile.findMany({
        where,
        include: {
          addresses: {
            orderBy: { isDefaultShipping: 'desc' },
          },
          orders: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              number: true,
              status: true,
              paymentStatus: true,
              fulfillmentStatus: true,
              total: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
              wishlist: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.customerProfile.count({ where }),
    ]);

    const meta = ResponseHelper.buildPaginationMeta(total, page, limit);
    return ResponseHelper.paginated(customers, meta, 'Customers retrieved successfully');
  }

  // 2. GET /api/v1/owner/customers/:id
  async findOne(id: string, tenantId?: string) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const customer = await this.prisma.customerProfile.findFirst({
      where: {
        OR: [{ id }, { email: id }],
        tenantId: resolvedTenantId,
        deletedAt: null,
      },
      include: {
        addresses: {
          orderBy: { isDefaultShipping: 'desc' },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    images: { take: 1 },
                  },
                },
                variant: {
                  select: {
                    id: true,
                    sku: true,
                    color: true,
                    colorHex: true,
                    size: true,
                    price: true,
                    salePrice: true,
                  },
                },
              },
            },
            shippingAddress: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
        wishlist: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                salePrice: true,
                images: { take: 1 },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer');
    }

    return ResponseHelper.success(customer, 'Customer details retrieved successfully');
  }

  // 3. PATCH /api/v1/owner/customers/:id/status
  async updateStatus(id: string, dto?: UpdateCustomerStatusDto, tenantId?: string) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const customer = await this.prisma.customerProfile.findFirst({
      where: {
        OR: [{ id }, { email: id }],
        tenantId: resolvedTenantId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer');
    }

    const nextStatus = typeof dto?.isActive === 'boolean' ? dto.isActive : !customer.isActive;

    const updated = await this.prisma.customerProfile.update({
      where: { id: customer.id },
      data: {
        isActive: nextStatus,
      },
    });

    return ResponseHelper.success(
      updated,
      `Customer ${updated.isActive ? 'activated' : 'deactivated / banned'} successfully`,
    );
  }

  // 4. PATCH /api/v1/owner/customers/:id (without segment and district)
  async update(id: string, dto: UpdateCustomerDto, tenantId?: string) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);

    const customer = await this.prisma.customerProfile.findFirst({
      where: {
        OR: [{ id }, { email: id }],
        tenantId: resolvedTenantId,
        deletedAt: null,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer');
    }

    const updated = await this.prisma.customerProfile.update({
      where: { id: customer.id },
      data: {
        name: dto.name?.trim() !== undefined ? dto.name.trim() : undefined,
        phone: dto.phone?.trim() !== undefined ? dto.phone.trim() : undefined,
        tags: dto.tags !== undefined ? dto.tags : undefined,
        storeCredit: dto.storeCredit !== undefined ? dto.storeCredit : undefined,
      },
      include: {
        addresses: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            wishlist: true,
          },
        },
      },
    });

    return ResponseHelper.success(updated, 'Customer updated successfully');
  }
}
