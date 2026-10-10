import { Module, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from '../../shared/mail/email-service';

@Global()
@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EmailService],
  exports: [NotificationService],
})
export class NotificationModule {}
