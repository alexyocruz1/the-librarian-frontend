'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/context/I18nContext';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { locale, setLocale, t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Load remembered email on component mount
  React.useEffect(() => {
    const rememberedEmail = typeof window !== 'undefined' ? localStorage.getItem('rememberedEmail') : null;
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      // Don't auto-check remember me - let user decide each time
    }
  }, [setValue]);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const onSubmit = async (data: LoginFormData) => {
    console.log('📝 Login form submitted with data:', data);
    setIsLoading(true);
    
    // Handle remember me functionality
    if (typeof window !== 'undefined') {
      if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
      } else {
        // If user unchecks remember me, clear the remembered email
        localStorage.removeItem('rememberedEmail');
      }
    }
    
    try {
      const success = await login(data);
      console.log('📝 Login result:', success);
      // Don't redirect here - let the isAuthenticated check handle it
      if (!success) {
        // Add a small delay to show error message
        setTimeout(() => {
          setIsLoading(false);
        }, 1500);
      }
    } catch (error) {
      console.error('📝 Login error:', error);
      // Add a small delay to show error message
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    }
  };

  if (isAuthenticated) {
    // Add a small delay to show success message before redirect
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
    return null; // Prevent flash of login form
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        {/* Theme + Language Toggles */}
        <div className="absolute top-2 right-2 sm:top-0 sm:right-0 flex items-center gap-2 p-1 sm:p-0">
          <select
            aria-label={t('auth.language')}
            value={locale}
            onChange={(e) => setLocale(e.target.value as any)}
            className="h-9 px-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/95 dark:bg-gray-800/90 text-sm text-gray-900 dark:text-gray-100 shadow-sm backdrop-blur-sm min-w-[110px] sm:min-w-[120px] max-w-[40vw] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="en">{t('auth.language.en')}</option>
            <option value="es">{t('auth.language.es')}</option>
          </select>
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
            {t('auth.login.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-gray-600 dark:text-gray-400"
          >
            {t('auth.login.subtitle')}
          </motion.p>
        </div>

        {/* Login Form */}
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
                    {...register('email')}
                    type="email"
                    label={t('auth.login.email.label')}
                    placeholder={t('auth.login.email.placeholder')}
                    error={errors.email?.message}
                    autoComplete="email"
                    name="email"
                    leftIcon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                  />
                  {typeof window !== 'undefined' && localStorage.getItem('rememberedEmail') && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t('auth.login.emailRemembered')}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label={t('auth.login.password.label')}
                    placeholder={t('auth.login.password.placeholder')}
                    error={errors.password?.message}
                    autoComplete="current-password"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      {...register('rememberMe')}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      {t('auth.login.remember')}
                    </label>
                  </div>

                  <div className="text-sm">
                    <Link
                      href="/auth/forgot-password"
                      className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
                    >
                      {t('auth.login.forgot')}
                    </Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isLoading}
                  disabled={isLoading}
                  className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? t('auth.login.button.loading') : t('auth.login.button.idle')}
                </Button>
              </form>
            </CardBody>
          </Card>

          {/* Sign up link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('auth.login.noAccount')}{' '}
              <Link
                href="/auth/register"
                className="font-medium text-primary-600 hover:text-primary-500 transition-colors"
              >
                {t('auth.login.signupLink')}
              </Link>
            </p>
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
}

// Prevent SSR for this page to avoid localStorage issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
