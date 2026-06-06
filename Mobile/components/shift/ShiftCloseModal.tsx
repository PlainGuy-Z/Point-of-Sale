import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { AlertCircle, AlertTriangle } from 'lucide-react-native';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import Numpad from '../common/Numpad';

interface ShiftCloseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShiftCloseModal({ visible, onClose, onSuccess }: ShiftCloseModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const { activeShift, closeShift, isClosing, error, clearError } = useShift();

  const [closingCashStr, setClosingCashStr] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');

  const handleClose = useCallback(() => {
    setClosingCashStr('');
    setNotes('');
    setLocalError('');
    clearError();
    onClose();
  }, [onClose, clearError]);

  // Calculate expected cash
  const expectedCash = useMemo(() => {
    if (!activeShift) return 0;
    return activeShift.current_expected_cash ?? (activeShift.opening_cash + (activeShift.current_total_sales ?? activeShift.total_sales));
  }, [activeShift]);

  const closingCash = parseInt(closingCashStr || '0', 10);
  const difference = closingCash - expectedCash;

  // Determine difference status
  const getDifferenceLabel = () => {
    if (difference === 0) return 'Pas';
    if (difference > 0) return 'Lebih';
    return 'Kurang';
  };

  const getDifferenceColor = () => {
    if (difference === 0) return c.accent;
    if (difference > 0) return c.success;
    return c.error;
  };

  const handleSubmit = useCallback(async () => {
    setLocalError('');
    const amount = parseInt(closingCashStr || '0', 10);

    // Validation
    if (!closingCashStr.trim()) {
      setLocalError('Uang di laci harus diisi');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      setLocalError('Masukkan jumlah yang valid (tidak boleh negatif)');
      return;
    }

    try {
      await closeShift(amount, notes.trim() || undefined);
      setClosingCashStr('');
      setNotes('');
      setLocalError('');
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal menutup shift');
    }
  }, [closingCashStr, notes, closeShift, onSuccess, handleClose]);

  const displayError = localError || error;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}>
        <View style={{
          backgroundColor: c.bgCard,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          maxHeight: isLandscape ? '95%' : '90%',
          width: '100%',
          maxWidth: isLandscape ? 800 : 500,
          alignSelf: 'center',
          borderTopWidth: 1,
          borderColor: c.border,
        }}>
          {isLandscape ? (
            <View style={{ flexDirection: 'row', gap: 24 }}>
              {/* Left Column: Reconciliation Reports & Notes (Scrollable) */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1.1 }}
                contentContainerStyle={{ gap: 12, paddingBottom: 16 }}
              >
                {/* Header */}
                <View style={{ marginBottom: 4 }}>
                  <Text style={{
                    color: c.text,
                    fontSize: 18,
                    fontWeight: '800',
                    marginBottom: 4,
                  }}>
                    Tutup Shift & Rekonsiliasi Kas
                  </Text>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 13,
                  }}>
                    Hitung uang di laci dan tutup shift hari ini
                  </Text>
                </View>

                {/* Error Message */}
                {displayError && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
                    borderRadius: 12,
                    padding: 8,
                    flexDirection: 'row',
                    gap: 8,
                  }}>
                    <AlertCircle size={16} color="#ef4444" strokeWidth={2} />
                    <Text style={{
                      color: '#ef4444',
                      fontSize: 11,
                      flex: 1,
                      fontWeight: '500',
                    }}>
                      {displayError}
                    </Text>
                  </View>
                )}

                {/* Kas Aktual Display */}
                <View style={{
                  backgroundColor: c.bgInput,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 4,
                  }}>
                    UANG DI LACI SEKARANG
                  </Text>
                  <Text style={{
                    color: c.text,
                    fontSize: 24,
                    fontWeight: '900',
                  }}>
                    {formatRupiah(closingCash)}
                  </Text>
                </View>

                {/* Reconciliation Info Table */}
                <View style={{
                  backgroundColor: c.bgInput,
                  borderRadius: 12,
                  padding: 12,
                  gap: 8,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: 6,
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                      Modal Awal
                    </Text>
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
                      {formatRupiah(activeShift?.opening_cash ?? 0)}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: 6,
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                      Penjualan Cash
                    </Text>
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>
                      {formatRupiah(activeShift?.current_total_sales ?? activeShift?.total_sales ?? 0)}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: 6,
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                      Kas Seharusnya
                    </Text>
                    <Text style={{ color: c.accent, fontSize: 12, fontWeight: '700' }}>
                      {formatRupiah(expectedCash)}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                    <View>
                      <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>
                        Selisih
                      </Text>
                      <Text style={{
                        color: getDifferenceColor(),
                        fontSize: 10,
                        marginTop: 1,
                        fontWeight: '600',
                      }}>
                        {getDifferenceLabel()}
                      </Text>
                    </View>
                    <Text style={{
                      color: getDifferenceColor(),
                      fontSize: 12,
                      fontWeight: '800',
                    }}>
                      {formatRupiah(difference)}
                    </Text>
                  </View>
                </View>

                {/* Warning if difference is significant */}
                {Math.abs(difference) > 50000 && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                    borderRadius: 12,
                    padding: 10,
                    flexDirection: 'row',
                    gap: 8,
                  }}>
                    <AlertTriangle size={16} color="#f59e0b" strokeWidth={2} />
                    <Text style={{
                      color: '#f59e0b',
                      fontSize: 11,
                      flex: 1,
                      fontWeight: '500',
                    }}>
                      Terdapat selisih kas. Mohon periksa kembali perhitungan.
                    </Text>
                  </View>
                )}

                {/* Notes Input */}
                <View>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 4,
                  }}>
                    CATATAN (OPSIONAL)
                  </Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Jelaskan catatan jika ada selisih..."
                    placeholderTextColor={c.textMuted}
                    multiline
                    maxLength={500}
                    style={{
                      backgroundColor: c.bgInput,
                      borderRadius: 12,
                      color: c.text,
                      padding: 10,
                      minHeight: 50,
                      textAlignVertical: 'top',
                      fontSize: 12,
                    }}
                  />
                  <Text style={{
                    color: c.textMuted,
                    fontSize: 10,
                    marginTop: 4,
                    textAlign: 'right',
                  }}>
                    {notes.length}/500
                  </Text>
                </View>
              </ScrollView>

              {/* Right Column: Numpad & Buttons */}
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View>
                  {/* Numpad */}
                  <Numpad value={closingCashStr} onChange={setClosingCashStr} />
                </View>

                {/* Action Buttons */}
                <View style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginTop: 16,
                }}>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isClosing}
                    style={{
                      flex: 1,
                      backgroundColor: c.bgInput,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: c.border,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: c.text,
                      fontWeight: '600',
                      fontSize: 14,
                    }}>
                      Batal
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isClosing || !closingCashStr.trim()}
                    style={{
                      flex: 1,
                      backgroundColor: isClosing ? c.errorBg : c.error,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    {isClosing ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{
                        color: '#fff',
                        fontWeight: '800',
                        fontSize: 14,
                      }}>
                        Tutup Shift
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  color: c.text,
                  fontSize: 18,
                  fontWeight: '800',
                  marginBottom: 4,
                }}>
                  Tutup Shift & Rekonsiliasi Kas
                </Text>
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 13,
                }}>
                  Hitung uang di laci dan tutup shift hari ini
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {/* Error Message */}
                {displayError && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    gap: 10,
                    marginBottom: 16,
                  }}>
                    <AlertCircle size={20} color="#ef4444" strokeWidth={2} />
                    <Text style={{
                      color: '#ef4444',
                      fontSize: 13,
                      flex: 1,
                      fontWeight: '500',
                    }}>
                      {displayError}
                    </Text>
                  </View>
                )}

                {/* Kas Aktual Display */}
                <View style={{
                  backgroundColor: c.bgInput,
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 12,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}>
                    UANG DI LACI SEKARANG
                  </Text>
                  <Text style={{
                    color: c.text,
                    fontSize: 28,
                    fontWeight: '900',
                  }}>
                    {formatRupiah(closingCash)}
                  </Text>
                </View>

                {/* Numpad */}
                <Numpad value={closingCashStr} onChange={setClosingCashStr} />

                {/* Reconciliation Info */}
                <View style={{
                  backgroundColor: c.bgInput,
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 16,
                  marginBottom: 16,
                  gap: 10,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                      Modal Awal
                    </Text>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
                      {formatRupiah(activeShift?.opening_cash ?? 0)}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                      Penjualan Cash
                    </Text>
                    <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>
                      {formatRupiah(activeShift?.current_total_sales ?? activeShift?.total_sales ?? 0)}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}>
                    <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>
                      Kas Seharusnya
                    </Text>
                    <Text style={{ color: c.accent, fontSize: 13, fontWeight: '700' }}>
                      {formatRupiah(expectedCash)}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}>
                    <View>
                      <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600' }}>
                        Selisih
                      </Text>
                      <Text style={{
                        color: getDifferenceColor(),
                        fontSize: 11,
                        marginTop: 2,
                        fontWeight: '600',
                      }}>
                        {getDifferenceLabel()}
                      </Text>
                    </View>
                    <Text style={{
                      color: getDifferenceColor(),
                      fontSize: 13,
                      fontWeight: '800',
                    }}>
                      {formatRupiah(difference)}
                    </Text>
                  </View>
                </View>

                {/* Warning if difference is significant */}
                {Math.abs(difference) > 50000 && (
                  <View style={{
                    backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    gap: 10,
                    marginBottom: 16,
                  }}>
                    <AlertTriangle size={20} color="#f59e0b" strokeWidth={2} />
                    <Text style={{
                      color: '#f59e0b',
                      fontSize: 12,
                      flex: 1,
                      fontWeight: '500',
                    }}>
                      Selisih kas cukup besar. Mohon periksa kembali perhitungan.
                    </Text>
                  </View>
                )}

                {/* Notes */}
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 12,
                  fontWeight: '600',
                  marginBottom: 8,
                }}>
                  CATATAN (OPSIONAL)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Dijelaskan catatan jika ada selisih..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  maxLength={500}
                  style={{
                    backgroundColor: c.bgInput,
                    borderRadius: 12,
                    color: c.text,
                    padding: 12,
                    minHeight: 60,
                    textAlignVertical: 'top',
                    fontSize: 13,
                  }}
                />
                <Text style={{
                  color: c.textMuted,
                  fontSize: 11,
                  marginTop: 6,
                  textAlign: 'right',
                }}>
                  {notes.length}/500
                </Text>
              </ScrollView>

              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 20,
              }}>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isClosing}
                  style={{
                    flex: 1,
                    backgroundColor: c.bgInput,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{
                    color: c.text,
                    fontWeight: '600',
                    fontSize: 15,
                  }}>
                    Batal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isClosing || !closingCashStr.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: isClosing ? c.errorBg : c.error,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  {isClosing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{
                      color: '#fff',
                      fontWeight: '800',
                      fontSize: 15,
                    }}>
                      Tutup Shift
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
