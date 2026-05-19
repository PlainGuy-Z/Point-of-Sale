import { QRCodeSVG } from 'qrcode.react';
import { Printer, QrCode } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * QR Code Menu Component - Untuk ditampilkan di Settings/Dashboard
 * Render QR Code yang mengarah ke halaman publik /menu
 */
export default function QRCodeMenuCard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Generate menu URL
  const menuUrl = `${window.location.origin}/menu`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Silakan izinkan popup untuk membuka jendela cetak');
      return;
    }

    const qrElement = document.getElementById('qr-code-svg');
    if (!qrElement) return;

    const svgString = new XMLSerializer().serializeToString(qrElement as unknown as SVGElement);
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Menu QR Code</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              padding: 2rem;
            }
            .container {
              text-align: center;
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              border: 1px solid #e5e7eb;
            }
            h1 {
              font-size: 2rem;
              font-weight: bold;
              margin-bottom: 0.5rem;
              color: #1f2937;
            }
            p {
              color: #6b7280;
              margin-bottom: 1.5rem;
              font-size: 0.95rem;
            }
            svg {
              margin: 1rem 0;
              border: 2px solid #f3f4f6;
              padding: 1rem;
              background: white;
            }
            .footer {
              color: #9ca3af;
              font-size: 0.85rem;
              margin-top: 1.5rem;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .container {
                border: none;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Daftar Menu Digital</h1>
            <p>Scan QR Code untuk melihat menu online</p>
            ${svgString}
            <p class="footer">Silakan letakkan QR Code ini di meja atau dinding untuk kemudahan pelanggan</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className={`rounded-3xl border-2 overflow-hidden transition-all ${
      isDark
        ? 'bg-gradient-to-br from-stone-900 to-stone-800 border-amber-500/30 hover:border-amber-500/50'
        : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-500/30 hover:border-teal-500/50'
    }`}>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            isDark
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-teal-500/10 text-teal-600'
          }`}>
            <QrCode size={24} />
          </div>
          <div>
            <h3 className={`text-lg sm:text-xl font-black ${
              isDark ? 'text-white' : 'text-[#0F172A]'
            }`}>
              QR Code Menu Digital
            </h3>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-stone-400' : 'text-teal-700'}`}>
              Bagikan menu ke pelanggan
            </p>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm mb-6 ${isDark ? 'text-stone-400' : 'text-[#475569]'}`}>
          💡 Cetak dan letakkan QR Code ini di meja agar pelanggan bisa melihat menu secara mandiri melalui perangkat mereka.
        </p>

        {/* QR Code Section */}
        <div className={`flex justify-center p-6 rounded-2xl mb-6 ${
          isDark
            ? 'bg-stone-900/60 border border-stone-800'
            : 'bg-white border-2 border-teal-200'
        }`}>
          <QRCodeSVG
            id="qr-code-svg"
            value={menuUrl}
            size={256}
            level="H"
            includeMargin={true}
            bgColor={isDark ? '#1c1917' : '#ffffff'}
            fgColor={isDark ? '#fbbf24' : '#0d9488'}
          />
        </div>

        {/* URL Display */}
        <div className={`p-4 rounded-2xl mb-6 ${
          isDark
            ? 'bg-stone-800/50 border border-stone-700'
            : 'bg-teal-100/40 border border-teal-200'
        }`}>
          <p className={`text-[10px] sm:text-xs font-bold uppercase mb-2 ${
            isDark ? 'text-stone-500' : 'text-teal-700'
          }`}>
            Menu URL
          </p>
          <p className={`text-xs sm:text-sm break-all font-mono ${
            isDark ? 'text-amber-400' : 'text-teal-900 font-semibold'
          }`}>
            {menuUrl}
          </p>
        </div>

        {/* Instructions */}
        <div className={`space-y-2 mb-6 p-4 rounded-2xl ${
          isDark
            ? 'bg-stone-900/60 border border-stone-800'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-xs sm:text-sm font-bold ${
            isDark ? 'text-blue-400' : 'text-blue-700'
          }`}>
            ✓ Cara Menggunakan:
          </p>
          <ol className={`text-xs space-y-1 ml-4 list-decimal ${
            isDark ? 'text-stone-400' : 'text-[#475569]'
          }`}>
            <li>Klik tombol "Cetak QR Code"</li>
            <li>Pilih printer atau simpan sebagai PDF</li>
            <li>Cetak foto QR Code dengan ukuran minimal A6 (10 x 15 cm)</li>
            <li>Laminating/plastik untuk durabilitas</li>
            <li>Letakkan di meja atau dekat pintu masuk</li>
          </ol>
        </div>

        {/* Print Button */}
        <button
          onClick={handlePrint}
          className={`w-full flex items-center justify-center gap-3 py-3 sm:py-4 px-4 rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-95 ${
            isDark
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40'
              : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40'
          }`}
        >
          <Printer size={20} />
          Cetak QR Code
        </button>

        {/* Additional Info */}
        <p className={`text-xs mt-4 text-center ${
          isDark ? 'text-stone-500' : 'text-[#94A3B8]'
        }`}>
          QR Code ini mengarahkan ke halaman menu publik tanpa perlu login
        </p>
      </div>
    </div>
  );
}
