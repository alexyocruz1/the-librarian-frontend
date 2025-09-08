'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, BookOpenIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/context/I18nContext';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'guest'], {
    required_error: 'Please select a role',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'guest',
    },
  });

  const selectedRole = watch('role');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      const success = await registerUser(registerData);
      if (success) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null; // Prevent flash of register form
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Theme Toggle */}
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg"
          >
            <BookOpenIcon className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            {t('auth.register.title', { app: t('app.title') })}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-400"
          >
            {t('auth.register.subtitle')}
          </motion.p>
        </div>

        {/* Register Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card variant="elevated">
            <CardBody>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <Input
                    {...register('name')}
                    type="text"
                    label={t('auth.register.name.label')}
                    placeholder={t('auth.register.name.placeholder')}
                    error={errors.name?.message}
                    autoComplete="name"
                    name="name"
                    leftIcon={<UserIcon className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <Input
                    {...register('email')}
                    type="email"
                    label={t('auth.register.email.label')}
                    placeholder={t('auth.register.email.placeholder')}
                    error={errors.email?.message}
                    autoComplete="email"
                    name="email"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.register.accountType')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="relative">
                      <input
                        {...register('role')}
                        type="radio"
                        value="guest"
                        className="sr-only peer"
                      />
                      <div className="p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 hover:border-gray-300 dark:hover:border-gray-500">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('auth.register.role.guest')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('auth.register.role.guest.desc')}</div>
                        </div>
                      </div>
                    </label>
                    <label className="relative">
                      <input
                        {...register('role')}
                        type="radio"
                        value="student"
                        className="sr-only peer"
                      />
                      <div className="p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer transition-all duration-200 peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 hover:border-gray-300 dark:hover:border-gray-500">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('auth.register.role.student')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('auth.register.role.student.desc')}</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  {errors.role && (
                    <p className="text-sm text-error-600 mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label={t('auth.register.password.label')}
                    placeholder={t('auth.register.password.placeholder')}
                    error={errors.password?.message}
                    autoComplete="new-password"
                    name="password"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                </div>

                <div>
                  <Input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    label={t('auth.register.confirm.label')}
                    placeholder={t('auth.register.confirm.placeholder')}
                    error={errors.confirmPassword?.message}
                    autoComplete="new-password"
                    name="confirmPassword"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    }
                  />
                </div>

                {/* Role-specific information */}
                {selectedRole === 'student' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg"
                  >
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="text-sm text-warning-700 dark:text-warning-300">
                        <p className="font-medium">{t('auth.register.studentApproval.title')}</p>
                        <p className="mt-1">{t('auth.register.studentApproval.body')}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {t('auth.register.button')}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Sign in link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('auth.register.haveAccount')}{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                {t('auth.register.signinLink')}
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
