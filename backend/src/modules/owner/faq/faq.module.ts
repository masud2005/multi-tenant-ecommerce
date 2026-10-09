import { Module } from '@nestjs/common';
import { OwnerFaqController } from './faq.controller';
import { OwnerFaqService } from './faq.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerFaqController],
  providers: [OwnerFaqService],
  exports: [OwnerFaqService],
})
export class OwnerFaqModule {}
