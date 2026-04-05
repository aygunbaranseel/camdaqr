import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/authContext';

// Firebase
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// Fonts & Splash
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Icon
import { QrCode } from 'lucide-react-native';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // 1. BU ÇOK ÖNEMLİ: Navigasyon sistemi hazır mı?
  const rootNavigationState = useRootNavigationState();

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  const [isReady, setIsReady] = useState(false);

  // Splash hide
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // Auth + Route Guard
  useEffect(() => {
    // 2. Navigation hazır değilse işlem yapma (Hata önleyici)
    if (!rootNavigationState?.key) return;
    
    if (authLoading || !fontsLoaded) return;

    const run = async () => {
      const segment = segments[0];
      const isIndex = segment === undefined;

      const isProtectedRoute =
        segment === '(tabs)' || segment === 'manual-activation';

      // 🔴 USER YOK (Çıkış Yapılmış)
      if (!user) {
        setIsReady(true); // Loading'i kapat

        if (isProtectedRoute) {
          // --- BURASI index.tsx'e ('/') YÖNLENDİRİR ---
          router.replace('/');
        }
        return;
      }

      // 🟢 USER VAR -> DB KONTROL
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        const completed =
          snap.exists() && snap.data().registrationCompleted === true;

        if (!completed) {
          if (isProtectedRoute) {
            router.replace('/activate');
          }
        } else {
          // Eğer login veya index sayfasındaysa (tabs)'e gönder
          if (isIndex || segment === 'login') {
            router.replace('/(tabs)');
          }
        }
      } catch (e) {
        console.error('DB error:', e);
      } finally {
        setIsReady(true);
      }
    };

    run();
  }, [user, authLoading, segments, fontsLoaded, rootNavigationState?.key]); // Key'i dinle


  if (!fontsLoaded || authLoading || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.iconContainer}>
          <QrCode size={64} color="#2563EB" />
        </View>
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="activate" options={{ headerShown: false }} />
        <Stack.Screen name="register-tag" options={{ headerShown: false }} />
        <Stack.Screen
          name="manual-activation"
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 50,
  },
});