'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon,
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage, getSuccessMessage, getInfoMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import AppLoader from '@/components/ui/AppLoader';
import { useI18n } from '@/context/I18nContext';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

interface ReportStats {
  summary: {
    totalBooks: number;
    totalUsers: number;
    totalLibraries: number;
    totalInventories: number;
    totalCopies: number;
    activeLoans: number;
    overdueBooks: number;
    pendingRequests: number;
    totalBorrows: number;
    dateRange: number;
  };
  popularBooks: Array<{
    title: string;
    borrowCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    user?: string;
    book?: string;
    library?: string;
  }>;
  borrowTrends: Array<{
    _id: string;
    count: number;
  }>;
  userActivityStats: Array<{
    name: string;
    email: string;
    role: string;
    borrowCount: number;
    lastActivity: string;
  }>;
  libraryStats: Array<{
    name: string;
    code: string;
    totalBorrows: number;
    activeLoans: number;
    overdueCount: number;
    overdueRate: number;
  }>;
  systemHealth: {
    overdueRate: number;
    requestProcessingRate: string;
    systemStatus: string;
    lastUpdated: string;
  };
}

export default function ReportsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { formatNumber, formatPercentage } = useLocaleFormat();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await api.getReportsData(dateRange);
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        throw new Error('Failed to fetch reports data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      let data: any = null;
      let filename = '';

      switch (type) {
        case 'Full':
          data = stats;
          filename = `full-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'Books':
          const booksResponse = await api.getReportData('books', dateRange);
          data = booksResponse.data;
          filename = `books-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'Users':
          const usersResponse = await api.getReportData('users', dateRange);
          data = usersResponse.data;
          filename = `users-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'Loans':
          const loansResponse = await api.getReportData('loans', dateRange);
          data = loansResponse.data;
          filename = `loans-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          throw new Error('Invalid report type');
      }

      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${type} report exported successfully!`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const canViewReports = user?.role === 'admin' || user?.role === 'superadmin';

  if (!canViewReports) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don&apos;t have permission to view reports.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-48 rounded mb-2" />
            <div className="skeleton h-4 w-72 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-40 rounded" />
            <div className="skeleton h-10 w-36 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-24 rounded mb-2" />
                  <div className="skeleton h-6 w-16 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="skeleton h-5 w-40 rounded mb-4" />
            <div className="space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-8 w-8 rounded-full" />
                    <div>
                      <div className="skeleton h-4 w-40 rounded mb-2" />
                      <div className="skeleton h-3 w-24 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-6 w-10 rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="skeleton h-5 w-40 rounded mb-4" />
            <div className="space-y-3">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="skeleton h-5 w-5 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-64 rounded mb-2" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-5 w-12 rounded" />
              </div>
            ))}
          </div>
          <div className="card p-6 space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="skeleton h-10 w-full rounded" />
            ))}
          </div>
          <div className="card p-6 space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('reports.noData.title')}</h2>
        <p className="text-gray-600">{t('reports.noData.subtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('reports.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label={t('reports.title')}
          >
            <option value="7">{t('reports.dateRange.7')}</option>
            <option value="30">{t('reports.dateRange.30')}</option>
            <option value="90">{t('reports.dateRange.90')}</option>
            <option value="365">{t('reports.dateRange.365')}</option>
          </select>
          <Button
            leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
            onClick={() => handleExportReport('Full')}
          >
            {t('reports.export')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardBody className="p-6 h-full">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.metrics.totalBooks')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatNumber(stats.summary.totalBooks)}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardBody className="p-6 h-full">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.metrics.totalUsers')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{stats.summary.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardBody className="p-6 h-full">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.metrics.activeLoans')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{stats.summary.activeLoans}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="h-full"
        >
          <Card className="h-full">
            <CardBody className="p-6 h-full">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('reports.metrics.overdueBooks')}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{stats.summary.overdueBooks}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Books */}
        <Card>
          <CardHeader 
            title={t('reports.popular.title')} 
            subtitle={t('reports.popular.subtitle')}
          />
          <CardBody>
            <div className="space-y-4">
              {stats.popularBooks.map((book, index) => (
                <motion.div
                  key={book.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{book.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(book.borrowCount)} borrows</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    {book.borrowCount}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader 
            title={t('reports.recent.title')} 
            subtitle={t('reports.recent.subtitle')}
          />
          <CardBody>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'borrow' && <BookOpenIcon className="w-4 h-4 text-primary-600" />}
                    {activity.type === 'return' && <BookOpenIcon className="w-4 h-4 text-success-600" />}
                    {activity.type === 'request' && <ClockIcon className="w-4 h-4 text-warning-600" />}
                    {activity.type === 'overdue' && <ExclamationTriangleIcon className="w-4 h-4 text-error-600" />}
                    {activity.type === 'approval' && <UsersIcon className="w-4 h-4 text-success-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('reports.activity.timestamp', { date: new Date(activity.timestamp).toLocaleString() })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader title={t('reports.libraryStats.title')} />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.libraryStats.totalLibraries')}</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.summary.totalLibraries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.libraryStats.pendingRequests')}</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stats.summary.pendingRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.libraryStats.totalBorrows')}</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{formatNumber(stats.summary.totalBorrows)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('reports.quickActions.title')} />
          <CardBody>
            <div className="space-y-3">
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={() => handleExportReport('Books')}
              >
                {t('reports.quickActions.exportBooks')}
              </Button>
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={() => handleExportReport('Users')}
              >
                {t('reports.quickActions.exportUsers')}
              </Button>
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={() => handleExportReport('Loans')}
              >
                {t('reports.quickActions.exportLoans')}
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('reports.systemHealth.title')} />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.systemHealth.overdueRate')}</span>
                <Badge variant={stats.systemHealth.overdueRate > 20 ? 'error' : 'success'}>
                  {formatPercentage(stats.systemHealth.overdueRate / 100)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.systemHealth.requestProcessing')}</span>
                <Badge variant={stats.systemHealth.requestProcessingRate === 'High' ? 'warning' : 'success'}>
                  {stats.systemHealth.requestProcessingRate}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('reports.systemHealth.systemStatus')}</span>
                <Badge variant={stats.systemHealth.systemStatus === 'Healthy' ? 'success' : 'warning'}>
                  {stats.systemHealth.systemStatus}
                </Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Additional Analytics Sections */}
      {stats.userActivityStats && stats.userActivityStats.length > 0 && (
        <Card>
          <CardHeader 
            title={t('reports.topUsers.title')} 
            subtitle={t('reports.topUsers.subtitle')}
          />
          <CardBody>
            <div className="space-y-4">
              {stats.userActivityStats.slice(0, 5).map((user, index) => (
                <motion.div
                  key={user.email}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-success-100 dark:bg-success-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-success-700 dark:text-success-300">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user.role} • {user.borrowCount} borrows</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">
                    {user.borrowCount}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Library Performance */}
      {stats.libraryStats && stats.libraryStats.length > 0 && (
        <Card>
          <CardHeader 
            title={t('reports.libraryPerf.title')} 
            subtitle={t('reports.libraryPerf.subtitle')}
          />
          <CardBody>
            <div className="space-y-4">
              {stats.libraryStats.map((library, index) => (
                <motion.div
                  key={library.code}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <BuildingLibraryIcon className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{library.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('reports.libraryPerf.summary', { totalBorrows: formatNumber(library.totalBorrows), activeLoans: formatNumber(library.activeLoans) })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={library.overdueRate > 10 ? 'error' : 'success'} size="sm">
                      {t('reports.overduePercent', { percent: library.overdueRate.toFixed(1) })}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
