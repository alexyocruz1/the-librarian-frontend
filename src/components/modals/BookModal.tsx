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
import { Title } from '@/types';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

const bookSchema = z.object({
  isbn13: z.string().min(1, 'ISBN-13 is required'),
  isbn10: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  authors: z.string().min(1, 'At least one author is required'),
  categories: z.string().min(1, 'At least one category is required'),
  language: z.string().min(1, 'Language is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  publishedYear: z.number().min(1000).max(new Date().getFullYear() + 1),
  description: z.string().optional(),
  coverUrl: z.string().url().optional().or(z.literal('')),
});

type BookFormData = z.infer<typeof bookSchema>;

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book?: Title | null;
  mode: 'create' | 'edit';
}

export default function BookModal({ isOpen, onClose, onSuccess, book, mode }: BookModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      isbn13: '',
      isbn10: '',
      title: '',
      subtitle: '',
      authors: '',
      categories: '',
      language: 'English',
      publisher: '',
      publishedYear: new Date().getFullYear(),
      description: '',
      coverUrl: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && book) {
        setValue('isbn13', book.isbn13 || '');
        setValue('isbn10', book.isbn10 || '');
        setValue('title', book.title);
        setValue('subtitle', book.subtitle || '');
        setValue('authors', book.authors.join(', '));
        setValue('categories', book.categories?.join(', ') || '');
        setValue('language', book.language || '');
        setValue('publisher', book.publisher || '');
        setValue('publishedYear', book.publishedYear || 0);
        setValue('description', book.description || '');
        setValue('coverUrl', book.coverUrl || '');
      } else {
        reset();
      }
    }
  }, [isOpen, mode, book, setValue, reset]);

  const onSubmit = async (data: BookFormData) => {
    setLoading(true);
    try {
      const bookData = {
        ...data,
        authors: data.authors.split(',').map(author => author.trim()).filter(Boolean),
        categories: data.categories.split(',').map(category => category.trim()).filter(Boolean),
        coverUrl: data.coverUrl || undefined,
        isbn10: data.isbn10 || undefined,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
      };

      if (mode === 'create') {
        await api.post('/titles', bookData);
        toast.success(getSuccessMessage('book_created'));
      } else {
        await api.put(`/titles/${book?._id}`, bookData);
        toast.success(getSuccessMessage('book_updated'));
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving book:', error);
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
              className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader
                  title={mode === 'create' ? 'Add New Book' : 'Edit Book'}
                  subtitle={mode === 'create' ? 'Enter the book details below' : 'Update the book information'}
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
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Basic Information</h3>
                        
                        <Input
                          label="Title *"
                          {...register('title')}
                          error={errors.title?.message}
                          placeholder="Enter book title"
                        />
                        
                        <Input
                          label="Subtitle"
                          {...register('subtitle')}
                          error={errors.subtitle?.message}
                          placeholder="Enter book subtitle (optional)"
                        />
                        
                        <Input
                          label="Authors *"
                          {...register('authors')}
                          error={errors.authors?.message}
                          placeholder="Enter authors separated by commas"
                          help="Separate multiple authors with commas"
                        />
                        
                        <Input
                          label="Publisher *"
                          {...register('publisher')}
                          error={errors.publisher?.message}
                          placeholder="Enter publisher name"
                        />
                        
                        <Input
                          label="Published Year *"
                          type="number"
                          {...register('publishedYear', { valueAsNumber: true })}
                          error={errors.publishedYear?.message}
                          placeholder="Enter publication year"
                        />
                      </div>

                      {/* Technical Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Technical Information</h3>
                        
                        <Input
                          label="ISBN-13 *"
                          {...register('isbn13')}
                          error={errors.isbn13?.message}
                          placeholder="Enter 13-digit ISBN"
                        />
                        
                        <Input
                          label="ISBN-10"
                          {...register('isbn10')}
                          error={errors.isbn10?.message}
                          placeholder="Enter 10-digit ISBN (optional)"
                        />
                        
                        <Input
                          label="Language *"
                          {...register('language')}
                          error={errors.language?.message}
                          placeholder="Enter language"
                        />
                        
                        <Input
                          label="Categories *"
                          {...register('categories')}
                          error={errors.categories?.message}
                          placeholder="Enter categories separated by commas"
                          help="Separate multiple categories with commas"
                        />
                        
                        <Input
                          label="Cover Image URL"
                          {...register('coverUrl')}
                          error={errors.coverUrl?.message}
                          placeholder="Enter cover image URL (optional)"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder="Enter book description (optional)"
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
                      )}
                    </div>

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
                        {mode === 'create' ? 'Create Book' : 'Update Book'}
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
