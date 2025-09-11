'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BuildingLibraryIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useLibrary } from '@/context/LibraryContext';
import { useI18n } from '@/context/I18nContext';
import { Library } from '@/types';

interface LibrarySelectorProps {
  className?: string;
  showLabel?: boolean;
  compact?: boolean;
}

export default function LibrarySelector({ 
  className = '', 
  showLabel = true,
  compact = false 
}: LibrarySelectorProps) {
  const { t } = useI18n();
  const { 
    selectedLibrary, 
    setSelectedLibrary, 
    libraries, 
    loading, 
    error 
  } = useLibrary();

  const handleLibraryChange = (library: Library) => {
    setSelectedLibrary(library);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('librarySelector.label', { default: 'Library' })}:
          </span>
        )}
        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('librarySelector.label', { default: 'Library' })}:
          </span>
        )}
        <Badge variant="error" className="text-xs">
          {t('librarySelector.error', { default: 'Error loading libraries' })}
        </Badge>
      </div>
    );
  }

  if (libraries.length === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('librarySelector.label', { default: 'Library' })}:
          </span>
        )}
        <Badge variant="warning" className="text-xs">
          {t('librarySelector.noLibraries', { default: 'No libraries available' })}
        </Badge>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('librarySelector.label', { default: 'Library' })}:
          </span>
        )}
        <div className="flex items-center space-x-1">
          <BuildingLibraryIcon className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedLibrary?.name || t('librarySelector.selectLibrary', { default: 'Select Library' })}
          </span>
          {selectedLibrary?.code && (
            <Badge variant="secondary" size="sm" className="text-xs">
              {selectedLibrary.code}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center space-x-2">
          <BuildingLibraryIcon className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('librarySelector.title', { default: 'Select Library' })}
          </h3>
        </div>
      )}
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('librarySelector.description', { 
          default: 'Choose a library to browse and request books from' 
        })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {libraries.map((library) => (
          <motion.div
            key={library._id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
              selectedLibrary?._id === library._id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleLibraryChange(library)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {library.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {library.code}
                </p>
                {library.location?.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {library.location.address}
                  </p>
                )}
              </div>
              
              {selectedLibrary?._id === library._id && (
                <div className="flex-shrink-0 ml-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full" />
                </div>
              )}
            </div>

            {selectedLibrary?._id === library._id && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 pt-2 border-t border-primary-200 dark:border-primary-800"
              >
                <Badge variant="success" size="sm" className="text-xs">
                  {t('librarySelector.selected', { default: 'Selected' })}
                </Badge>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {selectedLibrary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3"
        >
          <div className="flex items-center space-x-2">
            <BuildingLibraryIcon className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
              {t('librarySelector.currentSelection', { default: 'Currently browsing' })}
            </span>
          </div>
          <p className="text-sm text-primary-800 dark:text-primary-200 mt-1">
            {selectedLibrary.name} ({selectedLibrary.code})
          </p>
        </motion.div>
      )}
    </div>
  );
}
