import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { encryptMessage, decryptMessage } from '../../common/helpers/crypto.helper';
import { SendMessageDto } from './dto/send-message.dto';
import { ResponseHelper } from '../../common/helpers/response.helper';

export interface DecryptedChatMessage {
  id: string;
  conversationId: string;
  tenantId: string;
  senderId?: string | null;
  senderRole: string;
  senderName: string;
  text: string;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

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

  /**
   * 🔒 Save Message: Encrypts message text with AES-256-CBC and persists to database
   */
  async saveMessage(
    conversationId: string,
    dto: SendMessageDto,
    sender: { id?: string; name: string; role: 'CUSTOMER' | 'OWNER' | 'STAFF' },
    tenantId?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const resolvedTenantId = conversation.tenantId || (await this.resolveTenantId(tenantId));
    const senderRole = dto.senderRole || sender.role;
    const senderName =
      dto.senderName || sender.name || (senderRole === 'CUSTOMER' ? 'Customer' : 'Store Support');
    const plainText = dto.text.trim();

    if (!plainText) {
      throw new BadRequestException('Message text cannot be empty');
    }

    // 🔒 Encrypt message text using AES-256-CBC with random IV
    const { encryptedText, iv } = encryptMessage(plainText);

    // Save encrypted message record to database
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        tenantId: resolvedTenantId,
        senderId: sender.id || null,
        senderRole,
        senderName,
        encryptedText,
        iv,
        isRead: false,
      },
    });

    // Update conversation metadata & unread counters
    const isCustomerSender = senderRole === 'CUSTOMER';
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: conversation.status === 'resolved' ? 'active' : conversation.status,
        ...(isCustomerSender
          ? { unreadByOwner: { increment: 1 } }
          : { unreadByCustomer: { increment: 1 } }),
      },
    });

    // If message is from customer, notify store owner & staff (In-App)
    if (isCustomerSender) {
      this.dispatchChatNotification(resolvedTenantId, conversationId, senderName, plainText);
    }

    const decryptedResponse: DecryptedChatMessage = {
      id: message.id,
      conversationId: message.conversationId,
      tenantId: message.tenantId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      senderName: message.senderName,
      text: plainText,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };

    return ResponseHelper.created(decryptedResponse, 'Message sent successfully');
  }

  /**
   * 🔓 Get Chat History: Fetches and decrypts all previous messages for a conversation
   */
  async getChatHistory(
    conversationId: string,
    viewerRole: 'OWNER' | 'CUSTOMER' = 'OWNER',
    tenantId?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // 🔓 Decrypt each message for frontend display
    const decryptedMessages: DecryptedChatMessage[] = conversation.messages.map((msg) => {
      const text = decryptMessage(msg.encryptedText, msg.iv);
      return {
        id: msg.id,
        conversationId: msg.conversationId,
        tenantId: msg.tenantId,
        senderId: msg.senderId,
        senderRole: msg.senderRole,
        senderName: msg.senderName,
        text,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
      };
    });

    // Mark messages as read based on viewer role
    (async () => {
      try {
        if (viewerRole === 'OWNER' && conversation.unreadByOwner > 0) {
          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { unreadByOwner: 0 },
          });
          await this.prisma.chatMessage.updateMany({
            where: { conversationId, senderRole: 'CUSTOMER', isRead: false },
            data: { isRead: true },
          });
        } else if (viewerRole === 'CUSTOMER' && conversation.unreadByCustomer > 0) {
          await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { unreadByCustomer: 0 },
          });
          await this.prisma.chatMessage.updateMany({
            where: {
              conversationId,
              senderRole: { in: ['OWNER', 'STAFF'] },
              isRead: false,
            },
            data: { isRead: true },
          });
        }
      } catch (err) {
        this.logger.error('Failed to mark conversation read in background', err);
      }
    })();

    return ResponseHelper.success(
      {
        conversation: {
          id: conversation.id,
          customerName: conversation.customerName,
          customerEmail: conversation.customerEmail,
          customerPhone: conversation.customerPhone,
          status: conversation.status,
          unreadByOwner: viewerRole === 'OWNER' ? 0 : conversation.unreadByOwner,
          unreadByCustomer: viewerRole === 'CUSTOMER' ? 0 : conversation.unreadByCustomer,
          lastMessageAt: conversation.lastMessageAt,
          createdAt: conversation.createdAt,
        },
        messages: decryptedMessages,
      },
      'Chat history retrieved and decrypted successfully',
    );
  }

  /**
   * Internal helper: Dispatch In-App Notification for incoming customer chat message
   */
  private async dispatchChatNotification(
    tenantId: string,
    conversationId: string,
    senderName: string,
    messageText: string,
  ) {
    try {
      const staffMembers = await this.prisma.tenantMember.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'active',
        },
      });

      const truncated =
        messageText.length > 60 ? `${messageText.slice(0, 57)}...` : messageText;

      for (const member of staffMembers) {
        if (member.userId) {
          await this.notificationService.send({
            tenantId,
            userId: member.userId,
            title: `New Message from ${senderName}`,
            message: `"${truncated}"`,
            type: 'SYSTEM',
            link: `/admin/chat?id=${conversationId}`,
          });
        }
      }
    } catch (err) {
      this.logger.error('Failed to dispatch chat notification', err);
    }
  }
}
