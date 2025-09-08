'use client';
 
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BookmarkIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime } from '@/lib/utils';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

interface BorrowRequest {
  _id: string;
  userId: string;
  libraryId: string;
  titleId: string;
  inventoryId?: string;
  copyId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  notes?: string;
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
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <ClockIcon className="w-5 h-5" />;
    case 'approved':
      return <CheckCircleIcon className="w-5 h-5" />;
    case 'rejected':
      return <XCircleIcon className="w-5 h-5" />;
    case 'cancelled':
      return <ExclamationTriangleIcon className="w-5 h-5" />;
    default:
      return <BookmarkIcon className="w-5 h-5" />;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'cancelled':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'text-warning-600 dark:text-warning-400';
    case 'approved':
      return 'text-success-600 dark:text-success-400';
    case 'rejected':
      return 'text-error-600 dark:text-error-400';
    case 'cancelled':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'cancelled'>('all');

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If user is not ready yet, don't error; just finish loading
      if (!user?.id) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const response = await api.get('/borrow-requests/user/' + user.id);
      
      if (response.data.success) {
        const requests = response.data.data?.requests || [];
        setRequests(requests);
        setError(null);
        // If we get an empty array, that's not an error - it's just no requests
      } else {
        const possible = (response as any)?.data?.data?.requests;
        if (Array.isArray(possible)) {
          setRequests(possible);
          setError(null);
        } else {
          setError('Failed to fetch requests');
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check if it's a 404 or similar "no data" error vs a real error
      if (error.response?.status === 404 || errorMessage.includes('not found')) {
        // Treat as empty state, not an error
        setRequests([]);
        setError(null);
      } else {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await api.patch(`/borrow-requests/${requestId}/cancel`);
      
      if (response.data.success) {
        toast.success('Request cancelled successfully');
        fetchRequests(); // Refresh the list
      } else {
        toast.error('Failed to cancel request');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getFilterCount = (status: string) => {
    if (status === 'all') return requests.length;
    return requests.filter(req => req.status === status).length;
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12"
    >
      <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <BookmarkIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No requests found
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        You haven't made any book requests yet. Browse our collection and request books you'd like to borrow.
      </p>
      <Button
        onClick={() => window.location.href = '/dashboard/books'}
        className="inline-flex items-center"
      >
        <BookOpenIcon className="w-4 h-4 mr-2" />
        Browse Books
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
        Unable to load requests
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {error || 'Something went wrong while fetching your requests. Please try again.'}
      </p>
      <Button
        onClick={fetchRequests}
        variant="outline"
        className="inline-flex items-center"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Try Again
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
          My Requests
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track your book borrowing requests and their status
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Requests' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' },
              { key: 'cancelled', label: 'Cancelled' },
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
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : requests.length === 0 ? (
        <EmptyState />
      ) : filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <BookmarkIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No {filter === 'all' ? '' : filter} requests found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {filter === 'all' 
              ? "You haven't made any book requests yet. Browse our collection and request books you'd like to borrow."
              : `You don't have any ${filter} requests. Try selecting a different filter or browse books to make new requests.`
            }
          </p>
          <Button
            onClick={() => window.location.href = '/dashboard/books'}
            className="inline-flex items-center"
          >
            <BookOpenIcon className="w-4 h-4 mr-2" />
            Browse Books
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {request.title?.title || 'Unknown Book'}
                        </h3>
                        <Badge variant={getStatusVariant(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <p>
                          <span className="font-medium">Authors:</span>{' '}
                          {request.title?.authors?.join(', ') || 'Unknown'}
                        </p>
                        <p>
                          <span className="font-medium">Library:</span>{' '}
                          {request.library?.name || 'Unknown Library'}
                        </p>
                        <p>
                          <span className="font-medium">Requested:</span>{' '}
                          {formatDateTime(request.requestedAt)}
                        </p>
                        {request.decidedAt && (
                          <p>
                            <span className="font-medium">Decided:</span>{' '}
                            {formatDateTime(request.decidedAt)}
                          </p>
                        )}
                        {request.notes && (
                          <p>
                            <span className="font-medium">Notes:</span>{' '}
                            {request.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelRequest(request._id)}
                        className="ml-4"
                      >
                        Cancel Request
                      </Button>
                    )}
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
