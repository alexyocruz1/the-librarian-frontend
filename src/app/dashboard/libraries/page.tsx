'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  BookOpenIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import LibraryModal from '@/components/modals/LibraryModal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Library } from '@/types';
import { getErrorMessage, getSuccessMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';

export default function LibrariesPage() {
  const { user } = useAuth();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      const response = await api.get('/libraries');
      setLibraries(response.data.data || []);
    } catch (error) {
      console.error('Error fetching libraries:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLibrary = async (libraryId: string) => {
    if (!confirm('Are you sure you want to delete this library? This action cannot be undone.')) return;

    try {
      await api.delete(`/libraries/${libraryId}`);
      toast.success(getSuccessMessage('library_deleted'));
      fetchLibraries();
    } catch (error: any) {
      console.error('Error deleting library:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleAddLibrary = () => {
    setEditingLibrary(null);
    setShowLibraryModal(true);
  };

  const handleEditLibrary = (library: Library) => {
    setEditingLibrary(library);
    setShowLibraryModal(true);
  };

  const handleLibraryModalSuccess = () => {
    fetchLibraries();
  };

  const handleLibraryModalClose = () => {
    setShowLibraryModal(false);
    setEditingLibrary(null);
  };

  const filteredLibraries = libraries.filter(library => {
    const matchesSearch = library.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         library.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (library.location && 
                          (library.location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           library.location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           library.location.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           library.location.country?.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesSearch;
  });

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Libraries</h1>
          <p className="text-gray-600 mt-1">Manage library locations and administrators</p>
        </div>
        {canManage && (
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={handleAddLibrary}
          >
            Add Library
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search libraries by name, code, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="w-5 h-5" />}
            >
              Filters
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Libraries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLibraries.map((library, index) => (
          <motion.div
            key={library._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader
                title={library.name}
                subtitle={`Code: ${library.code}`}
                action={
                  canManage && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditLibrary(library)}
                        leftIcon={<PencilIcon className="w-4 h-4" />}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLibrary(library._id)}
                        leftIcon={<TrashIcon className="w-4 h-4" />}
                        className="text-error-600 hover:text-error-700"
                      >
                        Delete
                      </Button>
                    </div>
                  )
                }
              />
              <CardBody>
                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">
                        {library.location ? (
                          <>
                            {library.location.address && <div>{library.location.address}</div>}
                            {library.location.city && library.location.state && (
                              <div>{library.location.city}, {library.location.state}</div>
                            )}
                            {library.location.country && <div>{library.location.country}</div>}
                          </>
                        ) : (
                          'No location specified'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Contact */}
                  {library.contact && (
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contact</p>
                        <p className="text-sm text-gray-600">
                          {library.contact?.email && <div>Email: {library.contact.email}</div>}
                          {library.contact?.phone && <div>Phone: {library.contact.phone}</div>}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <UsersIcon className="w-4 h-4 text-primary-600" />
                        <span className="text-lg font-semibold text-gray-900">0</span>
                      </div>
                      <p className="text-xs text-gray-500">Admins</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BookOpenIcon className="w-4 h-4 text-success-600" />
                        <span className="text-lg font-semibold text-gray-900">0</span>
                      </div>
                      <p className="text-xs text-gray-500">Books</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        fullWidth
                        variant="outline"
                        size="sm"
                        leftIcon={<UserPlusIcon className="w-4 h-4" />}
                        onClick={() => {/* TODO: Open assign admin modal */}}
                      >
                        Manage Admins
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredLibraries.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏛️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No libraries found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first library'}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Library Modal */}
      <LibraryModal
        isOpen={showLibraryModal}
        onClose={handleLibraryModalClose}
        onSuccess={handleLibraryModalSuccess}
        library={editingLibrary}
        mode={editingLibrary ? 'edit' : 'create'}
      />
    </div>
  );
}
