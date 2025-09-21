import { AdminLayout } from '@/components/admin/admin-layout';
import { ActivitiesManagement } from '@/components/admin/activities-management';

export default function AdminActivitiesPage() {
  return (
    <AdminLayout>
      <ActivitiesManagement />
    </AdminLayout>
  );
}