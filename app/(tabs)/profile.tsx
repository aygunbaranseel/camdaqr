import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  Easing,
  Keyboard,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';

// YENİ EKLENEN: Cihazın üst çentik ve saat boşluğunu kusursuz hesaplar
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- İKONLAR ---
import {
  Bell, BellOff, Calendar, Car, CheckCircle, ChevronDown, ChevronRight,
  CreditCard, Droplet, Edit2, Eye, EyeOff,
  Facebook,
  Globe,
  HelpCircle,
  Instagram,
  LogOut,
  Mail,
  MessageSquare, MessageSquareOff, Phone, PhoneOff,
  ShieldQuestion,
  Twitter,
  User, X
} from 'lucide-react-native';

// --- FIREBASE ---
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebaseConfig';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BLOOD_TYPES = ["A Rh+", "A Rh-", "B Rh+", "B Rh-", "AB Rh+", "AB Rh-", "0 Rh+", "0 Rh-"];

// PROFİL SAYFASININ KENDİ RENK PALETİ
const COLORS = {
  primary: '#2563EB', // Ana Mavi
  secondaryText: '#6B7280',
  inactiveIcon: '#9CA3AF',
  danger: '#EF4444',
  lightBlueBg: '#EFF6FF',
  lightGrayBg: '#F3F4F6', // Kapalı menü arka planı
  white: '#FFFFFF', // Açık menü kutusu arka planı
  switchTrackActive: '#2563EB', 
  switchTrackInactive: '#E5E7EB', 
};

// SSS LİSTESİ
const FAQ_LIST = [
  {
      id: 'faq1',
      icon: ShieldQuestion,
      title: 'Sistem nasıl çalışıyor?',
      subtitle: 'Numaramı kimler görebilir, nasıl ulaşılır?',
      answer: 'Aracınıza yapıştırdığınız QR kodu telefon kamerasıyla okutan kişiler, açılan web sayfası üzerinden doğrudan sizinle mesajlaşabilir veya sizi arayabilir. Bu işlemler sırasında gerçek telefon numaranız asla karşı tarafa gösterilmez.'
  },
  {
      id: 'faq2',
      icon: Globe,
      title: 'QR kodum kayboldu',
      subtitle: 'Ne yapmalıyım, yeni kod alabilir miyim?',
      answer: 'Yeni bir QR etiket sipariş etmek veya mevcut kodunuzu yenilemek için destek ekibimizle iletişime geçebilirsiniz. Eski kodunuz güvenlik amacıyla anında iptal edilecektir.'
  },
  {
      id: 'faq3',
      icon: User,
      title: 'Hesabımı nasıl silerim?',
      subtitle: 'Verilerimi kalıcı olarak temizleme adımları',
      answer: 'Hesabınızı ve tüm verilerinizi kalıcı olarak silmek için destek ekibimize hesabınıza kayıtlı telefon numaranız ile bir mail gönderebilirsiniz.'
  }
];

// --- CUSTOM SWITCH ---
const CustomSwitch = ({ value, onValueChange }: { value: boolean, onValueChange: () => void }) => {
  const animValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
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
        <Animated.View style={[
            styles.customSwitchThumb, 
            { transform: [{ translateX }] }
        ]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const insets = useSafeAreaInsets(); // <-- Dinamik boşluk hesaplayıcı eklendi
  
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<any>({});
  const [vehicleCount, setVehicleCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0); 
  const [formattedDate, setFormattedDate] = useState("...");
  
  const [totalScans, setTotalScans] = useState(0);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isBloodModalVisible, setBloodModalVisible] = useState(false);
  
  const [isHelpModalVisible, setHelpModalVisible] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const setupFirestoreListeners = () => {
    const user = auth.currentUser;
    if (!user) return () => {}; 

    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setProfileData(data);
            setTempName(`${data.firstName} ${data.lastName}`);
            
            if (data.createdAt) {
                const date = data.createdAt.toDate();
                const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
                setFormattedDate(new Intl.DateTimeFormat('tr-TR', options).format(date));
            } else {
                setFormattedDate("Yeni Üye");
            }
        }
    });

    const vehiclesRef = collection(db, 'users', user.uid, 'vehicles');
    const unsubVehicles = onSnapshot(vehiclesRef, (snap) => {
        setVehicleCount(snap.size);
        let currentTotalScans = 0;
        snap.forEach((docSnap) => {
            const vehicleData = docSnap.data();
            currentTotalScans += (vehicleData.scanCount || 0);
        });
        setTotalScans(currentTotalScans);
    });

    const messagesRef = collection(db, 'users', user.uid, 'messages');
    const unsubMessages = onSnapshot(messagesRef, (snap) => {
        setMessageCount(snap.size);
    });

    return () => {
        unsubUser();
        unsubVehicles();
        unsubMessages();
    };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    let unsubscribeData = setupFirestoreListeners();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (auth.currentUser) {
            if (unsubscribeData) unsubscribeData();
            unsubscribeData = setupFirestoreListeners();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      if (unsubscribeData) unsubscribeData();
      subscription.remove();
    };
  }, []);

  const handleSaveName = async () => {
    if (tempName.trim().length === 0) return;
    const parts = tempName.trim().split(' ');
    const newFirstName = parts[0];
    const newLastName = parts.slice(1).join(' ') || "";

    try {
        const user = auth.currentUser;
        if (user) {
            await updateDoc(doc(db, 'users', user.uid), {
                firstName: newFirstName,
                lastName: newLastName
            });
            setIsEditingName(false);
            Keyboard.dismiss();
        }
    } catch (e) { Alert.alert("Hata", "İsim güncellenemedi."); }
  };

  const handleSelectBlood = async (type: string) => {
    try {
        const user = auth.currentUser;
        if (user) {
            await updateDoc(doc(db, 'users', user.uid), { bloodType: type });
            setBloodModalVisible(false);
        }
    } catch (e) { Alert.alert("Hata", "Güncellenemedi."); }
  };

  const togglePreference = async (key: string, currentValue: boolean) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      try {
          const user = auth.currentUser;
          if (user) {
            await updateDoc(doc(db, 'users', user.uid), {
                [`preferences.${key}`]: !currentValue
            });
          }
      } catch (e) { Alert.alert("Hata", "Ayarlar kaydedilemedi."); }
  };

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istediğinize emin misiniz?", [
        { text: "Vazgeç", style: "cancel" },
        { 
            text: "Çıkış Yap", 
            style: "destructive", 
            onPress: async () => {
                setLoading(true); 
                try {
                    await signOut(auth);
                    router.replace('/login');
                } catch (error) {
                    router.replace('/login');
                } finally {
                    setLoading(false);
                }
            }
        }
    ]);
  };

  const openEmailClient = () => {
    Linking.openURL('mailto:destek@parkasistani.com?subject=Park Asistanı Destek Talebi');
  };

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const prefs = profileData.preferences || {};
  const fullName = `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim();

  // YARDIMCI BİLEŞEN: Menü İkon Kutusu
  const MenuIconBox = ({ isActive, ActiveIcon, InactiveIcon }: any) => (
    <View style={[styles.iconBox, { backgroundColor: isActive ? COLORS.white : COLORS.lightGrayBg }]}>
      {isActive ? <ActiveIcon size={20} color={COLORS.primary} /> : <InactiveIcon size={20} color={COLORS.inactiveIcon} />}
    </View>
  );

  return (
    // DEĞİŞİKLİK: SafeAreaView yerine normal View kullanılıp paddingTop'a dinamik inset verildi.
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
               <User size={44} color={COLORS.inactiveIcon} />
            </View>
          </View>
          
          {isEditingName ? (
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <View style={styles.editNameRow}>
                <TextInput
                  style={styles.minimalInput}
                  value={tempName}
                  onChangeText={setTempName}
                  autoFocus={true}
                  placeholder="İsim Soyad"
                />
                <TouchableOpacity onPress={handleSaveName} style={styles.iconSaveBtn}>
                  <CheckCircle size={22} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.phoneText}>{profileData.phoneNumber}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameDisplayContainer} onPress={() => setIsEditingName(true)} activeOpacity={0.7}>
              <View style={styles.nameRow}>
                 <Text style={styles.name}>{fullName || "Kullanıcı"}</Text>
                 <Edit2 size={16} color={COLORS.inactiveIcon} style={{ marginLeft: 8 }} />
              </View>
              <Text style={styles.phoneText}>{profileData.phoneNumber}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.badgesRow}>
            <TouchableOpacity style={[styles.badge, styles.bloodBadge]} onPress={() => setBloodModalVisible(true)}>
               <Droplet size={12} color={COLORS.danger} fill={COLORS.danger} style={{ marginRight: 4 }} />
               <Text style={styles.bloodText}>{profileData.bloodType || "Seç"}</Text>
               <ChevronDown size={10} color={COLORS.danger} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <View style={[styles.badge, styles.dateBadge]}>
               <Calendar size={12} color={COLORS.secondaryText} style={{ marginRight: 4 }} />
               <Text style={styles.dateText}>Üye: {formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* İSTATİSTİKLER */}
        <View style={styles.statsContainer}>
           <View style={styles.statItem}>
              <Text style={styles.statNumber}>{vehicleCount}</Text>
              <Text style={styles.statLabel}>Araç</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalScans}</Text>
              <Text style={styles.statLabel}>Okunma</Text>
           </View>
           <View style={styles.statDivider} />
           <View style={styles.statItem}>
              <Text style={styles.statNumber}>{messageCount}</Text>
              <Text style={styles.statLabel}>Mesaj</Text>
           </View>
        </View>

        <Text style={styles.sectionTitle}>İLETİŞİM TERCİHLERİ</Text>
        <View style={styles.menuGroup}>
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <MenuIconBox isActive={prefs.notifications} ActiveIcon={Bell} InactiveIcon={BellOff} />
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>{prefs.notifications ? "Bildirimler Açık" : "Bildirimlere İzin Ver"}</Text>
                <Text style={styles.descriptionText}>Kapalıyken araç güvenliği ile ilgili anlık uygulama bildirimlerini alamazsınız.</Text>
            </View>
            <CustomSwitch value={prefs.notifications || false} onValueChange={() => togglePreference('notifications', prefs.notifications)} />
          </View>
          
          <View style={styles.menuDivider} />
          
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <MenuIconBox isActive={prefs.sms} ActiveIcon={MessageSquare} InactiveIcon={MessageSquareOff} />
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>{prefs.sms ? "SMS İzni Açık" : "SMS'e İzin Ver"}</Text>
                <Text style={styles.descriptionText}>Kapalıyken internetiniz olmadığında size SMS ile ulaşılamaz.</Text>
            </View>
            <CustomSwitch value={prefs.sms || false} onValueChange={() => togglePreference('sms', prefs.sms)} />
          </View>
          
          <View style={styles.menuDivider} />
          
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <MenuIconBox isActive={prefs.calls} ActiveIcon={Phone} InactiveIcon={PhoneOff} />
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>{prefs.calls ? "Çağrı İzni Açık" : "Çağrıya İzin Ver"}</Text>
                <Text style={styles.descriptionText}>Kapalıyken destek ekibi veya güvenlik görevlileri acil durumda sizi arayamaz.</Text>
            </View>
            <CustomSwitch value={prefs.calls || false} onValueChange={() => togglePreference('calls', prefs.calls)} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>GİZLİLİK VE GÜVENLİK</Text>
        <View style={styles.menuGroup}>
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <MenuIconBox isActive={prefs.showName} ActiveIcon={Eye} InactiveIcon={EyeOff} />
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>İsmimi Göster</Text>
                <Text style={styles.descriptionText}>Kapalıyken diğer kullanıcılar isminizi <Text style={{fontWeight: 'bold'}}>M*** Y***</Text> şeklinde sansürlü görür.</Text>
            </View>
            <CustomSwitch value={prefs.showName || false} onValueChange={() => togglePreference('showName', prefs.showName)} />
          </View>
          
          <View style={styles.menuDivider} />
          
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <View style={[styles.iconBox, { backgroundColor: prefs.showBloodType ? COLORS.white : COLORS.lightGrayBg }]}>
               {prefs.showBloodType ? <Droplet size={20} color={COLORS.danger} /> : <Droplet size={20} color={COLORS.inactiveIcon} />}
            </View>
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>Kan Grubumu Göster</Text>
                <Text style={styles.descriptionText}>Kapalıyken QR kod tarandığında sağlık ekipleri kan grubunuzu <Text style={{fontWeight: 'bold'}}>göremez</Text>.</Text>
            </View>
            <CustomSwitch value={prefs.showBloodType || false} onValueChange={() => togglePreference('showBloodType', prefs.showBloodType)} />
          </View>
          
          <View style={styles.menuDivider} />
          
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <MenuIconBox isActive={prefs.showFullPlate} ActiveIcon={CreditCard} InactiveIcon={CreditCard} />
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>Plakamın Tamamını Göster</Text>
                <Text style={styles.descriptionText}>Kapalıyken plakanızın belirli kısımları <Text style={{fontWeight: 'bold'}}>gizlenir</Text> (Örn: 34 *** 88).</Text>
            </View>
            <CustomSwitch value={prefs.showFullPlate || false} onValueChange={() => togglePreference('showFullPlate', prefs.showFullPlate)} />
          </View>
          
          <View style={styles.menuDivider} />
          
          <View style={[styles.menuItem, { alignItems: 'flex-start' }]}>
            <MenuIconBox isActive={prefs.showCarModel} ActiveIcon={Car} InactiveIcon={Car} />
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.menuText}>Araç Modelini Göster</Text>
                <Text style={styles.descriptionText}>Kapalıyken aracınızın marka ve modeli karşı tarafa <Text style={{fontWeight: 'bold'}}>gösterilmez</Text>.</Text>
            </View>
            <CustomSwitch value={prefs.showCarModel || false} onValueChange={() => togglePreference('showCarModel', prefs.showCarModel)} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>DİĞER</Text>
        <View style={styles.menuGroup}>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setHelpModalVisible(true)} activeOpacity={0.7}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.white }]}>
               <HelpCircle size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Yardım Merkezi</Text>
            <ChevronRight size={18} color={COLORS.inactiveIcon} style={{marginLeft:'auto'}} />
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          
          <TouchableOpacity 
            style={[styles.menuItem, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleLogout}
            disabled={loading} 
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: COLORS.white }]}>
               {loading ? (
                   <ActivityIndicator size="small" color={COLORS.danger} />
               ) : (
                   <LogOut size={20} color={COLORS.danger} />
               )}
            </View>
            <Text style={[styles.menuText, { color: COLORS.danger }]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Versiyon 1.0.4 • Build 2024</Text>

      </ScrollView>

      {/* KAN GRUBU MODALI */}
      <Modal animationType="fade" transparent={true} visible={isBloodModalVisible} onRequestClose={() => setBloodModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kan Grubu Seçiniz</Text>
              <TouchableOpacity onPress={() => setBloodModalVisible(false)}>
                  <X size={24} color={COLORS.secondaryText} />
              </TouchableOpacity>
            </View>
            <View style={styles.bloodGrid}>
              {BLOOD_TYPES.map((type) => (
                <TouchableOpacity key={type} style={[styles.bloodOption, profileData.bloodType === type && styles.bloodOptionActive]} onPress={() => handleSelectBlood(type)}>
                  <Text style={[styles.bloodOptionText, profileData.bloodType === type && styles.bloodOptionTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* YARDIM MERKEZİ MODALI */}
      <Modal animationType="slide" transparent={true} visible={isHelpModalVisible} onRequestClose={() => setHelpModalVisible(false)}>
        <View style={styles.modalOverlaySlide}>
          <View style={styles.modalContentSlide}>
            <View style={styles.modalHeaderSlide}>
              <Text style={styles.modalTitle}>Yardım Merkezi</Text>
              <TouchableOpacity onPress={() => setHelpModalVisible(false)} style={styles.closeBtnSlide}>
                  <X size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                
                {/* SSS BÖLÜMÜ */}
                <Text style={styles.sectionTitle}>SIKÇA SORULAN SORULAR</Text>
                <View style={styles.menuGroup}>
                    {FAQ_LIST.map((faq, index) => {
                        const isExpanded = expandedFaq === faq.id;
                        const IconComp = faq.icon;
                        const isLast = index === FAQ_LIST.length - 1;

                        return (
                            <View key={faq.id}>
                                <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={() => toggleFaq(faq.id)}>
                                    <View style={[styles.iconBox, { backgroundColor: COLORS.white }]}>
                                        <IconComp size={20} color={COLORS.primary} />
                                    </View>
                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                        <Text style={styles.menuText}>{faq.title}</Text>
                                        <Text style={styles.descriptionText} numberOfLines={isExpanded ? undefined : 1}>{faq.subtitle}</Text>
                                    </View>
                                    {isExpanded ? (
                                        <ChevronDown size={18} color={COLORS.inactiveIcon} />
                                    ) : (
                                        <ChevronRight size={18} color={COLORS.inactiveIcon} />
                                    )}
                                </TouchableOpacity>
                                
                                {isExpanded && (
                                    <View style={styles.faqAnswerBox}>
                                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                                    </View>
                                )}
                                
                                {!isLast && <View style={styles.menuDivider} />}
                            </View>
                        );
                    })}
                </View>

                {/* DESTEK VE İLETİŞİM KARTLARI */}
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>DESTEK VE İLETİŞİM</Text>
                <View style={styles.supportGrid}>
                    <TouchableOpacity style={styles.supportCard} activeOpacity={0.7} onPress={openEmailClient}>
                        <View style={styles.supportIconWrapper}>
                           <Mail size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.supportCardTitle}>E-posta Gönder</Text>
                        <Text style={styles.supportCardDesc}>destek@parkasistani.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.supportCard} activeOpacity={0.7} onPress={() => Linking.openURL('https://parkasistani.com')}>
                        <View style={styles.supportIconWrapper}>
                           <Globe size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.supportCardTitle}>Web Sitemiz</Text>
                        <Text style={styles.supportCardDesc}>parkasistani.com</Text>
                    </TouchableOpacity>
                </View>

                {/* SOSYAL MEDYA İKONLARI */}
                <Text style={[styles.sectionTitle, { marginTop: 32, textAlign: 'center', marginLeft: 0 }]}>SOSYAL MEDYADA BİZ</Text>
                <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialCircle} activeOpacity={0.7} onPress={() => Linking.openURL('https://instagram.com')}>
                        <Instagram size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircle} activeOpacity={0.7} onPress={() => Linking.openURL('https://x.com')}>
                        <Twitter size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircle} activeOpacity={0.7} onPress={() => Linking.openURL('https://facebook.com')}>
                        <Facebook size={22} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.contactSubtext}>Taleplerinize genellikle 24 saat içerisinde dönüş sağlanmaktadır.</Text>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </View> // <-- DEĞİŞTİRİLEN KISIM BİTİŞİ
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  pageContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100 }, // <-- paddingTop küçültüldü (inset ile dengelendi)
  headerSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { marginBottom: 12 },
  avatarContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF', shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  nameDisplayContainer: { alignItems: 'center', marginBottom: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 26, fontWeight: '800', color: '#111827' },
  phoneText: { fontSize: 14, color: COLORS.secondaryText, fontWeight: '500', marginTop: 2 },
  editNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: COLORS.primary, paddingBottom: 4 },
  minimalInput: { fontSize: 26, fontWeight: '800', color: '#111827', minWidth: 150, textAlign: 'center', padding: 0 },
  iconSaveBtn: { marginLeft: 12 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  bloodBadge: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  bloodText: { color: COLORS.danger, fontWeight: '700', fontSize: 12 },
  dateBadge: { backgroundColor: COLORS.lightGrayBg, borderColor: COLORS.switchTrackInactive },
  dateText: { color: COLORS.secondaryText, fontWeight: '600', fontSize: 12 },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 20, marginBottom: 30, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, alignItems: 'center', justifyContent: 'space-evenly' },
  statItem: { alignItems: 'center', width: '30%' },
  statNumber: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
  statLabel: { fontSize: 12, color: COLORS.secondaryText, fontWeight: '500' },
  statDivider: { width: 1, height: '60%', backgroundColor: COLORS.lightGrayBg },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: COLORS.inactiveIcon, marginBottom: 8, marginLeft: 8, letterSpacing: 0.5 },
  
  menuGroup: { backgroundColor: '#FFFFFF', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, minHeight: 60 }, 
  menuDivider: { height: 1, backgroundColor: COLORS.lightGrayBg, marginLeft: 60 },
  
  iconBox: { 
      width: 38, 
      height: 38, 
      borderRadius: 10, 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginRight: 14,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      shadowColor: "#000", 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 2, 
      elevation: 2 
  },
  
  menuText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  descriptionText: { fontSize: 11, color: COLORS.secondaryText, marginTop: 4, lineHeight: 16, paddingRight: 4 },
  
  versionText: { textAlign: 'center', color: COLORS.inactiveIcon, fontSize: 12, marginTop: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  bloodOption: { width: '45%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.switchTrackInactive, alignItems: 'center', backgroundColor: '#F9FAFB' },
  bloodOptionActive: { backgroundColor: '#FEF2F2', borderColor: COLORS.danger },
  bloodOptionText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  bloodOptionTextActive: { color: COLORS.danger, fontWeight: '800' },
  customSwitchTrack: { width: 36, height: 20, borderRadius: 10, justifyContent: 'center', padding: 2 },
  customSwitchThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'white', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },

  modalOverlaySlide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentSlide: { backgroundColor: '#F8F9FA', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 0, height: '85%' },
  modalHeaderSlide: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  closeBtnSlide: { padding: 8, backgroundColor: '#FFFFFF', borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  faqAnswerBox: { paddingHorizontal: 16, paddingLeft: 62, paddingBottom: 16, paddingTop: 0 },
  faqAnswerText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  
  supportGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  supportCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  supportIconWrapper: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.lightBlueBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#D1E4FF' },
  supportCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4, textAlign: 'center' },
  supportCardDesc: { fontSize: 11, color: COLORS.secondaryText, textAlign: 'center' },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  contactSubtext: { textAlign: 'center', fontSize: 12, color: COLORS.inactiveIcon, marginTop: 24, paddingHorizontal: 20 }
});