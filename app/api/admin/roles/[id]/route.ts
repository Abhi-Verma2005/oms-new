import { NextRequest, NextResponse } from "next/server"
import { requireAdminForAPI } from "@/lib/auth-middleware"
import { prisma } from "@/lib/db"
import { addSecurityHeaders } from "@/lib/security"

export async function GET(_req: NextRequest, { params }: any) {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const role = await prisma.role.findUnique({
    where: { id: params?.id },
    include: {
      rolePermissions: { include: { permission: true } },
      _count: { select: { userRoles: { where: { isActive: true } } } },
    },
  })

  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const res = NextResponse.json({ role })
  addSecurityHeaders(res)
  return res
}
