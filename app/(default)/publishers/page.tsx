import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PublishersClient from "@/app/(default)/publishers/publishers-client"

export const metadata = {
  title: 'Publishers',
  description: 'Publishers listing',
}

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/auth/signin')
  return <PublishersClient />
}


