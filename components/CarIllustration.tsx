import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export default function CarIllustration() {
  const colors = {
    primary: "#2563EB",
    primaryLight: "#60A5FA",
    glow: "#EFF6FF",
    white: "#FFFFFF",
    cardBg: "#F8FAFC",
    border: "#E2E8F0",
    textLight: "#CBD5E1",
    textDark: "#94A3B8",
    success: "#10B981"
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 160, height: 160, marginBottom: 10 }}>
      <Svg width="100%" height="100%" viewBox="0 0 160 160" fill="none">
        <Defs>
          {/* Arka plan için yumuşak Apple aurası */}
          <LinearGradient id="bgGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.glow} />
            <Stop offset="1" stopColor={colors.primaryLight} stopOpacity="0.15" />
          </LinearGradient>
          
          {/* Kimlik Kartı için Glassmorphism Degradesi */}
          <LinearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#F1F5F9" />
          </LinearGradient>
        </Defs>

        {/* --- 1. ARKA PLAN AURASI --- */}
        <Circle cx="80" cy="80" r="70" fill="url(#bgGlow)" />

        {/* --- 2. BAĞLANTI (SİNYAL) ÇİZGİLERİ --- */}
        {/* Etiketin dijital olarak araca bağlandığını hissettiren zarif sinyal dalgaları */}
        <Path d="M 35 45 C 30 50, 30 60, 35 65" stroke={colors.primaryLight} strokeWidth="2" strokeLinecap="round" opacity={0.5} fill="none" />
        <Path d="M 28 40 C 20 50, 20 65, 28 75" stroke={colors.primaryLight} strokeWidth="2" strokeLinecap="round" opacity={0.3} fill="none" />

        {/* --- 3. DİJİTAL SÜRÜCÜ KARTI (Apple Cüzdan Tarzı) --- */}
        <G transform="translate(0, -5)">
          {/* Hatasız Gölge Tekniği (Kartın yere düşen yumuşak yansıması) */}
          {/* SVG içinde shadowColor desteklenmez, onun yerine kopya bir Rect (0.06 opacity) hafif aşağı kaydırılarak gölge verilir. */}
          <Rect x="42" y="32" width="76" height="106" rx="16" fill="#0F172A" opacity={0.06} />
          
          {/* Kartın Ana Gövdesi */}
          <Rect x="40" y="30" width="76" height="106" rx="16" fill="url(#cardGrad)" stroke={colors.border} strokeWidth="1.5" />

          {/* Sürücü Avatarı (Soyut Çizim) */}
          <Circle cx="78" cy="58" r="14" fill={colors.glow} />
          <Circle cx="78" cy="55" r="5" fill={colors.textDark} />
          <Path 
            d="M 68 67 C 68 63, 73 61, 78 61 C 83 61, 88 63, 88 67" 
            stroke={colors.textDark} 
            strokeWidth="2" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Ad/Soyad Temsili Satırlar */}
          <Rect x="58" y="80" width="40" height="6" rx="3" fill={colors.textLight} />
          <Rect x="63" y="92" width="30" height="4" rx="2" fill="#F1F5F9" />

          {/* Minyatür Plaka (Sayfadaki TR Plaka tasarımıyla birebir uyumlu) */}
          <G transform="translate(54, 102)">
            <Rect x="0" y="0" width="48" height="12" rx="3" fill={colors.white} stroke={colors.border} strokeWidth="1" />
            {/* TR Şeridi */}
            <Path d="M 0 3 Q 0 0 3 0 L 8 0 L 8 12 L 3 12 Q 0 12 0 9 Z" fill={colors.primary} />
            {/* Plaka Numarası Temsili */}
            <Rect x="14" y="4" width="26" height="4" rx="2" fill={colors.textDark} />
          </G>
        </G>

        {/* --- 4. SAĞ ALT ONAY ROZETİ (Verified) --- */}
        <G transform="translate(115, 115)">
          {/* Rozet Gölgesi */}
          <Circle cx="0" cy="3" r="16" fill="#0F172A" opacity={0.06} /> 
          
          <Circle cx="0" cy="0" r="16" fill={colors.white} />
          <Circle cx="0" cy="0" r="12" fill={colors.success} />
          {/* Zarif Tik İşareti */}
          <Path 
            d="M -4 1 L -1.5 3.5 L 4 -2" 
            stroke={colors.white} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </G>

      </Svg>
    </View>
  );
}