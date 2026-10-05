import { Module } from '@nestjs/common';
import { CategoryModule } from './category/category.module';
import { BrandModule } from './brand/brand.module';
import { CollectionModule } from './collection/collection.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { ThemeModule } from './theme/theme.module';

@Module({
  imports: [
    CategoryModule,
    BrandModule,
    CollectionModule,
    ProductModule,
    InventoryModule,
    ThemeModule,
  ],
  exports: [
    CategoryModule,
    BrandModule,
    CollectionModule,
    ProductModule,
    InventoryModule,
    ThemeModule,
  ],
})
export class OwnerModule {}
