import { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

export function useOwnerBackHandler(isModalOpen?: boolean, closeModal?: () => void) {
  const pathname = usePathname();
  const router = useRouter();
  const backPressedOnce = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // Priority 1: If a modal is open, close the modal first
      if (isModalOpen && closeModal) {
        closeModal();
        return true;
      }

      // Check if user is currently on the Owner Dashboard
      const isOnDashboard =
        pathname === '/dashboard' ||
        pathname === '/(owner)/dashboard' ||
        pathname === '/(owner)' ||
        pathname === '/';

      // Priority 2: If not on dashboard, navigate back to Owner Dashboard
      if (!isOnDashboard) {
        router.replace('/(owner)/dashboard' as any);
        return true;
      }

      // Priority 3: If on dashboard, handle double-tap to exit app
      if (backPressedOnce.current) {
        BackHandler.exitApp();
        return true;
      }

      backPressedOnce.current = true;
      ToastAndroid.show('Tekan sekali lagi untuk keluar', ToastAndroid.SHORT);

      const timer = setTimeout(() => {
        backPressedOnce.current = false;
      }, 2000);

      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [pathname, isModalOpen, closeModal, router]);
}
