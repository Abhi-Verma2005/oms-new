import Link from 'next/link'
import Markdown from 'react-markdown'
import { ReviewsDisplay } from '@/components/reviews-display'
import AddToCartProductButton from '@/components/ecommerce/add-to-cart-product-button'

async function getData(slug: string) {
  const res = await fetch(`/api/products/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  const { product } = await res.json()
  return product
}

export default async function ProductDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getData(slug)
  if (!product) return <div className="p-8">Not found</div>
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-6xl mx-auto">
      <div className="mb-5">
        <Link className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="/ecommerce/shop-2">&lt;- Back To Shop</Link>
      </div>
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100">{product.header}</h1>
          {product.subheader && <div className="text-gray-500 dark:text-gray-400">{product.subheader}</div>}
          <div className="prose dark:prose-invert mt-6">
            <Markdown>{product.descriptionMarkdown || ''}</Markdown>
          </div>
          <hr className="my-6 border-t border-gray-100 dark:border-gray-700/60" />
          <h2 className="text-xl font-semibold mb-3">Features</h2>
          <ul className="space-y-2">
            {product.features.map((f: any) => (
              <li key={f.id} className="flex items-start text-gray-800 dark:text-gray-200">
                <span className="inline-block mt-1 mr-2 text-emerald-500">✓</span>
                <span><span className="font-medium">{f.title}</span>{f.value ? `: ${f.value}` : ''}</span>
              </li>
            ))}
          </ul>
          <hr className="my-6 border-t border-gray-100 dark:border-gray-700/60" />
          <ReviewsDisplay 
            productId={product.id}
            productTags={product.productTags?.map((pt: any) => pt.tag.id) || []}
            maxReviews={10}
            showGlobalReviews={true}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 p-5 shadow-sm rounded-xl">
            <div className="text-sm text-gray-800 dark:text-gray-100 font-semibold mb-3">Select</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800 dark:text-gray-100">{product.header}</span>
                {product.finalPricePerMonthCents != null && (
                  <span className="font-medium text-green-600">${(product.finalPricePerMonthCents/100).toFixed(2)}</span>
                )}
              </div>
              {product.discountPercent ? (
                <div className="text-xs text-gray-500">{product.discountPercent}% Discount</div>
              ) : null}
            </div>
            <AddToCartActions product={product} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AddToCartActions({ product }: { product: any }) {
  const priceDollars = (product.finalPricePerMonthCents ?? product.pricePerMonthCents ?? 0) / 100
  return (
    <div className="mt-4 space-y-2">
      <AddToCartProductButton id={product.id} name={product.header} priceDollars={priceDollars} className="btn w-full bg-violet-600 hover:bg-violet-700 text-white" />
      <a
        href={`/checkout?priceCents=${product.finalPricePerMonthCents ?? product.pricePerMonthCents ?? 0}&siteName=${encodeURIComponent(product.header)}&productId=${product.id}`}
        className="btn w-full bg-gray-900 text-gray-100 dark:bg-gray-100 dark:text-gray-800 text-center"
      >
        Buy Now
      </a>
    </div>
  )
}


