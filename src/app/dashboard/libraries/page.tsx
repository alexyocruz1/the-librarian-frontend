'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  UserPlusIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon
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
import AppLoader from '@/components/ui/AppLoader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/context/I18nContext';

export default function LibrariesPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [editingLibrary, setEditingLibrary] = useState<Library | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [libraryToDelete, setLibraryToDelete] = useState<Library | null>(null);

  useEffect(() => {
    fetchLibraries();
  }, []);

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      const response = await api.get('/libraries');
      console.log('Libraries response:', response);
      setLibraries(response.data.libraries || []);
    } catch (error) {
      console.error('Error fetching libraries:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLibrary = (library: Library) => {
    setLibraryToDelete(library);
    setShowDeleteModal(true);
  };

  const confirmDeleteLibrary = async () => {
    if (!libraryToDelete) return;

    try {
      await api.delete(`/libraries/${libraryToDelete._id}`);
      toast.success(getSuccessMessage('library_deleted'));
      fetchLibraries();
      setShowDeleteModal(false);
      setLibraryToDelete(null);
    } catch (error: any) {
      console.error('Error deleting library:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const cancelDeleteLibrary = () => {
    setShowDeleteModal(false);
    setLibraryToDelete(null);
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
    // Small delay to ensure backend has processed the creation
    setTimeout(() => {
      fetchLibraries();
    }, 100);
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

  // Debug logging
  console.log('Libraries state:', libraries);
  console.log('Search term:', searchTerm);
  console.log('Filtered libraries:', filteredLibraries);

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-40 rounded mb-2" />
            <div className="skeleton h-4 w-80 rounded" />
          </div>
          <div className="skeleton h-10 w-32 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 space-y-4">
              <div className="skeleton h-6 w-1/2 rounded" />
              <div className="skeleton h-4 w-1/3 rounded" />
              <div className="space-y-3">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="skeleton h-6 w-full rounded" />
                <div className="skeleton h-6 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('libraries.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{t('libraries.subtitle')}</p>
        </div>
        {canManage && (
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={handleAddLibrary}
          >
            {t('libraries.add')}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('libraries.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
              />
            </div>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <ListBulletIcon className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                leftIcon={<FunnelIcon className="w-5 h-5" />}
              >
                {t('libraries.filters')}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Libraries Display */}
      {viewMode === 'grid' ? (
        <div className={`grid gap-8 ${
          filteredLibraries.length === 1 
            ? 'grid-cols-1 max-w-4xl mx-auto' 
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
        {filteredLibraries.map((library, index) => (
          <motion.div
            key={library._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] group">
              {/* Header with Library Code Badge */}
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-primary-600 transition-colors mb-2">
                      {library.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {library.code}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(library.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditLibrary(library)}
                        className="h-8 w-8 p-0"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLibrary(library)}
                        className="h-8 w-8 p-0 text-error-600 hover:text-error-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardBody className="pt-2">
                <div className="space-y-6">
                  {/* Location - Enhanced Design */}
                  <div className="flex items-start gap-4 pt-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                      <MapPinIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('libraries.location')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {library.location ? (
                          <>
                            {library.location.address && <div className="mb-1">{library.location.address}</div>}
                            {library.location.city && library.location.state && (
                              <div className="mb-1">{library.location.city}, {library.location.state}</div>
                            )}
                            {library.location.country && <div>{library.location.country}</div>}
                          </>
                        ) : (
                          <span className="text-gray-400 italic">{t('libraries.location.none')}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Contact - Enhanced Design */}
                  {library.contact && (
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-success-100 dark:bg-success-900 rounded-xl flex items-center justify-center">
                        <PhoneIcon className="w-5 h-5 text-success-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {t('libraries.contact')}
                        </p>
                        <div className="space-y-2">
                          {library.contact?.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {library.contact.email}
                            </p>
                          )}
                          {library.contact?.phone && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {library.contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats - Enhanced Design */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <UsersIcon className="w-5 h-5 text-primary-600" />
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">0</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t('libraries.stats.admins')}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <BookOpenIcon className="w-5 h-5 text-success-600" />
                        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">0</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t('libraries.stats.books')}
                      </p>
                    </div>
                  </div>

                  {/* Actions - Improved Design */}
                  {canManage && (
                    <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        fullWidth
                        variant="outline"
                        size="sm"
                        leftIcon={<UserPlusIcon className="w-4 h-4" />}
                        onClick={() => {/* TODO: Open assign admin modal */}}
                        className="hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 transition-colors"
                      >
                        {t('libraries.manageAdmins')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </motion.div>
        ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredLibraries.map((library, index) => (
            <motion.div
              key={library._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-all duration-200 group">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Library Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                        <BuildingLibraryIcon className="w-6 h-6 text-primary-600" />
                      </div>
                      
                      {/* Library Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {library.name}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {library.code}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                          {/* Location */}
                          <div className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            <span className="truncate">
                              {library.location ? (
                                `${library.location.city || ''}${library.location.city && library.location.state ? ', ' : ''}${library.location.state || ''}`
                              ) : (
                                t('libraries.location.none')
                              )}
                            </span>
                          </div>
                          
                          {/* Contact */}
                          {library.contact?.email && (
                            <div className="flex items-center gap-1">
                              <PhoneIcon className="w-4 h-4" />
                              <span className="truncate">{library.contact.email}</span>
                            </div>
                          )}
                          
                          {/* Created Date */}
                          <div className="text-xs text-gray-500">
                            {new Date(library.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stats and Actions */}
                    <div className="flex items-center gap-6">
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="w-4 h-4 text-primary-600" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                          </div>
                          <p className="text-xs text-gray-500">{t('libraries.stats.admins')}</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <BookOpenIcon className="w-4 h-4 text-success-600" />
                            <span className="font-semibold text-gray-900 dark:text-gray-100">0</span>
                          </div>
                          <p className="text-xs text-gray-500">{t('libraries.stats.books')}</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      {canManage && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<UserPlusIcon className="w-4 h-4" />}
                            onClick={() => {/* TODO: Open assign admin modal */}}
                          >
                            {t('libraries.manageAdmins')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditLibrary(library)}
                            className="h-8 w-8 p-0"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLibrary(library)}
                            className="h-8 w-8 p-0 text-error-600 hover:text-error-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {filteredLibraries.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🏛️</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('libraries.empty.title')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm ? t('libraries.empty.hint.search') : t('libraries.empty.hint.start')}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && libraryToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={cancelDeleteLibrary} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-strong max-w-md w-full"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-error-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {t('libraries.delete.title', { default: 'Delete Library' })}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('libraries.delete.subtitle', { default: 'This action cannot be undone' })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {t('libraries.delete.message', { 
                      default: 'Are you sure you want to delete this library? All associated data will be permanently removed.' 
                    })}
                  </p>
                  
                  {/* Library Info */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                        <BuildingLibraryIcon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {libraryToDelete.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('libraries.code', { code: libraryToDelete.code })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={cancelDeleteLibrary}
                    className="px-4 py-2"
                  >
                    {t('common.cancel', { default: 'Cancel' })}
                  </Button>
                  <Button
                    variant="error"
                    onClick={confirmDeleteLibrary}
                    leftIcon={<TrashIcon className="w-4 h-4" />}
                    className="px-4 py-2"
                  >
                    {t('libraries.delete.confirm', { default: 'Delete Library' })}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        )}
      </AnimatePresence>
    </div>
  );
}
