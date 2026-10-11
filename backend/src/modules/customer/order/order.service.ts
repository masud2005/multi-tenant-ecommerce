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
} from '../../../../prisma/generated/client';
import { ResponseHelper } from '../../../common/helpers/response.helper';

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
      const profileName = user.name || (user.email ? user.email.split('@')[0] : 'Customer');
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
    return `TN-${nextSeq}`;
  }

  // Step-by-step order creation workflow
  async createOrder(
    tenantId: string | undefined,
    userId: string | null | undefined,
    dto: CreateOrderDto,
  ) {
    // Step 1: Resolve tenant and customer identities
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const resolvedCustomerId = await this.resolveCustomerId(userId, resolvedTenantId);

    // Step 2: Extract recipient information with fallback to shippingAddress
    const customerName = dto.customerName || dto.shippingAddress?.name;
    const phone = dto.phone || dto.shippingAddress?.phone;
    const email = dto.email || '';

    if (!customerName) {
      throw new BadRequestException('Recipient name is required');
    }
    if (!phone) {
      throw new BadRequestException('Recipient contact phone number is required');
    }
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Step 3: Check valid product and variant IDs in database to prevent foreign key constraint violations
    const validProductIds = new Set<string>();
    const validVariantIds = new Set<string>();

    const productIdsToCheck = dto.items
      .map((i) => i.productId)
      .filter((id): id is string => Boolean(id));
    if (productIdsToCheck.length > 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: productIdsToCheck }, tenantId: resolvedTenantId, deletedAt: null },
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
          status: isCod
            ? OrderStatus.CONFIRMED
            : dto.paymentStatus === PaymentStatus.PAID
            ? OrderStatus.CONFIRMED
            : OrderStatus.PENDING_PAYMENT,
          fulfillmentStatus: FulfillmentStatus.UNFULFILLED,
          paymentStatus: dto.paymentStatus ?? PaymentStatus.PENDING,
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
              productId: item.productId && validProductIds.has(item.productId) ? item.productId : null,
              variantId: item.variantId && validVariantIds.has(item.variantId) ? item.variantId : null,
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
                ? [{ label: 'Order confirmed (Cash on delivery)', by: 'System' }]
                : dto.paymentStatus === PaymentStatus.PAID
                ? [{ label: 'Payment verified with gateway', by: 'System' }]
                : []),
            ],
          },
        },
        include: {
          shippingAddress: true,
          items: true,
          timeline: true,
        },
      });

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

    this.logger.log(`Order ${createdOrder.number} created successfully for tenant ${resolvedTenantId}`);

    // Trigger Notification Events asynchronously (does not block order response)
    (async () => {
      try {
        const customerDisplayName =
          createdOrder.shippingAddress?.name ||
          createdOrder.customerName ||
          createdOrder.email ||
          'Customer';

        // Event 1.A: Notify store owner & active staff members (In-App + Email)
        const staffMembers = await this.prisma.tenantMember.findMany({
          where: {
            tenantId: resolvedTenantId,
            deletedAt: null,
            status: 'active',
          },
          include: { user: true },
        });

        for (const member of staffMembers) {
          if (member.userId) {
            await this.notificationService.send({
              tenantId: resolvedTenantId,
              userId: member.userId,
              title: `New Order #${createdOrder.number}`,
              message: `${customerDisplayName} placed an order for ৳${createdOrder.total}`,
              type: 'ORDER',
              link: `/admin/orders`,
              email: member.user?.email
                ? {
                    to: member.user.email,
                    subject: `[New Order] #${createdOrder.number} received (৳${createdOrder.total})`,
                    html: `<h2>New Order Received!</h2><p>Order <b>#${createdOrder.number}</b> has been placed by <b>${customerDisplayName}</b>.</p><p>Total Amount: <b>৳${createdOrder.total}</b></p><p>Payment Method: ${createdOrder.paymentMethod}</p>`,
                  }
                : undefined,
            });
          }
        }

        // Event 1.B: Send order confirmation to Customer if email is present
        if (createdOrder.email) {
          await this.notificationService.send({
            tenantId: resolvedTenantId,
            userId: createdOrder.customerId || '',
            title: `Order Confirmation #${createdOrder.number}`,
            message: `Thank you for your order! Total: ৳${createdOrder.total}`,
            type: 'ORDER',
            link: `/account/orders`,
            email: {
              to: createdOrder.email,
              subject: `Order Confirmation #${createdOrder.number}`,
              html: `<h2>Thank you for your order!</h2><p>Hi ${customerDisplayName},</p><p>Your order <b>#${createdOrder.number}</b> has been received and is being processed.</p><p>Total Amount: <b>৳${createdOrder.total}</b></p>`,
            },
          });
        }

        // Event 3: Low Stock Alert Check
        for (const item of dto.items) {
          if (item.variantId) {
            const variant = await this.prisma.productVariant.findUnique({
              where: { id: item.variantId },
              include: { product: true },
            });

            const threshold = variant?.lowStockThreshold ?? 5;
            if (variant && variant.stock <= threshold) {
              const owners = staffMembers.filter((m) => m.isOwner);
              const variantName = `${variant.color ? `${variant.color} - ` : ''}${variant.size || variant.sku || 'Default'}`;
              for (const owner of owners) {
                await this.notificationService.send({
                  tenantId: resolvedTenantId,
                  userId: owner.userId,
                  title: `Low Stock Alert: ${variant.product?.title || 'Product'}`,
                  message: `Stock for variant "${variantName}" is low (${variant.stock} units remaining).`,
                  type: 'INVENTORY',
                  link: `/admin/inventory`,
                });
              }
            }
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
                ...(userEmail ? [{ email: { equals: userEmail, mode: 'insensitive' as const } }] : []),
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

    return ResponseHelper.success(orders, 'Customer orders retrieved successfully');
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

    return ResponseHelper.success(order, 'Order details retrieved successfully');
  }
}


