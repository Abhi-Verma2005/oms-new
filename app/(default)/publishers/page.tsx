import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PublishersClient from "../ecommerce/publishers/publishers-client"

export const metadata = {
  title: 'Publishers',
  description: 'Publishers listing',
}

// Mark this route as dynamic to allow usage of auth()/headers at runtime
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return (
    <div className="no-scrollbar">
      <PublishersClient />
    </div>
  )
}
