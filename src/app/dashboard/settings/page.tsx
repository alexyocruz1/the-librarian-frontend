'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserIcon,
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { usePreferences } from '@/context/PreferencesContext';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/context/I18nContext';

// Form schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { t, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreference, updateNotificationPreference, savePreferences, isLoading: preferencesLoading } = usePreferences();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.profile?.phone || '',
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
        phone: user.profile?.phone || '',
      });
    }
  }, [user, profileForm]);

  const tabs = [
    { id: 'profile', name: t('settings.tabs.profile'), icon: UserIcon },
    { id: 'security', name: t('settings.tabs.security'), icon: ShieldCheckIcon },
    { id: 'preferences', name: t('settings.tabs.preferences'), icon: Cog6ToothIcon },
    { id: 'notifications', name: t('settings.tabs.notifications'), icon: BellIcon },
  ];

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await api.updateProfile(data);
      await refreshUser();
      toast.success(t('settings.profile.toast.updated'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('settings.profile.toast.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await api.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      passwordForm.reset();
      toast.success(t('settings.security.toast.changed'));
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('settings.security.toast.changeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'error';
      case 'admin':
        return 'warning';
      case 'student':
        return 'success';
      case 'guest':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'suspended':
        return 'error';
      default:
        return 'secondary';
    }
  };

  if (!user || preferencesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="skeleton h-8 w-32 rounded mb-2" />
              <div className="skeleton h-4 w-72 rounded" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="skeleton h-6 w-20 rounded" />
              <div className="skeleton h-6 w-24 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="card p-4 space-y-2">
                {[...Array(4)].map((_,i)=>(
                  <div key={i} className="skeleton h-10 w-full rounded" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="card p-6 space-y-4">
                <div className="skeleton h-5 w-40 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="skeleton h-10 w-full rounded" />
                  <div className="skeleton h-10 w-full rounded" />
                </div>
                <div className="skeleton h-10 w-1/3 rounded" />
                <div className="flex justify-end">
                  <div className="skeleton h-10 w-32 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t('settings.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('settings.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={getRoleBadgeVariant(user?.role || '')}>
                {user?.role ? t(`users.roles.${user.role}`) : ''}
              </Badge>
              <Badge variant={getStatusBadgeVariant(user?.status || '')}>
                {user?.status ? t(`users.status.${user.status}`) : ''}
              </Badge>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardBody className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                          activeTab === tab.id
                            ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                        )}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {tab.name}
                      </button>
                    );
                  })}
                </nav>
              </CardBody>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader title={t('settings.profile.title')} />
                <CardBody>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label={t('settings.profile.fullName')}
                        {...profileForm.register('name')}
                        error={profileForm.formState.errors.name?.message}
                        required
                      />
                      <Input
                        label={t('settings.profile.email')}
                        type="email"
                        {...profileForm.register('email')}
                        error={profileForm.formState.errors.email?.message}
                        required
                      />
                    </div>
                    <Input
                      label={t('settings.profile.phone')}
                      type="tel"
                      {...profileForm.register('phone')}
                      error={profileForm.formState.errors.phone?.message}
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        disabled={!profileForm.formState.isDirty}
                      >
                        {t('settings.profile.updateButton')}
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <CardHeader title={t('settings.security.title')} />
                <CardBody>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          label={t('settings.security.currentPassword')}
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...passwordForm.register('currentPassword')}
                          error={passwordForm.formState.errors.currentPassword?.message}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          label={t('settings.security.newPassword')}
                          type={showNewPassword ? 'text' : 'password'}
                          {...passwordForm.register('newPassword')}
                          error={passwordForm.formState.errors.newPassword?.message}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          label={t('settings.security.confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...passwordForm.register('confirmPassword')}
                          error={passwordForm.formState.errors.confirmPassword?.message}
                          required
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                        disabled={!passwordForm.formState.isDirty}
                      >
                        {t('settings.security.changeButton')}
                      </Button>
                    </div>
                  </form>
                </CardBody>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader title={t('settings.preferences.appearance.title')} />
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          {t('settings.preferences.appearance.theme')}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'light', label: t('settings.preferences.appearance.light'), icon: '☀️' },
                            { value: 'dark', label: t('settings.preferences.appearance.dark'), icon: '🌙' },
                            { value: 'system', label: t('settings.preferences.appearance.system'), icon: '💻' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setTheme(option.value as any)}
                              className={cn(
                                'flex flex-col items-center p-4 rounded-lg border-2 transition-colors',
                                theme === option.value
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              )}
                            >
                              <span className="text-2xl mb-2">{option.icon}</span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title={t('settings.preferences.region.title')} />
                  <CardBody>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.preferences.region.language')}
                        </label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          aria-label={t('settings.preferences.region.aria.language')}
                          value={preferences.language}
                          onChange={(e) => { updatePreference('language', e.target.value); setLocale(e.target.value as any); }}
                        >
                          <option value="en">{t('auth.language.en')}</option>
                          <option value="es">{t('auth.language.es')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('settings.preferences.region.timezone')}
                        </label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          aria-label={t('settings.preferences.region.aria.timezone')}
                          value={preferences.timezone}
                          onChange={(e) => updatePreference('timezone', e.target.value)}
                        >
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">{t('settings.preferences.region.tz.eastern')}</option>
                          <option value="America/Chicago">{t('settings.preferences.region.tz.central')}</option>
                          <option value="America/Denver">{t('settings.preferences.region.tz.mountain')}</option>
                          <option value="America/Los_Angeles">{t('settings.preferences.region.tz.pacific')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="primary"
                        onClick={savePreferences}
                        loading={preferencesLoading}
                      >
                        {t('settings.preferences.save')}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card>
                <CardHeader title={t('settings.notifications.title')} />
                <CardBody>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('settings.notifications.email.title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.email.desc')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.notifications.email}
                          onChange={(e) => updateNotificationPreference('email', e.target.checked)}
                          aria-label={t('settings.notifications.email.aria')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('settings.notifications.push.title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.push.desc')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.notifications.push}
                          onChange={(e) => updateNotificationPreference('push', e.target.checked)}
                          aria-label={t('settings.notifications.push.aria')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('settings.notifications.borrow.title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.borrow.desc')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.notifications.borrowReminders}
                          onChange={(e) => updateNotificationPreference('borrowReminders', e.target.checked)}
                          aria-label={t('settings.notifications.borrow.aria')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t('settings.notifications.system.title')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('settings.notifications.system.desc')}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={preferences.notifications.systemUpdates}
                          onChange={(e) => updateNotificationPreference('systemUpdates', e.target.checked)}
                          aria-label={t('settings.notifications.system.aria')}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="primary"
                        onClick={savePreferences}
                        loading={preferencesLoading}
                      >
                        {t('settings.preferences.save')}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
