export const dynamic = 'force-dynamic'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import CheckoutClient from './CheckoutClient'

export const metadata = {
  title: 'Checkout - Mosaic',
  description: 'Complete your payment',
}

async function CheckoutServer() {
  const session = await auth()
  if (!session) redirect('/signin')
  return <CheckoutClient />
}

export default function Page() {
  // @ts-ignore async server component wrapper
  return <CheckoutServer />
}
