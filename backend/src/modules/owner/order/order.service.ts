import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  OrderQueryDto,
  UpdateOrderStatusDto,
  AddOrderNoteDto,
  RefundOrderDto,
} from './dto';
import {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  PaymentMethod,
  OrderChannel,
  StockMovementReason,
  Prisma,
} from '../../../../prisma/generated/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
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

  /** Restore variant stock + ledger rows for cancelled / failed / refunded orders. */
  private async restoreOrderStock(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      number: string;
      tenantId: string;
      items: Array<{ variantId: string | null; qty: number }>;
    },
    reason: StockMovementReason,
    by: string,
    note: string,
  ) {
    for (const item of order.items) {
      if (!item.variantId || item.qty <= 0) continue;
      const variant = await tx.productVariant.findFirst({
        where: { id: item.variantId, deletedAt: null },
      });
      if (!variant) continue;
      const stockBefore = variant.stock;
      const stockAfter = stockBefore + item.qty;
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { stock: { increment: item.qty } },
      });
      await tx.stockMovement.create({
        data: {
          tenantId: order.tenantId,
          variantId: variant.id,
          change: item.qty,
          stockBefore,
          stockAfter,
          reason,
          ref: order.number,
          note,
          by,
        },
      });
    }
  }

  // Fetch all orders for tenant with filtering, search, pagination, and status counters
  async getOrders(query: OrderQueryDto, tenantId?: string) {
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      targetTenantId = defaultTenant?.id;
    }

    if (!targetTenantId) {
      throw new NotFoundException('Store tenant context not found');
    }

    const where: any = {
      tenantId: targetTenantId,
      deletedAt: null,
    };

    // Filter by tab or status
    const activeTab = query.tab?.toLowerCase() || query.status?.toLowerCase();

    if (activeTab === 'unfulfilled') {
      where.status = { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED] };
      where.OR = [
        { status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PENDING_PAYMENT] } },
        { fulfillmentStatus: FulfillmentStatus.UNFULFILLED },
      ];
    } else if (activeTab === 'unpaid') {
      where.status = { notIn: [OrderStatus.CANCELLED, OrderStatus.FAILED] };
      where.OR = [
        { status: OrderStatus.PENDING_PAYMENT },
        {
          paymentStatus: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.FAILED,
              PaymentStatus.PARTIALLY_PAID,
            ],
          },
        },
      ];
    } else if (activeTab === 'packed') {
      where.status = OrderStatus.PACKED;
    } else if (activeTab === 'shipped' || activeTab === 'in_transit') {
      where.status = { in: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY] };
    } else if (activeTab === 'returns') {
      where.status = {
        in: [
          OrderStatus.RETURN_REQUESTED,
          OrderStatus.RETURNED,
          OrderStatus.REFUNDED,
          OrderStatus.PARTIALLY_REFUNDED,
        ],
      };
    } else if (activeTab === 'closed') {
      where.status = {
        in: [
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
          OrderStatus.FAILED,
        ],
      };
    } else if (query.status && Object.values(OrderStatus).includes(query.status.toUpperCase() as OrderStatus)) {
      where.status = query.status.toUpperCase() as OrderStatus;
    }

    // Keyword search across order number, customer name, email, and phone
    if (query.search?.trim()) {
      const s = query.search.trim();
      const searchCondition = [
        { number: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
    }

    // Filter by payment status
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    // Filter by fulfillment status
    if (query.fulfillmentStatus) {
      where.fulfillmentStatus = query.fulfillmentStatus;
    }

    // Filter by payment method
    if (query.paymentMethod) {
      where.paymentMethod = query.paymentMethod;
    }

    // Filter by sales channel
    if (query.channel) {
      where.channel = query.channel;
    }

    // Filter by date range
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

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder };

    // Run parallel queries for order list, total count, and tab status metrics
    const [
      orders,
      total,
      allCount,
      unfulfilledCount,
      unpaidCount,
      packedCount,
      shippedCount,
      returnsCount,
      closedCount,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          shippingAddress: true,
          attempts: true,
          timeline: {
            orderBy: { createdAt: 'asc' },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
      this.prisma.order.count({
        where: { tenantId: targetTenantId, deletedAt: null },
      }),
      this.prisma.order.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.FAILED] },
          OR: [
            { status: { in: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.PENDING_PAYMENT] } },
            { fulfillmentStatus: FulfillmentStatus.UNFULFILLED },
          ],
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: { notIn: [OrderStatus.CANCELLED, OrderStatus.FAILED] },
          OR: [
            { status: OrderStatus.PENDING_PAYMENT },
            {
              paymentStatus: {
                in: [
                  PaymentStatus.PENDING,
                  PaymentStatus.FAILED,
                  PaymentStatus.PARTIALLY_PAID,
                ],
              },
            },
          ],
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: OrderStatus.PACKED,
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: { in: [OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY] },
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: {
            in: [
              OrderStatus.RETURN_REQUESTED,
              OrderStatus.RETURNED,
              OrderStatus.REFUNDED,
              OrderStatus.PARTIALLY_REFUNDED,
            ],
          },
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId: targetTenantId,
          deletedAt: null,
          status: {
            in: [
              OrderStatus.DELIVERED,
              OrderStatus.CANCELLED,
              OrderStatus.FAILED,
            ],
          },
        },
      }),
    ]);

    return ResponseHelper.success(
      {
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        counts: {
          all: allCount,
          unfulfilled: unfulfilledCount,
          unpaid: unpaidCount,
          packed: packedCount,
          shipped: shippedCount,
          returns: returnsCount,
          closed: closedCount,
        },
      },
      'Orders retrieved successfully',
    );
  }

  // Retrieve single order with complete timeline, attempts, notes, and items
  async getOrderById(id: string, tenantId?: string) {
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      targetTenantId = defaultTenant?.id;
    }

    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id }, { number: id }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: {
        items: true,
        shippingAddress: true,
        attempts: {
          orderBy: { createdAt: 'desc' },
        },
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
        returns: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with identifier "${id}" not found`);
    }

    return ResponseHelper.success(order, 'Order details retrieved successfully');
  }

  // Update order status, courier tracking, and append audit timeline
  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        OR: [{ id }, { number: id }],
        ...(tenantId ? { tenantId } : {}),
        deletedAt: null,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with identifier "${id}" not found`);
    }

    const adminName = adminUser?.name || adminUser?.email || 'Admin';
    const targetStatus = dto.status ?? existingOrder.status;

    // Derive fulfillment status based on new order status if not explicitly passed
    let derivedFulfillmentStatus = dto.fulfillmentStatus;
    if (!derivedFulfillmentStatus && dto.status) {
      if (dto.status === OrderStatus.DELIVERED) {
        derivedFulfillmentStatus = FulfillmentStatus.FULFILLED;
      } else if (dto.status === OrderStatus.SHIPPED || dto.status === OrderStatus.OUT_FOR_DELIVERY) {
        derivedFulfillmentStatus = FulfillmentStatus.PARTIALLY_FULFILLED;
      }
    }

    // COD payment resolution: collected flag must stay in sync with PAID
    let targetPaymentStatus = dto.paymentStatus;
    let codCollected = existingOrder.codCollected;
    const isCod = existingOrder.paymentMethod === PaymentMethod.COD;
    if (
      isCod &&
      (dto.status === OrderStatus.DELIVERED ||
        (!dto.status && existingOrder.status === OrderStatus.DELIVERED)) &&
      !targetPaymentStatus
    ) {
      targetPaymentStatus = PaymentStatus.PAID;
      codCollected = true;
    }
    if (isCod && targetPaymentStatus === PaymentStatus.PAID) {
      codCollected = true;
    }

    const becomingCancelled =
      dto.status === OrderStatus.CANCELLED &&
      existingOrder.status !== OrderStatus.CANCELLED &&
      existingOrder.status !== OrderStatus.REFUNDED &&
      existingOrder.status !== OrderStatus.FAILED;

    // Unpaid cancel → payment cancelled; paid cancel keeps PAID until refund is recorded
    if (becomingCancelled && !targetPaymentStatus) {
      if (
        existingOrder.paymentStatus === PaymentStatus.PAID ||
        existingOrder.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED
      ) {
        // leave payment as-is
      } else {
        targetPaymentStatus = PaymentStatus.CANCELLED;
      }
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status: targetStatus,
          ...(derivedFulfillmentStatus ? { fulfillmentStatus: derivedFulfillmentStatus } : {}),
          ...(targetPaymentStatus
            ? { paymentStatus: targetPaymentStatus, ...(isCod ? { codCollected } : {}) }
            : {}),
          ...(dto.courier ? { courier: dto.courier } : {}),
          ...(dto.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
        },
        include: {
          items: true,
          shippingAddress: true,
          attempts: true,
          timeline: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Append status change event to order timeline
      const statusLabel = dto.status
        ? `Order status updated to ${dto.status.replace(/_/g, ' ').toLowerCase()}`
        : dto.paymentStatus
          ? `Payment status marked as ${dto.paymentStatus.toLowerCase()}`
          : 'Order updated';

      await tx.orderTimeline.create({
        data: {
          orderId: existingOrder.id,
          label: statusLabel,
          by: adminName,
          note:
            dto.note ||
            (dto.trackingNumber
              ? `Courier: ${dto.courier || existingOrder.courier || 'Standard'}, Tracking: ${dto.trackingNumber}`
              : undefined),
        },
      });

      if (becomingCancelled) {
        await this.restoreOrderStock(
          tx,
          order,
          StockMovementReason.CORRECTION,
          adminName,
          'Stock restored — order cancelled',
        );
      }

      return order;
    });

    // Notify customer from DB templates for key status changes only
    if (dto.status && dto.status !== existingOrder.status) {
      const statusKeyMap: Partial<Record<string, string>> = {
        [OrderStatus.CONFIRMED]: 'ORDER_CONFIRMED',
        [OrderStatus.SHIPPED]: 'ORDER_SHIPPED',
        [OrderStatus.OUT_FOR_DELIVERY]: 'ORDER_SHIPPED',
        [OrderStatus.DELIVERED]: 'ORDER_DELIVERED',
        [OrderStatus.CANCELLED]: 'ORDER_CANCELLED',
        [OrderStatus.FAILED]: 'PAYMENT_FAILED',
      };
      const templateKey = statusKeyMap[dto.status];
      if (templateKey) {
        (async () => {
          try {
            let customerUserId: string | undefined;
            if (updatedOrder.customerId) {
              const profile = await this.prisma.customerProfile.findUnique({
                where: { id: updatedOrder.customerId },
                select: { userId: true },
              });
              customerUserId = profile?.userId || undefined;
            }
            const tenant = await this.prisma.tenant.findUnique({
              where: { id: updatedOrder.tenantId },
              select: { name: true },
            });
            await this.notificationService.sendFromTemplate({
              tenantId: updatedOrder.tenantId,
              key: templateKey,
              userId: customerUserId,
              emailTo: updatedOrder.email,
              type: 'ORDER',
              link: `/account/orders`,
              vars: {
                customer_name:
                  updatedOrder.shippingAddress?.name ||
                  updatedOrder.customerName ||
                  updatedOrder.email ||
                  '',
                order_number: updatedOrder.number,
                total_amount: `৳${Number(updatedOrder.total || 0).toLocaleString('en-BD')}`,
                store_name: tenant?.name || 'Store',
                payment_method: String(updatedOrder.paymentMethod || '—'),
                courier_name:
                  dto.courier || updatedOrder.courier || 'Courier',
                tracking_number:
                  dto.trackingNumber || updatedOrder.trackingNumber || '—',
                shipping_address: [
                  updatedOrder.shippingAddress?.line1,
                  updatedOrder.shippingAddress?.area,
                  updatedOrder.shippingAddress?.district,
                ]
                  .filter(Boolean)
                  .join(', '),
                items_summary: '',
              },
            });
          } catch (err) {
            this.logger.error('Failed to send status update notification', err);
          }
        })();
      }
    }

    return ResponseHelper.success(updatedOrder, 'Order status updated successfully');
  }

  // Add an internal or customer-facing note to the order
  async addOrderNote(
    id: string,
    dto: AddOrderNoteDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        OR: [{ id }, { number: id }],
        ...(tenantId ? { tenantId } : {}),
        deletedAt: null,
      },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with identifier "${id}" not found`);
    }

    const adminName = adminUser?.name || adminUser?.email || 'Admin';

    const note = await this.prisma.orderNote.create({
      data: {
        orderId: existingOrder.id,
        text: dto.text,
        internal: dto.internal !== false,
        by: adminName,
      },
    });

    return ResponseHelper.created(note, 'Order note added successfully');
  }

  // Verify or reject manual customer bKash/Nagad payment
  async verifyManualPayment(
    id: string,
    approved: boolean,
    note?: string,
    tenantId?: string,
    user?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id }, { number: id }],
        ...(targetTenantId ? { tenantId: targetTenantId } : {}),
        deletedAt: null,
      },
      include: { attempts: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with identifier "${id}" not found`);
    }

    const actorName = user?.name || user?.email || 'Store Owner';

    if (approved) {
      const updated = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status:
            order.status === OrderStatus.PENDING_PAYMENT
              ? OrderStatus.CONFIRMED
              : order.status,
          timeline: {
            create: {
              label: 'Manual Payment Verified & Approved',
              note: note || `Payment verified by ${actorName}`,
              by: actorName,
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
          timeline: { orderBy: { createdAt: 'asc' } },
          attempts: true,
        },
      });

      if (order.attempts.length > 0) {
        await this.prisma.paymentAttempt.update({
          where: { id: order.attempts[0].id },
          data: { status: PaymentStatus.PAID },
        });
      }

      if (order.status === OrderStatus.PENDING_PAYMENT) {
        (async () => {
          try {
            let customerUserId: string | undefined;
            if (order.customerId) {
              const profile = await this.prisma.customerProfile.findUnique({
                where: { id: order.customerId },
                select: { userId: true },
              });
              customerUserId = profile?.userId || undefined;
            }
            const tenant = await this.prisma.tenant.findUnique({
              where: { id: order.tenantId },
              select: { name: true },
            });
            await this.notificationService.sendFromTemplate({
              tenantId: order.tenantId,
              key: 'ORDER_CONFIRMED',
              userId: customerUserId,
              emailTo: order.email,
              type: 'ORDER',
              link: `/account/orders`,
              vars: {
                customer_name:
                  updated.shippingAddress?.name ||
                  order.customerName ||
                  order.email ||
                  '',
                order_number: order.number,
                total_amount: `৳${Number(order.total || 0).toLocaleString('en-BD')}`,
                store_name: tenant?.name || 'Store',
                payment_method: String(order.paymentMethod || '—'),
              },
            });
          } catch (err) {
            this.logger.error('Failed to send payment-approved notification', err);
          }
        })();
      }

      return ResponseHelper.success(
        updated,
        'Payment verified and order updated to PAID successfully',
      );
    } else {
      const updated = await this.prisma.$transaction(async (tx) => {
        const failed = await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            status: OrderStatus.FAILED,
            timeline: {
              create: {
                label: 'Manual Payment Rejected / Invalid TrxID',
                note: note || `Rejected by ${actorName}`,
                by: actorName,
              },
            },
          },
          include: {
            items: true,
            shippingAddress: true,
            timeline: { orderBy: { createdAt: 'asc' } },
            attempts: true,
          },
        });

        if (order.attempts.length > 0) {
          await tx.paymentAttempt.update({
            where: { id: order.attempts[0].id },
            data: { status: PaymentStatus.FAILED },
          });
        }

        await this.restoreOrderStock(
          tx,
          failed,
          StockMovementReason.CORRECTION,
          actorName,
          'Stock restored — payment rejected',
        );

        return failed;
      });

      (async () => {
        try {
          let customerUserId: string | undefined;
          if (order.customerId) {
            const profile = await this.prisma.customerProfile.findUnique({
              where: { id: order.customerId },
              select: { userId: true },
            });
            customerUserId = profile?.userId || undefined;
          }
          const tenant = await this.prisma.tenant.findUnique({
            where: { id: order.tenantId },
            select: { name: true },
          });
          await this.notificationService.sendFromTemplate({
            tenantId: order.tenantId,
            key: 'PAYMENT_FAILED',
            userId: customerUserId,
            emailTo: order.email,
            type: 'PAYMENT',
            link: `/account/orders`,
            vars: {
              customer_name:
                updated.shippingAddress?.name ||
                order.customerName ||
                order.email ||
                '',
              order_number: order.number,
              total_amount: `৳${Number(order.total || 0).toLocaleString('en-BD')}`,
              store_name: tenant?.name || 'Store',
              payment_method: String(order.paymentMethod || '—'),
            },
          });
        } catch (err) {
          this.logger.error('Failed to send payment-rejected notification', err);
        }
      })();

      return ResponseHelper.success(
        updated,
        'Payment marked as rejected/failed',
      );
    }
  }

  /**
   * Record a manual refund (owner already sent money via bKash/Nagad, or COD never collected).
   * Updates refunded amount + payment/order status; optional restock.
   */
  async refundOrder(
    id: string,
    dto: RefundOrderDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        OR: [{ id }, { number: id }],
        ...(tenantId ? { tenantId } : {}),
        deletedAt: null,
      },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with identifier "${id}" not found`);
    }

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Refund amount must be greater than zero');
    }

    const alreadyRefunded = Number(existingOrder.refunded) || 0;
    const total = Number(existingOrder.total) || 0;
    const refundable = Math.max(0, total - alreadyRefunded);
    if (amount > refundable + 0.001) {
      throw new BadRequestException(
        `Maximum refundable amount is ৳${refundable.toLocaleString('en-BD')}`,
      );
    }

    const adminName = adminUser?.name || adminUser?.email || 'Admin';
    const newRefunded = alreadyRefunded + amount;
    const full = newRefunded >= total - 0.001;
    const reason = (dto.reason || 'Customer request').trim();

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          refunded: newRefunded,
          status: full ? OrderStatus.REFUNDED : OrderStatus.PARTIALLY_REFUNDED,
          paymentStatus: full
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED,
          timeline: {
            create: {
              label: `Refund of ৳${amount.toLocaleString('en-BD')} recorded`,
              note: `${reason}${dto.restock ? ' · stock restored' : ''} (manual payout — no gateway)`,
              by: adminName,
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
          attempts: true,
          timeline: { orderBy: { createdAt: 'asc' } },
        },
      });

      if (dto.restock) {
        await this.restoreOrderStock(
          tx,
          order,
          StockMovementReason.RETURN,
          adminName,
          `Stock restored — refund on ${order.number}`,
        );
      }

      return order;
    });

    return ResponseHelper.success(
      updated,
      full
        ? 'Full refund recorded on order'
        : 'Partial refund recorded on order',
    );
  }
}



