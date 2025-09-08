import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: 'Admin - Activities',
  description: 'Audit and activity logs',
}

async function ActivitiesServer() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  if (!(session.user as any)?.isAdmin) redirect('/dashboard')
  return <ActivitiesClient />
}

function ActivitiesClient() {
  return <ActivitiesList />
}

function ActivitiesList() {
  const React = require('react') as typeof import('react')
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [stats, setStats] = React.useState<any>(null)

  React.useEffect(() => {
    Promise.all([
      fetch('/api/admin/activities').then(r => r.json()),
      fetch('/api/admin/activities/stats').then(r => r.json()),
    ]).then(([a, s]) => {
      setItems(a.activities || [])
      setStats(s)
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading activities...</div>
  if (error) return <div className="p-8 text-red-600">{error}</div>

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Activities</h1>
          {stats && (
            <div className="mt-2 text-sm text-gray-500">Total: {stats.total}</div>
          )}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl relative">
        <header className="px-5 py-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Recent <span className="text-gray-400 dark:text-gray-500 font-medium">{items.length}</span></h2>
        </header>
        <div className="overflow-x-auto">
          <table className="table-auto w-full dark:text-gray-300 divide-y divide-gray-100 dark:divide-gray-700/60">
            <thead className="text-xs uppercase text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700/60">
              <tr>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">User</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Activity</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">Category</th>
                <th className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-left font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{it.user?.name || it.user?.email || it.userId}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{it.activity}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm">{it.category}</td>
                  <td className="px-2 first:pl-5 last:pr-5 py-3 whitespace-nowrap text-sm">{new Date(it.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-sm text-gray-500">No activities.</td>
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
  return <ActivitiesServer />
}
