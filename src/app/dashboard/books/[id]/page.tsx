'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  BuildingLibraryIcon
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
        setTitle(null);
        setLoading(false);
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
          libraryId={inventory?.libraryId || userLibraryId}
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
          existingLibraries={allInventories.map(inv => inv.libraryId)}
        />
      )}
    </div>
  );
}
