import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PublishersClient from "./publishers-client"
import { ResizableLayout } from "@/components/resizable-layout"

export const metadata = {
  title: 'Publishers',
  description: 'Publishers listing',
}

export const dynamic = 'force-dynamic'

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return (
    <ResizableLayout>
      <div className="no-scrollbar dark:bg-white w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-hidden">
        <PublishersClient />
      </div>
    </ResizableLayout>
  )
}


