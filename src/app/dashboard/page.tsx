'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  UsersIcon,
  BuildingLibraryIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';

// Mock data - in real app, this would come from API
const mockStats = {
  totalBooks: 1247,
  totalUsers: 89,
  totalLibraries: 3,
  pendingRequests: 12,
  overdueBooks: 5,
  recentActivity: [
    {
      id: 1,
      type: 'book_borrowed',
      message: 'John Doe borrowed "The Great Gatsby"',
      timestamp: new Date().toISOString(),
      user: 'John Doe',
      book: 'The Great Gatsby',
    },
    {
      id: 2,
      type: 'user_registered',
      message: 'New student registration: Jane Smith',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: 'Jane Smith',
    },
    {
      id: 3,
      type: 'book_returned',
      message: 'Alice Johnson returned "To Kill a Mockingbird"',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: 'Alice Johnson',
      book: 'To Kill a Mockingbird',
    },
  ],
};

const statCards = [
  {
    name: 'Total Books',
    value: mockStats.totalBooks,
    icon: BookOpenIcon,
    color: 'primary',
    change: '+12%',
    changeType: 'positive' as const,
  },
  {
    name: 'Total Users',
    value: mockStats.totalUsers,
    icon: UsersIcon,
    color: 'success',
    change: '+8%',
    changeType: 'positive' as const,
  },
  {
    name: 'Libraries',
    value: mockStats.totalLibraries,
    icon: BuildingLibraryIcon,
    color: 'warning',
    change: '0%',
    changeType: 'neutral' as const,
  },
  {
    name: 'Pending Requests',
    value: mockStats.pendingRequests,
    icon: ClipboardDocumentListIcon,
    color: 'error',
    change: '+3',
    changeType: 'negative' as const,
  },
];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'book_borrowed':
        return <BookOpenIcon className="w-4 h-4 text-primary-600" />;
      case 'book_returned':
        return <BookOpenIcon className="w-4 h-4 text-success-600" />;
      case 'user_registered':
        return <UsersIcon className="w-4 h-4 text-warning-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'book_borrowed':
        return 'bg-primary-50 border-primary-200';
      case 'book_returned':
        return 'bg-success-50 border-success-200';
      case 'user_registered':
        return 'bg-warning-50 border-warning-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-primary-100 text-lg">
            Here&apos;s what&apos;s happening in your library system today.
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </Badge>
            <span className="text-primary-100 text-sm">
              Last login: {formatDate(new Date())}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <Card variant="elevated" className="hover:shadow-medium transition-shadow duration-200">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-sm font-medium ${
                          stat.changeType === 'positive'
                            ? 'text-success-600'
                            : stat.changeType === 'negative'
                            ? 'text-error-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">from last month</span>
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-xl ${
                      stat.color === 'primary'
                        ? 'bg-primary-100'
                        : stat.color === 'success'
                        ? 'bg-success-100'
                        : stat.color === 'warning'
                        ? 'bg-warning-100'
                        : 'bg-error-100'
                    }`}
                  >
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.color === 'primary'
                          ? 'text-primary-600'
                          : stat.color === 'success'
                          ? 'text-success-600'
                          : stat.color === 'warning'
                          ? 'text-warning-600'
                          : 'text-error-600'
                      }`}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card variant="elevated">
            <CardHeader title="Recent Activity" />
            <CardBody>
              <div className="space-y-4">
                {mockStats.recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className={`flex items-start p-4 rounded-lg border ${getActivityColor(activity.type)}`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card variant="elevated">
            <CardHeader title="Quick Actions" />
            <CardBody>
              <div className="space-y-3">
                <a
                  href="/dashboard/books/browse"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BookOpenIcon className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Browse Books</span>
                </a>
                <a
                  href="/dashboard/books/requests"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 text-warning-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">My Requests</span>
                </a>
                {hasRole(['admin', 'superadmin']) && (
                  <>
                    <a
                      href="/dashboard/users/pending"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UsersIcon className="w-5 h-5 text-success-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Pending Students</span>
                    </a>
                    <a
                      href="/dashboard/reports"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChartBarIcon className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">View Reports</span>
                    </a>
                  </>
                )}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
