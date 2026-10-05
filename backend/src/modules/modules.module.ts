import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { OwnerModule } from './owner/owner.module';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    AuthModule,
    OwnerModule,
    CustomerModule,
  ],
  exports: [
    AuthModule,
    OwnerModule,
    CustomerModule,
  ],
})
export class ModulesModule {}

