'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { XMarkIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import { useI18n } from '@/context/I18nContext';
import toast from 'react-hot-toast';
import { Library } from '@/types';

const createAssignToLibrarySchema = (t: (key: string) => string) => z.object({
  libraryId: z.string().min(1, t('assignToLibrary.validation.libraryRequired')),
  totalCopies: z.number().min(1, t('assignToLibrary.validation.copiesRequired')),
  shelfLocation: z.string().optional(),
  notes: z.string().optional(),
});

type AssignToLibraryFormData = z.infer<ReturnType<typeof createAssignToLibrarySchema>>;

interface AssignToLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  titleId: string;
  titleName: string;
  existingLibraries?: string[]; // Library IDs where this book is already assigned
}

export default function AssignToLibraryModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  titleId,
  titleName,
  existingLibraries = []
}: AssignToLibraryModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<AssignToLibraryFormData>({
    resolver: zodResolver(createAssignToLibrarySchema(t)),
    defaultValues: {
      libraryId: '',
      totalCopies: 1,
      shelfLocation: '',
      notes: '',
    }
  });

  const selectedLibraryId = watch('libraryId');

  const fetchLibraries = useCallback(async () => {
    try {
      setLoadingLibraries(true);
      const response = await api.get('/libraries');
      const allLibraries = response.data.libraries || response.data.data || [];
      
      // Filter out libraries where this book is already assigned
      const availableLibraries = allLibraries.filter((lib: Library) => 
        !existingLibraries.includes(lib._id)
      );
      
      setLibraries(availableLibraries);
    } catch (error) {
      console.error('Error fetching libraries:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingLibraries(false);
    }
  }, [existingLibraries]);

  useEffect(() => {
    if (isOpen) {
      fetchLibraries();
      reset();
    }
  }, [isOpen, reset, fetchLibraries]);

  const onSubmit = async (data: AssignToLibraryFormData) => {
    setLoading(true);
    try {
      // Check if book is already assigned to this library
      if (existingLibraries.includes(data.libraryId)) {
        toast.error(t('assignToLibrary.errors.alreadyAssigned', { 
          default: 'This book is already assigned to the selected library' 
        }));
        setLoading(false);
        return;
      }

      // Create inventory with 0 copies initially
      const inventoryData = {
        libraryId: data.libraryId,
        titleId,
        totalCopies: 0, // Start with 0 - we'll create actual copies
        availableCopies: 0,
        shelfLocation: data.shelfLocation || undefined,
        notes: data.notes || undefined,
      };
      
      const inventoryResponse = await api.post('/inventories', inventoryData);
      const inventoryId = inventoryResponse.data.inventory._id;
      
      // Create the actual physical copies
      const copyPromises = [];
      for (let i = 0; i < data.totalCopies; i++) {
        const copyData = {
          inventoryId,
          libraryId: data.libraryId,
          titleId,
          status: 'available',
          condition: 'good',
          shelfLocation: data.shelfLocation || undefined,
        };
        copyPromises.push(api.post('/copies', copyData));
      }
      
      await Promise.all(copyPromises);
      
      // Update inventory with correct copy counts
      await api.patch(`/inventories/${inventoryId}/copy-counts`);
      
      toast.success(t('assignToLibrary.success.created', { 
        count: data.totalCopies,
        default: `Successfully assigned ${data.totalCopies} copies to library` 
      }));
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error assigning book to library:', error);
      if (error.response?.status === 409) {
        toast.error(t('assignToLibrary.errors.alreadyExists', { 
          default: 'This book is already assigned to the selected library' 
        }));
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedLibrary = libraries.find(lib => lib._id === selectedLibraryId);
  
  // Filter out libraries where this book is already assigned
  const availableLibraries = libraries.filter(lib => !existingLibraries.includes(lib._id));

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
              className="relative w-full max-w-md"
            >
              <Card className="shadow-strong">
                <CardHeader
                  title={t('assignToLibrary.title')}
                  subtitle={t('assignToLibrary.subtitle', { title: titleName })}
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
                    {/* Library Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('assignToLibrary.fields.library')} *
                      </label>
                      {loadingLibraries ? (
                        <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      ) : (
                        <select
                          {...register('libraryId')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                          <option value="">{t('assignToLibrary.placeholders.selectLibrary')}</option>
                          {availableLibraries.map((library) => (
                            <option key={library._id} value={library._id}>
                              {library.name} ({library.code})
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.libraryId && (
                        <p className="mt-1 text-sm text-error-600">{errors.libraryId.message}</p>
                      )}
                      {availableLibraries.length === 0 && !loadingLibraries && (
                        <p className="mt-1 text-sm text-warning-600">
                          {existingLibraries.length > 0 
                            ? t('assignToLibrary.allLibrariesAssigned', { default: 'This book is already assigned to all available libraries' })
                            : t('assignToLibrary.noAvailableLibraries', { default: 'No libraries available' })
                          }
                        </p>
                      )}
                    </div>

                    {/* Library Info */}
                    {selectedLibrary && (
                      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        <div className="flex items-start space-x-3">
                          <BuildingLibraryIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100">
                              {selectedLibrary.name}
                            </h4>
                            <p className="text-xs text-primary-700 dark:text-primary-300">
                              {t('assignToLibrary.libraryCode')}: {selectedLibrary.code}
                            </p>
                            {selectedLibrary.location && (
                              <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                {selectedLibrary.location.city && selectedLibrary.location.state 
                                  ? `${selectedLibrary.location.city}, ${selectedLibrary.location.state}`
                                  : selectedLibrary.location.address || ''
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Copies */}
                    <Input
                      label={t('assignToLibrary.fields.totalCopies')}
                      type="number"
                      min="1"
                      {...register('totalCopies', { valueAsNumber: true })}
                      error={errors.totalCopies?.message}
                      help={t('assignToLibrary.help.totalCopies')}
                    />

                    {/* Shelf Location */}
                    <Input
                      label={t('assignToLibrary.fields.shelfLocation')}
                      {...register('shelfLocation')}
                      error={errors.shelfLocation?.message}
                      placeholder={t('assignToLibrary.placeholders.shelfLocation')}
                      help={t('assignToLibrary.help.shelfLocation')}
                    />

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('assignToLibrary.fields.notes')}
                      </label>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                        placeholder={t('assignToLibrary.placeholders.notes')}
                      />
                      {errors.notes && (
                        <p className="mt-1 text-sm text-error-600">{errors.notes.message}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                        disabled={libraries.length === 0}
                      >
                        {t('assignToLibrary.actions.assign')}
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
