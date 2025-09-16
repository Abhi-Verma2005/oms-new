import Header from '@/components/ui/header'
import Footer from '@/components/ui/footer'
import { Suspense } from 'react'

export default function AlternativeLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900">

      {/* Site header */}
      <Suspense fallback={null}>
        <Header variant="v2" />
      </Suspense>

      {/* Content area */}
      <Suspense fallback={null}>
        <main className="grow [&>*:first-child]:scroll-mt-16">
          {children}
        </main>        
      </Suspense>

      {/* Global footer */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>

    </div>
  )
}
