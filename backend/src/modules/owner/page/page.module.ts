import { Module } from '@nestjs/common';
import { OwnerPageController } from './page.controller';
import { OwnerPageService } from './page.service';

@Module({
  controllers: [OwnerPageController],
  providers: [OwnerPageService],
  exports: [OwnerPageService],
})
export class OwnerPageModule {}
