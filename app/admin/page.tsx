import { AdminLayout } from '@/components/admin/admin-layout';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}