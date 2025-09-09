'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Input } from './Input';
import { cn } from '@/lib/utils';

export interface SearchSuggestion {
  id: string;
  title: string;
  subtitle?: string;
  type: 'title' | 'author' | 'category' | 'isbn';
  metadata?: Record<string, any>;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  loading?: boolean;
  className?: string;
  showSuggestions?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    value,
    onChange,
    onSelect,
    onSearch,
    placeholder = "Search books, authors, categories...",
    suggestions = [],
    loading = false,
    className,
    showSuggestions = true,
    maxSuggestions = 10,
    debounceMs = 300,
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    // Debounce the search value
    useEffect(() => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        if (onSearch && value.trim()) {
          onSearch(value.trim());
        }
      }, debounceMs);

      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, [value, onSearch, debounceMs]);

    const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
      onChange(suggestion.title);
      onSelect?.(suggestion);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }, [onChange, onSelect]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[highlightedIndex]);
          } else if (onSearch && value.trim()) {
            onSearch(value.trim());
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    }, [suggestions, highlightedIndex, value, onSearch, showSuggestions, handleSelectSuggestion]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      setIsOpen(newValue.length > 0 && showSuggestions);
      setHighlightedIndex(-1);
    };

    const handleInputFocus = () => {
      if (value.length > 0 && showSuggestions) {
        setIsOpen(true);
      }
    };

    const handleInputBlur = (e: React.FocusEvent) => {
      // Delay hiding suggestions to allow for clicks
      setTimeout(() => {
        if (!suggestionsRef.current?.contains(document.activeElement)) {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
      }, 150);
    };

    const clearSearch = () => {
      onChange('');
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    };

    const filteredSuggestions = suggestions.slice(0, maxSuggestions);

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <Input
            ref={ref || inputRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
            rightIcon={
              value && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  aria-label="Clear search"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )
            }
            className="pr-10"
          />
          
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isOpen && showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors',
                    index === highlightedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.title}
                        </span>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          suggestion.type === 'title' && 'bg-blue-100 text-blue-800',
                          suggestion.type === 'author' && 'bg-green-100 text-green-800',
                          suggestion.type === 'category' && 'bg-purple-100 text-purple-800',
                          suggestion.type === 'isbn' && 'bg-gray-100 text-gray-800'
                        )}>
                          {suggestion.type}
                        </span>
                      </div>
                      {suggestion.subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                          {suggestion.subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && showSuggestions && filteredSuggestions.length === 0 && !loading && value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              No results found for &quot;{value}&quot;
            </p>
          </motion.div>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
