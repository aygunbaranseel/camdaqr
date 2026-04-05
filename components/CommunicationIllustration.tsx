import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export default function CommunicationIllustration() {
  const colors = {
    primary: "#2563EB",
    primaryLight: "#60A5FA",
    glow: "#EFF6FF",
    white: "#FFFFFF",
    dark: "#0F172A",
    success: "#10B981",
    warning: "#F59E0B"
  };

  return (
    // Ölçüler 180x180 olarak biraz daha belirginleştirildi
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 180, height: 180, marginBottom: 15 }}>
      <Svg width="100%" height="100%" viewBox="0 0 180 180" fill="none">
        <Defs>
          <LinearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.glow} />
            <Stop offset="1" stopColor={colors.primaryLight} stopOpacity="0.15" />
          </LinearGradient>

          <LinearGradient id="deviceGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="1" stopColor="#F1F5F9" stopOpacity="0.95" />
          </LinearGradient>

          <LinearGradient id="msgGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primaryLight} />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>

        {/* Arka Plan Yuvarlaklar */}
        <Circle cx="90" cy="90" r="70" fill="url(#bgGlow)" />
        <Circle cx="90" cy="90" r="55" stroke={colors.primaryLight} strokeWidth="1.5" strokeDasharray="6 6" opacity={0.3} />

        {/* Merkez Cihaz / İletişim Hub'ı */}
        <G transform="translate(55, 45)">
          {/* Cihaz Gölgesi (Opacity ile, hata vermez) */}
          <Rect x="4" y="8" width="62" height="90" rx="14" fill={colors.dark} opacity={0.05} transform="rotate(-3 35 45)" />
          
          {/* Cihaz Gövdesi */}
          <Rect x="0" y="0" width="70" height="95" rx="16" fill="url(#deviceGrad)" stroke="#E2E8F0" strokeWidth="1.5" />
          
          {/* Ekran İçeriği (Satırlar) */}
          <Rect x="18" y="25" width="34" height="5" rx="2.5" fill="#CBD5E1" />
          <Rect x="18" y="38" width="22" height="5" rx="2.5" fill="#E2E8F0" />
          <Rect x="18" y="51" width="28" height="5" rx="2.5" fill="#E2E8F0" />
        </G>

        {/* Sol Mesaj Balonu (SMS/Sohbet) */}
        <G transform="translate(35, 75)">
          <Path d="M 12 0 C 5.4 0, 0 5.4, 0 12 C 0 18.6, 5.4 24, 12 24 L 18 28 L 18 24 C 24.6 24, 30 18.6, 30 12 C 30 5.4, 24.6 0, 12 0 Z" fill="url(#msgGrad)" />
          {/* Mesaj Noktaları */}
          <Circle cx="10" cy="12" r="1.8" fill={colors.white} />
          <Circle cx="15" cy="12" r="1.8" fill={colors.white} />
          <Circle cx="20" cy="12" r="1.8" fill={colors.white} />
        </G>

        {/* Sağ Bildirim Zili (Bell) */}
        <G transform="translate(115, 55)">
          <Circle cx="18" cy="18" r="18" fill={colors.white} />
          <Circle cx="18" cy="18" r="18" fill={colors.dark} opacity={0.04} />
          <Path d="M 18 10 C 14 10, 11 13, 11 17 C 11 20.5, 9 21.5, 9 21.5 L 27 21.5 C 27 21.5, 25 20.5, 25 17 C 25 13, 22 10, 18 10 Z" fill={colors.warning} />
          <Circle cx="18" cy="24" r="2.5" fill={colors.warning} />
        </G>

        {/* Alt Çağrı İkonu (Phone) */}
        <G transform="translate(100, 115)">
          <Circle cx="16" cy="16" r="16" fill={colors.success} />
          <Path d="M 10 12 C 10 11, 11.5 10.5, 12 10.5 C 12.5 10.5, 13 11, 13.5 12 L 14 13 C 14 13.5, 13.5 14, 13 14 C 13 14, 14 16.5, 16 17.5 C 16 17.5, 16.5 17, 17 17 C 18 16.5, 18.5 17, 18.5 17.5 L 20 19.5 C 20 20.5, 19.5 21, 19 21 C 18 21, 13 19, 11 17 C 9 15, 8 10.5, 10 12 Z" fill={colors.white} />
        </G>
      </Svg>
    </View>
  );
}