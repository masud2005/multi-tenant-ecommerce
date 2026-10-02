import { Metadata } from 'next';
import { CategoryManager } from '@/components/dashboard/admin/categories';

export const metadata: Metadata = {
  title: 'Categories | Admin Dashboard',
  description: 'Hierarchical categories power navigation, filters and breadcrumbs.',
};

export default function AdminCategoriesPage() {
  return (
    <div className="w-full">
      <CategoryManager
        initialCategories={[]}
        products={[]}
      />
    </div>
  );
}

