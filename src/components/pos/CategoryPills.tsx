import { Coffee, CupSoda, Cake, Utensils, ShoppingBag, LayoutGrid } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';

interface CategoryPillsProps {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  const { theme } = useTheme();
  const { categories } = useApp();
  const isDark = theme === 'dark';

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
    <div className="category-pills-container">
      <div className="flex gap-2 pb-2 overflow-x-auto horizontal-scrollbar-thin w-full max-w-full">
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
                shrink-0 active:scale-95
                ${isActive 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg ' 
                  : isDark 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 border border-gray-700 hover:from-gray-700 hover:to-gray-800 hover:text-white' 
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 border border-gray-200 hover:from-gray-100 hover:to-gray-200 hover:text-gray-800'
                }
              `}
            >
              {getIcon(category)}
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}