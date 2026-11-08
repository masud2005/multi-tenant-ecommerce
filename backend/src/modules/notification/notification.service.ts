import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../shared/mail/email-service';
import { NotificationGateway } from './notification.gateway';
import {
  SendNotificationOptions,
  SendFromTemplateOptions,
  TemplateVarMap,
  QueryNotificationDto,
} from './dto/notification.dto';
import { DEFAULT_NOTIFICATION_TEMPLATES } from './notification-template.defaults';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /** Replace {{var}} tokens. Missing values become empty string (no fake defaults). */
  renderTemplate(text: string | null | undefined, vars: TemplateVarMap = {}) {
    const source = String(text || '');
    return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();
      const val = vars[key];
      if (val === null || val === undefined) return '';
      return String(val);
    });
  }

  private toEmailHtml(body: string) {
    const escaped = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div style="font-family:system-ui,sans-serif;line-height:1.55;color:#1a1a1a;white-space:pre-wrap">${escaped}</div>`;
  }

  /**
   * Ensure template row exists for tenant+key (from canonical defaults only).
   * Does not invent content at send-time beyond seeded definitions.
   */
  private async resolveTemplate(tenantId: string, key: string) {
    let row = await this.prisma.notificationTemplate.findUnique({
      where: { tenantId_key: { tenantId, key } },
    });
    if (row) return row;

    const def = DEFAULT_NOTIFICATION_TEMPLATES.find((d) => d.key === key);
    if (!def) return null;

    try {
      row = await this.prisma.notificationTemplate.create({
        data: {
          tenantId,
          key: def.key,
          event: def.event,
          group: def.group,
          description: def.description,
          email: def.email,
          inApp: def.inApp,
          sms: false,
          push: false,
          subject: def.subject,
          body: def.body,
          inAppTitle: def.inAppTitle,
          inAppMessage: def.inAppMessage,
          variables: def.variables,
        },
      });
    } catch {
      row = await this.prisma.notificationTemplate.findUnique({
        where: { tenantId_key: { tenantId, key } },
      });
    }
    return row;
  }

  /**
   * Send using a DB notification template. Respects email/inApp toggles.
   * If template is missing → no-op (no mock/fallback content).
   */
  async sendFromTemplate(options: SendFromTemplateOptions) {
    const {
      tenantId,
      key,
      userId,
      emailTo,
      type = 'SYSTEM',
      link,
      vars = {},
    } = options;

    const template = await this.resolveTemplate(tenantId, key);
    if (!template) {
      this.logger.warn(
        `Notification template "${key}" not found for tenant ${tenantId} — skipped`,
      );
      return null;
    }

    const title = this.renderTemplate(template.inAppTitle || template.event, vars);
    const message = this.renderTemplate(
      template.inAppMessage || template.body || '',
      vars,
    );
    const subject = this.renderTemplate(
      template.subject || template.event,
      vars,
    );
    const body = this.renderTemplate(template.body || '', vars);

    const wantsInApp = Boolean(template.inApp) && Boolean(userId);
    const wantsEmail = Boolean(template.email) && Boolean(emailTo?.trim());

    if (!wantsInApp && !wantsEmail) {
      return null;
    }

    return this.send({
      tenantId,
      userId: wantsInApp ? userId : undefined,
      title: title || template.event,
      message: message || title || template.event,
      type,
      link,
      email: wantsEmail
        ? {
            to: emailTo!.trim(),
            subject: subject || template.event,
            html: this.toEmailHtml(body || subject || template.event),
          }
        : undefined,
    });
  }

  /**
   * Send notification: optional in-app + socket (when userId is a real User),
   * and optional email. Guest / email-only flows must not pass a fake userId.
   */
  async send(options: SendNotificationOptions) {
    const { tenantId, userId, title, message, type = 'SYSTEM', link, email } = options;

    try {
      let notification: any = null;

      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });

        if (user) {
          notification = await this.prisma.notification.create({
            data: {
              tenantId,
              userId,
              title,
              message,
              type,
              link,
              isRead: false,
            },
          });

          try {
            this.notificationGateway.sendToUser(userId, notification);
          } catch (wsErr) {
            this.logger.error(
              'Failed to emit real-time notification socket event',
              wsErr,
            );
          }
        } else {
          this.logger.warn(
            `Skipping in-app notification — userId "${userId}" is not a User row`,
          );
        }
      }

      if (email?.to) {
        try {
          const success = await this.emailService.sendEmail(
            email.to,
            email.subject,
            email.html,
          );
          await this.prisma.notificationLog.create({
            data: {
              tenantId,
              channel: 'Email',
              to: email.to,
              event: title,
              status: success ? 'delivered' : 'failed',
            },
          });
        } catch (err) {
          this.logger.error(`Failed to send email notification to ${email.to}`, err);
        }
      }

      return notification;
    } catch (error) {
      this.logger.error('Error sending notification', error);
      throw error;
    }
  }

  async getUserNotifications(
    userId: string,
    tenantId: string,
    query: QueryNotificationDto = {},
  ) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId,
      tenantId,
    };

    if (query.unreadOnly) {
      whereClause.isRead = false;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: whereClause }),
      this.prisma.notification.count({
        where: { userId, tenantId, isRead: false },
      }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async markAsRead(id: string, userId: string, tenantId?: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string, tenantId?: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: 'All notifications marked as read' };
  }

  async deleteNotification(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, tenantId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id },
    });
  }
}
