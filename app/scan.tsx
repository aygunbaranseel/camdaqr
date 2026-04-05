import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- YENİ İKONLAR (LUCIDE) ---
import { Camera, X } from 'lucide-react-native';

// --- SERVİSLER ---
import { checkActivationCode } from '../services/authService';
import { auth } from '../services/firebaseConfig';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!permission) {
    return <View style={styles.container} />;
  }

  // --- İZİN YOKSA GÖSTERİLECEK EKRAN ---
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.permissionContent}>
            <View style={styles.permissionIconOuter}>
                <View style={styles.permissionIconInner}>
                    <Camera size={48} color="#2563EB" />
                </View>
            </View>
            <Text style={styles.permissionTitle}>Kamera Erişimi Gerekli</Text>
            <Text style={styles.permissionDesc}>
                QR kodlarını tarayabilmek ve araç etiketinizi aktif edebilmek için kameranızı kullanmamıza izin vermelisiniz.
            </Text>
            <View style={{ width: '100%', gap: 12 }}>
                <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission} activeOpacity={0.8}>
                    <Text style={styles.permissionBtnText}>Kameraya İzin Ver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={styles.secondaryBtnText}>Şimdilik Vazgeç</Text>
                </TouchableOpacity>
            </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return; 
    setScanned(true);
    setLoading(true);

    try {
      // 1. Kodu linkten temizle
      let activationCode = data;
      if (data.includes('code=')) {
        activationCode = data.split('code=')[1].split('&')[0]; 
      }

      // 2. Kodu veritabanında kontrol et
      const checkResult = await checkActivationCode(activationCode);

      if (checkResult.success) {
        const user = auth.currentUser;

        if (!user) {
            // DURUM 1: KULLANICI GİRİŞ YAPMAMIŞ -> Kayıt sayfasına gönder
            // Artık Alert göstermiyoruz, direkt register-tag'e yönlendiriyoruz
            router.replace({
                pathname: '/register-tag',
                params: { activationCode: activationCode }
            });
        } else {
            // DURUM 2: KULLANICI GİRİŞ YAPMIŞ -> Araç ekleme sayfasına gönder
            router.replace({
                pathname: '/manual-activation',
                params: { autoFilledCode: activationCode }
            });
        }
      } else {
        Alert.alert(
            "Geçersiz Kod", 
            checkResult.message || "Bu QR kod sistemde bulunamadı veya kullanılmış.",
            [{ text: "Tekrar Dene", onPress: () => { setScanned(false); setLoading(false); } }]
        );
      }

    } catch (error) {
      Alert.alert("Hata", "Okuma sırasında bir sorun oluştu.", [{ text: "Tamam", onPress: () => { setScanned(false); setLoading(false); } }]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <X size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.title}>QR Kodu Taratın</Text>
                <View style={styles.emptyBalancer} />
            </View>
        </View>

        <View style={styles.middleContainer}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {loading && <ActivityIndicator size="large" color="#2563EB" style={{flex: 1}} />}
            </View>
            <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
            <Text style={styles.instruction}>
                Aracınızın camına yapıştıracağınız{"\n"}akıllı etiketi karenin içine getirin.
            </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionContent: { width: '100%', maxWidth: 360, alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, backgroundColor: 'white', borderRadius: 32, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  permissionIconOuter: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#DBEAFE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  permissionIconInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  permissionDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 24, paddingHorizontal: 10 },
  permissionBtn: { backgroundColor: '#2563EB', paddingVertical: 18, width: '100%', borderRadius: 20, alignItems: 'center', shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  permissionBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { paddingVertical: 14, width: '100%', alignItems: 'center', marginTop: 4, backgroundColor: '#F3F4F6', borderRadius: 20 },
  secondaryBtnText: { color: '#4B5563', fontWeight: '600', fontSize: 15 },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start', paddingTop: Platform.OS === 'android' ? 50 : 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, width: '100%' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  title: { color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center', flex: 1 },
  emptyBalancer: { width: 44, height: 44 },
  middleContainer: { flexDirection: 'row', height: SCAN_AREA_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanFrame: { width: SCAN_AREA_SIZE, height: SCAN_AREA_SIZE, justifyContent: 'center', alignItems: 'center' },
  corner: { position: 'absolute', width: 20, height: 20, borderColor: '#2563EB', borderWidth: 4 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  bottomOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 30 },
  instruction: { color: '#D1D5DB', textAlign: 'center', fontSize: 14, lineHeight: 22 },
});