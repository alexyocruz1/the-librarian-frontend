'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon 
} from '@heroicons/react/24/outline';
import { Button } from './Button';
import { useTheme, Theme } from '@/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function ThemeToggle({ 
  className, 
  showLabel = false,
  size = 'md'
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes: { value: 'light' | 'dark' | 'system'; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <SunIcon className="w-4 h-4" />, label: 'Light' },
    { value: 'dark', icon: <MoonIcon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system', icon: <ComputerDesktopIcon className="w-4 h-4" />, label: 'System' },
  ];

  const currentThemeIndex = themes.findIndex(t => t.value === theme);
  const nextTheme = themes[(currentThemeIndex + 1) % themes.length];

  const handleToggle = () => {
    setTheme(nextTheme.value);
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'p-1.5';
      case 'lg':
        return 'p-3';
      default:
        return 'p-2';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-6 h-6';
      default:
        return 'w-5 h-5';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={`${getButtonSize()} relative overflow-hidden`}
        title={`Switch to ${nextTheme.label} theme`}
      >
        <motion.div
          key={theme}
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {themes.find(t => t.value === theme)?.icon}
        </motion.div>
      </Button>
      
      {showLabel && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {themes.find(t => t.value === theme)?.label}
        </span>
      )}
    </div>
  );
}

// Export both named and default
export { ThemeToggle };
export default ThemeToggle;

// Alternative dropdown version
export function ThemeSelector({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: <SunIcon className="w-4 h-4" />, label: 'Light' },
    { value: 'dark' as const, icon: <MoonIcon className="w-4 h-4" />, label: 'Dark' },
    { value: 'system' as const, icon: <ComputerDesktopIcon className="w-4 h-4" />, label: 'System' },
  ];

  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as Theme)}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
        aria-label="Select theme"
      >
        {themes.map((themeOption) => (
          <option key={themeOption.value} value={themeOption.value}>
            {themeOption.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        {themes.find(t => t.value === theme)?.icon}
      </div>
    </div>
  );
}
