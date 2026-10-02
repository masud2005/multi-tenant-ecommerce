import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './ower/category/category.module';
import { BrandModule } from './ower/brand/brand.module';
import { CollectionModule } from './ower/collection/collection.module';
import { ProductModule } from './ower/product/product.module';

@Module({
  imports: [
    AuthModule,
    CategoryModule,
    BrandModule,
    CollectionModule,
    ProductModule,
  ],
})
export class ModulesModule {}

