import Link from 'next/link'

export default function TopKeywordsCard() {
  return(
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Top Keywords</h2>
      </header>
      <div className="grow p-3">
        <div className="flex flex-col h-full">
          {/* Card content */}
          <div className="grow">
            <ul className="flex justify-between text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold px-2 space-x-2">
              <li>Keyword</li>
              <li>Rank</li>
            </ul>

            <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-100 mt-3 mb-4">
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '95%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>mahindra auto</div>
                  <div className="font-medium">#1</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '90%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>protean egov</div>
                  <div className="font-medium">#2</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '85%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>upgrad courses</div>
                  <div className="font-medium">#3</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '80%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>digital marketing</div>
                  <div className="font-medium">#4</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '75%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>seo services</div>
                  <div className="font-medium">#5</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '70%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>online education</div>
                  <div className="font-medium">#6</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '65%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>fintech solutions</div>
                  <div className="font-medium">#7</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '60%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>automotive industry</div>
                  <div className="font-medium">#8</div>
                </div>
              </li>
            </ul>
          </div>
          {/* Card footer */}
          <div className="text-center pt-4 pb-1 border-t border-gray-100 dark:border-gray-700/60">
            <Link className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Keywords Report -&gt;</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

