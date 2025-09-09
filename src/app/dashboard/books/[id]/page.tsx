'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  PlusIcon, 
  PrinterIcon,
  QrCodeIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import CopyModal from '@/components/modals/CopyModal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Title, Inventory, Copy } from '@/types';
import toast from 'react-hot-toast';
import AppLoader from '@/components/ui/AppLoader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/context/I18nContext';

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
  const [editingCopy, setEditingCopy] = useState<Copy | null>(null);

  const bookId = params.id as string;

  useEffect(() => {
    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      // Fetch title first to detect 404 without noisy toasts
      const titleResponse = await api.get(`/titles/${bookId}`);
      if (!titleResponse.success || !titleResponse.data?.title) {
        setTitle(null);
        setLoading(false);
        return;
      }
      setTitle(titleResponse.data.title || titleResponse.data.data);

      // Fetch related data, tolerate partial failures
      const results = await Promise.allSettled([
        api.get(`/inventories/title/${bookId}`),
        api.get(`/copies/title/${bookId}`)
      ]);

      const invRes = results[0];
      const copRes = results[1];

      if (invRes.status === 'fulfilled') {
        setInventory((invRes as any).value.data.data || null);
      } else {
        setInventory(null);
      }

      if (copRes.status === 'fulfilled') {
        setCopies((copRes as any).value.data.data || []);
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
  };

  const handlePrintBarcode = (copy: Copy) => {
    // TODO: Implement barcode printing
    toast.success(t('bookDetail.copies.printSuccess', { barcode: copy.barcode || 'N/A' }));
  };

  const handleGenerateQR = (copy: Copy) => {
    // TODO: Implement QR code generation
    toast.success(t('bookDetail.copies.qrSuccess', { barcode: copy.barcode || 'N/A' }));
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
            onClick={() => {/* TODO: Open edit modal */}}
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
          {inventory && (
            <Card>
              <CardHeader title={t('bookDetail.inventory.title')} />
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {inventory.totalCopies}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.totalCopies')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {inventory.availableCopies}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.available')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {inventory.totalCopies - inventory.availableCopies}
                    </div>
                    <div className="text-sm text-gray-600">{t('bookDetail.inventory.borrowed')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {inventory.availableCopies > 0 ? t('common.yes') : t('common.no')}
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
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                {title.coverUrl ? (
                  <img
                    src={title.coverUrl}
                    alt={title.title}
                    className="w-full h-full object-cover rounded-lg"
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
                    leftIcon={<PrinterIcon className="w-5 h-5" />}
                    onClick={() => {/* TODO: Print all barcodes */}}
                  >
                    {t('bookDetail.actions.printBarcodes')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

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
          libraryId={inventory?.libraryId || ''}
        />
      )}
    </div>
  );
}
