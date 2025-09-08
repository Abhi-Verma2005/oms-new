import { NextResponse } from "next/server"
import { requireAdminForAPI, getPermissionsWithCounts } from "@/lib/auth-middleware"
import { addSecurityHeaders } from "@/lib/security"

export async function GET() {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const permissions = await getPermissionsWithCounts()
  const res = NextResponse.json({ permissions })
  addSecurityHeaders(res)
  return res
}
