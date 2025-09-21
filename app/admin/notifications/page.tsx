import { AdminLayout } from '@/components/admin/admin-layout';
import { NotificationsManagement } from '@/components/admin/notifications-management';

export default function NotificationsPage() {
  return (
    <AdminLayout>
      <NotificationsManagement />
    </AdminLayout>
  );
}
