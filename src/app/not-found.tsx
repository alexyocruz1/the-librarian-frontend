'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  BookOpenIcon, 
  MagnifyingGlassIcon, 
  HomeIcon,
  ExclamationTriangleIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

export default function NotFound() {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleSearchBooks = () => {
    router.push('/dashboard/books');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        <Card className="text-center">
          <CardBody className="p-4 sm:p-6 md:p-8 lg:p-12">
            {/* 404 Number with Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-6 md:mb-8"
            >
              <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold text-primary-600 dark:text-primary-400 mb-3 md:mb-4">
                404
              </div>
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                <BookOpenIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-primary-500 animate-bounce" />
                <ExclamationTriangleIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-warning-500 animate-pulse" />
                <BookmarkIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-secondary-500 animate-bounce" style={{ animationDelay: '0.5s' }} />
              </div>
            </motion.div>

            {/* Main Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 md:mb-8"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 md:mb-4">
                Oops! This Page is Missing! 📚
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2">
                Looks like this book has been checked out and never returned!
              </p>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                The page you're looking for seems to have wandered off to the fiction section.
              </p>
            </motion.div>

            {/* Fun Library-themed Messages */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6 md:mb-8"
            >
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                <p className="text-xs sm:text-sm text-primary-700 dark:text-primary-300 italic">
                  "The best way to find a missing page is to start looking in the right section." 
                  <br />
                  <span className="text-xs">- The Librarian's Guide to Navigation</span>
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <MagnifyingGlassIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Maybe it's in the catalog?</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Or perhaps it's overdue?</span>
                </div>
                <div className="flex items-center justify-center space-x-2 sm:col-span-2 md:col-span-1">
                  <BookmarkIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-center">Check the bookmarks!</span>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center"
            >
              <Button
                onClick={handleGoHome}
                variant="primary"
                size="lg"
                leftIcon={<HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Return to Library
              </Button>
              
              <Button
                onClick={handleSearchBooks}
                variant="secondary"
                size="lg"
                leftIcon={<MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Browse Books
              </Button>
              
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Go Back
              </Button>
            </motion.div>

            {/* Fun Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Error Code: BOOK_NOT_FOUND_404
                <br />
                <span className="text-primary-600 dark:text-primary-400">
                  📖 "Every book has its place, but this page seems to have found a new home!"
                </span>
              </p>
            </motion.div>
          </CardBody>
        </Card>

        {/* Floating Books Animation - Hidden on mobile for better performance */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl opacity-5"
              initial={{ 
                x: Math.random() * 100,
                y: Math.random() * 100,
                rotate: Math.random() * 360
              }}
              animate={{ 
                y: [null, -20, 0],
                rotate: [null, Math.random() * 360]
              }}
              transition={{ 
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2
              }}
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
            >
              📚
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
