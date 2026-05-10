# ☕ SmartPOS — Platform POS untuk F&B Indonesia

<div align="center">

![SmartPOS Landing Page Dark](./docs/landing-dark.png)

*Platform Point of Sale modern untuk kedai kopi dan restoran F&B Indonesia*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-smartpos--cafe.vercel.app-orange?style=for-the-badge&logo=vercel)](https://smartpos-cafe.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-purple?style=for-the-badge&logo=railway)](https://railway.app)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

</div>

---

## 📸 Screenshots


### Point of Sale (POS)

 ![POS Dark](./docs/pos-dark.png)

### Product Management

 ![Product Dark](./docs/product-dark.png) 


 ![Insight Dark](./docs/insight-dark.png) 


 ![Dashboard Dark](./docs/insight-dark.png) 

---

## 🌟 Fitur Utama

### 🧾 Smart Point of Sale
- Antarmuka kasir yang cepat dan intuitif
- Dukungan **Quick Pay** untuk transaksi tunai instan
- Manajemen pesanan **Dine-in** (dengan nomor meja) dan **Take-away**
- Toggle pajak per transaksi
- Tambah item manual untuk pesanan custom
- Promo & diskon otomatis diterapkan ke produk

### 📊 Business Insight AI
- Chatbot terintegrasi (Ask AI) untuk analisis bisnis real-time
- Ringkasan mingguan: revenue, total transaksi, avg ticket
- Analisis tren harian dan performa menu
- Identifikasi produk terlaris dan jam ramai
- Laporan waste loss dan efisiensi biaya

### 🗑️ Precision Waste Logging
- Pencatatan bahan baku terbuang (susu, kopi, dll)
- Konversi otomatis ke nilai rupiah
- Pengaruh langsung ke kalkulasi HPP
- **Owner**: Full CRUD (input, edit, hapus)
- **Kasir**: Input only

### 🏷️ Promo Engine
- Diskon dinamis per produk (persentase)
- Badge promo tampil di POS dan product list
- Validasi otomatis: harga promo vs harga normal
- Indikator "Best Seller" berdasarkan data transaksi

### 👥 Role-Based Access Control
- **Owner/Manager**: Akses penuh ke semua fitur
- **Kasir**: Akses terbatas ke POS, Waste Log, Riwayat, Settings pribadi
- Pembuatan akun kasir oleh owner
- Reset password kasir dari User Management

### ⏱️ Shift Management
- Buka shift dengan modal awal (opening cash)
- Tutup shift dengan perhitungan selisih kas otomatis
- Laporan per shift: total transaksi, penjualan, selisih
- Owner dapat melihat riwayat semua shift semua kasir

### 🔄 Void Request System
- Kasir mengajukan pembatalan transaksi dengan alasan
- Owner menyetujui atau menolak request void
- Badge notifikasi di sidebar owner
- Data shift otomatis terkoreksi setelah void disetujui

### 🎨 Dark Espresso UI
- Antarmuka modern dengan estetika khas kedai kopi premium
- Toggle dark/light mode
- Responsive design untuk desktop dan tablet
- Sidebar collapsible dengan flyout menu

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vercel)                  │
│              React + TypeScript + Tailwind            │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │  Theme   │  │     Settings     │  │
│  │ Context  │  │ Context  │  │     Context      │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│  ┌──────────┐  ┌──────────┐                         │
│  │  Shift   │  │   App    │                         │
│  │ Context  │  │ Context  │                         │
│  └──────────┘  └──────────┘                         │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS + httpOnly Cookie (JWT)
┌────────────────────▼────────────────────────────────┐
│                  BACKEND (Railway)                   │
│              Node.js + TypeScript + Express           │
│                                                      │
│  /auth    /pos    /settings    /shifts    /users     │
│  /transactions    /app    /waste-logs                │
└────────────────────┬────────────────────────────────┘
                     │ SSL Connection
┌────────────────────▼────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)           │
│                  Schema: coffeepos                   │
│                                                      │
│  shops │ users │ products │ transactions             │
│  transaction_items │ waste_logs │ shifts             │
│  shop_settings │ customers                           │
└─────────────────────────────────────────────────────┘
```

---

## 🗂️ Struktur Project

```
Point-of-Sale/
├── Back-End/
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts              # PostgreSQL connection pool
│   │   │   └── with-transaction.ts  # DB transaction helper
│   │   ├── http/
│   │   │   ├── errors.ts            # Custom error classes
│   │   │   └── validate.ts          # Request validation
│   │   ├── routes/
│   │   │   ├── auth.ts              # Login, register, JWT
│   │   │   ├── pos.ts               # Quote & checkout
│   │   │   ├── app.ts               # App state & dashboard data
│   │   │   ├── transactions.ts      # History, void requests
│   │   │   ├── shifts.ts            # Shift open/close/report
│   │   │   ├── settings.ts          # Shop settings (dynamic tax)
│   │   │   ├── users.ts             # Cashier management
│   │   │   └── waste-logs.ts        # Waste logging
│   │   ├── app.ts                   # Express app + CORS
│   │   ├── env.ts                   # Environment validation
│   │   └── server.ts                # Entry point
│   ├── migrations/
│   │   ├── schema.sql               # Initial schema
│   │   ├── sprint5-void.sql         # Void system migration
│   │   └── sprint6-settings.sql     # Shop settings migration
│   └── package.json
│
└── Front-End/
    ├── src/
    │   ├── components/
    │   │   ├── Layout/              # Sidebar, SidebarItem, etc.
    │   │   ├── pos/                 # POS components
    │   │   ├── shift/               # Shift modals
    │   │   ├── transactions/        # History, void modals
    │   │   ├── users/               # Cashier management modals
    │   │   └── common/              # Shared components
    │   ├── contexts/
    │   │   ├── AuthContext.tsx       # JWT + user state
    │   │   ├── ThemeContext.tsx      # Dark/light mode
    │   │   ├── ShiftContext.tsx      # Active shift state
    │   │   ├── SettingsContext.tsx   # Shop settings (dynamic)
    │   │   └── AppContext.tsx        # App-wide state
    │   ├── pages/
    │   │   ├── Dashboard/           # Owner analytics dashboard
    │   │   ├── Dashboard/CashierDashboard.tsx
    │   │   ├── PointOfSale/         # POS interface
    │   │   ├── BusinessInsights/    # AI insights
    │   │   ├── Operation/           # Products, Waste, Inventory
    │   │   ├── Customers/           # Members & loyalty
    │   │   ├── TransactionHistory/  # Owner & cashier history
    │   │   ├── Shifts/              # Shift reports
    │   │   ├── UserManagement/      # Cashier accounts
    │   │   ├── Settings/            # Dynamic settings
    │   │   └── Auth/                # Login & register
    │   ├── services/
    │   │   ├── appApi.ts            # General API calls
    │   │   └── posApi.ts            # POS-specific API
    │   └── types/
    │       ├── index.ts             # Core type definitions
    │       └── navigation.ts        # Navigation types
    └── package.json
```

---

## 🔐 Role & Akses

| Fitur | Owner | Kasir |
|-------|-------|-------|
| Dashboard | ✅ Analitik penuh | ✅ Ringkasan shift |
| Point of Sale | ✅ Penuh | ✅ Penuh |
| Business Insight AI | ✅ Aktif | ❌ Tersembunyi |
| Waste Log | ✅ Full CRUD | ✅ Input only |
| Product Management | ✅ Full CRUD | ❌ Tersembunyi |
| User Management | ✅ Buat/nonaktifkan kasir | ❌ Tersembunyi |
| Shift Management | ✅ Lihat laporan semua shift | ✅ Buka & tutup shift |
| Riwayat Transaksi | ✅ Semua waktu + filter | ✅ Hari ini saja |
| Void Request | ✅ Approve/reject | ✅ Ajukan request |
| Settings | ✅ Pengaturan toko lengkap | ✅ Profil & password |
| Inventory & Cost | ✅ Penuh | ❌ Tersembunyi |

---

## 🚀 Alur Penggunaan

### Owner Journey
```
Register Toko Baru (Landing Page)
    ↓
Sistem buat: shop_id + akun owner
    ↓
Login → Dashboard (analitik penuh)
    ↓
User Management → Buat akun kasir
    ↓
Settings → Atur pajak, service charge, struk
    ↓
Monitor: Laporan Shift + Riwayat Transaksi
    ↓
Approve/Reject Void Request dari kasir
```

### Kasir Journey
```
Login (akun dibuat owner)
    ↓
CashierDashboard → ShiftOpenModal
    ↓
Input modal awal → Shift aktif
    ↓
Point of Sale → Proses transaksi
    ↓
Waste Log → Catat bahan terbuang
    ↓
Riwayat → Cek transaksi hari ini
    ↓
"Tutup Shift" → Input uang laci
    ↓
Lihat selisih kas → Submit → Logout
```

---

## ⚙️ Setup & Development

### Prerequisites
- Node.js v18+
- PostgreSQL (atau Supabase account)
- npm atau yarn

### Backend Setup

```bash
cd Back-End
npm install

# Copy env example
cp .env.example .env

# Edit .env dengan credentials kamu
nano .env
```

Isi `.env`:
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@host:5432/postgres
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
```

Jalankan migration database:
```bash
# Di Supabase SQL Editor atau psql:
psql $DATABASE_URL -f migrations/schema.sql
psql $DATABASE_URL -f migrations/sprint5-void.sql
psql $DATABASE_URL -f migrations/sprint6-settings.sql
```

Jalankan server:
```bash
npm run dev
# Server berjalan di http://localhost:4000
```

### Frontend Setup

```bash
cd Front-End
npm install

# Copy env example
cp .env.example .env
```

Isi `.env`:
```env
VITE_API_BASE_URL=http://localhost:4000
```

Jalankan development server:
```bash
npm run dev
# App berjalan di http://localhost:5173
```

---

## 🌐 Deployment

### Backend → Railway

1. Push kode ke GitHub
2. Buat project baru di [Railway](https://railway.app)
3. Connect repository
4. Set environment variables di Railway dashboard
5. Railway otomatis deploy setiap push ke `main`

### Frontend → Vercel

1. Push kode ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Set environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend.up.railway.app
   ```
4. Deploy → Vercel otomatis deploy setiap push

---

## 🗄️ Database Schema

### Tabel Utama

```sql
-- Toko
coffeepos.shops (id, name, slug, address, phone, logo_url, plan)

-- Pengguna (Owner + Kasir)
coffeepos.users (id, shop_id, email, password_hash, name, role, pin, is_active)

-- Produk
coffeepos.products (id, shop_id, name, category, price, cost, stock, discount)

-- Transaksi
coffeepos.transactions (id, shop_id, shift_id, cashier_id, subtotal, tax, 
                        grand_total, payment_method, status, void_*)

-- Item Transaksi
coffeepos.transaction_items (id, transaction_id, product_id, name, price, quantity)

-- Shift
coffeepos.shifts (id, shop_id, cashier_id, opening_cash, closing_cash,
                  expected_cash, cash_difference, total_sales, status)

-- Pengaturan Toko
coffeepos.shop_settings (id, shop_id, tax_enabled, tax_rate, tax_label,
                          service_charge_*, receipt_*, payment_*)

-- Waste Log
coffeepos.waste_logs (id, shop_id, product_id, quantity, reason, loss_amount)
```

---

## 🤖 AI Integration (Business Insight)

Fitur **Ask AI** menggunakan Anthropic Claude API untuk menganalisis data bisnis:

```typescript
// Contoh query ke AI
"Produk apa yang paling menguntungkan minggu ini?"
"Jam berapa biasanya penjualan tertinggi?"
"Bagaimana tren waste log bulan ini?"
```

AI memiliki akses ke:
- Data transaksi (aggregated, bukan raw)
- Performa produk per periode
- Laporan waste dan efisiensi
- Tren pendapatan harian/mingguan

---

## 📦 Tech Stack

### Frontend
| Technology | Version | Kegunaan |
|-----------|---------|----------|
| React | 18+ | UI Framework |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Styling |
| React Router | 6+ | Routing |
| Lucide React | Latest | Icons |
| Vite | 5+ | Build tool |

### Backend
| Technology | Version | Kegunaan |
|-----------|---------|----------|
| Node.js | 18+ | Runtime |
| TypeScript | 5+ | Type safety |
| Express | 4+ | Web framework |
| PostgreSQL | 15+ | Database |
| node-postgres (pg) | Latest | DB client |
| bcryptjs | Latest | Password hashing |
| jsonwebtoken | Latest | JWT auth |

### Infrastructure
| Service | Kegunaan |
|---------|----------|
| Supabase | PostgreSQL hosting |
| Railway | Backend hosting |
| Vercel | Frontend hosting |

---

## 🔒 Security

- **JWT** disimpan di **httpOnly Cookie** (tidak accessible via JavaScript)
- **bcrypt** untuk hashing password (12 rounds di production)
- **CORS** whitelist — hanya domain yang terdaftar
- **Role-based middleware** di semua endpoint sensitif
- **shop_id isolation** — setiap query difilter per toko
- **Soft delete** — data tidak pernah dihapus permanen

---

## 📋 Roadmap

### ✅ Selesai
- [x] Multi-tenant architecture (per toko)
- [x] Role-based access (Owner & Kasir)
- [x] Point of Sale dengan promo engine
- [x] Shift management
- [x] Void request system
- [x] Business Insight AI
- [x] Transaction history
- [x] User management
- [x] Dynamic settings (pajak, service charge)

### 🚧 Dalam Pengembangan
- [ ] Dynamic settings UI (Sprint 6)
- [ ] Bluetooth thermal printer
- [ ] PIN untuk konfirmasi aksi sensitif

### 📅 Planned
- [ ] Multi-toko per owner
- [ ] Mobile app (React Native)
- [ ] WhatsApp struk digital
- [ ] Inventory management (bahan baku)
- [ ] Supplier management
- [ ] Laporan keuangan lengkap (P&L)
- [ ] Export Excel/PDF

---

## 🤝 Contributing

Project ini masih dalam pengembangan aktif. Untuk kontribusi:

1. Fork repository
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## 📄 License

MIT License — lihat file [LICENSE](./LICENSE) untuk detail.

---`

<div align="center">

**Dibuat dengan ☕ untuk F&B Indonesia**

[Live Demo](https://smartpos-cafe.vercel.app) · [Report Bug](https://github.com/username/point-of-sale/issues) · [Request Feature](https://github.com/username/point-of-sale/issues)

</div>
