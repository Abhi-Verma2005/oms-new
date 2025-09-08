export const metadata = {
  title: 'Tasks list - Mosaic',
  description: 'Page description',
}

import Image from 'next/image'
import UserImage05 from '@/public/images/user-32-05.jpg'
import UserImage07 from '@/public/images/user-32-07.jpg'
import UserImage08 from '@/public/images/user-32-08.jpg'

export default function TasksList() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-[96rem] mx-auto">

      {/* Smaller container */}
      <div className="max-w-3xl mx-auto">

        {/* Page header */}
        <div className="sm:flex sm:justify-between sm:items-center mb-8">

          {/* Left: Title */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-bold">Acme Inc. Tasks</h1>
          </div>

          {/* Right: Actions */}
          <div className="grid grid-flow-col sm:auto-cols-max justify-start sm:justify-end gap-4">

            {/* Avatars */}
            <div className="flex shrink-0 -space-x-3 -ml-px">
              <a className="block" href="#0">
                <Image className="rounded-full border-2 border-gray-100 dark:border-gray-900 box-content" src={UserImage08} width="32" height="32" alt="User 08" />
              </a>
              <a className="block" href="#0">
                <Image className="rounded-full border-2 border-gray-100 dark:border-gray-900 box-content" src={UserImage07} width="32" height="32" alt="User 07" />
              </a>
              <a className="block" href="#0">
                <Image className="rounded-full border-2 border-gray-100 dark:border-gray-900 box-content" src={UserImage05} width="32" height="32" alt="User 05" />
              </a>
              <button className="flex justify-center items-center w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 text-violet-500 shadow-sm transition ml-2">
                <span className="sr-only">Add new user</span>
                <svg className="w-3 h-3 fill-current" viewBox="0 0 12 12">
                  <path d="M11 5H7V1a1 1 0 0 0-2 0v4H1a1 1 0 0 0 0 2h4v4a1 1 0 0 0 2 0V7h4a1 1 0 0 0 0-2Z" />
                </svg>
              </button>
            </div>

            {/* Add taks button */}
            <button className="btn bg-gray-900 text-gray-100 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-800 dark:hover:bg-white">Add Task</button>

          </div>

        </div>

        {/* Tasks */}
        <div className="space-y-6">

          {/* Group 1 */}
          <div>
            <h2 className="grow font-semibold text-gray-800 dark:text-gray-100 truncate mb-4">To Do's</h2>
            <div className="space-y-2">

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Senior Software Engineer Backend</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Avatars */}
                    <div className="flex shrink-0 -space-x-3 -ml-px">
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage07} width={24} height={24} alt="User 07" />
                      </a>
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage05} width={24} height={24} alt="User 05" />
                      </a>
                    </div>
                    {/* Like button */}
                    <button className="flex items-center text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M14.682 2.318A4.485 4.485 0 0011.5 1 4.377 4.377 0 008 2.707 4.383 4.383 0 004.5 1a4.5 4.5 0 00-3.182 7.682L8 15l6.682-6.318a4.5 4.5 0 000-6.364zm-1.4 4.933L8 12.247l-5.285-5A2.5 2.5 0 014.5 3c1.437 0 2.312.681 3.5 2.625C9.187 3.681 10.062 3 11.5 3a2.5 2.5 0 011.785 4.251h-.003z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">4</div>
                    </button>
                    {/* Replies button */}
                    <button className="flex items-center text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 0C3.6 0 0 3.1 0 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L8.9 12H8c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">7</div>
                    </button>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">User should receive a daily digest email</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Date */}
                    <div className="flex items-center text-yellow-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z" />
                        <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z" />
                      </svg>
                      <div className="text-sm text-yellow-600">Mar 27</div>
                    </div>
                    {/* Replies button */}
                    <button className="flex items-center text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 0C3.6 0 0 3.1 0 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L8.9 12H8c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">6</div>
                    </button>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Change license and remove products</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Avatars */}
                    <div className="flex shrink-0 -space-x-3 -ml-px">
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage08} width={24} height={24} alt="User 08" />
                      </a>
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage07} width={24} height={24} alt="User 07" />
                      </a>
                    </div>
                    {/* Replies button */}
                    <button className="flex items-center text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 0C3.6 0 0 3.1 0 7s3.6 7 8 7h.6l5.4 2v-4.4c1.2-1.2 2-2.8 2-4.6 0-3.9-3.6-7-8-7zm4 10.8v2.3L8.9 12H8c-3.3 0-6-2.2-6-5s2.7-5 6-5 6 2.2 6 5c0 2.2-2 3.8-2 3.8z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">4</div>
                    </button>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Group 2 */}
          <div>
            <h2 className="grow font-semibold text-gray-800 dark:text-gray-100 truncate mb-4">In Progress</h2>
            <div className="space-y-2">

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Managing teams (book)</span>
                      </label>
                    </div>
                    {/* Nested checkboxes */}
                    <ul className="pl-12 space-y-3">
                      <li>
                        <label className="flex items-center">
                          <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" defaultChecked />
                          <span className="text-sm text-gray-800 dark:text-gray-100 peer-checked:line-through ml-3">Finish the presentation</span>
                        </label>
                      </li>
                      <li>
                        <label className="flex items-center">
                          <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                          <span className="text-sm text-gray-800 dark:text-gray-100 peer-checked:line-through ml-3">Finish the design</span>
                        </label>
                      </li>
                      <li>
                        <label className="flex items-center">
                          <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                          <span className="text-sm text-gray-800 dark:text-gray-100 peer-checked:line-through ml-3">Publish the content</span>
                        </label>
                      </li>
                    </ul>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Avatars */}
                    <div className="flex shrink-0 -space-x-3 -ml-px">
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage05} width={24} height={24} alt="User 05" />
                      </a>
                    </div>
                    {/* To-do info */}
                    <div className="flex items-center text-gray-400 dark:text-gray-500 ml-3">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M6.974 14c-.3 0-.7-.2-.9-.5l-2.2-3.7-2.1 2.8c-.3.4-1 .5-1.4.2-.4-.3-.5-1-.2-1.4l3-4c.2-.3.5-.4.9-.4.3 0 .6.2.8.5l2 3.3 3.3-8.1c0-.4.4-.7.8-.7s.8.2.9.6l4 8c.2.5 0 1.1-.4 1.3-.5.2-1.1 0-1.3-.4l-3-6-3.2 7.9c-.2.4-.6.6-1 .6z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">1/3</div>
                    </div>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Product Update - Q4 2024</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Date */}
                    <div className="flex items-center text-yellow-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z" />
                        <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z" />
                      </svg>
                      <div className="text-sm text-yellow-600">Mar 27</div>
                    </div>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Design marketing assets</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Avatars */}
                    <div className="flex shrink-0 -space-x-3 -ml-px">
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage07} width={24} height={24} alt="User 07" />
                      </a>
                    </div>
                    {/* Date */}
                    <div className="flex items-center text-yellow-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M5 4a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H5Z" />
                        <path d="M4 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4ZM2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Z" />
                      </svg>
                      <div className="text-sm text-yellow-600">Mar 27</div>
                    </div>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Group 3 */}
          <div>
            <h2 className="grow font-semibold text-gray-800 dark:text-gray-100 truncate mb-4">Completed</h2>
            <div className="space-y-2">

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 opacity-60" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" defaultChecked />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Design new diagrams</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Avatars */}
                    <div className="flex shrink-0 -space-x-3 -ml-px">
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage08} width={24} height={24} alt="User 08" />
                      </a>
                    </div>
                    {/* To-do info */}
                    <div className="flex items-center text-gray-400 dark:text-gray-500 ml-3">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M6.974 14c-.3 0-.7-.2-.9-.5l-2.2-3.7-2.1 2.8c-.3.4-1 .5-1.4.2-.4-.3-.5-1-.2-1.4l3-4c.2-.3.5-.4.9-.4.3 0 .6.2.8.5l2 3.3 3.3-8.1c0-.4.4-.7.8-.7s.8.2.9.6l4 8c.2.5 0 1.1-.4 1.3-.5.2-1.1 0-1.3-.4l-3-6-3.2 7.9c-.2.4-.6.6-1 .6z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">3/3</div>
                    </div>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Task */}
              <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 opacity-60" draggable="true">
                <div className="sm:flex sm:justify-between sm:items-start">
                  {/* Left side */}
                  <div className="grow mt-0.5 mb-3 sm:mb-0 space-y-3">
                    <div className="flex items-center">
                      {/* Drag button */}
                      <button className="cursor-move mr-2">
                        <span className="sr-only">Drag</span>
                        <svg className="w-3 h-3 fill-gray-400 dark:fill-gray-500" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                          <path d="M0 1h12v2H0V1Zm0 4h12v2H0V5Zm0 4h12v2H0V9Z" fillRule="evenodd" />
                        </svg>
                      </button>
                      {/* Checkbox button */}
                      <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox w-5 h-5 rounded-full peer" defaultChecked />
                        <span className="font-medium text-gray-800 dark:text-gray-100 peer-checked:line-through ml-2">Update the contact page</span>
                      </label>
                    </div>
                  </div>
                  {/* Right side */}
                  <div className="flex items-center justify-end space-x-3">
                    {/* Avatars */}
                    <div className="flex shrink-0 -space-x-3 -ml-px">
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage08} width={24} height={24} alt="User 08" />
                      </a>
                      <a className="block" href="#0">
                        <Image className="rounded-full border-2 border-white dark:border-gray-800 box-content" src={UserImage07} width={24} height={24} alt="User 07" />
                      </a>
                    </div>
                    {/* To-do info */}
                    <div className="flex items-center text-gray-400 dark:text-gray-500 ml-3">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M6.974 14c-.3 0-.7-.2-.9-.5l-2.2-3.7-2.1 2.8c-.3.4-1 .5-1.4.2-.4-.3-.5-1-.2-1.4l3-4c.2-.3.5-.4.9-.4.3 0 .6.2.8.5l2 3.3 3.3-8.1c0-.4.4-.7.8-.7s.8.2.9.6l4 8c.2.5 0 1.1-.4 1.3-.5.2-1.1 0-1.3-.4l-3-6-3.2 7.9c-.2.4-.6.6-1 .6z" />
                      </svg>
                      <div className="text-sm text-gray-500 dark:text-gray-400">2/2</div>
                    </div>
                    {/* Attach button */}
                    <button className="text-gray-400 dark:text-gray-500 hover:text-violet-500 dark:hover:text-violet-500">
                      <svg className="shrink-0 fill-current mr-1.5" width="16" height="16" viewBox="0 0 16 16">
                        <path d="M11 0c1.3 0 2.6.5 3.5 1.5 1 .9 1.5 2.2 1.5 3.5 0 1.3-.5 2.6-1.4 3.5l-1.2 1.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l1.1-1.2c.6-.5.9-1.3.9-2.1s-.3-1.6-.9-2.2C12 1.7 10 1.7 8.9 2.8L7.7 4c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l1.2-1.1C8.4.5 9.7 0 11 0zM8.3 12c.4-.4 1-.5 1.4-.1.4.4.4 1 0 1.4l-1.2 1.2C7.6 15.5 6.3 16 5 16c-1.3 0-2.6-.5-3.5-1.5C.5 13.6 0 12.3 0 11c0-1.3.5-2.6 1.5-3.5l1.1-1.2c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4L2.9 8.9c-.6.5-.9 1.3-.9 2.1s.3 1.6.9 2.2c1.1 1.1 3.1 1.1 4.2 0L8.3 12zm1.1-6.8c.4-.4 1-.4 1.4 0 .4.4.4 1 0 1.4l-4.2 4.2c-.2.2-.5.3-.7.3-.2 0-.5-.1-.7-.3-.4-.4-.4-1 0-1.4l4.2-4.2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  )
}