import { useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// --- DEĞİŞİKLİK 1: Lucide İkonlarını Import Et ---
import { Keyboard, QrCode } from 'lucide-react-native';

import AppLogo from '../components/AppLogo';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.contentContainer}>
        
        {/* 1. Bölüm: Logo ve Başlık */}
        <View style={styles.headerSection}>
          <AppLogo />
          <Text style={styles.subtitle}>Aracınız için akıllı iletişim etiketi.</Text>
        </View>

        {/* 2. Bölüm: Aksiyonlar */}
        <View style={styles.actionSection}>
          
          {/* BU BUTON KAMERAYI AÇAR */}
          <TouchableOpacity 
            style={styles.mainButton}
            onPress={() => router.push('/scan')} 
          >
            <View style={styles.iconCircle}>
              {/* DEĞİŞİKLİK 2: QR Kod İkonu */}
              <QrCode size={40} color="#fff" />
            </View>
            <Text style={styles.mainButtonText}>Yeni Etiket Tanımla</Text>
            <Text style={styles.mainButtonSubText}>QR kodu taramak için dokunun</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>VEYA</Text>
            <View style={styles.line} />
          </View>

          {/* BU BUTON ARTIK DOĞRU SAYFAYA (activate) GİDER */}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/activate')} 
          >
             {/* DEĞİŞİKLİK 3: Klavye/Kod İkonu */}
            <Keyboard size={24} color="#333" />
            <Text style={styles.secondaryButtonText}>Kod Girerek Aktifleştir</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Bölüm: Giriş Yap */}
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Zaten hesabınız var mı?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 45,
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: -18,
    fontWeight: '500',
  },
  actionSection: {
    width: '100%',
    maxWidth: 400,
  },
  mainButton: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  iconCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mainButtonSubText: {
    color: '#DBEAFE',
    fontSize: 14,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    marginHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
  },
  secondaryButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  footerSection: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
  },
  loginText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 6,
  },
});