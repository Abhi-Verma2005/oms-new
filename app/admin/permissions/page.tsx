import { AdminLayout } from '@/components/admin/admin-layout';
import { PermissionsManagement } from '@/components/admin/permissions-management';

export default function AdminPermissionsPage() {
  return (
    <AdminLayout>
      <PermissionsManagement />
    </AdminLayout>
  );
}