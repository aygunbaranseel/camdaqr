import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  UIManager,
  View
} from 'react-native';

import { ArrowRight, Check, ChevronLeft, ShieldCheck, XCircle } from 'lucide-react-native';
import ActivationIllustration from '../components/ActivationIllustration';
import { checkActivationCode } from '../services/authService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const HEADER_HEIGHT = STATUSBAR_HEIGHT + 60;

export default function ActivateScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successColorAnim = useRef(new Animated.Value(0)).current;
  const keyboardShift = useRef(new Animated.Value(0)).current;

  const isFull = code.length === CODE_LENGTH;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      setIsFocused(true);
      Animated.timing(keyboardShift, {
        toValue: -120,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      setIsFocused(false);
      Animated.timing(keyboardShift, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const triggerSuccessColor = () => {
    Animated.timing(successColorAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const animatedBgColor = successColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#2563EB', '#10B981']
  });

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase());
    if (errorMessage !== '') {
      setErrorMessage('');
    }
  };

  const handleActivate = async () => {
    if (!isFull || loading || isSuccess || errorMessage !== '') return;
    
    Keyboard.dismiss();
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await checkActivationCode(code);
      setLoading(false);

      if (result && result.success === true) {
        setIsSuccess(true);
        triggerSuccessColor();
        
        setTimeout(() => {
          router.push({
            pathname: '/register-tag',
            params: { activationCode: code }
          });
          
          setTimeout(() => {
            setIsSuccess(false);
            successColorAnim.setValue(0);
          }, 500);
        }, 1200);
      } else {
        setErrorMessage(result.message || "Geçersiz aktivasyon kodu.");
        triggerShake();
        setCode('');
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage("İnternet bağlantınızı kontrol edip tekrar deneyin.");
      triggerShake();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ChevronLeft size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aktivasyon</Text>
        <View style={{ width: 28 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.content, { transform: [{ translateY: keyboardShift }] }]}>
              
              <View style={styles.illustrationContainer}>
                <ActivationIllustration />
              </View>
              
              <View style={styles.badgeContainer}>
                <ShieldCheck size={14} color="#2563EB" strokeWidth={2.5} />
                <Text style={styles.badgeText}>GÜVENLİ AKTİVASYON</Text>
              </View>
              
              <Text style={styles.title}>Etiketinizi Aktive Edin</Text>
              <Text style={styles.subtitle}>Paketinizin içinden çıkan 6 haneli güvenlik kodunu aşağıya giriniz.</Text>
              
              <View style={{ width: '100%', minHeight: 105, alignItems: 'center', justifyContent: 'flex-start' }}>
                <Animated.View style={[styles.inputWrapper, { transform: [{ translateX: shakeAnim }] }]}>
                  <TextInput 
                    style={styles.hiddenInput} 
                    value={code} 
                    onChangeText={handleCodeChange} 
                    maxLength={CODE_LENGTH} 
                    autoFocus={false} 
                    autoCapitalize="characters" 
                    autoCorrect={false} 
                    caretHidden={true} 
                    keyboardType="default" 
                    editable={!loading && !isSuccess} 
                  />
                  <View style={styles.boxesContainer} pointerEvents="none">
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const isActive = code.length === index && isFocused; 
                      const isFilled = code.length > index;
                      const isErrorState = errorMessage !== '';
                      const char = code.length > index ? code[index] : "";
                      return (
                        <View key={index} style={[styles.codeBox, isFilled && styles.codeBoxFilled, isActive && styles.codeBoxActive, isErrorState && styles.codeBoxError]}>
                          <Text style={[styles.codeText, isActive && { color: '#2563EB' }, isFilled && { color: '#0F172A' }, isErrorState && { color: '#EF4444' }]}>
                            {char}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </Animated.View>
                
                <View style={styles.progressSection}>
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: `${(code.length / CODE_LENGTH) * 100}%`, backgroundColor: errorMessage !== '' ? '#EF4444' : animatedBgColor }]} />
                  </View>
                </View>
              </View>

              {errorMessage !== '' ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorInner}>
                    <XCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                </View>
              ) : null}

              <TouchableOpacity 
                style={{ width: '100%', marginTop: 16 }} 
                onPress={handleActivate} 
                disabled={!isFull || loading || isSuccess || errorMessage !== ''} 
                activeOpacity={0.8}
              >
                <Animated.View style={[styles.button, { backgroundColor: (!isFull || errorMessage !== '') ? '#F1F5F9' : animatedBgColor }, (!isFull || errorMessage !== '') ? { shadowOpacity: 0, elevation: 0 } : {}]}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : isSuccess ? (
                    <View style={styles.btnContent}>
                      <Text style={styles.buttonText}>Doğrulandı</Text>
                      <Check size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={styles.btnContent}>
                      <Text style={[styles.buttonText, (!isFull || errorMessage !== '') ? styles.disabledButtonText : {}]}>Aktifleştir</Text>
                      <ArrowRight size={20} color={(isFull && errorMessage === '') ? "#fff" : "#9CA3AF"} style={{ marginLeft: 8 }} strokeWidth={2.5} />
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>

            </Animated.View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, height: HEADER_HEIGHT, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12, backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  backButton: { padding: 4 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingTop: HEADER_HEIGHT, paddingBottom: 40 },
  content: { paddingHorizontal: 24, alignItems: 'center', width: '100%' },
  
  illustrationContainer: { height: 160, justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 15 },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, gap: 6 },
  badgeText: { color: '#2563EB', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 24, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  
  inputWrapper: { width: '100%', height: 64, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  hiddenInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0, zIndex: 10 },
  boxesContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 8 },
  codeBox: { width: (width - 48 - 40) / 6, aspectRatio: 1, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }, 
  codeBoxFilled: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' },
  codeBoxActive: { borderColor: '#2563EB', backgroundColor: '#FFFFFF', transform: [{ scale: 1.05 }], shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  codeBoxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  codeText: { fontSize: 24, fontWeight: '700', color: '#0F172A' },
  
  progressSection: { width: '100%', paddingHorizontal: 2, marginTop: 8}, 
  progressBarBg: { width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 2 },
  
  errorContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  errorInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  
  button: { paddingVertical: 18, borderRadius: 20, width: '100%', shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  disabledButtonText: { color: '#9CA3AF' }
});