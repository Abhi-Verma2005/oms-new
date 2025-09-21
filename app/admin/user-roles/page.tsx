import { AdminLayout } from '@/components/admin/admin-layout';
import { UserRolesManagement } from '@/components/admin/user-roles-management';

export default function AdminUserRolesPage() {
  return (
    <AdminLayout>
      <UserRolesManagement />
    </AdminLayout>
  );
}
