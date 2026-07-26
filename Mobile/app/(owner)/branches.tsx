import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Store,
  MapPin,
  Phone,
  Check,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import { useBranch } from '../../contexts/BranchContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getColors } from '../../utils/theme';
import { branchApi, CreateBranchInput, UpdateBranchInput } from '../../services/branchApi';
import type { Branch } from '../../types';

export default function BranchesScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isLandscape = windowWidth > windowHeight;

  const { branches, refreshBranches, isLoading: isContextLoading } = useBranch();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    notes: '',
    is_active: true,
  });

  const openAddModal = () => {
    setEditingBranch(null);
    setForm({
      name: '',
      address: '',
      phone: '',
      city: '',
      notes: '',
      is_active: true,
    });
    setModalVisible(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      city: branch.city || '',
      notes: branch.notes || '',
      is_active: branch.is_active !== false,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Validasi Error', 'Nama cabang wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingBranch) {
        // Edit existing branch
        const input: UpdateBranchInput = {
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          city: form.city.trim() || undefined,
          notes: form.notes.trim() || undefined,
          is_active: form.is_active,
        };
        await branchApi.updateBranch(editingBranch.id, input);
      } else {
        // Add new branch
        const input: CreateBranchInput = {
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          city: form.city.trim() || undefined,
          notes: form.notes.trim() || undefined,
          is_active: form.is_active,
        };
        await branchApi.createBranch(input);
      }

      await refreshBranches();
      setModalVisible(false);
      Alert.alert('Sukses', editingBranch ? 'Cabang berhasil diperbarui' : 'Cabang baru berhasil ditambahkan');
    } catch (err: any) {
      console.error('Failed to save branch:', err);
      Alert.alert('Gagal Menyimpan', err?.message || 'Terjadi kesalahan saat menyimpan data cabang');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (branch: Branch) => {
    if (branch.is_default) {
      Alert.alert('Peringatan', 'Cabang utama (default) tidak dapat dihapus.');
      return;
    }

    Alert.alert(
      'Hapus Cabang',
      `Apakah Anda yakin ingin menghapus cabang "${branch.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await branchApi.deleteBranch(branch.id);
              await refreshBranches();
              Alert.alert('Sukses', 'Cabang telah berhasil dihapus.');
            } catch (err: any) {
              console.error('Failed to delete branch:', err);
              // Handle error: recommend deactivating instead
              Alert.alert(
                'Tidak Dapat Dihapus',
                err?.message || 'Cabang tidak dapat dihapus karena masih memiliki data terhubung.',
                [
                  { text: 'Tutup', style: 'cancel' },
                  {
                    text: 'Nonaktifkan Cabang',
                    onPress: async () => {
                      try {
                        await branchApi.updateBranch(branch.id, { is_active: false });
                        await refreshBranches();
                        Alert.alert('Sukses', 'Cabang telah dinonaktifkan.');
                      } catch (e: any) {
                        Alert.alert('Error', e?.message || 'Gagal menonaktifkan cabang');
                      }
                    },
                  },
                ]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const toggleBranchActive = async (branch: Branch, newValue: boolean) => {
    if (branch.is_default && !newValue) {
      Alert.alert('Peringatan', 'Cabang utama (default) tidak boleh dinonaktifkan.');
      return;
    }

    try {
      await branchApi.updateBranch(branch.id, { is_active: newValue });
      await refreshBranches();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Gagal mengubah status cabang');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: c.bgCard,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <ArrowLeft size={22} color={c.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Building2 size={20} color={c.accent} strokeWidth={2} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: c.text }}>Kelola Cabang</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={openAddModal}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: c.accent,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Plus size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {isContextLoading && branches.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={{ color: c.textSecondary, marginTop: 12 }}>Memuat daftar cabang...</Text>
          </View>
        ) : branches.length === 0 ? (
          <View
            style={{
              padding: 32,
              alignItems: 'center',
              backgroundColor: c.bgCard,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: c.border,
            }}
          >
            <Building2 size={40} color={c.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text, marginTop: 12 }}>
              Belum Ada Cabang
            </Text>
            <Text style={{ fontSize: 12, color: c.textSecondary, textAlign: 'center', marginTop: 4 }}>
              Klik tombol Tambah di atas untuk membuat cabang toko Anda.
            </Text>
          </View>
        ) : (
          branches.map((branch) => (
            <View
              key={branch.id}
              style={{
                backgroundColor: c.bgCard,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: c.border,
                padding: 16,
                gap: 12,
                opacity: branch.is_active ? 1 : 0.6,
              }}
            >
              {/* Header Card */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: c.text }}>
                      {branch.name}
                    </Text>
                    {branch.is_default && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#3b82f6' }}>
                          DEFAULT
                        </Text>
                      </View>
                    )}
                    {!branch.is_active && (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#ef4444' }}>
                          NONAKTIF
                        </Text>
                      </View>
                    )}
                  </View>

                  {branch.city ? (
                    <Text style={{ fontSize: 12, fontWeight: '600', color: c.accent, marginTop: 2 }}>
                      {branch.city}
                    </Text>
                  ) : null}
                </View>

                {/* Switch Active */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Switch
                    value={branch.is_active}
                    onValueChange={(val) => toggleBranchActive(branch, val)}
                    disabled={branch.is_default}
                    trackColor={{ false: isDark ? '#444' : '#cbd5e1', true: c.accent }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Details */}
              <View style={{ gap: 6 }}>
                {branch.address ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <MapPin size={14} color={c.textSecondary} style={{ marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: 12, color: c.textSecondary }}>
                      {branch.address}
                    </Text>
                  </View>
                ) : null}

                {branch.phone ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Phone size={14} color={c.textSecondary} />
                    <Text style={{ fontSize: 12, color: c.textSecondary }}>{branch.phone}</Text>
                  </View>
                ) : null}

                {branch.notes ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                    <FileText size={14} color={c.textSecondary} style={{ marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: 12, color: c.textSecondary, fontStyle: 'italic' }}>
                      {branch.notes}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Actions Footer */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 4,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: c.border,
                }}
              >
                <TouchableOpacity
                  onPress={() => openEditModal(branch)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: isDark ? '#252525' : '#f1f5f9',
                  }}
                >
                  <Edit2 size={13} color={c.text} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>Edit</Text>
                </TouchableOpacity>

                {!branch.is_default && (
                  <TouchableOpacity
                    onPress={() => handleDelete(branch)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2',
                    }}
                  >
                    <Trash2 size={13} color="#ef4444" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#ef4444' }}>Hapus</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Form Tambah/Edit Cabang */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: c.bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: windowHeight * 0.88,
              gap: 16,
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: c.text }}>
                {editingBranch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
              {/* Nama Cabang */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>
                  Nama Cabang <Text style={{ color: '#ef4444' }}>*</Text>
                </Text>
                <TextInput
                  value={form.name}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, name: val }))}
                  placeholder="misal: Cabang Sudirman"
                  placeholderTextColor={c.textSecondary}
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: c.text,
                  }}
                />
              </View>

              {/* Kota */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>Kota</Text>
                <TextInput
                  value={form.city}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, city: val }))}
                  placeholder="misal: Jakarta Selatan"
                  placeholderTextColor={c.textSecondary}
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: c.text,
                  }}
                />
              </View>

              {/* Nomor Telepon */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>Nomor Telepon</Text>
                <TextInput
                  value={form.phone}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, phone: val }))}
                  placeholder="misal: 08123456789"
                  keyboardType="phone-pad"
                  placeholderTextColor={c.textSecondary}
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: c.text,
                  }}
                />
              </View>

              {/* Alamat */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>Alamat Lengkap</Text>
                <TextInput
                  value={form.address}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, address: val }))}
                  placeholder="misal: Jl. Jendral Sudirman No. 45"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor={c.textSecondary}
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: c.text,
                    minHeight: 70,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Catatan/Notes */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: c.text }}>Catatan / Jam Operasional</Text>
                <TextInput
                  value={form.notes}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, notes: val }))}
                  placeholder="misal: Buka 08:00 - 22:00"
                  multiline
                  numberOfLines={2}
                  placeholderTextColor={c.textSecondary}
                  style={{
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    borderWidth: 1,
                    borderColor: c.border,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: c.text,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                />
              </View>

              {/* Status Toggle */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>Status Aktif</Text>
                  <Text style={{ fontSize: 11, color: c.textSecondary }}>
                    Cabang nonaktif tidak akan muncul di opsi transaksi POS.
                  </Text>
                </View>
                <Switch
                  value={form.is_active}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, is_active: val }))}
                  disabled={editingBranch?.is_default}
                  trackColor={{ false: isDark ? '#444' : '#cbd5e1', true: c.accent }}
                  thumbColor="#ffffff"
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 10 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#252525' : '#f1f5f9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: c.text }}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: c.accent,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" strokeWidth={2.5} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>Simpan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
