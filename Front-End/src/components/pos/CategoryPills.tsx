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
    /* Container dengan width yang dijamin 100% */
    <div className="w-full">
      {/* Scroll container yang proper */}
      <div 
        className="flex flex-nowrap items-center gap-2 pb-3 overflow-x-auto w-full horizontal-scrollbar-thin"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        {allCategories.map(category => {
          const isActive = selected === category;

          return (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-3xl
                text-xs font-bold whitespace-nowrap
                transition-all duration-200
                flex-shrink-0 active:scale-95
                min-w-max
                ${isActive 
                  ? isDark 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20' 
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/20'
                  : isDark 
                    ? 'bg-[#1a1614] text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white' 
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-800 shadow-sm'
                }
              `}
              aria-label={`Select ${category} category`}
              aria-pressed={isActive}
            >
              {getIcon(category)}
              <span>{category}</span>
            </button>
          );
        })}
        
        {/* Padding untuk scroll yang nyaman */}
        <div className="flex-shrink-0 w-2" />
      </div>
    </div>
  );
}