'use client'

export default function CaseStudyTable() {
  const caseStudies = [
    {
      client: 'Mahindra Auto',
      industry: 'Automotive',
      duration: 'Feb 2025 - Jul 2025',
      trafficGrowth: '78.09%',
      initialTraffic: '18.17L',
      finalTraffic: '32.37L',
      keywords: '3000+',
      backlinks: '70-80/month',
      serpFeatures: 'Yes',
      aiOverview: 'Yes'
    },
    {
      client: 'Protean eGov',
      industry: 'Fintech/Government',
      duration: 'Jan 2025 - Jul 2025',
      trafficGrowth: '933%',
      initialTraffic: '1.45L',
      finalTraffic: '15.2L',
      keywords: '796',
      backlinks: '50-70/month',
      serpFeatures: 'Yes',
      aiOverview: 'Yes'
    },
    {
      client: 'UpGrad',
      industry: 'Education/EdTech',
      duration: 'Dec 2024 - May 2025',
      trafficGrowth: '51.86%',
      initialTraffic: '5.84L',
      finalTraffic: '8.87L',
      keywords: '3000+',
      backlinks: '50-70/month',
      serpFeatures: 'Yes',
      aiOverview: 'Yes'
    }
  ]

  return (
    <div className="col-span-full bg-white dark:bg-gray-800 shadow-sm rounded-xl">
      <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Case Studies Overview</h2>
      </header>
      <div className="p-3">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            {/* Table header */}
            <thead className="text-xs uppercase text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-sm">
              <tr>
                <th className="p-2">
                  <div className="font-semibold text-left">Client</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">Industry</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">Duration</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">Traffic Growth</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">Initial → Final</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">Keywords</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">Backlinks</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">SERP Features</div>
                </th>
                <th className="p-2">
                  <div className="font-semibold text-left">AI Overview</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-sm font-medium divide-y divide-gray-100 dark:divide-gray-700">
              {caseStudies.map((study, index) => (
                <tr key={index}>
                  <td className="p-2">
                    <div className="text-gray-800 dark:text-gray-100">{study.client}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-gray-600 dark:text-gray-300">{study.industry}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-gray-600 dark:text-gray-300">{study.duration}</div>
                  </td>
                  <td className="p-2">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
                      {study.trafficGrowth}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-gray-600 dark:text-gray-300">
                      {study.initialTraffic} → {study.finalTraffic}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="text-gray-600 dark:text-gray-300">{study.keywords}</div>
                  </td>
                  <td className="p-2">
                    <div className="text-gray-600 dark:text-gray-300">{study.backlinks}</div>
                  </td>
                  <td className="p-2">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400">
                      {study.serpFeatures}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800/30 dark:text-purple-400">
                      {study.aiOverview}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
