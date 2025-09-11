'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, BookOpenIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useI18n } from '@/context/I18nContext';
import { useLibrary } from '@/context/LibraryContext';
import { Title, Library } from '@/types';
import { getErrorMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

const createBorrowRequestSchema = (t: (key: string) => string) => z.object({
  notes: z.string().optional(),
});

type BorrowRequestFormData = z.infer<ReturnType<typeof createBorrowRequestSchema>>;

interface BorrowRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: Title;
  library?: Library;
}

export default function BorrowRequestModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title,
  library
}: BorrowRequestModalProps) {
  const { t } = useI18n();
  const { selectedLibrary } = useLibrary();
  const [loading, setLoading] = useState(false);
  const [availableCopies, setAvailableCopies] = useState(0);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BorrowRequestFormData>({
    resolver: zodResolver(createBorrowRequestSchema(t)),
    defaultValues: {
      notes: '',
    }
  });

  const currentLibrary = library || selectedLibrary;

  const checkAvailability = async () => {
    if (!currentLibrary || !title) return;

    try {
      setCheckingAvailability(true);
      const response = await api.get(`/inventories?libraryId=${currentLibrary._id}&titleId=${title._id}`);
      
      if (response.data.success) {
        const inventories = response.data.data?.inventories || response.data.inventories || [];
        const inventory = inventories.find((inv: any) => inv.titleId === title._id);
        setAvailableCopies(inventory?.availableCopies || 0);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailableCopies(0);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Check availability when modal opens
  useEffect(() => {
    if (isOpen && currentLibrary && title) {
      checkAvailability();
    }
  }, [isOpen, currentLibrary, title, checkAvailability]);

  const onSubmit = async (data: BorrowRequestFormData) => {
    if (!currentLibrary) {
      toast.error(t('borrowRequest.errors.noLibrarySelected', { default: 'Please select a library first' }));
      return;
    }

    if (availableCopies <= 0) {
      toast.error(t('borrowRequest.errors.noCopiesAvailable', { default: 'No copies available for this title' }));
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        libraryId: currentLibrary._id,
        titleId: title._id,
        notes: data.notes || undefined,
      };

      const response = await api.post('/borrow-requests', requestData);

      if (response.data.success) {
        toast.success(t('borrowRequest.success.created', { default: 'Borrow request submitted successfully' }));
        onSuccess();
        onClose();
        reset();
      } else {
        toast.error(response.data.error || t('borrowRequest.errors.createFailed', { default: 'Failed to create borrow request' }));
      }
    } catch (error) {
      console.error('Error creating borrow request:', error);
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="border-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <BookOpenIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('borrowRequest.title', { default: 'Request to Borrow' })}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('borrowRequest.subtitle', { default: 'Submit a request to borrow this book' })}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardBody className="space-y-6">
              {/* Book Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {title.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {title.authors.join(', ')}
                </p>
                {title.isbn13 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    ISBN: {title.isbn13}
                  </p>
                )}
              </div>

              {/* Library Information */}
              {currentLibrary && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <BuildingLibraryIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {t('borrowRequest.library', { default: 'Library' })}
                    </span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {currentLibrary.name} ({currentLibrary.code})
                  </p>
                </div>
              )}

              {/* Availability Status */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('borrowRequest.availability', { default: 'Available Copies' })}
                </span>
                <div className="flex items-center space-x-2">
                  {checkingAvailability ? (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                  ) : (
                    <Badge 
                      variant={availableCopies > 0 ? 'success' : 'error'}
                      className="text-sm"
                    >
                      {availableCopies} {t('borrowRequest.copies', { default: 'copies' })}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('borrowRequest.fields.notes', { default: 'Notes (Optional)' })}
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                    placeholder={t('borrowRequest.placeholders.notes', { default: 'Any additional notes for your request...' })}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('borrowRequest.help.notes', { default: 'Optional notes to help the librarian understand your request' })}
                  </p>
                  {errors.notes && (
                    <p className="mt-1 text-sm text-error-600">{errors.notes.message}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1"
                  >
                    {t('common.cancel', { default: 'Cancel' })}
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || availableCopies <= 0 || checkingAvailability}
                    loading={loading}
                    className="flex-1"
                  >
                    {t('borrowRequest.actions.submit', { default: 'Submit Request' })}
                  </Button>
                </div>
              </form>

              {/* Warning if no copies available */}
              {!checkingAvailability && availableCopies <= 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {t('borrowRequest.warnings.noCopies', { 
                      default: 'No copies are currently available for this book. You cannot submit a request at this time.' 
                    })}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
