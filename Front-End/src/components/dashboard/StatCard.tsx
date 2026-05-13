// src/components/dashboard/StatCard.tsx - FIXED VERSION
import { useTheme } from '../../contexts/ThemeContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtitle?: string;
  gradient?: string;
  delay?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon: Icon,
  trend, 
  trendValue, 
  subtitle,
  gradient = 'from-amber-500 to-cyan-500',
  delay = '0'
}: StatCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const trendConfig = {
    up: { 
      icon: <TrendingUp className="w-3 h-3" />, 
      color: isDark ? 'text-green-400' : 'text-emerald-700',
      bg: isDark ? 'bg-green-900/30' : 'bg-emerald-50',
      border: isDark ? 'border-green-800' : 'border-emerald-100'
    },
    down: { 
      icon: <TrendingDown className="w-3 h-3" />, 
      color: isDark ? 'text-red-400' : 'text-red-600',
      bg: isDark ? 'bg-red-900/30' : 'bg-red-50',
      border: isDark ? 'border-red-800' : 'border-red-100'
    },
    stable: { 
      icon: <Minus className="w-3 h-3" />, 
      color: isDark ? 'text-stone-400' : 'text-[#475569]',
      bg: isDark ? 'bg-stone-800' : 'bg-[#F1F5F9]',
      border: isDark ? 'border-stone-700' : 'border-[#E2E8F0]'
    }
  };

  const trendStyle = trendConfig[trend];

  // Logic to determine icon color scheme based on title in light mode
  const getLightIconClasses = () => {
    const t = title.toLowerCase();
    if (t.includes('pendapatan') || t.includes('revenue')) return 'bg-teal-50 text-teal-600';
    if (t.includes('transaksi') || t.includes('transaction')) return 'bg-blue-50 text-blue-600';
    if (t.includes('profit') || t.includes('laba')) return 'bg-emerald-50 text-emerald-600';
    return 'bg-slate-50 text-slate-600';
  };

  return (
    <div 
      className={`
        rounded-2xl border p-5 transition-all duration-300 
        hover:scale-[1.02] group cursor-pointer
        animate-in fade-in slide-in-from-bottom-4
        ${isDark 
          ? 'bg-gradient-to-br from-stone-900 to-stone-900 border-stone-800 hover:shadow-lg' 
          : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md hover:border-[#CBD5E1]'
        }
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon with specific color scheme */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-2xl ${isDark ? 'bg-stone-800/50' : getLightIconClasses().split(' ')[0]}`}>
          <div className={`p-2 rounded-xl ${isDark ? 'bg-stone-900' : 'bg-white shadow-sm'}`}>
            <Icon className={`w-6 h-6 ${isDark ? 'text-stone-300' : getLightIconClasses().split(' ')[1]}`} />
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
          {value}
        </p>
      </div>

      {/* Title and subtitle */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? 'text-stone-400' : 'text-[#94A3B8]'}`}>
            {title}
          </p>
          {trendValue && (
            <div className={`text-[10px] font-black px-2 py-1 rounded-full border flex items-center gap-1 ${trendStyle.bg} ${trendStyle.border} ${trendStyle.color}`}>
              {trendStyle.icon}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {subtitle && (
          <p className={`text-xs ${isDark ? 'text-stone-500' : 'text-[#94A3B8]'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom gradient bar */}
      <div className={`mt-4 h-1 rounded-full overflow-hidden ${isDark ? 'bg-stone-800' : 'bg-[#F1F5F9]'}`}>
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 group-hover:w-full`}
          style={{ 
            width: trend === 'up' ? '85%' : trend === 'down' ? '40%' : '65%',
            transition: 'width 1s ease-in-out'
          }}
        />
      </div>
    </div>
  );
}