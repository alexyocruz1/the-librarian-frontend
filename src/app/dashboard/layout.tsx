'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  HomeIcon,
  UsersIcon,
  BuildingLibraryIcon,
  BookmarkIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  roles?: string[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    name: 'dashboard.menu.dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'dashboard.menu.libraries',
    href: '/dashboard/libraries',
    icon: BuildingLibraryIcon,
  },
  {
    name: 'dashboard.menu.books',
    href: '/dashboard/books',
    icon: BookOpenIcon,
    children: [
      { name: 'dashboard.menu.allBooks', href: '/dashboard/books', icon: BookOpenIcon },
      { name: 'dashboard.menu.importExport', href: '/dashboard/books/import-export', icon: ClipboardDocumentListIcon, roles: ['admin', 'superadmin'] },
      { name: 'dashboard.menu.myRequests', href: '/dashboard/books/requests', icon: BookmarkIcon },
      { name: 'dashboard.menu.myHistory', href: '/dashboard/books/history', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    name: 'dashboard.menu.users',
    href: '/dashboard/users',
    icon: UsersIcon,
    roles: ['admin', 'superadmin'],
    children: [
      { name: 'dashboard.menu.allUsers', href: '/dashboard/users', icon: UsersIcon },
      { name: 'dashboard.menu.pendingStudents', href: '/dashboard/users/pending', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    name: 'dashboard.menu.reports',
    href: '/dashboard/reports',
    icon: ChartBarIcon,
    roles: ['admin', 'superadmin'],
  },
  {
    name: 'dashboard.menu.settings',
    href: '/dashboard/settings',
    icon: Cog6ToothIcon,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasRole, isAuthenticated, isLoading } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((role) => hasRole(role));
  });

  const isActive = (href: string, isChild: boolean = false) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    
    // For exact matches
    if (pathname === href) {
      return true;
    }
    
    // For parent routes, check if the pathname starts with href + '/'
    // This prevents /dashboard/books from matching /dashboard/books/import-export
    if (!isChild && pathname.startsWith(href + '/')) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <BookOpenIcon className="w-8 h-8 text-primary-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900 dark:text-gray-100">The Librarian</span>
                </div>
                              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close sidebar"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              </div>
              <nav className="mt-6 px-3">
                {filteredNavigation.map((item) => (
                  <div key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        isActive(item.href, false)
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {t(item.name)}
                    </Link>
                    {item.children && (
                      <div className="ml-8 mt-2 space-y-1">
                        {item.children
                          .filter((child) => {
                            if (!child.roles) return true;
                            return child.roles.some((role) => hasRole(role));
                          })
                          .map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                'flex items-center px-3 py-2 text-sm rounded-lg transition-colors',
                                isActive(child.href, true)
                                  ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                              )}
                            >
                              <child.icon className="w-4 h-4 mr-3" />
                              {t(child.name)}
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <BookOpenIcon className="w-8 h-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-gray-100">{t('app.title')}</span>
          </div>
          <nav className="flex-1 mt-6 px-3 space-y-1">
            {filteredNavigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive(item.href, false)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {t(item.name)}
                </Link>
                {item.children && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children
                      .filter((child) => {
                        if (!child.roles) return true;
                        return child.roles.some((role) => hasRole(role));
                      })
                      .map((child) => (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm rounded-lg transition-colors',
                            isActive(child.href, true)
                              ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200'
                          )}
                        >
                          <child.icon className="w-4 h-4 mr-3" />
                          {t(child.name)}
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
                aria-label="Open sidebar"
              >
                <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme toggle */}
              <ThemeToggle />
              
              {/* Notifications */}
              <NotificationCenter />
              
              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                </div>
                <div className="relative">
                  <button 
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="User profile menu"
                  >
                    <UserCircleIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
