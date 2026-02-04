import { useState, useEffect } from 'react';
import { Send, Brain, TrendingUp, AlertTriangle, DollarSign, Package, Users, X } from 'lucide-react';
import type { Transaction, WasteLog, Product } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
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
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const predefinedQuestions = [
  "Kenapa profit saya turun?",
  "Produk mana yang paling laku?",
  "Berapa total kerugian waste?",
  "Siapa customer paling loyal?",
  "Bagaimana stok bahan baku saat ini?",
];

export default function AIAssistant({ transactions, wasteLogs, products }: AIAssistantProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Halo! Saya asisten AI bisnis Anda. Saya sudah menganalisis data transaksi dan operasional Anda. Ada yang bisa saya bantu?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Jalankan analisis otomatis saat pertama kali dibuka
  useEffect(() => {
    analyzeBusiness();
  }, [transactions, wasteLogs]);

  const analyzeBusiness = () => {
    const now = new Date();
    const last7Days = transactions.filter(t => {
      const date = new Date(t.date);
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return date >= weekAgo;
    });

    const weeklyRevenue = last7Days.reduce((sum, t) => sum + t.total, 0);
    const weeklyProfit = last7Days.reduce((sum, t) => sum + t.profit, 0);
    
    const newInsights: Insight[] = [];

    // 1. Analisis Waste (Kerugian)
    const wasteAnalysis = analyzeWasteTrends(wasteLogs);
    if (wasteAnalysis.totalLoss > 100000) {
      newInsights.push({
        id: 'waste-alert',
        type: 'waste',
        title: 'Deteksi Pemborosan',
        description: `Kerugian waste mencapai Rp ${wasteAnalysis.totalLoss.toLocaleString()}.`,
        action: 'Tinjau kembali porsi atau cara penyimpanan bahan baku.',
        severity: wasteAnalysis.totalLoss > 300000 ? 'high' : 'medium'
      });
    }

    // 2. Analisis Produk (Sinkron dengan Top Products)
    const topData = getTopProducts(transactions, products, 1);
    if (topData.length > 0) {
      newInsights.push({
        id: 'top-prod',
        type: 'products',
        title: 'Produk Powerhouse',
        description: `${topData[0].product.name} menyumbang penjualan terbanyak (${topData[0].quantity} unit).`,
        action: 'Pastikan stok produk ini selalu aman.',
        severity: 'low'
      });
    }

    // 3. Analisis Margin
    const margin = weeklyRevenue > 0 ? (weeklyProfit / weeklyRevenue) * 100 : 0;
    if (margin < 30 && weeklyRevenue > 0) {
      newInsights.push({
        id: 'profit-alert',
        type: 'profit',
        title: 'Margin Menipis',
        description: `Margin keuntungan rata-rata Anda hanya ${margin.toFixed(1)}%.`,
        action: 'Cek kenaikan harga bahan baku atau kurangi diskon berlebih.',
        severity: 'high'
      });
    }

    setInsights(newInsights);
  };

  const processQuestion = (question: string): string => {
    const q = question.toLowerCase();
    
    if (q.includes('profit') || q.includes('untung')) {
      const weeklyProfit = transactions.slice(0, 10).reduce((s, t) => s + t.profit, 0);
      return `Profit Anda sangat bergantung pada efisiensi bahan. Saat ini rata-rata profit per transaksi adalah Rp ${(weeklyProfit / (transactions.length || 1)).toLocaleString()}.`;
    }
    
    if (q.includes('produk') || q.includes('laku')) {
      const top = getTopProducts(transactions, products, 3);
      if (top.length === 0) return "Belum ada data penjualan produk yang cukup untuk dianalisis.";
      return `3 Produk terlaris Anda adalah: ${top.map(t => t.product.name).join(', ')}. Fokus pada stok barang-barang ini.`;
    }

    if (q.includes('waste') || q.includes('rugi')) {
      const waste = analyzeWasteTrends(wasteLogs);
      return `Total kerugian dari waste adalah Rp ${waste.totalLoss.toLocaleString()}. Penyebab utama biasanya adalah produk kedaluwarsa atau kesalahan pembuatan.`;
    }

    if (q.includes('stok') || q.includes('bahan')) {
      const lowStock = products.filter(p => p.stock <= p.minStock).length;
      return `Ada ${lowStock} produk yang berada di bawah batas minimum stok. Segera lakukan restock untuk mencegah kehilangan potensi penjualan.`;
    }

    return `Berdasarkan ${transactions.length} transaksi, bisnis Anda berjalan cukup stabil. Ada hal spesifik lain yang ingin Anda ketahui?`;
  };

  const handleSend = (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: msgText, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setInput('');

    setTimeout(() => {
      const aiResponse = processQuestion(msgText);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: aiResponse, isUser: false, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 800);
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
      case 'high': return isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return isDark ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800';
      case 'low': return isDark ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* AI Hero Header */}
      <div className={`rounded-3xl p-8 border relative overflow-hidden transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
      }`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Brain size={120} className="text-purple-500" />
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/30">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Asisten Bisnis Pintar</h2>
            <p className={`mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Menganalisis <span className="text-purple-500 font-bold">{transactions.length}</span> transaksi secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Auto Insights Row */}
      {insights.length > 0 && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
            <h3 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Temuan Penting</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => (
              <div key={insight.id} className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${getSeverityClasses(insight.severity)}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${isDark ? 'bg-black/20' : 'bg-white shadow-sm'}`}>
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base">{insight.title}</h4>
                    <p className="text-sm mt-1 leading-relaxed opacity-90">{insight.description}</p>
                    <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${isDark ? 'bg-black/20 text-white' : 'bg-white/60 text-slate-800'}`}>
                      <span className="text-lg">💡</span> {insight.action}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden flex flex-col transition-all ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className={`font-black text-sm uppercase tracking-widest ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Chat Assistant</span>
          </div>
          <button onClick={() => setMessages([messages[0]])} className="text-xs font-bold text-red-400 hover:underline">Reset Chat</button>
        </div>

        <div className="h-[450px] overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {messages.map(message => (
            <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                message.isUser
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none font-medium'
                  : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700' : 'bg-slate-100 text-slate-800 rounded-bl-none'
              }`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-[9px] mt-2 font-bold uppercase tracking-widest opacity-50`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl rounded-bl-none px-6 py-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-5 border-t ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex flex-wrap gap-2 mb-4">
            {predefinedQuestions.map((q, i) => (
              <button 
                key={i} 
                onClick={() => handleSend(q)} 
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder="Tulis pesan..."
              className={`w-full pl-5 pr-16 py-4 rounded-2xl outline-none transition-all resize-none font-medium text-sm ${
                isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500' : 'bg-white border-slate-200 focus:ring-2 focus:ring-purple-500'
              }`}
              rows={1}
            />
            <button
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}