"use client"

import Image from "next/image"
import React from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"

type Review = {
  quote: string
  name: string
  handle: string
  title: string
  avatar: string
}

const REVIEWS: Review[] = [
  {
    quote:
      "Nothing short of groundbreaking for outreach teams. It changed how we work overnight.",
    name: "Aarav Mehta",
    handle: "@aarav-mehta",
    title: "Head of Growth, Zento",
    avatar: "/images/user-64-03.jpg",
  },
  {
    quote:
      "10x more productive managing publishers and orders. It just flows.",
    name: "Priya Kapoor",
    handle: "@priya.kapoor",
    title: "SEO Lead, Northwind",
    avatar: "/images/user-64-07.jpg",
  },
  {
    quote:
      "Beautiful UI, fast search, and the analytics we actually use.",
    name: "Rahul Khanna",
    handle: "@rahulkh",
    title: "Founder, RankForge",
    avatar: "/images/user-64-12.jpg",
  },
  {
    quote:
      "From discovery to checkout in minutes. Our clients love the speed.",
    name: "Ananya Singh",
    handle: "@ananya",
    title: "Agency Partner, Flux Media",
    avatar: "/images/user-64-05.jpg",
  },
  {
    quote:
      "The best platform experience in our stack. Period.",
    name: "Dev Patel",
    handle: "@devpatel",
    title: "Marketing Ops, Quanta",
    avatar: "/images/user-64-10.jpg",
  },
]

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="min-w-0 shrink-0 grow-0 basis-full px-4">
      <div className="h-full rounded-2xl border bg-white/80 backdrop-blur text-gray-900 shadow-sm border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-gray-100">
        <div className="px-6 py-7 sm:px-8 sm:py-9 flex flex-col items-center text-center">
          <Image
            src={review.avatar}
            alt={review.name}
            width={72}
            height={72}
            className="rounded-full ring-4 ring-white/80 dark:ring-white/10"
          />
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-gray-800 dark:text-gray-100">
            {review.quote}
          </p>
          <div className="mt-6 text-base font-medium text-gray-900 dark:text-gray-100">
            {review.handle}
          </div>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{review.title}</div>
        </div>
      </div>
    </div>
  )
}

export default function ReviewsCarousel() {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 4500, stopOnInteraction: false })]
  )

  return (
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -mx-4">
          {REVIEWS.map((r, idx) => (
            <ReviewCard key={idx} review={r} />
          ))}
        </div>
      </div>
    </div>
  )
}


