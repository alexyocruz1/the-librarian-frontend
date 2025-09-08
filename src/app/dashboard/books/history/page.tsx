'use client';
 
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  LibraryIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';
import AppLoader from '@/components/ui/AppLoader';

interface BorrowRecord {
  _id: string;
  userId: string;
  libraryId: string;
  titleId: string;
  inventoryId: string;
  copyId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue' | 'lost';
  approvedBy: string;
  fees?: {
    lateFee?: number;
    damageFee?: number;
    currency?: string;
  };
  title?: {
    _id: string;
    title: string;
    authors: string[];
    isbn13?: string;
    isbn10?: string;
  };
  library?: {
    _id: string;
    name: string;
    code: string;
  };
  copy?: {
    _id: string;
    barcode?: string;
    condition: string;
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'borrowed':
      return <BookOpenIcon className="w-5 h-5" />;
    case 'returned':
      return <CheckCircleIcon className="w-5 h-5" />;
    case 'overdue':
      return <ExclamationTriangleIcon className="w-5 h-5" />;
    case 'lost':
      return <ExclamationTriangleIcon className="w-5 h-5" />;
    default:
      return <BookOpenIcon className="w-5 h-5" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'borrowed':
      return 'warning';
    case 'returned':
      return 'success';
    case 'overdue':
      return 'error';
    case 'lost':
      return 'error';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'borrowed':
      return 'text-warning-600 dark:text-warning-400';
    case 'returned':
      return 'text-success-600 dark:text-success-400';
    case 'overdue':
      return 'text-error-600 dark:text-error-400';
    case 'lost':
      return 'text-error-600 dark:text-error-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export default function MyHistoryPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { formatDateTime: formatDT, formatCurrency } = useLocaleFormat();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'borrowed' | 'returned' | 'overdue' | 'lost'>('all');

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If user is not ready yet, don't error; just finish loading with empty
      if (!user?.id) {
        setRecords([]);
        setLoading(false);
        return;
      }

      const response = await api.get('/borrow-records/user/' + user.id);
      
      if (response.data.success) {
        const records = response.data.data?.history || [];
        setRecords(records);
        setError(null);
        // If we get an empty array, that's not an error - it's just no history
      } else {
        const possible = (response as any)?.data?.data?.history;
        if (Array.isArray(possible)) {
          setRecords(possible);
          setError(null);
        } else {
          setError('Failed to fetch borrow history');
        }
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a 404 or similar "no data" error vs a real error
      if (error.response?.status === 404 || errorMessage.includes('not found')) {
        // Treat as empty state, not an error
        setRecords([]);
        setError(null);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    if (filter === 'all') return true;
    return record.status === filter;
  });

  const getFilterCount = (status: string) => {
    if (status === 'all') return records.length;
    return records.filter(record => record.status === status).length;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'returned' || status === 'lost') return false;
    return new Date(dueDate) < new Date();
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <BookOpenIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t('history.empty.title')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {t('history.empty.description')}
      </p>
      <Button
        onClick={() => window.location.href = '/dashboard/books'}
        className="inline-flex items-center"
      >
        <BookOpenIcon className="w-4 h-4 mr-2" />
        {t('history.empty.cta')}
      </Button>
    </motion.div>
  );

  const ErrorState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="mx-auto w-24 h-24 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center mb-6">
        <ExclamationTriangleIcon className="w-12 h-12 text-error-600 dark:text-error-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t('history.error.title')}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {error || t('history.error.description')}
      </p>
      <Button
        onClick={fetchHistory}
        variant="outline"
        className="inline-flex items-center"
      >
        <ClockIcon className="w-4 h-4 mr-2" />
        {t('history.error.retry')}
      </Button>
    </motion.div>
  );

  const LoadingState = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('history.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('history.subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: t('history.filters.all') },
              { key: 'borrowed', label: t('history.filters.borrowed') },
              { key: 'returned', label: t('history.filters.returned') },
              { key: 'overdue', label: t('history.filters.overdue') },
              { key: 'lost', label: t('history.filters.lost') },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${filter === key
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                {label} ({getFilterCount(key)})
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Content */}
      {loading ? (
        <AppLoader subtitle={t('history.loading')} size="md" />
      ) : error ? (
        <ErrorState />
      ) : records.length === 0 ? (
        <EmptyState />
      ) : filteredRecords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <BookOpenIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {filter === 'all' ? t('history.empty.title') : t('history.filteredEmpty.title', { status: filter })}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {filter === 'all' 
              ? t('history.empty.description')
              : t('history.filteredEmpty.description', { status: filter })}
          </p>
          <Button
            onClick={() => window.location.href = '/dashboard/books'}
            className="inline-flex items-center"
          >
            <BookOpenIcon className="w-4 h-4 mr-2" />
            {t('history.empty.cta')}
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <motion.div
              key={record._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={getStatusColor(record.status)}>
                          {getStatusIcon(record.status)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {record.title?.title || t('history.unknown.book')}
                        </h3>
                        <Badge variant={getStatusVariant(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                        {isOverdue(record.dueDate, record.status) && (
                          <Badge variant="error">
                            {t('history.badge.overdue')}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">{t('history.labels.authors')}</span>{' '}
                          {record.title?.authors?.join(', ') || t('history.unknown.value')}
                        </p>
                        <p>
                          <span className="font-medium">{t('history.labels.library')}</span>{' '}
                          {record.library?.name || t('history.unknown.library')}
                        </p>
                        {record.copy?.barcode && (
                          <p>
                            <span className="font-medium">{t('history.labels.barcode')}</span>{' '}
                            {record.copy.barcode}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">{t('history.labels.borrowed')}</span>{' '}
                          {formatDT(record.borrowDate)}
                        </p>
                        <p>
                          <span className="font-medium">{t('history.labels.dueDate')}</span>{' '}
                          <span className={isOverdue(record.dueDate, record.status) ? 'text-error-600 dark:text-error-400 font-medium' : ''}>
                            {formatDT(record.dueDate)}
                          </span>
                        </p>
                        {record.returnDate && (
                          <p>
                            <span className="font-medium">{t('history.labels.returned')}</span>{' '}
                            {formatDT(record.returnDate)}
                          </p>
                        )}
                        {record.fees && (record.fees.lateFee || record.fees.damageFee) && (
                          <p>
                            <span className="font-medium">{t('history.labels.fees')}</span>{' '}
                            <span className="text-warning-600 dark:text-warning-400">
                              {record.fees.currency || 'USD'} {((record.fees.lateFee || 0) + (record.fees.damageFee || 0)).toFixed(2)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
