import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import OrdersClient from "./OrdersClient"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Orders',
  description: 'Orders',
}

export default async function Page() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <OrdersClient />
}
