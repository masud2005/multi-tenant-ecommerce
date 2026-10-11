import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  role?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

      if (token) {
        try {
          const secret = this.configService.get<string>('app.jwtSecret') || 'jwt-secret';
          const payload = await this.jwtService.verifyAsync(token, { secret });
          client.userId = payload.sub || payload.id;
          client.tenantId = payload.tenantId || tenantId;
          client.role = payload.role;

          if (client.userId) {
            const userRoom = `user_${client.userId}`;
            await client.join(userRoom);
            this.logger.log(`User ${client.userId} joined notification room: ${userRoom}`);
          }

          if (client.tenantId) {
            const tenantRoom = `tenant_${client.tenantId}`;
            await client.join(tenantRoom);
          }
        } catch (authError) {
          this.logger.warn(`Invalid JWT token on /notifications: ${client.id}`);
          client.disconnect();
        }
      } else {
        this.logger.warn(`Missing token on /notifications connection: ${client.id}`);
        client.disconnect();
      }
    } catch (err) {
      this.logger.error(`Error connecting to notification gateway (${client.id})`, err);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  /**
   * 🔔 Send Real-Time Notification to a specific User
   */
  sendToUser(userId: string, notification: any) {
    if (!this.server || !userId) return;
    const userRoom = `user_${userId}`;
    this.server.to(userRoom).emit('new_notification', notification);
    this.logger.log(`⚡ Real-time notification dispatched to user: ${userId} (${notification.title})`);
  }

  /**
   * 📢 Send Real-Time Notification to an entire Tenant (All Staff & Owner)
   */
  sendToTenant(tenantId: string, notification: any) {
    if (!this.server || !tenantId) return;
    const tenantRoom = `tenant_${tenantId}`;
    this.server.to(tenantRoom).emit('new_notification', notification);
    this.logger.log(`⚡ Real-time notification dispatched to tenant: ${tenantId}`);
  }
}
