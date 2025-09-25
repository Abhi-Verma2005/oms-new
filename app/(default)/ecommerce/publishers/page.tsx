import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PublishersClient from "./publishers-client"

export const metadata = {
  title: 'Publishers',
  description: 'Publishers listing',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function Page({ searchParams }: PageProps) {
  const session = await auth()
  if (!session) redirect('/signin')
  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <PublishersClient searchParams={searchParams} />
    </div>
  )
}


