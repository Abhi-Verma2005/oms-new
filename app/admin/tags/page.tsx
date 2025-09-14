import { AdminLayout } from '@/components/admin/admin-layout';
import { TagsManagement } from '@/components/admin/tags-management';

export default function TagsPage() {
  return (
    <AdminLayout>
      <TagsManagement />
    </AdminLayout>
  );
}
