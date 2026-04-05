import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export default function ActivationIllustration() {
  const colors = {
    primary: "#2563EB", 
    primaryLight: "#60A5FA",
    primaryGlow: "#DBEAFE",
    bgCircle: "#EFF6FF",
    white: "#FFFFFF",
    slateBorder: "#E2E8F0",
    slateDot: "#CBD5E1",
    qrBlock: "#94A3B8",
    qrBg: "#F8FAFC",
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 240, height: 200, marginBottom: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 240 200" fill="none">
        <Defs>
          <LinearGradient id="tagGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity="1" />
            <Stop offset="1" stopColor={colors.bgCircle} stopOpacity="0.5" />
          </LinearGradient>
          <LinearGradient id="beamGrad" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.8" />
            <Stop offset="0.6" stopColor={colors.primaryLight} stopOpacity="0.4" />
            <Stop offset="1" stopColor={colors.primaryGlow} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Circle cx="120" cy="90" r="75" fill={colors.bgCircle} />
        <Circle cx="120" cy="90" r="50" fill={colors.primaryGlow} opacity={0.5} />

        <G transform="translate(120, 85)">
          <Rect x="-45" y="-55" width="90" height="110" rx="18" fill="url(#tagGrad)" stroke={colors.slateBorder} strokeWidth="2" />
          <Circle cx="0" cy="-40" r="5" fill={colors.slateBorder} opacity={0.6} />
          <Rect x="-22" y="-15" width="44" height="44" rx="8" fill={colors.qrBg} stroke={colors.slateBorder} strokeWidth="1" />
          <Rect x="-12" y="-5" width="10" height="10" rx="3" fill={colors.qrBlock} opacity={0.8} />
          <Rect x="2" y="-5" width="10" height="10" rx="3" fill={colors.qrBlock} opacity={0.8} />
          <Rect x="-12" y="9" width="10" height="10" rx="3" fill={colors.qrBlock} opacity={0.8} />
          <Rect x="2" y="9" width="10" height="10" rx="3" fill={colors.primary} />
        </G>

        <Rect x="118" y="105" width="4" height="35" rx="2" fill="url(#beamGrad)" />
        <Rect x="98" y="115" width="4" height="25" rx="2" fill="url(#beamGrad)" />
        <Rect x="138" y="115" width="4" height="25" rx="2" fill="url(#beamGrad)" />

        <G transform="translate(120, 150)">
          <Rect x="-75" y="-20" width="150" height="40" rx="20" fill={colors.white} stroke={colors.slateBorder} strokeWidth="1.5" />
          <Circle cx="-50" cy="0" r="4.5" fill={colors.primary} />
          <Circle cx="-30" cy="0" r="4.5" fill={colors.primary} />
          <Circle cx="-10" cy="0" r="4.5" fill={colors.primary} />
          <Circle cx="10" cy="0" r="4.5" fill={colors.primaryLight} opacity={0.8} />
          <Circle cx="30" cy="0" r="4.5" fill={colors.slateDot} />
          <Circle cx="50" cy="0" r="4.5" fill={colors.slateDot} />
        </G>

        <G transform="translate(165, 40)">
          <Circle cx="0" cy="0" r="14" fill={colors.primary} />
          <Circle cx="0" cy="0" r="20" fill={colors.primaryLight} opacity={0.2} />
          <Path d="M-4 1 L-1.5 3.5 L4 -2.5" stroke={colors.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      </Svg>
    </View>
  );
}