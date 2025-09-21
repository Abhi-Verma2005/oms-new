import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function seedCaseStudies() {
  console.log('🌱 Seeding case studies with real data...')

  try {
    // Clear existing data
    await prisma.serpFeature.deleteMany()
    await prisma.keywordData.deleteMany()
    await prisma.monthlyData.deleteMany()
    await prisma.caseStudy.deleteMany()

    // 1. Mahindra Auto Case Study
    const mahindraAuto = await prisma.caseStudy.create({
      data: {
        clientName: 'Mahindra Auto',
        industry: 'Automotive',
        campaignDuration: 'Feb 2025 - Jul 2025',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-07-31'),
        isActive: true,
        trafficGrowth: 78.09,
        initialTraffic: 18.17,
        finalTraffic: 32.37,
        keywordsRanked: 3000,
        backlinksPerMonth: 75,
        domainRatingStart: 45,
        domainRatingEnd: 52,
        objective: 'Increase organic traffic and improve keyword rankings for SUV models and automotive terms',
        challenge: 'Competitive automotive market with established players and high competition for SUV-related keywords',
        solution: 'Comprehensive SEO strategy focusing on technical optimization, content marketing, and link building',
        finalOutcomes: 'Achieved 78.09% traffic growth with 3000+ keywords ranking in top 3 positions',
        serpFeatures: true,
        aiOverview: true
      }
    })

    // Mahindra Auto Monthly Data
    const mahindraMonthlyData = [
      { month: 'Feb 2025', traffic: 18.17, keywords: 2500, backlinks: 75 },
      { month: 'Mar 2025', traffic: 19.5, keywords: 2600, backlinks: 78 },
      { month: 'Apr 2025', traffic: 22.1, keywords: 2700, backlinks: 80 },
      { month: 'May 2025', traffic: 25.8, keywords: 2800, backlinks: 82 },
      { month: 'Jun 2025', traffic: 28.9, keywords: 2900, backlinks: 85 },
      { month: 'Jul 2025', traffic: 32.37, keywords: 3000, backlinks: 88 }
    ]

    for (const data of mahindraMonthlyData) {
      await prisma.monthlyData.create({
        data: {
          caseStudyId: mahindraAuto.id,
          month: data.month,
          traffic: data.traffic,
          keywords: data.keywords,
          backlinks: data.backlinks
        }
      })
    }

    // Mahindra Auto Keyword Data
    const mahindraKeywords = [
      { keyword: 'Bolero', jan2025: 3, feb2025: 2, mar2025: 2, apr2025: 2, may2025: 2, jun2025: 1, jul2025: 1 },
      { keyword: 'Scorpio Classic', jan2025: 3, feb2025: 3, mar2025: 2, apr2025: 2, may2025: 1, jun2025: 1, jul2025: 1 },
      { keyword: 'Thar', jan2025: 2, feb2025: 2, mar2025: 2, apr2025: 2, may2025: 2, jun2025: 1, jul2025: 1 },
      { keyword: 'Scorpio S11', jan2025: 30, feb2025: 19, mar2025: 15, apr2025: 4, may2025: 3, jun2025: 3, jul2025: 3 },
      { keyword: 'Buy SUV', jan2025: 15, feb2025: 19, mar2025: 3, apr2025: 3, may2025: 3, jun2025: 3, jul2025: 3 },
      { keyword: 'Best SUV Cars in India', jan2025: 17, feb2025: 27, mar2025: 4, apr2025: 4, may2025: 4, jun2025: 4, jul2025: 4 },
      { keyword: 'Small SUV', jan2025: 25, feb2025: 36, mar2025: 19, apr2025: 5, may2025: 5, jun2025: 5, jul2025: 5 },
      { keyword: 'Buy Commercial Vehicle', jan2025: null, feb2025: 15, mar2025: null, apr2025: 6, may2025: 5, jun2025: 5, jul2025: 5 },
      { keyword: 'Best Crossover Cars in India', jan2025: 15, feb2025: 30, mar2025: 18, apr2025: 8, may2025: 8, jun2025: 8, jul2025: 8 }
    ]

    for (const keyword of mahindraKeywords) {
      await prisma.keywordData.create({
        data: {
          caseStudyId: mahindraAuto.id,
          keyword: keyword.keyword,
          jan2025: keyword.jan2025,
          feb2025: keyword.feb2025,
          mar2025: keyword.mar2025,
          apr2025: keyword.apr2025,
          may2025: keyword.may2025,
          jun2025: keyword.jun2025,
          jul2025: keyword.jul2025
        }
      })
    }

    // 2. Protean eGov Technologies Case Study
    const proteanEgov = await prisma.caseStudy.create({
      data: {
        clientName: 'Protean eGov Technologies',
        industry: 'Fintech/Government',
        campaignDuration: 'Jan 2025 - Jul 2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-07-31'),
        isActive: true,
        trafficGrowth: 933.0,
        initialTraffic: 1.45,
        finalTraffic: 15.2,
        keywordsRanked: 796,
        backlinksPerMonth: 60,
        domainRatingStart: 40,
        domainRatingEnd: 73,
        objective: 'Dramatically increase organic visibility for NPS and government financial services',
        challenge: 'Low domain authority and limited brand recognition in competitive fintech space',
        solution: 'Aggressive content strategy and technical SEO optimization with focus on NPS-related keywords',
        finalOutcomes: 'Achieved 933% traffic growth with significant improvement in domain rating',
        serpFeatures: true,
        aiOverview: true
      }
    })

    // Protean eGov Monthly Data
    const proteanMonthlyData = [
      { month: 'Jan 2025', traffic: 1.45, keywords: 200, backlinks: 50 },
      { month: 'Feb 2025', traffic: 2.1, keywords: 300, backlinks: 55 },
      { month: 'Mar 2025', traffic: 3.2, keywords: 400, backlinks: 60 },
      { month: 'Apr 2025', traffic: 5.8, keywords: 500, backlinks: 65 },
      { month: 'May 2025', traffic: 8.9, keywords: 600, backlinks: 70 },
      { month: 'Jun 2025', traffic: 12.1, keywords: 700, backlinks: 75 },
      { month: 'Jul 2025', traffic: 15.2, keywords: 796, backlinks: 80 }
    ]

    for (const data of proteanMonthlyData) {
      await prisma.monthlyData.create({
        data: {
          caseStudyId: proteanEgov.id,
          month: data.month,
          traffic: data.traffic,
          keywords: data.keywords,
          backlinks: data.backlinks
        }
      })
    }

    // Protean eGov Keyword Data
    const proteanKeywords = [
      { keyword: 'Corporate NPS Benefits', jan2025: null, feb2025: null, mar2025: null, apr2025: 21, may2025: 9, jun2025: 7, jul2025: 1 },
      { keyword: 'Is NPS Good or Bad', jan2025: null, feb2025: null, mar2025: 34, apr2025: 6, may2025: 1, jun2025: 1, jul2025: 1 },
      { keyword: '80CCD 1B', jan2025: null, feb2025: null, mar2025: 11, apr2025: 6, may2025: 4, jun2025: 5, jul2025: 2 },
      { keyword: 'Name Mismatch (PAN/Aadhaar)', jan2025: null, feb2025: null, mar2025: 25, apr2025: 25, may2025: 4, jun2025: 3, jul2025: 2 },
      { keyword: 'NPS Vatsalya Scheme Tax', jan2025: null, feb2025: null, mar2025: 12, apr2025: 12, may2025: 6, jun2025: 5, jul2025: 3 },
      { keyword: 'Which Pension Scheme Best', jan2025: null, feb2025: null, mar2025: 30, apr2025: 30, may2025: 13, jun2025: 12, jul2025: 3 },
      { keyword: 'How to Apply for Lost PAN', jan2025: null, feb2025: null, mar2025: 32, apr2025: 16, may2025: null, jun2025: 15, jul2025: 4 },
      { keyword: 'ENPS Account Opening', jan2025: null, feb2025: null, mar2025: 32, apr2025: 11, may2025: 12, jun2025: 10, jul2025: 8 }
    ]

    for (const keyword of proteanKeywords) {
      await prisma.keywordData.create({
        data: {
          caseStudyId: proteanEgov.id,
          keyword: keyword.keyword,
          jan2025: keyword.jan2025,
          feb2025: keyword.feb2025,
          mar2025: keyword.mar2025,
          apr2025: keyword.apr2025,
          may2025: keyword.may2025,
          jun2025: keyword.jun2025,
          jul2025: keyword.jul2025
        }
      })
    }

    // 3. UpGrad Case Study
    const upGrad = await prisma.caseStudy.create({
      data: {
        clientName: 'UpGrad',
        industry: 'Education/EdTech',
        campaignDuration: 'Dec 2024 - May 2025',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2025-05-31'),
        isActive: true,
        trafficGrowth: 51.86,
        initialTraffic: 5.84,
        finalTraffic: 8.87,
        keywordsRanked: 3000,
        backlinksPerMonth: 60,
        domainRatingStart: 55,
        domainRatingEnd: 62,
        objective: 'Improve organic visibility for online education and MBA programs',
        challenge: 'Highly competitive education sector with established players',
        solution: 'Content-focused SEO strategy targeting high-value education keywords',
        finalOutcomes: 'Achieved 51.86% traffic growth with 3000+ keywords in top 3 positions',
        serpFeatures: true,
        aiOverview: true
      }
    })

    // UpGrad Monthly Data
    const upGradMonthlyData = [
      { month: 'Dec 2024', traffic: 5.84, keywords: 2500, backlinks: 50 },
      { month: 'Jan 2025', traffic: 6.2, keywords: 2600, backlinks: 55 },
      { month: 'Feb 2025', traffic: 6.8, keywords: 2700, backlinks: 60 },
      { month: 'Mar 2025', traffic: 7.4, keywords: 2800, backlinks: 65 },
      { month: 'Apr 2025', traffic: 8.1, keywords: 2900, backlinks: 70 },
      { month: 'May 2025', traffic: 8.87, keywords: 3000, backlinks: 75 }
    ]

    for (const data of upGradMonthlyData) {
      await prisma.monthlyData.create({
        data: {
          caseStudyId: upGrad.id,
          month: data.month,
          traffic: data.traffic,
          keywords: data.keywords,
          backlinks: data.backlinks
        }
      })
    }

    // UpGrad Keyword Data
    const upGradKeywords = [
      { keyword: 'Highest Paying Courses in India', jan2025: 3, feb2025: 3, mar2025: 1, apr2025: 4, may2025: 1, jun2025: 3, jul2025: 1 },
      { keyword: 'Online Data Science Course in India', jan2025: 5, feb2025: 1, mar2025: 2, apr2025: 3, may2025: 2, jun2025: 1, jul2025: 1 },
      { keyword: 'Doctor of Business Administration Courses', jan2025: null, feb2025: 8, mar2025: 8, apr2025: 1, may2025: 18, jun2025: 5, jul2025: 1 },
      { keyword: 'Performance Marketing Course', jan2025: 3, feb2025: 2, mar2025: 1, apr2025: 1, may2025: 1, jun2025: 6, jul2025: 1 },
      { keyword: 'Data Science Course in India', jan2025: 14, feb2025: 13, mar2025: 1, apr2025: 8, may2025: 8, jun2025: 1, jul2025: 1 },
      { keyword: 'Online MBA With Placement', jan2025: 46, feb2025: 33, mar2025: 27, apr2025: 25, may2025: 30, jun2025: 10, jul2025: 3 },
      { keyword: 'Best Online MBA in India', jan2025: 42, feb2025: 61, mar2025: 24, apr2025: 6, may2025: 7, jun2025: 4, jul2025: 3 },
      { keyword: 'Cheapest Online MBA', jan2025: 39, feb2025: 7, mar2025: 12, apr2025: 5, may2025: 7, jun2025: 3, jul2025: 3 },
      { keyword: 'Best Online MBA Courses in India', jan2025: 30, feb2025: 26, mar2025: 12, apr2025: 5, may2025: 8, jun2025: 5, jul2025: 3 },
      { keyword: 'MBA Diploma Courses', jan2025: 25, feb2025: 23, mar2025: 16, apr2025: 12, may2025: 7, jun2025: 6, jul2025: 3 }
    ]

    for (const keyword of upGradKeywords) {
      await prisma.keywordData.create({
        data: {
          caseStudyId: upGrad.id,
          keyword: keyword.keyword,
          jan2025: keyword.jan2025,
          feb2025: keyword.feb2025,
          mar2025: keyword.mar2025,
          apr2025: keyword.apr2025,
          may2025: keyword.may2025,
          jun2025: keyword.jun2025,
          jul2025: keyword.jul2025
        }
      })
    }

    // Add SERP Features data
    const serpFeatures = [
      // Mahindra Auto SERP Features
      { caseStudyId: mahindraAuto.id, featureType: 'AI Overview', keyword: 'Best SUV Cars in India', url: 'https://mahindra.com/suv', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Buy SUV', url: 'https://mahindra.com/buy-suv', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Small SUV', url: 'https://mahindra.com/small-suv', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'AI Overview', keyword: 'Best Crossover Cars in India', url: 'https://mahindra.com/crossover', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Buy Commercial Vehicle', url: 'https://mahindra.com/commercial', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Bolero', url: 'https://mahindra.com/bolero', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Scorpio Classic', url: 'https://mahindra.com/scorpio-classic', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Thar', url: 'https://mahindra.com/thar', position: 1 },
      { caseStudyId: mahindraAuto.id, featureType: 'Featured Snippet', keyword: 'Scorpio S11', url: 'https://mahindra.com/scorpio-s11', position: 3 },

      // Protean eGov SERP Features
      { caseStudyId: proteanEgov.id, featureType: 'AI Overview', keyword: 'Corporate NPS Benefits', url: 'https://proteanegov.com/nps-benefits', position: 1 },
      { caseStudyId: proteanEgov.id, featureType: 'Featured Snippet', keyword: 'Is NPS Good or Bad', url: 'https://proteanegov.com/nps-analysis', position: 1 },
      { caseStudyId: proteanEgov.id, featureType: 'Featured Snippet', keyword: '80CCD 1B', url: 'https://proteanegov.com/80ccd1b', position: 2 },
      { caseStudyId: proteanEgov.id, featureType: 'Featured Snippet', keyword: 'Name Mismatch (PAN/Aadhaar)', url: 'https://proteanegov.com/name-mismatch', position: 2 },
      { caseStudyId: proteanEgov.id, featureType: 'Featured Snippet', keyword: 'NPS Vatsalya Scheme Tax', url: 'https://proteanegov.com/vatsalya-tax', position: 3 },
      { caseStudyId: proteanEgov.id, featureType: 'AI Overview', keyword: 'Which Pension Scheme Best', url: 'https://proteanegov.com/best-pension', position: 3 },
      { caseStudyId: proteanEgov.id, featureType: 'Featured Snippet', keyword: 'How to Apply for Lost PAN', url: 'https://proteanegov.com/lost-pan', position: 4 },
      { caseStudyId: proteanEgov.id, featureType: 'Featured Snippet', keyword: 'ENPS Account Opening', url: 'https://proteanegov.com/enps-opening', position: 8 },

      // UpGrad SERP Features
      { caseStudyId: upGrad.id, featureType: 'AI Overview', keyword: 'Highest Paying Courses in India', url: 'https://upgrad.com/highest-paying-courses', position: 1 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Online Data Science Course in India', url: 'https://upgrad.com/data-science', position: 1 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Doctor of Business Administration Courses', url: 'https://upgrad.com/dba', position: 1 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Performance Marketing Course', url: 'https://upgrad.com/performance-marketing', position: 1 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Data Science Course in India', url: 'https://upgrad.com/data-science-india', position: 1 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Online MBA With Placement', url: 'https://upgrad.com/mba-placement', position: 3 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Best Online MBA in India', url: 'https://upgrad.com/best-mba', position: 3 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Cheapest Online MBA', url: 'https://upgrad.com/cheap-mba', position: 3 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'Best Online MBA Courses in India', url: 'https://upgrad.com/mba-courses', position: 3 },
      { caseStudyId: upGrad.id, featureType: 'Featured Snippet', keyword: 'MBA Diploma Courses', url: 'https://upgrad.com/mba-diploma', position: 3 }
    ]

    for (const feature of serpFeatures) {
      await prisma.serpFeature.create({
        data: {
          caseStudyId: feature.caseStudyId,
          featureType: feature.featureType,
          keyword: feature.keyword,
          url: feature.url,
          position: feature.position
        }
      })
    }

    console.log('✅ Case studies seeded successfully!')
    console.log(`📊 Created ${3} case studies with comprehensive data`)
    console.log(`📈 Added ${mahindraMonthlyData.length + proteanMonthlyData.length + upGradMonthlyData.length} monthly data points`)
    console.log(`🔍 Added ${mahindraKeywords.length + proteanKeywords.length + upGradKeywords.length} keyword tracking entries`)
    console.log(`🎯 Added ${serpFeatures.length} SERP features`)

  } catch (error) {
    console.error('❌ Error seeding case studies:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedCaseStudies()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
