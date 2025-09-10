'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/context/I18nContext';

export default function ImportExportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadTemplate, setDownloadTemplate] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

  // Show loading state during hydration to prevent mismatch
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv') {
        toast.error('Please select a CSV file');
        return;
      }
      setImportFile(file);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', importFile);

      const response = await api.post('/csv/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const results = response.data;
      
      if (results) {
        const totalTitlesCreated = results.titlesCreated || 0;
        const totalCopiesCreated = results.copiesCreated || 0;
        
        let message = `Import completed: ${totalCopiesCreated} copies created`;
        if (totalTitlesCreated > 0) {
          message += `, ${totalTitlesCreated} titles created`;
        }
        
        toast.success(message);
        
        // Show errors if any (as warnings, not errors)
        if (results.errors && results.errors.length > 0) {
          console.warn('Import warnings:', results.errors);
          // Show warnings as info instead of error to not override success message
          setTimeout(() => {
            toast(`${results.errors.length} warnings during import`, {
              icon: '⚠️',
              duration: 5000
            });
          }, 1000); // Delay the warning message
        }
      } else {
        toast.success(t('books.import.success', { count: 0 }));
      }
      
      setImportFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      
      // Check if it's a CSV validation error with details
      if (error.response?.data?.error?.includes('CSV validation failed') && error.response?.data?.details) {
        const details = error.response.data.details;
        setValidationErrors(details);
        setShowValidationModal(true);
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Use axios directly for blob responses to avoid API client wrapper
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/csv/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `library-catalog-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(getSuccessMessage('csv_exported'));
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadTemplate(true);
    try {
      // Use fetch directly for blob responses
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/csv/template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'copies-import-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(getSuccessMessage('template_downloaded'));
    } catch (error: any) {
      console.error('Error downloading template:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadTemplate(false);
    }
  };

  if (!canManage) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('common.accessDenied.title')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('common.accessDenied.description')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('books.importExport.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('books.importExport.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader
            title={t('books.import.title')}
            subtitle={t('books.import.subtitle')}
          />
          <CardBody>
            <div className="space-y-6">
              {/* Download Template */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">{t('books.import.template.title')}</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      {t('books.import.template.description')}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                      onClick={handleDownloadTemplate}
                      loading={downloadTemplate}
                    >
                      {t('books.import.template.download')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('books.import.selectFile')}
                </label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {importFile ? (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      {importFile.name}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('books.import.noFile')}
                  </div>
                )}
              </div>

              {/* Import Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">{t('books.import.process.title')}</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {t('books.import.process.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Import Button */}
              <Button
                fullWidth
                leftIcon={<ArrowUpTrayIcon className="w-5 h-5" />}
                onClick={handleImport}
                loading={importing}
                disabled={!importFile}
              >
                {t('books.import.action')}
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader
            title={t('books.export.title')}
            subtitle={t('books.export.subtitle')}
          />
          <CardBody>
            <div className="space-y-6">
              {/* Export Info */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">{t('books.export.format.title')}</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('books.export.format.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Features */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('books.export.includes.title')}</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    {t('books.export.includes.item.titles')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    {t('books.export.includes.item.authorsPublishers')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    {t('books.export.includes.item.isbnCategories')}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    {t('books.export.includes.item.inventoryCopies')}
                  </li>
                </ul>
              </div>

              {/* Export Button */}
              <Button
                fullWidth
                leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
                onClick={handleExport}
                loading={exporting}
              >
                {t('books.export.action')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader title={t('books.importExport.instructions.title')} />
        <CardBody>
          <div className="prose prose-sm max-w-none">
            <h3>{t('books.importExport.instructions.required.title')}</h3>
            <ul>
              <li>{t('books.importExport.instructions.required.isbn13')}</li>
              <li>{t('books.importExport.instructions.required.titleField')}</li>
              <li>{t('books.importExport.instructions.required.authors')}</li>
              <li>{t('books.importExport.instructions.required.publisher')}</li>
              <li>{t('books.importExport.instructions.required.publishedYear')}</li>
              <li>{t('books.importExport.instructions.required.language')}</li>
              <li>{t('books.importExport.instructions.required.categories')}</li>
              <li>{t('books.importExport.instructions.required.libraryCode')}</li>
              <li>{t('books.importExport.instructions.required.barcode')}</li>
              <li>{t('books.importExport.instructions.required.status')}</li>
              <li>{t('books.importExport.instructions.required.condition')}</li>
              <li>{t('books.importExport.instructions.required.totalCopies')}</li>
            </ul>
            
            <h3>{t('books.importExport.instructions.optional.title')}</h3>
            <ul>
              <li>{t('books.importExport.instructions.optional.isbn10')}</li>
              <li>{t('books.importExport.instructions.optional.subtitle')}</li>
              <li>{t('books.importExport.instructions.optional.description')}</li>
              <li>{t('books.importExport.instructions.optional.coverUrl')}</li>
              <li>{t('books.importExport.instructions.optional.shelfLocation')}</li>
              <li>{t('books.importExport.instructions.optional.acquiredAt')}</li>
              <li>{t('books.importExport.instructions.optional.inventoryNotes')}</li>
            </ul>

            <h3>{t('books.importExport.instructions.notes.title')}</h3>
            <ul>
              <li>{t('books.importExport.instructions.notes.validation')}</li>
              <li>{t('books.importExport.instructions.notes.isbnUnique')}</li>
              <li>{t('books.importExport.instructions.notes.separators')}</li>
              <li>{t('books.importExport.instructions.notes.year')}</li>
              <li>{t('books.importExport.instructions.notes.copies')}</li>
              <li>{t('books.importExport.instructions.notes.barcodeUnique')}</li>
              <li>{t('books.importExport.instructions.notes.libraryCode')}</li>
              <li>{t('books.importExport.instructions.notes.statusValues')}</li>
              <li>{t('books.importExport.instructions.notes.conditionValues')}</li>
            </ul>
          </div>
        </CardBody>
      </Card>

      {/* Validation Error Modal */}
      {showValidationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-strong max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                CSV Validation Errors
              </h3>
              <button
                onClick={() => setShowValidationModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Close validation errors"
                aria-label="Close validation errors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      CSV Import Failed
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Please fix the following errors in your CSV file and try again:
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {error}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button
                onClick={() => setShowValidationModal(false)}
                variant="primary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
