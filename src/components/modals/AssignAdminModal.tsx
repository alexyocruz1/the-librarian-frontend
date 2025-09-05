'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { User } from '@/types';
import toast from 'react-hot-toast';

interface AssignAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  libraryId: string;
  libraryName: string;
}

export default function AssignAdminModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  libraryId, 
  libraryName 
}: AssignAdminModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableAdmins, setAvailableAdmins] = useState<User[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableAdmins();
    }
  }, [isOpen, libraryId]);

  const fetchAvailableAdmins = async () => {
    try {
      const response = await api.get('/users?role=admin');
      setAvailableAdmins(response.data.data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch available administrators');
    }
  };

  const handleAssignAdmins = async () => {
    if (selectedAdmins.length === 0) {
      toast.error('Please select at least one administrator');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedAdmins.map(adminId => 
          api.post(`/libraries/${libraryId}/admins/${adminId}`)
        )
      );
      
      toast.success(`Successfully assigned ${selectedAdmins.length} administrator${selectedAdmins.length > 1 ? 's' : ''}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error assigning admins:', error);
      toast.error('Failed to assign administrators');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSelect = (adminId: string) => {
    setSelectedAdmins(prev => 
      prev.includes(adminId) 
        ? prev.filter(id => id !== adminId)
        : [...prev, adminId]
    );
  };

  const filteredAdmins = availableAdmins.filter(admin =>
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader
                  title="Assign Administrators"
                  subtitle={`Assign administrators to ${libraryName}`}
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
                  <div className="space-y-6">
                    {/* Search */}
                    <Input
                      placeholder="Search administrators..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Selected Count */}
                    {selectedAdmins.length > 0 && (
                      <div className="p-3 bg-primary-50 rounded-lg">
                        <p className="text-sm text-primary-700">
                          {selectedAdmins.length} administrator{selectedAdmins.length > 1 ? 's' : ''} selected
                        </p>
                      </div>
                    )}

                    {/* Administrators List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredAdmins.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-4xl mb-2">👥</div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No administrators found</h3>
                          <p className="text-gray-600">
                            {searchTerm ? 'Try adjusting your search terms' : 'No administrators available to assign'}
                          </p>
                        </div>
                      ) : (
                        filteredAdmins.map((admin) => (
                          <div
                            key={admin._id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedAdmins.includes(admin._id)
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleAdminSelect(admin._id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary-700">
                                      {admin.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{admin.name}</h4>
                                  <p className="text-sm text-gray-500">{admin.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="warning" size="sm">
                                  {admin.role}
                                </Badge>
                                {selectedAdmins.includes(admin._id) && (
                                  <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
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
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssignAdmins}
                        loading={loading}
                        disabled={selectedAdmins.length === 0}
                        leftIcon={<UserPlusIcon className="w-4 h-4" />}
                      >
                        Assign {selectedAdmins.length > 0 ? `(${selectedAdmins.length})` : ''}
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
