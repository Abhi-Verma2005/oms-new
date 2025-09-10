"use client"

import { AdminLayout } from '@/components/admin/admin-layout'
import dynamic from 'next/dynamic'
import { Suspense, useEffect, useState } from 'react'

const Client = dynamic(() => import('./user-feedback-client'), { ssr: false })

export default function AdminUserFeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    params.then((resolvedParams) => {
      setUserId(resolvedParams.id)
    })
  }, [params])

  if (!userId) {
    return (
      <AdminLayout>
        <div className="p-6">Loading...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <Suspense>
        <Client userId={userId} />
      </Suspense>
    </AdminLayout>
  )
}


