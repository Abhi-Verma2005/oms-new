import Link from 'next/link'
import { prisma } from '@/lib/db'

async function getPackages() {
  const products = await prisma.product.findMany({
    where: { isActive: true, showOnLinkBuilding: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 4,
    include: {
      features: { orderBy: { sortOrder: 'asc' } },
      productTags: { include: { tag: true } },
    },
  })
  return products
}

export default async function LinkBuildingPackages() {
  const products = await getPackages()
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Link Building Packages</h1>
        <p className="text-gray-500 dark:text-gray-400">Choose from our curated monthly packages.</p>
      </div>
      <div className="grid grid-cols-12 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="col-span-12 md:col-span-6 xl:col-span-3">
            <div className="h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-xl p-5 flex flex-col">
              {p.badge && <div className="inline-flex text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 self-start mb-2">{p.badge}</div>}
              <div className="text-sm text-gray-500">{p.subheader}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{p.header}</h3>
              <div className="mt-4 space-y-2">
                {p.features.slice(0,8).map((f: any) => (
                  <div key={f.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="inline-block mt-1 mr-2 text-emerald-500">✓</span>
                    <span><span className="font-medium">{f.title}</span>{f.value ? `: ${f.value}` : ''}</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <Link href={`/ecommerce/product/${p.slug}`} className="btn w-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">View details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


