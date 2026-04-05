import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';

import {
  AlertCircle,
  ArrowRight,
  Bell,
  BellOff,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Droplet,
  Eye,
  EyeOff,
  Home,
  Info,
  MessageCircle,
  MessageCircleOff,
  Phone,
  PhoneOff,
  Search,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react-native';

import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { checkPhoneNumberExists, completeRegistration } from '../services/authService';
import { auth, db } from '../services/firebaseConfig';

import CarIllustration from '../components/CarIllustration';
import CommunicationIllustration from '../components/CommunicationIllustration';
import HandPhoneIllustration from '../components/HandPhoneIllustration';
import SuccessIllustration from '../components/SuccessIllustration';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 3;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const HEADER_HEIGHT = STATUSBAR_HEIGHT + 60;

const COLORS = {
  primary: '#2563EB',
  switchTrackActive: '#2563EB',
  switchTrackInactive: '#E2E8F0',
  background: '#F8FAFC', 
  cardBg: '#FFFFFF',     
  textMain: '#0F172A',
  textMuted: '#64748B',
  placeholder: '#E2E8F0',
  danger: '#EF4444',
  lightBlueBg: '#EFF6FF',
  lightGrayBg: '#F3F4F6',
  inactiveIcon: '#9CA3AF'
};

const READY_NOTES = [
  { text: "Hemen geliyorum", emoji: "🏃‍♂️" },
  { text: "5 dk içinde oradayım", emoji: "⏱️" },
  { text: "Lütfen beni arayın", emoji: "📱" },
  { text: "Hemen çıkıyorum", emoji: "🛒" }
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "0+", "0-", "AB+", "AB-"];
const CAR_BRANDS = [
  "Togg", "Volkswagen", "Ford", "Renault", "Fiat", "Toyota", "Hyundai", "Peugeot",
  "Honda", "Citroen", "Opel", "Skoda", "Dacia", "BMW", "Mercedes-Benz", "Audi",
  "Kia", "Nissan", "Seat", "Volvo", "Suzuki", "Mazda", "Jeep", "Mini", "Land Rover",
  "Porsche", "Chery", "MG", "Tesla", "Alfa Romeo", "Subaru", "Mitsubishi", "Chevrolet", "Diğer"
].sort();

const CAR_COLORS = [
  { name: 'Beyaz', code: '#FFFFFF', border: '#E2E8F0', iconColor: '#2563EB' },
  { name: 'Siyah', code: '#1E293B', border: '#1E293B', iconColor: '#FFF' },
  { name: 'Gri', code: '#94A3B8', border: '#94A3B8', iconColor: '#FFF' },
  { name: 'Kırmızı', code: '#EF4444', border: '#EF4444', iconColor: '#FFF' },
  { name: 'Mavi', code: '#3B82F6', border: '#3B82F6', iconColor: '#FFF' },
  { name: 'Yeşil', code: '#10B981', border: '#10B981', iconColor: '#FFF' },
  { name: 'Sarı', code: '#F59E0B', border: '#F59E0B', iconColor: '#FFF' },
  { name: 'Turuncu', code: '#F97316', border: '#F97316', iconColor: '#FFF' },
];

const CustomAnimation = {
  duration: 400,
  create: { type: LayoutAnimation.Types.spring, property: LayoutAnimation.Properties.scaleXY, springDamping: 0.8 },
  update: { type: LayoutAnimation.Types.spring, springDamping: 0.8 },
};

const FadeInView = ({ children }: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ width: '100%', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};

const CustomSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: () => void }) => {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animValue, {
      toValue: value ? 1 : 0,
      duration: 250,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const backgroundColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.switchTrackInactive, COLORS.switchTrackActive]
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 18]
  });

  return (
    <TouchableOpacity onPress={onValueChange} activeOpacity={0.8} style={{ justifyContent: 'center' }}>
      <Animated.View style={[styles.customSwitchTrack, { backgroundColor }]}>
        <Animated.View style={[styles.customSwitchThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const PermissionRow = ({ title, desc, value, onValueChange, Icon, iconColor, iconBgColor }: any) => (
  <View style={styles.permissionRow}>
    <View style={styles.permissionInfo}>
      <View style={[styles.iconBox, { backgroundColor: iconBgColor || (iconColor + '15') }]}>
        <Icon size={20} color={iconColor} strokeWidth={2} />
      </View>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDesc}>{desc}</Text>
      </View>
    </View>
    <CustomSwitch value={value} onValueChange={() => onValueChange(!value)} />
  </View>
);

export default function RegisterTagScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const activationCode = params.code || params.activationCode;

  const recaptchaVerifier = useRef(null);
  const scrollViewRef = useRef<ScrollView>(null); 

  const plateLettersRef = useRef<TextInput>(null);
  const plateNumbersRef = useRef<TextInput>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpVisible, setIsOtpVisible] = useState(false);
  const [verificationId, setVerificationId] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [plateCity, setPlateCity] = useState('');
  const [plateLetters, setPlateLetters] = useState('');
  const [plateNumbers, setPlateNumbers] = useState('');
  const [brand, setBrand] = useState('');

  const [isBrandModalVisible, setBrandModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [selectedColor, setSelectedColor] = useState(CAR_COLORS[0]);
  const [note, setNote] = useState('');
  const [blood, setBlood] = useState('');

  // İLETİŞİM İZİNLERİ
  const [allowNotification, setAllowNotification] = useState(true);
  const [allowSms, setAllowSms] = useState(true);
  const [allowCall, setAllowCall] = useState(true);

  // GÜVENLİK İZİNLERİ
  const [showName, setShowName] = useState(true);
  const [showBloodType, setShowBloodType] = useState(true);
  const [showFullPlate, setShowFullPlate] = useState(true);
  const [showCarModel, setShowCarModel] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');

  const phoneShake = useRef(new Animated.Value(0)).current;
  const otpShake = useRef(new Animated.Value(0)).current;
  const firstNameShake = useRef(new Animated.Value(0)).current;
  const lastNameShake = useRef(new Animated.Value(0)).current;
  const plateShake = useRef(new Animated.Value(0)).current;
  const brandShake = useRef(new Animated.Value(0)).current;

  // KLAVYE ASANSÖR MANTIĞI
  const [isFocused, setIsFocused] = useState(false);
  const keyboardShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardShift, {
        toValue: -90, 
        duration: 200, 
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

  const smoothStepChange = (targetStep: number) => {
    Keyboard.dismiss();
    setIsTransitioning(true); 
    
    setTimeout(() => {
      setStep(targetStep);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false }); 
      }
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100); 
    }, 300);
  };

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
    const cleanPhone = (phone || '').replace(/\s/g, '');
    if (cleanPhone.length < 10) return triggerError("Lütfen geçerli bir telefon numarası girin.", phoneShake);
    
    setLoading(true);

    const isRegistered = await checkPhoneNumberExists(phone);
    if (isRegistered) {
        setLoading(false);
        triggerError("Bu numara sistemde kayıtlı.", phoneShake);
        return;
    }

    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const vid = await phoneProvider.verifyPhoneNumber(`+90${cleanPhone}`, recaptchaVerifier.current!);
      setVerificationId(vid);
      setIsOtpVisible(true);
      LayoutAnimation.configureNext(CustomAnimation);
    } catch (error: any) {
      triggerError("SMS gönderilemedi. Numaranızı kontrol edin.", phoneShake);
    }
    setLoading(false);
  };

  const confirmCode = async () => {
    setErrorMessage('');
    if ((otp || '').length < 6) return triggerError("Lütfen 6 haneli kodu girin.", otpShake);
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
      smoothStepChange(2);
    } catch (error) {
      triggerError("Doğrulama kodu yanlış.", otpShake);
    }
    setLoading(false);
  };

  const handleStep1Action = () => {
    if (!isOtpVisible) sendVerification();
    else confirmCode();
  };

  const finish = async () => {
    setErrorMessage('');
    setLoading(true);
    
    const cleanPhone = (phone || '').replace(/\s/g, '');
    const finalPlate = `${plateCity}${plateLetters}${plateNumbers}`.toUpperCase();
    
    const registerData: any = { 
      firstName: firstName.trim() || '',
      lastName: lastName.trim() || '',
      phoneNumber: `+90${cleanPhone}`, 
      bloodType: blood || '',
      plate: finalPlate,
      brand: brand || '',
      color: selectedColor?.name || 'Beyaz',
      customNote: note || '',
      
      permissions: { 
        notifications: allowNotification, 
        sms: allowSms, 
        calls: allowCall 
      },
      
      preferences: { 
        notifications: allowNotification, 
        sms: allowSms, 
        calls: allowCall,
        showName: showName,
        showBloodType: showBloodType,
        showFullPlate: showFullPlate,
        showCarModel: showCarModel
      }
    };

    const codeToSend = Array.isArray(activationCode) ? activationCode[0] : activationCode;

    if (!codeToSend) {
        setLoading(false);
        return triggerError("Aktivasyon kodu bulunamadı. Lütfen QR kodu tekrar taratın.");
    }

    const result = await completeRegistration(codeToSend.toString(), registerData, true);

    if (result.success) {
      try {
          const user = auth.currentUser;
          if (user) {
              await updateDoc(doc(db, 'users', user.uid), { registrationCompleted: true });
          }
      } catch (error) {
          console.log("Kayıt tamamlama işareti eklenemedi:", error);
      }

      setLoading(false);
      smoothStepChange(4);
    } else {
      setLoading(false);
      triggerError(result.message || "Kayıt işlemi sırasında bir hata oluştu.");
    }
  };

  const next = () => {
    setErrorMessage('');
    if (step === 1) handleStep1Action();
    else if (step === 2) {
      const fName = firstName || '';
      const lName = lastName || '';

      if (!fName.trim()) return triggerError("Lütfen adınızı giriniz.", firstNameShake);
      if (!lName.trim()) return triggerError("Lütfen soyadınızı giriniz.", lastNameShake);
      if (plateCity.length < 2 || !plateLetters || !plateNumbers) return triggerError("Lütfen araç plakasını tam olarak girin.", plateShake);

      const finalPlate = `${plateCity}${plateLetters}${plateNumbers}`.toUpperCase();
      const plateRegex = /^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}\d{2,4}$/;
      
      if (!plateRegex.test(finalPlate)) {
        return triggerError("Lütfen geçerli bir Türkiye plakası giriniz. (Örn: 34ABC123)", plateShake);
      }

      if (!brand) return triggerError("Lütfen araç markasını seçiniz.", brandShake);
      
      smoothStepChange(3);
    }
  };

  const back = () => {
    setErrorMessage('');
    if (step === 1 && isOtpVisible) {
      LayoutAnimation.configureNext(CustomAnimation);
      setIsOtpVisible(false);
      setOtp('');
      return;
    }
    step > 1 ? smoothStepChange(step - 1) : router.back();
  };

  const renderError = () => {
    if (!errorMessage) return null; 

    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorInner}>
          <XCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
        
        {errorMessage.includes("kayıtlı") && (
          <TouchableOpacity onPress={() => router.replace('/login')} style={{ marginTop: 12 }}>
            <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Giriş Ekranına Git</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const isPhoneError = errorMessage.includes("telefon") || errorMessage.includes("kayıtlı");
  // DEĞİŞİKLİK: Burada eksik olan isOtpError değişkenini tanımladık
  const isOtpError = errorMessage.includes("kod") || errorMessage.includes("süresi") || errorMessage.includes("yanlış") || errorMessage.includes("doğrulama");
  const isFirstNameError = errorMessage.includes("adınızı");
  const isLastNameError = errorMessage.includes("soyadınızı");
  const isPlateError = errorMessage.includes("plaka");
  const isBrandError = errorMessage.includes("markasını");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* DEĞİŞİKLİK: Görünmez (Invisible) reCAPTCHA ve Modern Şık Modal */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        title="Güvenlik Doğrulaması"
        cancelLabel="Kapat"
        attemptInvisibleVerification={true}
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        containerStyle={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: 24, 
            overflow: 'hidden', 
            width: '85%', 
            alignSelf: 'center', 
            marginTop: 'auto', 
            marginBottom: 'auto',
            maxHeight: 520,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 15,
        }}
      />

      {isTransitioning && (
        <View style={styles.transitionOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {step < 4 ? (
        <View style={styles.header}>
            <TouchableOpacity onPress={back} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <ChevronLeft size={28} color={COLORS.textMain} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
                <Text style={styles.stepText}>{"Adım " + step + " / " + TOTAL_STEPS}</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
                </View>
            </View>
            <View style={{ width: 28 }} />
        </View>
      ) : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView 
          ref={scrollViewRef} 
          contentContainerStyle={[
            styles.scrollContainer, 
            { 
              paddingTop: step === 1 || step === 4 ? HEADER_HEIGHT : HEADER_HEIGHT + 24,
              justifyContent: step === 1 || step === 4 ? 'center' : 'flex-start'
            }
          ]} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled" 
          keyboardDismissMode="on-drag"
          bounces={false} 
          overScrollMode="never"
        >
          
          {step === 1 ? (
            <FadeInView key="step1">
              <Animated.View style={[styles.stepContainer, { transform: [{ translateY: keyboardShift }] }]}>
                <View style={styles.illustrationContainer}>
                  <HandPhoneIllustration type={isOtpVisible ? 'otp' : 'phone'} />
                </View>

                <View style={styles.badgeContainer}>
                  <ShieldCheck size={14} color={COLORS.primary} strokeWidth={2.5} />
                  <Text style={styles.badgeText}>GÜVENLİ DOĞRULAMA</Text>
                </View>

                <Text style={styles.title}>{isOtpVisible ? "Kodu Girin" : "Hoş Geldiniz"}</Text>
                <Text style={styles.subtitle}>{isOtpVisible ? "+90 " + phone + " numarasına gönderilen 6 haneli kodu girin." : "Güvenli bir şekilde devam etmek için telefon numaranızı doğrulayalım."}</Text>

                <View style={{ width: '100%', minHeight: 105, justifyContent: 'flex-start' }}>
                  {!isOtpVisible ? (
                    <View style={{width: '100%'}}>
                      <Animated.View style={[styles.appleCard, isPhoneError && { borderColor: '#FECACA', borderWidth: 1.5 }, { transform: [{ translateX: phoneShake }] }]}>
                        <View style={styles.prefixContainer}>
                          <Phone size={18} color={isPhoneError ? '#EF4444' : COLORS.textMuted} style={{ marginRight: 6 }} />
                          <Text style={[styles.prefixText, isPhoneError && { color: '#EF4444' }]}>+90</Text>
                        </View>
                        <View style={[styles.verticalDivider, isPhoneError && { backgroundColor: '#FECACA' }]} />
                        <TextInput 
                          style={[
                            styles.bigPhoneInput, 
                            { fontWeight: phone ? '600' : '400', fontSize: phone ? 18 : 16 }, 
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
                        <Text style={styles.infoText}>Numaranız uçtan uca şifrelenir.</Text>
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
                          setIsOtpVisible(false);
                          setOtp('');
                          Alert.alert("Bilgi", "Lütfen numaranızı kontrol edip tekrar deneyin.");
                      }}>
                        <Text style={styles.resendText}>Kod gelmedi mi? <Text style={{ fontWeight: '700', color: COLORS.primary }}>Tekrar Gönder</Text></Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {renderError()}

                <TouchableOpacity style={[styles.button, loading && styles.disabledButton, { marginTop: 16 }]} onPress={next} activeOpacity={0.8} disabled={loading}>
                   {loading ? <ActivityIndicator color="#fff" /> : (
                     <View style={styles.btnContent}>
                       <Text style={styles.buttonText}>{isOtpVisible ? "Doğrula" : "Devam Et"}</Text>
                       <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={2.5} />
                     </View>
                   )}
                </TouchableOpacity>
              </Animated.View>
            </FadeInView>
          ) : null}

          {step === 2 ? (
            <FadeInView key="step2">
              <View style={[styles.stepContainer, { paddingTop: 0 }]}>
                
                <View style={styles.illustrationContainer}>
                  <CarIllustration />
                </View>

                <Text style={styles.title}>Profilinizi Oluşturun</Text>
                <Text style={styles.subtitle}>Etiketinizi tarayan kişilerin size ulaşabilmesi için bilgileri girin.</Text>
                
                <Animated.View style={{ width: '100%' }}>
                  <View style={{ width: '100%', marginTop: 8 }}>
                    <Text style={styles.iosSectionHeader}>Sürücü Bİlgİlerİ</Text>
                    
                    <View style={styles.iosCardGroup}>
                      <Animated.View style={[styles.iosFormRow, { transform: [{ translateX: firstNameShake }] }]}>
                        <Text style={[styles.iosFormLabel, isFirstNameError && { color: '#EF4444' }]}>Ad</Text>
                        <TextInput 
                          style={[styles.iosFormInput, isFirstNameError && { color: '#EF4444' }]} 
                          placeholder="Örn: Ahmet" 
                          placeholderTextColor={COLORS.placeholder} 
                          value={firstName} 
                          onChangeText={(t) => { setFirstName(t); setErrorMessage(''); }} 
                        />
                        {isFirstNameError && <AlertCircle size={18} color="#EF4444" style={{ marginLeft: 8 }} />}
                      </Animated.View>
                      
                      <View style={styles.iosFormDivider} />
                      
                      <Animated.View style={[styles.iosFormRow, { transform: [{ translateX: lastNameShake }] }]}>
                        <Text style={[styles.iosFormLabel, isLastNameError && { color: '#EF4444' }]}>Soyad</Text>
                        <TextInput 
                          style={[styles.iosFormInput, isLastNameError && { color: '#EF4444' }]} 
                          placeholder="Örn: Yılmaz" 
                          placeholderTextColor={COLORS.placeholder} 
                          value={lastName} 
                          onChangeText={(t) => { setLastName(t); setErrorMessage(''); }} 
                        />
                        {isLastNameError && <AlertCircle size={18} color="#EF4444" style={{ marginLeft: 8 }} />}
                      </Animated.View>
                      
                      <View style={styles.iosFormDivider} />
                      
                      <View style={styles.iosFormRowVertical}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={styles.iosFormLabel}>Kan Grubu</Text>
                          <Text style={styles.iosOptionalText}>İsteğe bağlı</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} directionalLockEnabled={true} alwaysBounceVertical={false}>
                          {BLOOD_TYPES.map(b => (
                            <TouchableOpacity key={b} style={[styles.iosBadge, blood === b && styles.iosBadgeActive]} onPress={() => setBlood(b)} activeOpacity={0.7}>
                              <Text style={[styles.iosBadgeText, blood === b && styles.iosBadgeTextActive]}>{b}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        
                        <View style={styles.bloodInfoBox}>
                           <Info size={13} color={COLORS.primary} style={{ marginTop: 2 }} />
                           <Text style={styles.bloodInfoText}>Olası kaza durumlarında sağlık ekiplerine hayati bir hız kazandırmak için istenir.</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '100%', marginTop: 32 }}>
                    <Text style={styles.iosSectionHeader}>Araç Bİlgİlerİ</Text>
                    
                    <View style={styles.iosCardGroup}>
                      
                      <Animated.View style={[styles.iosFormRow, { transform: [{ translateX: plateShake }] }]}>
                        <Text style={[styles.iosFormLabel, isPlateError && { color: '#EF4444' }]}>Plaka</Text>
                        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                           <TextInput 
                              style={[styles.platePartInput, isPlateError && { color: '#EF4444' }, { width: 32 }]} 
                              placeholder="01" 
                              placeholderTextColor={COLORS.placeholder} 
                              keyboardType="number-pad" 
                              maxLength={2} 
                              value={plateCity} 
                              onChangeText={(t) => { setPlateCity(t.replace(/[^0-9]/g, '')); if(t.length === 2) plateLettersRef.current?.focus(); setErrorMessage(''); }} 
                           />
                           <Text style={styles.plateSeparator}>·</Text>
                           <TextInput 
                              ref={plateLettersRef} 
                              style={[styles.platePartInput, isPlateError && { color: '#EF4444' }, { width: 45 }]} 
                              placeholder="ABC" 
                              placeholderTextColor={COLORS.placeholder} 
                              autoCapitalize="characters" 
                              keyboardType="default" 
                              maxLength={3} 
                              value={plateLetters} 
                              onChangeText={(t) => { setPlateLetters(t.replace(/[^A-Za-z]/g, '').toUpperCase()); setErrorMessage(''); }} 
                           />
                           <Text style={styles.plateSeparator}>·</Text>
                           <TextInput 
                              ref={plateNumbersRef} 
                              style={[styles.platePartInput, isPlateError && { color: '#EF4444' }, { width: 50 }]} 
                              placeholder="1234" 
                              placeholderTextColor={COLORS.placeholder} 
                              keyboardType="number-pad" 
                              maxLength={4} 
                              value={plateNumbers} 
                              onChangeText={(t) => { setPlateNumbers(t.replace(/[^0-9]/g, '')); setErrorMessage(''); }} 
                           />
                        </View>
                        {isPlateError && <AlertCircle size={18} color="#EF4444" style={{ marginLeft: 8 }} />}
                      </Animated.View>
                      
                      <View style={styles.iosFormDivider} />
                      
                      <AnimatedTouchableOpacity 
                        style={[styles.iosFormRow, { transform: [{ translateX: brandShake }] }]} 
                        onPress={() => setBrandModalVisible(true)} 
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.iosFormLabel, isBrandError && { color: '#EF4444' }]}>Marka</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.iosValueText, !brand && { color: COLORS.placeholder, fontWeight: '400' }, isBrandError && { color: '#EF4444' }]}>{brand || "Seçiniz"}</Text>
                          {isBrandError ? <AlertCircle size={18} color="#EF4444" style={{ marginLeft: 4 }} /> : <ChevronRight size={18} color="#94A3B8" style={{ marginLeft: 4 }} />}
                        </View>
                      </AnimatedTouchableOpacity>

                      <View style={styles.iosFormDivider} />

                      <View style={styles.iosFormRowVertical}>
                        <Text style={styles.iosFormLabel}>Renk</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, marginTop: 14, paddingHorizontal: 4 }} directionalLockEnabled={true} alwaysBounceVertical={false}>
                          {CAR_COLORS.map((c) => (
                            <TouchableOpacity key={c.name} onPress={() => setSelectedColor(c)} style={[styles.colorCard, selectedColor.name === c.name && styles.colorCardActive]} activeOpacity={0.8}>
                              <View style={[styles.colorStrip, { backgroundColor: c.code, borderColor: c.border }]} />
                              <Text style={[styles.colorCardText, selectedColor.name === c.name && { color: COLORS.primary }]} numberOfLines={1}>{c.name}</Text>
                              {selectedColor.name === c.name ? <View style={styles.colorCheck}><Check size={14} strokeWidth={4} color={COLORS.primary} /></View> : null}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: '100%', marginTop: 32 }}>
                    <Text style={styles.iosSectionHeader}>GİZLİLİK VE GÜVENLİK</Text>
                    <View style={styles.iosCardGroup}>
                      <PermissionRow 
                        title="İsmimi Göster" 
                        desc="Kapalıyken diğer kullanıcılar isminizi M*** Y*** şeklinde sansürlü görür." 
                        value={showName} 
                        onValueChange={setShowName} 
                        Icon={showName ? Eye : EyeOff} 
                        iconColor={showName ? COLORS.primary : COLORS.inactiveIcon} 
                        iconBgColor={showName ? COLORS.lightBlueBg : COLORS.lightGrayBg}
                      />
                      <View style={styles.iosFormDivider} />
                      <PermissionRow 
                        title="Kan Grubumu Göster" 
                        desc="Kapalıyken QR kod okunduğunda sağlık ekipleri kan grubunuzu göremez." 
                        value={showBloodType} 
                        onValueChange={setShowBloodType} 
                        Icon={Droplet} 
                        iconColor={showBloodType ? COLORS.danger : COLORS.inactiveIcon} 
                        iconBgColor={showBloodType ? '#FEF2F2' : COLORS.lightGrayBg}
                      />
                      <View style={styles.iosFormDivider} />
                      <PermissionRow 
                        title="Plakamın Tamamını Göster" 
                        desc="Kapalıyken plakanızın belirli kısımları gizlenir (Örn: 34 *** 88)." 
                        value={showFullPlate} 
                        onValueChange={setShowFullPlate} 
                        Icon={CreditCard} 
                        iconColor={showFullPlate ? COLORS.primary : COLORS.inactiveIcon} 
                        iconBgColor={showFullPlate ? COLORS.lightBlueBg : COLORS.lightGrayBg}
                      />
                      <View style={styles.iosFormDivider} />
                      <PermissionRow 
                        title="Araç Modelini Göster" 
                        desc="Kapalıyken aracınızın marka ve modeli karşı tarafa gösterilmez." 
                        value={showCarModel} 
                        onValueChange={setShowCarModel} 
                        Icon={Car} 
                        iconColor={showCarModel ? COLORS.primary : COLORS.inactiveIcon} 
                        iconBgColor={showCarModel ? COLORS.lightBlueBg : COLORS.lightGrayBg}
                      />
                    </View>
                  </View>

                </Animated.View>

                {renderError()}

                <TouchableOpacity style={[styles.button, { marginTop: 16 }]} onPress={next} activeOpacity={0.8}>
                   <View style={styles.btnContent}>
                     <Text style={styles.buttonText}>Devam Et</Text>
                     <ArrowRight size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={2.5} />
                   </View>
                </TouchableOpacity>
              </View>
            </FadeInView>
          ) : null}

          {step === 3 ? (
            <FadeInView key="step3">
              <View style={styles.stepContainer}>
                <View style={styles.illustrationContainer}>
                  <CommunicationIllustration />
                </View>

                <Text style={styles.title}>İletişim Tercihleri</Text>
                <Text style={styles.subtitle}>İnsanların size nasıl ulaşabileceğini ve hangi bilgilerin gizleneceğini ayarlayın.</Text>
                
                <Animated.View style={{ width: '100%' }}>
                  <View style={{ width: '100%', marginTop: 8 }}>
                     <Text style={styles.iosSectionHeader}>Hazır Mesajlar</Text>
                     <View style={styles.chipRow}>
                       {READY_NOTES.map((item, index) => (
                         <TouchableOpacity key={index} style={[styles.chip, note.includes(item.text) && styles.chipActive]} onPress={() => setNote(`${item.text} ${item.emoji}`)} activeOpacity={0.7}>
                           <Text style={[styles.chipText, note.includes(item.text) && styles.chipTextActive]} numberOfLines={1} ellipsizeMode="tail">{item.text} {item.emoji}</Text>
                         </TouchableOpacity>
                       ))}
                     </View>

                     <View style={[styles.iosCardGroup, { minHeight: 110, alignItems: 'flex-start', padding: 16, marginTop: 4 }]}>
                       <TextInput 
                         style={[styles.input, { height: '100%', width: '100%', textAlignVertical: 'top', fontWeight: '500', minHeight: 80 }]} 
                         multiline 
                         placeholder="Veya kendi özel notunuzu yazın..." 
                         placeholderTextColor={COLORS.placeholder} 
                         selectionColor={COLORS.primary} 
                         value={note} 
                         onChangeText={(t) => { setNote(t); setErrorMessage(''); }} 
                       />
                     </View>
                  </View>

                  <View style={{ width: '100%', marginTop: 32 }}>
                    <Text style={styles.iosSectionHeader}>İLETİŞİM İZİNLERİ</Text>
                    <View style={styles.iosCardGroup}>
                      <PermissionRow 
                        title="Bildirimlere İzin Ver" 
                        desc="Anlık uyarılar alırsınız." 
                        value={allowNotification} 
                        onValueChange={setAllowNotification} 
                        Icon={allowNotification ? Bell : BellOff} 
                        iconColor={allowNotification ? COLORS.primary : COLORS.inactiveIcon} 
                        iconBgColor={allowNotification ? COLORS.lightBlueBg : COLORS.lightGrayBg}
                      />
                      <View style={styles.iosFormDivider} />
                      <PermissionRow 
                        title="SMS Alımına İzin Ver" 
                        desc="Önemli durumlarda SMS gelir." 
                        value={allowSms} 
                        onValueChange={setAllowSms} 
                        Icon={allowSms ? MessageCircle : MessageCircleOff} 
                        iconColor={allowSms ? "#F59E0B" : COLORS.inactiveIcon} 
                        iconBgColor={allowSms ? '#FEF3C7' : COLORS.lightGrayBg}
                      />
                      <View style={styles.iosFormDivider} />
                      <PermissionRow 
                        title="Çağrı Alımına İzin Ver" 
                        desc="İnsanlar sizi arayabilir." 
                        value={allowCall} 
                        onValueChange={setAllowCall} 
                        Icon={allowCall ? Phone : PhoneOff} 
                        iconColor={allowCall ? "#10B981" : COLORS.inactiveIcon} 
                        iconBgColor={allowCall ? '#D1FAE5' : COLORS.lightGrayBg}
                      />
                    </View>

                    <View style={styles.infoBoxSleek}>
                        <Info size={14} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>Tüm bu izinleri daha sonra Ayarlar menüsünden değiştirebilirsiniz.</Text>
                    </View>
                  </View>
                </Animated.View>

                {renderError()}

                <TouchableOpacity style={[styles.button, loading && styles.disabledButton, { marginTop: 16 }]} onPress={finish} disabled={loading} activeOpacity={0.8}>
                  {loading ? <ActivityIndicator color="#fff" /> : (
                     <View style={styles.btnContent}>
                       <Text style={styles.buttonText}>Güvenle Tamamla</Text>
                       <ShieldCheck size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={2.5} />
                     </View>
                  )}
                </TouchableOpacity>
              </View>
            </FadeInView>
          ) : null}

          {step === 4 ? (
            <FadeInView key="step4">
              <View style={[styles.stepContainer, { justifyContent: 'center', flex: 1, paddingVertical: 40 }]}>
                <SuccessIllustration />
                <Text style={styles.successTitle}>Harika, Hazırsınız!</Text>
                <Text style={styles.successSubtitle}>Akıllı etiketiniz sistemle başarıyla eşleşti ve kullanıma hazır.</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} activeOpacity={0.8}>
                  <View style={styles.btnContent}>
                    <Text style={styles.buttonText}>Ana Sayfaya Git</Text>
                    <Home size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={2.5} />
                  </View>
                </TouchableOpacity>
              </View>
            </FadeInView>
          ) : null}

          <View style={styles.bottomSpacer} />

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isBrandModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Araç Markası Seçiniz</Text>
            <TouchableOpacity onPress={() => setBrandModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
             <Search size={20} color={COLORS.textMuted} />
             <TextInput style={styles.searchInput} placeholder="Marka ara..." placeholderTextColor={COLORS.placeholder} value={brandSearch} onChangeText={(t) => { setBrandSearch(t); setErrorMessage(''); }} />
          </View>

          <FlatList
            data={CAR_BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()))}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.brandItem} onPress={() => { setBrand(item); setBrandModalVisible(false); setErrorMessage(''); }} activeOpacity={0.7}>
                <Text style={[styles.brandText, brand === item && { color: COLORS.primary, fontWeight: '700' }]}>{item}</Text>
                {brand === item ? <Check size={20} color={COLORS.primary} strokeWidth={2.5} /> : null}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, 
  
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center'
  },

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
  headerCenter: { alignItems: 'center', flex: 1, marginBottom: 4 },
  stepText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8, textTransform: 'uppercase' },
  progressBarBg: { width: 100, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 60 },
  bottomSpacer: { height: 20 },

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
  input: { flex: 1, fontSize: 16, color: COLORS.textMain, fontWeight: '500' }, 
  
  iosSectionHeader: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#94A3B8', 
    marginLeft: 16, 
    marginBottom: 8, 
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  iosCardGroup: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    width: '100%'
  },
  iosFormRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    minHeight: 60 
  },
  iosFormRowVertical: { 
    paddingHorizontal: 20, 
    paddingVertical: 18 
  },
  iosFormLabel: { 
    fontSize: 16, 
    fontWeight: '400', 
    color: COLORS.textMain, 
    width: 80 
  },
  iosFormInput: { 
    flex: 1, 
    fontSize: 16, 
    color: COLORS.textMain, 
    textAlign: 'right',
    padding: 0, 
    minHeight: 40,
    fontWeight: '500'
  },
  
  platePartInput: { fontSize: 16, color: COLORS.textMain, fontWeight: '600', textAlign: 'center', padding: 0, minHeight: 40 },
  plateSeparator: { fontSize: 18, color: '#CBD5E1', marginHorizontal: 2, fontWeight: '700' },

  iosValueText: { fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  iosFormDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginLeft: 20 },
  iosOptionalText: { fontSize: 13, color: '#94A3B8' },

  colorCard: { width: (width - 48 - 60) / 4, height: 100, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  colorCardActive: { borderColor: COLORS.primary, borderWidth: 2.5, backgroundColor: COLORS.cardBg, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  colorStrip: { width: '100%', height: 40, borderRadius: 10, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth },
  colorCardText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  colorCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFFFFF', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  
  iosBadge: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.background, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  iosBadgeActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.primary },
  iosBadgeText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  iosBadgeTextActive: { color: COLORS.primary },
  
  bloodInfoBox: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12, paddingHorizontal: 6 },
  bloodInfoText: { fontSize: 12, color: COLORS.textMuted, marginLeft: 6, flex: 1, lineHeight: 16 },

  otpSection: { width: '100%', alignItems: 'center' }, 
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
  
  customSwitchTrack: { width: 40, height: 24, borderRadius: 12, justifyContent: 'center', padding: 2 },
  customSwitchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8, width: '100%' },
  chip: { backgroundColor: COLORS.cardBg, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', width: '48%', marginBottom: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52, flexDirection: 'row' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.primary },
  chipText: { color: '#475569', fontWeight: '500', fontSize: 13, textAlign: 'center', flexShrink: 1 },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  
  permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20 },
  permissionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textMain, marginBottom: 2 },
  permissionDesc: { fontSize: 13, color: COLORS.textMuted },
  
  infoBoxSleek: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 0, marginTop: 12, width: '100%' },
  infoText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 8, flex: 1, lineHeight: 18, fontWeight: '500' },

  modalContainer: { flex: 1, padding: 24, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textMain },
  brandItem: { paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandText: { fontSize: 17, color: COLORS.textMain, fontWeight: '500' },
  closeButton: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 20 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, height: 54, marginBottom: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  
  successTitle: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginTop: 24, textAlign: 'center' },
  successSubtitle: { color: COLORS.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 40, fontSize: 16, lineHeight: 24, paddingHorizontal: 20 },
});