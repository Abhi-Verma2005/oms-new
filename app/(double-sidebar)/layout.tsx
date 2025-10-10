import Header from '@/components/ui/header'
import Footer from '@/components/ui/footer'
import { Suspense } from 'react'

export default function AlternativeLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col">

      {/* Site header - sticky at top */}
      <Suspense fallback={null}>
        <Header variant="v2" />
      </Suspense>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pt-14 sm:pt-16">
        <Suspense fallback={null}>
          <main className="min-h-full [&>*:first-child]:scroll-mt-16">
            {children}
          </main>        
        </Suspense>

        {/* Global footer */}
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>

    </div>
  )
}
