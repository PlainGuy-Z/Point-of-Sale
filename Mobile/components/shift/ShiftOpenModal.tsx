import React, { useState, useCallback } from 'react';
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
import { AlertCircle } from 'lucide-react-native';
import { useShift } from '../../contexts/ShiftContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { formatRupiah } from '../../utils/currency';
import Numpad from '../common/Numpad';

interface ShiftOpenModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ShiftOpenModal({ visible, onClose, onSuccess }: ShiftOpenModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const { openShift, isOpening, error, clearError } = useShift();

  const [kasAwalStr, setKasAwalStr] = useState('');
  const [localError, setLocalError] = useState('');

  const handleClose = useCallback(() => {
    setKasAwalStr('');
    setLocalError('');
    clearError();
    onClose();
  }, [onClose, clearError]);

  const handleSubmit = useCallback(async () => {
    setLocalError('');
    const amount = parseInt(kasAwalStr || '0', 10);

    // Validation
    if (!kasAwalStr.trim()) {
      setLocalError('Modal awal harus diisi');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      setLocalError('Masukkan jumlah yang valid (tidak boleh negatif)');
      return;
    }
    if (amount === 0) {
      setLocalError('Modal awal tidak boleh 0 (minimal Rp1)');
      return;
    }

    try {
      await openShift(amount);
      setKasAwalStr('');
      setLocalError('');
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      setLocalError(err?.message || 'Gagal membuka shift');
    }
  }, [kasAwalStr, openShift, onSuccess, handleClose]);

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
          maxHeight: isLandscape ? '95%' : '85%',
          width: '100%',
          maxWidth: isLandscape ? 800 : 500,
          alignSelf: 'center',
          borderTopWidth: 1,
          borderColor: c.border,
        }}>
          {isLandscape ? (
            <View style={{ flexDirection: 'row', gap: 24 }}>
              {/* Left Column: Info & Amount Display */}
              <View style={{ flex: 1.1, justifyContent: 'space-between' }}>
                <View>
                  {/* Header */}
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{
                      color: c.text,
                      fontSize: 18,
                      fontWeight: '800',
                      marginBottom: 4,
                    }}>
                      Buka Shift
                    </Text>
                    <Text style={{
                      color: c.textSecondary,
                      fontSize: 13,
                    }}>
                      Masukkan modal awal (uang di laci saat buka)
                    </Text>
                  </View>

                  {/* Amount Display */}
                  <View style={{
                    backgroundColor: c.bgInput,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}>
                    <Text style={{
                      color: c.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
                      marginBottom: 6,
                    }}>
                      MODAL AWAL
                    </Text>
                    <Text style={{
                      color: c.text,
                      fontSize: 24,
                      fontWeight: '900',
                    }}>
                      {formatRupiah(parseInt(kasAwalStr || '0', 10))}
                    </Text>
                  </View>
                </View>

                {/* Info Box */}
                <View style={{
                  backgroundColor: c.bgInput,
                  borderRadius: 12,
                  padding: 12,
                  gap: 6,
                }}>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 11,
                    fontWeight: '600',
                  }}>
                    INFO:
                  </Text>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 11,
                    lineHeight: 16,
                  }}>
                    • Catat uang yang ada di laci saat buka shift{'\n'}
                    • Semua transaksi akan dicatat dalam shift ini{'\n'}
                    • Shift harus ditutup untuk selesai sesi kasir
                  </Text>
                </View>
              </View>

              {/* Right Column: Numpad & Action Buttons */}
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View>
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
                      marginBottom: 12,
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

                  {/* Numpad */}
                  <Numpad value={kasAwalStr} onChange={setKasAwalStr} />
                </View>

                {/* Action Buttons */}
                <View style={{
                  flexDirection: 'row',
                  gap: 12,
                  marginTop: 16,
                }}>
                  <TouchableOpacity
                    onPress={handleClose}
                    disabled={isOpening}
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
                    disabled={isOpening || !kasAwalStr.trim()}
                    style={{
                      flex: 1,
                      backgroundColor: isOpening ? c.accentBg : c.accent,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    {isOpening ? (
                      <ActivityIndicator color={c.textInverse} size="small" />
                    ) : (
                      <Text style={{
                        color: c.textInverse,
                        fontWeight: '800',
                        fontSize: 14,
                      }}>
                        Mulai Shift
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
                  Buka Shift
                </Text>
                <Text style={{
                  color: c.textSecondary,
                  fontSize: 13,
                }}>
                  Masukkan modal awal (uang di laci saat buka)
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

                {/* Amount Display */}
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
                    MODAL AWAL
                  </Text>
                  <Text style={{
                    color: c.text,
                    fontSize: 28,
                    fontWeight: '900',
                  }}>
                    {formatRupiah(parseInt(kasAwalStr || '0', 10))}
                  </Text>
                </View>

                {/* Numpad */}
                <Numpad value={kasAwalStr} onChange={setKasAwalStr} />

                {/* Info Box */}
                <View style={{
                  backgroundColor: c.bgInput,
                  borderRadius: 12,
                  padding: 12,
                  marginTop: 16,
                  gap: 8,
                }}>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    INFO:
                  </Text>
                  <Text style={{
                    color: c.textSecondary,
                    fontSize: 12,
                    lineHeight: 18,
                  }}>
                    • Uang laci saat buka shift ini{'\n'}
                    • Semua transaksi kasir akan dicatat di sesi ini{'\n'}
                    • Wajib tutup shift di akhir tugas kasir
                  </Text>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 20,
              }}>
                <TouchableOpacity
                  onPress={handleClose}
                  disabled={isOpening}
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
                  disabled={isOpening || !kasAwalStr.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: isOpening ? c.accentBg : c.accent,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                  }}
                >
                  {isOpening ? (
                    <ActivityIndicator color={c.textInverse} />
                  ) : (
                    <Text style={{
                      color: c.textInverse,
                      fontWeight: '800',
                      fontSize: 15,
                    }}>
                      Mulai Shift
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
