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
import { readTokenClaims, textField } from '../auth/utils/token.util';

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
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const bearer = textField(client.handshake.headers, 'authorization');
      const token =
        textField(client.handshake.auth, 'token') ||
        (bearer ? bearer.replace(/^Bearer\s+/i, '') : undefined) ||
        textField(client.handshake.query, 'token');

      const tenantId =
        textField(client.handshake.auth, 'tenantId') ||
        textField(client.handshake.headers, 'x-tenant-id') ||
        textField(client.handshake.query, 'tenantId');

      if (token) {
        try {
          const secret =
            this.configService.get<string>('jwt.accessSecret') ||
            this.configService.get<string>('app.jwtSecret') ||
            'jwt-secret';
          const payload = readTokenClaims(
            await this.jwtService.verifyAsync(token, { secret }),
          );
          client.userId = payload.sub || payload.id;
          client.tenantId = payload.tenantId || tenantId;
          client.role = payload.role;

          if (client.userId) {
            const userRoom = `user_${client.userId}`;
            await client.join(userRoom);
            this.logger.log(
              `User ${client.userId} joined notification room: ${userRoom}`,
            );
          }

          if (client.tenantId) {
            const tenantRoom = `tenant_${client.tenantId}`;
            await client.join(tenantRoom);
          }
        } catch {
          this.logger.warn(`Invalid JWT token on /notifications: ${client.id}`);
          client.disconnect();
        }
      } else {
        this.logger.warn(
          `Missing token on /notifications connection: ${client.id}`,
        );
        client.disconnect();
      }
    } catch (err) {
      this.logger.error(
        `Error connecting to notification gateway (${client.id})`,
        err,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  /**
   * 🔔 Send Real-Time Notification to a specific User
   */
  sendToUser(userId: string, notification: { title?: string }) {
    if (!this.server || !userId) return;
    const userRoom = `user_${userId}`;
    this.server.to(userRoom).emit('new_notification', notification);
    this.logger.log(
      `⚡ Real-time notification dispatched to user: ${userId} (${notification.title})`,
    );
  }

  /**
   * 📢 Send Real-Time Notification to an entire Tenant (All Staff & Owner)
   */
  sendToTenant(tenantId: string, notification: { title?: string }) {
    if (!this.server || !tenantId) return;
    const tenantRoom = `tenant_${tenantId}`;
    this.server.to(tenantRoom).emit('new_notification', notification);
    this.logger.log(
      `⚡ Real-time notification dispatched to tenant: ${tenantId}`,
    );
  }
}
