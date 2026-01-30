import { useState } from 'react';
import { Send, Brain, TrendingUp, AlertTriangle, DollarSign, Package, Users } from 'lucide-react';
import type { Transaction, WasteLog, Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext'; // Import context tema
import { 
  getTopProducts, 
  analyzeWasteTrends, 
} from '../../utils/analytics';

interface AIAssistantProps {
  transactions: Transaction[];
  wasteLogs: WasteLog[];
  products: Product[];
}

type InsightType = 'revenue' | 'profit' | 'waste' | 'customers' | 'products';

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  action: string;
  severity: 'low' | 'medium' | 'high';
  data?: any;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const predefinedQuestions = [
  "Kenapa profit saya turun minggu ini?",
  "Produk mana yang sebaiknya saya promosikan?",
  "Biaya mana yang paling bocor?",
  "Customer saya yang paling loyal siapa?",
  "Bagaimana meningkatkan penjualan di jam sepi?",
  "Apakah saya perlu tambah stok bahan baku?",
];

export default function AIAssistant({ transactions, wasteLogs, products }: AIAssistantProps) {
  const { theme } = useTheme(); // Gunakan hook tema
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Halo! Saya asisten AI untuk bisnis kopi Anda. Tanyakan apa saja tentang bisnis Anda.",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Analisis data untuk insights otomatis (Logika tetap sama)
  const analyzeBusiness = () => {
    const last7Days = transactions.filter(t => {
      const date = new Date(t.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    });

    const weeklyRevenue = last7Days.reduce((sum, t) => sum + t.total, 0);
    const weeklyProfit = last7Days.reduce((sum, t) => sum + t.profit, 0);
    const previousWeekRevenue = 0; 

    const newInsights: Insight[] = [];

    if (weeklyRevenue < (previousWeekRevenue * 0.8)) {
      newInsights.push({
        id: '1', type: 'revenue', title: 'Revenue Menurun',
        description: `Revenue minggu ini turun ${Math.round((1 - weeklyRevenue/previousWeekRevenue) * 100)}% dari minggu lalu.`,
        action: 'Cek apakah ada perubahan menu atau promosi yang kurang efektif.',
        severity: 'high'
      });
    }

    const wasteAnalysis = analyzeWasteTrends(wasteLogs);
    if (wasteAnalysis.totalLoss > 500000) {
      newInsights.push({
        id: '2', type: 'waste', title: 'Waste Tinggi',
        description: `Total waste mencapai Rp ${wasteAnalysis.totalLoss.toLocaleString()} bulan ini.`,
        action: wasteAnalysis.byProduct[0] ? `Fokus kurangi waste pada ${wasteAnalysis.byProduct[0][0]}` : 'Tinjau proses penyimpanan.',
        severity: 'high'
      });
    }

    const topProducts = getTopProducts(last7Days, 3);
    if (topProducts.length > 0) {
      const topProductName = products.find(p => p.id === topProducts[0][0])?.name || 'Unknown';
      newInsights.push({
        id: '3', type: 'products', title: 'Produk Unggulan',
        description: `${topProductName} adalah produk terlaris dengan ${topProducts[0][1].quantity} penjualan.`,
        action: 'Pertimbangkan bundle promo.',
        severity: 'low'
      });
    }

    const profitMargin = weeklyRevenue > 0 ? (weeklyProfit / weeklyRevenue) * 100 : 0;
    if (profitMargin < 40) {
      newInsights.push({
        id: '4', type: 'profit', title: 'Margin Profit Rendah',
        description: `Margin profit saat ini ${profitMargin.toFixed(1)}%, di bawah target 50%.`,
        action: 'Tinjau harga jual.',
        severity: 'medium'
      });
    }
    setInsights(newInsights);
  };

  const handleQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(question), 100);
  };

  const processQuestion = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('profit') && lowerQuestion.includes('turun')) return "Profit harian rata-rata minggu ini perlu diperhatikan. Periksa waste dan biaya bahan baku.";
    if (lowerQuestion.includes('produk') && lowerQuestion.includes('promosikan')) return "Promosikan produk dengan margin tinggi. Cek daftar produk terlaris di menu utama.";
    return `Saya menganalisis data Anda. Total transaksi saat ini: ${transactions.length}. Produk terjual: ${transactions.flatMap(t => t.items).reduce((sum, item) => sum + item.quantity, 0)}.`;
  };

  const handleSend = (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), text: textToSend, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    setTimeout(() => {
      const aiResponse = processQuestion(textToSend);
      const aiMessage: Message = { id: (Date.now() + 1).toString(), text: aiResponse, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
      setInput('');
      analyzeBusiness();
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'revenue': return <DollarSign className="w-5 h-5" />;
      case 'profit': return <TrendingUp className="w-5 h-5" />;
      case 'waste': return <AlertTriangle className="w-5 h-5" />;
      case 'customers': return <Users className="w-5 h-5" />;
      case 'products': return <Package className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  const getSeverityClasses = (severity: Insight['severity']) => {
    switch (severity) {
      case 'high': return isDark ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return isDark ? 'bg-amber-900/30 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low': return isDark ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className={`rounded-xl p-6 border transition-colors ${
        isDark ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border-purple-800' : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg shadow-lg">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Business Assistant</h2>
            <p className={`${isDark ? 'text-purple-200/70' : 'text-gray-600'}`}>Owner tidak perlu pintar data. Tanya apa saja tentang bisnis Anda.</p>
          </div>
        </div>
      </div>

      {/* Auto Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>Auto Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => (
              <div key={insight.id} className={`p-4 rounded-lg border transition-all ${getSeverityClasses(insight.severity)}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-900/50' : 'bg-white shadow-sm'}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <p className="text-sm mt-1 opacity-80">{insight.description}</p>
                    <div className={`mt-3 p-2 rounded text-sm ${isDark ? 'bg-gray-900/40' : 'bg-white/50'}`}>
                      💡 <span className="font-medium">Saran:</span> {insight.action}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 flex items-center gap-3 border-b ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
          <span className={`font-medium ${isDark ? 'text-gray-200' : ''}`}>Live Chat Assistant</span>
          <span className="text-sm text-gray-500 ml-auto">{messages.length} pesan</span>
        </div>

        <div className="h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                message.isUser
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none'
                  : isDark ? 'bg-gray-700 text-gray-200 rounded-bl-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
                <p className={`text-[10px] mt-2 font-medium ${message.isUser ? 'text-amber-100/70' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl rounded-bl-none px-4 py-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t ${isDark ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <p className="text-sm text-gray-500 mb-3">Pertanyaan cepat:</p>
          <div className="flex flex-wrap gap-2">
            {predefinedQuestions.map((q, i) => (
              <button key={i} onClick={() => handleQuestion(q)} className={`px-3 py-2 rounded-lg text-sm transition-all border ${
                isDark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' : 'bg-white border-gray-300 hover:bg-gray-50'
              }`}>{q}</button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700/50">
          <div className="flex gap-3">
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress}
              placeholder="Tanyakan apa saja..."
              className={`flex-1 px-4 py-3 rounded-lg outline-none transition-all resize-none ${
                isDark ? 'bg-gray-900 border border-gray-700 text-white focus:border-purple-500' : 'bg-white border border-gray-300 focus:ring-2 focus:ring-purple-500'
              }`}
              rows={2}
            />
            <button
              onClick={() => handleSend()} disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2 font-semibold"
            >
              <Send className="w-4 h-4" /> Kirim
            </button>
          </div>
        </div>
      </div>

      {/* Data Source Info */}
      <div className={`rounded-xl p-4 border transition-colors ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <h4 className={`font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-gray-200' : ''}`}>📊 Data dinalisis secara real-time:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Total Transaksi', val: transactions.length },
            { label: 'Produk Terjual', val: transactions.flatMap(t => t.items).reduce((s, i) => s + i.quantity, 0) },
            { label: 'Waste Records', val: wasteLogs.length },
            { label: 'Produk di Menu', val: products.length }
          ].map((item, idx) => (
            <div key={idx} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-white border-gray-200'}`}>
              <div className="font-bold text-lg">{item.val}</div>
              <div className="opacity-60 text-xs">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}