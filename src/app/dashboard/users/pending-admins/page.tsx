'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/errorMessages';
import { useI18n } from '@/context/I18nContext';

export default function PendingAdminsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [pendingAdmins, setPendingAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingAdmins = useCallback(async () => {
    try {
      const response = await api.get('/users/pending');
      const all = ((response.data && (response.data as any).students) || []) as User[];
      setPendingAdmins(all.filter(u => u.role === 'admin'));
    } catch (error) {
      console.error('Error fetching pending admins:', error);
      toast.error(t('pendingAdmins.toast.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPendingAdmins();
  }, [fetchPendingAdmins]);

  const handleApprove = async (userId: string) => {
    try {
      await api.approveStudent(userId);
      toast.success(t('pendingAdmins.toast.approved'));
      fetchPendingAdmins();
    } catch (error: any) {
      console.error('Error approving admin:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm(t('pendingAdmins.confirm.reject'))) return;
    try {
      await api.rejectStudent(userId);
      toast.success(t('pendingAdmins.toast.rejected'));
      fetchPendingAdmins();
    } catch (error: any) {
      console.error('Error rejecting admin:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const canManage = user?.role === 'superadmin';
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
          <div className="skeleton h-8 w-56 rounded mb-2" />
          <div className="skeleton h-4 w-80 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map((i)=> (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('pendingAdmins.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('pendingAdmins.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('pendingAdmins.stats.pending')}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{pendingAdmins.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader 
          title={t('pendingAdmins.card.title')} 
          subtitle={t('pendingAdmins.card.subtitle', { count: pendingAdmins.length })}
        />
        <CardBody>
          {pendingAdmins.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('pendingAdmins.empty.title')}</h3>
              <p className="text-gray-600 dark:text-gray-400">{t('pendingAdmins.empty.description')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAdmins.map((u, index) => (
                <motion.div
                  key={u._id}
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
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{u.name}</h3>
                          <Badge variant="warning">{t('users.status.pending')}</Badge>
                          <Badge variant="secondary">{t('users.roles.admin')}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApprove(u._id)}
                        leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                        className="text-success-600 hover:text-success-700"
                      >
                        {t('users.actions.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(u._id)}
                        leftIcon={<XCircleIcon className="w-4 h-4" />}
                        className="text-error-600 hover:text-error-700"
                      >
                        {t('users.actions.reject')}
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


