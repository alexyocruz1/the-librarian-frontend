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

export default function ImportExportPage() {
  const { user } = useAuth();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadTemplate, setDownloadTemplate] = useState(false);

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

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
      formData.append('file', importFile);

      const response = await api.post('/csv/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(`Successfully imported ${response.data.data.imported} books`);
      setImportFile(null);
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/csv/export', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
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
      const response = await api.get('/csv/template', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'book-import-template.csv');
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">You don&apos;t have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Import & Export</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage bulk book operations with CSV files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Section */}
        <Card>
          <CardHeader
            title="Import Books"
            subtitle="Upload a CSV file to add multiple books at once"
          />
          <CardBody>
            <div className="space-y-6">
              {/* Download Template */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Need a template?</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Download our CSV template to ensure your file has the correct format.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                      onClick={handleDownloadTemplate}
                      loading={downloadTemplate}
                    >
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select CSV File
                </label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {importFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="success" size="sm">
                      {importFile.name}
                    </Badge>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Import Warning */}
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Import Process</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      All records will be validated before import. If any record fails validation, 
                      the entire import will be cancelled. Check the template format carefully.
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
                Import Books
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Export Section */}
        <Card>
          <CardHeader
            title="Export Catalog"
            subtitle="Download your library's book catalog as a CSV file"
          />
          <CardBody>
            <div className="space-y-6">
              {/* Export Info */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <DocumentTextIcon className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900 dark:text-green-100 mb-1">Export Format</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      The exported file will include all book information, inventory details, 
                      and copy information in a structured CSV format.
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Features */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">Export includes:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    Book titles and metadata
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    Author and publisher information
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    ISBN and categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    Inventory and copy details
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                    Barcode and shelf locations
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
                Export Catalog
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader title="CSV Format Instructions" />
        <CardBody>
          <div className="prose prose-sm max-w-none">
            <h3>Required Fields:</h3>
            <ul>
              <li><strong>isbn13</strong> - 13-digit ISBN (required)</li>
              <li><strong>title</strong> - Book title (required)</li>
              <li><strong>authors</strong> - Author names separated by semicolons (required)</li>
              <li><strong>publisher</strong> - Publisher name (required)</li>
              <li><strong>publishedYear</strong> - Publication year (required)</li>
              <li><strong>language</strong> - Book language (required)</li>
              <li><strong>categories</strong> - Categories separated by semicolons (required)</li>
            </ul>
            
            <h3>Optional Fields:</h3>
            <ul>
              <li><strong>isbn10</strong> - 10-digit ISBN</li>
              <li><strong>subtitle</strong> - Book subtitle</li>
              <li><strong>description</strong> - Book description</li>
              <li><strong>coverUrl</strong> - Cover image URL</li>
              <li><strong>totalCopies</strong> - Number of copies to create (default: 1)</li>
              <li><strong>shelfLocation</strong> - Default shelf location for copies</li>
            </ul>

            <h3>Important Notes:</h3>
            <ul>
              <li>All records must pass validation before any are imported</li>
              <li>ISBN-13 must be unique across your library</li>
              <li>Authors and categories should be separated by semicolons (;)</li>
              <li>Published year must be a valid 4-digit year</li>
              <li>If totalCopies is specified, that many copies will be created automatically</li>
            </ul>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
