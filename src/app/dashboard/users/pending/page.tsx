'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';
import toast from 'react-hot-toast';
import AppLoader from '@/components/ui/AppLoader';
import { Skeleton } from '@/components/ui/Skeleton';
import { getErrorMessage } from '@/lib/errorMessages';
import { useI18n } from '@/context/I18nContext';

export default function PendingStudentsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const response = await api.get('/users/pending');
      setPendingUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error(t('pendingStudents.toast.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPendingUsers();
  }, [fetchPendingUsers]);


  const handleApproveUser = async (userId: string) => {
    try {
      await api.approveStudent(userId);
      toast.success(t('pendingStudents.toast.approved'));
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm(t('pendingStudents.confirm.reject'))) return;

    try {
      await api.rejectStudent(userId);
      toast.success(t('pendingStudents.toast.rejected'));
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

  if (!canManage) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('common.accessDenied.title')}</h2>
        <p className="text-gray-600">{t('common.accessDenied.description')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-8 w-44 rounded mb-2" />
          <div className="skeleton h-4 w-80 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map((i)=>(
            <div key={i} className="card p-6">
              <div className="flex items-center gap-4">
                <div className="skeleton h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-28 rounded mb-2" />
                  <div className="skeleton h-6 w-12 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card p-6">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="space-y-4">
            {[...Array(4)].map((_,i)=>(
              <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-12 w-12 rounded-full" />
                  <div>
                    <div className="skeleton h-4 w-48 rounded mb-2" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="skeleton h-9 w-24 rounded" />
                  <div className="skeleton h-9 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('pendingStudents.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('pendingStudents.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pendingStudents.stats.pending')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{pendingUsers.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pendingStudents.stats.students')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {pendingUsers.filter(u => u.role === 'student').length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pendingStudents.stats.withStudentId')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {pendingUsers.filter(u => u.studentId).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pending Users List */}
      <Card>
        <CardHeader 
          title={t('pendingStudents.card.title')} 
          subtitle={t('pendingStudents.card.subtitle', { count: pendingUsers.length })}
        />
        <CardBody>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('pendingStudents.empty.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('pendingStudents.empty.description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-lg font-medium text-primary-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{user.name}</h3>
                          <Badge variant="warning">Pending</Badge>
                          <Badge variant="secondary">{user.role}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
                        
                        {user.studentId && (
                          <div className="flex items-center gap-2 mb-2">
                            <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('pendingStudents.labels.studentId', { id: user.studentId })}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4" />
                          <span>{t('pendingStudents.labels.requestedOn', { date: new Date(user.createdAt).toLocaleDateString() })}</span>
                        </div>

                        {user.profile && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{t('pendingStudents.labels.additionalInfo')}</h4>
                            {user.profile.phone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{t('pendingStudents.labels.phone', { phone: user.profile.phone })}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectUser(user._id)}
                        leftIcon={<XCircleIcon className="w-4 h-4" />}
                        className="text-error-600 border-error-300 hover:bg-error-50"
                      >
                        {t('users.actions.reject')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user._id)}
                        leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                        className="bg-success-600 hover:bg-success-700"
                      >
                        {t('users.actions.approve')}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
