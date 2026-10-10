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

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 1. 🔐 কনেকশন হ্যান্ডলার: JWT টোকেন ও tenantId ভেরিফিকেশন
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
    } catch (error) {
      this.logger.error(`Socket connection error for client ${client.id}`, error);
    }
  }

  /**
   * 2. 🔌 ডিসকানেকশন হ্যান্ডলার
   */
  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 3. 🚪 নির্দিষ্ট চ্যাট রুমে যুক্ত হওয়া (Join Conversation Room)
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

    this.logger.log(`Client ${client.id} joined room: ${roomName}`);

    return {
      success: true,
      room: roomName,
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
    this.logger.log(`Client ${client.id} left room: ${roomName}`);
    return { success: true, room: roomName };
  }

  /**
   * 5. 💬 রিয়েল-টাইম মেসেজ পাঠানো ও ব্রডকাস্ট করা
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

      // AES-256 এনক্রিপ্ট করে ডাটাবেজে সেভ এবং ডিক্রিপ্ট করা মেসেজ তৈরি
      const response = await this.chatService.saveMessage(
        conversationId,
        { text, senderName: resolvedName, senderRole },
        { id: user?.id, name: resolvedName, role: senderRole },
        client.tenantId,
      );

      const messagePayload = response.data;
      const roomName = `chat_${conversationId}`;

      // নির্দিষ্ট চ্যাট রুমে থাকা সবাইকে রিয়েল-টাইম মেসেজ ব্রডকাস্ট করা
      this.server.to(roomName).emit('new_message', messagePayload);

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
      userId: client.user?.id,
      name: client.user?.name || 'Customer',
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
      userId: client.user?.id,
      name: client.user?.name || 'Customer',
      isTyping: false,
    });
  }
}
