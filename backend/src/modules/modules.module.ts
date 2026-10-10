import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OwnerModule } from './owner/owner.module';
import { CustomerModule } from './customer/customer.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    AuthModule,
    OwnerModule,
    CustomerModule,
    NotificationModule,
  ],
  exports: [
    AuthModule,
    OwnerModule,
    CustomerModule,
    NotificationModule,
  ],
})
export class ModulesModule {}

