'use client';

import { useState, useEffect } from 'react';
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

export default function PendingStudentsPage() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const response = await api.get('/users/pending');
      setPendingUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast.error('Failed to fetch pending users');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await api.approveStudent(userId);
      toast.success('User approved successfully');
      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? They will not be able to access the system.')) return;

    try {
      await api.rejectStudent(userId);
      toast.success('User rejected successfully');
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pending Students</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and approve student registration requests</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Requests</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Students</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Student ID</p>
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
          title="Pending Approval" 
          subtitle={`${pendingUsers.length} users waiting for approval`}
        />
        <CardBody>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">All caught up!</h3>
              <p className="text-gray-600 dark:text-gray-400">No pending user approvals at this time.</p>
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
                            <span className="text-sm text-gray-600 dark:text-gray-400">Student ID: {user.studentId}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <ClockIcon className="w-4 h-4" />
                          <span>Requested on {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>

                        {user.profile && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Additional Information:</h4>
                            {user.profile.phone && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {user.profile.phone}</p>
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
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUser(user._id)}
                        leftIcon={<CheckCircleIcon className="w-4 h-4" />}
                        className="bg-success-600 hover:bg-success-700"
                      >
                        Approve
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
