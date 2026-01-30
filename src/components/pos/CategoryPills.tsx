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
    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar max-w-full">
      {allCategories.map(category => {
        const isActive = selected === category;
        return (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`
              flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 active:scale-95
              ${isActive 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]' 
                : isDark 
                  ? 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm hover:text-gray-800'
              }
            `}
          >
            {getIcon(category)}
            {category}
          </button>
        );
      })}
    </div>
  );
}