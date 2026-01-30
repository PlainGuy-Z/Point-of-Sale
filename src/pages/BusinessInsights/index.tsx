// src/pages/BusinessInsights/index.tsx
import { useState } from 'react';
import { BarChart3, TrendingUp, Brain, AlertTriangle, DollarSign, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import WeeklySummary from '../../components/insights/WeeklySummary';
import TrendsAnalysis from '../../components/insights/TrendsAnalysis';
import AIAssistant from '../../components/insights/AIAssistant';
import InsightCard from '../../components/insights/InsightCard';

type InsightTab = 'weekly' | 'trends' | 'ai';

export default function BusinessInsights() {
  const [activeTab, setActiveTab] = useState<InsightTab>('weekly');
  const { transactions, wasteLogs, products } = useApp();

  // Hitung insights
  const last7Days = transactions.filter(t => {
    const date = new Date(t.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  });

  const weeklyRevenue = last7Days.reduce((sum, t) => sum + t.total, 0);
  const weeklyProfit = last7Days.reduce((sum, t) => sum + t.profit, 0);
  const avgDailyProfit = weeklyProfit / 7;
  const wasteLoss = wasteLogs.reduce((sum, w) => sum + w.costLoss, 0);

  // Top product
  const productSales: Record<string, number> = {};
  last7Days.forEach(t => {
    t.items.forEach(item => {
      productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
    });
  });

  const topProductId = Object.entries(productSales).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topProduct = products.find(p => p.id === topProductId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Insights</h1>
        <p className="text-gray-600">Otak aplikasi - data mentah menjadi keputusan bisnis</p>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InsightCard
          title="Weekly Revenue"
          value={`Rp ${weeklyRevenue.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6" />}
          description="Last 7 days"
          trend={weeklyRevenue > 7000000 ? "up" : "down"}
        />
        
        <InsightCard
          title="Daily Profit Avg"
          value={`Rp ${avgDailyProfit.toLocaleString()}`}
          icon={<TrendingUp className="w-6 h-6" />}
          description="Per day average"
          trend={avgDailyProfit > 500000 ? "up" : "down"}
        />
        
        <InsightCard
          title="Waste Loss"
          value={`Rp ${wasteLoss.toLocaleString()}`}
          icon={<AlertTriangle className="w-6 h-6" />}
          description="Cost leakage"
          trend={wasteLoss > 200000 ? "danger" : "safe"}
        />
        
        <InsightCard
          title="Top Product"
          value={topProduct?.name || "N/A"}
          icon={<Users className="w-6 h-6" />}
          description="Most sold this week"
          trend="neutral"
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'weekly'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Weekly Summary
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('trends')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'trends'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trends Analysis
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Ask AI
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'weekly' && <WeeklySummary transactions={transactions} />}
        {activeTab === 'trends' && <TrendsAnalysis transactions={transactions} products={products} />}
        {activeTab === 'ai' && <AIAssistant transactions={transactions} wasteLogs={wasteLogs} products={products} />}
      </div>
    </div>
  );
}