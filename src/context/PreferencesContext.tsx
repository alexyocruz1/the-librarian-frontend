'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFromStorage, setToStorage } from '@/lib/utils';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    borrowReminders: boolean;
    systemUpdates: boolean;
  };
}

interface PreferencesContextType {
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => void;
  updateNotificationPreference: (
    key: keyof UserPreferences['notifications'],
    value: boolean
  ) => void;
  isLoading: boolean;
  savePreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const defaultPreferences: UserPreferences = {
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    borrowReminders: true,
    systemUpdates: false,
  },
};

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { user } = useAuth();
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(false);

  // Load preferences from user data or localStorage
  useEffect(() => {
    if (user?.preferences) {
      // Use preferences from user data if available
      setPreferencesState({
        language: user.preferences.language || defaultPreferences.language,
        timezone: user.preferences.timezone || defaultPreferences.timezone,
        notifications: {
          email: user.preferences.notifications?.email ?? defaultPreferences.notifications.email,
          push: user.preferences.notifications?.push ?? defaultPreferences.notifications.push,
          borrowReminders: user.preferences.notifications?.borrowReminders ?? defaultPreferences.notifications.borrowReminders,
          systemUpdates: user.preferences.notifications?.systemUpdates ?? defaultPreferences.notifications.systemUpdates,
        },
      });
    } else {
      // Fall back to localStorage
      const storedPreferences = getFromStorage<UserPreferences>('user-preferences', defaultPreferences);
      setPreferencesState(storedPreferences);
    }
  }, [user]);

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    setToStorage('user-preferences', preferences);
  }, [preferences]);

  const setPreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferencesState(prev => ({
      ...prev,
      ...newPreferences,
    }));
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferencesState(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateNotificationPreference = (
    key: keyof UserPreferences['notifications'],
    value: boolean
  ) => {
    setPreferencesState(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const savePreferences = async () => {
    setIsLoading(true);
    try {
      // Try to save to backend if user is authenticated
      await api.updateProfile({ preferences });
      toast.success('Preferences saved successfully!');
    } catch (error: any) {
      // If backend save fails, preferences are still saved locally
      console.warn('Failed to save preferences to backend:', error);
      toast.success('Preferences saved locally!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setPreferences,
        updatePreference,
        updateNotificationPreference,
        isLoading,
        savePreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
