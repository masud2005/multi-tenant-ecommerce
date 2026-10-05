import { Metadata } from 'next';
import { CollectionsManager } from '@/components/dashboard/admin/collections';

export const metadata: Metadata = {
  title: 'Collections | Admin Dashboard',
  description:
    'Group products for campaigns and navigation — pick them by hand or let rules keep them up to date.',
};

export default function AdminCollectionsPage() {
  return (
    <div className="w-full">
      <CollectionsManager />
    </div>
  );
}
