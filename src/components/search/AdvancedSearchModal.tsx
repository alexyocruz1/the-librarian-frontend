'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { useSearch, SearchFilters } from '@/hooks/useSearch';
import { api } from '@/lib/api';
import { Library } from '@/types';
import toast from 'react-hot-toast';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
}

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onSearch,
  initialFilters = {},
}: AdvancedSearchModalProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLibraries();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchLibraries = async () => {
    try {
      const response = await api.get('/libraries');
      if (response.data.success) {
        setLibraries(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching libraries:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/titles/categories');
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      onSearch(filters);
      onClose();
      toast.success('Search completed');
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFilters({});
  };

  const handleReset = () => {
    setFilters(initialFilters);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
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
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl"
            >
              <Card className="border-0 shadow-none">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center space-x-2">
                    <FunnelIcon className="w-6 h-6 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Advanced Search
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="p-2"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </Button>
                </CardHeader>

                <CardBody className="space-y-6">
                  {/* Basic Search */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Search Terms</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Title"
                        placeholder="Enter book title"
                        value={filters.query || ''}
                        onChange={(e) => handleFilterChange('query', e.target.value)}
                      />
                      
                      <Input
                        label="Author"
                        placeholder="Enter author name"
                        value={filters.author || ''}
                        onChange={(e) => handleFilterChange('author', e.target.value)}
                      />
                      
                      <Input
                        label="ISBN"
                        placeholder="Enter ISBN"
                        value={filters.isbn || ''}
                        onChange={(e) => handleFilterChange('isbn', e.target.value)}
                      />
                      
                      <Input
                        label="Publisher"
                        placeholder="Enter publisher"
                        value={filters.publisher || ''}
                        onChange={(e) => handleFilterChange('publisher', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Library
                        </label>
                        <select
                          value={filters.libraryId || ''}
                          onChange={(e) => handleFilterChange('libraryId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          aria-label="Select library"
                        >
                          <option value="">All Libraries</option>
                          {libraries.map((library) => (
                            <option key={library._id} value={library._id}>
                              {library.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={filters.category || ''}
                          onChange={(e) => handleFilterChange('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          aria-label="Select category"
                        >
                          <option value="">All Categories</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Published Year
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g., 2023"
                          value={filters.publishedYear || ''}
                          onChange={(e) => handleFilterChange('publishedYear', parseInt(e.target.value) || undefined)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language
                        </label>
                        <select
                          value={filters.language || ''}
                          onChange={(e) => handleFilterChange('language', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          aria-label="Select language"
                        >
                          <option value="">All Languages</option>
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="it">Italian</option>
                          <option value="pt">Portuguese</option>
                          <option value="ru">Russian</option>
                          <option value="zh">Chinese</option>
                          <option value="ja">Japanese</option>
                          <option value="ko">Korean</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.availability === true}
                          onChange={(e) => handleFilterChange('availability', e.target.checked ? true : undefined)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Only available books
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        onClick={handleClear}
                        disabled={loading}
                      >
                        Clear All
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={loading}
                      >
                        Reset
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSearch}
                        loading={loading}
                        leftIcon={<MagnifyingGlassIcon className="w-4 h-4" />}
                      >
                        Search
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
