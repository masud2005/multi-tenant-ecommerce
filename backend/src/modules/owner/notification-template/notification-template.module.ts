import { Module } from '@nestjs/common';
import { OwnerNotificationTemplateController } from './notification-template.controller';
import { OwnerNotificationTemplateService } from './notification-template.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerNotificationTemplateController],
  providers: [OwnerNotificationTemplateService],
  exports: [OwnerNotificationTemplateService],
})
export class OwnerNotificationTemplateModule {}
