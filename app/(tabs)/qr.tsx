import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// --- FIREBASE IMPORT ---
// Firebase yapılandırma dosyanızın yolunu doğru olduğundan emin olun
import { auth } from '../../services/firebaseConfig';

// --- İKONLAR (LUCIDE) ---
import { Camera, ChevronRight, Keyboard, QrCode } from 'lucide-react-native';

const BOTTOM_SPACING = 180; 

export default function QRScreen() {
  const router = useRouter();

  // --- KONTROLLÜ YÖNLENDİRME FONKSİYONU ---
  const handleManualActivation = () => {
    const user = auth.currentUser;

    if (!user) {
      // KULLANICI GİRİŞ YAPMAMIŞSA
      Alert.alert(
        "Oturum Açmalısınız",
        "Manuel aktivasyon yapabilmek için lütfen giriş yapın.",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Giriş Yap", onPress: () => router.push('/login') }
        ]
      );
    } else {
      // KULLANICI GİRİŞ YAPMIŞSA -> Sayfaya git
      router.push('/manual-activation');
    }
  };

  const handleCameraScan = () => {
     // İstersen kamera için de aynı kontrolü buraya ekleyebilirsin
     router.push('/scan');
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ÜST KISIM */}
      <View style={styles.headerArea}>
        <View style={styles.iconCircle}>
           <QrCode size={70} color="#2563EB" />
        </View>
        <Text style={styles.headerTitle}>Yeni Araç Ekle</Text>
        <Text style={styles.headerSubtitle}>
          Aracınızın camındaki QR kodu okutun veya size verilen kodu girin.
        </Text>
      </View>

      {/* ALT KISIM */}
      <View style={styles.actionCard}>
        
        <View style={styles.buttonsWrapper}>
            {/* KAMERA BUTONU */}
            <TouchableOpacity 
                style={styles.primaryBtn} 
                activeOpacity={0.8}
                onPress={handleCameraScan}
            >
                <View style={styles.btnIconBg}>
                    <Camera size={24} color="#2563EB" />
                </View>
                <View>
                    <Text style={styles.primaryBtnText}>Kamerayı Aç</Text>
                    <Text style={styles.primaryBtnSub}>QR Kodu Tara</Text>
                </View>
                <ChevronRight size={20} color="white" style={{marginLeft:'auto', opacity:0.8}} />
            </TouchableOpacity>

            <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>VEYA</Text>
                <View style={styles.line} />
            </View>

            {/* KOD GİRME BUTONU */}
            <TouchableOpacity 
                style={styles.secondaryBtn} 
                activeOpacity={0.7}
                // DÜZELTİLDİ: Doğrudan router.push yerine kontrol fonksiyonunu çağırıyoruz
                onPress={handleManualActivation}
            >
                <Keyboard size={22} color="#4B5563" />
                <Text style={styles.secondaryBtnText}>Kod ile Etkinleştir</Text>
            </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#2563EB', 
  },
  headerArea: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -20 
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 40, 
    paddingBottom: BOTTOM_SPACING, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20
  },
  buttonsWrapper: {
    width: '100%',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20
  },
  btnIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  primaryBtnSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500'
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB'
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  secondaryBtn: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  secondaryBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10
  }
});