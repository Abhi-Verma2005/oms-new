import Header from '@/components/ui/header'
import { Suspense } from 'react'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900">

      {/* Site header */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      {/* Content area */}
      <Suspense fallback={null}>
        <main className="grow [&>*:first-child]:scroll-mt-16">
          {children}
        </main>
      </Suspense>

    </div>
  )
}
