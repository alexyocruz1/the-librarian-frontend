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

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
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
      const [titleResponse, inventoryResponse, copiesResponse] = await Promise.all([
        api.get(`/titles/${bookId}`),
        api.get(`/inventories/title/${bookId}`),
        api.get(`/copies/title/${bookId}`)
      ]);

      setTitle(titleResponse.data.data);
      setInventory(inventoryResponse.data.data);
      setCopies(copiesResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching book details:', error);
      toast.error('Failed to fetch book details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBarcode = (copy: Copy) => {
    // TODO: Implement barcode printing
    toast.success(`Printing barcode for copy ${copy.barcode}`);
  };

  const handleGenerateQR = (copy: Copy) => {
    // TODO: Implement QR code generation
    toast.success(`Generating QR code for copy ${copy.barcode}`);
  };

  const handleDeleteCopy = async (copyId: string) => {
    if (!confirm('Are you sure you want to delete this copy?')) return;

    try {
      await api.delete(`/copies/${copyId}`);
      toast.success('Copy deleted successfully');
      fetchBookDetails();
    } catch (error) {
      console.error('Error deleting copy:', error);
      toast.error('Failed to delete copy');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book not found</h2>
        <p className="text-gray-600 mb-4">The book you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.back()}>
          Go Back
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
          Back
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
            Edit Book
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Book Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Book Information" />
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Authors
                    </label>
                    <p className="text-gray-900">{title.authors.join(', ')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Publisher
                    </label>
                    <p className="text-gray-900">{title.publisher}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published Year
                    </label>
                    <p className="text-gray-900">{title.publishedYear}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <p className="text-gray-900">{title.language}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ISBN-13
                    </label>
                    <p className="text-gray-900 font-mono">{title.isbn13}</p>
                  </div>
                  
                  {title.isbn10 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ISBN-10
                      </label>
                      <p className="text-gray-900 font-mono">{title.isbn10}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categories
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
                    Description
                  </label>
                  <p className="text-gray-900 leading-relaxed">{title.description}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Inventory Summary */}
          {inventory && (
            <Card>
              <CardHeader title="Inventory Summary" />
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {inventory.totalCopies}
                    </div>
                    <div className="text-sm text-gray-600">Total Copies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {inventory.availableCopies}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {inventory.totalCopies - inventory.availableCopies}
                    </div>
                    <div className="text-sm text-gray-600">Borrowed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {inventory.availableCopies > 0 ? 'Yes' : 'No'}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
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
                    <div className="text-sm">No Cover Available</div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          {canManage && (
            <Card>
              <CardHeader title="Quick Actions" />
              <CardBody>
                <div className="space-y-3">
                  <Button
                    fullWidth
                    leftIcon={<PlusIcon className="w-5 h-5" />}
                    onClick={handleAddCopy}
                  >
                    Add Copy
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    leftIcon={<PrinterIcon className="w-5 h-5" />}
                    onClick={() => {/* TODO: Print all barcodes */}}
                  >
                    Print All Barcodes
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
          title="Individual Copies" 
          subtitle={`${copies.length} copies in total`}
        />
        <CardBody>
          {copies.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📖</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No copies available</h3>
              <p className="text-gray-600 mb-4">Add copies to make this book available for borrowing.</p>
              {canManage && (
                <Button
                  leftIcon={<PlusIcon className="w-5 h-5" />}
                  onClick={handleAddCopy}
                >
                  Add First Copy
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Barcode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shelf Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acquired
                    </th>
                    {canManage && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                              Print
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
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCopy(copy._id)}
                              leftIcon={<TrashIcon className="w-4 h-4" />}
                              className="text-error-600 hover:text-error-700"
                            >
                              Delete
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
