import { Module } from '@nestjs/common';
import { OwnerSupportController } from './support.controller';
import { OwnerSupportService } from './support.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerSupportController],
  providers: [OwnerSupportService],
  exports: [OwnerSupportService],
})
export class OwnerSupportModule {}
