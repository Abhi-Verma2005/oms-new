import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PublishersClient from "./publishers-client"

export const metadata = {
  title: 'Publishers',
  description: 'Publishers listing',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <PublishersClient />
}


