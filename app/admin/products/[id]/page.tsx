import { AdminLayout } from '@/components/admin/admin-layout';
import { EditProductForm } from '@/components/admin/edit-product-form';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminLayout>
      <EditProductForm params={params} />
    </AdminLayout>
  );
}
