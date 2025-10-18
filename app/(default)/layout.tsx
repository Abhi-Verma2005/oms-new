import Header from '@/components/ui/header'
import Footer from '@/components/ui/footer'
import { Suspense } from 'react'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <div className="min-h-[100dvh] flex flex-col">

      {/* Site header - sticky at top */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <Suspense fallback={null}>
          <main className="min-h-full pt-14 sm:pt-16">
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
