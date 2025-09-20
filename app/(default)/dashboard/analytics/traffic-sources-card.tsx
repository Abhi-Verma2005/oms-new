import Link from 'next/link'

export default function TrafficSourcesCard() {
  return(
    <div className="flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Traffic Sources</h2>
      </header>
      <div className="grow p-3">
        <div className="flex flex-col h-full">
          {/* Card content */}
          <div className="grow">
            <ul className="flex justify-between text-xs uppercase text-gray-400 dark:text-gray-500 font-semibold px-2 space-x-2">
              <li>Source</li>
              <li>Traffic</li>
            </ul>

            <ul className="space-y-1 text-sm text-gray-800 dark:text-gray-100 mt-3 mb-4">
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-r" aria-hidden="true" style={{ width: '92%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>🔍 Organic Search</div>
                  <div className="font-medium">45.2K</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-sky-100 dark:bg-sky-500/20 rounded-r" aria-hidden="true" style={{ width: '78%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>🔗 Direct</div>
                  <div className="font-medium">12.8K</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-violet-100 dark:bg-violet-500/20 rounded-r" aria-hidden="true" style={{ width: '65%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>📱 Social Media</div>
                  <div className="font-medium">8.4K</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-amber-100 dark:bg-amber-500/20 rounded-r" aria-hidden="true" style={{ width: '52%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>📧 Email</div>
                  <div className="font-medium">4.2K</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-red-100 dark:bg-red-500/20 rounded-r" aria-hidden="true" style={{ width: '38%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>🎯 Referral</div>
                  <div className="font-medium">2.1K</div>
                </div>
              </li>
              {/* Item */}
              <li className="relative px-2 py-1">
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-500/20 rounded-r" aria-hidden="true" style={{ width: '25%' }}></div>
                <div className="relative flex justify-between space-x-2">
                  <div>📺 Paid Ads</div>
                  <div className="font-medium">1.8K</div>
                </div>
              </li>
            </ul>
          </div>
          {/* Card footer */}
          <div className="text-center pt-4 pb-1 border-t border-gray-100 dark:border-gray-700/60">
            <Link className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Traffic Report -&gt;</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


