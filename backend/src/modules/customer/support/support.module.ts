import { Module } from '@nestjs/common';
import { CustomerSupportController } from './support.controller';
import { CustomerSupportService } from './support.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerSupportController],
  providers: [CustomerSupportService],
  exports: [CustomerSupportService],
})
export class CustomerSupportModule {}
