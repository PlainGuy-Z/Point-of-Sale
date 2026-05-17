import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Memuat...',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#F8FAFC]/80 dark:bg-stone-950/80 backdrop-blur-sm z-50">
        <div className="text-center">
          <Loader2 className={`${sizeClasses[size]} animate-spin text-teal-600 mx-auto mb-3`} />
          <p className="text-[#475569] dark:text-stone-400 font-medium">{text}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-teal-600 mr-3`} />
      <span className="text-[#475569] dark:text-stone-400 font-medium">{text}</span>
    </div>
  );
}