import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/authContext';

// Fonts & Splash
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { QrCode } from 'lucide-react-native';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  // 1. ARTIK SORGULARI BURADA YAPMIYORUZ! Her şeyi hazır olarak AuthContext'ten alıyoruz.
  const { user, loading, isDbChecked, registrationCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  // Splash ekranını gizle
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  // 2. TERTEMİZ YÖNLENDİRME (ROUTING) MANTIĞI
  useEffect(() => {
    // Navigasyon motoru, fontlar veya Context kontrolleri bitmeden kılını bile kıpırdatma!
    if (!rootNavigationState?.key || !fontsLoaded || loading || !isDbChecked) return;

    const segment = segments[0];
    const inTabs = segment === '(tabs)';
    const inActivate = segment === 'activate';

    if (!user) {
      // 🔴 Kullanıcı Yok: Eğer içerideki sayfalardaysa dışarı at
      if (inTabs || inActivate) {
        router.replace('/login'); // (Veya index sayfan hangisiyse)
      }
    } else {
      // 🟢 Kullanıcı Var ama Kayıt Yarım: Activate sayfasına yolla
      if (!registrationCompleted) {
        if (!inActivate) {
          router.replace('/activate');
        }
      } 
      // 🟢 Kullanıcı Var ve Kayıt Tamam: Ana sayfaya (tabs) yolla
      else {
        if (!inTabs) {
          router.replace('/(tabs)');
        }
      }
    }
  }, [user, loading, isDbChecked, registrationCompleted, fontsLoaded, rootNavigationState?.key, segments]); 

  // --- YÜKLEME PERDESİ İÇİN DURUM KONTROLÜ ---
  const isLoading = !fontsLoaded || loading || !isDbChecked;

  return (
    <View style={{ flex: 1 }}>
      {/* İSKELET ASLA SİLİNMEZ - Arka planda her zaman hazırdır */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="register-tag" />
        <Stack.Screen name="manual-activation" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>

      {/* İskeletin üzerine çekilen ve işlemler bitince kaybolan yükleme perdesi */}
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