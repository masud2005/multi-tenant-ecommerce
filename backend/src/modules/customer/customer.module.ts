import { Module } from '@nestjs/common';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    CartModule,
    WishlistModule,
  ],
  exports: [
    CartModule,
    WishlistModule,
  ],
})
export class CustomerModule {}
