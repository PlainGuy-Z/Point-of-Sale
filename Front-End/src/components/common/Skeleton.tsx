import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface SkeletonProps {
  className?: string;
  rounded?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'rounded-md' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return (
    <div 
      className={`animate-pulse ${rounded} ${isDark ? 'bg-stone-800' : 'bg-gray-200'} ${className}`}
    />
  );
};

export const SkeletonCard: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-2xl border p-6 ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-100 shadow-sm'} ${className}`}>
      {children}
    </div>
  );
};

export const SkeletonCircle: React.FC<SkeletonProps> = ({ className = '' }) => {
  return <Skeleton className={className} rounded="rounded-full" />;
};
