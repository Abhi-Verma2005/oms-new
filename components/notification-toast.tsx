'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, Eye, Calendar, Users, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationStore } from '@/stores/notification-store';

interface NotificationType {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  color?: string;
}

interface NotificationToastData {
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
}

interface NotificationToastProps {
  notification: NotificationToastData;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  autoClose?: boolean;
  duration?: number;
}

export function NotificationToast({ 
  notification, 
  onClose, 
  onMarkAsRead,
  autoClose = true,
  duration = 5000 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Debug logging
  console.log('🔔 NotificationToast: Rendering toast for notification:', {
    id: notification.id,
    title: notification.title,
    isVisible,
    isClosing
  });

  useEffect(() => {
    // Trigger slide-in animation
    console.log('🔔 NotificationToast: Setting up visibility timer for:', notification.title);
    const timer = setTimeout(() => {
      console.log('🔔 NotificationToast: Making toast visible:', notification.title);
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
    handleClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'default';
      case 'NORMAL': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] transform transition-all duration-300 ease-in-out',
        isVisible && !isClosing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <Card className="shadow-lg border-l-4 border-l-blue-500 bg-white dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {notification.type.icon ? (
                <span className="text-2xl">{notification.type.icon}</span>
              ) : (
                <Bell className="h-6 w-6 text-blue-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                    {notification.title}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                      {notification.priority}
                    </Badge>
                    <Badge variant="default" className="bg-blue-500 text-xs">
                      New
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                {notification.body}
              </p>

              {/* Image */}
              {notification.imageUrl && (
                <div className="mb-3">
                  <img 
                    src={notification.imageUrl} 
                    alt={notification.title}
                    className="w-full h-20 object-cover rounded-lg border"
                  />
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatTime(notification.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {notification.isGlobal ? (
                      <>
                        <Globe className="h-3 w-3" />
                        <span>All Users</span>
                      </>
                    ) : (
                      <>
                        <Users className="h-3 w-3" />
                        <span>{notification.targetUserIds.length} Users</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAsRead}
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Mark as read
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Container component to manage multiple toasts
export function NotificationToastContainer() {
  const { toasts, removeToast, markAsRead } = useNotificationStore();

  // Debug logging disabled

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.length > 0 && (
        <div className="text-xs text-gray-500 mb-2">
          Debug: {toasts.length} toast(s) to render
        </div>
      )}
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
          onMarkAsRead={markAsRead}
        />
      ))}
    </div>
  );
}
