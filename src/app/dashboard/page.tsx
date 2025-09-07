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
import { api } from '@/lib/api';
import { getErrorMessage, getInfoMessage } from '@/lib/errorMessages';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalBooks: number;
  totalUsers: number;
  totalLibraries: number;
  pendingRequests: number;
  overdueBooks: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user?: string;
    book?: string;
  }>;
}

const getStatCards = (stats: DashboardStats) => [
  {
    name: 'Total Books',
    value: stats.totalBooks,
    icon: BookOpenIcon,
    color: 'primary',
    change: '+12%',
    changeType: 'positive' as const,
  },
  {
    name: 'Total Users',
    value: stats.totalUsers,
    icon: UsersIcon,
    color: 'success',
    change: '+8%',
    changeType: 'positive' as const,
  },
  {
    name: 'Libraries',
    value: stats.totalLibraries,
    icon: BuildingLibraryIcon,
    color: 'warning',
    change: '0%',
    changeType: 'neutral' as const,
  },
  {
    name: 'Pending Requests',
    value: stats.pendingRequests,
    icon: ClipboardDocumentListIcon,
    color: 'error',
    change: '+3',
    changeType: 'negative' as const,
  },
];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalUsers: 0,
    totalLibraries: 0,
    pendingRequests: 0,
    overdueBooks: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Add a small delay to ensure token is properly set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Fetch all data in parallel with individual error handling
        const [titlesResponse, usersResponse, librariesResponse, borrowRequestsResponse, borrowRecordsResponse] = await Promise.allSettled([
          api.get('/titles'),
          api.get('/users'),
          api.get('/libraries'),
          api.get('/borrow-requests/pending'),
          api.get('/borrow-records/overdue'),
        ]);

        // Handle individual responses
        const totalBooks = titlesResponse.status === 'fulfilled' ? (titlesResponse.value.data?.data?.titles?.length || 0) : 0;
        const totalUsers = usersResponse.status === 'fulfilled' ? (usersResponse.value.data?.data?.users?.length || 0) : 0;
        const totalLibraries = librariesResponse.status === 'fulfilled' ? (librariesResponse.value.data?.data?.libraries?.length || 0) : 0;
        const pendingRequests = borrowRequestsResponse.status === 'fulfilled' ? (borrowRequestsResponse.value.data?.data?.requests?.length || 0) : 0;
        const overdueBooks = borrowRecordsResponse.status === 'fulfilled' ? (borrowRecordsResponse.value.data?.data?.overdueRecords?.length || 0) : 0;

        // Log any failed requests (only in development)
        if (process.env.NODE_ENV === 'development') {
          [titlesResponse, usersResponse, librariesResponse, borrowRequestsResponse, borrowRecordsResponse].forEach((response, index) => {
            if (response.status === 'rejected') {
              console.error(`📊 API call ${index} failed:`, response.reason);
            }
          });
        }

        // For recent activity, we'll create a simple list based on available data
        const recentActivity = [
          ...(pendingRequests > 0 ? [{
            id: 'pending-requests',
            type: 'pending_approval',
            message: `${pendingRequests} pending borrow request${pendingRequests > 1 ? 's' : ''}`,
            timestamp: new Date().toISOString(),
          }] : []),
          ...(overdueBooks > 0 ? [{
            id: 'overdue-books',
            type: 'overdue',
            message: `${overdueBooks} overdue book${overdueBooks > 1 ? 's' : ''}`,
            timestamp: new Date().toISOString(),
          }] : []),
          {
            id: 'system-status',
            type: 'system',
            message: 'Library system is running smoothly',
            timestamp: new Date().toISOString(),
          },
        ];

        setStats({
          totalBooks,
          totalUsers,
          totalLibraries,
          pendingRequests,
          overdueBooks,
          recentActivity,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Don't show toast for individual API failures - they're handled above
        // Set default values on error
        setStats({
          totalBooks: 0,
          totalUsers: 0,
          totalLibraries: 0,
          pendingRequests: 0,
          overdueBooks: 0,
          recentActivity: [{
            id: 'error',
            type: 'system',
            message: getInfoMessage('no_data'),
            timestamp: new Date().toISOString(),
          }],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-primary-100 text-lg">
            Loading your library system data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
              {user?.lastLoginAt ? `Last login: ${formatDate(user.lastLoginAt)}` : 'First login'}
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
        {getStatCards(stats).map((stat, index) => (
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
                {stats.recentActivity.map((activity, index) => (
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
