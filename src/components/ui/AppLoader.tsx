'use client';

import React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';

interface AppLoaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AppLoader({
  title,
  subtitle,
  className,
  iconClassName,
  size = 'md',
}: AppLoaderProps) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t('app.title');
  const resolvedSubtitle = subtitle ?? t('app.loading');
  const sizeClasses = {
    sm: {
      iconWrap: 'w-16 h-16',
      icon: 'w-8 h-8',
      title: 'text-lg',
      subtitle: 'text-sm',
    },
    md: {
      iconWrap: 'w-24 h-24',
      icon: 'w-12 h-12',
      title: 'text-2xl',
      subtitle: 'text-sm',
    },
    lg: {
      iconWrap: 'w-28 h-28',
      icon: 'w-14 h-14',
      title: 'text-3xl',
      subtitle: 'text-base',
    },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className || ''}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`mx-auto ${sizeClasses.iconWrap} rounded-full bg-gray-100 dark:bg-gray-800 shadow-inner flex items-center justify-center mb-6`}
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          <BookOpenIcon className={`${sizeClasses.icon} text-primary-600 dark:text-primary-300 ${iconClassName || ''}`} />
        </motion.div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className={`${sizeClasses.title} font-bold text-gray-900 dark:text-gray-100`}
      >
        {resolvedTitle}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className={`${sizeClasses.subtitle} text-gray-600 dark:text-gray-400 mt-2`}
      >
        {resolvedSubtitle}
      </motion.p>

      <div className="mt-6">
        <span className="inline-flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
        <span className="inline-flex h-2 w-2 rounded-full bg-primary-400 animate-pulse ml-2" />
        <span className="inline-flex h-2 w-2 rounded-full bg-primary-300 animate-pulse ml-2" />
      </div>
    </div>
  );
}


