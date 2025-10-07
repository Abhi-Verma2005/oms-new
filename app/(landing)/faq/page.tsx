'use client'

import { motion } from 'framer-motion'
import LandingFooter from '../../../components/landing-footer'

export default function FaqPage() {
  return (
    <div className="relative bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen">
      {/* Decorative background accents */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-12 w-full max-w-[96rem] mx-auto">

        <motion.div
          className="max-w-3xl m-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >

          {/* Page title */}
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              FAQs
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl text-gray-900 dark:text-white font-extrabold tracking-tight">
              How we can help you today?
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Browse common questions, or use search to quickly find answers.
            </p>
          </div>

          {/* Search form */}
          <div className="mb-8">
            <form className="relative">
              <label htmlFor="action-search" className="sr-only">Search</label>
              <input
                id="action-search"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                type="search"
                placeholder="Search questions..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
          </div>

          {/* Filters */}
          <div className="mb-10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {['Popular', 'Accessibility', 'Marketing', 'Development', 'Account'].map((label, idx) => (
                <motion.a
                  key={label}
                  href="#0"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    idx === 0
                      ? 'bg-[#755FF8] text-white border-transparent hover:bg-[#6a54ee]'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {label}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Posts */}
          <div>
            <h2 className="text-2xl text-gray-900 dark:text-white font-bold mb-6">Popular Questions</h2>
            {/* Post */}
            <motion.article
              className="p-5 mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white font-semibold">How can the widget to my website?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-3 text-gray-600 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">General</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Marketing</a>
                  </li>
                </ul>
              </div>
            </motion.article>
            {/* Post */}
            <motion.article
              className="p-5 mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white font-semibold">What would happen if I choose not to pay after the usage?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-3 text-gray-600 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Development</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Acessibility</a>
                  </li>
                </ul>
              </div>
            </motion.article>
            {/* Post */}
            <motion.article
              className="p-5 mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white font-semibold">What limitations do trial accounts have?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-3 text-gray-600 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Development</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Plans</a>
                  </li>
                </ul>
              </div>
            </motion.article>
            {/* Post */}
            <motion.article
              className="p-5 mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white font-semibold">Is there any difference between Standard and Plus licenses?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-3 text-gray-600 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Development</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Account</a>
                  </li>
                </ul>
              </div>
            </motion.article>
            {/* Post */}
            <motion.article
              className="p-5 mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white font-semibold">Is my personal information protected?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-3 text-gray-600 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">General</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Accessibility</a>
                  </li>
                </ul>
              </div>
            </motion.article>
            {/* Post */}
            <motion.article
              className="p-5 mb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <header className="flex items-start mb-2">
                <div className="mt-2 mr-3">
                  <svg className="shrink-0" width="20" height="20" viewBox="0 0 16 16">
                    <path className="text-violet-300" d="M4 8H0v4.9c0 1 .7 1.9 1.7 2.1 1.2.2 2.3-.8 2.3-2V8z" />
                    <path className="text-violet-500" d="M15 1H7c-.6 0-1 .4-1 1v11c0 .7-.2 1.4-.6 2H13c1.7 0 3-1.3 3-3V2c0-.6-.4-1-1-1z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl leading-snug text-gray-900 dark:text-white font-semibold">What can I create with with this product?</h3>
              </header>
              <div className="pl-7">
                <div className="mb-3 text-gray-600 dark:text-gray-300">Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco.</div>
                <ul className="flex flex-wrap">
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Marketing</a>
                  </li>
                  <li className="flex items-center after:block after:content-['·'] last:after:content-[''] after:text-sm after:text-gray-400 dark:after:text-gray-600 after:px-2">
                    <a className="text-sm font-medium text-violet-500 hover:text-violet-600 dark:hover:text-violet-400" href="#0">Plans</a>
                  </li>
                </ul>
              </div>
            </motion.article>
          </div>

          {/* Pagination */}
          <div className="mt-6">
            <div className="flex justify-end">
              <a className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#755FF8] hover:bg-[#6a54ee] text-white text-sm font-medium shadow-sm transition-colors" href="#0">
                See All Questions
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

        </motion.div>

      </div>

      <LandingFooter />
    </div>
  )
}
