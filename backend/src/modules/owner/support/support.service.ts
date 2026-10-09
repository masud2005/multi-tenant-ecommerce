import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { ReplyTicketDto } from './dto/reply-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { ResponseHelper } from '../../../common/helpers/response.helper';

@Injectable()
export class OwnerSupportService {
  private readonly logger = new Logger(OwnerSupportService.name);

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

  // 1. List all support tickets with filtering and pagination
  async getTickets(query: TicketQueryDto, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const where: any = {
      tenantId: targetTenantId,
    };

    if (query.status && query.status.trim() !== 'all') {
      where.status = query.status.trim();
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { subject: { contains: s, mode: 'insensitive' } },
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { customer: { name: { contains: s, mode: 'insensitive' } } },
        { customer: { email: { contains: s, mode: 'insensitive' } } },
        { customer: { phone: { contains: s, mode: 'insensitive' } } },
        { messages: { some: { text: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [tickets, total, statusCounts] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.groupBy({
        by: ['status'],
        where: { tenantId: targetTenantId },
        _count: { id: true },
      }),
    ]);

    const counts: Record<string, number> = {
      all: 0,
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
    };

    statusCounts.forEach((c) => {
      counts[c.status] = c._count.id;
      counts.all += c._count.id;
    });

    return ResponseHelper.success(
      {
        tickets,
        counts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
      'Support tickets retrieved successfully',
    );
  }

  // 2. Get specific ticket with message thread
  async getTicketById(id: string, tenantId?: string) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id,
        tenantId: targetTenantId,
      },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket with id "${id}" not found`);
    }

    return ResponseHelper.success(ticket, 'Ticket details retrieved successfully');
  }

  // 3. Post reply to a ticket
  async replyToTicket(
    id: string,
    dto: ReplyTicketDto,
    tenantId?: string,
    adminUser?: any,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, tenantId: targetTenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket with id "${id}" not found`);
    }

    const adminName = adminUser?.name || 'Support Agent';

    await this.prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        from: 'agent',
        name: adminName,
        text: dto.reply.trim(),
      },
    });

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'pending',
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    this.logger.log(`Admin [${adminName}] replied to ticket [${id}]`);

    return ResponseHelper.success(updated, 'Reply posted successfully');
  }

  // 4. Update ticket status
  async updateTicketStatus(
    id: string,
    dto: UpdateTicketStatusDto,
    tenantId?: string,
  ) {
    const targetTenantId = await this.resolveTenantId(tenantId);

    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, tenantId: targetTenantId },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket with id "${id}" not found`);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: dto.status,
        updatedAt: new Date(),
      },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return ResponseHelper.success(updated, 'Ticket status updated successfully');
  }
}
