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
import { formatDate, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { getErrorMessage, getInfoMessage } from '@/lib/errorMessages';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AppLoader from '@/components/ui/AppLoader';
import { useI18n } from '@/context/I18nContext';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

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

const getStatCards = (stats: DashboardStats, t: (k: string)=>string) => [
  {
    name: t('dashboard.stats.totalBooks'),
    value: stats.totalBooks,
    icon: BookOpenIcon,
    color: 'primary',
    description: t('dashboard.stats.desc.inCatalog'),
  },
  {
    name: t('dashboard.stats.totalUsers'),
    value: stats.totalUsers,
    icon: UsersIcon,
    color: 'success',
    description: t('dashboard.stats.desc.registered'),
  },
  {
    name: t('dashboard.stats.libraries'),
    value: stats.totalLibraries,
    icon: BuildingLibraryIcon,
    color: 'warning',
    description: t('dashboard.stats.desc.branches'),
  },
  {
    name: t('dashboard.stats.pendingRequests'),
    value: stats.pendingRequests,
    icon: ClipboardDocumentListIcon,
    color: 'error',
    description: t('dashboard.stats.desc.awaitingApproval'),
  },
];

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const { t } = useI18n();
  const { formatDateTime: ldt } = useLocaleFormat();
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
        
        // Fetch dashboard stats and recent activity from the new API endpoints
        const [statsResponse, activityResponse] = await Promise.allSettled([
          api.getDashboardStats(),
          api.getRecentActivity(10),
        ]);

        // Handle stats response
        let totalBooks = 0, totalUsers = 0, totalLibraries = 0, pendingRequests = 0, overdueBooks = 0;
        if (statsResponse.status === 'fulfilled') {
          const statsData = statsResponse.value.data?.data;
          totalBooks = statsData?.totalBooks || 0;
          totalUsers = statsData?.totalUsers || 0;
          totalLibraries = statsData?.totalLibraries || 0;
          pendingRequests = statsData?.pendingRequests || 0;
          overdueBooks = statsData?.overdueBooks || 0;
        }

        // Handle activity response
        let recentActivity: any[] = [];
        if (activityResponse.status === 'fulfilled') {
          recentActivity = activityResponse.value.data?.data?.activities || [];
        } else {
          // Fallback activity if API fails
          recentActivity = [{
            id: 'system-status',
            type: 'system',
            message: 'Library system is running smoothly',
            timestamp: new Date().toISOString(),
          }];
        }

        // Log any failed requests (only in development)
        if (process.env.NODE_ENV === 'development') {
          if (statsResponse.status === 'rejected') {
            console.error('📊 Dashboard stats API failed:', statsResponse.reason);
          }
          if (activityResponse.status === 'rejected') {
            console.error('📊 Recent activity API failed:', activityResponse.reason);
          }
        }

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
      case 'book_added':
        return <BookOpenIcon className="w-4 h-4 text-primary-600" />;
      case 'user_registered':
      case 'user_registration':
        return <UsersIcon className="w-4 h-4 text-warning-600" />;
      case 'pending_approval':
        return <ClipboardDocumentListIcon className="w-4 h-4 text-warning-600" />;
      case 'overdue':
        return <ClockIcon className="w-4 h-4 text-error-600" />;
      case 'system':
        return <ChartBarIcon className="w-4 h-4 text-primary-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'book_borrowed':
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700';
      case 'book_returned':
        return 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700';
      case 'book_added':
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700';
      case 'user_registered':
      case 'user_registration':
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700';
      case 'pending_approval':
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700';
      case 'overdue':
        return 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-700';
      case 'system':
        return 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return <AppLoader title="The Librarian" subtitle="Loading your dashboard…" size="md" />;
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
            {t('dashboard.welcome.title', { name: user?.name || '' })} 👋
          </h1>
          <p className="text-primary-100 text-lg">
            {t('dashboard.welcome.subtitle')}
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
            </Badge>
            <span className="text-primary-100 text-sm">
              {user?.lastLoginAt ? t('dashboard.lastLogin', { date: ldt(user.lastLoginAt) }) : t('dashboard.firstLogin')}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6"
      >
        {getStatCards(stats, t).map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
          >
            <Card variant="elevated" className="hover:shadow-medium transition-all duration-200 hover:scale-105">
              <CardBody className="p-4 lg:p-6">
                <div className="flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">{stat.name}</p>
                    </div>
                    <div
                      className={`p-2 lg:p-3 rounded-full flex-shrink-0 ml-3 ${
                        stat.color === 'primary'
                          ? 'bg-primary-100 dark:bg-primary-900/30'
                          : stat.color === 'success'
                          ? 'bg-success-100 dark:bg-success-900/30'
                          : stat.color === 'warning'
                          ? 'bg-warning-100 dark:bg-warning-900/30'
                          : 'bg-error-100 dark:bg-error-900/30'
                      }`}
                    >
                      <stat.icon
                        className={`w-5 h-5 lg:w-6 lg:h-6 ${
                          stat.color === 'primary'
                            ? 'text-primary-600 dark:text-primary-400'
                            : stat.color === 'success'
                            ? 'text-success-600 dark:text-success-400'
                            : stat.color === 'warning'
                            ? 'text-warning-600 dark:text-warning-400'
                            : 'text-error-600 dark:text-error-400'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {loading ? (
                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      ) : (
                        stat.value.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {stat.description}
                    </p>
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
            <CardHeader title={t('dashboard.recentActivity.title')} />
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
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {ldt(activity.timestamp)}
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
            <CardHeader title={t('dashboard.quickActions.title')} />
            <CardBody>
              <div className="space-y-3">
                <a
                  href="/dashboard/books/browse"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <BookOpenIcon className="w-5 h-5 text-primary-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('dashboard.quickActions.browseBooks')}</span>
                </a>
                <a
                  href="/dashboard/books/requests"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ClipboardDocumentListIcon className="w-5 h-5 text-warning-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('dashboard.quickActions.myRequests')}</span>
                </a>
                {hasRole(['admin', 'superadmin']) && (
                  <>
                    <a
                      href="/dashboard/users/pending"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <UsersIcon className="w-5 h-5 text-success-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('dashboard.quickActions.pendingStudents')}</span>
                    </a>
                    <a
                      href="/dashboard/reports"
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ChartBarIcon className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('dashboard.quickActions.viewReports')}</span>
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
