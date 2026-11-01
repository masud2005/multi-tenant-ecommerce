import { Module } from '@nestjs/common';
import { CustomerPageController } from './page.controller';
import { CustomerPageService } from './page.service';

@Module({
  controllers: [CustomerPageController],
  providers: [CustomerPageService],
  exports: [CustomerPageService],
})
export class CustomerPageModule {}
