import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  FulfillmentStatus,
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  StockMovementReason,
} from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';

function asJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

const CUSTOMER_CANCELLABLE: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  // Helper to resolve active tenant ID
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
      throw new NotFoundException('Active store tenant not found');
    }

    return defaultTenant.id;
  }

  // Helper to resolve customer profile ID if user is authenticated
  private async resolveCustomerId(
    userIdOrCustomerId: string | null | undefined,
    tenantId: string,
  ): Promise<string | null> {
    if (!userIdOrCustomerId) return null;

    // Check direct CustomerProfile ID match
    const profileById = await this.prisma.customerProfile.findFirst({
      where: {
        id: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (profileById) return profileById.id;

    // Check Auth User ID match
    const profileByUserId = await this.prisma.customerProfile.findFirst({
      where: {
        userId: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (profileByUserId) return profileByUserId.id;

    // Auto-upsert customer profile if auth user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userIdOrCustomerId },
    });
    if (user) {
      const userEmail = user.email || `${user.id}@customer.store`;
      const profileName =
        user.name || (user.email ? user.email.split('@')[0] : 'Customer');
      const newProfile = await this.prisma.customerProfile.upsert({
        where: {
          tenantId_email: {
            tenantId,
            email: userEmail,
          },
        },
        update: {
          userId: user.id,
          name: profileName,
        },
        create: {
          tenantId,
          userId: user.id,
          email: userEmail,
          name: profileName,
        },
      });
      return newProfile.id;
    }

    return null;
  }

  // Helper to generate sequential unique order number
  private async generateOrderNumber(tenantId: string): Promise<string> {
    const totalOrders = await this.prisma.order.count({
      where: { tenantId },
    });
    const nextSeq = 10500 + totalOrders;
    return `OR-${nextSeq}`;
  }

  // Step-by-step order creation workflow
  async createOrder(
    tenantId: string | undefined,
    userId: string | null | undefined,
    dto: CreateOrderDto,
  ) {
    // Step 1: Resolve tenant and customer identities
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const resolvedCustomerId = await this.resolveCustomerId(
      userId,
      resolvedTenantId,
    );

    // Step 2: Extract recipient information with fallback to shippingAddress
    const customerName = dto.customerName || dto.shippingAddress?.name;
    const phone = dto.phone || dto.shippingAddress?.phone;
    const email = dto.email || '';

    if (!customerName) {
      throw new BadRequestException('Recipient name is required');
    }
    if (!phone) {
      throw new BadRequestException(
        'Recipient contact phone number is required',
      );
    }
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const allowedMethods = new Set<PaymentMethod>([
      PaymentMethod.COD,
      PaymentMethod.BKASH,
      PaymentMethod.NAGAD,
    ]);
    if (!allowedMethods.has(dto.paymentMethod)) {
      throw new BadRequestException(
        'Only Cash on delivery, bKash and Nagad are supported',
      );
    }

    const tenantSettings = await this.prisma.tenant.findUnique({
      where: { id: resolvedTenantId },
      select: { settings: true },
    });
    const settings = asJsonObject(tenantSettings?.settings);
    const payCfg = asJsonObject(settings.payment);
    const pmCfg = asJsonObject(settings.pm);
    const methodEnabled = {
      [PaymentMethod.COD]:
        typeof payCfg.codEnabled === 'boolean'
          ? payCfg.codEnabled
          : typeof pmCfg.cod === 'boolean'
            ? pmCfg.cod
            : true,
      [PaymentMethod.BKASH]:
        typeof payCfg.bkashEnabled === 'boolean'
          ? payCfg.bkashEnabled
          : typeof pmCfg.bkash === 'boolean'
            ? pmCfg.bkash
            : true,
      [PaymentMethod.NAGAD]:
        typeof payCfg.nagadEnabled === 'boolean'
          ? payCfg.nagadEnabled
          : typeof pmCfg.nagad === 'boolean'
            ? pmCfg.nagad
            : true,
    };
    const enabledForMethod =
      dto.paymentMethod === PaymentMethod.COD ||
      dto.paymentMethod === PaymentMethod.BKASH ||
      dto.paymentMethod === PaymentMethod.NAGAD
        ? methodEnabled[dto.paymentMethod]
        : false;
    if (!enabledForMethod) {
      throw new BadRequestException(
        `${dto.paymentMethod} is not enabled for this store`,
      );
    }

    const isManualMfs =
      dto.paymentMethod === PaymentMethod.BKASH ||
      dto.paymentMethod === PaymentMethod.NAGAD;
    if (isManualMfs) {
      const sender = String(dto.senderPhone || '').trim();
      const trx = String(dto.transactionId || '').trim();
      if (!sender || !/^01[3-9]\d{8}$/.test(sender.replace(/-/g, ''))) {
        throw new BadRequestException(
          'A valid sender mobile number is required for bKash/Nagad',
        );
      }
      if (!trx || trx.length < 5) {
        throw new BadRequestException(
          'Transaction ID (TrxID) is required for bKash/Nagad',
        );
      }
    }

    // Step 3: Check valid product and variant IDs in database to prevent foreign key constraint violations
    const validProductIds = new Set<string>();
    const validVariantIds = new Set<string>();

    const productIdsToCheck = dto.items
      .map((i) => i.productId)
      .filter((id): id is string => Boolean(id));
    if (productIdsToCheck.length > 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: {
          id: { in: productIdsToCheck },
          tenantId: resolvedTenantId,
          deletedAt: null,
        },
        select: { id: true },
      });
      existingProducts.forEach((p) => validProductIds.add(p.id));
    }

    const variantIdsToCheck = dto.items
      .map((i) => i.variantId)
      .filter((id): id is string => Boolean(id));
    if (variantIdsToCheck.length > 0) {
      const existingVariants = await this.prisma.productVariant.findMany({
        where: { id: { in: variantIdsToCheck } },
        select: { id: true },
      });
      existingVariants.forEach((v) => validVariantIds.add(v.id));
    }

    // Step 4: Generate sequential unique order number
    const orderNumber = await this.generateOrderNumber(resolvedTenantId);
    const isCod = dto.paymentMethod === PaymentMethod.COD;

    // Step 5: Execute database transaction for atomic order creation
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // 5.1: Create main order record with linked address, items, and timeline
      const order = await tx.order.create({
        data: {
          tenantId: resolvedTenantId,
          number: orderNumber,
          customerId: resolvedCustomerId,
          customerName,
          email,
          phone,
          subtotal: dto.subtotal,
          discount: dto.discount ?? 0,
          shipping: dto.shippingCost,
          tax: 0,
          total: dto.total,
          status: isCod ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          // Never trust client-paid for checkout; owner verifies MFS / collects COD
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          couponCode: dto.couponCode,
          channel: OrderChannel.ONLINE,
          shippingMethod: dto.shippingMethod,
          customerNote: dto.customerNote,

          // Link delivery shipping address
          shippingAddress: {
            create: {
              name: dto.shippingAddress.name,
              phone: dto.shippingAddress.phone,
              line1: dto.shippingAddress.line1,
              area: dto.shippingAddress.area,
              district: dto.shippingAddress.district,
            },
          },

          // Link line items with safe foreign keys
          items: {
            create: dto.items.map((item) => ({
              productId:
                item.productId && validProductIds.has(item.productId)
                  ? item.productId
                  : null,
              variantId:
                item.variantId && validVariantIds.has(item.variantId)
                  ? item.variantId
                  : null,
              title: item.title,
              image: item.image,
              color: item.color,
              size: item.size,
              sku: item.sku,
              price: item.price,
              qty: item.qty,
            })),
          },

          // Create initial audit timeline events
          timeline: {
            create: [
              {
                label: 'Order placed by customer',
                by: 'Customer',
              },
              ...(isCod
                ? [
                    {
                      label: 'Order confirmed (Cash on delivery)',
                      by: 'System',
                    },
                  ]
                : [
                    {
                      label: `Manual ${dto.paymentMethod} payment submitted`,
                      note: `Sender Phone: ${String(dto.senderPhone || '').trim()}, TrxID: ${String(dto.transactionId || '').trim()} (Awaiting owner verification)`,
                      by: 'Customer',
                    },
                  ]),
            ],
          },
        },
        include: {
          shippingAddress: true,
          items: true,
          timeline: true,
        },
      });

      // Record manual payment attempt if bKash or Nagad was selected
      if (
        dto.paymentMethod === PaymentMethod.BKASH ||
        dto.paymentMethod === PaymentMethod.NAGAD
      ) {
        await tx.paymentAttempt.create({
          data: {
            orderId: order.id,
            method: dto.paymentMethod,
            amount: dto.total,
            status: PaymentStatus.PENDING,
            gatewayRef: JSON.stringify({
              senderPhone: String(dto.senderPhone || '').trim(),
              transactionId: String(dto.transactionId || '').trim(),
            }),
          },
        });
      }

      // 5.2: Decrement inventory stock for each purchased variant if valid in database
      for (const item of dto.items) {
        if (item.variantId && validVariantIds.has(item.variantId)) {
          await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              stock: { gte: item.qty },
            },
            data: {
              stock: { decrement: item.qty },
            },
          });
        }
      }

      // 4.3: Track coupon redemption if discount was applied
      if (dto.couponCode && dto.discount && dto.discount > 0) {
        const discountRecord = await tx.discount.findFirst({
          where: {
            tenantId: resolvedTenantId,
            code: dto.couponCode.toUpperCase(),
            deletedAt: null,
          },
        });

        if (discountRecord) {
          await tx.discountRedemption.create({
            data: {
              tenantId: resolvedTenantId,
              discountId: discountRecord.id,
              orderId: order.id,
              userId: resolvedCustomerId,
              customerEmail: email || null,
              discountedAmount: dto.discount,
            },
          });

          await tx.discount.update({
            where: { id: discountRecord.id },
            data: {
              usedCount: { increment: 1 },
              revenue: { increment: order.total },
            },
          });
        }
      }

      return order;
    });

    this.logger.log(
      `Order ${createdOrder.number} created successfully for tenant ${resolvedTenantId}`,
    );

    // Trigger Notification Events asynchronously (does not block order response)
    void (async () => {
      try {
        const toNum = (v: unknown) => Number(v) || 0;
        const customerDisplayName =
          createdOrder.shippingAddress?.name ||
          createdOrder.customerName ||
          createdOrder.email ||
          '';

        const tenant = await this.prisma.tenant.findUnique({
          where: { id: resolvedTenantId },
          select: { name: true },
        });

        // Resolve User id for in-app notify (CustomerProfile.id ≠ User.id)
        let customerUserId: string | undefined;
        if (createdOrder.customerId) {
          const profile = await this.prisma.customerProfile.findUnique({
            where: { id: createdOrder.customerId },
            select: { userId: true },
          });
          customerUserId = profile?.userId || undefined;
        }
        if (!customerUserId && userId) {
          customerUserId = userId;
        }

        const itemsSummary = (createdOrder.items || [])
          .map((item) => item.title)
          .filter(Boolean)
          .slice(0, 4)
          .join(', ');
        const shippingAddress = [
          createdOrder.shippingAddress?.line1,
          createdOrder.shippingAddress?.area,
          createdOrder.shippingAddress?.district,
        ]
          .filter(Boolean)
          .join(', ');
        const orderVars = {
          customer_name: customerDisplayName,
          order_number: createdOrder.number,
          total_amount: `৳${toNum(createdOrder.total).toLocaleString('en-BD')}`,
          items_summary: itemsSummary || 'Items',
          shipping_address: shippingAddress || '—',
          store_name: tenant?.name || 'Store',
          payment_method: String(createdOrder.paymentMethod || '—'),
        };

        const staffMembers = await this.prisma.tenantMember.findMany({
          where: {
            tenantId: resolvedTenantId,
            deletedAt: null,
            status: 'active',
          },
          include: { user: true },
        });

        for (const member of staffMembers) {
          if (!member.userId) continue;
          await this.notificationService.sendFromTemplate({
            tenantId: resolvedTenantId,
            key: 'NEW_ORDER',
            userId: member.userId,
            emailTo: member.user?.email,
            type: 'ORDER',
            link: `/admin/orders`,
            vars: orderVars,
          });
        }

        // COD is confirmed immediately; manual MFS waits for owner verify → ORDER_CONFIRMED
        if (isCod) {
          await this.notificationService.sendFromTemplate({
            tenantId: resolvedTenantId,
            key: 'ORDER_CONFIRMED',
            userId: customerUserId,
            emailTo: createdOrder.email,
            type: 'ORDER',
            link: `/account/orders`,
            vars: orderVars,
          });
        }

        for (const item of dto.items) {
          if (!item.variantId) continue;
          const variant = await this.prisma.productVariant.findUnique({
            where: { id: item.variantId },
            include: { product: true },
          });

          const threshold = variant?.lowStockThreshold ?? 5;
          if (!variant || variant.stock > threshold) continue;

          const owners = staffMembers.filter((m) => m.isOwner);
          const variantName = `${variant.color ? `${variant.color} - ` : ''}${variant.size || variant.sku || 'Default'}`;
          for (const owner of owners) {
            await this.notificationService.sendFromTemplate({
              tenantId: resolvedTenantId,
              key: 'LOW_STOCK',
              userId: owner.userId,
              emailTo: owner.user?.email,
              type: 'INVENTORY',
              link: `/admin/inventory`,
              vars: {
                product_title: variant.product?.title || 'Product',
                variant_name: variantName,
                remaining_stock: String(variant.stock),
              },
            });
          }
        }
      } catch (err) {
        this.logger.error('Failed to dispatch order notifications', err);
      }
    })();

    return ResponseHelper.created(createdOrder, 'Order created successfully');
  }

  // Fetch all orders for a specific customer
  async getCustomerOrders(userId: string, tenantId?: string) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const customerId = await this.resolveCustomerId(userId, resolvedTenantId);

    // Look up user email to also match orders placed with customer's email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const userEmail = user?.email;

    // Step 1: Filter database by tenant and (customer ID or customer email)
    // Step 2: Include items and delivery shipping address
    // Step 3: Sort by creation date descending (newest to oldest)
    const orders = await this.prisma.order.findMany({
      where: {
        tenantId: resolvedTenantId,
        deletedAt: null,
        ...(customerId || userEmail
          ? {
              OR: [
                ...(customerId ? [{ customerId }] : []),
                ...(userEmail
                  ? [
                      {
                        email: {
                          equals: userEmail,
                          mode: 'insensitive' as const,
                        },
                      },
                    ]
                  : []),
              ],
            }
          : { id: 'impossible_empty_match' }),
      },
      include: {
        shippingAddress: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ResponseHelper.success(
      orders,
      'Customer orders retrieved successfully',
    );
  }

  // Fetch details of a specific order by its order number
  async getOrderByNumber(
    orderNumber: string,
    tenantId?: string,
    userId?: string,
  ) {
    if (!orderNumber) {
      throw new BadRequestException('Order number is required');
    }

    const resolvedTenantId = await this.resolveTenantId(tenantId);

    // Step 1: Find the exact order using order number and tenant ID
    // Step 2: Include items, delivery shipping address, timeline, and payment history
    const order = await this.prisma.order.findUnique({
      where: {
        tenantId_number: {
          tenantId: resolvedTenantId,
          number: orderNumber,
        },
      },
      include: {
        shippingAddress: true,
        items: true,
        timeline: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        attempts: true,
      },
    });

    if (!order || order.deletedAt) {
      throw new NotFoundException(`Order #${orderNumber} not found`);
    }

    // Step 3: If authenticated customer, verify access permission
    if (userId) {
      const customerId = await this.resolveCustomerId(userId, resolvedTenantId);
      if (customerId && order.customerId && order.customerId !== customerId) {
        throw new NotFoundException(`Order #${orderNumber} not found`);
      }
    }

    return ResponseHelper.success(
      order,
      'Order details retrieved successfully',
    );
  }

  private async restoreOrderStock(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      number: string;
      tenantId: string;
      items: Array<{ variantId: string | null; qty: number }>;
    },
    by: string,
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
          reason: StockMovementReason.CORRECTION,
          ref: order.number,
          note: 'Stock restored — customer cancelled order',
          by,
        },
      });
    }
  }

  /**
   * Customer self-cancel before pack/ship. Restores stock.
   * Prepaid (paid) orders stay PAID until the owner records a manual refund.
   */
  async cancelOrder(
    orderNumberOrId: string,
    userId: string,
    tenantId?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const customerId = await this.resolveCustomerId(userId, resolvedTenantId);

    if (!customerId) {
      throw new NotFoundException('Customer profile not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const order = await this.prisma.order.findFirst({
      where: {
        tenantId: resolvedTenantId,
        deletedAt: null,
        OR: [{ id: orderNumberOrId }, { number: orderNumberOrId }],
      },
      include: { items: true, shippingAddress: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const ownsByProfile = order.customerId === customerId;
    const ownsByEmail =
      !!user?.email &&
      !!order.email &&
      order.email.toLowerCase() === user.email.toLowerCase();
    if (!ownsByProfile && !ownsByEmail) {
      throw new NotFoundException('Order not found');
    }

    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      throw new BadRequestException(
        'This order can no longer be cancelled. Contact the store if you need help.',
      );
    }

    const actorName = user?.name || user?.email || 'Customer';
    const wasPaid =
      order.paymentStatus === PaymentStatus.PAID ||
      order.paymentStatus === PaymentStatus.PARTIALLY_REFUNDED;

    const updated = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          paymentStatus: wasPaid
            ? order.paymentStatus
            : PaymentStatus.CANCELLED,
          timeline: {
            create: {
              label: wasPaid
                ? 'Order cancelled by customer — prepaid amount pending manual refund'
                : 'Order cancelled by customer — stock restored',
              by: actorName,
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

      await this.restoreOrderStock(tx, cancelled, actorName);
      return cancelled;
    });

    void (async () => {
      try {
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: updated.tenantId },
          select: { name: true },
        });
        await this.notificationService.sendFromTemplate({
          tenantId: updated.tenantId,
          key: 'ORDER_CANCELLED',
          userId,
          emailTo: updated.email,
          type: 'ORDER',
          link: `/account/orders`,
          vars: {
            customer_name:
              updated.shippingAddress?.name ||
              updated.customerName ||
              updated.email ||
              '',
            order_number: updated.number,
            total_amount: `৳${Number(updated.total || 0).toLocaleString('en-BD')}`,
            store_name: tenant?.name || 'Store',
            payment_method: String(updated.paymentMethod || '—'),
          },
        });
      } catch (err) {
        this.logger.error('Failed to send cancel notification', err);
      }
    })();

    return ResponseHelper.success(updated, 'Order cancelled successfully');
  }
}
