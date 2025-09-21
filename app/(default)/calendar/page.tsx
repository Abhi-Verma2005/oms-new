export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Calendar - Mosaic',
  description: 'Page description',
}

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import CalendarClient from './CalendarClient'

export default async function Calendar() {
  const session = await auth()
  if (!session) redirect('/signin')
  
  return <CalendarClient />
}