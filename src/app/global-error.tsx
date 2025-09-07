'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const handleRetry = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-error-50 to-warning-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl w-full"
          >
            <Card className="text-center">
              <CardBody className="p-4 sm:p-6 md:p-8 lg:p-12">
                {/* Error Icon with Animation */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mb-6 md:mb-8"
                >
                  <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-3 md:mb-4">
                    <ExclamationTriangleIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-error-500 animate-pulse" />
                    <BookOpenIcon className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-primary-500 animate-bounce" />
                  </div>
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-error-600 dark:text-error-400">
                    Uh Oh!
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
                    Critical System Error! 🚨
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-2">
                    Our library system has encountered a serious issue.
                  </p>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    Don't panic! Our technical team has been notified and is working on a fix.
                  </p>
                </motion.div>

                {/* Error Details (Development Only) */}
                {process.env.NODE_ENV === 'development' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mb-8"
                  >
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-left">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Error Details (Development):
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                        {error.message}
                      </p>
                      {error.digest && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Error ID: {error.digest}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Fun Library-themed Messages */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mb-6 md:mb-8"
                >
                  <div className="bg-error-50 dark:bg-error-900/20 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                    <p className="text-xs sm:text-sm text-error-700 dark:text-error-300 italic">
                      "Even the most well-organized libraries can have a shelf collapse. We're rebuilding!"
                      <br />
                      <span className="text-xs">- The Librarian's Guide to Crisis Management</span>
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-center">System recovery in progress</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <BookOpenIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-center">Books are being safely relocated</span>
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
                    onClick={handleRetry}
                    variant="primary"
                    size="lg"
                    leftIcon={<ArrowPathIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={handleGoHome}
                    variant="secondary"
                    size="lg"
                    leftIcon={<HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    className="w-full sm:w-auto text-sm sm:text-base"
                  >
                    Go Home
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
                    Error Code: CRITICAL_SYSTEM_ERROR_500
                    <br />
                    <span className="text-error-600 dark:text-error-400">
                      🚨 "When the library needs emergency repairs, we call in the experts!"
                    </span>
                  </p>
                </motion.div>
              </CardBody>
            </Card>

            {/* Floating Emergency Icons - Hidden on mobile for better performance */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
              {[...Array(2)].map((_, i) => (
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
                    duration: 6 + Math.random() * 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: Math.random() * 2
                  }}
                  style={{
                    left: `${20 + Math.random() * 60}%`,
                    top: `${20 + Math.random() * 60}%`,
                  }}
                >
                  {i === 0 ? '🚨' : '📚'}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </body>
    </html>
  );
}
