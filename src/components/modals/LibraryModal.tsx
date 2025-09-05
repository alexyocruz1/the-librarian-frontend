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
import toast from 'react-hot-toast';

const librarySchema = z.object({
  name: z.string().min(1, 'Library name is required'),
  code: z.string().min(1, 'Library code is required').max(10, 'Code must be 10 characters or less'),
  location: z.string().min(1, 'Location is required'),
  contact: z.string().optional(),
});

type LibraryFormData = z.infer<typeof librarySchema>;

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  library?: Library | null;
  mode: 'create' | 'edit';
}

export default function LibraryModal({ isOpen, onClose, onSuccess, library, mode }: LibraryModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<LibraryFormData>({
    resolver: zodResolver(librarySchema),
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
        toast.success('Library created successfully');
      } else {
        await api.put(`/libraries/${library?._id}`, libraryData);
        toast.success('Library updated successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving library:', error);
      toast.error(error.response?.data?.message || 'Failed to save library');
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
                  title={mode === 'create' ? 'Add New Library' : 'Edit Library'}
                  subtitle={mode === 'create' ? 'Create a new library location' : 'Update library information'}
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
                        label="Library Name *"
                        {...register('name')}
                        error={errors.name?.message}
                        placeholder="Enter library name"
                      />
                      
                      <Input
                        label="Library Code *"
                        {...register('code')}
                        error={errors.code?.message}
                        placeholder="e.g., MAIN, BRANCH1"
                        help="Short code to identify this library (max 10 characters)"
                      />
                    </div>

                    <Input
                      label="Location *"
                      {...register('location')}
                      error={errors.location?.message}
                      placeholder="Enter library address or location"
                    />

                    <Input
                      label="Contact Information"
                      {...register('contact')}
                      error={errors.contact?.message}
                      placeholder="Phone number, email, or other contact details"
                    />

                    {/* Code Preview */}
                    {codeValue && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Library Code Preview</h4>
                        <div className="text-lg font-mono text-primary-600">
                          {codeValue.toUpperCase()}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          This code will be used for book barcodes and identification
                        </p>
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
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                      >
                        {mode === 'create' ? 'Create Library' : 'Update Library'}
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
