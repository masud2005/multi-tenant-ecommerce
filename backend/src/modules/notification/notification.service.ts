import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../shared/mail/email-service';
import { SendNotificationOptions, QueryNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * 🚀 Send notification: creates In-App notification and optionally sends Email
   */
  async send(options: SendNotificationOptions) {
    const { tenantId, userId, title, message, type = 'SYSTEM', link, email } = options;

    try {
      // 1. Create In-App Notification in DB
      const notification = await this.prisma.notification.create({
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

      // 2. Send Email if provided
      if (email && email.to) {
        this.emailService
          .sendEmail(email.to, email.subject, email.html)
          .then(async (success) => {
            await this.prisma.notificationLog.create({
              data: {
                tenantId,
                channel: 'Email',
                to: email.to,
                event: title,
                status: success ? 'delivered' : 'failed',
              },
            });
          })
          .catch((err) => {
            this.logger.error(`Failed to send email notification to ${email.to}`, err);
          });
      }

      return notification;
    } catch (error) {
      this.logger.error('Error sending notification', error);
      throw error;
    }
  }

  /**
   * 📥 Get user notifications list and unread count
   */
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

  /**
   * ✅ Mark a specific notification as read
   */
  async markAsRead(id: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId, tenantId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * 🧹 Mark all unread notifications as read for current user
   */
  async markAllAsRead(userId: string, tenantId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, tenantId, isRead: false },
      data: { isRead: true },
    });

    return { success: true, message: 'All notifications marked as read' };
  }

  /**
   * 🗑️ Delete a notification
   */
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
