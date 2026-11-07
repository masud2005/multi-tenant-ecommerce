import { Metadata } from 'next';
import { ReviewsManager } from '@/components/dashboard/admin/reviews';

export const metadata: Metadata = {
  title: 'Reviews | Admin Dashboard',
  description:
    'Moderate and manage customer product reviews, ratings, and public replies.',
};

export default function AdminReviewsPage() {
  return (
    <div className="w-full">
      <ReviewsManager />
    </div>
  );
}
