# 📋 CONTOH IMPLEMENTASI: Tambahkan QRCodeMenuCard ke Settings Page

> Pilih salah satu opsi di bawah ini untuk mengintegrasikan QRCodeMenuCard ke aplikasi Anda.

---

## OPSI 1: Tambahkan ke ProfileSection (⭐ Rekomendasi)

**File:** `src/pages/Settings/sections/ProfileSection.tsx`

Tambahkan code di bagian bawah section:

```tsx
import QRCodeMenuCard from '../../../components/pos/QRCodeMenuCard';

// ... kode ProfileSection yang sudah ada ...

export default function ProfileSection() {
  return (
    <>
      {/* Existing profile content */}
      {/* ... */}

      {/* ──────────────────────────────────────────────────────────────
          TAMBAHKAN BAGIAN INI DI AKHIR ProfileSection
      ────────────────────────────────────────────────────────────── */}
      <div className="mt-12 pt-12 border-t border-[#E2E8F0] dark:border-stone-800">
        <div className="mb-6">
          <h3 className="text-lg font-black dark:text-white">🎯 Menu Digital</h3>
          <p className="text-sm text-[#64748B] dark:text-stone-400 mt-1">
            Kelola QR Code untuk halaman menu publik pelanggan
          </p>
        </div>
        <QRCodeMenuCard />
      </div>
    </>
  );
}
```

---

## OPSI 2: Buat Section Baru MenuQRSection

**File:** `src/pages/Settings/sections/MenuQRSection.tsx` (BUAT FILE BARU)

```tsx
import QRCodeMenuCard from '../../../components/pos/QRCodeMenuCard';
import { QrCode } from 'lucide-react';

export default function MenuQRSection() {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-900/20 flex items-center justify-center">
          <QrCode size={18} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-black dark:text-white">Menu Digital QR Code</h2>
          <p className="text-xs text-[#64748B] dark:text-stone-400">
            Bagikan menu ke pelanggan melalui QR Code
          </p>
        </div>
      </div>

      {/* QR Code Card */}
      <QRCodeMenuCard />
    </div>
  );
}
```

Kemudian di `src/pages/Settings/index.tsx`, tambahkan:

```tsx
import MenuQRSection from './sections/MenuQRSection';

// ... di dalam bagian sections
<div className="space-y-8">
  {/* ... sections lainnya ... */}
  <MenuQRSection />
</div>
```

---

## OPSI 3: Tambahkan ke CashierSettings (Untuk Kasir)

**File:** `src/pages/Settings/CashierSettings.tsx`

Tambahkan di bagian bawah:

```tsx
import QRCodeMenuCard from '../../components/pos/QRCodeMenuCard';

// ... kode CashierSettings yang sudah ada ...

export default function CashierSettings() {
  return (
    <>
      {/* ... existing sections ... */}

      {/* ──────────────────────────────────────────────────────────────
          TAMBAHKAN BAGIAN INI DI AKHIR CashierSettings
      ────────────────────────────────────────────────────────────── */}
      <div className="mt-12 pt-12 border-t border-[#E2E8F0] dark:border-stone-800">
        <div className="mb-6">
          <h3 className="text-lg font-black dark:text-white">📱 Menu Digital Pelanggan</h3>
          <p className="text-sm text-[#64748B] dark:text-stone-400 mt-1">
            Cetak QR Code untuk ditampilkan di meja
          </p>
        </div>
        <QRCodeMenuCard />
      </div>
    </>
  );
}
```

---

## OPSI 4: Tambahkan ke Dashboard Owner (Paling Prominent)

**File:** `src/pages/Dashboard/index.tsx`

```tsx
import QRCodeMenuCard from '../../components/pos/QRCodeMenuCard';

export default function Dashboard() {
  return (
    <>
      {/* ... existing dashboard content ... */}

      {/* ──────────────────────────────────────────────────────────────
          TAMBAHKAN BAGIAN INI DI BAGIAN BAWAH
      ────────────────────────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="mb-6">
          <h2 className="text-2xl font-black mb-2">🎯 Menu Digital QR Code</h2>
          <p className="text-[#64748B] dark:text-stone-400">
            Cetak dan letakkan QR Code di meja agar pelanggan bisa melihat menu
          </p>
        </div>
        <QRCodeMenuCard />
      </div>
    </>
  );
}
```

---

## OPSI 5: Standalone Modal/Dialog

**File:** `src/components/common/MenuQRModal.tsx` (BUAT FILE BARU)

```tsx
import { X } from 'lucide-react';
import QRCodeMenuCard from '../pos/QRCodeMenuCard';

interface MenuQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MenuQRModal({ isOpen, onClose }: MenuQRModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#E2E8F0] dark:border-stone-800 bg-white dark:bg-stone-900">
          <h2 className="text-xl font-black dark:text-white">Menu Digital QR</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F1F5F9] dark:hover:bg-stone-800 rounded-xl">
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <QRCodeMenuCard />
        </div>
      </div>
    </div>
  );
}
```

Cara pakai di component lain:

```tsx
const [menuQROpen, setMenuQROpen] = useState(false);

<button onClick={() => setMenuQROpen(true)}>Buat QR Code</button>
<MenuQRModal isOpen={menuQROpen} onClose={() => setMenuQROpen(false)} />
```

---

## 📦 Import Yang Diperlukan

Pastikan sudah tambahkan di file yang akan menggunakan QRCodeMenuCard:

```tsx
import QRCodeMenuCard from '../../components/pos/QRCodeMenuCard';
// atau
import QRCodeMenuCard from '../../../components/pos/QRCodeMenuCard';
// (sesuaikan path relatif berdasarkan lokasi file Anda)
```

---

## ⚡ Quick Setup Checklist

```
1. ✅ Install dependency
   npm install qrcode.react

2. ✅ Copy file component
   src/components/pos/QRCodeMenuCard.tsx (sudah ada)

3. ✅ Pilih salah satu opsi di atas

4. ✅ Tambahkan import di file pilihan:
   import QRCodeMenuCard from '../../components/pos/QRCodeMenuCard';

5. ✅ Render component di tempat yang tepat

6. ✅ Test:
   - Buka Settings/Dashboard
   - Lihat QR Code card
   - Klik "Cetak QR Code"

7. ✅ Scan QR Code dengan smartphone untuk test
```

---

## 🎯 Rekomendasi Terbaik

Gunakan **OPSI 1** (Tambahkan ke ProfileSection) karena:
- ✅ Paling mudah diimplementasikan
- ✅ Tidak perlu buat file baru
- ✅ User experience yang alami
- ✅ Cocok untuk owner/admin

---

**Selamat! Siap mengintegrasikan QRCodeMenuCard ke aplikasi Anda!** 🚀
