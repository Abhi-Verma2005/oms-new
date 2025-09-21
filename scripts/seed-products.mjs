// Seed script for Products (Packages) with features and tags
// Usage: node scripts/seed-products.mjs

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TAGS = [
  { name: 'Global', color: '#64748B' },
  { name: 'Featured', color: '#6366F1' },
  { name: 'Popular', color: '#22C55E' },
]

const PRODUCTS = [
  {
    slug: 'diamond',
    header: 'Diamond',
    subheader: '$1999 / mo',
    descriptionMarkdown: 'Enterprise-grade outreach package with maximum volume and priority support.',
    pricePerMonthCents: 199900,
    finalPricePerMonthCents: 179900,
    discountPercent: 10,
    currency: 'USD',
    badge: 'Best Value',
    isActive: true,
    sortOrder: 1,
    showOnShop2: true,
    showOnLinkBuilding: true,
    features: [
      { title: 'Guest Posts', value: '20 / month' },
      { title: 'DR Range', value: '60 - 80' },
      { title: 'Content Included', value: 'Yes' },
      { title: 'Priority Support', value: '24/7' },
    ],
    tagNames: ['Global', 'Featured'],
  },
  {
    slug: 'gold',
    header: 'Gold',
    subheader: '$999 / mo',
    descriptionMarkdown: 'Advanced package for scaling link building across vetted publishers.',
    pricePerMonthCents: 99900,
    finalPricePerMonthCents: 89900,
    discountPercent: 10,
    currency: 'USD',
    badge: 'Popular',
    isActive: true,
    sortOrder: 2,
    showOnShop2: true,
    showOnLinkBuilding: true,
    features: [
      { title: 'Guest Posts', value: '10 / month' },
      { title: 'DR Range', value: '40 - 70' },
      { title: 'Content Included', value: 'Yes' },
      { title: 'Support', value: 'Business Hours' },
    ],
    tagNames: ['Global', 'Popular'],
  },
  {
    slug: 'silver',
    header: 'Silver',
    subheader: '$499 / mo',
    descriptionMarkdown: 'Solid starter package for consistent outreach and link acquisition.',
    pricePerMonthCents: 49900,
    finalPricePerMonthCents: 44900,
    discountPercent: 10,
    currency: 'USD',
    isActive: true,
    sortOrder: 3,
    showOnShop2: true,
    showOnLinkBuilding: true,
    features: [
      { title: 'Guest Posts', value: '5 / month' },
      { title: 'DR Range', value: '30 - 60' },
      { title: 'Content Included', value: 'Yes' },
    ],
    tagNames: ['Global'],
  },
]

async function upsertTags() {
  const tagMap = new Map()
  for (const t of TAGS) {
    const tag = await prisma.tag.upsert({
      where: { name: t.name },
      update: { color: t.color, isActive: true },
      create: { name: t.name, color: t.color, isActive: true },
    })
    tagMap.set(t.name, tag.id)
  }
  return tagMap
}

async function upsertProduct(p, tagMap) {
  // Upsert product skeleton
  const product = await prisma.product.upsert({
    where: { slug: p.slug },
    update: {
      header: p.header,
      subheader: p.subheader,
      descriptionMarkdown: p.descriptionMarkdown,
      pricePerMonthCents: p.pricePerMonthCents,
      finalPricePerMonthCents: p.finalPricePerMonthCents,
      discountPercent: p.discountPercent,
      currency: p.currency,
      badge: p.badge,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      showOnShop2: p.showOnShop2,
      showOnLinkBuilding: p.showOnLinkBuilding,
    },
    create: {
      slug: p.slug,
      header: p.header,
      subheader: p.subheader,
      descriptionMarkdown: p.descriptionMarkdown,
      pricePerMonthCents: p.pricePerMonthCents,
      finalPricePerMonthCents: p.finalPricePerMonthCents,
      discountPercent: p.discountPercent,
      currency: p.currency,
      badge: p.badge,
      isActive: p.isActive,
      sortOrder: p.sortOrder,
      showOnShop2: p.showOnShop2,
      showOnLinkBuilding: p.showOnLinkBuilding,
    }
  })

  // Replace features (idempotent)
  await prisma.productFeature.deleteMany({ where: { productId: product.id } })
  for (const [idx, f] of (p.features || []).entries()) {
    await prisma.productFeature.create({
      data: {
        productId: product.id,
        title: f.title,
        value: f.value || null,
        icon: f.icon || null,
        sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : idx,
      }
    })
  }

  // Sync tags
  await prisma.productTag.deleteMany({ where: { productId: product.id } })
  for (const name of p.tagNames || []) {
    const tagId = tagMap.get(name)
    if (tagId) {
      await prisma.productTag.create({ data: { productId: product.id, tagId } })
    }
  }

  return product
}

async function main() {
  console.log('🌱 Seeding products...')
  const tagMap = await upsertTags()
  for (const p of PRODUCTS) {
    const prod = await upsertProduct(p, tagMap)
    console.log(`✅ Upserted product: ${prod.slug}`)
  }
  console.log('🎉 Seeding complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


