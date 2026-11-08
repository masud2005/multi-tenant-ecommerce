import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../common/helpers/response.helper';
import { ConflictException } from '../../../common/exceptions/business.exception';
import { DEFAULT_NOTIFICATION_TEMPLATES } from '../../notification/notification-template.defaults';
import { UpdateNotificationTemplateDto } from './dto/update-notification-template.dto';

@Injectable()
export class OwnerNotificationTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  private requireTenant(tenantId?: string) {
    if (!tenantId) {
      throw new ConflictException(
        'Tenant could not be resolved from authenticated user.',
      );
    }
    return tenantId;
  }

  private serialize(row: any) {
    return {
      id: row.id,
      key: row.key,
      event: row.event,
      group: row.group,
      description: row.description || '',
      email: Boolean(row.email),
      inApp: Boolean(row.inApp),
      emailSubject: row.subject || '',
      emailBody: row.body || '',
      inAppTitle: row.inAppTitle || '',
      inAppMessage: row.inAppMessage || '',
      variables: Array.isArray(row.variables) ? row.variables : [],
      updatedAt: row.updatedAt,
    };
  }

  /** Ensure all canonical templates exist for this tenant (idempotent upsert of missing keys). */
  async ensureDefaults(tenantId: string) {
    const existing = await this.prisma.notificationTemplate.findMany({
      where: { tenantId },
      select: { key: true },
    });
    const have = new Set(existing.map((e) => e.key));
    const missing = DEFAULT_NOTIFICATION_TEMPLATES.filter((d) => !have.has(d.key));

    if (missing.length === 0) return;

    await this.prisma.notificationTemplate.createMany({
      data: missing.map((d) => ({
        tenantId,
        key: d.key,
        event: d.event,
        group: d.group,
        description: d.description,
        email: d.email,
        inApp: d.inApp,
        sms: false,
        push: false,
        subject: d.subject,
        body: d.body,
        inAppTitle: d.inAppTitle,
        inAppMessage: d.inAppMessage,
        variables: d.variables,
      })),
      skipDuplicates: true,
    });
  }

  async list(tenantId?: string) {
    const tid = this.requireTenant(tenantId);
    await this.ensureDefaults(tid);

    const rows = await this.prisma.notificationTemplate.findMany({
      where: { tenantId: tid },
      orderBy: [{ group: 'asc' }, { event: 'asc' }],
    });

    return ResponseHelper.success(
      rows.map((r) => this.serialize(r)),
      'Notification templates retrieved successfully',
    );
  }

  async getOne(id: string, tenantId?: string) {
    const tid = this.requireTenant(tenantId);
    const row = await this.prisma.notificationTemplate.findFirst({
      where: { id, tenantId: tid },
    });
    if (!row) throw new NotFoundException('Notification template not found');
    return ResponseHelper.success(
      this.serialize(row),
      'Notification template retrieved successfully',
    );
  }

  async update(id: string, dto: UpdateNotificationTemplateDto, tenantId?: string) {
    const tid = this.requireTenant(tenantId);
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { id, tenantId: tid },
    });
    if (!existing) throw new NotFoundException('Notification template not found');

    const updated = await this.prisma.notificationTemplate.update({
      where: { id: existing.id },
      data: {
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.inApp !== undefined ? { inApp: dto.inApp } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.inAppTitle !== undefined ? { inAppTitle: dto.inAppTitle } : {}),
        ...(dto.inAppMessage !== undefined
          ? { inAppMessage: dto.inAppMessage }
          : {}),
      },
    });

    return ResponseHelper.success(
      this.serialize(updated),
      'Notification template updated successfully',
    );
  }
}
