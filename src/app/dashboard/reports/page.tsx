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
import toast from 'react-hot-toast';

interface ReportStats {
  totalBooks: number;
  totalUsers: number;
  totalLibraries: number;
  activeLoans: number;
  overdueBooks: number;
  pendingRequests: number;
  totalBorrows: number;
  popularBooks: Array<{
    title: string;
    borrowCount: number;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      // Mock data for now - in real implementation, this would call the API
      const mockStats: ReportStats = {
        totalBooks: 1250,
        totalUsers: 450,
        totalLibraries: 3,
        activeLoans: 89,
        overdueBooks: 12,
        pendingRequests: 23,
        totalBorrows: 2340,
        popularBooks: [
          { title: 'Introduction to Computer Science', borrowCount: 45 },
          { title: 'Data Structures and Algorithms', borrowCount: 38 },
          { title: 'Machine Learning Fundamentals', borrowCount: 32 },
          { title: 'Web Development Guide', borrowCount: 28 },
          { title: 'Database Design Principles', borrowCount: 25 },
        ],
        recentActivity: [
          { type: 'borrow', description: 'John Doe borrowed "Introduction to Computer Science"', timestamp: '2024-01-15T10:30:00Z' },
          { type: 'return', description: 'Jane Smith returned "Data Structures and Algorithms"', timestamp: '2024-01-15T09:15:00Z' },
          { type: 'request', description: 'Mike Johnson requested "Machine Learning Fundamentals"', timestamp: '2024-01-15T08:45:00Z' },
          { type: 'overdue', description: 'Sarah Wilson has overdue book "Web Development Guide"', timestamp: '2024-01-14T16:20:00Z' },
          { type: 'approval', description: 'New student Alex Brown was approved', timestamp: '2024-01-14T14:10:00Z' },
        ],
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: string) => {
    try {
      // TODO: Implement actual report export
      toast.success(`${type} report exported successfully`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No data available</h2>
        <p className="text-gray-600">Unable to load report data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Library performance and usage statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            aria-label="Select date range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button
            leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
            onClick={() => handleExportReport('Full')}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Books</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalBooks.toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Loans</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeLoans}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardBody className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-error-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue Books</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.overdueBooks}</p>
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
            title="Most Popular Books" 
            subtitle="Top borrowed books in the selected period"
          />
          <CardBody>
            <div className="space-y-4">
              {stats.popularBooks.map((book, index) => (
                <motion.div
                  key={book.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{book.title}</h4>
                      <p className="text-xs text-gray-500">{book.borrowCount} borrows</p>
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
            title="Recent Activity" 
            subtitle="Latest library activities"
          />
          <CardBody>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {activity.type === 'borrow' && <BookOpenIcon className="w-4 h-4 text-primary-600" />}
                    {activity.type === 'return' && <BookOpenIcon className="w-4 h-4 text-success-600" />}
                    {activity.type === 'request' && <ClockIcon className="w-4 h-4 text-warning-600" />}
                    {activity.type === 'overdue' && <ExclamationTriangleIcon className="w-4 h-4 text-error-600" />}
                    {activity.type === 'approval' && <UsersIcon className="w-4 h-4 text-success-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
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
          <CardHeader title="Library Statistics" />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Libraries</span>
                <span className="text-lg font-semibold text-gray-900">{stats.totalLibraries}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Requests</span>
                <span className="text-lg font-semibold text-gray-900">{stats.pendingRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Borrows</span>
                <span className="text-lg font-semibold text-gray-900">{stats.totalBorrows.toLocaleString()}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Quick Actions" />
          <CardBody>
            <div className="space-y-3">
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={() => handleExportReport('Books')}
              >
                Export Books Report
              </Button>
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={() => handleExportReport('Users')}
              >
                Export Users Report
              </Button>
              <Button
                fullWidth
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
                onClick={() => handleExportReport('Loans')}
              >
                Export Loans Report
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="System Health" />
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overdue Rate</span>
                <Badge variant={stats.overdueBooks > 20 ? 'error' : 'success'}>
                  {((stats.overdueBooks / stats.activeLoans) * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Request Processing</span>
                <Badge variant={stats.pendingRequests > 50 ? 'warning' : 'success'}>
                  {stats.pendingRequests > 50 ? 'High' : 'Normal'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">System Status</span>
                <Badge variant="success">Healthy</Badge>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
