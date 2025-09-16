import Link from 'next/link'

export default function SerpFeaturesCard() {
  return(
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">SERP Features</h2>
      </header>
      <div className="grow p-3">
        <div className="flex flex-col h-full">
          {/* Card content */}
          <div className="grow">
            <ul className="flex justify-between text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold px-2 space-x-2">
              <li>Feature</li>
              <li>Count</li>
            </ul>

            <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-100 mt-3 mb-4">
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '90%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>🤖 AI Overview</div>
                  <div className="font-medium">6</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-sky-100 dark:bg-sky-500/20 rounded-r" aria-hidden="true" style={{ width: '85%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>📝 Featured Snippets</div>
                  <div className="font-medium">7</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-r" aria-hidden="true" style={{ width: '80%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>🔗 Regular Rankings</div>
                  <div className="font-medium">25</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-amber-100 dark:bg-amber-500/20 rounded-r" aria-hidden="true" style={{ width: '70%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>📊 Knowledge Panel</div>
                  <div className="font-medium">3</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-500/20 rounded-r" aria-hidden="true" style={{ width: '60%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>🎯 Local Pack</div>
                  <div className="font-medium">2</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-500/20 rounded-r" aria-hidden="true" style={{ width: '50%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>📱 Mobile Snippets</div>
                  <div className="font-medium">4</div>
                </div>
              </li>
            </ul>
          </div>
          {/* Card footer */}
          <div className="text-center pt-4 pb-1 border-t border-gray-100 dark:border-gray-700/60">
            <Link className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">SERP Report -&gt;</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

