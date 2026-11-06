'use client';

import React from 'react';
import { useStore } from '@/contexts/StoreContext';
import { BrandsManager } from '@/components/dashboard/admin/brands';

export default function AdminBrandsPage() {
  const { products } = useStore();
  return (
    <div className="w-full">
      <BrandsManager initialBrands={[]} products={products} />
    </div>
  );
}
