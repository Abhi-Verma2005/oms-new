'use client'

import { useFlyoutContext } from '@/app/flyout-context'
import { StaticImageData } from 'next/image'
import MailItem from './mail-item'

export interface Mail {
  id: number
  open: boolean
  image: StaticImageData
  name: string
  email: string
  date: string
  recipients: string[]
  excerpt: string
  message: string
}

export default function InboxBody({ mails }: { mails: Mail[]}) {
  const { flyoutOpen, setFlyoutOpen } = useFlyoutContext()

  return (
    <div
      className={`grow flex flex-col md:translate-x-0 transition-transform duration-300 ease-in-out ${flyoutOpen ? 'translate-x-1/3' : 'translate-x-0'
        }`}
    >
      {/* Header */}
      <div className="sticky top-16">
        <div className="flex items-center justify-between before:absolute before:inset-0 before:backdrop-blur-md before:bg-gray-50/90 dark:before:bg-[#151D2C]/90 before:-z-10 border-b border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 md:px-5 h-16">
          {/* Buttons on the left side */}
          <div className="flex">
            {/* Close button */}
            <button
              className="md:hidden text-gray-400 hover:text-gray-500 mr-4"
              onClick={() => setFlyoutOpen(!flyoutOpen)}
              aria-controls="inbox-sidebar"
              aria-expanded={flyoutOpen}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z" />
              </svg>
            </button>
            <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
              <svg className="fill-current text-gray-400 dark:text-gray-500" width="16" height="16" viewBox="0 0 16 16">
                <path d="M5 7h2v6H5V7zm4 0h2v6H9V7zm3-6v2h4v2h-1v10c0 .6-.4 1-1 1H2c-.6 0-1-.4-1-1V5H0V3h4V1c0-.6.4-1 1-1h6c.6 0 1 .4 1 1zM6 2v1h4V2H6zm7 3H3v9h10V5z" />
              </svg>
            </button>
            <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
              <svg className="fill-current text-yellow-500" width="16" height="16" viewBox="0 0 16 16">
                <path d="M10 5.934 8 0 6 5.934H0l4.89 3.954L2.968 16 8 12.223 13.032 16 11.11 9.888 16 5.934z" />
              </svg>
            </button>
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
          {/* Buttons on the right side */}
          <div className="flex items-center">
            <div className="text-xs mr-1">
              <span className="font-medium dark:text-gray-300">10</span> <span className="text-gray-500 dark:text-gray-400">of</span> <span className="font-medium dark:text-gray-300">467</span>
            </div>
            <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
              <svg className="fill-current text-gray-400 dark:text-gray-500" width="16" height="16" viewBox="0 0 16 16">
                <path d="m10 13.4 1.4-1.4-4-4 4-4L10 2.6 4.6 8z" />
              </svg>
            </button>
            <button className="p-1.5 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm ml-2">
              <svg className="fill-current text-gray-400 dark:text-gray-500" width="16" height="16" viewBox="0 0 16 16">
                <path d="M7 13.4 5.6 12l4-4-4-4L7 2.6 12.4 8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grow px-4 sm:px-6 md:px-5 py-4">
        {/* Mail subject */}
        <header className="sm:flex sm:items-start sm:justify-between mb-4">
          <h1 className="text-xl leading-snug text-gray-800 dark:text-gray-100 font-bold mb-1 sm:mb-0 ml-2">Chill your mind with this amazing offer 🎉</h1>
          <button className="text-xs inline-flex font-medium bg-sky-500/20 text-sky-700 rounded-full text-center px-2.5 py-1 whitespace-nowrap">
            Exciting news
          </button>
        </header>

        {/* Messages box */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl px-6 divide-y divide-gray-200 dark:divide-gray-700/60">
          {mails.map(mail => (
            <MailItem
              key={mail.id}
              mail={mail} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0">
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/60 px-4 sm:px-6 md:px-5 h-16">
          {/* Plus button */}
          <button className="shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 mr-3">
            <span className="sr-only">Add</span>
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12C23.98 5.38 18.62.02 12 0zm6 13h-5v5h-2v-5H6v-2h5V6h2v5h5v2z" />
            </svg>
          </button>
          {/* Message input */}
          <form className="grow flex">
            <div className="grow mr-3">
              <label htmlFor="message-input" className="sr-only">
                Type a message
              </label>
              <input
                id="message-input"
                className="form-input w-full bg-gray-100 dark:bg-gray-800 border-transparent dark:border-transparent focus:bg-white dark:focus:bg-gray-800 placeholder-gray-500"
                type="text"
                placeholder="Aa"
              />
            </div>
            <button type="submit" className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white whitespace-nowrap">
              Send -&gt;
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}