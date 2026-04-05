import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface HandPhoneIllustrationProps {
  type: 'phone' | 'otp';
}

export default function HandPhoneIllustration({ type }: HandPhoneIllustrationProps) {
  const colors = {
    primary: "#2563EB", 
    primaryLight: "#60A5FA",
    primaryGlow: "#DBEAFE",
    bgCircle: "#EFF6FF",
    white: "#FFFFFF",
    slateBorder: "#E2E8F0",
    slateDot: "#CBD5E1",
    glassBg: "#F8FAFC",
  };

  return (
    // Boyutlar sayfaya uyum sağlayacak şekilde optimize edildi
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 220, height: 180, marginBottom: 10 }}>
      <Svg width="100%" height="100%" viewBox="0 0 200 180" fill="none">
        <Defs>
          {/* Telefon gövdesi için cam efekti */}
          <LinearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.glassBg} stopOpacity="0.8" />
          </LinearGradient>
          
          {/* Ekran için parlama efekti */}
          <LinearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity="0.9" />
            <Stop offset="1" stopColor={colors.primaryGlow} stopOpacity="0.2" />
          </LinearGradient>

          {/* Arka plan aurası */}
          <LinearGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primaryGlow} stopOpacity="0.6" />
            <Stop offset="1" stopColor={colors.bgCircle} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <G transform="translate(100, 90)">
          {/* --- ARKA PLAN AURA (Yumuşak Apple Dalgaları) --- */}
          <Circle cx="0" cy="0" r="75" fill="url(#glowGrad)" />
          <Circle cx="0" cy="0" r="50" fill={colors.primaryLight} opacity={0.15} />

          {/* --- ANA TELEFON OBJESİ --- */}
          {/* Telefon biraz çapraz, zarif bir açıyla duruyor */}
          <G transform="rotate(-10)">
            {/* Telefon Gövdesi */}
            <Rect 
              x="-40" y="-70" 
              width="80" height="140" 
              rx="18" 
              fill="url(#glassGrad)" 
              stroke={colors.white} 
              strokeWidth="4" 
            />
            {/* Dış Çerçeve (Border) */}
            <Rect 
              x="-40" y="-70" 
              width="80" height="140" 
              rx="18" 
              stroke={colors.slateBorder} 
              strokeWidth="1.5" 
            />

            {/* Çentik (Dynamic Island / Notch) */}
            <Rect x="-15" y="-62" width="30" height="8" rx="4" fill={colors.slateBorder} opacity={0.5} />

            {/* Ekran Alanı */}
            <Rect x="-34" y="-48" width="68" height="110" rx="10" fill="url(#screenGrad)" />

            {/* --- EKRAN İÇİ İÇERİK (Duruma Göre Değişir) --- */}
            {type === 'phone' ? (
              // TELEFON NUMARASI GİRİŞ EKRANI TEMSİLİ
              <G transform="translate(-25, -20)">
                <Rect x="0" y="0" width="30" height="6" rx="3" fill={colors.slateBorder} />
                <Rect x="0" y="12" width="50" height="4" rx="2" fill={colors.slateDot} opacity={0.5} />
                
                {/* Numara Giriş Kutusu */}
                <Rect x="0" y="30" width="50" height="20" rx="6" fill={colors.white} stroke={colors.primaryLight} strokeWidth="1" />
                <Circle cx="10" cy="40" r="2" fill={colors.primary} />
                <Circle cx="16" cy="40" r="2" fill={colors.primary} />
                <Circle cx="22" cy="40" r="2" fill={colors.primary} />
                <Circle cx="28" cy="40" r="2" fill={colors.primaryLight} />
                
                {/* Gönder Butonu Temsili */}
                <Rect x="0" y="60" width="50" height="14" rx="7" fill={colors.primary} opacity={0.8} />
              </G>
            ) : (
              // OTP (ŞİFRE) ONAY EKRANI TEMSİLİ
              <G transform="translate(-25, -20)">
                <Circle cx="25" cy="5" r="12" fill={colors.primaryGlow} />
                {/* Kilit İkonu */}
                <Path d="M21 5 H29 M21 9 H25" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" />
                <Circle cx="25" cy="1" r="3" stroke={colors.primary} strokeWidth="1.5" fill="none" />
                
                {/* Şifre Kutuları */}
                <G transform="translate(0, 35)">
                  <Rect x="0" y="0" width="10" height="14" rx="3" fill={colors.white} stroke={colors.primary} strokeWidth="1" />
                  <Circle cx="5" cy="7" r="2" fill={colors.primary} />
                  
                  <Rect x="13" y="0" width="10" height="14" rx="3" fill={colors.white} stroke={colors.primary} strokeWidth="1" />
                  <Circle cx="18" cy="7" r="2" fill={colors.primary} />
                  
                  <Rect x="26" y="0" width="10" height="14" rx="3" fill={colors.white} stroke={colors.slateBorder} strokeWidth="1" />
                  
                  <Rect x="39" y="0" width="10" height="14" rx="3" fill={colors.white} stroke={colors.slateBorder} strokeWidth="1" />
                </G>
                
                {/* Doğrula Butonu Temsili */}
                <Rect x="0" y="65" width="50" height="14" rx="7" fill={colors.primary} />
              </G>
            )}
          </G>

          {/* --- UÇAN ETKİLEŞİM ROZETİ (Görsel Derinlik Katar) --- */}
          <G transform="translate(45, -15)">
            <Circle cx="0" cy="0" r="14" fill={colors.primary} />
            <Circle cx="0" cy="0" r="20" fill={colors.primaryLight} opacity={0.2} /> 
            
            {type === 'phone' ? (
              // Gerçekçi ve şık Telefon (Ahize) İkonu
              <Path 
                d="M -4 -3.5 C -4 -4.5, -3 -5, -2 -5 L -0.5 -5 C 0 -5, 0.5 -4.5, 1 -3.5 L 1.5 -1.5 C 1.5 -1, 1.5 -0.5, 1 0 L 0 1 C 1 3, 3 5, 5 6 L 6 5 C 6.5 4.5, 7 4.5, 7.5 4.5 L 9.5 5 C 10.5 5.5, 11 6, 11 7 L 11 8.5 C 11 9.5, 10.5 10.5, 9.5 10.5 C 4 10.5, -4 2.5, -4 -3.5 Z" 
                fill={colors.white} 
                transform="translate(-3.5, -3.5)"
              />
            ) : (
              // Onay ikonu
              <Path 
                d="M-4 0.5 L-1.5 3 L4 -3" 
                stroke={colors.white} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none" 
              />
            )}
          </G>
        </G>
      </Svg>
    </View>
  );
}