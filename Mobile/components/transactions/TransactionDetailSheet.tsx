import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { X } from 'lucide-react-native';
import type { HistoryTransaction } from '../../types/historyTransaction';
import type { PrintReceiptData } from '../../types/receipt';
import StatusBadge from './StatusBadge';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import { formatDateTime } from '../../utils/dateFormatter';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePrinter } from '../../contexts/PrinterContext';
import { getEffectivePrice } from '../../utils/priceUtils';

interface TransactionDetailSheetProps {
  transaction: HistoryTransaction;
  userRole: 'cashier' | 'owner';
  visible: boolean;
  onClose: () => void;
  onVoidRequest?: () => void;
  onVoidApprove?: () => void;
  onVoidReject?: () => void;
}

function fmtWIB(iso: string): string {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return formatDateTime(iso);
  }
}

export default function TransactionDetailSheet({
  transaction: t,
  userRole,
  visible,
  onClose,
  onVoidRequest,
  onVoidApprove,
  onVoidReject,
}: TransactionDetailSheetProps) {
  const { settings, products } = useApp();
  const { user } = useAuth();
  const { printReceipt, config, isPrinting: printerBusy } = usePrinter();
  const isDark = (settings as any)?.theme === 'dark'; // fallback below
  const c = getColors(isDark);

  const resolvedItems = useMemo(() => {
    return (t.items || []).map(item => {
      let variantName = item.variant_name;
      let variantPrice = item.variant_price || 0;
      let price = item.unit_price;
      let notes = item.notes || '';

      // 1. Always extract/clean brackets from notes if present
      if (notes) {
        const match = notes.match(/\[(.*?)\]/);
        if (match) {
          const rawVariant = match[1];
          if (!variantName) {
            if (rawVariant.includes('@')) {
              const [vName, vPriceStr] = rawVariant.split('@');
              variantName = vName.trim();
              const parsedVal = parseInt(vPriceStr, 10);
              if (!isNaN(parsedVal) && parsedVal > 0) {
                variantPrice = parsedVal;
              }
            } else {
              variantName = rawVariant;
            }
          }
          notes = notes.replace(/\[(.*?)\]/, '').trim();
          
          // Clean up any remaining leading/trailing dashes and whitespace
          if (notes.startsWith('-')) notes = notes.substring(1).trim();
          if (notes.endsWith('-')) notes = notes.substring(0, notes.length - 1).trim();
        }
      }

      // 2. For all items (manual and catalog): if variantPrice > 0 (resolved from brackets),
      // subtract it from the combined price to get the correct base price.
      if (variantPrice > 0 && price >= variantPrice) {
        price = price - variantPrice;
      } else if (variantPrice === 0 && products) {
        // Fallback for old catalog items: compare with product catalog to extract variant surcharge
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          const effectivePrice = getEffectivePrice(product).price;
          if (price > effectivePrice) {
            variantPrice = price - effectivePrice;
            price = effectivePrice;
          }
        }
      }

      // If variant name exists but variantPrice is still 0 (cannot split), disable variant display
      if (variantName && variantPrice === 0) {
        variantName = undefined;
      }

      return {
        ...item,
        unit_price: price,
        variant_name: variantName,
        variant_price: variantPrice,
        notes: notes || undefined,
      };
    });
  }, [t.items, products]);

  const [isPrinting, setIsPrinting] = useState(false);

  const isDine = t.order_type !== 'takeaway';
  const subtotal = useMemo(() => {
    return resolvedItems.reduce((sum, item) => sum + (item.unit_price + (item.variant_price || 0)) * item.quantity, 0);
  }, [resolvedItems]);
  const discount = t.discount_amount ?? 0;
  const taxAmount = t.tax_rate ? Math.round(subtotal * (t.tax_rate / 100)) : (t.tax_amount ?? 0);
  const serviceAmount = t.service_charge ?? t.service_amount ?? 0;
  const total = subtotal + taxAmount + serviceAmount - discount;
  const isCash =
    String(t.payment_method).toLowerCase() === 'cash' ||
    String(t.raw_payment_method || '').toLowerCase() === 'cash';

  const handlePrint = useCallback(async () => {
    setIsPrinting(true);
    try {
      const receiptData: PrintReceiptData = {
        shopName: (settings as any)?.storeName || user?.shop?.name || 'Toko',
        shopAddress: (settings as any)?.address,
        shopPhone: (settings as any)?.phone,
        transactionId: t.id,
        createdAt: t.created_at,
        cashierName: t.cashier_name || undefined,
        orderType: t.order_type === 'takeaway' ? 'takeaway' : 'dine_in',
        tableNumber: isDine ? (t.table_number?.trim() || undefined) : undefined,
        customerName: t.customer_name?.trim() || undefined,
        notes: t.notes || undefined,
        items: resolvedItems.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          price: item.unit_price,
          subtotal: item.subtotal,
          variantName: item.variant_name || undefined,
          variantPrice: item.variant_price || undefined,
          notes: item.notes || undefined,
        })),
        subtotal,
        tax: taxAmount,
        taxRate: t.tax_rate ?? 0,
        serviceCharge: serviceAmount || undefined,
        grandTotal: total,
        paymentMethod: String(t.raw_payment_method || t.payment_method || 'cash').toLowerCase(),
        amountPaid: isCash ? (t.amount_paid ?? total) : undefined,
        change: isCash ? (t.change_amount ?? 0) : undefined,
        receiptFooter: (settings as any)?.receiptFooter,
        paperSize: config.paperSize,
      };

      const result = await printReceipt(receiptData);
      if (!result.success) {
        Alert.alert('Gagal Print', result.error || 'Tidak dapat mencetak struk.', [{ text: 'OK' }]);
      }
    } catch {
      Alert.alert('Error', 'Terjadi kesalahan saat mencetak.');
    } finally {
      setIsPrinting(false);
    }
  }, [t, settings, user, config, printReceipt, subtotal, taxAmount, serviceAmount, total, isCash, isDine]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.bgCard }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: c.textMuted }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: c.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: c.text }]}>Detail Transaksi</Text>
              <Text style={[styles.idText, { color: c.textMuted }]} numberOfLines={1}>
                #{t.id}
              </Text>
              <StatusBadge status={t.status} isDark={isDark} size="md" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* ── Info Transaksi ── */}
            <Text style={[styles.sectionTitle, { color: c.accent }]}>Info Transaksi</Text>
            <View style={[styles.infoGrid]}>
              <InfoCard label="Tanggal & Waktu" value={fmtWIB(t.created_at)} c={c} />
              <InfoCard label="Kasir" value={t.cashier_name || '-'} c={c} />
              <InfoCard label="Pelanggan" value={t.customer_name?.trim() || 'Umum'} c={c} />
              <InfoCard
                label="Tipe Order"
                value={isDine ? `Dine-in (Meja ${t.table_number?.trim() || '-'})` : 'Take-away'}
                c={c}
              />
              <InfoCard label="Metode Bayar" value={String(t.payment_method)} c={c} full />
              {t.notes ? <InfoCard label="Catatan Pesanan" value={t.notes} c={c} full /> : null}
            </View>

            {/* ── Detail Produk ── */}
            <Text style={[styles.sectionTitle, { color: c.accent, marginTop: 20 }]}>Detail Produk</Text>
            <View style={[styles.productsBox, { borderColor: c.border }]}>
              {/* Table header */}
              <View style={[styles.prodHeader, { backgroundColor: c.bgInput }]}>
                <Text style={[styles.prodHeaderText, { color: c.textMuted, flex: 2 }]}>Produk</Text>
                <Text style={[styles.prodHeaderText, { color: c.textMuted, width: 40, textAlign: 'center' }]}>Qty</Text>
                <Text style={[styles.prodHeaderText, { color: c.textMuted, flex: 1, textAlign: 'right' }]}>Subtotal</Text>
              </View>
              {resolvedItems.map((item, i) => (
                <View key={i} style={[styles.prodRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.prodName, { color: c.text }]}>{item.product_name}</Text>
                    <Text style={[styles.prodPrice, { color: c.textMuted }]}>
                      @{formatRupiah(item.unit_price)}
                    </Text>
                    {item.variant_name ? (
                      <Text style={[styles.prodVariant, { color: isDark ? '#fbbf24' : '#d97706' }]}>
                        + {item.variant_name} {item.variant_price ? formatRupiah(item.variant_price) : ''}
                      </Text>
                    ) : null}
                    {item.notes ? (
                      <Text style={[styles.prodNote, { color: c.textMuted }]}>
                        {item.notes}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.prodQty, { color: c.text }]}>{item.quantity}</Text>
                  <Text style={[styles.prodSubtotal, { color: c.text }]}>
                    {formatRupiah(item.subtotal)}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── Ringkasan Harga ── */}
            <View style={[styles.summaryBox, { backgroundColor: c.bgInput, borderColor: c.border }]}>
              <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} c={c} />
              {discount > 0 && (
                <SummaryRow label="Diskon" value={`- ${formatRupiah(discount)}`} c={c} isRed />
              )}
              {taxAmount > 0 && (
                <SummaryRow
                  label={`Pajak${t.tax_rate ? ` (${t.tax_rate}%)` : ''}`}
                  value={formatRupiah(taxAmount)}
                  c={c}
                />
              )}
              {serviceAmount > 0 && (
                <SummaryRow label="Service" value={formatRupiah(serviceAmount)} c={c} />
              )}
              <View style={[styles.totalDivider, { borderTopColor: c.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: c.text }]}>Total</Text>
                <Text style={[styles.totalValue, { color: c.accent }]}>{formatRupiah(total)}</Text>
              </View>
              {isCash && (
                <>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.cashLabel, { color: c.textMuted }]}>Bayar</Text>
                    <Text style={[styles.cashValue, { color: c.text }]}>
                      {formatRupiah(Number(t.amount_paid ?? total))}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.cashLabel, { color: c.textMuted }]}>Kembalian</Text>
                    <Text style={[styles.cashValue, { color: c.text }]}>
                      {formatRupiah(Number(t.change_amount ?? 0))}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* ── Informasi Void ── */}
            {t.status !== 'completed' && (
              <View style={[styles.voidBox, {
                borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(217,119,6,0.25)',
                backgroundColor: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(217,119,6,0.05)',
              }]}>
                <Text style={[styles.voidTitle, { color: isDark ? '#fbbf24' : '#92400e' }]}>
                  Informasi Pembatalan
                </Text>
                {t.status === 'pending_void' && (
                  <>
                    <VoidInfoRow label="Alasan Void" value={t.void_reason || '-'} c={c} />
                    <VoidInfoRow label="Diajukan" value={t.void_requested_at ? fmtWIB(t.void_requested_at) : '-'} c={c} />
                    <Text style={[styles.voidPending, { color: isDark ? '#fbbf24' : '#d97706' }]}>
                      Status: Menunggu persetujuan owner
                    </Text>
                  </>
                )}
                {t.status === 'voided' && (
                  <>
                    <VoidInfoRow label="Alasan Void" value={t.void_reason || '-'} c={c} />
                    <VoidInfoRow label="Diajukan" value={t.void_requested_at ? fmtWIB(t.void_requested_at) : '-'} c={c} />
                    <VoidInfoRow label="Disetujui" value={t.void_reviewed_at ? fmtWIB(t.void_reviewed_at) : '-'} c={c} />
                    <VoidInfoRow label="Catatan" value={t.void_review_note || '—'} c={c} />
                  </>
                )}
              </View>
            )}

            {/* ── Action Buttons ── */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.printBtn, { backgroundColor: c.accent }]}
                onPress={handlePrint}
                disabled={isPrinting || printerBusy}
                activeOpacity={0.7}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.printBtnText}>Cetak Struk</Text>
                )}
              </TouchableOpacity>

              {userRole === 'cashier' && t.status === 'completed' && onVoidRequest && (
                <TouchableOpacity
                  style={[styles.voidBtn, { borderColor: c.error }]}
                  onPress={onVoidRequest}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.voidBtnText, { color: c.error }]}>Ajukan Void</Text>
                </TouchableOpacity>
              )}

              {userRole === 'owner' && t.status === 'pending_void' && (
                <>
                  {onVoidReject && (
                    <TouchableOpacity
                      style={[styles.rejectBtn, { borderColor: c.border }]}
                      onPress={onVoidReject}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.rejectBtnText, { color: c.textSecondary }]}>Tolak</Text>
                    </TouchableOpacity>
                  )}
                  {onVoidApprove && (
                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: '#dc2626' }]}
                      onPress={onVoidApprove}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.approveBtnText}>Setujui Void</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Sub-components ──

function InfoCard({ label, value, c, full }: { label: string; value: string; c: ReturnType<typeof getColors>; full?: boolean }) {
  return (
    <View style={[infoStyles.card, { backgroundColor: c.bgInput, borderColor: c.border }, full && { width: '100%' }]}>
      <Text style={[infoStyles.label, { color: c.textMuted }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: c.text }]}>{value}</Text>
    </View>
  );
}

function SummaryRow({ label, value, c, isRed }: { label: string; value: string; c: ReturnType<typeof getColors>; isRed?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: isRed ? '#ef4444' : c.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: isRed ? '#ef4444' : c.text }]}>{value}</Text>
    </View>
  );
}

function VoidInfoRow({ label, value, c }: { label: string; value: string; c: ReturnType<typeof getColors> }) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={[voidStyles.label, { color: c.textSecondary }]}>{label}:</Text>
      <Text style={[voidStyles.value, { color: c.text }]}>{value}</Text>
    </View>
  );
}

// ── Styles ──

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  idText: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 8,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productsBox: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prodHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prodHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  prodRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  prodName: {
    fontSize: 12,
    fontWeight: '700',
  },
  prodPrice: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  prodVariant: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  prodNote: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 1,
  },
  prodQty: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  prodSubtotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalDivider: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  cashLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  cashValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  voidBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  voidTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  voidPending: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 20,
  },
  printBtn: {
    flex: 1,
    minWidth: 120,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  printBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  voidBtn: {
    flex: 1,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  voidBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  approveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});

const infoStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    width: '48%',
    flexGrow: 1,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
  },
});

const voidStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
});
