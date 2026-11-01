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
import { StartConversationDto } from './dto/start-conversation.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
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
   * 🛍️ Start or resume customer live chat conversation
   */
  async initConversation(
    dto: StartConversationDto,
    user?: any,
    tenantHeader?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(tenantHeader || user?.tenantId);

    // 1. Check if conversationId was supplied and exists
    if (dto.conversationId) {
      const existing = await this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, tenantId: resolvedTenantId },
      });
      if (existing) {
        return ResponseHelper.success(existing, 'Conversation session resumed');
      }
    }

    // 2. Try to find customer profile
    let customerProfile = null;
    if (user?.id) {
      customerProfile = await this.prisma.customerProfile.findFirst({
        where: { userId: user.id, tenantId: resolvedTenantId, deletedAt: null },
      });
    }

    const email = dto.customerEmail || customerProfile?.email || user?.email || null;
    if (!customerProfile && email) {
      customerProfile = await this.prisma.customerProfile.findUnique({
        where: {
          tenantId_email: {
            tenantId: resolvedTenantId,
            email,
          },
        },
      });
    }

    // 3. Find existing active conversation for this customer
    let existingActive = null;
    if (customerProfile) {
      existingActive = await this.prisma.conversation.findFirst({
        where: {
          tenantId: resolvedTenantId,
          customerId: customerProfile.id,
          status: 'active',
        },
        orderBy: { lastMessageAt: 'desc' },
      });
    } else if (email) {
      existingActive = await this.prisma.conversation.findFirst({
        where: {
          tenantId: resolvedTenantId,
          customerEmail: email,
          status: 'active',
        },
        orderBy: { lastMessageAt: 'desc' },
      });
    }

    if (existingActive) {
      return ResponseHelper.success(existingActive, 'Active conversation resumed');
    }

    // 4. Create new conversation
    const name =
      dto.customerName ||
      customerProfile?.name ||
      user?.name ||
      (email ? email.split('@')[0] : 'Guest Customer');
    const phone = dto.customerPhone || customerProfile?.phone || user?.phone || null;

    const conversation = await this.prisma.conversation.create({
      data: {
        tenantId: resolvedTenantId,
        customerId: customerProfile?.id || null,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        status: 'active',
        lastMessageAt: new Date(),
      },
    });

    // 5. If initial message was provided, save it as first message
    if (dto.initialMessage?.trim()) {
      await this.saveMessage(
        conversation.id,
        { text: dto.initialMessage.trim() },
        { id: user?.id, name, role: 'CUSTOMER' },
        resolvedTenantId,
      );
    }

    return ResponseHelper.created(conversation, 'Chat session initialized successfully');
  }

  /**
   * 🏢 Get Owner conversations list with decrypted last message previews & pagination
   */
  async getOwnerConversations(
    query: ConversationQueryDto,
    tenantId?: string,
  ) {
    const resolvedTenantId = await this.resolveTenantId(tenantId);
    const { status, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: resolvedTenantId,
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { customerEmail: { contains: q, mode: 'insensitive' } },
        { customerPhone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, conversations, totalUnread] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.findMany({
        where,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          tenantId: resolvedTenantId,
          unreadByOwner: { gt: 0 },
        },
      }),
    ]);

    const formatted = conversations.map((conv) => {
      const lastMsg = conv.messages[0];
      let lastMessagePreview: string | undefined = undefined;
      let lastMessageSenderRole: string | null = null;

      if (lastMsg) {
        lastMessageSenderRole = lastMsg.senderRole;
        try {
          lastMessagePreview = decryptMessage(lastMsg.encryptedText, lastMsg.iv);
        } catch {
          lastMessagePreview = 'Encrypted message';
        }
      }

      return {
        id: conv.id,
        tenantId: conv.tenantId,
        customerId: conv.customerId,
        customerName: conv.customerName,
        customerEmail: conv.customerEmail,
        customerPhone: conv.customerPhone,
        status: conv.status,
        unreadByOwner: conv.unreadByOwner,
        unreadByCustomer: conv.unreadByCustomer,
        lastMessageAt: conv.lastMessageAt.toISOString(),
        lastMessagePreview,
        lastMessageSenderRole,
        createdAt: conv.createdAt.toISOString(),
      };
    });

    const meta = {
      ...ResponseHelper.buildPaginationMeta(total, page, limit),
      totalUnread,
    };

    return ResponseHelper.paginated(formatted, meta, 'Conversations retrieved successfully');
  }

  /**
   * 👁️ Mark conversation messages as read
   */
  async markAsRead(
    conversationId: string,
    viewerRole: 'OWNER' | 'CUSTOMER',
    tenantId?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (viewerRole === 'OWNER') {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadByOwner: 0 },
      });
      await this.prisma.chatMessage.updateMany({
        where: { conversationId, senderRole: 'CUSTOMER', isRead: false },
        data: { isRead: true },
      });
    } else {
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

    return ResponseHelper.success(null, 'Conversation marked as read');
  }

  /**
   * 🔄 Update conversation status (active, resolved, archived)
   */
  async updateStatus(
    conversationId: string,
    status: string,
    tenantId?: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });

    return ResponseHelper.success(updated, 'Conversation status updated successfully');
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

  /**
   * Helper to fetch conversation customer identifiers for presence tracking
   */
  async getConversationCustomer(conversationId: string) {
    try {
      return await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { customerId: true, customerEmail: true },
      });
    } catch {
      return null;
    }
  }
}
