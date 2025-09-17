'use client'

import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/admin/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DoughnutChart from '@/components/charts/doughnut-chart'
import BarChart01 from '@/components/charts/bar-chart-01'

type Review = {
  id: string
  authorName: string
  rating: number
  bodyMarkdown: string
  isApproved: boolean
  displayOrder: number
  reviewTags: Array<{ id: string; tag: { id: string; name: string; color: string } }>
  reviewProducts: Array<{ product: { id: string; slug: string; header: string } }>
}

export default function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { id } = await params
      const res = await fetch(`/api/admin/reviews/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setReview(data.review)
      setLoading(false)
    }
    load()
  }, [params])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Review Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
            {!loading && review && (
              <div className="space-y-6">
                {/* Top summary */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${review.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {review.isApproved ? 'Approved' : 'Pending'}
                  </div>
                  <div className="text-xs text-gray-500">Display order: {review.displayOrder}</div>
                  <div className="text-xs text-gray-500">Tags: {review.reviewTags.length}</div>
                  <div className="text-xs text-gray-500">Mapped products: {review.reviewProducts.length}</div>
                  <div className="text-xs text-gray-500">Length: {review.bodyMarkdown.trim().length} chars</div>
                </div>

                {/* Two column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Review</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-white/50 dark:bg-gray-800/40">
                        {review.bodyMarkdown}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {review.reviewTags.map(rt => (
                          <span key={rt.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: rt.tag.color + '20', color: rt.tag.color }}>
                            {rt.tag.name}
                          </span>
                        ))}
                        {review.reviewTags.length === 0 && <span className="text-xs text-gray-500">No tags</span>}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Mapped Products</div>
                      <div className="flex flex-wrap gap-2">
                        {review.reviewProducts.map((rp, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-lg border text-xs" >{rp.product.header}</span>
                        ))}
                        {review.reviewProducts.length === 0 && <span className="text-xs text-gray-500">Not mapped yet</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: charts */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Rating</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <DoughnutChart
                            data={{
                              labels: ['Rating', 'Remaining'],
                              datasets: [{
                                data: [review.rating, Math.max(0, 5 - review.rating)],
                                backgroundColor: ['#f59e0b', '#6b7280'],
                                borderWidth: 0,
                              }],
                            }}
                            width={320}
                            height={180}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Product Mappings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-48">
                          <BarChart01
                            data={{
                              labels: review.reviewProducts.length ? review.reviewProducts.map(rp => rp.product.header) : ['No mappings'],
                              datasets: [{
                                label: 'Count',
                                data: review.reviewProducts.length ? review.reviewProducts.map(() => 1) : [0],
                                backgroundColor: '#6366f1',
                                borderWidth: 0,
                                barThickness: 18,
                              }],
                            }}
                            width={320}
                            height={180}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}


