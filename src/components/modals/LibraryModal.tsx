'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Library } from '@/types';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import { useI18n } from '@/context/I18nContext';
import toast from 'react-hot-toast';

const createLibrarySchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('libraryModal.validation.nameRequired')),
  code: z.string().min(1, t('libraryModal.validation.codeRequired')).max(10, t('libraryModal.validation.codeMaxLength')),
  location: z.string().min(1, t('libraryModal.validation.locationRequired')),
  contact: z.string().optional(),
});

type LibraryFormData = z.infer<ReturnType<typeof createLibrarySchema>>;

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  library?: Library | null;
  mode: 'create' | 'edit';
}

export default function LibraryModal({ isOpen, onClose, onSuccess, library, mode }: LibraryModalProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<LibraryFormData>({
    resolver: zodResolver(createLibrarySchema(t)),
    defaultValues: {
      name: '',
      code: '',
      location: '',
      contact: '',
    }
  });

  const codeValue = watch('code');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && library) {
        setValue('name', library.name);
        setValue('code', library.code);
        setValue('location', library.location ? 
          `${library.location.address || ''} ${library.location.city || ''} ${library.location.state || ''} ${library.location.country || ''}`.trim() : '');
        setValue('contact', library.contact ? 
          `${library.contact.email || ''} ${library.contact.phone || ''}`.trim() : '');
      } else {
        reset();
      }
    }
  }, [isOpen, mode, library, setValue, reset]);

  // Auto-format code to uppercase
  useEffect(() => {
    if (codeValue) {
      setValue('code', codeValue.toUpperCase());
    }
  }, [codeValue, setValue]);

  const onSubmit = async (data: LibraryFormData) => {
    setLoading(true);
    try {
      const libraryData = {
        ...data,
        code: data.code.toUpperCase(),
        contact: data.contact || undefined,
      };

      if (mode === 'create') {
        await api.post('/libraries', libraryData);
        toast.success(getSuccessMessage('library_created'));
      } else {
        await api.put(`/libraries/${library?._id}`, libraryData);
        toast.success(getSuccessMessage('library_updated'));
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving library:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

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
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader
                  title={mode === 'create' ? t('libraryModal.title.create') : t('libraryModal.title.edit')}
                  subtitle={mode === 'create' ? t('libraryModal.subtitle.create') : t('libraryModal.subtitle.edit')}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label={t('libraryModal.fields.name')}
                        {...register('name')}
                        error={errors.name?.message}
                        placeholder={t('libraryModal.placeholders.name')}
                      />
                      
                      <Input
                        label={t('libraryModal.fields.code')}
                        {...register('code')}
                        error={errors.code?.message}
                        placeholder={t('libraryModal.placeholders.code')}
                        help={t('libraryModal.help.code')}
                      />
                    </div>

                    <Input
                      label={t('libraryModal.fields.location')}
                      {...register('location')}
                      error={errors.location?.message}
                      placeholder={t('libraryModal.placeholders.location')}
                    />

                    <Input
                      label={t('libraryModal.fields.contact')}
                      {...register('contact')}
                      error={errors.contact?.message}
                      placeholder={t('libraryModal.placeholders.contact')}
                    />

                    {/* Code Preview */}
                    {codeValue && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">{t('libraryModal.preview.title')}</h4>
                        
                        {/* Barcode Preview */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 mb-3">
                          <div className="text-center">
                            {/* Simulated Barcode */}
                            <div className="inline-block bg-black dark:bg-white p-2 rounded">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                {Array.from({ length: 20 }, (_, i) => (
                                  <div
                                    key={i}
                                    className="bg-white dark:bg-black"
                                    style={{
                                      width: Math.random() > 0.5 ? '2px' : '1px',
                                      height: '20px'
                                    }}
                                  />
                                ))}
                              </div>
                              <div className="text-xs font-mono text-white dark:text-black">
                                {codeValue.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Example Usage */}
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>{t('libraryModal.preview.example')}:</strong>
                          </div>
                          <div className="text-xs font-mono bg-gray-100 dark:bg-gray-600 p-2 rounded">
                            {codeValue.toUpperCase()}-2025-0001
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('libraryModal.preview.format', { 
                              code: codeValue.toUpperCase(), 
                              year: '2025', 
                              sequence: '0001' 
                            })}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
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
                      >
                        {mode === 'create' ? t('libraryModal.actions.create') : t('libraryModal.actions.update')}
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
