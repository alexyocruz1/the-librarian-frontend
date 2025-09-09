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
import { useI18n } from '@/context/I18nContext';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

type BookFormData = {
  isbn13: string;
  isbn10?: string;
  title: string;
  subtitle?: string;
  authors: string;
  categories: string;
  language: string;
  publisher: string;
  publishedYear: number;
  description?: string;
  coverUrl?: string;
};

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book?: Title | null;
  mode: 'create' | 'edit';
}

export default function BookModal({ isOpen, onClose, onSuccess, book, mode }: BookModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const bookSchema = z.object({
    isbn13: z.string()
      .optional()
      .refine((val) => !val || /^\d{13}$/.test(val), {
        message: t('bookModal.validation.isbn13Format', { default: 'ISBN-13 must be exactly 13 digits' })
      }),
    isbn10: z.string()
      .optional()
      .refine((val) => !val || /^\d{10}$/.test(val), {
        message: t('bookModal.validation.isbn10Format', { default: 'ISBN-10 must be exactly 10 digits' })
      }),
    title: z.string()
      .min(1, t('bookModal.validation.titleRequired', { default: 'Title is required' }))
      .max(200, t('bookModal.validation.titleMaxLength', { default: 'Title cannot exceed 200 characters' })),
    subtitle: z.string()
      .optional()
      .refine((val) => !val || val.length <= 200, {
        message: t('bookModal.validation.subtitleMaxLength', { default: 'Subtitle cannot exceed 200 characters' })
      }),
    authors: z.string()
      .min(1, t('bookModal.validation.authorsRequired', { default: 'At least one author is required' }))
      .refine((val) => {
        const authors = val.split(',').map(a => a.trim()).filter(Boolean);
        return authors.length > 0 && authors.every(author => author.length <= 100);
      }, {
        message: t('bookModal.validation.authorsFormat', { default: 'Authors must be valid and each author cannot exceed 100 characters' })
      }),
    categories: z.string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        const categories = val.split(',').map(c => c.trim()).filter(Boolean);
        return categories.every(category => category.length <= 50);
      }, {
        message: t('bookModal.validation.categoriesFormat', { default: 'Each category cannot exceed 50 characters' })
      }),
    language: z.string()
      .optional()
      .refine((val) => !val || val.length <= 10, {
        message: t('bookModal.validation.languageMaxLength', { default: 'Language code cannot exceed 10 characters' })
      }),
    publisher: z.string()
      .optional()
      .refine((val) => !val || val.length <= 100, {
        message: t('bookModal.validation.publisherMaxLength', { default: 'Publisher name cannot exceed 100 characters' })
      }),
    publishedYear: z.number()
      .min(1000, t('bookModal.validation.publishedYearMin', { default: 'Published year must be a valid year' }))
      .max(new Date().getFullYear() + 1, t('bookModal.validation.publishedYearMax', { default: 'Published year cannot be in the future' }))
      .optional(),
    description: z.string()
      .optional()
      .refine((val) => !val || val.length <= 2000, {
        message: t('bookModal.validation.descriptionMaxLength', { default: 'Description cannot exceed 2000 characters' })
      }),
    coverUrl: z.string()
      .optional()
      .refine((val) => !val || val === '' || /^https?:\/\/.+/.test(val), {
        message: t('bookModal.validation.coverUrlFormat', { default: 'Cover URL must be a valid HTTP/HTTPS URL' })
      }),
  });

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
        categories: data.categories ? data.categories.split(',').map(category => category.trim()).filter(Boolean) : [],
        coverUrl: data.coverUrl || undefined,
        isbn10: data.isbn10 || undefined,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
      };

      if (mode === 'create') {
        await api.post('/titles', bookData);
        toast.success(getSuccessMessage('book_created'));
        console.log('Book created successfully, calling onSuccess...');
        // Small delay to ensure backend processing is complete
        setTimeout(() => {
          onSuccess();
        }, 100);
      } else {
        await api.put(`/titles/${book?._id}`, bookData);
        toast.success(getSuccessMessage('book_updated'));
        console.log('Book updated successfully, calling onSuccess...');
        onSuccess();
      }

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
                  title={mode === 'create' ? t('bookModal.title.create', { default: 'Add New Book' }) : t('bookModal.title.edit', { default: 'Edit Book' })}
                  subtitle={mode === 'create' ? t('bookModal.subtitle.create', { default: 'Enter the book details below' }) : t('bookModal.subtitle.edit', { default: 'Update the book information' })}
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
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {t('bookModal.sections.basicInfo', { default: 'Basic Information' })}
                        </h3>
                        
                        <Input
                          label={t('bookModal.fields.title', { default: 'Title *' })}
                          {...register('title')}
                          error={errors.title?.message}
                          placeholder={t('bookModal.placeholders.title', { default: 'Enter book title' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.subtitle', { default: 'Subtitle' })}
                          {...register('subtitle')}
                          error={errors.subtitle?.message}
                          placeholder={t('bookModal.placeholders.subtitle', { default: 'Enter book subtitle (optional)' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.authors', { default: 'Authors *' })}
                          {...register('authors')}
                          error={errors.authors?.message}
                          placeholder={t('bookModal.placeholders.authors', { default: 'Enter authors separated by commas' })}
                          help={t('bookModal.help.authors', { default: 'Separate multiple authors with commas' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.publisher', { default: 'Publisher' })}
                          {...register('publisher')}
                          error={errors.publisher?.message}
                          placeholder={t('bookModal.placeholders.publisher', { default: 'Enter publisher name (optional)' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.publishedYear', { default: 'Published Year' })}
                          type="number"
                          {...register('publishedYear', { valueAsNumber: true })}
                          error={errors.publishedYear?.message}
                          placeholder={t('bookModal.placeholders.publishedYear', { default: 'Enter publication year (optional)' })}
                        />
                      </div>

                      {/* Technical Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                          {t('bookModal.sections.technicalInfo', { default: 'Technical Information' })}
                        </h3>
                        
                        <Input
                          label={t('bookModal.fields.isbn13', { default: 'ISBN-13' })}
                          {...register('isbn13')}
                          error={errors.isbn13?.message}
                          placeholder={t('bookModal.placeholders.isbn13', { default: 'Enter 13-digit ISBN (optional)' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.isbn10', { default: 'ISBN-10' })}
                          {...register('isbn10')}
                          error={errors.isbn10?.message}
                          placeholder={t('bookModal.placeholders.isbn10', { default: 'Enter 10-digit ISBN (optional)' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.language', { default: 'Language' })}
                          {...register('language')}
                          error={errors.language?.message}
                          placeholder={t('bookModal.placeholders.language', { default: 'Enter language (optional)' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.categories', { default: 'Categories' })}
                          {...register('categories')}
                          error={errors.categories?.message}
                          placeholder={t('bookModal.placeholders.categories', { default: 'Enter categories separated by commas (optional)' })}
                          help={t('bookModal.help.categories', { default: 'Separate multiple categories with commas' })}
                        />
                        
                        <Input
                          label={t('bookModal.fields.coverUrl', { default: 'Cover Image URL' })}
                          {...register('coverUrl')}
                          error={errors.coverUrl?.message}
                          placeholder={t('bookModal.placeholders.coverUrl', { default: 'Enter cover image URL (optional)' })}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('bookModal.fields.description', { default: 'Description' })}
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                        placeholder={t('bookModal.placeholders.description', { default: 'Enter book description (optional)' })}
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
                        {t('common.cancel', { default: 'Cancel' })}
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                      >
                        {mode === 'create' ? t('bookModal.actions.create', { default: 'Create Book' }) : t('bookModal.actions.update', { default: 'Update Book' })}
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
