import { useTheme } from '../../contexts/ThemeContext';
import { Skeleton, SkeletonCard, SkeletonCircle } from '../common/Skeleton';

export default function PointOfSaleSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 relative animate-in fade-in duration-300">
      {/* ══════════════════════════════════════════════════════════════════════════
          LEFT — Product Catalog Skeleton
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex-shrink-0 space-y-3 mb-4">
          {/* Title & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <Skeleton className="w-56 h-8" rounded="rounded-lg" />
            <Skeleton className="w-full sm:w-72 h-10" rounded="rounded-2xl" />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-hidden py-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={`h-8 ${i === 0 ? 'w-16' : 'w-24'}`} rounded="rounded-full" />
            ))}
          </div>

          {/* Trending Bar */}
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-6" rounded="rounded-2xl" />
            <Skeleton className="w-24 h-6" rounded="rounded-2xl" />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4 min-h-0 custom-scrollbar horizontal-scrollbar-thin">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <SkeletonCard key={i} className="flex flex-col p-3 rounded-3xl h-full border-2">
                <div className="w-full aspect-square rounded-2xl mb-3 relative overflow-hidden">
                  <Skeleton className="w-full h-full" rounded="rounded-none" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <Skeleton className="w-20 h-2.5 mb-1.5" rounded="rounded-md" />
                    <Skeleton className="w-full h-3.5 mb-2" rounded="rounded-md" />
                    <Skeleton className="w-3/4 h-3.5" rounded="rounded-md" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Skeleton className="w-16 h-4" rounded="rounded-md" />
                    <Skeleton className="w-8 h-8" rounded="rounded-xl" />
                  </div>
                </div>
              </SkeletonCard>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          RIGHT — Cart Panel Skeleton
      ══════════════════════════════════════════════════════════════════════════ */}
      <div className={`
        fixed inset-y-0 right-0 w-full sm:w-[400px] z-40 transform transition-transform duration-300
        lg:relative lg:translate-x-0 lg:w-[380px] lg:z-0
        flex flex-col h-full rounded-[2.5rem] shadow-2xl border
        ${isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-gray-200'}
      `}>
        {/* Header Tabs */}
        <div className="p-4 flex-shrink-0">
          <div className={`p-1.5 rounded-2xl flex relative ${isDark ? 'bg-stone-950/50' : 'bg-gray-100/80'}`}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 py-2 px-3">
                <Skeleton className="w-20 h-4 mx-auto" rounded="rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Customer Select / Manual Toggle */}
        <div className={`px-5 pb-4 border-b flex-shrink-0 flex items-center justify-between gap-3 ${isDark ? 'border-stone-800' : 'border-gray-100'}`}>
          <Skeleton className="w-48 h-10" rounded="rounded-2xl" />
          <Skeleton className="w-10 h-10" rounded="rounded-2xl" />
        </div>

        {/* Cart Items Area */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar horizontal-scrollbar-thin space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`p-4 rounded-3xl border flex flex-col gap-3 ${isDark ? 'bg-stone-950/30 border-stone-800' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <Skeleton className="w-3/4 h-3.5 mb-2" rounded="rounded-md" />
                  <Skeleton className="w-1/2 h-3" rounded="rounded-md" />
                </div>
                <Skeleton className="w-16 h-4" rounded="rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="w-20 h-8" rounded="rounded-full" />
                <Skeleton className="w-24 h-4" rounded="rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Cart Footer Area */}
        <div className={`p-5 flex-shrink-0 rounded-b-[2.5rem] space-y-3 ${isDark ? 'bg-stone-950' : 'bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <Skeleton className="w-16 h-3" rounded="rounded-md" />
            <Skeleton className="w-24 h-3" rounded="rounded-md" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="w-16 h-3" rounded="rounded-md" />
            <Skeleton className="w-20 h-3" rounded="rounded-md" />
          </div>
          <div className={`pt-3 border-t flex justify-between items-center ${isDark ? 'border-stone-800' : 'border-gray-200'}`}>
            <Skeleton className="w-24 h-4" rounded="rounded-md" />
            <Skeleton className="w-32 h-6" rounded="rounded-lg" />
          </div>
          <Skeleton className="w-full h-14 mt-2" rounded="rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
