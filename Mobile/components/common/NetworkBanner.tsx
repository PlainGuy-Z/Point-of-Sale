import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function NetworkBanner() {
  // Placeholder — in production, use NetInfo from @react-native-community/netinfo
  const [isOffline] = useState(false);

  if (!isOffline) return null;

  return (
    <View style={{
      backgroundColor: '#ef4444',
      paddingVertical: 6,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}>
      <Feather name="wifi-off" size={14} color="#fff" />
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Tidak ada koneksi internet</Text>
    </View>
  );
}
