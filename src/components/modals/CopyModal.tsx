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
import toast from 'react-hot-toast';

const copySchema = z.object({
  status: z.enum(['available', 'borrowed', 'reserved', 'lost', 'maintenance']),
  condition: z.enum(['new', 'good', 'used', 'worn', 'damaged']),
  shelfLocation: z.string().optional(),
  acquiredAt: z.string().min(1, 'Acquisition date is required'),
});

type CopyFormData = z.infer<typeof copySchema>;

interface CopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  copy?: Copy | null;
  mode: 'create' | 'edit';
  titleId: string;
  libraryId: string;
}

const statusOptions: { value: CopyStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'borrowed', label: 'Borrowed' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'lost', label: 'Lost' },
  { value: 'maintenance', label: 'Maintenance' },
];

const conditionOptions: { value: CopyCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
  { value: 'worn', label: 'Worn' },
  { value: 'damaged', label: 'Damaged' },
];

export default function CopyModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  copy, 
  mode, 
  titleId, 
  libraryId 
}: CopyModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CopyFormData>({
    resolver: zodResolver(copySchema),
    defaultValues: {
      status: 'available',
      condition: 'new',
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
      const copyData = {
        ...data,
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
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader
                  title={mode === 'create' ? 'Add New Copy' : 'Edit Copy'}
                  subtitle={mode === 'create' ? 'Add a new physical copy of this book' : 'Update copy information'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status *
                        </label>
                        <select
                          {...register('status')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {statusOptions.map((option) => (
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Condition *
                        </label>
                        <select
                          {...register('condition')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          {conditionOptions.map((option) => (
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
                      label="Shelf Location"
                      {...register('shelfLocation')}
                      error={errors.shelfLocation?.message}
                      placeholder="Enter shelf location (optional)"
                      help="e.g., A1-B2, Fiction-001, etc."
                    />

                    <Input
                      label="Acquisition Date *"
                      type="date"
                      {...register('acquiredAt')}
                      error={errors.acquiredAt?.message}
                    />

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                      >
                        {mode === 'create' ? 'Add Copy' : 'Update Copy'}
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
