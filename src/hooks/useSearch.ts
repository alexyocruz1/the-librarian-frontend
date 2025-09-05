import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { SearchSuggestion } from '@/components/ui/SearchInput';
import { debounce } from '@/lib/utils';

export interface SearchFilters {
  query?: string;
  libraryId?: string;
  category?: string;
  author?: string;
  isbn?: string;
  availability?: boolean;
  publishedYear?: number;
  language?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  authors: string[];
  isbn13?: string;
  isbn10?: string;
  categories?: string[];
  publisher?: string;
  publishedYear?: number;
  description?: string;
  coverUrl?: string;
  availability?: {
    totalCopies: number;
    availableCopies: number;
    libraryId: string;
    libraryName: string;
  }[];
}

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
  enableSuggestions?: boolean;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    maxSuggestions = 10,
    enableSuggestions = true,
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
      if (!searchQuery.trim() || searchQuery.length < minQueryLength) {
        setSuggestions([]);
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          ...searchFilters,
        });

        // Get suggestions
        if (enableSuggestions) {
          const suggestionsResponse = await api.get(`/titles/search/suggestions?${params}`);
          if (suggestionsResponse.data.success) {
            setSuggestions(suggestionsResponse.data.data.suggestions || []);
          }
        }

        // Get full search results
        const resultsResponse = await api.get(`/titles/search?${params}`);
        if (resultsResponse.data.success) {
          setResults(resultsResponse.data.data.results || []);
        }
      } catch (err: any) {
        console.error('Search error:', err);
        setError(err.response?.data?.error || 'Search failed');
        setSuggestions([]);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [debounceMs, minQueryLength, enableSuggestions]
  );

  // Search function
  const search = useCallback((searchQuery: string, searchFilters: SearchFilters = {}) => {
    setQuery(searchQuery);
    setFilters(searchFilters);
    debouncedSearch(searchQuery, searchFilters);
  }, [debouncedSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setResults([]);
    setError(null);
    setFilters({});
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (query.trim()) {
      debouncedSearch(query, updatedFilters);
    }
  }, [filters, query, debouncedSearch]);

  // Get suggestions for a specific query
  const getSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < minQueryLength) {
      setSuggestions([]);
      return;
    }

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        limit: maxSuggestions.toString(),
      });

      const response = await api.get(`/titles/search/suggestions?${params}`);
      if (response.data.success) {
        setSuggestions(response.data.data.suggestions || []);
      }
    } catch (err: any) {
      console.error('Suggestions error:', err);
      setSuggestions([]);
    }
  }, [minQueryLength, maxSuggestions]);

  // Advanced search with multiple criteria
  const advancedSearch = useCallback(async (searchFilters: SearchFilters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/titles/search/advanced?${params}`);
      if (response.data.success) {
        setResults(response.data.data.results || []);
        setQuery(searchFilters.query || '');
        setFilters(searchFilters);
      }
    } catch (err: any) {
      console.error('Advanced search error:', err);
      setError(err.response?.data?.error || 'Advanced search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get popular searches
  const getPopularSearches = useCallback(async () => {
    try {
      const response = await api.get('/titles/search/popular');
      if (response.data.success) {
        return response.data.data.popularSearches || [];
      }
    } catch (err: any) {
      console.error('Popular searches error:', err);
    }
    return [];
  }, []);

  // Get search history
  const getSearchHistory = useCallback(() => {
    try {
      const history = localStorage.getItem('search-history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((searchQuery: string) => {
    try {
      const history = getSearchHistory();
      const newHistory = [searchQuery, ...history.filter((item: string) => item !== searchQuery)].slice(0, 10);
      localStorage.setItem('search-history', JSON.stringify(newHistory));
    } catch {
      // Ignore localStorage errors
    }
  }, [getSearchHistory]);

  // Clear search history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem('search-history');
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    // State
    query,
    suggestions,
    results,
    loading,
    error,
    filters,
    
    // Actions
    search,
    clearSearch,
    updateFilters,
    getSuggestions,
    advancedSearch,
    getPopularSearches,
    getSearchHistory,
    saveToHistory,
    clearHistory,
  };
};
