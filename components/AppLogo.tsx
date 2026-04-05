import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AppLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        {/* Camda Yazısı */}
        <Text style={styles.textMain}>Camda</Text>
        
        {/* QR ve Üst Çizgi Grubu */}
        <View style={styles.qrGroup}>
          <View style={styles.topLine} />
          <Text style={styles.textAccent}>QR</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  logoRow: {
    flexDirection: 'row',
    // Harflerin alt hizasını (baseline) eşitlemek için flex-end kullanıyoruz
    alignItems: 'flex-end', 
  },
  textMain: {
    fontFamily: 'System',
    fontSize: 40,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: -0.5,
    // QR yazısıyla tam hizalanması için küçük bir padding ayarı
    paddingBottom: 2, 
  },
  qrGroup: {
    alignItems: 'center',
    marginLeft: 6,
  },
  topLine: {
    width: '100%', 
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 2,
    // Çizgi ile QR harfleri arasındaki mesafe
    marginBottom: 2, 
  },
  textAccent: {
    fontFamily: 'System',
    fontSize: 40,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 1,
    // QR'ın altını Camda ile eşitlemek için satır yüksekliğini netleştiriyoruz
    lineHeight: 45, 
  },
});