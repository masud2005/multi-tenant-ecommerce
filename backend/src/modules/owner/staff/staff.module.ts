import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { EmailService } from '../../../shared/mail/email-service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [StaffController],
  providers: [StaffService, EmailService],
  exports: [StaffService],
})
export class StaffModule {}
