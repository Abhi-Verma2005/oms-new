import { NextResponse } from "next/server"
import { requireAdminForAPI, getRolesWithCounts } from "@/lib/auth-middleware"
import { addSecurityHeaders } from "@/lib/security"

export async function GET() {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const roles = await getRolesWithCounts()
  const res = NextResponse.json({ roles })
  addSecurityHeaders(res)
  return res
}
