import { Module } from '@nestjs/common';
import { CustomerFaqController } from './faq.controller';
import { CustomerFaqService } from './faq.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerFaqController],
  providers: [CustomerFaqService],
  exports: [CustomerFaqService],
})
export class CustomerFaqModule {}
