'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PlusIcon, 
  PrinterIcon,
  QrCodeIcon,
  EyeIcon,
  TrashIcon,
  BuildingLibraryIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import CopyModal from '@/components/modals/CopyModal';
import BookModal from '@/components/modals/BookModal';
import AssignToLibraryModal from '@/components/modals/AssignToLibraryModal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Title, Inventory, Copy } from '@/types';
import toast from 'react-hot-toast';
import AppLoader from '@/components/ui/AppLoader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/context/I18nContext';
import BarcodeDisplay from '@/components/ui/BarcodeDisplay';
import QRCodeDisplay from '@/components/ui/QRCodeDisplay';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [title, setTitle] = useState<Title | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAssignToLibraryModal, setShowAssignToLibraryModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<Copy | null>(null);
  const [editingCopy, setEditingCopy] = useState<Copy | null>(null);
  const [userLibraryId, setUserLibraryId] = useState<string>('');
  const [allInventories, setAllInventories] = useState<Inventory[]>([]);

  const bookId = params.id as string;

  const fetchFirstLibrary = async () => {
    try {
      const response = await api.get('/libraries');
      const libraries = response.data.libraries || response.data.data || [];
      if (libraries.length > 0) {
        setUserLibraryId(libraries[0]._id);
      }
    } catch (error) {
      console.error('Error fetching libraries:', error);
    }
  };

  const fetchBookDetails = useCallback(async () => {
    try {
      // Fetch title first to detect 404 without noisy toasts
      const titleResponse = await api.get(`/titles/${bookId}`);
      if (!titleResponse.success || !titleResponse.data?.title) {
        // If the book doesn't exist, show 404 page
        notFound();
        return;
      }
      setTitle(titleResponse.data.title || titleResponse.data.data);

      // Fetch related data, tolerate partial failures
      const results = await Promise.allSettled([
        api.get(`/inventories?titleId=${bookId}`),
        api.get(`/copies?titleId=${bookId}`)
      ]);

      const invRes = results[0];
      const copRes = results[1];

      if (invRes.status === 'fulfilled') {
        const invData = (invRes as any).value.data;
        const inventories = invData?.inventories || [];
        setAllInventories(inventories);
        // Get the first inventory for this title (there should only be one per library)
        setInventory(inventories[0] || null);
      } else {
        setAllInventories([]);
        setInventory(null);
      }

      if (copRes.status === 'fulfilled') {
        const copData = (copRes as any).value.data;
        setCopies(copData?.copies || []);
      } else {
        setCopies([]);
      }
    } catch (error: any) {
      // Suppress toast on 404 (not found); show toast for other errors
      const status = error?.response?.status;
      if (status !== 404) {
        console.error('Error fetching book details:', error);
        toast.error(t('bookDetail.errors.fetch'));
      }
      setTitle(null);
    } finally {
      setLoading(false);
    }
  }, [bookId, t]);

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId, fetchBookDetails]);

  useEffect(() => {
    // Determine user's library ID for copy creation
    if (user) {
      if (user.role === 'superadmin') {
        // Super admin can work with any library, get the first one
        fetchFirstLibrary();
      } else if (user.role === 'admin' && user.libraries && user.libraries.length > 0) {
        // Admin uses their assigned libraries
        setUserLibraryId(user.libraries[0]);
      } else {
        // Students and guests can work with any library, get the first one
        fetchFirstLibrary();
      }
    }
  }, [user]);

  const handlePrintBarcode = (copy: Copy) => {
    if (!copy.barcode) {
      toast.error(t('bookDetail.copies.noBarcode', { default: 'No barcode available for this copy' }));
      return;
    }

    setSelectedCopy(copy);
    setShowBarcodeModal(true);
  };

  const handlePrintBarcodeConfirm = (copy: Copy) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('bookDetail.copies.printBlocked', { default: 'Print blocked by browser. Please allow popups.' }));
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode - ${copy.barcode}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .barcode-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              max-width: 400px;
              background: white;
            }
            .barcode-label {
              font-size: 14px;
              margin: 5px 0;
              color: #666;
            }
            .barcode-display {
              margin: 15px 0;
            }
            .barcode-text {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
              font-family: 'Courier New', monospace;
            }
            .book-info {
              font-size: 12px;
              margin: 10px 0;
              color: #333;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .barcode-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="barcode-label">${t('bookDetail.copies.barcodeLabel', { default: 'Barcode' })}</div>
            <div class="barcode-display">
              <svg id="barcode"></svg>
            </div>
            <div class="barcode-text">${copy.barcode}</div>
            <div class="book-info">
              <div><strong>${title?.title || 'Unknown Book'}</strong></div>
              <div>${title?.authors?.join(', ') || 'Unknown Author'}</div>
              <div>Copy ID: ${copy._id}</div>
            </div>
          </div>
          <script>
            JsBarcode("#barcode", "${copy.barcode}", {
              format: "CODE128",
              width: 2,
              height: 100,
              displayValue: false,
              margin: 10
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);

    toast.success(t('bookDetail.copies.printSuccess', { barcode: copy.barcode || 'N/A' }));
  };

  const handleGenerateQR = (copy: Copy) => {
    if (!copy.barcode) {
      toast.error(t('bookDetail.copies.noBarcode', { default: 'No barcode available for this copy' }));
      return;
    }

    setSelectedCopy(copy);
    setShowQRModal(true);
  };

  const handleGenerateQRConfirm = (copy: Copy) => {
    // Create QR code data URL using a simple text-based QR code
    const qrData = `Book: ${title?.title || 'Unknown'}\nBarcode: ${copy.barcode}\nCopy ID: ${copy._id}`;
    
    // Create a new window for QR code display/printing
    const qrWindow = window.open('', '_blank');
    if (!qrWindow) {
      toast.error(t('bookDetail.copies.printBlocked', { default: 'Print blocked by browser. Please allow popups.' }));
      return;
    }

    const qrContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${copy.barcode}</title>
          <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              max-width: 400px;
              background: white;
            }
            .qr-label {
              font-size: 14px;
              margin: 5px 0;
              color: #666;
            }
            .qr-display {
              margin: 15px 0;
            }
            .qr-text {
              font-size: 12px;
              font-family: 'Courier New', monospace;
              white-space: pre-line;
              margin: 10px 0;
              padding: 10px;
              background: #f5f5f5;
              border: 1px solid #ddd;
            }
            .book-info {
              font-size: 12px;
              margin: 10px 0;
              color: #333;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-label">${t('bookDetail.copies.qrLabel', { default: 'QR Code' })}</div>
            <div class="qr-display">
              <canvas id="qrcode"></canvas>
            </div>
            <div class="qr-text">${qrData}</div>
            <div class="book-info">
              <div><strong>${title?.title || 'Unknown Book'}</strong></div>
              <div>${title?.authors?.join(', ') || 'Unknown Author'}</div>
              <div>Copy ID: ${copy._id}</div>
            </div>
          </div>
          <script>
            QRCode.toCanvas(document.getElementById('qrcode'), '${qrData}', {
              width: 200,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            }, function (error) {
              if (error) console.error(error);
            });
          </script>
        </body>
      </html>
    `;

    qrWindow.document.write(qrContent);
    qrWindow.document.close();
    qrWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      qrWindow.print();
      qrWindow.close();
    }, 1000);

    toast.success(t('bookDetail.copies.qrSuccess', { barcode: copy.barcode || 'N/A' }));
  };

  const handlePrintAllBarcodes = () => {
    if (copies.length === 0) {
      toast.error(t('bookDetail.copies.noCopies', { default: 'No copies available to print' }));
      return;
    }

    const copiesWithBarcodes = copies.filter(copy => copy.barcode);
    if (copiesWithBarcodes.length === 0) {
      toast.error(t('bookDetail.copies.noBarcodes', { default: 'No copies have barcodes to print' }));
      return;
    }

    // Create a new window for printing all barcodes
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('bookDetail.copies.printBlocked', { default: 'Print blocked by browser. Please allow popups.' }));
      return;
    }

    const barcodeItems = copiesWithBarcodes.map((copy, index) => `
      <div class="barcode-item">
        <div class="barcode-container">
          <div class="barcode-label">${t('bookDetail.copies.barcodeLabel', { default: 'Barcode' })}</div>
          <div class="barcode-display">
            <svg id="barcode-${index}"></svg>
          </div>
          <div class="barcode-text">${copy.barcode}</div>
          <div class="book-info">
            <div><strong>${title?.title || 'Unknown Book'}</strong></div>
            <div>${title?.authors?.join(', ') || 'Unknown Author'}</div>
            <div>Copy ID: ${copy._id}</div>
            <div>Status: ${copy.status}</div>
          </div>
        </div>
      </div>
    `).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>All Barcodes - ${title?.title || 'Unknown Book'}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              margin: 0;
            }
            .barcode-item {
              page-break-inside: avoid;
              margin-bottom: 20px;
            }
            .barcode-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              max-width: 400px;
              background: white;
            }
            .barcode-display {
              margin: 15px 0;
            }
            .barcode-text {
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
              font-family: 'Courier New', monospace;
            }
            .barcode-label {
              font-size: 14px;
              margin: 5px 0;
              color: #666;
            }
            .book-info {
              font-size: 12px;
              margin: 10px 0;
              color: #333;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .barcode-container { border: 1px solid #000; }
              .barcode-item { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center; margin-bottom: 30px;">
            ${t('bookDetail.copies.allBarcodes', { default: 'All Barcodes' })} - ${title?.title || 'Unknown Book'}
          </h1>
          ${barcodeItems}
          <script>
            ${copiesWithBarcodes.map((copy, index) => `
              JsBarcode("#barcode-${index}", "${copy.barcode}", {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: false,
                margin: 10
              });
            `).join('')}
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 1000);

    toast.success(t('bookDetail.copies.printAllSuccess', { 
      count: copiesWithBarcodes.length,
      default: `Successfully printed ${copiesWithBarcodes.length} barcodes` 
    }));
  };

  const handleDeleteCopy = async (copyId: string) => {
    if (!confirm(t('bookDetail.copies.deleteConfirm'))) return;

    try {
      await api.delete(`/copies/${copyId}`);
      toast.success(t('bookDetail.copies.deleteSuccess'));
      fetchBookDetails();
    } catch (error) {
      console.error('Error deleting copy:', error);
      toast.error(t('bookDetail.copies.deleteError'));
    }
  };

  const handleAddCopy = () => {
    setEditingCopy(null);
    setShowCopyModal(true);
  };

  const handleEditCopy = (copy: Copy) => {
    setEditingCopy(copy);
    setShowCopyModal(true);
  };

  const handleCopyModalSuccess = () => {
    fetchBookDetails();
  };

  const handleCopyModalClose = () => {
    setShowCopyModal(false);
    setEditingCopy(null);
  };

  const handleEditBook = () => {
    setShowBookModal(true);
  };

  const handleBookModalClose = () => {
    setShowBookModal(false);
  };

  const handleBookModalSuccess = () => {
    fetchBookDetails();
  };

  const handleAssignToLibrary = () => {
    setShowAssignToLibraryModal(true);
  };

  const handleAssignToLibraryModalClose = () => {
    setShowAssignToLibraryModal(false);
  };

  const handleAssignToLibraryModalSuccess = () => {
    fetchBookDetails();
  };

  // Helper functions to calculate totals across all libraries
  const getTotalCopiesAcrossLibraries = () => {
    return allInventories.reduce((total, inv) => total + (inv.totalCopies || 0), 0);
  };

  const getAvailableCopiesAcrossLibraries = () => {
    return allInventories.reduce((total, inv) => total + (inv.availableCopies || 0), 0);
  };

  const getBorrowedCopiesAcrossLibraries = () => {
    return getTotalCopiesAcrossLibraries() - getAvailableCopiesAcrossLibraries();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-10 w-24 rounded" />
          <div className="skeleton h-8 w-64 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {[1,2,3,4].map((i)=> (
                    <div key={i}>
                      <div className="skeleton h-4 w-32 rounded mb-2" />
                      <div className="skeleton h-5 w-48 rounded" />
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {[1,2,3,4].map((i)=> (
                    <div key={i}>
                      <div className="skeleton h-4 w-32 rounded mb-2" />
                      <div className="skeleton h-5 w-48 rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="skeleton h-4 w-40 rounded mb-3" />
                <div className="space-y-2">
                  {[...Array(4)].map((_,i)=>(<div key={i} className="skeleton h-4 w-full rounded" />))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-4 h-[360px] flex items-center justify-center">
              <div className="skeleton h-64 w-48 rounded" />
            </div>
            <div className="card p-6 space-y-3">
              <div className="skeleton h-5 w-32 rounded" />
              <div className="skeleton h-10 w-full rounded" />
              <div className="skeleton h-10 w-full rounded" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="skeleton h-32 w-full rounded" />
        </div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('bookDetail.notFound.title')}</h2>
        <p className="text-gray-600 mb-4">{t('bookDetail.notFound.description')}</p>
        <Button onClick={() => router.back()}>
          {t('bookDetail.notFound.back')}
        </Button>
      </div>
    );
  }

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeftIcon className="w-5 h-5" />}
        >
          {t('common.back')}
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{title.title}</h1>
          {title.subtitle && (
            <p className="text-gray-600 mt-1">{title.subtitle}</p>
          )}
        </div>
        {canManage && (
          <Button
            leftIcon={<PencilIcon className="w-5 h-5" />}
            onClick={handleEditBook}
          >
            {t('bookDetail.actions.editBook')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title={t('bookDetail.information.title')} />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bookDetail.information.authors')}
                    </label>
                    <p className="text-gray-900">{title.authors.join(', ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bookDetail.information.publisher')}
                    </label>
                    <p className="text-gray-900">{title.publisher}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bookDetail.information.publishedYear')}
                    </label>
                    <p className="text-gray-900">{title.publishedYear}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bookDetail.information.language')}
                    </label>
                    <p className="text-gray-900">{title.language}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bookDetail.information.isbn13')}
                    </label>
                    <p className="text-gray-900 font-mono">{title.isbn13}</p>
                  </div>
                  
                  {title.isbn10 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('bookDetail.information.isbn10')}
                      </label>
                      <p className="text-gray-900 font-mono">{title.isbn10}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('bookDetail.information.categories')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {title.categories?.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {title.description && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('bookDetail.information.description')}
                  </label>
                  <p className="text-gray-900 leading-relaxed">{title.description}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Inventory Summary */}
          {allInventories.length > 0 && (
            <Card>
              <CardHeader title={t('bookDetail.inventory.title')} />
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {getTotalCopiesAcrossLibraries()}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.totalCopies')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {getAvailableCopiesAcrossLibraries()}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.available')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {getBorrowedCopiesAcrossLibraries()}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.borrowed')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {getAvailableCopiesAcrossLibraries() > 0 ? t('common.yes') : t('common.no')}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.available')}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Book Cover */}
        <div className="space-y-6">
          <Card>
            <CardBody className="p-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center relative">
                {title.coverUrl ? (
                  <Image
                    src={title.coverUrl}
                    alt={title.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <div className="text-6xl mb-2">📚</div>
                    <div className="text-sm">{t('bookDetail.cover.notAvailable')}</div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          {canManage && (
            <Card>
              <CardHeader title={t('bookDetail.actions.title')} />
              <CardBody>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={handleAddCopy}
                  >
                    {t('bookDetail.actions.addCopy')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<BuildingLibraryIcon className="w-5 h-5" />}
                    onClick={handleAssignToLibrary}
                  >
                    {t('bookDetail.actions.assignToLibrary')}
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<PrinterIcon className="w-5 h-5" />}
                    onClick={handlePrintAllBarcodes}
                  >
                    {t('bookDetail.actions.printBarcodes')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Library Assignments */}
      <Card>
        <CardHeader 
          title={t('bookDetail.libraryAssignments.title')}
          subtitle={allInventories.length > 0 ? `${allInventories.length} library assignment${allInventories.length > 1 ? 's' : ''}` : ''}
        />
        <CardBody>
          {allInventories.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">🏛️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('bookDetail.libraryAssignments.none')}</h3>
              {canManage && (
                <Button
                  leftIcon={<BuildingLibraryIcon className="w-5 h-5" />}
                  onClick={handleAssignToLibrary}
                >
                  {t('bookDetail.actions.assignToLibrary')}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allInventories.map((inventory) => (
                <div key={inventory._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {(inventory.libraryId as any)?.name || 'Unknown Library'}
                    </h4>
                    <Badge variant="secondary">
                      {(inventory.libraryId as any)?.code || 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>{t('bookDetail.libraryAssignments.totalCopies')}:</span>
                      <span className="font-medium">{inventory.totalCopies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('bookDetail.libraryAssignments.availableCopies')}:</span>
                      <span className="font-medium text-success-600">{inventory.availableCopies}</span>
                    </div>
                    {inventory.shelfLocation && (
                      <div className="flex justify-between">
                        <span>{t('bookDetail.libraryAssignments.shelfLocation')}:</span>
                        <span className="font-medium">{inventory.shelfLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Copies List */}
      <Card>
        <CardHeader 
          title={t('bookDetail.copies.title')} 
          subtitle={t('bookDetail.copies.subtitle', { count: copies.length })}
        />
        <CardBody>
          {copies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('bookDetail.copies.empty.title')}</h3>
              <p className="text-gray-600 mb-4">{t('bookDetail.copies.empty.description')}</p>
              {canManage && (
                <Button
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  onClick={handleAddCopy}
                >
                  {t('bookDetail.copies.empty.addFirst')}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookDetail.copies.table.barcode')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookDetail.copies.table.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookDetail.copies.table.condition')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookDetail.copies.table.shelfLocation')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('bookDetail.copies.table.acquired')}
                    </th>
                    {canManage && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('bookDetail.copies.table.actions')}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {copies.map((copy) => (
                    <tr key={copy._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {copy.barcode}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={copy.status === 'available' ? 'success' : 'warning'}>
                          {copy.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">
                          {copy.condition}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {copy.shelfLocation || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {copy.acquiredAt ? new Date(copy.acquiredAt).toLocaleDateString() : 'Not specified'}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handlePrintBarcode(copy)}
                              leftIcon={<PrinterIcon className="w-4 h-4" />}
                            >
                              {t('bookDetail.copies.actions.print')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleGenerateQR(copy)}
                              leftIcon={<QrCodeIcon className="w-4 h-4" />}
                            >
                              QR
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCopy(copy)}
                              leftIcon={<EyeIcon className="w-4 h-4" />}
                            >
                              {t('bookDetail.copies.actions.edit')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCopy(copy._id)}
                              leftIcon={<TrashIcon className="w-4 h-4" />}
                              className="text-error-600 hover:text-error-700"
                            >
                              {t('bookDetail.copies.actions.delete')}
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Copy Modal */}
      {title && (
        <CopyModal
          isOpen={showCopyModal}
          onClose={handleCopyModalClose}
          onSuccess={handleCopyModalSuccess}
          copy={editingCopy}
          mode={editingCopy ? 'edit' : 'create'}
          titleId={title._id}
          libraryId={typeof inventory?.libraryId === 'string' ? inventory.libraryId : (inventory?.libraryId as any)?._id || userLibraryId}
          inventoryId={inventory?._id}
        />
      )}

      {/* Book Modal */}
      {title && (
        <BookModal
          isOpen={showBookModal}
          onClose={handleBookModalClose}
          onSuccess={handleBookModalSuccess}
          book={title}
          mode="edit"
        />
      )}

      {/* Assign to Library Modal */}
      {title && (
        <AssignToLibraryModal
          isOpen={showAssignToLibraryModal}
          onClose={handleAssignToLibraryModalClose}
          onSuccess={handleAssignToLibraryModalSuccess}
          titleId={title._id}
          titleName={title.title}
          existingLibraries={allInventories.map(inv => typeof inv.libraryId === 'string' ? inv.libraryId : (inv.libraryId as any)?._id)}
        />
      )}

      {/* Barcode Preview Modal */}
      {showBarcodeModal && selectedCopy && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{t('bookDetail.copies.barcodeLabel', { default: 'Barcode' })}</h3>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title={t('common.close', { default: 'Close' })}
                aria-label={t('common.close', { default: 'Close' })}
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body text-center">
              <div className="mb-4">
                <BarcodeDisplay
                  value={selectedCopy.barcode || ''}
                  format="CODE128"
                  width={2}
                  height={100}
                  displayValue={true}
                  margin={10}
                />
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <div><strong>{title?.title}</strong></div>
                <div>{title?.authors?.join(', ')}</div>
                <div>Copy ID: {selectedCopy._id}</div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    setShowBarcodeModal(false);
                    handlePrintBarcodeConfirm(selectedCopy);
                  }}
                  leftIcon={<PrinterIcon className="w-4 h-4" />}
                >
                  {t('bookDetail.copies.actions.print', { default: 'Print' })}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowBarcodeModal(false)}
                >
                  {t('common.cancel', { default: 'Cancel' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Preview Modal */}
      {showQRModal && selectedCopy && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">{t('bookDetail.copies.qrLabel', { default: 'QR Code' })}</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-gray-400 hover:text-gray-600"
                title={t('common.close', { default: 'Close' })}
                aria-label={t('common.close', { default: 'Close' })}
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body text-center">
              <div className="mb-4">
                <QRCodeDisplay
                  value={`Book: ${title?.title || 'Unknown'}\nBarcode: ${selectedCopy.barcode}\nCopy ID: ${selectedCopy._id}`}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <div className="text-sm text-gray-600 mb-4">
                <div><strong>{title?.title}</strong></div>
                <div>{title?.authors?.join(', ')}</div>
                <div>Copy ID: {selectedCopy._id}</div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    setShowQRModal(false);
                    handleGenerateQRConfirm(selectedCopy);
                  }}
                  leftIcon={<PrinterIcon className="w-4 h-4" />}
                >
                  {t('bookDetail.copies.actions.print', { default: 'Print' })}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowQRModal(false)}
                >
                  {t('common.cancel', { default: 'Cancel' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
