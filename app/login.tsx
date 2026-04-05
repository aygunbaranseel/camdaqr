import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  SafeAreaView,
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

// --- YENİ İKONLAR (LUCIDE) ---
import { AlertCircle, ArrowRight, ChevronLeft, Phone, ShieldCheck, XCircle } from 'lucide-react-native';

// --- FIREBASE & SERVISLER ---
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { checkPhoneNumberExists } from '../services/authService';
import { auth } from '../services/firebaseConfig';

import HandPhoneIllustration from '../components/HandPhoneIllustration';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const HEADER_HEIGHT = STATUSBAR_HEIGHT + 60;

const COLORS = {
  primary: '#2563EB',
  background: '#F8FAFC', 
  cardBg: '#FFFFFF',     
  textMain: '#0F172A',
  textMuted: '#64748B',
  placeholder: '#E2E8F0',
};

const CustomAnimation = {
  duration: 400,
  create: { type: LayoutAnimation.Types.spring, property: LayoutAnimation.Properties.scaleXY, springDamping: 0.8 },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
};

export default function LoginScreen() {
  const router = useRouter();
  const recaptchaVerifier = useRef(null);

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const phoneShake = useRef(new Animated.Value(0)).current;
  const otpShake = useRef(new Animated.Value(0)).current;

  // KLAVYE ASANSÖR MANTIĞI - YUMUŞATILMIŞ
  const [isFocused, setIsFocused] = useState(false);
  const keyboardShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardShift, {
        toValue: -90, // Daha az kaydırıldı
        duration: 200, // Hızlandırıldı
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardShift, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const triggerError = (msg: string, animRef?: Animated.Value) => {
    setErrorMessage(msg);
    if (animRef) {
      Animated.sequence([
        Animated.timing(animRef, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(animRef, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(animRef, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(animRef, { toValue: 0, duration: 50, useNativeDriver: true })
      ]).start();
    }
  };

  const formatPhone = (t: string) => {
    if (!t) return '';
    let cleaned = t.replace(/\D/g, '').substring(0, 10);
    let formatted = cleaned;
    if (cleaned.length > 3 && cleaned.length <= 6) {
      formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    } else if (cleaned.length > 6 && cleaned.length <= 8) {
      formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    } else if (cleaned.length > 8) {
      formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    return formatted;
  };

  const sendVerification = async () => {
    setErrorMessage('');
    const cleanPhone = phone.replace(/\D/g, ''); 
    
    if (cleanPhone.length < 10) {
      return triggerError("Lütfen telefon numaranızı eksiksiz girin.", phoneShake);
    }

    setLoading(true);

    try {
      const userExists = await checkPhoneNumberExists(cleanPhone);

      if (!userExists) {
        setLoading(false);
        Alert.alert(
            'Hesap Bulunamadı', 
            'Bu telefon numarası sistemde kayıtlı değil. Lütfen önce kayıt olun.',
            [
                { text: "Vazgeç", style: 'cancel' },
                { text: "Kayıt Ol", onPress: () => router.push('/activate') } 
            ]
        );
        return;
      }

      const authFormat = `+90${cleanPhone}`;
      const phoneProvider = new PhoneAuthProvider(auth);
      const vid = await phoneProvider.verifyPhoneNumber(
        authFormat,
        recaptchaVerifier.current!
      );
      
      setVerificationId(vid);
      LayoutAnimation.configureNext(CustomAnimation);
      setStep('otp');

    } catch (error: any) {
      console.error(error);
      triggerError("SMS gönderilemedi. Lütfen numaranızı kontrol edin.", phoneShake);
    }
    setLoading(false);
  };

  const confirmCode = async () => {
    setErrorMessage('');
    if (otp.length < 6) {
      return triggerError("Lütfen 6 haneli kodu girin.", otpShake);
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      router.replace('/(tabs)');
    } catch (error) {
      triggerError("Girdiğiniz kod hatalı veya süresi dolmuş.", otpShake);
    }
    setLoading(false);
  };

  const handleAction = () => {
    if (step === 'phone') sendVerification();
    else confirmCode();
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step === 'otp') {
        LayoutAnimation.configureNext(CustomAnimation);
        setStep('phone');
        setOtp('');
    } else {
        router.replace('/');
    }
  };

  const isPhoneError = errorMessage.includes("telefon") || errorMessage.includes("SMS");
  const isOtpError = errorMessage.includes("kod") || errorMessage.includes("süresi");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* --- DEĞİŞTİRİLEN VE ŞIKLAŞTIRILAN RECAPTCHA BÖLÜMÜ --- */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        title="Güvenlik Doğrulaması"
        cancelLabel="Kapat"
        attemptInvisibleVerification={true} // reCAPTCHA'nın görünmeden arka planda çalışmasını dener
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} // Modalın arka plan karartması
        containerStyle={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 24, // Uygulama tasarımına uyan yuvarlak köşeler
            overflow: 'hidden', 
            width: '85%', 
            alignSelf: 'center', 
            marginTop: 'auto', 
            marginBottom: 'auto',
            maxHeight: 500, // Ekrana daha orantılı oturur
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <ChevronLeft size={28} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"Giriş Yap"}</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          bounces={false} 
          overScrollMode="never"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Animated.View style={[styles.stepContainer, { transform: [{ translateY: keyboardShift }] }]}>
              
              <View style={styles.illustrationContainer}>
                <HandPhoneIllustration type={step === 'otp' ? 'otp' : 'phone'} />
              </View>

              <View style={styles.badgeContainer}>
                <ShieldCheck size={14} color={COLORS.primary} strokeWidth={2.5} />
                <Text style={styles.badgeText}>{"GÜVENLİ GİRİŞ"}</Text>
              </View>

              <Text style={styles.title}>{step === 'phone' ? "Tekrar Hoş Geldin!" : "Kodu Girin"}</Text>
              <Text style={styles.subtitle}>
                {step === 'phone' ? "Hesabına giriş yapmak için telefon numaranı gir." : `+90 ${phone} numarasına gönderilen kodu girin.`}
              </Text>

              {/* Sabit Yükseklikli Alan: Ekranların Zıplamasını Önler */}
              <View style={{ width: '100%', minHeight: 105, justifyContent: 'flex-start' }}>
                {step === 'phone' ? (
                  <View style={{width: '100%'}}>
                    <Animated.View style={[styles.appleCard, isPhoneError && { borderColor: '#FECACA', borderWidth: 1.5 }, { transform: [{ translateX: phoneShake }] }]}>
                      <View style={styles.prefixContainer}>
                        <Phone size={18} color={isPhoneError ? '#EF4444' : COLORS.textMuted} style={{ marginRight: 6 }} />
                        <Text style={[styles.prefixText, isPhoneError && { color: '#EF4444' }]}>{"+90"}</Text>
                      </View>
                      <View style={[styles.verticalDivider, isPhoneError && { backgroundColor: '#FECACA' }]} />
                      <TextInput 
                        style={[
                          styles.bigPhoneInput,
                          {
                            fontWeight: phone ? '600' : '400',
                            fontSize: phone ? 18 : 16
                          },
                          isPhoneError && { color: '#EF4444' }
                        ]} 
                        placeholder="Telefon Numarası" 
                        placeholderTextColor={COLORS.placeholder} 
                        keyboardType="phone-pad" 
                        value={phone} 
                        onChangeText={(t) => { setPhone(formatPhone(t)); setErrorMessage(''); }} 
                        maxLength={13}
                        autoFocus={false} 
                      />
                      {isPhoneError && <AlertCircle size={20} color="#EF4444" style={{ marginLeft: 8 }} />}
                    </Animated.View>
                    
                    <View style={styles.infoBoxSleek}>
                      <ShieldCheck size={14} color={COLORS.primary} />
                      <Text style={styles.infoText}>{"Numaranız uçtan uca şifrelenmektedir."}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ width: '100%', alignItems: 'center', paddingTop: 2 }}>
                    <Animated.View style={[styles.otpInputContainer, { transform: [{ translateX: otpShake }] }]}>
                      <TextInput 
                        style={styles.hiddenOverlayInput} 
                        value={otp} 
                        onChangeText={(t) => { setOtp(t); setErrorMessage(''); }} 
                        maxLength={6} 
                        keyboardType="number-pad" 
                        autoFocus={false}
                        caretHidden={true} 
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                      <View style={styles.otpBoxContainer} pointerEvents="none">
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const isActive = otp.length === index && isFocused;
                          const isFilled = otp.length > index;
                          return (
                            <View key={index} style={[styles.codeBox, isFilled && styles.codeBoxFilled, isActive && styles.codeBoxActive, isOtpError && styles.codeBoxError]}>
                              <Text style={[styles.codeText, isActive && { color: COLORS.primary }, isOtpError && { color: '#EF4444' }]}>{otp[index] || ""}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </Animated.View>
                    <TouchableOpacity style={styles.resendBtn} onPress={() => {
                        setStep('phone');
                        setOtp('');
                        Alert.alert("Bilgi", "Lütfen numaranızı kontrol edip tekrar deneyin.");
                    }}>
                      <Text style={styles.resendText}>{"Kod gelmedi mi? "} <Text style={{ fontWeight: '700', color: COLORS.primary }}>{"Tekrar Gönder"}</Text></Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <View style={styles.errorInner}>
                    <XCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                </View>
              ) : null}
              
              <TouchableOpacity style={[styles.button, loading && styles.disabledButton, {marginTop: 16}]} onPress={handleAction} disabled={loading} activeOpacity={0.8}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={styles.btnContent}>
                    <Text style={styles.buttonText}>{step === 'phone' ? "Kodu Gönder" : "Giriş Yap"}</Text>
                    <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={2.5} />
                  </View>
                )}
              </TouchableOpacity>

            </Animated.View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, 
  
  header: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    zIndex: 10, 
    height: HEADER_HEIGHT, 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingBottom: 12, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textMain, marginBottom: 4 },
  backButton: { padding: 4 },
  
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 60, paddingTop: HEADER_HEIGHT + 24, justifyContent: 'center' },

  stepContainer: { alignItems: 'center', width: '100%', paddingHorizontal: 24 },
  illustrationContainer: { height: 160, justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 15 },
  
  badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16, gap: 6 },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textMain, marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginBottom: 24, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  
  appleCard: { width: '100%', backgroundColor: COLORS.cardBg, borderRadius: 20, height: 64, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  prefixContainer: { flexDirection: 'row', alignItems: 'center', paddingLeft: 2 },
  prefixText: { fontSize: 17, fontWeight: '600', color: COLORS.textMain, marginLeft: 6 },
  verticalDivider: { width: 1, height: 28, backgroundColor: '#CBD5E1', marginHorizontal: 16 },
  bigPhoneInput: { flex: 1, fontSize: 18, color: COLORS.textMain, letterSpacing: 1 },
  
  infoBoxSleek: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, width: '100%' },
  infoText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 8, flex: 1, lineHeight: 18, fontWeight: '500' },

  otpInputContainer: { width: '100%', height: 64, position: 'relative', alignItems: 'center', justifyContent: 'flex-start' },
  hiddenOverlayInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0, zIndex: 10 },
  otpBoxContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 8 },
  codeBox: { width: (width - 48 - 40) / 6, aspectRatio: 1, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  codeBoxFilled: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' },
  codeBoxActive: { borderColor: COLORS.primary, backgroundColor: '#FFFFFF', transform: [{ scale: 1.05 }], shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  codeBoxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  codeText: { fontSize: 24, fontWeight: '700', color: COLORS.textMain },
  
  resendBtn: { marginTop: 8 },
  resendText: { fontSize: 14, color: COLORS.textMuted },
  
  errorContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  errorInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  button: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 20, width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  disabledButton: { backgroundColor: '#E2E8F0', shadowOpacity: 0, elevation: 0 },
});