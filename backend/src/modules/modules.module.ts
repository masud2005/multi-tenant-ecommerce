import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OwnerModule } from './owner/owner.module';
import { CustomerModule } from './customer/customer.module';
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    AuthModule,
    OwnerModule,
    CustomerModule,
    NotificationModule,
    ChatModule,
  ],
  exports: [
    AuthModule,
    OwnerModule,
    CustomerModule,
    NotificationModule,
    ChatModule,
  ],
})
export class ModulesModule {}

