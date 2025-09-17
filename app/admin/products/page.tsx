import { AdminLayout } from '@/components/admin/admin-layout';
import { ProductsManagement } from '@/components/admin/products-management';

export default function AdminProductsPage() {
  return (
    <AdminLayout>
      <ProductsManagement />
    </AdminLayout>
  );
}


