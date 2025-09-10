'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Title, Library } from '@/types';
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
  libraryId?: string;
  totalCopies?: number;
  shelfLocation?: string;
  notes?: string;
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
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loadingLibraries, setLoadingLibraries] = useState(false);

  const fetchLibraries = useCallback(async () => {
    try {
      setLoadingLibraries(true);
      const response = await api.get('/libraries');
      const allLibraries = response.data.libraries || response.data.data || [];
      setLibraries(allLibraries);
    } catch (error) {
      console.error('Error fetching libraries:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoadingLibraries(false);
    }
  }, []);

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
    // New fields for library assignment (only required when creating and libraries are available)
    libraryId: z.string()
      .optional()
      .refine((val) => {
        // Only require library if we're creating and libraries are available
        return true; // We'll handle this validation in the submit handler
      }),
    totalCopies: z.number()
      .optional()
      .refine((val) => {
        // Only require totalCopies if we're creating and libraries are available
        return true; // We'll handle this validation in the submit handler
      }),
    shelfLocation: z.string()
      .optional()
      .refine((val) => !val || val.length <= 100, {
        message: t('bookModal.validation.shelfLocationMaxLength', { default: 'Shelf location cannot exceed 100 characters' })
      }),
    notes: z.string()
      .optional()
      .refine((val) => !val || val.length <= 500, {
        message: t('bookModal.validation.notesMaxLength', { default: 'Notes cannot exceed 500 characters' })
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
      libraryId: '',
      totalCopies: 1,
      shelfLocation: '',
      notes: '',
    }
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch libraries when modal opens
      fetchLibraries();
      
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
        // Clear library fields for edit mode (they're not part of the title)
        setValue('libraryId', '');
        setValue('totalCopies', 1);
        setValue('shelfLocation', '');
        setValue('notes', '');
      } else {
        reset();
      }
    }
  }, [isOpen, mode, book, setValue, reset, fetchLibraries]);

  const onSubmit = async (data: BookFormData) => {
    setLoading(true);
    try {
      // Validate library fields when creating and libraries are available
      if (mode === 'create' && libraries.length > 0) {
        if (!data.libraryId) {
          toast.error(t('bookModal.validation.libraryRequired', { default: 'Please select a library' }));
          setLoading(false);
          return;
        }
        if (!data.totalCopies || data.totalCopies < 1) {
          toast.error(t('bookModal.validation.totalCopiesMin', { default: 'Total copies must be at least 1' }));
          setLoading(false);
          return;
        }
      }

      // If creating but no libraries available, just create the title without inventory
      if (mode === 'create' && libraries.length === 0) {
        toast.warning(t('bookModal.noLibraries.warning', { 
          default: 'Book created but not assigned to any library. Please create a library first and then assign this book to it.' 
        }));
      }

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
        // Create the title first
        const titleResponse = await api.post('/titles', bookData);
        const createdTitle = titleResponse.data.title || titleResponse.data.data;
        
        // If library is selected, create an inventory record
        if (data.libraryId && data.totalCopies && libraries.length > 0) {
          const inventoryData = {
            libraryId: data.libraryId,
            titleId: createdTitle._id,
            totalCopies: data.totalCopies,
            availableCopies: data.totalCopies, // Initially all copies are available
            shelfLocation: data.shelfLocation || undefined,
            notes: data.notes || undefined,
          };
          
          await api.post('/inventories', inventoryData);
          console.log('Inventory created successfully');
        }
        
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
                    {/* Basic and Technical Information - Two Column Layout */}
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

                    {/* Library Assignment - Full Width Section (Only show when creating) */}
                    {mode === 'create' && (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {t('bookModal.sections.libraryAssignment', { default: 'Library Assignment' })}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Assign this book to a library and specify inventory details
                            </p>
                          </div>
                        </div>
                        
                        {libraries.length === 0 && !loadingLibraries ? (
                          <div className="p-6 bg-gradient-to-r from-warning-50 to-orange-50 dark:from-warning-900/20 dark:to-orange-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/50 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-warning-800 dark:text-warning-200 mb-2">
                                  {t('bookModal.noLibraries.title', { default: 'No Libraries Available' })}
                                </h4>
                                <p className="text-warning-700 dark:text-warning-300 mb-4">
                                  {t('bookModal.noLibraries.message', { 
                                    default: 'You need to create at least one library before adding books. Please go to the Libraries page to create a library first.' 
                                  })}
                                </p>
                                <div className="flex items-center space-x-2 text-sm text-warning-600 dark:text-warning-400">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>You can still create the book title and assign it to a library later.</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5">
                            {/* Library Selection */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                {t('bookModal.fields.library', { default: 'Library *' })}
                              </label>
                              <select
                                {...register('libraryId')}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                disabled={libraries.length === 0}
                              >
                                <option value="">
                                  {loadingLibraries 
                                    ? t('bookModal.placeholders.loadingLibraries', { default: 'Loading libraries...' })
                                    : t('bookModal.placeholders.selectLibrary', { default: 'Select a library' })
                                  }
                                </option>
                                {libraries.map((library) => (
                                  <option key={library._id} value={library._id}>
                                    {library.name} ({library.code})
                                  </option>
                                ))}
                              </select>
                              {errors.libraryId && (
                                <p className="mt-2 text-sm text-error-600 flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  {errors.libraryId.message}
                                </p>
                              )}
                            </div>
                            
                            {/* Inventory Details - Full width layout */}
                            {libraries.length > 0 && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <Input
                                      label={t('bookModal.fields.totalCopies', { default: 'Total Copies *' })}
                                      type="number"
                                      {...register('totalCopies', { valueAsNumber: true })}
                                      error={errors.totalCopies?.message}
                                      placeholder={t('bookModal.placeholders.totalCopies', { default: 'Enter number of copies' })}
                                      help={t('bookModal.help.totalCopies', { default: 'Number of physical copies to add to the library' })}
                                    />
                                  </div>
                                  
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <Input
                                      label={t('bookModal.fields.shelfLocation', { default: 'Shelf Location' })}
                                      {...register('shelfLocation')}
                                      error={errors.shelfLocation?.message}
                                      placeholder={t('bookModal.placeholders.shelfLocation', { default: 'Enter shelf location (optional)' })}
                                      help={t('bookModal.help.shelfLocation', { default: 'e.g., Aisle 2, Rack 4' })}
                                    />
                                  </div>
                                  
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                                    <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                      {t('bookModal.fields.notes', { default: 'Notes' })}
                                    </label>
                                    <textarea
                                      {...register('notes')}
                                      rows={3}
                                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
                                      placeholder={t('bookModal.placeholders.notes', { default: 'Enter any additional notes (optional)' })}
                                    />
                                    {errors.notes && (
                                      <p className="mt-2 text-sm text-error-600 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.notes.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

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
