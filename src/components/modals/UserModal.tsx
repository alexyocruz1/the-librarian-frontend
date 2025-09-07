'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { User, UserRole, UserStatus } from '@/types';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['admin', 'student', 'guest']),
  status: z.enum(['active', 'pending', 'rejected', 'suspended']),
  studentId: z.string().optional(),
  libraries: z.array(z.string()).optional(),
  profile: z.object({
    department: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  mode: 'create' | 'edit';
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'student', label: 'Student' },
  { value: 'guest', label: 'Guest' },
];

const statusOptions: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

export default function UserModal({ isOpen, onClose, onSuccess, user, mode }: UserModalProps) {
  const [loading, setLoading] = useState(false);
  const [libraries, setLibraries] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'guest',
      status: 'active',
      studentId: '',
      libraries: [],
      profile: {
        department: '',
        phone: '',
        address: '',
      },
    }
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isOpen) {
      fetchLibraries();
      if (mode === 'edit' && user) {
        setValue('name', user.name);
        setValue('email', user.email);
        setValue('role', user.role === 'superadmin' ? 'admin' : user.role);
        setValue('status', user.status);
        setValue('studentId', user.studentId || '');
        setValue('libraries', user.libraries?.map(lib => lib._id) || []);
        setValue('profile', {
          phone: user.profile?.phone || '',
        });
      } else {
        reset();
      }
    }
  }, [isOpen, mode, user, setValue, reset]);

  const fetchLibraries = async () => {
    try {
      const response = await api.get('/libraries');
      setLibraries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching libraries:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      const userData = {
        ...data,
        password: data.password || undefined,
        studentId: data.studentId || undefined,
        libraries: data.libraries?.length ? data.libraries : undefined,
        profile: data.profile?.department || data.profile?.phone || data.profile?.address 
          ? data.profile 
          : undefined,
      };

      if (mode === 'create') {
        await api.post('/users', userData);
        toast.success(getSuccessMessage('user_created'));
      } else {
        await api.put(`/users/${user?._id}`, userData);
        toast.success(getSuccessMessage('user_updated'));
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader
                  title={mode === 'create' ? 'Add New User' : 'Edit User'}
                  subtitle={mode === 'create' ? 'Create a new user account' : 'Update user information'}
                  action={
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      leftIcon={<XMarkIcon className="w-5 h-5" />}
                    />
                  }
                />
                
                <CardBody>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                        
                        <Input
                          label="Full Name *"
                          {...register('name')}
                          error={errors.name?.message}
                          placeholder="Enter full name"
                          autoComplete="name"
                          name="name"
                        />
                        
                        <Input
                          label="Email Address *"
                          type="email"
                          {...register('email')}
                          error={errors.email?.message}
                          placeholder="Enter email address"
                          autoComplete="email"
                          name="email"
                        />
                        
                        <Input
                          label={mode === 'create' ? 'Password *' : 'New Password (leave blank to keep current)'}
                          type="password"
                          {...register('password')}
                          error={errors.password?.message}
                          placeholder="Enter password"
                          autoComplete={mode === 'create' ? 'new-password' : 'new-password'}
                          name="password"
                        />
                      </div>

                      {/* Role and Status */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900">Role & Status</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Role *
                          </label>
                          <select
                            {...register('role')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.role && (
                            <p className="mt-1 text-sm text-error-600">{errors.role.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status *
                          </label>
                          <select
                            {...register('status')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.status && (
                            <p className="mt-1 text-sm text-error-600">{errors.status.message}</p>
                          )}
                        </div>

                        {selectedRole === 'student' && (
                          <Input
                            label="Student ID"
                            {...register('studentId')}
                            error={errors.studentId?.message}
                            placeholder="Enter student ID"
                          />
                        )}
                      </div>
                    </div>

                    {/* Library Assignment (for admins) */}
                    {selectedRole === 'admin' && libraries.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned Libraries
                        </label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-3">
                          {libraries.map((library) => (
                            <label key={library._id} className="flex items-center">
                              <input
                                type="checkbox"
                                value={library._id}
                                {...register('libraries')}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                {library.name} ({library.code})
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Profile Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Department"
                          {...register('profile.department')}
                          error={errors.profile?.department?.message}
                          placeholder="Enter department"
                        />
                        
                        <Input
                          label="Phone Number"
                          {...register('profile.phone')}
                          error={errors.profile?.phone?.message}
                          placeholder="Enter phone number"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <textarea
                          {...register('profile.address')}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                          placeholder="Enter address"
                        />
                        {errors.profile?.address && (
                          <p className="mt-1 text-sm text-error-600">{errors.profile.address.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                      >
                        {mode === 'create' ? 'Create User' : 'Update User'}
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
