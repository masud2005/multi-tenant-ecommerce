import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { QueryReturnDto, UpdateReturnStatusDto } from './dto';
import {
  ReturnStatus,
  StockMovementReason,
} from '../../../../prisma/generated/client';

@Injectable()
export class ReturnService {
  private readonly logger = new Logger(ReturnService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // Helper to resolve tenant ID from token or fallback to active tenant
  private async resolveTenantId(tenantId?: string): Promise<string> {
    if (tenantId) return tenantId;

    const activeTenant = await this.prisma.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!activeTenant) {
      throw new NotFoundException('Store tenant context not found');
    }

    return activeTenant.id;
  }

  // GET /api/v1/owner/returns - Retrieve all return requests for store with filters, search, metrics, and pagination
  async findAll(query: QueryReturnDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const where: any = {
      tenantId: targetTenantId,
      deletedAt: null,
    };

    // Tab and Status Filtering
    const normalizedTab = query.tab?.toLowerCase().trim().replace(/[\s-]+/g, '_');

    if (normalizedTab === 'open') {
      where.status = {
        notIn: [ReturnStatus.REFUNDED, ReturnStatus.EXCHANGED, ReturnStatus.REJECTED],
      };
    } else if (normalizedTab === 'awaiting_review' || normalizedTab === 'requested') {
      where.status = ReturnStatus.REQUESTED;
    } else if (normalizedTab === 'in_progress') {
      where.status = {
        in: [ReturnStatus.APPROVED, ReturnStatus.IN_TRANSIT, ReturnStatus.RECEIVED],
      };
    } else if (normalizedTab === 'closed') {
      where.status = {
        in: [ReturnStatus.REFUNDED, ReturnStatus.EXCHANGED, ReturnStatus.REJECTED],
      };
    } else if (query.status) {
      where.status = query.status;
    }

    // Resolution Filter
    if (query.resolution) {
      where.resolution = query.resolution;
    }

    // Keyword Search across Customer Name, Return Reason, ID, or Order Number
    if (query.search?.trim()) {
      const s = query.search.trim();
      const searchConditions = [
        { customerName: { contains: s, mode: 'insensitive' as const } },
        { reason: { contains: s, mode: 'insensitive' as const } },
        { id: { contains: s, mode: 'insensitive' as const } },
        { order: { number: { contains: s, mode: 'insensitive' as const } } },
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Date Range Filtering
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Pagination
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder };

    // Parallel execution for data fetch, total count, and tab metrics
    const [
      returns,
      total,
      allCount,
      openCount,
      awaitingReviewCount,
      inProgressCount,
      closedCount,
    ] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        include: {
          items: true,
          timeline: {
            orderBy: { createdAt: 'desc' },
          },
          order: {
            select: {
              id: true,
              number: true,
              status: true,
              paymentStatus: true,
              fulfillmentStatus: true,
              total: true,
              createdAt: true,
              customerName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.returnRequest.count({ where }),
      this.prisma.returnRequest.count({
        where: { tenantId: targetTenantId, deletedAt: null },
      }),
      this.prisma.returnRequest.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: {
            notIn: [ReturnStatus.REFUNDED, ReturnStatus.EXCHANGED, ReturnStatus.REJECTED],
          },
        },
      }),
      this.prisma.returnRequest.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: ReturnStatus.REQUESTED,
        },
      }),
      this.prisma.returnRequest.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: {
            in: [ReturnStatus.APPROVED, ReturnStatus.IN_TRANSIT, ReturnStatus.RECEIVED],
          },
        },
      }),
      this.prisma.returnRequest.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: {
            in: [ReturnStatus.REFUNDED, ReturnStatus.EXCHANGED, ReturnStatus.REJECTED],
          },
        },
      }),
    ]);

    return ResponseHelper.success(
      {
        returns,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
        counts: {
          all: allCount,
          open: openCount,
          awaitingReview: awaitingReviewCount,
          inProgress: inProgressCount,
          closed: closedCount,
        },
      },
      'Store return requests retrieved successfully',
    );
  }

  // GET /api/v1/owner/returns/:id - Retrieve detailed return request with photos, items, inspection note, and timeline
  async findOne(id: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const returnRequest = await this.prisma.returnRequest.findFirst({
      where: {
        id,
        tenantId: targetTenantId,
        deletedAt: null,
      },
      include: {
        items: true,
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
        order: {
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            fulfillmentStatus: true,
            total: true,
            subtotal: true,
            discount: true,
            shipping: true,
            createdAt: true,
            customerName: true,
            email: true,
            phone: true,
            shippingAddress: true,
            items: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!returnRequest) {
      throw new NotFoundException(`Return request with identifier "${id}" not found`);
    }

    return ResponseHelper.success(
      returnRequest,
      'Return request details retrieved successfully',
    );
  }

  // PATCH /api/v1/owner/returns/:id/status - Update return status, inspection notes, and append audit timeline
  async updateStatus(
    id: string,
    dto: UpdateReturnStatusDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        id,
        tenantId: targetTenantId,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Return request with identifier "${id}" not found`);
    }

    const adminName = adminUser?.name || adminUser?.email || 'Store Admin';

    let statusLabel = `Return status updated to ${dto.status.replace(/_/g, ' ').toLowerCase()}`;
    if (dto.status === ReturnStatus.APPROVED) {
      statusLabel = 'Return request approved';
    } else if (dto.status === ReturnStatus.REJECTED) {
      statusLabel = 'Return request rejected';
    } else if (dto.status === ReturnStatus.IN_TRANSIT) {
      statusLabel = 'Return item is in transit';
    } else if (dto.status === ReturnStatus.RECEIVED) {
      statusLabel = 'Returned item received and inspected';
    } else if (dto.status === ReturnStatus.REFUNDED) {
      statusLabel = 'Refund processed and completed';
    } else if (dto.status === ReturnStatus.EXCHANGED) {
      statusLabel = 'Exchange / Replacement dispatched';
    }

    const shouldAutoRestock =
      dto.status === ReturnStatus.RECEIVED &&
      existing.status !== ReturnStatus.RECEIVED &&
      existing.status !== ReturnStatus.REFUNDED &&
      existing.status !== ReturnStatus.EXCHANGED;

    const updatedReturn = await this.prisma.$transaction(async (tx) => {
      // Auto-restock sellable inventory when returned goods are received (no admin toggle)
      if (shouldAutoRestock) {
        const alreadyRestocked = await tx.stockMovement.findFirst({
          where: {
            tenantId: targetTenantId,
            reason: StockMovementReason.RETURN,
            ref: existing.id,
          },
          select: { id: true },
        });

        if (!alreadyRestocked) {
          const orderItems = await tx.orderItem.findMany({
            where: { orderId: existing.orderId },
            select: {
              id: true,
              variantId: true,
              title: true,
              size: true,
              color: true,
              qty: true,
            },
          });
          const returnItems = await tx.returnItem.findMany({
            where: { returnRequestId: existing.id },
          });

          const norm = (v?: string | null) => (v || '').trim().toLowerCase();
          const remainingByOrderItem = new Map(
            orderItems.map((oi) => [oi.id, oi.qty]),
          );

          for (const retItem of returnItems) {
            if (retItem.qty <= 0) continue;

            const candidates = orderItems.filter(
              (oi) =>
                !!oi.variantId &&
                (remainingByOrderItem.get(oi.id) || 0) > 0 &&
                norm(oi.title) === norm(retItem.title),
            );
            const match =
              candidates.find(
                (oi) =>
                  norm(oi.size) === norm(retItem.size) &&
                  norm(oi.color) === norm(retItem.color),
              ) || candidates[0];

            if (!match?.variantId) continue;

            const available = remainingByOrderItem.get(match.id) || 0;
            const qtyToRestock = Math.min(retItem.qty, available);
            if (qtyToRestock <= 0) continue;
            remainingByOrderItem.set(match.id, available - qtyToRestock);

            const variant = await tx.productVariant.findFirst({
              where: {
                id: match.variantId,
                deletedAt: null,
                product: { tenantId: targetTenantId, deletedAt: null },
              },
            });
            if (!variant) continue;

            const stockBefore = variant.stock;
            const stockAfter = stockBefore + qtyToRestock;

            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stock: { increment: qtyToRestock },
                version: { increment: 1 },
              },
            });

            await tx.stockMovement.create({
              data: {
                tenantId: targetTenantId,
                variantId: variant.id,
                change: qtyToRestock,
                stockBefore,
                stockAfter,
                reason: StockMovementReason.RETURN,
                ref: existing.id,
                note: `Auto-restock from return ${existing.id.slice(0, 8)} (${retItem.title})`,
                by: adminName,
              },
            });
          }
        }
      }

      const returnRequest = await tx.returnRequest.update({
        where: { id: existing.id },
        data: {
          status: dto.status,
          ...(dto.inspectionNote !== undefined
            ? { inspectionNote: dto.inspectionNote }
            : {}),
          timeline: {
            create: {
              label: shouldAutoRestock
                ? `${statusLabel} · inventory restocked automatically`
                : statusLabel,
              by: adminName,
              note: dto.note || dto.inspectionNote || undefined,
            },
          },
        },
        include: {
          items: true,
          timeline: {
            orderBy: { createdAt: 'desc' },
          },
          order: {
            select: {
              id: true,
              number: true,
              status: true,
              paymentStatus: true,
              fulfillmentStatus: true,
              total: true,
              subtotal: true,
              discount: true,
              shipping: true,
              createdAt: true,
              customerName: true,
              email: true,
              phone: true,
              shippingAddress: true,
              items: true,
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // If refunded, append timeline note to associated order as well
      if (dto.status === ReturnStatus.REFUNDED) {
        await tx.orderTimeline.create({
          data: {
            orderId: existing.orderId,
            label: `Return #${existing.id.slice(0, 8)} refund processed`,
            by: adminName,
            note: dto.note || dto.inspectionNote || undefined,
          },
        });
      }

      return returnRequest;
    });

    // Notify customer for meaningful return outcomes
    const notifyStatuses = new Set([
      ReturnStatus.APPROVED,
      ReturnStatus.REJECTED,
      ReturnStatus.REFUNDED,
      ReturnStatus.EXCHANGED,
    ]);
    if (
      dto.status !== existing.status &&
      notifyStatuses.has(dto.status as any)
    ) {
      (async () => {
        try {
          const order = updatedReturn.order;
          if (!order) return;
          let customerUserId: string | undefined;
          if (order.customer?.id) {
            const profile = await this.prisma.customerProfile.findUnique({
              where: { id: order.customer.id },
              select: { userId: true },
            });
            customerUserId = profile?.userId || undefined;
          }
          const tenant = await this.prisma.tenant.findUnique({
            where: { id: existing.tenantId },
            select: { name: true },
          });
          const ship = (order.shippingAddress || {}) as Record<string, any>;
          await this.notificationService.sendFromTemplate({
            tenantId: existing.tenantId,
            key: 'RETURN_UPDATED',
            userId: customerUserId,
            emailTo: order.email || order.customer?.email,
            type: 'ORDER',
            link: `/account/orders`,
            vars: {
              customer_name:
                ship.name || order.customer?.name || order.email || '',
              order_number: order.number,
              return_status: String(dto.status).replace(/_/g, ' '),
              return_note: dto.note || dto.inspectionNote || '',
              store_name: tenant?.name || 'Store',
            },
          });
        } catch (err) {
          this.logger.error('Failed to send return status notification', err);
        }
      })();
    }

    return ResponseHelper.success(
      updatedReturn,
      'Return request status updated successfully',
    );
  }
}


