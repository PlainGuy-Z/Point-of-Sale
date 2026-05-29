/** API shape from GET /transactions — matches web frontend types exactly */

export type HistoryOrderType = 'dine_in' | 'takeaway';
export type HistoryPaymentLabel = 'Cash' | 'QRIS' | 'Transfer';
export type HistoryTransactionStatus = 'completed' | 'pending_void' | 'voided';

export interface HistoryLineItem {
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  variant_name?: string | null;
  variant_price?: number | null;
  notes?: string | null;
}

export interface HistoryTransaction {
  id: string;
  created_at: string;
  status: HistoryTransactionStatus;
  cashier_id: string | null;
  cashier_name: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  table_number?: string | null;
  order_type: HistoryOrderType;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  tax_rate?: number;
  service_charge?: number;
  service_amount?: number;
  total_amount: number;
  payment_method: HistoryPaymentLabel;
  amount_paid?: number | null;
  change_amount?: number | null;
  raw_payment_method?: string | null;
  items: HistoryLineItem[];
  notes?: string | null;
  void_reason?: string | null;
  void_requested_at?: string | null;
  void_reviewed_at?: string | null;
  void_review_note?: string | null;
  shift_id?: string | null;
}

export interface TransactionsListResponse {
  data: HistoryTransaction[];
  pagination: { total: number; page: number; limit: number };
}

export interface TxSummaryToday {
  total_count: number;
  total_sales: number;
  today_count: number;
  today_sales: number;
}

export interface TxSummaryMonth {
  total_count: number;
  total_sales: number;
  month_count: number;
  month_sales: number;
}
