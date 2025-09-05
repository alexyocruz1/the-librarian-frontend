'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSocket, Notification } from '@/hooks/useSocket';
import { formatTimeAgo } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getNotificationsByType,
  } = useSocket();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'request_approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'request_rejected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending_approval':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'book_returned':
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'overdue':
        return 'border-red-200 bg-red-50';
      case 'request_approved':
        return 'border-green-200 bg-green-50';
      case 'request_rejected':
        return 'border-red-200 bg-red-50';
      case 'pending_approval':
        return 'border-yellow-200 bg-yellow-50';
      case 'book_returned':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const groupedNotifications = {
    overdue: getNotificationsByType('overdue'),
    pending: getNotificationsByType('pending_approval'),
    approved: getNotificationsByType('request_approved'),
    rejected: getNotificationsByType('request_rejected'),
    returned: getNotificationsByType('book_returned'),
    system: getNotificationsByType('system'),
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge
            variant="error"
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-sm"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="p-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="p-2">
                  {Object.entries(groupedNotifications).map(([type, typeNotifications]) => {
                    if (typeNotifications.length === 0) return null;

                    return (
                      <div key={type} className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 px-2 py-1 mb-2 capitalize">
                          {type.replace('_', ' ')} ({typeNotifications.length})
                        </h4>
                        <div className="space-y-2">
                          {typeNotifications.slice(0, 5).map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                                !notification.read ? 'ring-2 ring-primary-200' : ''
                              }`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatTimeAgo(notification.timestamp)}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="text-sm text-gray-600"
                >
                  Clear all
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
