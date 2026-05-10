# POS System Refaktor - Sprint 6: Cart Item Descriptions & Checkout Form

## 📋 Ringkasan Perubahan

Refaktor komprehensif pada sistem POS untuk mendukung deskripsi per-item, form checkout yang lebih baik, dan sinkronisasi data ke struk/receipt.

---

## ✅ Perubahan yang Telah Dilakukan

### 1. DATABASE SCHEMA UPDATES

#### File: `schema.sql` & `migration-sprint6-cart-refactor.sql`

**Kolom Baru:**
- `transactions.notes` (TEXT) - Untuk menyimpan catatan umum pesanan (order_description)
- `transaction_items.description` (TEXT) - Untuk menyimpan catatan khusus per item (e.g., "Pedas sekali", "Tanpa bawang")

**Perubahan Struktur:**
```sql
-- transactions table
ALTER TABLE coffeepos.transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- transaction_items table
ALTER TABLE coffeepos.transaction_items ADD COLUMN IF NOT EXISTS description TEXT;
```

---

### 2. FRONTEND TYPES & DATA STRUCTURES

#### File: `Front-End/src/types/index.ts`

**TransactionItem Interface Update:**
```typescript
export interface TransactionItem {
  // ... existing fields ...
  description?: string; // ✅ Per-item custom description
}

export interface Transaction {
  // ... existing fields ...
  notes?: string; // ✅ General order notes (order_description)
}
```

#### File: `Front-End/src/services/posApi.ts`

**PosCartLineInput Interface Update:**
```typescript
export interface PosCartLineInput {
  // ... existing fields ...
  description?: string; // ✅ Per-item custom description
}

export interface CreateTransactionRequest {
  // ... existing fields ...
  notes?: string; // ✅ General order notes
}
```

---

### 3. FRONTEND COMPONENTS - NEW

#### File: `Front-End/src/components/pos/CartItemEditModal.tsx` (NEW)

**Fitur:**
- Modal untuk edit item di cart
- Quantity adjustment (+/- buttons)
- Special Instructions textarea (untuk description/catatan khusus)
- Unit price & subtotal display
- Delete item button dengan confirmation
- Character counter (max 100 chars)

**Usage:**
```tsx
<CartItemEditModal
  item={cart[editingItemIndex]}
  itemIndex={editingItemIndex}
  onSave={(updatedItem) => { /* update cart */ }}
  onRemove={() => { /* remove from cart */ }}
  onClose={() => setEditingItemIndex(null)}
/>
```

#### File: `Front-End/src/components/pos/CheckoutDetailsForm.tsx` (NEW)

**Fitur:**
- Customer Name input (required)
- Table Number input (required hanya untuk dine-in)
- Order Notes textarea (optional)
- Order Type display (dine-in/take-away)
- Form validation
- Character counters

**Usage:**
```tsx
<CheckoutDetailsForm
  customerName={customCustomerName}
  tableNumber={tableNumber}
  orderDescription={orderNote}
  orderType={orderType}
  onCustomerNameChange={setCustomCustomerName}
  onTableNumberChange={setTableNumber}
  onOrderDescriptionChange={setOrderNote}
  onClose={() => setCheckoutDetailsFormOpen(false)}
  onSubmit={handleCheckoutDetailsSubmit}
/>
```

---

### 4. FRONTEND PAGE UPDATES

#### File: `Front-End/src/pages/PointOfSale/index.tsx`

**Import Perubahan:**
```typescript
import CartItemEditModal from '../../components/pos/CartItemEditModal';
import CheckoutDetailsForm from '../../components/pos/CheckoutDetailsForm';
```

**State Additions:**
```typescript
const [isCheckoutDetailsFormOpen, setCheckoutDetailsFormOpen] = useState(false);
```

**Flow Perubahan:**
1. User klik item di cart → CartItemEditModal terbuka
2. User bisa edit quantity & add description
3. User klik "Checkout" button → CheckoutDetailsForm terbuka
4. User input customer_name, table_number (if dine-in), order notes
5. User klik "Proceed to Payment" → PaymentModal terbuka
6. User complete payment → ReceiptModal menampilkan semua detail

**Handler Baru:**
```typescript
const handleCheckoutDetailsSubmit = () => {
  if (blockCheckoutForShift()) return;
  setCheckoutDetailsFormOpen(false);
  setPaymentModalOpen(true);
};
```

---

### 5. FRONTEND RECEIPT UPDATES

#### File: `Front-End/src/components/pos/ReceiptModal.tsx`

**Perubahan Display:**

1. **Item Description Display:**
   ```
   1x Espresso - Rp 25,000
   📝 Double shot, Extra hot
   ```

2. **Order Notes Section:**
   ```
   📌 Catatan Pesanan:
   ASAP - Customer celebrating birthday
   ```

3. **Copy Receipt Function:**
   - Sekarang include item descriptions
   - Include order notes di footer

**Formatting:**
- Prices dengan `.toLocaleString('id-ID')` untuk format Rupiah
- Item descriptions dalam italic amber color
- Order notes dalam border section dengan highlight

---

### 6. BACKEND API UPDATES

#### File: `Back-End/src/routes/pos.schemas.ts`

**CartLineSchema Update:**
```typescript
export const CartLineSchema = z.object({
  // ... existing fields ...
  description: z.string().trim().max(200).optional(), // ✅ Per-item description
});

export const QuoteRequestSchema = z.object({
  // ... existing fields ...
  notes: z.string().trim().optional(), // ✅ General order notes
});

export const CreateTransactionRequestSchema = QuoteRequestSchema.extend({
  // ... extends with paymentMethod, etc.
});
```

#### File: `Back-End/src/routes/pos.ts`

**Transaction Insert Update:**
```typescript
const tx = await client.query(
  `INSERT INTO coffeepos.transactions
     (id, subtotal, tax, grand_total, ..., notes, ..., status, ...)
   VALUES ($1::uuid, ..., $9, ..., 'completed', ...)`,
  [
    txId, subtotal, tax, grandTotal, ...,
    body.notes ?? null, // ✅ Include notes
    ...
  ]
);
```

**Transaction Items Insert Update:**
```typescript
const normalizedItems: Array<{
  kind: 'real' | 'manual';
  // ... existing fields ...
  description?: string; // ✅ Include description
}> = [];

// Update INSERT query to include description column
const items = await client.query(
  `INSERT INTO coffeepos.transaction_items
     (id, transaction_id, product_id, name, price, quantity, description, is_custom)
   VALUES ${rowsSql.join(',')}`,
  values
);
```

**Response Update:**
```typescript
return {
  // ... existing fields ...
  items: items.rows.map((r) => ({
    // ... existing fields ...
    description: r.description ?? undefined // ✅ Include in response
  })),
  notes: transaction.notes ?? undefined, // ✅ Include in response
};
```

---

### 7. FRONTEND CONTEXT UPDATE

#### File: `Front-End/src/contexts/AppContext.tsx`

**Checkout Function Update:**
```typescript
const checkout = useCallback(async (params: CheckoutParams) => {
  const { transaction, appState } = await posApi.createTransaction({
    cart: params.cart.map((i) => ({
      // ... existing fields ...
      description: i.description, // ✅ Include description
    })),
    // ... other params ...
    notes: params.notes, // ✅ Include notes
  });
  // ...
}, [refreshState]);
```

---

## 🔄 USER FLOW DIAGRAM

```
┌─────────────────┐
│  Select Items   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Click Item to Edit             │
│  ├─ Change Quantity             │
│  ├─ Add Special Instructions    │
│  └─ Save/Remove                 │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Click "Checkout"                    │
│  ├─ Enter Customer Name (required)   │
│  ├─ Enter Table Number (if dine-in)  │
│  ├─ Add Order Notes (optional)        │
│  └─ "Proceed to Payment"              │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Payment Modal                        │
│  ├─ Select Payment Method             │
│  ├─ Enter Cash (if cash)              │
│  └─ Confirm                           │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Receipt Modal                        │
│  ├─ Header: Customer Name & Table    │
│  ├─ Body: Items with Descriptions    │
│  ├─ Footer: Order Notes & Total      │
│  └─ Print/Copy/Close                 │
└──────────────────────────────────────┘
```

---

## 📊 DATA FLOW EXAMPLE

### Request to Backend (Create Transaction)

```json
{
  "cart": [
    {
      "productId": "uuid-1234",
      "quantity": 2,
      "note": "Espresso",
      "description": "Extra hot, double shot"
    },
    {
      "productId": "manual-xyz",
      "quantity": 1,
      "price": 50000,
      "note": "Custom Item",
      "description": "Special order"
    }
  ],
  "customerName": "Budi Santoso",
  "tableNumber": "5",
  "notes": "ASAP - Birthday celebration",
  "orderType": "dine-in",
  "paymentMethod": "cash",
  "cashReceived": 200000,
  "applyTax": true
}
```

### Response from Backend (Transaction)

```json
{
  "id": "tx-uuid",
  "date": "2026-05-10T14:30:00Z",
  "items": [
    {
      "productId": "uuid-1234",
      "quantity": 2,
      "price": 25000,
      "note": "Espresso",
      "description": "Extra hot, double shot"
    },
    {
      "productId": "manual-xyz",
      "quantity": 1,
      "price": 50000,
      "note": "Custom Item",
      "description": "Special order"
    }
  ],
  "total": 100000,
  "customerName": "Budi Santoso",
  "tableNumber": "5",
  "notes": "ASAP - Birthday celebration",
  "paymentMethod": "cash",
  "orderType": "dine-in"
}
```

---

## 📝 TESTING CHECKLIST

- [ ] Create transaction dengan item descriptions
- [ ] Verify descriptions tersimpan di database
- [ ] Verify descriptions tampil di receipt/print
- [ ] Create transaction dengan order notes
- [ ] Verify notes tersimpan di transactions table
- [ ] Verify notes tampil di receipt
- [ ] Test edit item modal functionality (qty, description)
- [ ] Test checkout form validation
  - [ ] Customer name required
  - [ ] Table number required for dine-in
  - [ ] Table number not required for take-away
  - [ ] Order notes optional
- [ ] Test cash payment with change calculation
- [ ] Test card/QRIS payment
- [ ] Test print receipt with all details
- [ ] Test copy receipt with all details
- [ ] Test with/without tax enabled

---

## 🔧 MIGRATION STEPS

1. **Backup database**
2. **Run migration:**
   ```bash
   psql -U postgres -d coffeepos -f Back-End/migration-sprint6-cart-refactor.sql
   ```
3. **Restart backend server**
4. **Test create transaction flow**
5. **Verify receipt printing**

---

## 💾 FILES MODIFIED/CREATED

### Backend
- ✅ `schema.sql` - Updated with notes and description columns
- ✅ `migration-sprint6-cart-refactor.sql` - New migration file
- ✅ `src/routes/pos.schemas.ts` - Updated validation schemas
- ✅ `src/routes/pos.ts` - Updated transaction creation logic

### Frontend
- ✅ `src/types/index.ts` - Updated interfaces
- ✅ `src/services/posApi.ts` - Updated API contracts
- ✅ `src/pages/PointOfSale/index.tsx` - Updated page flow
- ✅ `src/components/pos/CartItemEditModal.tsx` - NEW component
- ✅ `src/components/pos/CheckoutDetailsForm.tsx` - NEW component
- ✅ `src/components/pos/ReceiptModal.tsx` - Updated display logic
- ✅ `src/contexts/AppContext.tsx` - Updated checkout handler

---

## 🎨 UI/UX IMPROVEMENTS

1. **Better Item Management:**
   - Click item to edit (not modal popup)
   - Easy quantity adjustment
   - Add special instructions inline

2. **Smoother Checkout:**
   - Dedicated form for customer info
   - Clear validation feedback
   - No required fields surprises

3. **Better Receipt:**
   - Customer name & table number prominent
   - Item-specific notes visible
   - Order notes in separate section
   - Better formatting for readability

---

## 🚀 FUTURE ENHANCEMENTS

1. Template untuk special instructions common (Pedas, Tanpa, Extra, dll)
2. Auto-suggest based on item type
3. Kitchen printer integration untuk order notes
4. Customer history untuk repeat instructions
5. Analytics untuk common customizations

---

## 📞 SUPPORT

Jika ada pertanyaan atau issues, mohon check:
1. Database migration sudah berjalan
2. Backend restart setelah migration
3. Browser cache cleared
4. Network requests logged di browser console

