import { AdminLayout } from '@/components/admin/admin-layout'
import { SearchInterestsAdmin } from '@/components/admin/search-interests'

export default async function AdminUserSearchInterestsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  return (
    <AdminLayout>
      <SearchInterestsAdmin userId={resolvedParams.id} />
    </AdminLayout>
  )
}


