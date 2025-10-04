import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const caseStudiesData = [
  {
    title: 'Finance SEO',
    subtitle: '15M Organic Visitors in 3 Months using HQ Backlinks',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-protean-case-study.png',
    category: 'Finance',
    stats: [
      { value: '933%', label: 'Increase in organic search traffic' },
      { value: '600+', label: 'Keywords in top 3 SERP\'s' }
    ],
    link: 'https://emiactech.com/emiac-clients/protean-egov-technologies/',
    displayOrder: 1
  },
  {
    title: 'Finance SEO',
    subtitle: '300K Words Driving 73+ Top Keyword Ranks',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-shriram-finance-case-study.png',
    category: 'Finance',
    stats: [
      { value: '300K+', label: 'Words written in 35 days' },
      { value: '73+', label: 'Loan keywords in top 3 SERP\'s' }
    ],
    link: 'https://emiactech.com/emiac-clients/shriram-finance/',
    displayOrder: 2
  },
  {
    title: 'Finance SEO',
    subtitle: '20K+ Keywords Ranked with Finance Backlinks',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-axis-bank-case-study.png',
    category: 'Finance',
    stats: [
      { value: '162M', label: 'Monthly Visitors(Up from 148M)' },
      { value: '100+', label: 'Authority Backlinks from Finance Websites' }
    ],
    link: '#',
    displayOrder: 3
  },
  {
    title: 'Insurance SEO',
    subtitle: 'From 4K to 33K Medical Audience in 4 Months',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/Copy-of-Logo-for-Website-Case-Study.png',
    category: 'Insurance',
    stats: [
      { value: '8X', label: 'Traffic Growth with Healthcare Content' },
      { value: '30-40', label: 'HQ Backlinks from Medical & News Sites' }
    ],
    link: 'https://emiactech.com/emiac-clients/vijaya-diagnostic-centre/',
    displayOrder: 4
  },
  {
    title: 'Insurance SEO',
    subtitle: 'Healthcare SEO Content and Backlinks',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-sukoon-case-study.png',
    category: 'Insurance',
    stats: [
      { value: '211%', label: 'Rise in organic search traffic' },
      { value: '10+', label: 'Keywords optimised for GEO' }
    ],
    link: '#',
    displayOrder: 5
  },
  {
    title: 'Healthcare SEO',
    subtitle: '343% Organic Growth Through Ayurveda Content',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/Copy-of-Logo-for-Website-Case-Study-1.png',
    category: 'Healthcare',
    stats: [
      { value: '2600+', label: 'Keywords Ranked in Top 3 SERPs' },
      { value: '+348K', label: 'Monthly Organic Visitors' }
    ],
    link: 'https://emiactech.com/emiac-clients/zanducare/',
    displayOrder: 6
  },
  {
    title: 'Healthcare SEO',
    subtitle: 'From 4K to 33K Medical Audience in 4 Months',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/Copy-of-Logo-for-Website-Case-Study.png',
    category: 'Healthcare',
    stats: [
      { value: '8X', label: 'Traffic Growth with Healthcare Content' },
      { value: '30-40', label: 'HQ Backlinks from Medical & News Sites' }
    ],
    link: 'https://emiactech.com/emiac-clients/vijaya-diagnostic-centre/',
    displayOrder: 7
  },
  {
    title: 'Healthcare SEO',
    subtitle: 'Healthcare SEO Content and Backlinks',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-sukoon-case-study.png',
    category: 'Healthcare',
    stats: [
      { value: '211%', label: 'Rise in organic search traffic' },
      { value: '10+', label: 'Keywords optimised for GEO' }
    ],
    link: '#',
    displayOrder: 8
  },
  {
    title: 'Education SEO',
    subtitle: '51.86% Traffic Growth for Online Learning Platform',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-upgrad-case-study.png',
    category: 'Education',
    stats: [
      { value: '51.86%', label: 'Traffic Growth' },
      { value: '3000+', label: 'Keywords Ranked' }
    ],
    link: 'https://emiactech.com/emiac-clients/upgrad/',
    displayOrder: 9
  },
  {
    title: 'Technology SEO',
    subtitle: '78.09% Traffic Growth for Automotive Platform',
    imageSrc: 'https://emiactech.com/wp-content/uploads/2025/09/emiac-mahindra-case-study.png',
    category: 'Technology',
    stats: [
      { value: '78.09%', label: 'Traffic Growth' },
      { value: '3000+', label: 'Keywords Ranked' }
    ],
    link: 'https://emiactech.com/emiac-clients/mahindra-auto/',
    displayOrder: 10
  }
]

async function seedHomepageCaseStudies() {
  try {
    console.log('🌱 Seeding homepage case studies...')

    // Clear existing data
    await prisma.homepageCaseStudy.deleteMany({})
    console.log('✅ Cleared existing homepage case studies')

    // Insert new data
    for (const caseStudy of caseStudiesData) {
      await prisma.homepageCaseStudy.create({
        data: {
          title: caseStudy.title,
          subtitle: caseStudy.subtitle,
          imageSrc: caseStudy.imageSrc,
          category: caseStudy.category,
          stats: caseStudy.stats,
          link: caseStudy.link,
          displayOrder: caseStudy.displayOrder,
          isActive: true
        }
      })
    }

    console.log(`✅ Successfully seeded ${caseStudiesData.length} homepage case studies`)
  } catch (error) {
    console.error('❌ Error seeding homepage case studies:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedHomepageCaseStudies()
  .then(() => {
    console.log('🎉 Homepage case studies seeding completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  })
