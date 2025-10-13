export const metadata = {
  title: 'Personal Dashboard - EMIAC Analytics',
  description: 'Personal dashboard with activity insights and EMIAC case studies analytics',
}

import Datepicker from '@/components/datepicker'
import CaseStudyAnalytics01 from './case-study-analytics-01'
import CaseStudyAnalytics02 from './case-study-analytics-02'
import CaseStudyAnalytics03 from './case-study-analytics-03'
import CaseStudyAnalytics04 from './case-study-analytics-04'
import CaseStudyCard01 from './case-study-card-01'
import CaseStudyCard02 from './case-study-card-02'
import CaseStudyCard03 from './case-study-card-03'
import CaseStudyTable from './case-study-table'
import TrafficGrowthChart from './traffic-growth-chart'
import KeywordRankingChart from './keyword-ranking-chart'
import IndustryComparisonChart from './industry-comparison-chart'
import SerpFeaturesChart from './serp-features-chart'
import BacklinksChart from './backlinks-chart'
import DomainRatingChart from './domain-rating-chart'
import TopKeywordsCard from './analytics/top-keywords-card'
import TrafficSourcesCard from './analytics/traffic-sources-card'
import BacklinksPerformanceCard from './analytics/backlinks-performance-card'
import SerpFeaturesCard from './analytics/serp-features-card'
import PersonalAnalytics from './personal-analytics'
import { ProjectSelector } from '@/components/projects/project-selector'
import ProjectOrders from '@/app/(default)/dashboard/project-orders'

export default function Dashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

      {/* Page header */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">

        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Personal Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your personal activity and usage insights
          </p>
        </div>

        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          <Datepicker />
        </div>

      </div>

      {/* Personal Analytics Section */}
      <div className="mb-8">
        <PersonalAnalytics />
      </div>

      {/* Activity Feed removed per request */}

      {/* Project Orders */}
      <div className="mb-10">
        <ProjectSelector />
        <div className="mt-4">
          <ProjectOrders />
        </div>
      </div>
    </div>
  )
}