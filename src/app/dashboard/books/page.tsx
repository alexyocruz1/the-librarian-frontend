'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      console.log('Fetching inventories...');
      const response = await api.get('/inventories');
      console.log('Fetched inventories response:', response.data);
      // The API response structure is {inventories: Array(1)}, not {data: {inventories: Array(1)}}
      const inventoriesData = response.data.inventories || [];
      console.log('Setting inventories to:', inventoriesData);
      setInventories(inventoriesData);
    } catch (error: any) {
      console.error('Error fetching inventories:', error);
      console.error('Error details:', error.response?.data);
      const msg = getErrorMessage(error);
      setInventoriesError(msg);
      // Set empty array on error to prevent undefined issues
      setInventories([]);
    } finally {
      setLoadingInventories(false);
    }
  };

  const filteredTitles = titles.filter(title => {
    const matchesSearch = title.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         title.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getInventoriesForTitle = (titleId: string) => {
    const titleInventories = inventories.filter(inv => {
      // Handle both string and populated object cases
      const invTitleId = typeof inv.titleId === 'string' ? inv.titleId : (inv.titleId as any)?._id;
      return invTitleId === titleId;
    });
    console.log(`Looking for inventories for titleId: ${titleId}`);
    console.log('Available inventories:', inventories);
    console.log('Found inventories:', titleInventories);
    return titleInventories;
  };

  const getTotalCopies = (titleId: string) => {
    const titleInventories = getInventoriesForTitle(titleId);
    return titleInventories.reduce((total, inv) => total + (inv.totalCopies || 0), 0);
  };

  const getAvailableCopies = (titleId: string) => {
    const titleInventories = getInventoriesForTitle(titleId);
    return titleInventories.reduce((total, inv) => total + (inv.availableCopies || 0), 0);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredTitles.map((title) => {
            const totalCopies = getTotalCopies(title._id);
            const availableCopies = getAvailableCopies(title._id);
            const availabilityRate = totalCopies > 0 ? (availableCopies / totalCopies) * 100 : 0;
            console.log(`Title: ${title.title}, Total: ${totalCopies}, Available: ${availableCopies}, Rate: ${availabilityRate}%`);

            return (
              <motion.div
                key={title._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-200 group overflow-hidden">
                  <CardBody className="p-0">
                    <div className="flex flex-col h-full">
                      {/* Book Cover */}
                      <div className="relative h-48 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 overflow-hidden">
                        {title.coverUrl ? (
                          <Image
                            src={title.coverUrl}
                            alt={title.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="text-6xl mb-2">📚</div>
                              <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">No Cover</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Availability Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={availableCopies > 0 ? "success" : "error"}
                            size="sm"
                            className="shadow-md"
                          >
                            {availableCopies > 0 ? `${availableCopies}/${totalCopies}` : '0/' + totalCopies}
                          </Badge>
                        </div>
                      </div>

                      {/* Book Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        {/* Title and Author */}
                        <div className="mb-3">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {title.title}
                          </h3>
                          {title.subtitle && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                              {title.subtitle}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {t('books.by')} {title.authors.join(', ')}
                          </p>
                        </div>
                        
                        {/* Key Info Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          {title.publishedYear && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <div className="text-gray-500 dark:text-gray-400 font-medium">{t('books.year')}</div>
                              <div className="text-gray-900 dark:text-gray-100 font-bold">{title.publishedYear}</div>
                            </div>
                          )}
                          {title.publisher && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                              <div className="text-gray-500 dark:text-gray-400 font-medium">{t('books.publisher')}</div>
                              <div className="text-gray-900 dark:text-gray-100 font-bold truncate" title={title.publisher}>
                                {title.publisher}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Categories */}
                        {title.categories && title.categories.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {title.categories.slice(0, 2).map((category) => (
                                <Badge key={category} variant="secondary" size="sm" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                              {title.categories.length > 2 && (
                                <Badge variant="secondary" size="sm" className="text-xs">
                                  +{title.categories.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Availability Status */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">
                              {t('books.availability')}
                            </span>
                            <span className={`font-bold ${availableCopies > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {availableCopies} {t('books.of')} {totalCopies}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                availabilityRate >= 50 ? 'bg-green-500' : 
                                availabilityRate >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${availabilityRate}%` }}
                            />
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-sm font-medium"
                            onClick={() => handleViewBookDetails(title)}
                          >
                            {t('books.viewDetails')}
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'superadmin') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-sm font-medium"
                              onClick={() => handleEditBook(title)}
                            >
                              {t('common.edit')}
                            </Button>
                          )}
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
                  <CardBody className="p-4">
                    <div className="flex items-start space-x-4">
                      {/* Book Cover Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg overflow-hidden shadow-sm relative">
                          {title.coverUrl ? (
                            <Image
                              src={title.coverUrl}
                              alt={title.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <div className="text-center">
                                <div className="text-2xl mb-1">📚</div>
                                <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">No Cover</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Book Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                              {title.title}
                            </h3>
                            {title.subtitle && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                                {title.subtitle}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium">
                              {t('books.by')} {title.authors.join(', ')}
                            </p>
                            
                            {/* Key Info */}
                            <div className="flex items-center space-x-4 mb-3 text-sm">
                              {title.publishedYear && (
                                <div className="flex items-center">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-1">{t('books.year')}:</span>
                                  <span className="font-bold text-gray-900 dark:text-gray-100">{title.publishedYear}</span>
                                </div>
                              )}
                              {title.publisher && (
                                <div className="flex items-center">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium mr-1">{t('books.publisher')}:</span>
                                  <span className="font-bold text-gray-900 dark:text-gray-100" title={title.publisher}>
                                    {title.publisher}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Categories */}
                            {title.categories && title.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {title.categories.slice(0, 3).map((category) => (
                                  <Badge key={category} variant="secondary" size="sm" className="text-xs">
                                    {category}
                                  </Badge>
                                ))}
                                {title.categories.length > 3 && (
                                  <Badge variant="secondary" size="sm" className="text-xs">
                                    +{title.categories.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {/* Availability Status */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                  {t('books.availability')}:
                                </span>
                                <Badge 
                                  variant={availableCopies > 0 ? "success" : "error"}
                                  size="sm"
                                  className="font-bold"
                                >
                                  {availableCopies}/{totalCopies}
                                </Badge>
                              </div>
                              <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    availabilityRate >= 50 ? 'bg-green-500' : 
                                    availabilityRate >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${availabilityRate}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-sm font-medium w-24"
                              onClick={() => handleViewBookDetails(title)}
                            >
                              {t('books.viewDetails')}
                            </Button>
                            {(user?.role === 'admin' || user?.role === 'superadmin') && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="text-sm font-medium w-24"
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
