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
import { QrCode } from 'lucide-react-native';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading: authLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [fontsLoaded] = useFonts({ ...Ionicons.font });
  const [isDbChecked, setIsDbChecked] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // 1. Navigasyon motoru tam hazır olmadan işlem yapma
    if (!rootNavigationState?.key) return;
    
    // 2. Fontlar veya Auth yükleniyorsa bekle
    if (authLoading || !fontsLoaded) return;

    const segment = segments[0];
    const inAuthGroup = segment === '(tabs)' || segment === 'activate' || segment === 'manual-activation';

    if (!user) {
      // 🔴 Kullanıcı Çıkış Yapmış Durumda
      setIsDbChecked(true); // Loading'i kapat
      if (inAuthGroup) {
        router.replace('/'); // Sadece içerideyken dışarı at
      }
    } else {
      // 🟢 Kullanıcı Giriş Yapmış Durumda -> Veritabanı Kontrolü
      const checkUser = async () => {
        try {
          const ref = doc(db, 'users', user.uid);
          const snap = await getDoc(ref);
          const completed = snap.exists() && snap.data().registrationCompleted === true;

          if (!completed) {
            // Kayıt yarım kalmış, activate sayfasına yolla
            if (segment !== 'activate') {
              router.replace('/activate');
            }
          } else {
            // Kayıt tamamsa ve yetkisiz sayfalardaysa (login, index) içeri al
            if (!inAuthGroup) {
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          console.error('DB Check error:', error);
        } finally {
          setIsDbChecked(true); // İşlem bitti, loading'i kapat
        }
      };

      checkUser();
    }
  }, [user, authLoading, fontsLoaded, rootNavigationState?.key, segments]); 

  // --- YÜKLEME DURUMU ---
  const isLoading = !fontsLoaded || authLoading || !isDbChecked;

  return (
    <View style={{ flex: 1 }}>
      {/* 1. İSKELET ASLA SİLİNMEZ: Yükleme bitmese bile altta gizlice çalışır */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="register-tag" />
        <Stack.Screen name="manual-activation" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>

      {/* 2. YÜKLEME PERDESİ: İskeletin üstünü tamamen kaplayan yükleme ekranı */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.iconContainer}>
            <QrCode size={64} color="#2563EB" />
          </View>
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
        </View>
      )}
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
  // Bu stil yükleme ekranını ana ekranın tam üstüne yapıştırır
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    zIndex: 999 
  },
  iconContainer: { 
    padding: 20, 
    backgroundColor: '#EFF6FF', 
    borderRadius: 50 
  },
});