import { Coffee, CupSoda, Cake, Utensils, ShoppingBag, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';

interface CategoryPillsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const { theme } = useTheme();
  const { categories } = useApp(); // Ambil kategori dinamis
  const isDark = theme === 'dark';

  // Gabungkan kategori "All" dengan daftar dinamis
  const allCategories = ['All', ...categories];

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'All': return <LayoutGrid className="w-4 h-4" />;
      case 'Coffee': return <Coffee className="w-4 h-4" />;
      case 'Tea': return <CupSoda className="w-4 h-4" />;
      case 'Pastry': return <Cake className="w-4 h-4" />;
      case 'Food': return <Utensils className="w-4 h-4" />;
      default: return <ShoppingBag className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative w-full min-w-0">
      {/* Custom scrollbar styling */}
      <style jsx global>{`
        .custom-scrollbar-x::-webkit-scrollbar {
          height: 6px; /* Lebih kecil dari default */
          background: ${isDark ? '#1f2937' : '#f3f4f6'};
          border-radius: 3px;
        }
        
        .custom-scrollbar-x::-webkit-scrollbar-thumb {
          background: ${isDark ? '#4b5563' : '#9ca3af'};
          border-radius: 3px;
          transition: all 0.2s ease;
        }
        
        .custom-scrollbar-x::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? '#6b7280' : '#6b7280'};
        }
        
        /* Firefox */
        .custom-scrollbar-x {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? '#4b5563 #1f2937' : '#9ca3af #f3f4f6'};
        }
      `}</style>

      <div className="flex gap-2 pb-2 overflow-x-auto custom-scrollbar-x w-full max-w-full">
        {allCategories.map(category => {
          const isActive = selected === category;

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 rounded-xl
                text-xs sm:text-sm font-bold whitespace-nowrap
                transition-all duration-200
                shrink-0 active:scale-95 bg-gradient-to-br
                ${isActive 
                  ? 'from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]' 
                  : isDark 
                    ? 'from-gray-800 via-gray-800 to-gray-900 text-gray-400 border border-gray-700 hover:from-gray-700 hover:via-gray-700 hover:to-gray-800' 
                    : 'from-white via-white to-gray-50 text-gray-600 hover:from-gray-50 hover:via-gray-50 hover:to-gray-100 border border-gray-200 shadow-sm hover:text-gray-800'
                }
              `}
            >
              {getIcon(category)}
              {category}
            </button>
          );
        })}
      </div>
      
      {/* Gradient overlay untuk menunjukkan ada konten lebih */}
      <div className="absolute right-0 top-0 bottom-3 w-6 bg-gradient-to-l from-gray-50 dark:from-gray-800 to-transparent pointer-events-none" />
    </div>
  );
}