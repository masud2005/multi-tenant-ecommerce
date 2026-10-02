import { Metadata } from 'next';
import { products } from '@/data/products';
import { BrandsManager } from '@/components/dashboard/admin/brands';

export const metadata: Metadata = {
  title: 'Brands | Admin Dashboard',
  description: 'Each brand gets its own storefront page, product showcase, and filter.',
};

export default function AdminBrandsPage() {
  return (
    <div className="w-full">
      <BrandsManager initialBrands={[]} products={products} />
    </div>
  );
}
