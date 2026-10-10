import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { EmailService } from '../../shared/mail/email-service';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, EmailService],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}

