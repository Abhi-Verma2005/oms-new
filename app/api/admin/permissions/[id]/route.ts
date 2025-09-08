import { NextRequest, NextResponse } from "next/server"
import { requireAdminForAPI } from "@/lib/auth-middleware"
import { prisma } from "@/lib/db"
import { addSecurityHeaders } from "@/lib/security"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdminForAPI()
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unauthorized' }, { status: 401 })
  }

  const permission = await prisma.permission.findUnique({
    where: { id: params.id },
    include: {
      rolePermissions: { include: { role: true } },
    },
  })

  if (!permission) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const res = NextResponse.json({ permission })
  addSecurityHeaders(res)
  return res
}
