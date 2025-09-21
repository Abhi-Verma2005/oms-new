// Compatibility endpoint to support Stripe Dashboard URLs pointing to /api/webhook
// Forwards to the actual Stripe webhook handler located at /api/webhooks/stripe

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export { POST } from '../webhooks/stripe/route'


