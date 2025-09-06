'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

export default function BooksPage() {
  const { user } = useAuth();
  const [titles, setTitles] = useState<Title[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [editingBook, setEditingBook] = useState<Title | null>(null);
  
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
      const response = await api.get('/titles');
      setTitles(response.data.data || []);
    } catch (error) {
      console.error('Error fetching titles:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const fetchInventories = async () => {
    try {
      const response = await api.get('/inventories');
      setInventories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching inventories:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
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

  const handleEditBook = (book: Title) => {
    setEditingBook(book);
    setShowBookModal(true);
  };

  const handleBookModalSuccess = () => {
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
    toast.success('Advanced search completed');
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Books</h1>
          <p className="text-gray-600 mt-1">Manage your library&apos;s book collection</p>
        </div>
        {user?.role === 'admin' || user?.role === 'superadmin' ? (
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={handleAddBook}
          >
            Add Book
          </Button>
        ) : null}
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
                placeholder="Search books by title, author, or ISBN..."
                showSuggestions={true}
                maxSuggestions={8}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowAdvancedSearch(true)}
              leftIcon={<FunnelIcon className="w-5 h-5" />}
            >
              Advanced
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

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTitles.map((title) => {
          const inventory = getInventoryForTitle(title._id);
          const totalCopies = getTotalCopies(title._id);
          const availableCopies = getAvailableCopies(title._id);

          return (
            <motion.div
              key={title._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-200">
                <CardBody className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {title.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        by {title.authors.join(', ')}
                      </p>
                      {title.categories && title.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {title.categories.slice(0, 2).map((category) => (
                            <Badge key={category} variant="secondary" size="sm">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>Total Copies: {totalCopies}</span>
                        <span className="text-green-600 font-medium">
                          Available: {availableCopies}
                        </span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditBook(title)}
                        >
                          View Details
                        </Button>
                        {(user?.role === 'admin' || user?.role === 'superadmin') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditBook(title)}
                          >
                            Edit
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

      {filteredTitles.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
          <p className="text-gray-600">
            {searchTerm ? `No books match "${searchTerm}"` : 'No books available'}
          </p>
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
