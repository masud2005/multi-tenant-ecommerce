import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryCartDto } from './dto/query-cart.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ধাপ ১.১: কার্ট তৈরি করা অথবা বিদ্যমান কার্ট খুঁজে নেওয়া (Get or Create Cart)
   */
  async getOrCreateCart(
    tenantId: string,
    customerId?: string,
    sessionToken?: string,
  ) {
    let cart = null;

    // ১. লগইন করা কাস্টমারের কার্ট খোঁজা
    if (customerId) {
      cart = await this.prisma.cart.findFirst({
        where: {
          tenantId,
          customerId,
        },
      });
    }

    // ২. গেস্ট ইউজারের সেশন টোকেন দিয়ে কার্ট খোঁজা (শুধুমাত্র আনঅথেনটিকেটেড অবস্থায়)
    if (!cart && !customerId && sessionToken) {
      cart = await this.prisma.cart.findFirst({
        where: {
          tenantId,
          sessionToken,
          customerId: null,
        },
      });
    }

    // ৩. কার্ট না থাকলে ডাটাবেজে নতুন কার্ট তৈরি করা
    if (!cart) {
      const activeSessionToken =
        sessionToken ||
        `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      cart = await this.prisma.cart.create({
        data: {
          tenantId,
          customerId: customerId || null,
          sessionToken: customerId ? null : activeSessionToken,
        },
      });
    }

    return cart;
  }

  /**
   * ধাপ ১.২: কার্টের সম্পূর্ণ ডাটা ও আইটেম ফেচ করা (Fetch / Get Cart)
   */
  async getCart(
    query?: QueryCartDto,
    customerId?: string,
    sessionTokenHeader?: string,
  ) {
    const targetTenantId =
      query?.tenantId || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';
    const activeSessionToken = query?.sessionToken || sessionTokenHeader;

    // কার্ট নিশ্চিত করা (না থাকলে তৈরি হবে)
    const activeCart = await this.getOrCreateCart(
      targetTenantId,
      customerId,
      activeSessionToken,
    );

    // কার্ট এবং সংশ্লিষ্ট আইটেম, প্রোডাক্ট ও ভ্যারিয়েন্ট ডাটাবেজ থেকে ফেচ করা
    const cart = await this.prisma.cart.findUnique({
      where: { id: activeCart.id },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                salePrice: true,
                preorder: true,
                images: {
                  where: { isCover: true },
                  take: 1,
                  select: { url: true, alt: true },
                },
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
                stock: true,
                reserved: true,
                enabled: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return ResponseHelper.success(null, 'Cart not found');
    }

    // সাবটোটাল ও আইটেম সংখ্যা হিসাব
    let subtotal = 0;
    let totalItemsCount = 0;

    const formattedItems = cart.items.map((item) => {
      const unitPrice = Number(
        item.variant?.salePrice ??
          item.variant?.price ??
          item.product?.salePrice ??
          item.product?.price ??
          0,
      );
      const lineTotal = unitPrice * item.qty;
      const availableStock = Math.max(
        0,
        (item.variant?.stock ?? 0) - (item.variant?.reserved ?? 0),
      );

      if (!item.savedForLater) {
        subtotal += lineTotal;
        totalItemsCount += item.qty;
      }

      return {
        ...item,
        unitPrice,
        lineTotal,
        availableStock,
        isOutOfStock: !item.product.preorder && availableStock === 0,
        isLimitedStock:
          !item.product.preorder &&
          availableStock > 0 &&
          item.qty > availableStock,
      };
    });

    const result = {
      id: cart.id,
      tenantId: cart.tenantId,
      customerId: cart.customerId,
      sessionToken: cart.sessionToken,
      subtotal,
      totalItemsCount,
      items: formattedItems,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };

    return ResponseHelper.success(
      result,
      'Cart retrieved successfully',
    );
  }

  /**
   * ধাপ ১.৩: কার্টে প্রোডাক্ট/ভ্যারিয়েন্ট যোগ করা (Add to Cart with Stock Validation)
   */
  async addToCart(
    dto: AddToCartDto,
    customerId?: string,
    sessionTokenHeader?: string,
  ) {
    let targetTenantId = dto.tenantId;
    if (!targetTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      targetTenantId = activeTenant?.id || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';
    }

    const activeSessionToken = dto.sessionToken || sessionTokenHeader;

    // ১. ভ্যারিয়েন্ট ও রিয়েল-টাইম স্টক চেক করা
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: true },
    });

    if (!variant || !variant.enabled) {
      throw new NotFoundException('Selected product variant is not available');
    }

    const isPreorder = variant.product?.preorder || false;
    const availableStock = Math.max(0, variant.stock - variant.reserved);

    if (!isPreorder && availableStock <= 0) {
      throw new BadRequestException('This product is currently out of stock');
    }

    // ২. কার্ট নিশ্চিত করা
    const cart = await this.getOrCreateCart(
      targetTenantId,
      customerId,
      activeSessionToken,
    );

    // ৩. বিদ্যমান আইটেম খোঁজা
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        savedForLater: false,
      },
    });

    const addQty = Math.max(1, dto.qty || 1);
    const totalRequestedQty = (existingItem?.qty || 0) + addQty;

    // ৪. স্টক সীমার বেশি যোগ করা আটকাতে ভ্যালিডেশন
    if (!isPreorder && totalRequestedQty > availableStock) {
      const alreadyInCart = existingItem?.qty || 0;
      if (alreadyInCart > 0) {
        throw new BadRequestException(
          `Cannot add ${addQty} more. Only ${availableStock} item${availableStock > 1 ? 's' : ''} available in stock (${alreadyInCart} already in your bag).`,
        );
      }
      throw new BadRequestException(
        `Only ${availableStock} item${availableStock > 1 ? 's' : ''} available in stock.`,
      );
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          qty: totalRequestedQty,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId,
          qty: addQty,
        },
      });
    }

    // আপডেটেড কার্ট ডাটা রিটার্ন
    return this.getCart(
      { tenantId: targetTenantId, sessionToken: cart.sessionToken || undefined },
      customerId,
      activeSessionToken,
    );
  }

  /**
   * ধাপ ১.৪: কার্ট আইটেমের কোয়ান্টিটি আপডেট করা (Update Quantity with Stock Validation)
   */
  async updateCartItemQuantity(
    itemIdOrVariantId: string,
    dto: UpdateCartItemDto,
    customerId?: string,
    sessionTokenHeader?: string,
  ) {
    let targetTenantId = dto.tenantId;
    if (!targetTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      targetTenantId = activeTenant?.id || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';
    }

    const activeSessionToken = dto.sessionToken || sessionTokenHeader;

    // ১. কার্ট নিশ্চিত করা
    const cart = await this.getOrCreateCart(
      targetTenantId,
      customerId,
      activeSessionToken,
    );

    // ২. কার্টের মধ্যে আইটেমটি খোঁজা (CartItem ID অথবা Variant ID দিয়ে)
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        OR: [
          { id: itemIdOrVariantId },
          { variantId: itemIdOrVariantId },
        ],
      },
      include: {
        variant: true,
        product: true,
      },
    });

    if (!existingItem) {
      throw new NotFoundException('Cart item not found');
    }

    const newQty = dto.qty !== undefined ? Math.max(0, dto.qty) : existingItem.qty;

    // ৩. কোয়ান্টিটি ০ হলে আইটেম ডিলিট করা, অন্যথায় স্টক চেক ও আপডেট করা
    if (newQty === 0) {
      await this.prisma.cartItem.delete({
        where: { id: existingItem.id },
      });
    } else {
      const isPreorder = existingItem.product?.preorder || false;
      const availableStock = Math.max(
        0,
        (existingItem.variant?.stock ?? 0) - (existingItem.variant?.reserved ?? 0),
      );

      if (!isPreorder && newQty > availableStock) {
        throw new BadRequestException(
          `Cannot update quantity to ${newQty}. Only ${availableStock} item${availableStock > 1 ? 's' : ''} available in stock.`,
        );
      }

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          qty: newQty,
          savedForLater:
            dto.savedForLater !== undefined
              ? dto.savedForLater
              : existingItem.savedForLater,
        },
      });
    }

    // ৪. সর্বশেষ ফ্রেশ কার্ট ডাটা রিটার্ন করা
    return this.getCart(
      { tenantId: targetTenantId, sessionToken: cart.sessionToken || undefined },
      customerId,
      activeSessionToken,
    );
  }

  /**
   * ধাপ ১.৫: কার্ট থেকে আইটেম রিমুভ করা (Remove from Cart)
   */
  async removeFromCart(
    itemIdOrVariantId: string,
    customerId?: string,
    sessionTokenHeader?: string,
    tenantId?: string,
  ) {
    let targetTenantId = tenantId;
    if (!targetTenantId) {
      const activeTenant = await this.prisma.tenant.findFirst({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
      targetTenantId = activeTenant?.id || 'e0f8bdb1-da0a-4907-9d82-08ef1be77ac2';
    }

    const cart = await this.getOrCreateCart(
      targetTenantId,
      customerId,
      sessionTokenHeader,
    );

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        OR: [
          { id: itemIdOrVariantId },
          { variantId: itemIdOrVariantId },
        ],
      },
    });

    if (existingItem) {
      await this.prisma.cartItem.delete({
        where: { id: existingItem.id },
      });
    }

    return this.getCart(
      { tenantId: targetTenantId, sessionToken: cart.sessionToken || undefined },
      customerId,
      sessionTokenHeader,
    );
  }
}
