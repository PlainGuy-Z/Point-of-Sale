import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
  Animated
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useApp } from '../../contexts/AppContext'
import { useAuth } from '../../contexts/AuthContext'
import { useShift } from '../../contexts/ShiftContext'
import { useLayout } from '../../hooks/useLayout'
import { useTheme } from '../../contexts/ThemeContext'
import { getColors } from '../../utils/theme'
import { usePrinter } from '../../contexts/PrinterContext'
import { buildReceiptText } from '../../services/printer'
import { getEffectivePrice } from '../../utils/priceUtils'
import type { Transaction } from '../../types'
import type { PrintReceiptData } from '../../types/receipt'

interface PaymentSuccessScreenProps {
  transaction?: Transaction
  onClose?: () => void
}

export default function PaymentSuccessScreen({
  transaction,
  onClose,
}: PaymentSuccessScreenProps) {
  if (!transaction) return null

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const router = useRouter()
  const { settings, products } = useApp()
  const { user } = useAuth()
  const { refreshShift } = useShift()
  const { isLandscape } = useLayout()
  const { effectiveTheme } = useTheme()
  const isDark = effectiveTheme === 'dark'
  const colors = getColors(isDark)

  const { printReceipt, config } = usePrinter()
  const [isPrinting, setIsPrinting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [printMethod, setPrintMethod] = useState<string | null>(null)

  const autoPrintTriggered = useRef(false)

  // Pre-process items to resolve variant and split variant price
  const resolvedItems = useMemo(() => {
    return transaction.items.map(item => {
      let variantName = item.variantName
      let variantPrice = item.variantPrice || 0
      let price = item.price
      let description = item.description || ''

      // Always extract/clean brackets from description if present
      if (description) {
        const match = description.match(/\[(.*?)\]/)
        if (match) {
          const rawVariant = match[1]
          if (!variantName) {
            if (rawVariant.includes('@')) {
              const [vName, vPriceStr] = rawVariant.split('@')
              variantName = vName.trim()
              const parsedVal = parseInt(vPriceStr, 10)
              if (!isNaN(parsedVal) && parsedVal > 0) {
                variantPrice = parsedVal
              }
            } else {
              variantName = rawVariant
            }
          }
          description = description.replace(/\[(.*?)\]/, '').trim()
          
          // Clean up any remaining leading/trailing dashes and whitespace
          if (description.startsWith('-')) description = description.substring(1).trim()
          if (description.endsWith('-')) description = description.substring(0, description.length - 1).trim()
        }
      }

      // For all items (manual and catalog): if variantPrice > 0 (resolved from brackets or augmented),
      // subtract it from the combined price to get the correct base price.
      if (variantPrice > 0 && price >= variantPrice) {
        price = price - variantPrice
      } else if (variantPrice === 0 && products) {
        // Fallback for old catalog items: compare with product catalog to extract variant surcharge
        const product = products.find(p => p.id === item.productId)
        if (product) {
          const effectivePrice = getEffectivePrice(product).price
          if (price > effectivePrice) {
            variantPrice = price - effectivePrice
            price = effectivePrice
          }
        }
      }

      // If variant name exists but variantPrice is still 0 (cannot split), disable variant display
      if (variantName && variantPrice === 0) {
        variantName = undefined
      }

      return {
        name: item.note || item.name || 'Item',
        quantity: item.quantity,
        price,
        variantName,
        variantPrice,
        description,
        subtotal: (price + variantPrice) * item.quantity,
        notes: description || undefined
      }
    })
  }, [transaction.items, products])

  // Computed totals for fallback / safety matching
  const subtotalVal = useMemo(() => {
    return resolvedItems.reduce((sum, item) => sum + item.subtotal, 0)
  }, [resolvedItems])

  const taxVal = useMemo(() => {
    const taxRate = (transaction as any).taxRate || 0
    return (transaction as any).tax !== undefined && (transaction as any).tax > 0
      ? Math.round(subtotalVal * (taxRate / 100))
      : 0
  }, [subtotalVal, transaction])

  const serviceChargeVal = (transaction as any).service_charge || 0
  const grandTotalVal = subtotalVal + taxVal + serviceChargeVal
  const changeVal = transaction.paymentMethod === 'cash' && transaction.cashReceived !== undefined
    ? Math.max(0, transaction.cashReceived - grandTotalVal)
    : undefined

  // Build receipt data from transaction
  const receiptData: PrintReceiptData = useMemo(() => ({
    shopName: settings?.storeName || 'SmartPOS',
    shopAddress: settings?.address,
    shopPhone: (settings as any)?.phone,
    cashierName: user?.name || 'Kasir',
    transactionId: transaction.id,
    createdAt: transaction.date,
    orderType: transaction.orderType === 'dine-in' 
      ? 'dine_in' : 'takeaway',
    tableNumber: transaction.orderType === 'dine-in' 
      ? transaction.tableNumber : undefined,
    customerName: transaction.customerName || undefined,
    notes: transaction.orderNote || transaction.notes || undefined,
    items: resolvedItems,
    subtotal: subtotalVal,
    tax: taxVal,
    taxRate: (transaction as any).taxRate || 0,
    serviceCharge: serviceChargeVal || undefined,
    grandTotal: grandTotalVal,
    paymentMethod: transaction.paymentMethod,
    amountPaid: transaction.cashReceived,
    change: changeVal,
    receiptFooter: settings?.receiptFooter,
    paperSize: config.paperSize,
    isOffline: false,
  }), [settings, user, transaction, resolvedItems, config.paperSize])

  const handlePrint = useCallback(async () => {
    setIsPrinting(true)
    try {
      const result = await printReceipt(receiptData)
      setPrintMethod(result.method)
      if (!result.success) {
        Alert.alert(
          'Gagal Print',
          result.error || 'Tidak dapat mencetak struk.',
          [{ text: 'OK' }]
        )
      }
    } catch (err) {
      Alert.alert('Error', 'Terjadi kesalahan saat mencetak.')
    } finally {
      setIsPrinting(false)
    }
  }, [receiptData, printReceipt])

  // Trigger auto print if enabled
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    if (config.autoPrint && !autoPrintTriggered.current) {
      autoPrintTriggered.current = true
      // Delay auto-print slightly to allow animation to settle
      timeout = setTimeout(() => {
        handlePrint()
      }, 500)
    }
    return () => clearTimeout(timeout)
  }, [config.autoPrint, handlePrint])

  const handleCopy = useCallback(async () => {
    const text = buildReceiptText(receiptData)
    await Clipboard.setStringAsync(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }, [receiptData])

  const handleClose = async () => {
    try {
      // Refresh shift context to update totals (only for cashier)
      if (user?.role === 'cashier') {
        await refreshShift()
      }
    } catch (err) {
      console.error('Failed to refresh shift:', err)
    }
    
    if (onClose) {
      onClose()
    } else {
      if (user?.role === 'owner') {
        router.replace('/(owner)/pos' as any)
      } else {
        router.replace('/(cashier)/pos' as any)
      }
    }
  }

  const shouldShowTable = transaction.orderType === 'dine-in' 
    && transaction.tableNumber

  const formatDateString = (date: Date | string) => {
    const d = new Date(date)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const day = pad(d.getDate())
    const month = pad(d.getMonth() + 1)
    const year = d.getFullYear()
    const hours = pad(d.getHours())
    const minutes = pad(d.getMinutes())
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatCurrency = (amount: number) => {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount)
  }

  const themeStyles = {
    modalCard: {
      backgroundColor: isDark ? '#0c0a09' : '#ffffff',
      borderColor: isDark ? '#292524' : '#e2e8f0',
    },
    header: {
      borderBottomColor: isDark ? '#1c1917' : '#f1f5f9',
    },
    headerTitle: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    headerAddress: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    infoLabel: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    infoValue: {
      color: isDark ? '#d6d3d1' : '#0f172a',
    },
    infoValueCustomer: {
      color: isDark ? '#d6d3d1' : '#0f172a',
    },
    infoValueTable: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    typeBadge: {
      backgroundColor: isDark ? 'rgba(120, 53, 4, 0.2)' : 'rgba(217, 119, 6, 0.08)',
      borderColor: isDark ? '#78350f' : '#cbd5e1',
    },
    typeBadgeText: {
      color: isDark ? '#fbbf24' : '#d97706',
    },
    notesLabel: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    notesValue: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    dashedBorder: {
      borderBottomColor: isDark ? '#44403c' : '#cbd5e1',
    },
    dashedBorderSmall: {
      borderBottomColor: isDark ? '#292524' : '#cbd5e1',
    },
    itemName: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    itemTotal: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    itemDetailLabel: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    itemDetailValue: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    itemVariantLabel: {
      color: isDark ? '#fbbf24' : '#d97706',
    },
    itemVariantValue: {
      color: isDark ? '#fbbf24' : '#d97706',
    },
    itemNoteText: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    itemCombinedLabel: {
      color: isDark ? '#d6d3d1' : '#334155',
    },
    itemCombinedValue: {
      color: isDark ? '#d6d3d1' : '#334155',
    },
    totalLabelSmall: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    totalValueSmall: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    grandTotalLabel: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    grandTotalValue: {
      color: isDark ? '#ffffff' : '#0f172a',
    },
    paymentMethodText: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    footerText: {
      color: isDark ? '#a8a29e' : '#475569',
    },
    actionFooter: {
      backgroundColor: isDark ? '#0c0a09' : '#ffffff',
      borderTopColor: isDark ? '#1c1917' : '#f1f5f9',
    },
    btnCopy: {
      borderColor: isDark ? '#292524' : '#cbd5e1',
      backgroundColor: isDark ? 'transparent' : '#ffffff',
    },
    btnTextCopy: {
      color: isDark ? '#d6d3d1' : '#0f172a',
    },
    btnPrint: {
      borderColor: isDark ? 'rgba(245, 158, 11, 0.6)' : '#0d9488',
      backgroundColor: isDark ? 'transparent' : '#0d9488',
    },
    btnTextPrint: {
      color: isDark ? '#f59e0b' : '#ffffff',
    },
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <Animated.View 
        style={[
          styles.modalCard,
          isLandscape && styles.modalCardLandscape,
          themeStyles.modalCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.modalInner}>
          {/* Header */}
          <View style={[styles.header, themeStyles.header]}>
            <Text style={[styles.headerTitle, themeStyles.headerTitle]}>
              {settings?.storeName?.toUpperCase() || 'SMARTPOS'}
            </Text>
            {settings?.address && (
              <Text style={[styles.headerAddress, themeStyles.headerAddress]}>
                {settings.address}
              </Text>
            )}
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={isDark ? "#a8a29e" : "#475569"} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.contentScroll} 
            contentContainerStyle={styles.contentScrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Order Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, themeStyles.infoLabel]}>Receipt ID</Text>
                <Text style={[styles.infoValue, themeStyles.infoValue]}>#{transaction.id?.substring(0, 8) || 'N/A'}...</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, themeStyles.infoLabel]}>Tanggal</Text>
                <Text style={[styles.infoValue, themeStyles.infoValue]}>{formatDateString(transaction.date)}</Text>
              </View>
              
              {transaction.orderType && (
                <View style={styles.infoRowCentered}>
                  <Text style={[styles.infoLabel, themeStyles.infoLabel]}>Tipe Pesanan</Text>
                  <View style={[styles.typeBadge, themeStyles.typeBadge]}>
                    <Text style={[styles.typeBadgeText, themeStyles.typeBadgeText]}>
                      {transaction.orderType === 'dine-in' ? 'Dine In' : 'Take Away'}
                    </Text>
                  </View>
                </View>
              )}
              
              {transaction.customerName && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, themeStyles.infoLabel]}>Pelanggan</Text>
                  <Text style={[styles.infoValueCustomer, themeStyles.infoValueCustomer]}>{transaction.customerName}</Text>
                </View>
              )}
              
              {shouldShowTable && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, themeStyles.infoLabel]}>Meja</Text>
                  <Text style={[styles.infoValueTable, themeStyles.infoValueTable]}>{transaction.tableNumber}</Text>
                </View>
              )}

              {(transaction.orderNote || transaction.notes) && (
                <View style={styles.notesContainer}>
                  <Text style={[styles.notesLabel, themeStyles.notesLabel]}>Catatan Pesanan:</Text>
                  <Text style={[styles.notesValue, themeStyles.notesValue]}>"{transaction.orderNote || transaction.notes}"</Text>
                </View>
              )}
            </View>

            <View style={[styles.dashedBorder, themeStyles.dashedBorder]} />

            {/* Items */}
            <View style={styles.itemsContainer}>
              {resolvedItems.map((item, i) => {
                const mainTotal = item.price * item.quantity;
                const variantTotal = (item.variantPrice || 0) * item.quantity;
                const hasVariant = !!item.variantName;
                const itemCombinedTotal = mainTotal + variantTotal;
                return (
                  <View key={i} style={styles.itemBlock}>
                    {/* Main Item Row */}
                    <View style={styles.itemMainRow}>
                      <Text style={[styles.itemName, themeStyles.itemName]}>
                        {item.quantity}x {item.name}
                      </Text>
                      <Text style={[styles.itemTotal, themeStyles.itemTotal]}>
                        {formatCurrency(mainTotal)}
                      </Text>
                    </View>
                    
                    {/* Base Unit Price (only for quantity >= 2) */}
                    {item.quantity >= 2 && (
                      <View style={styles.itemDetailRow}>
                        <Text style={[styles.itemDetailLabel, themeStyles.itemDetailLabel]}>Harga Satuan</Text>
                        <Text style={[styles.itemDetailValue, themeStyles.itemDetailValue]}>
                          {formatCurrency(item.price)}
                        </Text>
                      </View>
                    )}

                    {/* Variant Row (with variant total) */}
                    {hasVariant && (
                      <View style={styles.itemVariantRow}>
                        <Text style={[styles.itemVariantLabel, themeStyles.itemVariantLabel]}>
                          + {item.variantName}
                        </Text>
                        <Text style={[styles.itemVariantValue, themeStyles.itemVariantValue]}>
                          {formatCurrency(variantTotal)}
                        </Text>
                      </View>
                    )}

                    {/* Variant Unit Price (only for quantity >= 2) */}
                    {hasVariant && item.quantity >= 2 && (
                      <View style={styles.itemDetailRow}>
                        <Text style={[styles.itemDetailLabel, themeStyles.itemDetailLabel]}>Harga Variant Satuan</Text>
                        <Text style={[styles.itemDetailValue, themeStyles.itemDetailValue]}>
                          {formatCurrency(item.variantPrice || 0)}
                        </Text>
                      </View>
                    )}

                    {/* Per-item combined total (base + variant) — only shown when variant exists */}
                    {hasVariant && (
                      <View style={styles.itemCombinedRow}>
                        <Text style={[styles.itemCombinedLabel, themeStyles.itemCombinedLabel]}>
                          Total Item
                        </Text>
                        <Text style={[styles.itemCombinedValue, themeStyles.itemCombinedValue]}>
                          {formatCurrency(itemCombinedTotal)}
                        </Text>
                      </View>
                    )}

                    {item.description ? (
                      <Text style={[styles.itemNoteText, themeStyles.itemNoteText]}>
                        Catatan: {item.description}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>

            <View style={[styles.dashedBorder, themeStyles.dashedBorder]} />

            {/* Totals */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRowSmall}>
                <Text style={[styles.totalLabelSmall, themeStyles.totalLabelSmall]}>Subtotal</Text>
                <Text style={[styles.totalValueSmall, themeStyles.totalValueSmall]}>
                  {formatCurrency(subtotalVal)}
                </Text>
              </View>

              {(transaction as any).tax !== undefined && (transaction as any).tax > 0 && (
                <View style={styles.totalRowSmall}>
                  <Text style={[styles.totalLabelSmall, themeStyles.totalLabelSmall]}>
                    {(settings as any)?.tax_label || 'Pajak'} ({(transaction as any).taxRate || 0}%)
                  </Text>
                  <Text style={[styles.totalValueSmall, themeStyles.totalValueSmall]}>
                    {formatCurrency(taxVal)}
                  </Text>
                </View>
              )}

              {serviceChargeVal > 0 && (
                <View style={styles.totalRowSmall}>
                  <Text style={[styles.totalLabelSmall, themeStyles.totalLabelSmall]}>
                    {(settings as any)?.service_charge_label || 'Service'}
                  </Text>
                  <Text style={[styles.totalValueSmall, themeStyles.totalValueSmall]}>
                    {formatCurrency(serviceChargeVal)}
                  </Text>
                </View>
              )}

              {/* Dash border before Total */}
              <View style={[styles.dashedBorderSmall, themeStyles.dashedBorderSmall]} />

              <View style={styles.grandTotalRow}>
                <Text style={[styles.grandTotalLabel, themeStyles.grandTotalLabel]}>Total</Text>
                <Text style={[styles.grandTotalValue, themeStyles.grandTotalValue]}>
                  {formatCurrency(grandTotalVal)}
                </Text>
              </View>

              {/* Dash border after Total */}
              <View style={[styles.dashedBorderSmall, themeStyles.dashedBorderSmall]} />

              <Text style={[styles.paymentMethodText, themeStyles.paymentMethodText]}>
                Pembayaran: {transaction.paymentMethod?.toUpperCase()}
              </Text>

              {transaction.paymentMethod === 'cash' &&
                transaction.cashReceived !== undefined && transaction.cashReceived > 0 && (
                  <View style={styles.cashDetails}>
                    <View style={styles.totalRowSmall}>
                      <Text style={[styles.totalLabelSmall, themeStyles.totalLabelSmall]}>Tunai</Text>
                      <Text style={[styles.totalValueSmall, themeStyles.totalValueSmall]}>
                        {formatCurrency(transaction.cashReceived)}
                      </Text>
                    </View>
                    <View style={styles.totalRowSmall}>
                      <Text style={[styles.totalLabelSmall, themeStyles.totalLabelSmall]}>Kembali</Text>
                      <Text style={[styles.totalValueSmall, themeStyles.totalValueSmall]}>
                        {formatCurrency(changeVal || 0)}
                      </Text>
                    </View>
                  </View>
                )}

              {/* Footer */}
              {settings?.receiptFooter && (
                <View style={styles.footerContainer}>
                  <Text style={[styles.footerText, themeStyles.footerText]}>
                    {settings.receiptFooter}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action buttons (Sticky at bottom, inside modalInner for proper flex) */}
          <View style={[styles.actionFooter, themeStyles.actionFooter]}>
            <TouchableOpacity 
              onPress={handleCopy} 
              style={[styles.btnCopy, isCopied && styles.btnCopySuccess, themeStyles.btnCopy]}
            >
              <Text style={[styles.btnTextCopy, isCopied && styles.btnTextSuccess, themeStyles.btnTextCopy]}>
                {isCopied ? 'Tersalin!' : 'Salin Struk'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handlePrint} 
              disabled={isPrinting}
              style={[styles.btnPrint, isPrinting && styles.btnPrintDisabled, themeStyles.btnPrint]}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color={isDark ? "#f59e0b" : "#ffffff"} />
              ) : (
                <Text style={[styles.btnTextPrint, themeStyles.btnTextPrint]}>Print</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderWidth: 1,
    borderRadius: 14,
    width: '100%',
    maxWidth: 300,
    maxHeight: '80%',
    overflow: 'hidden',
    flexShrink: 1,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCardLandscape: {
    maxWidth: 300,
    maxHeight: '90%',
    flexShrink: 1,
  },
  modalInner: {
    width: '100%',
    maxHeight: '100%',
    flexShrink: 1,
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
    position: 'relative',
    width: '100%',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerAddress: {
    fontSize: 9,
    marginTop: 2,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 6,
    padding: 4,
    borderRadius: 6,
  },
  contentScroll: {
    width: '100%',
    flexGrow: 1,
    flexShrink: 1,
  },
  contentScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoContainer: {
    gap: 4,
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
    fontSize: 10,
    fontWeight: '900',
  },
  infoValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  infoValueCustomer: {
    fontSize: 11,
    fontWeight: '900',
  },
  infoValueTable: {
    fontSize: 11.5,
    fontWeight: '900',
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  typeBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  notesContainer: {
    paddingTop: 4,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 1,
  },
  notesValue: {
    fontSize: 10,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  dashedBorder: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  dashedBorderSmall: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  itemsContainer: {
    gap: 8,
  },
  itemBlock: {
    gap: 1,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '900',
  },
  itemTotal: {
    fontSize: 11,
    fontWeight: '900',
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 0.5,
  },
  itemDetailLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  itemDetailValue: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  itemVariantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 0.5,
  },
  itemVariantLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemVariantValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemNoteText: {
    fontSize: 9.5,
    fontStyle: 'italic',
    fontWeight: '700',
    paddingLeft: 10,
    marginTop: 0.5,
    lineHeight: 12,
  },
  itemCombinedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    marginTop: 2,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  itemCombinedLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  itemCombinedValue: {
    fontSize: 10,
    fontWeight: '900',
  },
  totalsContainer: {
    gap: 3,
  },
  totalRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
  totalValueSmall: {
    fontSize: 10,
    fontWeight: '700',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  paymentMethodText: {
    fontSize: 10,
    fontWeight: '900',
    paddingTop: 4,
  },
  cashDetails: {
    gap: 3,
    marginTop: 1,
  },
  footerContainer: {
    paddingTop: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8.5,
    fontStyle: 'italic',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  actionFooter: {
    padding: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  btnCopy: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCopySuccess: {
    borderColor: '#22c55e',
  },
  btnTextCopy: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnTextSuccess: {
    color: '#22c55e',
  },
  btnPrint: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrintDisabled: {
    opacity: 0.5,
  },
  btnTextPrint: {
    fontSize: 11,
    fontWeight: '700',
  },
})
