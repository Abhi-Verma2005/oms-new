import { NextResponse } from "next/server"
import { requireAdminForAPI, getUsersWithRoles } from "@/lib/auth-middleware"
import { addSecurityHeaders } from "@/lib/security"

export async function GET() {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const users = await getUsersWithRoles()
  const res = NextResponse.json({ users })
  addSecurityHeaders(res)
  return res
}
