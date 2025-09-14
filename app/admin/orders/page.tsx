import { AdminLayout } from '@/components/admin/admin-layout';
import { OrdersManagement } from '@/components/admin/orders-management';

export default function OrdersPage() {
  return (
    <AdminLayout>
      <OrdersManagement />
    </AdminLayout>
  );
}
