'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SearchInput, SearchSuggestion } from '@/components/ui/SearchInput';
import BookModal from '@/components/modals/BookModal';
import AdvancedSearchModal from '@/components/search/AdvancedSearchModal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSearch, SearchFilters } from '@/hooks/useSearch';
import { Title, Inventory, Copy } from '@/types';
import { getErrorMessage, getInfoMessage } from '@/lib/errorMessages';
import toast from 'react-hot-toast';
import AppLoader from '@/components/ui/AppLoader';
import { Skeleton } from '@/components/ui/Skeleton';
import { useI18n } from '@/context/I18nContext';

export default function BooksPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const [titles, setTitles] = useState<Title[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loadingTitles, setLoadingTitles] = useState(true);
  const [loadingInventories, setLoadingInventories] = useState(true);
  const loading = loadingTitles || loadingInventories;
  const [titlesError, setTitlesError] = useState<string | null>(null);
  const [inventoriesError, setInventoriesError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [editingBook, setEditingBook] = useState<Title | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const {
    suggestions,
    loading: searchLoading,
    search,
    getSuggestions,
    saveToHistory,
  } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
    maxSuggestions: 8,
  });

  useEffect(() => {
    fetchTitles();
    fetchInventories();
  }, []);

  const fetchTitles = async () => {
    try {
      setLoadingTitles(true);
      setTitlesError(null);
      const response = await api.get('/titles');
      console.log('Fetched titles response:', response.data);
      setTitles(response.data.titles || []);
    } catch (error) {
      console.error('Error fetching titles:', error);
      const msg = getErrorMessage(error);
      setTitlesError(msg);
    } finally {
      setLoadingTitles(false);
    }
  };

  const fetchInventories = async () => {
    try {
      setLoadingInventories(true);
      setInventoriesError(null);
      const response = await api.get('/inventories');
      console.log('Fetched inventories response:', response.data);
      setInventories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching inventories:', error);
      const msg = getErrorMessage(error);
      setInventoriesError(msg);
    } finally {
      setLoadingInventories(false);
    }
  };

  const filteredTitles = titles.filter(title => {
    const matchesSearch = title.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         title.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getInventoryForTitle = (titleId: string) => {
    return inventories.find(inv => inv.titleId === titleId);
  };

  const getTotalCopies = (titleId: string) => {
    const inventory = getInventoryForTitle(titleId);
    return inventory?.totalCopies || 0;
  };

  const getAvailableCopies = (titleId: string) => {
    const inventory = getInventoryForTitle(titleId);
    return inventory?.availableCopies || 0;
  };

  const handleAddBook = () => {
    setEditingBook(null);
    setShowBookModal(true);
  };

  const handleViewBookDetails = (book: Title) => {
    router.push(`/dashboard/books/${book._id}`);
  };

  const handleEditBook = (book: Title) => {
    setEditingBook(book);
    setShowBookModal(true);
  };

  const handleBookModalSuccess = () => {
    console.log('Book modal success - refreshing data...');
    fetchTitles();
    fetchInventories();
  };

  const handleBookModalClose = () => {
    setShowBookModal(false);
    setEditingBook(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      getSuggestions(value);
    }
  };

  const handleSearchSelect = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.title);
    saveToHistory(suggestion.title);
  };

  const handleAdvancedSearch = (filters: SearchFilters) => {
    // Implement advanced search logic
    console.log('Advanced search filters:', filters);
    toast.success(t('books.toast.advancedDone'));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-28 rounded mb-2" />
            <div className="skeleton h-4 w-72 rounded" />
          </div>
          <div className="skeleton h-10 w-28 rounded" />
        </div>
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="skeleton h-10 w-full rounded" />
            </div>
            <div className="skeleton h-10 w-28 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
              <div className="flex gap-2">
                <div className="skeleton h-6 w-16 rounded" />
                <div className="skeleton h-6 w-16 rounded" />
              </div>
              <div className="pt-3 border-t dark:border-gray-700">
                <div className="skeleton h-4 w-40 rounded mb-2" />
                <div className="flex gap-2">
                  <div className="skeleton h-8 w-full rounded" />
                  <div className="skeleton h-8 w-20 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('books.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('books.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
          {user?.role === 'admin' || user?.role === 'superadmin' ? (
            <Button
              leftIcon={<PlusIcon className="w-5 h-5" />}
              onClick={handleAddBook}
            >
              {t('books.add')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                onSelect={handleSearchSelect}
                suggestions={suggestions}
                loading={searchLoading}
                placeholder={t('books.search.placeholder')}
                showSuggestions={true}
                maxSuggestions={8}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(true)}
              leftIcon={<FunnelIcon className="w-5 h-5" />}
            >
              {t('common.advanced')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={handleAdvancedSearch}
      />

      {/* Errors */}
      {(titlesError || inventoriesError) && (
        <Card>
          <CardBody>
            <div className="space-y-2">
              {titlesError && (
                <p className="text-sm text-error-600">{titlesError}</p>
              )}
              {inventoriesError && (
                <p className="text-sm text-error-600">{inventoriesError}</p>
              )}
              <div className="pt-2">
                <Button variant="outline" onClick={() => { fetchTitles(); fetchInventories(); }}>
                  {t('common.retry')}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Books Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTitles.map((title) => {
            const inventory = getInventoryForTitle(title._id);
            const totalCopies = getTotalCopies(title._id);
            const availableCopies = getAvailableCopies(title._id);
            const availabilityRate = totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0;

            return (
              <motion.div
                key={title._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 group">
                  <CardBody className="p-0">
                    <div className="flex flex-col h-full">
                      {/* Book Cover */}
                      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 overflow-hidden">
                        {title.coverUrl ? (
                          <img
                            src={title.coverUrl}
                            alt={title.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <svg className="w-16 h-16 text-primary-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">No Cover</p>
                            </div>
                          </div>
                        )}
                        {/* Availability Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={availableCopies > 0 ? "success" : "error"}
                            size="sm"
                          >
                            {availableCopies > 0 ? `${availableCopies} Available` : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>

                      {/* Book Info */}
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {title.title}
                          </h3>
                          {title.subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                              {title.subtitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {t('books.by')} {title.authors.join(', ')}
                          </p>
                          
                          {/* Book Metadata */}
                          <div className="space-y-1 mb-3">
                            {title.publisher && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{t('books.publisher')}:</span> {title.publisher}
                              </p>
                            )}
                            {title.publishedYear && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{t('books.year')}:</span> {title.publishedYear}
                              </p>
                            )}
                            {title.isbn13 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">ISBN-13:</span> {title.isbn13}
                              </p>
                            )}
                          </div>

                          {/* Categories */}
                          {title.categories && title.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {title.categories.slice(0, 2).map((category) => (
                                <Badge key={category} variant="secondary" size="sm">
                                  {category}
                                </Badge>
                              ))}
                              {title.categories.length > 2 && (
                                <Badge variant="outline" size="sm">
                                  +{title.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Availability Stats */}
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-gray-600 dark:text-gray-400">
                              {t('books.totalCopies')}: <span className="font-medium">{totalCopies}</span>
                            </span>
                            <span className={`font-medium ${availableCopies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {t('books.availableCopies')}: {availableCopies}
                            </span>
                          </div>
                          
                          {/* Availability Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                availabilityRate >= 50 ? 'bg-green-500' : 
                                availabilityRate >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${availabilityRate}%` }}
                            />
                          </div>
                          
                          {/* Actions */}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleViewBookDetails(title)}
                            >
                              {t('books.viewDetails')}
                            </Button>
                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleEditBook(title)}
                              >
                                {t('common.edit')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {filteredTitles.map((title) => {
            const inventory = getInventoryForTitle(title._id);
            const totalCopies = getTotalCopies(title._id);
            const availableCopies = getAvailableCopies(title._id);
            const availabilityRate = totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0;

            return (
              <motion.div
                key={title._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardBody className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Book Cover Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg overflow-hidden">
                          {title.coverUrl ? (
                            <img
                              src={title.coverUrl}
                              alt={title.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {title.title}
                            </h3>
                            {title.subtitle && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {title.subtitle}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {t('books.by')} {title.authors.join(', ')}
                            </p>
                            
                            {/* Metadata Row */}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {title.publisher && (
                                <span><span className="font-medium">{t('books.publisher')}:</span> {title.publisher}</span>
                              )}
                              {title.publishedYear && (
                                <span><span className="font-medium">{t('books.year')}:</span> {title.publishedYear}</span>
                              )}
                              {title.isbn13 && (
                                <span><span className="font-medium">ISBN-13:</span> {title.isbn13}</span>
                              )}
                            </div>

                            {/* Categories */}
                            {title.categories && title.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {title.categories.slice(0, 3).map((category) => (
                                  <Badge key={category} variant="secondary" size="sm">
                                    {category}
                                  </Badge>
                                ))}
                                {title.categories.length > 3 && (
                                  <Badge variant="outline" size="sm">
                                    +{title.categories.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Availability & Actions */}
                          <div className="flex items-center space-x-4 ml-4">
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge 
                                  variant={availableCopies > 0 ? "success" : "error"}
                                  size="sm"
                                >
                                  {availableCopies}/{totalCopies}
                                </Badge>
                              </div>
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    availabilityRate >= 50 ? 'bg-green-500' : 
                                    availabilityRate >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${availabilityRate}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewBookDetails(title)}
                              >
                                {t('books.viewDetails')}
                              </Button>
                              {(user?.role === 'admin' || user?.role === 'superadmin') && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleEditBook(title)}
                                >
                                  {t('common.edit')}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {filteredTitles.length === 0 && !loading && !titlesError && !inventoriesError && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {searchTerm ? t('books.noResults.title') : t('books.empty.title')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm 
              ? t('books.noResults.descriptionWithTerm', { term: searchTerm }) 
              : t('books.empty.description')}
          </p>
          {(user?.role === 'admin' || user?.role === 'superadmin') && !searchTerm && (
            <div className="mt-4">
              <Button onClick={handleAddBook}>{t('books.empty.cta')}</Button>
            </div>
          )}
        </div>
      )}

      {/* Book Modal */}
      <BookModal
        isOpen={showBookModal}
        onClose={handleBookModalClose}
        onSuccess={handleBookModalSuccess}
        book={editingBook}
        mode={editingBook ? 'edit' : 'create'}
      />
    </div>
  );
}
