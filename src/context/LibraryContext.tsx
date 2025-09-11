'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Library } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface LibraryContextType {
  selectedLibrary: Library | null;
  setSelectedLibrary: (library: Library | null) => void;
  libraries: Library[];
  loading: boolean;
  error: string | null;
  refreshLibraries: () => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

interface LibraryProviderProps {
  children: ReactNode;
}

export function LibraryProvider({ children }: LibraryProviderProps) {
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLibraries = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/libraries');
      
      if (response.data.success) {
        const librariesData = response.data.data?.libraries || response.data.libraries || [];
        setLibraries(librariesData);
        
        // Auto-select first library if none selected and user is student/guest
        if (!selectedLibrary && librariesData.length > 0 && (user?.role === 'student' || user?.role === 'guest')) {
          setSelectedLibrary(librariesData[0]);
        }
      } else {
        setError('Failed to fetch libraries');
      }
    } catch (err) {
      console.error('Error fetching libraries:', err);
      setError('Failed to fetch libraries');
    } finally {
      setLoading(false);
    }
  };

  const refreshLibraries = async () => {
    await fetchLibraries();
  };

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  // Reset selected library when user changes
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      // Admins and superadmins don't need library selection
      setSelectedLibrary(null);
    } else if (user?.role === 'student' || user?.role === 'guest') {
      // Students and guests need library selection
      if (!selectedLibrary && libraries.length > 0) {
        setSelectedLibrary(libraries[0]);
      }
    }
  }, [user, libraries, selectedLibrary]);

  const value: LibraryContextType = {
    selectedLibrary,
    setSelectedLibrary,
    libraries,
    loading,
    error,
    refreshLibraries,
  };

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextType {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
