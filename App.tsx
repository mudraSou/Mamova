import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts,
  NotoSerif_400Regular, NotoSerif_700Bold,
} from '@expo-google-fonts/noto-serif';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from '@/navigation';
import { useProfileStore } from '@/store/profileStore';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSerif_400Regular,
    NotoSerif_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const { initialize } = useProfileStore();

  useEffect(() => { initialize(); }, []);

  // Constrain to phone width on desktop browsers
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const el = document.createElement('style');
    el.textContent = `
      html, body { background: #fdf8f3; }
      #root { max-width: 430px; margin: 0 auto; box-shadow: 0 0 60px rgba(60,35,25,0.07); }
    `;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="transparent" translucent />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
