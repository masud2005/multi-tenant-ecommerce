import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import {
  OrderQueryDto,
  UpdateOrderStatusDto,
  AddOrderNoteDto,
  CreateDraftOrderDto,
} from './dto';
import {
  OrderStatus,
  PaymentStatus,
  FulfillmentStatus,
  PaymentMethod,
  OrderChannel,
} from '../../../../prisma/generated/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Auto-resolve payment for COD on delivery if not explicitly specified
    let targetPaymentStatus = dto.paymentStatus;
    let codCollected = existingOrder.codCollected;
    if (
      (dto.status === OrderStatus.DELIVERED || (!dto.status && existingOrder.status === OrderStatus.DELIVERED)) &&
      existingOrder.paymentMethod === PaymentMethod.COD &&
      !targetPaymentStatus
    ) {
      targetPaymentStatus = PaymentStatus.PAID;
      codCollected = true;
    }

    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status: targetStatus,
          ...(derivedFulfillmentStatus ? { fulfillmentStatus: derivedFulfillmentStatus } : {}),
          ...(targetPaymentStatus ? { paymentStatus: targetPaymentStatus, codCollected } : {}),
          ...(dto.courier ? { courier: dto.courier } : {}),
          ...(dto.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
        },
        include: {
          items: true,
          shippingAddress: true,
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

      return order;
    });

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

  // Helper to generate sequential unique manual order number
  private async generateManualOrderNumber(tenantId: string): Promise<string> {
    const totalOrders = await this.prisma.order.count({
      where: { tenantId },
    });
    const nextSeq = 10500 + totalOrders + 1;
    return `TN-${nextSeq}`;
  }

  // Create draft or manual order by staff
  async createDraftOrder(
    dto: CreateDraftOrderDto,
    tenantId?: string,
    adminUser?: any,
  ) {
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

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Draft order must contain at least one product');
    }

    // Resolve customer profile safely if exists in database
    let resolvedCustomerId: string | null = null;
    if (dto.customerId) {
      const existingCustomerById = await this.prisma.customerProfile.findFirst({
        where: {
          id: dto.customerId,
          tenantId: targetTenantId,
          deletedAt: null,
        },
      });
      if (existingCustomerById) {
        resolvedCustomerId = existingCustomerById.id;
      }
    }

    if (!resolvedCustomerId && dto.email?.trim()) {
      const existingCustomer = await this.prisma.customerProfile.findFirst({
        where: {
          tenantId: targetTenantId,
          email: { equals: dto.email.trim(), mode: 'insensitive' },
          deletedAt: null,
        },
      });
      if (existingCustomer) {
        resolvedCustomerId = existingCustomer.id;
      }
    }

    // Check valid product and variant IDs in database to avoid foreign key errors
    const validProductIds = new Set<string>();
    const validVariantIds = new Set<string>();

    const productIdsToCheck = dto.items
      .map((i) => i.productId)
      .filter((id): id is string => Boolean(id));
    if (productIdsToCheck.length > 0) {
      const existingProducts = await this.prisma.product.findMany({
        where: { id: { in: productIdsToCheck }, tenantId: targetTenantId, deletedAt: null },
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

    // Financial calculations
    const subtotal = dto.items.reduce(
      (sum, item) => sum + Number(item.price) * item.qty,
      0,
    );
    const discount = Number(dto.discount || 0);
    const shipping = Number(dto.shippingFee || 0);
    const total = Math.max(0, subtotal - discount + shipping);

    const isPaid = dto.mode === 'paid';
    const initialStatus = isPaid ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT;
    const initialPaymentStatus = isPaid ? PaymentStatus.PAID : PaymentStatus.PENDING;
    const initialFulfillmentStatus = FulfillmentStatus.UNFULFILLED;
    const paymentMethod = dto.paymentMethod || PaymentMethod.COD;

    const orderNumber = await this.generateManualOrderNumber(targetTenantId);
    const adminName = adminUser?.name || adminUser?.email || 'Admin';

    const createdOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Create main Order record
      const order = await tx.order.create({
        data: {
          tenantId: targetTenantId,
          number: orderNumber,
          customerId: resolvedCustomerId,
          customerName: dto.customerName.trim(),
          email: dto.email?.trim() || '',
          phone: dto.phone.trim(),
          subtotal,
          discount,
          shipping,
          tax: 0,
          total,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          fulfillmentStatus: initialFulfillmentStatus,
          paymentMethod,
          couponCode: dto.couponCode || null,
          channel: OrderChannel.MANUAL,
          codCollected: isPaid && paymentMethod === PaymentMethod.COD,
          customerNote: dto.customerNote || null,
          shippingMethod: shipping > 0 ? 'Home delivery' : 'Standard delivery',

          // 2. Create shipping address if provided
          ...(dto.shippingAddress
            ? {
                shippingAddress: {
                  create: {
                    name: dto.shippingAddress.name.trim(),
                    phone: dto.shippingAddress.phone.trim(),
                    line1: dto.shippingAddress.line1.trim(),
                    area: dto.shippingAddress.area.trim(),
                    district: dto.shippingAddress.district.trim(),
                  },
                },
              }
            : {}),

          // 3. Create items
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
              image: item.image || null,
              color: item.color || null,
              size: item.size || null,
              sku: item.sku || `MAN-${Math.floor(Math.random() * 9000 + 1000)}`,
              price: item.price,
              qty: item.qty,
            })),
          },

          // 4. Create timeline audit trail
          timeline: {
            create: [
              {
                label: `Order created manually by staff [${adminName}]`,
                by: adminName,
                note: dto.mode === 'invoice' ? 'Invoice sent with payment link' : undefined,
              },
              ...(isPaid
                ? [
                    {
                      label: `Payment marked as received by staff [${adminName}]`,
                      by: adminName,
                    },
                  ]
                : []),
            ],
          },

          // 5. Create staff note if provided
          ...(dto.staffNote?.trim()
            ? {
                notes: {
                  create: {
                    text: dto.staffNote.trim(),
                    by: adminName,
                    internal: true,
                  },
                },
              }
            : {}),
        },
        include: {
          items: true,
          shippingAddress: true,
          timeline: {
            orderBy: { createdAt: 'asc' },
          },
          notes: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // 6. Deduct variant stock if variantId is linked in database
      for (const item of dto.items) {
        if (item.variantId && validVariantIds.has(item.variantId)) {
          await tx.productVariant.updateMany({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.qty },
            },
          });
        }
      }

      return order;
    });

    return ResponseHelper.created(
      createdOrder,
      dto.mode === 'invoice'
        ? 'Draft order created and invoice ready'
        : 'Manual order created and marked as paid successfully',
    );
  }

  // Fetch all draft and manual orders for tenant
  async getDraftOrders(query: OrderQueryDto, tenantId?: string) {
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
      channel: OrderChannel.MANUAL,
      deletedAt: null,
    };

    // Keyword search across draft number, customer name, email, and phone
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { number: { contains: s, mode: 'insensitive' } },
        { customerName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }

    // Filter by order status (e.g. pending_payment for open drafts)
    if (query.status) {
      where.status = query.status;
    }

    // Filter by payment status
    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [drafts, total, openCount, completedCount, cancelledCount] =
      await Promise.all([
        this.prisma.order.findMany({
          where,
          include: {
            items: true,
            shippingAddress: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            timeline: {
              orderBy: { createdAt: 'asc' },
            },
            notes: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where }),
        this.prisma.order.count({
          where: {
            tenantId: targetTenantId,
            channel: OrderChannel.MANUAL,
            status: OrderStatus.PENDING_PAYMENT,
            deletedAt: null,
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId: targetTenantId,
            channel: OrderChannel.MANUAL,
            status: { notIn: [OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED] },
            deletedAt: null,
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId: targetTenantId,
            channel: OrderChannel.MANUAL,
            status: OrderStatus.CANCELLED,
            deletedAt: null,
          },
        }),
      ]);

    return ResponseHelper.success(
      {
        drafts,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        counts: {
          all: total,
          open: openCount,
          completed: completedCount,
          cancelled: cancelledCount,
        },
      },
      'Draft orders retrieved successfully',
    );
  }
}


