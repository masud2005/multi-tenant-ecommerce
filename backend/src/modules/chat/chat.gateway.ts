import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: 'OWNER' | 'STAFF' | 'CUSTOMER';
    tenantId?: string;
  };
  tenantId?: string;
  activeConversationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // In-Memory Presence Registry: TenantId -> Map<UserIdOrGuestId, { socketIds: Set<string>, role: string, name: string }>
  private readonly onlineUsers = new Map<
    string,
    Map<string, { socketIds: Set<string>; role: string; name: string }>
  >();

  // Conversation Presence Registry: RoomName -> Set<string> (userIds/socketIds)
  private readonly roomPresence = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 1. 🔐 কনেকশন হ্যান্ডলার: JWT টোকেন ও tenantId ভেরিফিকেশন + অনলাইন স্ট্যাটাস মার্ক
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (client.handshake.query?.token as string);

      const tenantId =
        (client.handshake.auth?.tenantId as string) ||
        (client.handshake.headers['x-tenant-id'] as string) ||
        (client.handshake.query?.tenantId as string);

      client.tenantId = tenantId;

      if (token) {
        try {
          const secret = this.configService.get<string>('app.jwtSecret') || 'jwt-secret';
          const payload = await this.jwtService.verifyAsync(token, { secret });
          client.user = {
            id: payload.sub || payload.id,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            tenantId: payload.tenantId || tenantId,
          };
          this.logger.log(`Authenticated client connected: ${client.user?.name} (${client.id})`);
        } catch (err) {
          this.logger.warn(`Guest or expired token client connected: ${client.id}`);
        }
      } else {
        this.logger.log(`Guest customer connected: ${client.id}`);
      }

      // Track Presence (🟢 Online)
      this.trackUserOnline(client);
    } catch (error) {
      this.logger.error(`Socket connection error for client ${client.id}`, error);
    }
  }

  /**
   * 2. 🔌 ডিসকানেকশন হ্যান্ডলার + অফলাইন স্ট্যাটাস ব্রডকাস্ট (⚪ Offline)
   */
  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.trackUserOffline(client);
  }

  /**
   * 3. 🚪 নির্দিষ্ট চ্যাট রুমে যুক্ত হওয়া (Join Conversation Room) + Presence নোটিফাই
   */
  @SubscribeMessage('join_conversation')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) {
      return { success: false, message: 'conversationId is required' };
    }

    const roomName = `chat_${data.conversationId}`;
    await client.join(roomName);
    client.activeConversationId = data.conversationId;

    // Add to room presence registry
    if (!this.roomPresence.has(roomName)) {
      this.roomPresence.set(roomName, new Set());
    }
    const userIdOrSocket = client.user?.id || client.id;
    this.roomPresence.get(roomName)!.add(userIdOrSocket);

    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    // Broadcast Online Presence to the room (🟢 Online)
    client.to(roomName).emit('presence_status', {
      conversationId: data.conversationId,
      userId: client.user?.id || client.id,
      name: client.user?.name || (client.user?.role === 'CUSTOMER' ? 'Customer' : 'Store Support'),
      role: client.user?.role || 'CUSTOMER',
      isOnline: true,
    });

    // Check if other party is already in this room
    const isOtherPartyOnline = this.roomPresence.get(roomName)!.size > 1;

    return {
      success: true,
      room: roomName,
      isOtherPartyOnline,
      message: `Successfully joined ${roomName}`,
    };
  }

  /**
   * 4. 🚪 চ্যাট রুম থেকে বের হওয়া (Leave Conversation Room)
   */
  @SubscribeMessage('leave_conversation')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const roomName = `chat_${data.conversationId}`;
    await client.leave(roomName);

    // Remove from room presence
    if (this.roomPresence.has(roomName)) {
      const userIdOrSocket = client.user?.id || client.id;
      this.roomPresence.get(roomName)!.delete(userIdOrSocket);
    }

    // Broadcast Offline Presence to the room (⚪ Offline)
    client.to(roomName).emit('presence_status', {
      conversationId: data.conversationId,
      userId: client.user?.id || client.id,
      name: client.user?.name || 'User',
      role: client.user?.role || 'CUSTOMER',
      isOnline: false,
    });

    client.activeConversationId = undefined;
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
    return { success: true, room: roomName };
  }

  /**
   * 5. 💬 রিয়েল-টাইম মেসেজ পাঠানো, ডাটাবেজে AES-256 এনক্রিপ্ট করে সেভ ও ব্রডকাস্ট করা
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; text: string; senderName?: string },
  ) {
    try {
      const { conversationId, text, senderName } = data;
      const user = client.user;

      const senderRole =
        user?.role === 'OWNER' ? 'OWNER' : user?.role === 'STAFF' ? 'STAFF' : 'CUSTOMER';
      const resolvedName =
        senderName || user?.name || (senderRole === 'CUSTOMER' ? 'Customer' : 'Store Support');

      // 🔒 AES-256 এনক্রিপ্ট করে ডাটাবেজে সেভ এবং ডিক্রিপ্ট করা মেসেজ রেসপন্স তৈরি
      const response = await this.chatService.saveMessage(
        conversationId,
        { text, senderName: resolvedName, senderRole },
        { id: user?.id, name: resolvedName, role: senderRole },
        client.tenantId,
      );

      const messagePayload = response.data;
      const roomName = `chat_${conversationId}`;

      // ⚡ নির্দিষ্ট চ্যাট রুমে থাকা সবাইকে রিয়েল-টাইমে মেসেজ পুশ করা (new_message & receive_message)
      this.server.to(roomName).emit('new_message', messagePayload);
      this.server.to(roomName).emit('receive_message', messagePayload);

      return { success: true, data: messagePayload };
    } catch (error: any) {
      this.logger.error('Failed to process socket message', error);
      return { success: false, message: error.message || 'Failed to send message' };
    }
  }

  /**
   * 6. ✍️ টাইপিং ইন্ডিকেটর (Typing Start & Stop)
   */
  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const roomName = `chat_${data.conversationId}`;
    client.to(roomName).emit('user_typing', {
      userId: client.user?.id || client.id,
      name: client.user?.name || (client.user?.role === 'CUSTOMER' ? 'Customer' : 'Store Support'),
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return;
    const roomName = `chat_${data.conversationId}`;
    client.to(roomName).emit('user_typing', {
      userId: client.user?.id || client.id,
      name: client.user?.name || (client.user?.role === 'CUSTOMER' ? 'Customer' : 'Store Support'),
      isTyping: false,
    });
  }

  /**
   * 7. 🟢 অনলাইন স্ট্যাটাস ইনকোয়ারি (Check Online Status)
   */
  @SubscribeMessage('check_presence')
  handleCheckPresence(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!data?.conversationId) return { isOnline: false };
    const roomName = `chat_${data.conversationId}`;
    const presenceSet = this.roomPresence.get(roomName);
    const isOnline = presenceSet ? presenceSet.size > 1 : false;
    return { isOnline };
  }

  // --- Helpers for Presence Registry ---

  private trackUserOnline(client: AuthenticatedSocket) {
    const tenantId = client.tenantId || 'global';
    const userId = client.user?.id || client.id;
    const role = client.user?.role || 'CUSTOMER';
    const name = client.user?.name || (role === 'CUSTOMER' ? 'Customer' : 'Store Support');

    if (!this.onlineUsers.has(tenantId)) {
      this.onlineUsers.set(tenantId, new Map());
    }

    const tenantMap = this.onlineUsers.get(tenantId)!;
    if (!tenantMap.has(userId)) {
      tenantMap.set(userId, { socketIds: new Set(), role, name });
    }
    tenantMap.get(userId)!.socketIds.add(client.id);

    // Broadcast to tenant that staff/owner or customer is online
    this.server.to(`tenant_${tenantId}`).emit('tenant_presence', {
      userId,
      role,
      name,
      status: 'online',
    });
  }

  private trackUserOffline(client: AuthenticatedSocket) {
    const tenantId = client.tenantId || 'global';
    const userId = client.user?.id || client.id;

    if (this.onlineUsers.has(tenantId)) {
      const tenantMap = this.onlineUsers.get(tenantId)!;
      if (tenantMap.has(userId)) {
        const entry = tenantMap.get(userId)!;
        entry.socketIds.delete(client.id);

        if (entry.socketIds.size === 0) {
          tenantMap.delete(userId);
          // Broadcast offline
          this.server.to(`tenant_${tenantId}`).emit('tenant_presence', {
            userId,
            role: entry.role,
            name: entry.name,
            status: 'offline',
          });
        }
      }
    }

    // Clean up room presence if client was in a conversation
    if (client.activeConversationId) {
      const roomName = `chat_${client.activeConversationId}`;
      if (this.roomPresence.has(roomName)) {
        this.roomPresence.get(roomName)!.delete(userId);
        client.to(roomName).emit('presence_status', {
          conversationId: client.activeConversationId,
          userId,
          role: client.user?.role || 'CUSTOMER',
          isOnline: false,
        });
      }
    }
  }
}
