// src/pages/HelpCenter/index.tsx
import React, { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Phone, 
  Clock, 
  Book, 
  Video, 
  Code, 
  ChevronDown, 
  ChevronUp,
  Search,
  Mail,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    category: 'Akun',
    question: 'Bagaimana cara reset password?',
    answer: 'Buka halaman login dan klik "Lupa Password". Ikuti instruksi yang dikirimkan ke email Anda untuk membuat password baru yang aman.',
  },
  {
    category: 'Produk',
    question: 'Bagaimana cara menambah produk baru?',
    answer: 'Navigasikan ke menu "Manajemen Produk", klik tombol "Tambah Produk", lalu isi detail seperti nama, harga, kategori, dan stok awal.',
  },
  {
    category: 'Teknis',
    question: 'Apa persyaratan sistem minimum?',
    answer: 'Sistem CoffeePOS membutuhkan browser modern (Chrome, Edge, atau Safari versi terbaru) dan koneksi internet yang stabil untuk sinkronisasi data.',
  },
  {
    category: 'Laporan',
    question: 'Bagaimana cara melihat laporan harian?',
    answer: 'Anda dapat melihat ringkasan harian di Dashboard Utama atau detail transaksi di menu "Riwayat Transaksi". Laporan lengkap tersedia di menu "Laporan Penjualan".',
  },
  {
    category: 'Shift',
    question: 'Bagaimana cara menutup shift kasir?',
    answer: 'Klik tombol "Tutup Shift" di bagian bawah sidebar. Pastikan Anda telah menghitung saldo kas fisik sebelum mengonfirmasi penutupan shift.',
  },
];

export default function HelpCenter() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const filteredFAQs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-stone-950 text-stone-100' : 'bg-stone-50 text-stone-900'
    } py-12 px-6`}>
      <div className="max-w-6xl mx-auto">
        
        {/* ─── Hero Section ─────────────────────────────────────────────────── */}
        <section className="text-center mb-16">
          <div className={`inline-flex items-center justify-center p-3 rounded-2xl ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-teal-500/10 border-teal-500/20'} mb-6 border`}>
            <HelpCircle className={`w-8 h-8 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Pusat <span className={isDark ? 'text-amber-500' : 'text-teal-600'}>Bantuan</span>
          </h1>
          <p className={`text-lg max-w-2xl mx-auto mb-10 ${isDark ? 'text-stone-400' : 'text-stone-600'}`}>
            Temukan jawaban, panduan penggunaan, dan dukungan teknis untuk mengoptimalkan operasional kedai kopi Anda.
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Cari bantuan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all outline-none ${
                isDark 
                  ? 'bg-stone-900 border-stone-800 text-white placeholder:text-stone-600 focus:ring-amber-500/50' 
                  : 'bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-teal-500/50'
              } focus:ring-2 shadow-xl ${isDark ? 'shadow-amber-500/5' : 'shadow-teal-500/5'}`}
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* ─── Left Column: FAQs ─────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <Zap className={`w-6 h-6 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
              Pertanyaan Populer
            </h2>
            
            <div className="space-y-4">
              {filteredFAQs.map((item, index) => (
                <div 
                  key={index} 
                  className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                    isDark 
                      ? 'bg-stone-900/50 border-stone-800 hover:border-stone-700' 
                      : 'bg-white border-stone-200 hover:border-stone-300'
                  } ${expandedFAQ === index ? (isDark ? 'ring-1 ring-amber-500/30' : 'ring-1 ring-teal-500/30') : ''}`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left p-5 flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        {item.category}
                      </span>
                      <h3 className={`text-base font-semibold group-hover:text-amber-500 transition-colors ${
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      }`}>
                        {item.question}
                      </h3>
                    </div>
                    <div className={`p-2 rounded-xl transition-colors ${
                      expandedFAQ === index 
                        ? (isDark ? 'bg-amber-500 text-white' : 'bg-teal-500 text-white')
                        : isDark ? 'bg-stone-800 text-stone-500' : 'bg-stone-100 text-stone-400'
                    }`}>
                      {expandedFAQ === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>
                  
                  <div className={`transition-all duration-300 ease-in-out ${
                    expandedFAQ === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  } overflow-hidden`}>
                    <div className={`p-5 pt-0 text-sm leading-relaxed ${
                      isDark ? 'text-stone-400' : 'text-stone-600'
                    }`}>
                      <div className={`h-px w-full mb-5 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`} />
                      {item.answer}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredFAQs.length === 0 && (
                <div className="text-center py-12 opacity-50">
                  Tidak ada hasil ditemukan untuk "{searchQuery}"
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Column: Contact & Resources ────────────────────────── */}
          <div className="space-y-8">
            
            {/* Contact Card */}
            <div className={`p-6 rounded-3xl border ${
              isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            } shadow-lg`}>
              <h2 className="text-xl font-bold mb-6">Hubungi Kami</h2>
              <div className="space-y-4">
                <a href="mailto:support@coffepos.com" className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                  isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-tighter">Email</p>
                    <p className="text-sm font-semibold">support@coffepos.com</p>
                  </div>
                </a>
                
                <div className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                  isDark ? 'hover:bg-stone-800 text-stone-300' : 'hover:bg-stone-50 text-stone-700'
                }`}>
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-tighter">WhatsApp</p>
                    <p className="text-sm font-semibold">+62 812-3456-7890</p>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl ${
                  isDark ? 'text-stone-300' : 'text-stone-700'
                }`}>
                  <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-amber-500/10' : 'bg-teal-500/10'} flex items-center justify-center`}>
                    <Clock className={`w-5 h-5 ${isDark ? 'text-amber-500' : 'text-teal-600'}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-tighter">Jam Operasional</p>
                    <p className="text-sm font-semibold">Setiap Hari, 08:00 - 22:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resources Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold px-2">Sumber Daya</h2>
              
              <div className="grid gap-3">
                <button className={`flex items-center gap-3 p-4 rounded-2xl border text-left group transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800 hover:border-stone-700' : 'bg-white border-stone-200 hover:border-stone-300'
                }`}>
                  <Book className="w-5 h-5 text-amber-500" />
                  <span className="flex-1 font-semibold text-sm">Panduan Pengguna (PDF)</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button className={`flex items-center gap-3 p-4 rounded-2xl border text-left group transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800 hover:border-stone-700' : 'bg-white border-stone-200 hover:border-stone-300'
                }`}>
                  <Video className="w-5 h-5 text-amber-500" />
                  <span className="flex-1 font-semibold text-sm">Video Tutorial</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                
                <button className={`flex items-center gap-3 p-4 rounded-2xl border text-left group transition-all ${
                  isDark ? 'bg-stone-900 border-stone-800 hover:border-stone-700' : 'bg-white border-stone-200 hover:border-stone-300'
                }`}>
                  <Code className="w-5 h-5 text-amber-500" />
                  <span className="flex-1 font-semibold text-sm">Dokumentasi API</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer: Quick Start ─────────────────────────────────────────── */}
        <section className={`mt-20 p-8 md:p-12 rounded-[2rem] text-center relative overflow-hidden ${
          isDark ? 'bg-stone-900 border border-stone-800' : 'bg-stone-900 text-white'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4">Butuh Bantuan Langsung?</h2>
            <p className={`text-lg mb-8 max-w-xl mx-auto ${isDark ? 'text-stone-400' : 'text-stone-300'}`}>
              Tim kami siap membantu Anda menyelesaikan kendala teknis atau pertanyaan seputar penggunaan aplikasi.
            </p>
            <button className={`inline-flex items-center gap-2 ${isDark ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20'} text-stone-900 font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg`}>
              <MessageSquare className="w-5 h-5" />
              Chat Support Sekarang
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}