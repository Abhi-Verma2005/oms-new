'use client'

import { useFlyoutContext } from '@/app/flyout-context'
import Image from 'next/image'
import ProfileImage from '@/public/images/user-avatar-32.png'
import UserImage01 from '@/public/images/user-32-01.jpg'
import UserImage02 from '@/public/images/user-32-02.jpg'
import UserImage03 from '@/public/images/user-32-03.jpg'
import UserImage04 from '@/public/images/user-32-04.jpg'
import UserImage05 from '@/public/images/user-32-05.jpg'
import UserImage06 from '@/public/images/user-32-06.jpg'
import UserImage08 from '@/public/images/user-32-08.jpg'

export default function ProfileSidebar() {
  const { flyoutOpen, setFlyoutOpen } = useFlyoutContext()

  return (
    <div
      id="profile-sidebar"
      className={`absolute z-20 top-0 bottom-0 w-full md:w-auto md:static md:top-auto md:bottom-auto -mr-px md:translate-x-0 transition-transform duration-200 ease-in-out ${
        flyoutOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="sticky top-16 bg-white dark:bg-[#151D2C] overflow-x-hidden overflow-y-auto no-scrollbar shrink-0 border-r border-gray-200 dark:border-gray-700/60 md:w-[18rem] xl:w-[20rem] h-[calc(100dvh-64px)]">
        {/* Profile group */}
        <div>
          {/* Group header */}
          <div className="sticky top-0 z-10">
            <div className="flex items-center bg-white dark:bg-[#151D2C] border-b border-gray-200 dark:border-gray-700/60 px-5 h-16">
              <div className="w-full flex items-center justify-between">
                {/* Profile image */}
                <div className="relative">
                  <div className="grow flex items-center truncate">
                    <Image className="w-8 h-8 rounded-full mr-2" src={ProfileImage} width={32} height={32} alt="Group 01" />
                    <div className="truncate">
                      <span className="font-semibold text-gray-800 dark:text-gray-100">Acme Inc.</span>
                    </div>
                  </div>
                </div>
                {/* Add button */}
                <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
                  <svg className="fill-current text-violet-500" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M15 7H9V1c0-.6-.4-1-1-1S7 .4 7 1v6H1c-.6 0-1 .4-1 1s.4 1 1 1h6v6c0 .6.4 1 1 1s1-.4 1-1V9h6c.6 0 1-.4 1-1s-.4-1-1-1Z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {/* Group body */}
          <div className="px-5 py-4">
            {/* Search form */}
            <form className="relative">
              <label htmlFor="profile-search" className="sr-only">
                Search
              </label>
              <input id="profile-search" className="form-input w-full pl-9 bg-white dark:bg-gray-800" type="search" placeholder="Search…" />
              <button className="absolute inset-0 right-auto group" type="submit" aria-label="Search">
                <svg
                  className="shrink-0 fill-current text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 ml-3 mr-2"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                  <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
                </svg>
              </button>
            </form>
            {/* Team members */}
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-3">Team members</div>
              <ul className="mb-6">
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-lg bg-linear-to-r from-violet-500/[0.12] dark:from-violet-500/[0.24] to-violet-500/[0.04]" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage08} width={32} height={32} alt="User 08" />
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Carolyn McNeail</span>
                      </div>
                    </div>
                  </button>
                </li>
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center truncate">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage06} width={32} height={32} alt="User 06" />
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Mary Roszczewski</span>
                      </div>
                    </div>
                  </button>
                </li>
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center truncate">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage03} width={32} height={32} alt="User 03" />
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Jerzy Wierzy</span>
                      </div>
                    </div>
                  </button>
                </li>
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center truncate">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage02} width={32} height={32} alt="User 02" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Tisha Yanchev</span>
                      </div>
                    </div>
                  </button>
                </li>
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center truncate">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage05} width={32} height={32} alt="User 05" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Simona Lürwer</span>
                      </div>
                    </div>
                  </button>
                </li>
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center truncate">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage04} width={32} height={32} alt="User 04" />
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Adrian Przetocki</span>
                      </div>
                    </div>
                  </button>
                </li>
                <li className="-mx-2">
                  <button className="w-full p-2 rounded-sm" onClick={() => setFlyoutOpen(false)}>
                    <div className="flex items-center truncate">
                      <div className="relative mr-2">
                        <Image className="w-8 h-8 rounded-full" src={UserImage01} width={32} height={32} alt="User 01" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      </div>
                      <div className="truncate">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Brian Halligan</span>
                      </div>
                    </div>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}