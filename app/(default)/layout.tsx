import Header from '@/components/ui/header'

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode
}) {  
  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900">

      {/* Site header */}
      <Header />

      {/* Content area */}
      <main className="grow [&>*:first-child]:scroll-mt-16">
        {children}
      </main>        

    </div>
  )
}
