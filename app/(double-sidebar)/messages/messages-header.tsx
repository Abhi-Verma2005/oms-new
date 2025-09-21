import { useFlyoutContext } from '@/app/flyout-context'
import Image from 'next/image'
import User01 from '@/public/images/user-32-01.jpg'
import User02 from '@/public/images/user-32-07.jpg'

export default function MessagesHeader() {
  const { flyoutOpen, setFlyoutOpen } = useFlyoutContext()

  return (
    <div className="sticky top-16">
      <div className="flex items-center justify-between before:absolute before:inset-0 before:backdrop-blur-md before:bg-gray-50/90 dark:before:bg-[#151D2C]/90 before:-z-10 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 md:px-5 h-16">
        {/* People */}
        <div className="flex items-center">
          {/* Close button */}
          <button
            className="md:hidden text-gray-400 hover:text-gray-500 mr-4"
            onClick={() => setFlyoutOpen(!flyoutOpen)}
            aria-controls="messages-sidebar"
            aria-expanded={flyoutOpen}
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
            </svg>
          </button>
          {/* People list */}
          <div className="flex -space-x-3 -ml-px">
            <a className="block" href="#0">
              <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={User01} width={32} height={32} alt="User 01" />
            </a>
            <a className="block" href="#0">
              <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={User02} width={32} height={32} alt="User 04" />
            </a>
          </div>
        </div>
        {/* Buttons on the right side */}
        <div className="flex">
          <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
            <svg className="fill-current text-gray-400 dark:text-gray-500" width="16" height="16" viewBox="0 0 16 16">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 12c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V4h2v5z" />
            </svg>
          </button>
          <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
            <svg className="fill-current text-violet-500" width="16" height="16" viewBox="0 0 16 16">
              <path d="M14.3 2.3L5 11.6 1.7 8.3c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4l4 4c.2.2.4.3.7.3.3 0 .5-.1.7-.3l10-10c.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}