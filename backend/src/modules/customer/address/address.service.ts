import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to dynamically resolve target store tenant
   */
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
      throw new NotFoundException('Tenant not found');
    }
    return defaultTenant.id;
  }

  /**
   * কাস্টমার প্রোফাইল আইডি খুঁজে বের করা বা স্বয়ংক্রিয়ভাবে তৈরি করা
   */
  private async resolveCustomerId(
    userIdOrCustomerId: string,
    tenantId: string,
  ): Promise<string> {
    if (!userIdOrCustomerId) {
      throw new BadRequestException('User ID is required');
    }

    // ১. সরাসরি CustomerProfile ID দিয়ে খোঁজা
    const profileById = await this.prisma.customerProfile.findFirst({
      where: {
        id: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (profileById) return profileById.id;

    // ২. Auth User ID দিয়ে CustomerProfile খোঁজা
    const profileByUserId = await this.prisma.customerProfile.findFirst({
      where: {
        userId: userIdOrCustomerId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (profileByUserId) return profileByUserId.id;

    // ৩. যদি CustomerProfile না থাকে, User টেবিল থেকে তথ্য নিয়ে প্রোফাইল তৈরি করা
    const user = await this.prisma.user.findUnique({
      where: { id: userIdOrCustomerId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

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

  /**
   * ১. নতুন ঠিকানা ডেটাবেজে সেভ করা (Create Address)
   * যদি এটি ডিফল্ট শিপিং বা বিলিং হিসেবে সেভ করা হয়, তবে আগের ঠিকানাগুলোর ডিফল্ট ফ্ল্যাগ ফলস করা হবে।
   */
  async createAddress(
    userId: string,
    dto: CreateAddressDto,
    tenantId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(dto.tenantId || tenantId);
    const customerProfileId = await this.resolveCustomerId(userId, targetTenantId);

    // গ্রাহকের বর্তমান ঠিকানার সংখ্যা গণনা করা
    const existingCount = await this.prisma.customerAddress.count({
      where: { customerProfileId },
    });

    const isFirst = existingCount === 0;
    const isDefaultShipping = isFirst || Boolean(dto.isDefaultShipping);
    const isDefaultBilling = isFirst || Boolean(dto.isDefaultBilling);

    // ১. যদি নতুন ঠিকানাটি ডিফল্ট শিপিং হয়, আগের সব ঠিকানার isDefaultShipping ফলস করা
    if (isDefaultShipping) {
      await this.prisma.customerAddress.updateMany({
        where: { customerProfileId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }

    // ২. যদি নতুন ঠিকানাটি ডিফল্ট বিলিং হয়, আগের সব ঠিকানার isDefaultBilling ফলস করা
    if (isDefaultBilling) {
      await this.prisma.customerAddress.updateMany({
        where: { customerProfileId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    // ৩. নতুন ঠিকানা ইনসার্ট করা
    const address = await this.prisma.customerAddress.create({
      data: {
        customerProfileId,
        label: (dto.label || 'Home').trim(),
        name: dto.name.trim(),
        phone: dto.phone.trim(),
        line1: dto.line1.trim(),
        district: dto.district.trim(),
        area: dto.area.trim(),
        isDefaultShipping,
        isDefaultBilling,
      },
    });

    return ResponseHelper.created(address, 'Address saved successfully');
  }

  /**
   * ২. ইউজারের সকল সেভ করা ঠিকানা দেখা (Get All Addresses)
   */
  async getAddresses(userId: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const customerProfileId = await this.resolveCustomerId(userId, targetTenantId);

    const addresses = await this.prisma.customerAddress.findMany({
      where: { customerProfileId },
      orderBy: [
        { isDefaultShipping: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return ResponseHelper.success(addresses, 'Addresses retrieved successfully');
  }

  /**
   * ৩. ঠিকানা আপডেট করা (Update Address)
   */
  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
    tenantId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(dto.tenantId || tenantId);
    const customerProfileId = await this.resolveCustomerId(userId, targetTenantId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerProfileId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    if (dto.isDefaultShipping) {
      await this.prisma.customerAddress.updateMany({
        where: { customerProfileId, isDefaultShipping: true },
        data: { isDefaultShipping: false },
      });
    }

    if (dto.isDefaultBilling) {
      await this.prisma.customerAddress.updateMany({
        where: { customerProfileId, isDefaultBilling: true },
        data: { isDefaultBilling: false },
      });
    }

    const updated = await this.prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        label: dto.label !== undefined ? dto.label.trim() : undefined,
        name: dto.name !== undefined ? dto.name.trim() : undefined,
        phone: dto.phone !== undefined ? dto.phone.trim() : undefined,
        line1: dto.line1 !== undefined ? dto.line1.trim() : undefined,
        district: dto.district !== undefined ? dto.district.trim() : undefined,
        area: dto.area !== undefined ? dto.area.trim() : undefined,
        isDefaultShipping: dto.isDefaultShipping !== undefined ? dto.isDefaultShipping : undefined,
        isDefaultBilling: dto.isDefaultBilling !== undefined ? dto.isDefaultBilling : undefined,
      },
    });

    return ResponseHelper.success(updated, 'Address updated successfully');
  }

  /**
   * ৪. ঠিকানা মুছে ফেলা (Delete Address)
   */
  async deleteAddress(userId: string, addressId: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const customerProfileId = await this.resolveCustomerId(userId, targetTenantId);

    const existing = await this.prisma.customerAddress.findFirst({
      where: { id: addressId, customerProfileId },
    });

    if (!existing) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.customerAddress.delete({
      where: { id: addressId },
    });

    // যদি ডিফল্ট অ্যাড্রেস ডিলিট হয়ে যায়, অন্য যেকোনো একটিকে ডিফল্ট বানানো
    if (existing.isDefaultShipping) {
      const nextAddress = await this.prisma.customerAddress.findFirst({
        where: { customerProfileId },
        orderBy: { createdAt: 'desc' },
      });
      if (nextAddress) {
        await this.prisma.customerAddress.update({
          where: { id: nextAddress.id },
          data: { isDefaultShipping: true },
        });
      }
    }

    return ResponseHelper.success(null, 'Address deleted successfully');
  }
}
