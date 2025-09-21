import { AdminLayout } from '@/components/admin/admin-layout';
import { NotificationTypesManagement } from '@/components/admin/notification-types-management';

export default function NotificationTypesPage() {
  return (
    <AdminLayout>
      <NotificationTypesManagement />
    </AdminLayout>
  );
}
