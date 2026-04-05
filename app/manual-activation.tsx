import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

// --- İKONLAR (LUCIDE) ---
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  ShieldCheck,
  X,
  XCircle
} from 'lucide-react-native';

// --- FIREBASE ---
import { completeRegistration } from '../services/authService';
import { auth } from '../services/firebaseConfig';

// --- İLLÜSTRASYON ---
import CarIllustration from '../components/CarIllustration';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24;
const HEADER_HEIGHT = STATUSBAR_HEIGHT + 60;

const COLORS = {
  primary: '#2563EB',
  background: '#F8FAFC', 
  cardBg: '#FFFFFF',     
  textMain: '#0F172A',
  textMuted: '#64748B',
  placeholder: '#CBD5E1',
};

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

const READY_NOTES = [
  { text: "Hemen geliyorum", emoji: "🏃‍♂️" },
  { text: "5 dk içinde oradayım", emoji: "⏱️" },
  { text: "Lütfen beni arayın", emoji: "📱" },
  { text: "Hemen çıkıyorum", emoji: "🛒" }
];

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

export default function ManualActivationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const plateLettersRef = useRef<TextInput>(null);
  const plateNumbersRef = useRef<TextInput>(null);

  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Verileri
  const [activationCode, setActivationCode] = useState('');
  
  const [plateCity, setPlateCity] = useState('');
  const [plateLetters, setPlateLetters] = useState('');
  const [plateNumbers, setPlateNumbers] = useState('');
  
  const [brand, setBrand] = useState('');
  const [selectedColor, setSelectedColor] = useState(CAR_COLORS[0]);
  const [note, setNote] = useState('');

  // Modal
  const [isBrandModalVisible, setBrandModalVisible] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  // Hata Yönetimi
  const [errorMessage, setErrorMessage] = useState('');

  const codeShake = useRef(new Animated.Value(0)).current;
  const plateShake = useRef(new Animated.Value(0)).current;
  const brandShake = useRef(new Animated.Value(0)).current;

  const isFull = activationCode.length === CODE_LENGTH;

  // KLAVYE ASANSÖR MANTIĞI - YUMUŞATILMIŞ
  const [isFocused, setIsFocused] = useState(false);
  const keyboardShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardDidShowListener = Keyboard.addListener(showEvent, () => {
      Animated.timing(keyboardShift, {
        toValue: -90, // Daha az kaydırıldı
        duration: 200, // Hızlandırıldı (Kasılmayı önler)
        easing: Easing.out(Easing.quad), // Daha yumuşak bir ivme eğrisi
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

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
        setErrorMessage("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
        setTimeout(() => router.replace('/login'), 2000);
        return;
    }

    if (params.autoFilledCode) {
        setActivationCode((params.autoFilledCode as string).toUpperCase());
    }
  }, [params]);

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

  const handleSave = async () => {
    setErrorMessage('');
    
    if (!isFull) return triggerError("Lütfen 6 haneli güvenlik kodunu eksiksiz girin.", codeShake);
    if (plateCity.length < 2 || !plateLetters || !plateNumbers) return triggerError("Lütfen araç plakasını tam olarak girin.", plateShake);
    if (!brand) return triggerError("Lütfen araç markasını seçin.", brandShake);

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
        setLoading(false);
        return triggerError("Oturum süresi dolmuş. Tekrar giriş yapın.");
    }

    const registerData = {
        firstName: "", 
        lastName: "", 
        phoneNumber: user.phoneNumber, 
        bloodType: "", 
        plate: `${plateCity}${plateLetters}${plateNumbers}`.toUpperCase(),
        brand,
        color: selectedColor.name,
        customNote: note, 
        permissions: { 
            notifications: true,
            sms: true,
            calls: true,
        }
    };

    const result = await completeRegistration(activationCode, registerData, false);
    
    setLoading(false);

    if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
            router.replace('/(tabs)');
        }, 1500);
    } else {
        triggerError(result.message || "Kayıt işlemi sırasında bir hata oluştu.", codeShake);
    }
  };

  const renderError = () => {
    if (!errorMessage) return null; 

    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorInner}>
          <XCircle size={14} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      </View>
    );
  };

  const isCodeError = errorMessage.includes("kodu") || errorMessage.includes("süresi");
  const isPlateError = errorMessage.includes("plaka");
  const isBrandError = errorMessage.includes("markasını");

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ChevronLeft size={28} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Araç Ekle</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingTop: HEADER_HEIGHT + 10 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false} overScrollMode="never">
          
          <FadeInView>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View style={[styles.stepContainer, { transform: [{ translateY: keyboardShift }] }]}>
                
                {/* İLLÜSTRASYON & BAŞLIK */}
                <View style={styles.illustrationContainer}>
                  <CarIllustration />
                </View>

                <Text style={styles.title}>Aracınızı Tanıtın</Text>
                <Text style={styles.subtitle}>Paketinizden çıkan 6 haneli güvenlik kodunu ve araç bilgilerinizi giriniz.</Text>

                <Animated.View style={{ width: '100%', marginTop: 8 }}>
                  
                  {/* --- 1. AKTİVASYON KODU (OTP TARZI) DİĞER SAYFALARLA EŞLEŞTİRİLDİ --- */}
                  <Text style={styles.iosSectionHeader}>{"Güvenlİk Kodu"}</Text>
                  <View style={styles.otpSection}>
                      <Animated.View style={[styles.otpInputContainer, { transform: [{ translateX: codeShake }] }]}>
                        <TextInput 
                          style={styles.hiddenOverlayInput} 
                          value={activationCode} 
                          onChangeText={(t) => { setActivationCode(t.toUpperCase()); setErrorMessage(''); }} 
                          maxLength={CODE_LENGTH} 
                          autoCapitalize="characters"
                          autoCorrect={false}
                          autoFocus={!params.autoFilledCode}
                          caretHidden={true} 
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                        />
                        <View style={styles.otpBoxContainer} pointerEvents="none">
                          {Array(CODE_LENGTH).fill(0).map((_, index) => {
                            const isActive = activationCode.length === index && isFocused;
                            const isFilled = activationCode.length > index;
                            return (
                              <View key={index} style={[styles.codeBox, isFilled && styles.codeBoxFilled, isActive && styles.codeBoxActive, isCodeError && styles.codeBoxError]}>
                                <Text style={[styles.codeText, isActive && { color: COLORS.primary }, isCodeError && { color: '#EF4444' }]}>{activationCode[index] || ""}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </Animated.View>
                  </View>

                  <View style={styles.infoBoxSleek}>
                      <Info size={14} color={COLORS.textMuted} style={{ marginTop: 2 }} />
                      <Text style={styles.infoText}>{"Paketinizin içinden çıkan güvenlik kodunu giriniz."}</Text>
                  </View>

                  {/* --- 2. ARAÇ BİLGİLERİ --- */}
                  <View style={{ width: '100%', marginTop: 36 }}>
                    <Text style={styles.iosSectionHeader}>{"Araç Bİlgİlerİ"}</Text>
                    
                    <View style={styles.iosCardGroup}>
                      
                      <Animated.View style={[styles.iosFormRow, { transform: [{ translateX: plateShake }] }]}>
                        <Text style={[styles.iosFormLabel, isPlateError && { color: '#EF4444' }]}>{"Plaka"}</Text>
                        <View style={{ flexDirection: 'row', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                           <TextInput 
                              style={[styles.platePartInput, isPlateError && { color: '#EF4444' }, { width: 32 }]} 
                              placeholder="01" 
                              placeholderTextColor={COLORS.placeholder} 
                              keyboardType="number-pad" // DÜZELTME: Yalnızca Sayı
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
                              keyboardType="default" // DÜZELTME: Harf
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
                              keyboardType="number-pad" // DÜZELTME: Yalnızca Sayı
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
                        <Text style={[styles.iosFormLabel, isBrandError && { color: '#EF4444' }]}>{"Marka"}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={[styles.iosValueText, !brand && { color: COLORS.placeholder, fontWeight: '400' }, isBrandError && { color: '#EF4444' }]}>{brand || "Seçiniz"}</Text>
                          {isBrandError ? <AlertCircle size={18} color="#EF4444" style={{ marginLeft: 4 }} /> : <ChevronRight size={18} color="#94A3B8" style={{ marginLeft: 4 }} />}
                        </View>
                      </AnimatedTouchableOpacity>

                      <View style={styles.iosFormDivider} />

                      <View style={styles.iosFormRowVertical}>
                        <Text style={styles.iosFormLabel}>{"Renk"}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, marginTop: 14, paddingHorizontal: 4 }}>
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

                    <View style={styles.infoBoxSleek}>
                        <ShieldCheck size={14} color={COLORS.primary} style={{ marginTop: 2 }} />
                        <Text style={styles.infoText}>{"Etiketiniz okutulduğunda, plakanız ve araç bilgileriniz güvenlik amacıyla gizlenerek gösterilir."}</Text>
                    </View>

                  </View>

                  {/* --- 3. HIZLI MESAJLAR --- */}
                  <View style={{ width: '100%', marginTop: 32 }}>
                    <Text style={styles.iosSectionHeader}>{"Hazır Mesajlar"}</Text>
                    <View style={styles.chipRow}>
                      {READY_NOTES.map((item, index) => (
                        <TouchableOpacity key={index} style={[styles.chip, note.includes(item.text) && styles.chipActive]} onPress={() => setNote(`${item.text} ${item.emoji}`)} activeOpacity={0.7}>
                          <Text style={[styles.chipText, note.includes(item.text) && styles.chipTextActive]} numberOfLines={1} ellipsizeMode="tail">{item.text} {item.emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={[styles.iosCardGroup, { minHeight: 90, paddingHorizontal: 16, paddingVertical: 12, marginTop: 4 }]}>
                      <TextInput 
                        style={[styles.input, { textAlignVertical: 'top', fontWeight: '500', padding: 0 }]} 
                        multiline 
                        placeholder="Veya kendi özel notunuzu yazın..." 
                        placeholderTextColor={COLORS.placeholder} 
                        selectionColor={COLORS.primary} 
                        value={note} 
                        onChangeText={(t) => { setNote(t); setErrorMessage(''); }} 
                      />
                    </View>
                  </View>

                </Animated.View>

                {renderError()}

                <AnimatedTouchableOpacity 
                  style={[styles.button, { marginTop: 24, backgroundColor: (!isFull || loading) ? '#F1F5F9' : (isSuccess ? '#10B981' : COLORS.primary) }, (!isFull || loading) && { shadowOpacity: 0, elevation: 0 }]} 
                  onPress={handleSave} 
                  disabled={!isFull || loading || isSuccess} 
                  activeOpacity={0.8}
                >
                  {loading ? <ActivityIndicator color={COLORS.primary} /> : isSuccess ? (
                    <View style={styles.btnContent}>
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{"Başarıyla Eklendi!"}</Text>
                      <CheckCircle size={20} color="#fff" style={{ marginLeft: 8 }} strokeWidth={2.5} />
                    </View>
                  ) : (
                    <View style={styles.btnContent}>
                      <Text style={[styles.buttonText, (!isFull) && styles.disabledButtonText]}>{"Aracı Kaydet"}</Text>
                      <ArrowRight size={20} color={isFull ? "#fff" : "#9CA3AF"} style={{ marginLeft: 8 }} strokeWidth={2.5} />
                    </View>
                  )}
                </AnimatedTouchableOpacity>

              </Animated.View>
            </TouchableWithoutFeedback>
          </FadeInView>

          <View style={styles.bottomSpacer} />

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isBrandModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{"Araç Markası Seçiniz"}</Text>
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
  scrollContainer: { flexGrow: 1, justifyContent: 'flex-start', paddingBottom: 60 },
  bottomSpacer: { height: 20 },

  stepContainer: { alignItems: 'center', width: '100%', paddingHorizontal: 24 },
  illustrationContainer: { height: 160, justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 15 },
  
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textMain, marginBottom: 8, textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: COLORS.textMuted, marginBottom: 24, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  
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
  
  platePartInput: { fontSize: 16, color: COLORS.textMain, fontWeight: '600', textAlign: 'center', padding: 0, minHeight: 40 },
  plateSeparator: { fontSize: 18, color: '#CBD5E1', marginHorizontal: 2, fontWeight: '700' },

  iosValueText: { fontSize: 16, color: COLORS.textMain, fontWeight: '500' },
  iosFormDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginLeft: 20 },

  colorCard: { width: (width - 48 - 60) / 4, height: 100, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' },
  colorCardActive: { borderColor: COLORS.primary, borderWidth: 2.5, backgroundColor: COLORS.cardBg, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  colorStrip: { width: '100%', height: 40, borderRadius: 10, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth },
  colorCardText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  colorCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: '#FFFFFF', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  
  // AKTİVASYON KODU (OTP) STİLLERİ - KARE FORM VE YAKINLAŞTIRILMIŞ TASARIM
  otpSection: { width: '100%', alignItems: 'center' }, 
  otpInputContainer: { width: '100%', height: 64, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  hiddenOverlayInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0, zIndex: 10 },
  otpBoxContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', gap: 8 },
  codeBox: { width: (width - 48 - 40) / 6, aspectRatio: 1, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  codeBoxFilled: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' },
  codeBoxActive: { borderColor: COLORS.primary, backgroundColor: '#FFFFFF', transform: [{ scale: 1.05 }], shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  codeBoxError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  codeText: { fontSize: 24, fontWeight: '700', color: COLORS.textMain },
  
  errorContainer: { width: '100%', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  errorInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  button: { paddingVertical: 18, borderRadius: 20, width: '100%', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5 },
  btnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  disabledButtonText: { color: '#9CA3AF' },
  
  input: { flex: 1, fontSize: 16, color: COLORS.textMain, fontWeight: '500' }, 

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8, width: '100%' },
  chip: { backgroundColor: COLORS.cardBg, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', width: '48%', marginBottom: 12, alignItems: 'center', justifyContent: 'center', minHeight: 52, flexDirection: 'row' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.primary },
  chipText: { color: '#475569', fontWeight: '500', fontSize: 13, textAlign: 'center', flexShrink: 1 },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },

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
});