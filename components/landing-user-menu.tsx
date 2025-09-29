'use client'

import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/stores/auth-store'
import UserAvatar from '@/public/images/user-avatar-32.png'

export default function LandingUserMenu({ align }: { align?: 'left' | 'right' }) {
  const { user, isAuthenticated, logout } = useAuthStore()

  if (!isAuthenticated || !user) {
    return (
      <Link 
        href="/signin" 
        className="inline-flex justify-center items-center group text-sm font-medium text-gray-600 dark:text-gray-100 hover:text-gray-800 dark:hover:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        Sign In
      </Link>
    )
  }

  const userRoles = user.roles || []
  const isAdmin = user.isAdmin || userRoles.includes('admin')

  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton className="inline-flex justify-center items-center group px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
        <Image 
          className="w-6 h-6 rounded-full" 
          src={user.image || UserAvatar} 
          width={24} 
          height={24} 
          alt={user.name || "User"} 
        />
        <div className="flex items-center truncate ml-2">
          <span className="truncate text-sm font-medium text-gray-600 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-white">
            {user.name || user.email}
          </span>
          <svg className="w-3 h-3 shrink-0 ml-1 fill-current text-gray-400 dark:text-gray-500" viewBox="0 0 12 12">
            <path d="M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z" />
          </svg>
        </div>
      </MenuButton>
      <Transition
        as="div"
        className={`origin-top-right z-50 absolute top-full min-w-[11rem] max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${align === 'right' ? 'right-0' : 'left-0'
          }`}
        enter="transition ease-out duration-200 transform"
        enterFrom="opacity-0 -translate-y-2"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="pt-0.5 pb-2 px-3 mb-1 border-b border-gray-200 dark:border-gray-700/60">
          <div className="font-medium text-gray-800 dark:text-gray-100">
            {user.name || user.email}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            {userRoles.length > 0 ? userRoles.join(', ') : 'User'}
          </div>
        </div>
        <MenuItems as="ul" className="focus:outline-hidden">
          <MenuItem as="li">
            <Link className="font-medium text-sm flex items-center py-1 px-3 text-violet-500 hover:bg-gray-50 dark:hover:bg-gray-700/50" href="/publishers">
              Dashboard
            </Link>
          </MenuItem>
          <MenuItem as="li">
            <Link className="font-medium text-sm flex items-center py-1 px-3 text-violet-500 hover:bg-gray-50 dark:hover:bg-gray-700/50" href="/settings/account">
              Settings
            </Link>
          </MenuItem>
          {isAdmin && (
            <MenuItem as="li">
              <Link className="font-medium text-sm flex items-center py-1 px-3 text-violet-500 hover:bg-gray-50 dark:hover:bg-gray-700/50" href="/admin">
                Admin Panel
              </Link>
            </MenuItem>
          )}
          
          <MenuItem as="li">
            <button 
              className="font-medium text-sm flex items-center py-1 px-3 text-violet-500 hover:bg-gray-50 dark:hover:bg-gray-700/50 w-full text-left"
              onClick={() => logout()}
            >
              Sign Out
            </button>
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

