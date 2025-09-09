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
import { Copy, CopyStatus, CopyCondition } from '@/types';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import { useI18n } from '@/context/I18nContext';
import toast from 'react-hot-toast';

const createCopySchema = (t: (key: string) => string) => z.object({
  status: z.enum(['available', 'borrowed', 'reserved', 'lost', 'maintenance']),
  condition: z.enum(['new', 'good', 'used', 'worn', 'damaged']),
  shelfLocation: z.string().optional(),
  acquiredAt: z.string().min(1, t('copyModal.validation.acquiredAtRequired')),
});

type CopyFormData = z.infer<ReturnType<typeof createCopySchema>>;

interface CopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  copy?: Copy | null;
  mode: 'create' | 'edit';
  titleId: string;
  libraryId: string;
  inventoryId?: string;
}

const getStatusOptions = (t: (key: string) => string): { value: CopyStatus; label: string }[] => [
  { value: 'available', label: t('copyModal.status.available') },
  { value: 'borrowed', label: t('copyModal.status.borrowed') },
  { value: 'reserved', label: t('copyModal.status.reserved') },
  { value: 'lost', label: t('copyModal.status.lost') },
  { value: 'maintenance', label: t('copyModal.status.maintenance') },
];

const getConditionOptions = (t: (key: string) => string): { value: CopyCondition; label: string }[] => [
  { value: 'new', label: t('copyModal.condition.new') },
  { value: 'good', label: t('copyModal.condition.good') },
  { value: 'used', label: t('copyModal.condition.used') },
  { value: 'worn', label: t('copyModal.condition.worn') },
  { value: 'damaged', label: t('copyModal.condition.damaged') },
];

export default function CopyModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  copy, 
  mode, 
  titleId, 
  libraryId,
  inventoryId
}: CopyModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CopyFormData>({
    resolver: zodResolver(createCopySchema(t)),
    defaultValues: {
      status: 'available',
      condition: 'good',
      shelfLocation: '',
      acquiredAt: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && copy) {
        setValue('status', copy.status);
        setValue('condition', copy.condition);
        setValue('shelfLocation', copy.shelfLocation || '');
        setValue('acquiredAt', copy.acquiredAt ? new Date(copy.acquiredAt).toISOString().split('T')[0] : '');
      } else {
        reset();
      }
    }
  }, [isOpen, mode, copy, setValue, reset]);

  const onSubmit = async (data: CopyFormData) => {
    setLoading(true);
    try {
      let currentInventoryId = inventoryId || copy?.inventoryId;

      // If we're creating a new copy and don't have an inventory, create one first
      if (mode === 'create' && !currentInventoryId) {
        const inventoryData = {
          libraryId,
          titleId,
          totalCopies: 1,
          availableCopies: 1,
          shelfLocation: data.shelfLocation || undefined,
        };
        
        const inventoryResponse = await api.post('/inventories', inventoryData);
        currentInventoryId = inventoryResponse.data.inventory._id;
      }

      const copyData = {
        ...data,
        inventoryId: currentInventoryId,
        titleId,
        libraryId,
        acquiredAt: new Date(data.acquiredAt),
        shelfLocation: data.shelfLocation || undefined,
      };

      if (mode === 'create') {
        await api.post('/copies', copyData);
        toast.success(getSuccessMessage('copy_created'));
      } else {
        await api.put(`/copies/${copy?._id}`, copyData);
        toast.success(getSuccessMessage('copy_updated'));
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving copy:', error);
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
                  title={mode === 'create' ? t('copyModal.title.create') : t('copyModal.title.edit')}
                  subtitle={mode === 'create' ? t('copyModal.subtitle.create') : t('copyModal.subtitle.edit')}
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('copyModal.fields.status')}
                        </label>
                        <select
                          {...register('status')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {getStatusOptions(t).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {errors.status && (
                          <p className="mt-1 text-sm text-error-600">{errors.status.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('copyModal.fields.condition')}
                        </label>
                        <select
                          {...register('condition')}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {getConditionOptions(t).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {errors.condition && (
                          <p className="mt-1 text-sm text-error-600">{errors.condition.message}</p>
                        )}
                      </div>
                    </div>

                    <Input
                      label={t('copyModal.fields.shelfLocation')}
                      {...register('shelfLocation')}
                      error={errors.shelfLocation?.message}
                      placeholder={t('copyModal.placeholders.shelfLocation')}
                      help={t('copyModal.help.shelfLocation')}
                    />

                    <Input
                      label={t('copyModal.fields.acquiredAt')}
                      type="date"
                      {...register('acquiredAt')}
                      error={errors.acquiredAt?.message}
                    />

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
                      >
                        {mode === 'create' ? t('copyModal.actions.create') : t('copyModal.actions.update')}
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
