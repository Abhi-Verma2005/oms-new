'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { Bell, Loader2 } from 'lucide-react'
import { useNotifications } from '@/contexts/notification-context'

interface NotificationType {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  typeId: string;
  isActive: boolean;
  isGlobal: boolean;
  targetUserIds: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
}

export default function DropdownNotifications({ align }: {
  align?: 'left' | 'right'
}) {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=5');
      if (response.ok) {
        // The context will handle updating notifications
        // We just need to trigger the initial fetch
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <Menu as="div" className="relative inline-flex">
      {({ open }) => (
        <>
          <MenuButton
            className={`w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 lg:hover:bg-gray-200 dark:hover:bg-gray-700/50 dark:lg:hover:bg-gray-800 rounded-full ${
              open && 'bg-gray-200 dark:bg-gray-800'
            }`}
          >
            <span className="sr-only">Notifications</span>
            <Bell className="h-4 w-4 text-gray-500/80 dark:text-gray-400/80" />
            {unreadCount > 0 && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-gray-100 dark:border-gray-900 rounded-full"></div>
            )}
          </MenuButton>
          <Transition
            as="div"
            className={`origin-top-right z-10 absolute top-full -mr-48 sm:mr-0 min-w-[20rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 py-1.5 rounded-lg shadow-lg overflow-hidden mt-1 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            enter="transition ease-out duration-200 transform"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase pt-1.5 pb-2 px-4">Notifications</div>
            <MenuItems as="ul" className="focus:outline-hidden max-h-96 overflow-y-auto">
              {loading ? (
                <MenuItem as="li">
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm text-gray-500">Loading...</span>
                  </div>
                </MenuItem>
              ) : notifications.length === 0 ? (
                <MenuItem as="li">
                  <div className="text-center py-4">
                    <Bell className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                </MenuItem>
              ) : (
                notifications.map((notification) => (
                  <MenuItem key={notification.id} as="li" className="border-b border-gray-200 dark:border-gray-700/60 last:border-0">
                    {({ active }) => (
                      <div 
                        className={`block py-2 px-4 cursor-pointer ${active && 'bg-gray-50 dark:bg-gray-700/20'} ${!notification.isRead && 'bg-blue-50 dark:bg-blue-900/20'}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {notification.type.icon ? (
                              <span className="text-lg">{notification.type.icon}</span>
                            ) : (
                              <Bell className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-800 dark:text-gray-200'}`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.body}
                            </p>
                            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </MenuItem>
                ))
              )}
              {notifications.length > 0 && (
                <MenuItem as="li" className="border-t border-gray-200 dark:border-gray-700/60">
                  <Link 
                    href="/notifications" 
                    className="block py-2 px-4 text-center text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/20"
                  >
                    View all notifications
                  </Link>
                </MenuItem>
              )}
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  )
}
