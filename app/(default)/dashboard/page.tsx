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

export default function Dashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w/full max-w-[96rem] mx-auto">

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

      {/* EMIAC Case Studies Section */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">EMIAC Case Studies</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive analytics and performance metrics for all case studies
          </p>
        </div>
        <div className="grid grid-cols-12 gap-6">
          {/* Case Study Cards */}
          <div className="col-span-full sm:col-span-6 xl:col-span-4">
            <CaseStudyCard01 />
          </div>
          <div className="col-span-full sm:col-span-6 xl:col-span-4">
            <CaseStudyCard02 />
          </div>
          <div className="col-span-full sm:col-span-6 xl:col-span-4">
            <CaseStudyCard03 />
          </div>
        </div>
      </div>

      {/* Other Analytics Section */}
      <div className="grid grid-cols-12 gap-6">
        {/* Row 1 */}
        <div className="col-span-full xl:col-span-8">
          <CaseStudyAnalytics01 />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <CaseStudyAnalytics02 />
        </div>

        {/* Row 2 */}
        <div className="col-span-full sm:col-span-6 xl:col-span-3">
          <CaseStudyAnalytics03 />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-3">
          <CaseStudyAnalytics04 />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-3">
          <TopKeywordsCard />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-3">
          <TrafficSourcesCard />
        </div>

        {/* Row 3 */}
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <BacklinksPerformanceCard />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <SerpFeaturesCard />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <KeywordRankingChart />
        </div>

        {/* Row 4 */}
        <div className="col-span-full xl:col-span-8">
          <TrafficGrowthChart />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <IndustryComparisonChart />
        </div>

        {/* Row 5 */}
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <SerpFeaturesChart />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <BacklinksChart />
        </div>
        <div className="col-span-full sm:col-span-6 xl:col-span-4">
          <DomainRatingChart />
        </div>

        {/* Row 6 */}
        <div className="col-span-full">
          <CaseStudyTable />
        </div>
      </div>
    </div>
  )
}