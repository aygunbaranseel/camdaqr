import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export default function SuccessIllustration() {
  const colors = {
    bgCircle: "#ECFDF5", // Açık Yeşil Arka Plan
    primaryGreen: "#10B981",
    darkGreen: "#059669",
    lightGreen: "#34D399",
    checkWhite: "#FFFFFF",
    confettiRed: "#F87171",
    confettiYellow: "#FCD34D",
    confettiBlue: "#60A5FA",
    shadow: "#A7F3D0"
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 35, width: 200, height: 200 }}>
      <Svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <Defs>
          <LinearGradient id="checkGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.lightGreen} />
            <Stop offset="1" stopColor={colors.darkGreen} />
          </LinearGradient>
        </Defs>

        {/* --- ARKA PLAN DAİRESİ --- */}
        <Circle cx="100" cy="100" r="85" fill={colors.bgCircle} />

        {/* --- KONFETİLER --- */}
        <G opacity={0.9}>
          <Circle cx="40" cy="60" r="5" fill={colors.confettiRed} />
          <Rect x="160" y="50" width="8" height="8" rx="2" transform="rotate(15 164 54)" fill={colors.confettiYellow} />
          <Circle cx="150" cy="150" r="4" fill={colors.confettiBlue} />
          <Rect x="30" y="140" width="10" height="4" rx="2" transform="rotate(-30 35 142)" fill={colors.confettiBlue} />
          <Circle cx="100" cy="30" r="3" fill={colors.confettiBlue} opacity={0.5} />
          <Rect x="120" y="160" width="6" height="6" rx="1" transform="rotate(45 123 163)" fill={colors.confettiRed} />
        </G>

        {/* --- ANA BAŞARI GRUBU --- */}
        <G transform="translate(50, 50)">
          
          {/* Gölge */}
          <Circle cx="50" cy="58" r="45" fill={colors.shadow} opacity={0.5} />

          {/* Yeşil Daire */}
          <Circle cx="50" cy="50" r="45" fill="url(#checkGrad)" stroke="#FFF" strokeWidth="4" />
          
          {/* Tik İşareti (Checkmark) */}
          <Path 
            d="M32 50 L 45 63 L 68 37" 
            stroke={colors.checkWhite} 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
          
          {/* Parıltılar */}
          <Path d="M85 20 L 90 25 M 85 25 L 90 20" stroke={colors.confettiYellow} strokeWidth="3" strokeLinecap="round" />
          <Circle cx="15" cy="80" r="2" fill="#FFF" opacity={0.6} />
        </G>
      </Svg>
    </View>
  );
}