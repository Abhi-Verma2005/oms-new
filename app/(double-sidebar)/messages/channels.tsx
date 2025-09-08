import { useFlyoutContext } from '@/app/flyout-context'

export default function Channels() {
  const { setFlyoutOpen } = useFlyoutContext()

  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3">Channels</div>
      <ul className="mb-6">
        <li className="-mx-2">
          <button className="flex items-center justify-between w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
            <div className="flex items-center">
              <div className="truncate">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">#New Leads</span>
              </div>
            </div>
            <div className="flex items-center ml-2">
              <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
            </div>
          </button>
        </li>
        <li className="-mx-2">
          <button className="flex items-center justify-between w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
            <div className="flex items-center truncate">
              <div className="truncate">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">#Development Team</span>
              </div>
            </div>
          </button>
        </li>
        <li className="-mx-2">
          <button className="flex items-center justify-between w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
            <div className="flex items-center truncate">
              <div className="truncate">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">#Product Tips</span>
              </div>
            </div>
          </button>
        </li>
      </ul>
    </div>
  )
}