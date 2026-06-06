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
  onVoidDirect?: () => void;
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
  onVoidDirect,
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
  const subtotal = t.subtotal !== undefined && t.subtotal !== null ? t.subtotal : useMemo(() => {
    return resolvedItems.reduce((sum, item) => sum + (item.unit_price + (item.variant_price || 0)) * item.quantity, 0);
  }, [resolvedItems]);
  const discount = t.discount_amount ?? 0;
  const taxAmount = t.tax_amount !== undefined && t.tax_amount !== null
    ? t.tax_amount
    : (t.tax_rate ? Math.round(subtotal * (t.tax_rate / 100)) : 0);
  const serviceAmount = t.service_amount !== undefined && t.service_amount !== null
    ? t.service_amount
    : (t.service_charge ?? 0);
  const total = t.total_amount !== undefined && t.total_amount !== null
    ? t.total_amount
    : (subtotal + taxAmount + serviceAmount - discount);
  const isCash =
    String(t.payment_method).toLowerCase() === 'cash' ||
    String(t.raw_payment_method || '').toLowerCase() === 'cash';

  const amountPaidVal = isCash
    ? (t.amount_paid !== undefined && t.amount_paid !== null ? t.amount_paid : total)
    : undefined;
  const changeAmountVal = isCash
    ? (t.change_amount !== undefined && t.change_amount !== null ? t.change_amount : Math.max(0, (amountPaidVal ?? 0) - total))
    : undefined;

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
          subtotal: (item.unit_price + (item.variant_price || 0)) * item.quantity,
          variantName: item.variant_name || undefined,
          variantPrice: item.variant_price || undefined,
          description: item.notes || undefined,
          notes: item.notes || undefined,
        })),
        subtotal,
        tax: taxAmount,
        taxRate: t.tax_rate ?? 0,
        serviceCharge: serviceAmount || undefined,
        grandTotal: total,
        paymentMethod: String(t.raw_payment_method || t.payment_method || 'cash').toLowerCase(),
        amountPaid: amountPaidVal,
        change: changeAmountVal,
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
              <Text style={{ fontFamily: 'monospace', fontSize: 10, marginBottom: 8, color: c.textMuted }} numberOfLines={1}>
                #{t.id}
              </Text>
              <StatusBadge status={t.status} isDark={isDark} size="md" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={22} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={true}
            style={styles.content}
            contentContainerStyle={styles.contentScrollContent}
          >
            {/* Receipt Shop Header */}
            <View style={styles.receiptHeader}>
              <Text style={[styles.receiptStoreName, { color: c.text }]}>
                {settings?.storeName?.toUpperCase() || user?.shop?.name?.toUpperCase() || 'SMARTPOS'}
              </Text>
              {settings?.address ? (
                <Text style={[styles.receiptStoreAddress, { color: c.textSecondary }]}>
                  {settings.address}
                </Text>
              ) : null}
              {(settings as any)?.phone ? (
                <Text style={[styles.receiptStoreAddress, { color: c.textSecondary }]}>
                  {(settings as any).phone}
                </Text>
              ) : null}
            </View>

            <View style={[styles.dashedBorder, { borderBottomColor: c.border }]} />

            {/* Order Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Receipt ID</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>#{t.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Tanggal</Text>
                <Text style={[styles.infoValue, { color: c.text }]}>{fmtWIB(t.created_at)}</Text>
              </View>
              
              <View style={styles.infoRowCentered}>
                <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Tipe Pesanan</Text>
                <View style={[
                  styles.typeBadge,
                  {
                    backgroundColor: isDark ? 'rgba(120, 53, 4, 0.2)' : 'rgba(217, 119, 6, 0.08)',
                    borderColor: isDark ? '#78350f' : '#cbd5e1',
                  }
                ]}>
                  <Text style={[styles.typeBadgeText, { color: isDark ? '#fbbf24' : '#d97706' }]}>
                    {t.order_type === 'dine_in' ? 'Dine In' : 'Take Away'}
                  </Text>
                </View>
              </View>
              
              {t.customer_name?.trim() ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Pelanggan</Text>
                  <Text style={[styles.infoValueCustomer, { color: c.text }]}>{t.customer_name.trim()}</Text>
                </View>
              ) : null}
              
              {isDine && t.table_number?.trim() ? (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: c.textSecondary }]}>Meja</Text>
                  <Text style={[styles.infoValueTable, { color: c.text }]}>{t.table_number.trim()}</Text>
                </View>
              ) : null}

              {t.notes?.trim() ? (
                <View style={styles.notesContainer}>
                  <Text style={[styles.notesLabel, { color: c.textSecondary }]}>Catatan Pesanan:</Text>
                  <Text style={[styles.notesValue, { color: c.text }]}>"{t.notes.trim()}"</Text>
                </View>
              ) : null}
            </View>

            <View style={[styles.dashedBorder, { borderBottomColor: c.border }]} />

            {/* Items */}
            <View style={styles.itemsContainer}>
              {resolvedItems.map((item, i) => {
                const mainTotal = item.unit_price * item.quantity;
                const variantTotal = (item.variant_price || 0) * item.quantity;
                const hasVariant = !!item.variant_name;
                const itemCombinedTotal = mainTotal + variantTotal;

                return (
                  <View key={i} style={styles.itemBlock}>
                    {/* Main Item Row */}
                    <View style={styles.itemMainRow}>
                      <Text style={[styles.itemName, { color: c.text }]}>
                        {item.quantity}x {item.product_name}
                      </Text>
                      <Text style={[styles.itemTotal, { color: c.text }]}>
                        {formatRupiah(mainTotal)}
                      </Text>
                    </View>
                    
                    {/* Base Unit Price (only for quantity >= 2) */}
                    {item.quantity >= 2 && (
                      <View style={styles.itemDetailRow}>
                        <Text style={[styles.itemDetailLabel, { color: c.textMuted }]}>Harga Satuan</Text>
                        <Text style={[styles.itemDetailValue, { color: c.textMuted }]}>
                          {formatRupiah(item.unit_price)}
                        </Text>
                      </View>
                    )}

                    {/* Variant Row */}
                    {hasVariant && (
                      <View style={styles.itemVariantRow}>
                        <Text style={[styles.itemVariantLabel, { color: isDark ? '#fbbf24' : '#d97706' }]}>
                          + {item.variant_name}
                        </Text>
                        <Text style={[styles.itemVariantValue, { color: isDark ? '#fbbf24' : '#d97706' }]}>
                          {formatRupiah(variantTotal)}
                        </Text>
                      </View>
                    )}

                    {/* Variant Unit Price (only for quantity >= 2) */}
                    {hasVariant && item.quantity >= 2 && (
                      <View style={styles.itemDetailRow}>
                        <Text style={[styles.itemDetailLabel, { color: c.textMuted }]}>Harga Variant Satuan</Text>
                        <Text style={[styles.itemDetailValue, { color: c.textMuted }]}>
                          {formatRupiah(item.variant_price || 0)}
                        </Text>
                      </View>
                    )}

                    {/* Per-item combined total (base + variant) — only shown when variant exists */}
                    {hasVariant && (
                      <View style={styles.itemCombinedRow}>
                        <Text style={[styles.itemCombinedLabel, { color: c.textSecondary }]}>
                          Total Item
                        </Text>
                        <Text style={[styles.itemCombinedValue, { color: c.textSecondary }]}>
                          {formatRupiah(itemCombinedTotal)}
                        </Text>
                      </View>
                    )}

                    {item.notes ? (
                      <Text style={[styles.itemNoteText, { color: c.textMuted }]}>
                        Catatan: {item.notes}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={[styles.dashedBorder, { borderBottomColor: c.border }]} />

            {/* Totals */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRowSmall}>
                <Text style={[styles.totalLabelSmall, { color: c.textMuted }]}>Subtotal</Text>
                <Text style={[styles.totalValueSmall, { color: c.text }]}>
                  {formatRupiah(subtotal)}
                </Text>
              </View>

              {discount > 0 && (
                <View style={styles.totalRowSmall}>
                  <Text style={[styles.totalLabelSmall, { color: '#ef4444' }]}>Diskon</Text>
                  <Text style={[styles.totalValueSmall, { color: '#ef4444' }]}>
                    - {formatRupiah(discount)}
                  </Text>
                </View>
              )}

              {taxAmount > 0 && (
                <View style={styles.totalRowSmall}>
                  <Text style={[styles.totalLabelSmall, { color: c.textMuted }]}>
                    {(settings as any)?.taxLabel || (settings as any)?.tax_label || 'Pajak'} ({t.tax_rate || 0}%)
                  </Text>
                  <Text style={[styles.totalValueSmall, { color: c.text }]}>
                    {formatRupiah(taxAmount)}
                  </Text>
                </View>
              )}

              {serviceAmount > 0 && (
                <View style={styles.totalRowSmall}>
                  <Text style={[styles.totalLabelSmall, { color: c.textMuted }]}>
                    {(settings as any)?.service_charge_label || 'Service'}
                  </Text>
                  <Text style={[styles.totalValueSmall, { color: c.text }]}>
                    {formatRupiah(serviceAmount)}
                  </Text>
                </View>
              )}

              <View style={[styles.dashedBorderSmall, { borderBottomColor: c.border }]} />

              <View style={styles.grandTotalRow}>
                <Text style={[styles.grandTotalLabel, { color: c.text }]}>Total</Text>
                <Text style={[styles.grandTotalValue, { color: c.accent }]}>
                  {formatRupiah(total)}
                </Text>
              </View>

              <View style={[styles.dashedBorderSmall, { borderBottomColor: c.border }]} />

              <Text style={[styles.paymentMethodText, { color: c.textMuted }]}>
                Pembayaran: {String(t.raw_payment_method || t.payment_method || 'CASH').toUpperCase()}
              </Text>

              {isCash && (
                <View style={styles.cashDetails}>
                  <View style={styles.totalRowSmall}>
                    <Text style={[styles.totalLabelSmall, { color: c.textMuted }]}>Tunai</Text>
                    <Text style={[styles.totalValueSmall, { color: c.text }]}>
                      {formatRupiah(amountPaidVal ?? total)}
                    </Text>
                  </View>
                  <View style={styles.totalRowSmall}>
                    <Text style={[styles.totalLabelSmall, { color: c.textMuted }]}>Kembali</Text>
                    <Text style={[styles.totalValueSmall, { color: c.text }]}>
                      {formatRupiah(changeAmountVal || 0)}
                    </Text>
                  </View>
                </View>
              )}

              {(settings as any)?.receiptFooter ? (
                <View style={styles.footerContainer}>
                  <Text style={[styles.footerText, { color: c.textMuted }]}>
                    {(settings as any).receiptFooter}
                  </Text>
                </View>
              ) : null}

              {/* Dots */}
              <Text style={{ textAlign: 'center', marginTop: 12, color: c.textMuted, letterSpacing: 4 }}>
                • • •
              </Text>
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

              {userRole === 'owner' && t.status === 'completed' && onVoidDirect && (
                <TouchableOpacity
                  style={[styles.voidBtn, { borderColor: c.error }]}
                  onPress={onVoidDirect}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.voidBtnText, { color: c.error }]}>Batalkan Transaksi</Text>
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
    display: 'flex',
    flexDirection: 'column',
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    width: '100%',
    flexGrow: 1,
  },
  contentScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Receipt layout styles
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  receiptStoreName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  receiptStoreAddress: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 14,
  },
  dashedBorder: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  dashedBorderSmall: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  infoContainer: {
    gap: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRowCentered: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  infoLabel: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  infoValue: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  infoValueCustomer: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  infoValueTable: {
    fontSize: 12,
    fontWeight: '900',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  notesContainer: {
    paddingTop: 4,
  },
  notesLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  notesValue: {
    fontSize: 10.5,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  itemsContainer: {
    gap: 10,
  },
  itemBlock: {
    gap: 2,
    width: '100%',
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  itemTotal: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 1,
  },
  itemDetailLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemDetailValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  itemVariantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 1,
  },
  itemVariantLabel: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  itemVariantValue: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  itemNoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    fontWeight: '700',
    paddingLeft: 10,
    marginTop: 1,
    lineHeight: 13,
  },
  itemCombinedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 3,
    paddingTop: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  itemCombinedLabel: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  itemCombinedValue: {
    fontSize: 10.5,
    fontWeight: '900',
  },
  totalsContainer: {
    gap: 4,
  },
  totalRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  totalValueSmall: {
    fontSize: 11,
    fontWeight: '700',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '900',
    paddingTop: 4,
  },
  cashDetails: {
    gap: 4,
    marginTop: 2,
  },
  footerContainer: {
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9.5,
    fontStyle: 'italic',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
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

// End of file
