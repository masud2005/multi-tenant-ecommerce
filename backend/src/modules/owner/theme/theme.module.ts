import { Module } from '@nestjs/common';
import { ThemeController } from './controllers/theme.controller';
import { ThemeSectionController } from './controllers/theme-section.controller';
import { ThemeService } from './services/theme.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ThemeController, ThemeSectionController],
  providers: [ThemeService],
  exports: [ThemeService],
})
export class ThemeModule {}
