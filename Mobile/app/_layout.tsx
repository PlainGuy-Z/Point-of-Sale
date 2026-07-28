import '../global.css';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { AuthProvider } from '../contexts/AuthContext';
import { BranchProvider } from '../contexts/BranchContext';
import { AppProvider } from '../contexts/AppContext';
import { ShiftProvider } from '../contexts/ShiftContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { getColors } from '../utils/theme';
import { PrinterProvider } from '../contexts/PrinterContext';
import { AIProvider } from '../contexts/AIContext';
import { SyncProvider } from '../contexts/SyncContext';
import AnimatedSplash from '../components/AnimatedSplash';

function ThemedStack() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const c = getColors(isDark);

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    async function unlockOrientation() {
      await ScreenOrientation.unlockAsync();
    }
    void unlockOrientation();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <AuthProvider>
          <BranchProvider>
            <ThemeProvider>
              <SyncProvider>
                <AppProvider>
                  <ShiftProvider>
                    <PrinterProvider>
                      <AIProvider>
                        <ThemedStack />
                      </AIProvider>
                    </PrinterProvider>
                  </ShiftProvider>
                </AppProvider>
              </SyncProvider>
            </ThemeProvider>
          </BranchProvider>
        </AuthProvider>
      </SafeAreaProvider>

      {showSplash && (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      )}
    </GestureHandlerRootView>
  );
}
