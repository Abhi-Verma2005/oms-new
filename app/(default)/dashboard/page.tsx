export const metadata = {
  title: 'EMIAC Dashboard - Case Studies Analytics',
  description: 'EMIAC Technologies - SEO Growth Case Studies Dashboard',
}

import FilterButton from '@/components/dropdown-filter'
import Datepicker from '@/components/datepicker'
// First 3 main dashboard cards (as requested)
import DashboardCard01 from './dashboard-card-01'
import DashboardCard02 from './dashboard-card-02'
import DashboardCard03 from './dashboard-card-03'
// Case study cards
import CaseStudyCard01 from './case-study-card-01'
import CaseStudyCard02 from './case-study-card-02'
import CaseStudyCard03 from './case-study-card-03'
// Analytics components
import CaseStudyAnalytics01 from './case-study-analytics-01'
import CaseStudyAnalytics02 from './case-study-analytics-02'
import CaseStudyAnalytics03 from './case-study-analytics-03'
import CaseStudyAnalytics04 from './case-study-analytics-04'
import CaseStudyTable from './case-study-table'

export default function Dashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">
      {/* Dashboard actions */}
      <div className="sm:flex sm:justify-between sm:items-center mb-8">
        {/* Left: Title */}
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">EMIAC Case Studies Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">SEO Growth Analytics & Performance Metrics</p>
        </div>
        {/* Right: Actions */}
        <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-2">
          {/* Filter button */}        
          <FilterButton align="right" />
          {/* Datepicker built with React Day Picker */}
          <Datepicker />
          {/* Add view button */}
          <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">
            <svg className="fill-current shrink-0 xs:hidden" width="16" height="16" viewBox="0 0 16 16">
              <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1z" />
            </svg>
            <span className="max-xs:sr-only">Add View</span>
          </button>              
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-12 gap-6">

        {/* First 3 main dashboard cards (as requested) */}
        <DashboardCard01 />
        <DashboardCard02 />
        <DashboardCard03 />
        
        {/* Case Study Cards */}
        <CaseStudyCard01 />
        <CaseStudyCard02 />
        <CaseStudyCard03 />
        
        {/* Analytics Components */}
        <CaseStudyAnalytics01 />
        <CaseStudyAnalytics02 />
        <CaseStudyAnalytics03 />
        <CaseStudyAnalytics04 />
        
        {/* Case Studies Table */}
        <CaseStudyTable />

      </div>      
    </div>
  )
}
