import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Admin - Roles',
  description: 'Manage user roles',
}

async function RolesServer() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (!(session.user as any)?.isAdmin) redirect('/dashboard')
  return <RolesClient />
}

function RolesClient() {
  return <RolesList />
}

function RolesList() {
  const React = require('react') as typeof import('react')
  const [roles, setRoles] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch('/api/admin/roles').then(async (r) => {
      if (!r.ok) throw new Error('Failed to load roles')
      const j = await r.json()
      setRoles(j.roles || [])
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading roles...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Roles</h1>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl relative">
        <header className="px-5 py-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">All Roles <span className="text-gray-400 dark:text-gray-500 font-medium">{roles.length}</span></h2>
        </header>
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700/60">
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700/60">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Name</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Description</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Active</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Users</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="">
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.displayName || r.name}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{r.description || '—'}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm">{r.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm">{r._count?.userRoles ?? 0}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm">{r._count?.rolePermissions ?? 0}</td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-sm text-gray-500">No roles.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  // @ts-ignore async server component wrapper
  return <RolesServer />
}
