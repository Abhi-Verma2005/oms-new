import { AdminLayout } from '@/components/admin/admin-layout';
import { ReviewsManagement } from '@/components/admin/reviews-management'

export default function AdminReviewsPage() {
  return (
    <AdminLayout>
      <ReviewsManagement />
    </AdminLayout>
  );
}
