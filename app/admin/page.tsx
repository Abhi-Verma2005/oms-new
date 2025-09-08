import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Admin',
  description: 'Administration',
}

async function AdminServer() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (!(session.user as any)?.isAdmin) redirect('/dashboard')
  return <AdminClient />
}

function AdminClient() {
  return <UsersList />
}

function UsersList() {
  const React = require('react') as typeof import('react')
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/admin/users').then(async (r) => {
      if (!r.ok) throw new Error('Failed to load users')
      const j = await r.json()
      setUsers(j.users || [])
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading users...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Admin - Users</h1>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.length === 0 && <div className="p-6 text-sm text-gray-500">No users.</div>}
          {users.map((u) => (
            <div key={u.id} className="p-6 grid grid-cols-3 gap-4 items-center">
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{u.name || u.email}</div>
                <div className="text-xs text-gray-500">{u.email}</div>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">Roles: {(u.userRoles || []).map((ur: any) => ur.role?.name).join(', ')}</div>
              <div className="text-xs text-gray-500">Joined {new Date(u.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  // @ts-ignore async server component wrapper
  return <AdminServer />
}
