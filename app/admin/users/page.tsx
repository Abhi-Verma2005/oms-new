import { AdminLayout } from '@/components/admin/admin-layout';
import { UsersManagement } from '@/components/admin/users-management';

export default function AdminUsersPage() {
  return (
    <AdminLayout>
      <UsersManagement />
    </AdminLayout>
  );
}
