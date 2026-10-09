import { Module } from '@nestjs/common';
import {
  DiscountController,
  StorefrontDiscountController,
} from './discount.controller';
import { DiscountService } from './discount.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountController, StorefrontDiscountController],
  providers: [DiscountService],
  exports: [DiscountService],
})
export class DiscountModule {}
