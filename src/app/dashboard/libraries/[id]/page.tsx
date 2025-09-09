'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  BookOpenIcon,
  UserPlusIcon,
  TrashIcon,
  XMarkIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AssignAdminModal from '@/components/modals/AssignAdminModal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Library, User } from '@/types';
import toast from 'react-hot-toast';

export default function LibraryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [library, setLibrary] = useState<Library | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignAdminModal, setShowAssignAdminModal] = useState(false);

  const libraryId = params.id as string;

  const fetchLibraryDetails = useCallback(async () => {
    try {
      const [libraryResponse, adminsResponse] = await Promise.all([
        api.get(`/libraries/${libraryId}`),
        api.get(`/libraries/${libraryId}/admins`)
      ]);

      // Check if library exists
      if (!libraryResponse.data.success || !libraryResponse.data.data) {
        notFound();
        return;
      }

      setLibrary(libraryResponse.data.data);
      setAdmins(adminsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching library details:', error);
      // If it's a 404 error, show not found page
      if ((error as any)?.response?.status === 404) {
        notFound();
        return;
      }
      toast.error('Failed to fetch library details');
    } finally {
      setLoading(false);
    }
  }, [libraryId]);

  useEffect(() => {
    if (libraryId) {
      fetchLibraryDetails();
    }
  }, [libraryId, fetchLibraryDetails]);


  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this admin from the library?')) return;

    try {
      await api.delete(`/libraries/${libraryId}/admins/${userId}`);
      toast.success('Admin removed successfully');
      fetchLibraryDetails();
    } catch (error: any) {
      console.error('Error removing admin:', error);
      toast.error(error.response?.data?.message || 'Failed to remove admin');
    }
  };

  const handleAssignAdminSuccess = () => {
    fetchLibraryDetails();
  };

  const canManage = user?.role === 'admin' || user?.role === 'superadmin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!library) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Library not found</h2>
        <p className="text-gray-600 mb-4">The library you&apos;re looking for doesn&apos;t exist.</p>
        <Button onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">{library.name}</h1>
          <p className="text-gray-600 mt-1">Library Code: {library.code}</p>
        </div>
        {canManage && (
          <Button
            leftIcon={<PencilIcon className="w-5 h-5" />}
            onClick={() => {/* TODO: Open edit modal */}}
          >
            Edit Library
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Library Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Library Information" />
            <CardBody>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <MapPinIcon className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Location</h3>
                    <p className="text-gray-600">
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

                {library.contact && (
                  <div className="flex items-start gap-4">
                    <PhoneIcon className="w-6 h-6 text-gray-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Contact Information</h3>
                      <p className="text-gray-600">
                        {library.contact?.email && <div>Email: {library.contact.email}</div>}
                        {library.contact?.phone && <div>Phone: {library.contact.phone}</div>}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <BuildingLibraryIcon className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Library Code</h3>
                    <p className="text-gray-600 font-mono">{library.code}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader title="Library Statistics" />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">0</div>
                  <div className="text-sm text-gray-600">Total Books</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">0</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning-600">0</div>
                  <div className="text-sm text-gray-600">Borrowed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{admins.length}</div>
                  <div className="text-sm text-gray-600">Admins</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody>
              <div className="space-y-3">
                {canManage && (
                  <Button
                    fullWidth
                    leftIcon={<UserPlusIcon className="w-5 h-5" />}
                    onClick={() => setShowAssignAdminModal(true)}
                  >
                    Assign Admin
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="outline"
                  leftIcon={<BookOpenIcon className="w-5 h-5" />}
                  onClick={() => router.push(`/dashboard/books?library=${library._id}`)}
                >
                  View Books
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Library Code Display */}
          <Card>
            <CardHeader title="Library Code" />
            <CardBody>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {library.code}
                </div>
                <p className="text-sm text-gray-600">
                  Use this code when adding books to this library
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Administrators */}
      <Card>
        <CardHeader 
          title="Library Administrators" 
          subtitle={`${admins.length} administrator${admins.length !== 1 ? 's' : ''}`}
        />
        <CardBody>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No administrators</h3>
              <p className="text-gray-600 mb-4">This library doesn&apos;t have any assigned administrators yet.</p>
              {canManage && (
                <Button
                  leftIcon={<UserPlusIcon className="w-5 h-5" />}
                  onClick={() => setShowAssignAdminModal(true)}
                >
                  Assign First Admin
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map((admin, index) => (
                <motion.div
                  key={admin._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-700">
                            {admin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">{admin.name}</h4>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                        <Badge variant="warning" size="sm" className="mt-1">
                          {admin.role}
                        </Badge>
                      </div>
                    </div>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAdmin(admin._id)}
                        leftIcon={<XMarkIcon className="w-4 h-4" />}
                        className="text-error-600 hover:text-error-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Assign Admin Modal */}
      {library && (
        <AssignAdminModal
          isOpen={showAssignAdminModal}
          onClose={() => setShowAssignAdminModal(false)}
          onSuccess={handleAssignAdminSuccess}
          libraryId={library._id}
          libraryName={library.name}
        />
      )}
    </div>
  );
}
