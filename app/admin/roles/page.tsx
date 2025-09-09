import { AdminLayout } from '@/components/admin/admin-layout';
import { RolesManagement } from '@/components/admin/roles-management';

export default function AdminRolesPage() {
  return (
    <AdminLayout>
      <RolesManagement />
    </AdminLayout>
  );
}