import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class CustomerSupportService {
  private readonly logger = new Logger(CustomerSupportService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  // 1. Submit a customer inquiry / contact form message
  async createContactMessage(
    dto: CreateContactMessageDto,
    tenantId?: string,
    authenticatedUserId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const name = dto.name.trim();
    const phone = dto.phone?.trim() || null;
    const email =
      dto.email?.trim().toLowerCase() ||
      (phone ? `${phone.replace(/[^0-9]/g, '')}@phone.store` : `guest-${Date.now()}@guest.store`);

    // Find or create customer profile
    let customer = await this.prisma.customerProfile.findUnique({
      where: {
        tenantId_email: {
          tenantId: targetTenantId,
          email,
        },
      },
    });

    if (!customer) {
      customer = await this.prisma.customerProfile.create({
        data: {
          tenantId: targetTenantId,
          name,
          email,
          phone,
          userId: authenticatedUserId || null,
        },
      });
    } else if (phone && !customer.phone) {
      await this.prisma.customerProfile.update({
        where: { id: customer.id },
        data: { phone },
      });
    }

    // Create SupportTicket with initial TicketMessage
    const ticket = await this.prisma.supportTicket.create({
      data: {
        tenantId: targetTenantId,
        customerId: customer.id,
        orderNumber: dto.orderNumber?.trim() || null,
        subject: dto.topic.trim(),
        status: 'open',
        messages: {
          create: {
            from: 'customer',
            name,
            text: dto.message.trim(),
          },
        },
      },
      include: {
        messages: true,
        customer: true,
      },
    });

    this.logger.log(
      `New support ticket [${ticket.id}] created by ${name} (${email}) for topic: ${dto.topic}`,
    );

    return ResponseHelper.created(
      {
        ticketId: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        orderNumber: ticket.orderNumber,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        createdAt: ticket.createdAt,
      },
      'Your message has been received. Our support team will get back to you shortly.',
    );
  }
}
