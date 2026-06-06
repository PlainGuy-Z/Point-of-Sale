import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Banknote, CreditCard, QrCode, CheckCircle, Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTransactions } from '../../contexts/AppContext';
import { usePOSCart } from '../../contexts/POSCartContext';
import { formatRupiah } from '../../utils/currency';
import { useLayout } from '../../hooks/useLayout';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

// ─── Animated press wrapper ───────────────────────────────────────────────────
function PressableScale({
  children,
  onPress,
  disabled,
  style,
  scale = 0.93,
  activeOpacity = 0.85,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  scale?: number;
  activeOpacity?: number;
}) {
  const anim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(anim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 5,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={activeOpacity}
        style={{ flex: 1 }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Smart quick-amount generator ────────────────────────────────────────────

// ─── Main component ───────────────────────────────────────────────────────────
interface PaymentScreenProps {
  onClose?: () => void;
  onSuccess?: (transaction: any) => void;
}

export default function PaymentScreen({ onClose, onSuccess }: PaymentScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { checkout: appCheckout } = useTransactions();
  const { isLandscape, isTablet, mode } = useLayout();
  const isSplitLayout = isLandscape && isTablet;
  const isPhoneLandscape = mode === 'phone-landscape';

  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const theme = getColors(isDark);

  const C = {
    bg: isDark ? '#09090b' : '#f8fafc',
    surface: theme.bgCard,
    surfaceAlt: theme.bgElevated,
    border: theme.border,
    borderSubtle: theme.borderLight,
    teal: theme.accentLight,
    tealDark: theme.accent,
    tealBg: theme.accentBg,
    amber: theme.warning,
    red: theme.error,
    redBg: theme.errorBg,
    redBorder: isDark ? '#7f1d1d' : '#fca5a5',
    green: theme.success,
    greenBorder: isDark ? '#059669' : '#34d399',
    greenBg: theme.successBg,
    white: theme.text,
    muted: theme.textMuted,
    disabled: isDark ? '#3f3f46' : '#cbd5e1',
  };

  const isCompact = windowWidth < 600;
  const isShort = windowHeight < 500;
  // Use split layout for all landscape and tablet
  const useSplit = isPhoneLandscape || windowWidth >= 600;

  const {
    cart,
    total,
    subtotal,
    taxAmount,
    checkout: checkoutData,
    getCheckoutData,
    resetCheckout,
  } = usePOSCart();

  const [method, setMethod] = useState<'cash' | 'qris' | 'card'>('cash');
  const [receivedStr, setReceivedStr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const received = parseInt(receivedStr || '0', 10);
  const change = received - total;
  const canPay = method !== 'cash' || received >= total;

  // Generate quick cash amounts
  const getQuickAmountsList = useCallback(() => {
    const amounts = [total];
    
    // Round up to nearest 50k
    const round50k = Math.ceil(total / 50000) * 50000;
    // Round up to nearest 100k
    const round100k = Math.ceil(total / 100000) * 100000;
    
    // Add rounded amounts if they're different from total
    if (round50k !== total) amounts.push(round50k);
    if (round100k !== round50k && round100k !== total) amounts.push(round100k);
    
    // Add fixed amount for smaller totals
    if (total < 150000) {
      const twoHundredThousand = 200000;
      if (!amounts.includes(twoHundredThousand)) amounts.push(twoHundredThousand);
    }
    
    // Remove duplicates, sort, and take max 4 amounts
    return [...new Set(amounts)]
      .sort((a, b) => a - b)
      .slice(0, 4);
  }, [total]);

  const quickAmounts = getQuickAmountsList();

  // Modal sizing
  const modalMaxWidth = useSplit
    ? Math.min(windowWidth * 0.88, 640)
    : windowWidth - 24;
    
  const modalMaxHeight = useSplit
    ? Math.min(windowHeight - insets.top - insets.bottom - 28, isShort ? 360 : 420)
    : Math.min(
        windowHeight - insets.top - insets.bottom - (isCompact ? 16 : 28),
        windowHeight * 0.9
      );

  const modalHeight = useSplit
    ? modalMaxHeight
    : Math.min(540, windowHeight - insets.top - insets.bottom - (isCompact ? 16 : 28));





  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePay = useCallback(async () => {
    setError('');
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const fullCheckout = getCheckoutData?.() || checkoutData;
      const completedTx = await appCheckout({
        cart: cart.map((i) => ({
          ...i,
          variantName: i.variantName,
          variantPrice: i.variantPrice,
          description: i.description,
          ...(i.productId.startsWith('manual-') ? { price: i.price } : {}),
        })),
        paymentMethod: method,
        orderType: fullCheckout.orderType,
        tableNumber: fullCheckout.tableNumber || undefined,
        customCustomerName: fullCheckout.customerName || undefined,
        orderNote: fullCheckout.orderNote || undefined,
        notes: fullCheckout.orderNote || undefined,
        cashReceived: method === 'cash' ? received : undefined,
        change: method === 'cash' ? Math.max(0, change) : undefined,
        applyTax: fullCheckout.applyTax,
      });

      // Augment completedTx items with original cart variant details so PaymentSuccessScreen has immediate access to variantPrice and variantName
      if (completedTx && completedTx.items) {
        completedTx.items = completedTx.items.map((txItem: any) => {
          const matchingCartItem = cart.find(cItem => {
            if (txItem.productId !== 'manual') {
              return cItem.productId === txItem.productId;
            } else {
              return cItem.productId.startsWith('manual-') && cItem.name === txItem.note;
            }
          });
          
          if (matchingCartItem) {
            return {
              ...txItem,
              variantName: matchingCartItem.variantName,
              variantPrice: matchingCartItem.variantPrice,
            };
          }
          return txItem;
        });
      }

      resetCheckout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.(completedTx);
    } catch (err: any) {
      setError(err?.message || 'Pembayaran gagal');
    } finally {
      setIsProcessing(false);
    }
  }, [appCheckout, cart, method, checkoutData, getCheckoutData, received, change, resetCheckout, onSuccess]);

  const handleClear = useCallback(() => {
    setReceivedStr('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handlePressKey = useCallback(
    (key: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (key === '⌫') {
        setReceivedStr((p) => p.slice(0, -1));
        return;
      }
      if (key === '.') return; // no decimals for Rupiah
      if (receivedStr.length >= 12) return;
      if (receivedStr === '' && (key === '0' || key === '00')) return;
      setReceivedStr((p) => p + key);
    },
    [receivedStr],
  );

  // ── Sub-components ───────────────────────────────────────────────────────────
  const paymentMethods = [
    { key: 'cash' as const, label: 'Cash', icon: Banknote },
    { key: 'card' as const, label: 'Card', icon: CreditCard },
    { key: 'qris' as const, label: 'QRIS', icon: QrCode },
  ];

  // Numpad rows — backspace replaces "."
  const numpadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['00', '0', '⌫'],
  ];

  // ── Method tabs ──────────────────────────────────────────────────────────────
  const renderMethodTabs = () => (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {paymentMethods.map((m) => {
        const isActive = method === m.key;
        const Icon = m.icon;
        return (
          <PressableScale
            key={m.key}
            onPress={() => {
              setMethod(m.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{ flex: 1 }}
            scale={0.95}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: isSplitLayout ? 8 : isShort ? 6 : 10,
                borderRadius: 12,
                backgroundColor: isActive ? C.tealBg : C.surface,
                borderWidth: isActive ? 1.5 : 1,
                borderColor: isActive ? C.teal : C.border,
              }}
            >
              <Icon
                size={isSplitLayout ? 17 : 15}
                color={isActive ? C.teal : C.muted}
                strokeWidth={2.5}
              />
              <Text
                style={{
                  color: isActive ? C.teal : C.muted,
                  fontWeight: '700',
                  fontSize: isSplitLayout ? 14 : isShort ? 11 : 12,
                }}
              >
                {m.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );

  // ── Quick amount buttons ─────────────────────────────────────────────────────
  const renderQuickAmounts = () => {
    const isGrid = isCompact || useSplit;
    const firstRow = isGrid ? quickAmounts.slice(0, 2) : quickAmounts;
    const secondRow = isGrid ? quickAmounts.slice(2, 4) : null;

    const AmountButton = ({ amt }: { amt: number }) => {
      const isExact = amt === total;
      const isHighlighted = amt >= total;
      const isSelected = received === amt;

      let bg = C.surface;
      let border = C.border;
      let textColor = C.white;

      if (isSelected) {
        bg = C.tealBg;
        border = C.teal;
        textColor = C.teal;
      } else if (isHighlighted) {
        bg = C.surfaceAlt;
        border = isDark ? '#3f3f46' : C.borderSubtle;
        textColor = C.white;
      }

      return (
        <PressableScale
          onPress={() => {
            setReceivedStr(String(amt));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={{ flex: 1 }}
          scale={0.94}
        >
          <View
            style={{
              backgroundColor: bg,
              borderWidth: isExact || isSelected ? 1.5 : 1,
              borderColor: border,
              borderRadius: 10,
              paddingVertical: isSplitLayout ? 8 : isGrid ? (isShort ? 6 : 10) : (isShort ? 6 : 8),
              paddingHorizontal: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isExact && (
              <Text
                style={{
                  color: isSelected ? C.tealDark : C.muted,
                  fontSize: isShort ? 8 : 9,
                  fontWeight: '700',
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                EXACT
              </Text>
            )}
            <Text
              style={{
                color: textColor,
                fontSize: isSplitLayout ? 13 : isGrid ? (isShort ? 12 : 14) : (isShort ? 10 : 12),
                fontWeight: '800',
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatRupiah(amt)}
            </Text>
          </View>
        </PressableScale>
      );
    };

    return (
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {firstRow.map((amt) => (
            <AmountButton key={amt} amt={amt} />
          ))}
        </View>
        {secondRow && secondRow.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {secondRow.map((amt) => (
              <AmountButton key={amt} amt={amt} />
            ))}
          </View>
        )}
      </View>
    );
  };

  // ── Left column ──────────────────────────────────────────────────────────────
  const renderLeftColumn = () => (
    <View
      style={{
        flex: useSplit ? 1 : undefined,
        justifyContent: useSplit ? 'space-between' : undefined,
        gap: isShort ? 4 : 10,
      }}
    >
      {/* Total */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.borderSubtle,
          borderRadius: 12,
          paddingHorizontal: isSplitLayout ? 12 : isShort ? 8 : 12,
          paddingVertical: isSplitLayout ? 10 : isShort ? 6 : 12,
        }}
      >
        <View>
          <Text style={{ color: C.muted, fontSize: 11, fontWeight: '600', marginBottom: 2 }}>
            TOTAL PEMBAYARAN
          </Text>
          <Text style={{ color: C.amber, fontSize: isSplitLayout ? 22 : isShort ? 18 : 22, fontWeight: '900' }}>
            {formatRupiah(total)}
          </Text>
        </View>
        {checkoutData.applyTax && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: C.muted, fontSize: 10 }}>Subtotal</Text>
            <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>
              {formatRupiah(subtotal)}
            </Text>
            <Text style={{ color: C.muted, fontSize: 10 }}>PPN</Text>
            <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>
              +{formatRupiah(taxAmount)}
            </Text>
          </View>
        )}
      </View>

      {/* Method tabs */}
      {renderMethodTabs()}

      {/* Cash-specific UI */}
      {method === 'cash' ? (
        <View
          style={{
            gap: isShort ? 4 : 10,
            flex: useSplit ? 1 : undefined,
            justifyContent: useSplit ? 'space-between' : undefined,
          }}
        >
          {/* RECEIVED */}
          <View
            style={{
              backgroundColor: C.surface,
              borderWidth: 1,
              borderColor: C.borderSubtle,
              borderRadius: 12,
              padding: isSplitLayout ? 10 : isShort ? 6 : 12,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: C.muted,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.8,
                }}
              >
                UANG DITERIMA
              </Text>
              {!useSplit && (
                <TouchableOpacity onPress={handleClear}>
                  <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
            {!useSplit ? (
              <TextInput
                style={{
                  color: received > 0 ? C.white : C.muted,
                  fontSize: isShort ? 16 : 20,
                  fontWeight: '800',
                  marginBottom: isShort ? 4 : 10,
                  paddingVertical: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: C.borderSubtle,
                }}
                placeholder="Rp 0"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                value={receivedStr}
                onChangeText={(val) => {
                  const clean = val.replace(/[^0-9]/g, '');
                  setReceivedStr(clean);
                }}
              />
            ) : (
              <Text
                style={{
                  color: received > 0 ? C.white : C.muted,
                  fontSize: isSplitLayout ? 20 : isShort ? 16 : 20,
                  fontWeight: '800',
                  marginBottom: isSplitLayout ? 8 : isShort ? 4 : 10,
                }}
              >
                {received > 0 ? formatRupiah(received) : 'Rp 0'}
              </Text>
            )}

            {/* Quick amounts */}
            {renderQuickAmounts()}
          </View>

          {/* CHANGE */}
          <View
            style={{
              backgroundColor: change >= 0 && received > 0 ? C.greenBg : C.surface,
              borderWidth: 1,
              borderColor: change >= 0 && received > 0 ? C.greenBorder : C.borderSubtle,
              borderRadius: 12,
              paddingHorizontal: isSplitLayout ? 12 : isShort ? 8 : 12,
              paddingVertical: isSplitLayout ? 10 : isShort ? 6 : 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: C.muted,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.8,
              }}
            >
              KEMBALIAN
            </Text>
            <Text
              style={{
                color: change >= 0 && received > 0 ? C.green : C.muted,
                fontSize: isSplitLayout ? 22 : isShort ? 16 : 18,
                fontWeight: '900',
              }}
            >
              {formatRupiah(Math.max(0, change))}
            </Text>
          </View>
        </View>
      ) : method === 'card' ? (
        <View
          style={{
            flex: isSplitLayout ? 1 : undefined,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.borderSubtle,
            borderRadius: 12,
            padding: isSplitLayout ? 24 : 16,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <CreditCard
            size={isSplitLayout ? 44 : 32}
            color={C.muted}
            strokeWidth={1.5}
            style={{ marginBottom: 10 }}
          />
          <Text
            style={{
              color: C.white,
              fontSize: isSplitLayout ? 16 : 14,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            Card Payment
          </Text>
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 17,
            }}
          >
            Swipe/insert kartu di EDC terminal.{'\n'}
            Tekan "Process Transaction" untuk konfirmasi.
          </Text>
        </View>
      ) : (
        <View
          style={{
            flex: isSplitLayout ? 1 : undefined,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.borderSubtle,
            borderRadius: 12,
            padding: isSplitLayout ? 16 : 16,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 120,
          }}
        >
          <QrCode
            size={isSplitLayout ? 44 : 32}
            color={C.muted}
            strokeWidth={1.5}
            style={{ marginBottom: 10 }}
          />
          <Text
            style={{
              color: C.white,
              fontSize: isSplitLayout ? 16 : 14,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            QRIS Payment
          </Text>
          <Text
            style={{
              color: C.muted,
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 17,
            }}
          >
            Tampilkan QR dinamis ke pelanggan.{'\n'}
            Tekan "Process Transaction" untuk konfirmasi.
          </Text>
        </View>
      )}
    </View>
  );

  // ── Sub-renderers ───────────────────────────────────────────────────────────
  const renderNumpad = (fillSpace: boolean) => {
    const numBtnHeight = useSplit
      ? (isShort ? 46 : 52)
      : (isShort ? 36 : 46);
    return (
      <View style={fillSpace ? { flex: 1, gap: 6 } : { gap: 6 }}>
        {numpadRows.map((row, ri) => (
          <View
            key={ri}
            style={
              fillSpace
                ? { flexDirection: 'row', gap: 6, flex: 1 }
                : { flexDirection: 'row', gap: 6 }
            }
          >
            {row.map((key) => {
              const isBackspace = key === '⌫';
              return (
                <PressableScale
                  key={key}
                  onPress={() => handlePressKey(key)}
                  style={{ flex: 1 }}
                  scale={0.9}
                >
                  <View
                    style={{
                      flex: fillSpace ? 1 : undefined,
                      height: fillSpace ? undefined : numBtnHeight,
                      backgroundColor: isBackspace ? C.redBg : C.surface,
                      borderWidth: 1,
                      borderColor: isBackspace ? C.redBorder : C.border,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: fillSpace ? 0 : 8,
                    }}
                  >
                    {isBackspace ? (
                      <Delete size={isShort ? 16 : 20} color={C.red} strokeWidth={2} />
                    ) : (
                      <Text
                        style={{
                          color: C.white,
                          fontSize: useSplit ? (isShort ? 20 : 22) : (isShort ? 18 : 20),
                          fontWeight: '800',
                        }}
                      >
                        {key}
                      </Text>
                    )}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  const renderCTAButton = () => {
    const ctaPadding = isShort ? 10 : useSplit ? 12 : 18;
    const ctaFontSize = isShort ? 12 : useSplit ? 14 : 16;
    return (
      <PressableScale
        onPress={handlePay}
        disabled={!canPay || isProcessing}
        scale={0.97}
        style={{}}
      >
        <View
          style={{
            backgroundColor: canPay && !isProcessing ? C.teal : C.disabled,
            borderRadius: 16,
            paddingVertical: ctaPadding,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            shadowColor: canPay ? C.teal : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: canPay ? 0.45 : 0,
            shadowRadius: 12,
            elevation: canPay ? 8 : 0,
          }}
        >
          {isProcessing ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <CheckCircle
                size={isShort ? 16 : 20}
                color={canPay ? theme.textInverse : (isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)')}
                strokeWidth={2.5}
              />
              <Text
                style={{
                  color: canPay ? theme.textInverse : (isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)'),
                  fontWeight: '900',
                  fontSize: ctaFontSize,
                  letterSpacing: 0.6,
                }}
              >
                PROCESS TRANSACTION
              </Text>
            </>
          )}
        </View>
      </PressableScale>
    );
  };

  // ── Right column (numpad + CTA) ───────────────────────────────────────────
  const renderRightColumn = () => {
    const showNumpad = method === 'cash';
    return (
      <View
        style={{
          flex: 1,
          justifyContent: useSplit ? 'space-between' : (showNumpad ? 'flex-start' : 'flex-end'),
          gap: 8,
        }}
      >
        {showNumpad && (
          <View style={{ gap: 6 }}>
            {useSplit && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 4 }}>
                <TouchableOpacity onPress={handleClear} style={{ paddingVertical: 2, paddingHorizontal: 6 }}>
                  <Text style={{ color: C.red, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>CLEAR</Text>
                </TouchableOpacity>
              </View>
            )}
            {renderNumpad(false)}
          </View>
        )}
        {!showNumpad && <View style={{ flex: 1 }} />}
        {error ? (
          <View
            style={{
              backgroundColor: C.redBg,
              borderWidth: 1,
              borderColor: `${C.red}44`,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: C.red, fontSize: 12, fontWeight: '600' }}>{error}</Text>
          </View>
        ) : null}
        {renderCTAButton()}
      </View>
    );
  };

  // ── Root render ───────────────────────────────────────────────────────────
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: insets.top + (isCompact ? 8 : 16),
        paddingBottom: insets.bottom + (isCompact ? 8 : 16),
        paddingHorizontal: isCompact ? 8 : 16,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: modalMaxWidth,
          height: modalHeight,
          backgroundColor: C.bg,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: C.borderSubtle,
          overflow: 'hidden',
          alignSelf: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.6,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: isShort ? 10 : 14,
            paddingBottom: isShort ? 8 : 12,
            borderBottomWidth: 1,
            borderColor: C.borderSubtle,
          }}
        >
          <Text style={{ color: C.white, fontSize: 18, fontWeight: '800' }}>
            Payment
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 6,
              borderRadius: 20,
              backgroundColor: C.surface,
            }}
          >
            <X size={17} color={C.muted} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        {useSplit ? (
          // ── Widescreen layout: side-by-side ──────────────────────────────
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              padding: isPhoneLandscape ? 8 : isShort ? 10 : 14,
              gap: isPhoneLandscape ? 8 : isShort ? 10 : 14,
              minHeight: 0,
            }}
          >
            <View style={{ flex: 1.1, minWidth: 0 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 4 }}
              >
                {renderLeftColumn()}
              </ScrollView>
            </View>
            <View style={{ flex: 0.9, minWidth: 0 }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 4 }}
              >
                {renderRightColumn()}
              </ScrollView>
            </View>
          </View>
        ) : (
          // ── Compact layout: stacked vertically ──────────────────────────
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{
                padding: 12,
                paddingBottom: 24,
              }}
            >
              <View style={{ gap: 12 }}>
                {renderLeftColumn()}
                
                {error ? (
                  <View
                    style={{
                      backgroundColor: C.redBg,
                      borderWidth: 1,
                      borderColor: `${C.red}44`,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: C.red, fontSize: 12, fontWeight: '600' }}>{error}</Text>
                  </View>
                ) : null}

                {renderCTAButton()}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}