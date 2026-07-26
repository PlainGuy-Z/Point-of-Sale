import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Store, ChevronDown, Check, X, Building2 } from 'lucide-react-native';
import { useBranch } from '../../contexts/BranchContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';

export default function BranchSelectorHeader() {
  const { isOwner } = useAuth();
  const { branches, selectedBranchId, setSelectedBranchId, currentBranch, hasSingleBranch } = useBranch();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  const [modalVisible, setModalVisible] = useState(false);

  // Requirement: Navbar branch selector only renders if owner AND shop has > 1 branch
  if (!isOwner || hasSingleBranch) {
    return null;
  }

  const activeBranches = branches.filter((b) => b.is_active);

  const handleSelect = (id: string | 'all') => {
    setSelectedBranchId(id);
    setModalVisible(false);
  };

  const displayText = selectedBranchId === 'all'
    ? 'Semua Cabang'
    : (currentBranch?.name || 'Pilih Cabang');

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderWidth: 1,
          borderColor: c.border,
        }}
      >
        <Store size={13} color={c.accent} strokeWidth={2.2} />
        <Text
          numberOfLines={1}
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: c.text,
            maxWidth: 110,
          }}
        >
          {displayText}
        </Text>
        <ChevronDown size={13} color={c.textSecondary} strokeWidth={2} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: 480,
              backgroundColor: c.bgCard,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.border,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: c.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={18} color={c.accent} strokeWidth={2} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: c.text }}>
                  Pilih Cabang
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={c.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Branch List */}
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {/* Option: Semua Cabang */}
              <TouchableOpacity
                onPress={() => handleSelect('all')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor:
                    selectedBranchId === 'all'
                      ? c.accentBg
                      : (isDark ? '#252525' : '#f8fafc'),
                  borderWidth: 1,
                  borderColor:
                    selectedBranchId === 'all'
                      ? c.accent
                      : c.border,
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: selectedBranchId === 'all' ? c.accent : c.text,
                    }}
                  >
                    Semua Cabang
                  </Text>
                  <Text style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>
                    Tampilkan gabungan data dari seluruh cabang
                  </Text>
                </View>
                {selectedBranchId === 'all' && (
                  <Check size={18} color={c.accent} strokeWidth={2.5} />
                )}
              </TouchableOpacity>

              {/* Specific Branches */}
              {activeBranches.map((branch) => {
                const isSelected = selectedBranchId === branch.id;
                return (
                  <TouchableOpacity
                    key={branch.id}
                    onPress={() => handleSelect(branch.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 14,
                      borderRadius: 12,
                      backgroundColor: isSelected
                        ? c.accentBg
                        : (isDark ? '#252525' : '#f8fafc'),
                      borderWidth: 1,
                      borderColor: isSelected ? c.accent : c.border,
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: isSelected ? c.accent : c.text,
                          }}
                        >
                          {branch.name}
                        </Text>
                        {branch.is_default && (
                          <View
                            style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 4,
                              backgroundColor: isDark ? '#3b82f622' : '#dbeafe',
                            }}
                          >
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#3b82f6' }}>
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>
                      {branch.address ? (
                        <Text
                          numberOfLines={1}
                          style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}
                        >
                          {branch.address}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && (
                      <Check size={18} color={c.accent} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
