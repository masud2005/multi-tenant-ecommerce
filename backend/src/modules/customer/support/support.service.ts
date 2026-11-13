import type { AuthUser } from '../../../common/decorators/current-user.decorator';
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
      (phone
        ? `${phone.replace(/[^0-9]/g, '')}@phone.store`
        : `guest-${Date.now()}@guest.store`);

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

  // 2. Get all support tickets submitted by this customer
  async getCustomerTickets(tenantId?: string, user?: AuthUser) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const userId = user?.id || user?.sub;
    const email = user?.email?.toLowerCase();

    if (!userId && !email) {
      return ResponseHelper.success([], 'No customer identity available');
    }

    const customers = await this.prisma.customerProfile.findMany({
      where: {
        tenantId: targetTenantId,
        OR: [...(userId ? [{ userId }] : []), ...(email ? [{ email }] : [])],
      },
      select: { id: true },
    });

    if (customers.length === 0) {
      return ResponseHelper.success([], 'No tickets found');
    }

    const customerIds = customers.map((c) => c.id);

    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        tenantId: targetTenantId,
        customerId: { in: customerIds },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ResponseHelper.success(
      tickets,
      'Customer tickets retrieved successfully',
    );
  }

  // 3. Customer replies to an existing ticket
  async replyCustomerTicket(
    ticketId: string,
    replyText: string,
    tenantId?: string,
    user?: AuthUser,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);
    const userId = user?.id || user?.sub;
    const customerName = user?.name || 'Customer';

    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        tenantId: targetTenantId,
      },
      include: {
        customer: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException(
        `Support ticket with id "${ticketId}" not found`,
      );
    }

    if (
      ticket.customer?.userId &&
      userId &&
      ticket.customer.userId !== userId
    ) {
      throw new NotFoundException('You do not have access to this ticket');
    }

    const newMessage = await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        from: 'customer',
        name: customerName,
        text: replyText.trim(),
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'open',
        updatedAt: new Date(),
      },
    });

    return ResponseHelper.created(newMessage, 'Reply submitted successfully');
  }
}
