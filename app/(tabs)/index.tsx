import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    AppState,
    Dimensions,
    FlatList,
    Keyboard,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// YENİ EKLENEN: Cihazın üst çentik ve saat boşluğunu kusursuz hesaplar
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- İKONLAR (LUCIDE) ---
import {
    ArrowRight,
    BarChart3,
    Car,
    CheckCircle,
    ChevronDown,
    Edit,
    Fingerprint,
    MessageCircle,
    MessageCircleMore,
    MessageSquareText,
    Pencil,
    QrCode,
    RefreshCw,
    Scan,
    ShieldCheck,
    Trash2,
    User,
    X
} from 'lucide-react-native';

import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import { deleteVehicle } from '../../services/authService';
import { auth, db } from '../../services/firebaseConfig';
import { registerForPushNotificationsAsync } from '../../services/notificationService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; 

const COLORS = {
  primary: '#2563EB',
  primaryLight: '#EFF6FF', 
  darkCard: '#111827',
  textWhite: '#FFFFFF',
  textGray: '#9CA3AF',
  textDark: '#1F2937',
  inputBg: 'rgba(255, 255, 255, 0.15)',
  success: '#16A34A',
  danger: '#EF4444',
  warning: '#F59E0B', 
  passive: '#6B7280', 
  darkBtn: '#1F2937',
  border: '#E5E7EB',
  chartBarBg: '#F3F4F6',
  messageBubble: '#F3F4F6'
};

const CAR_MODELS = [
  "Togg T10X", "Volkswagen Golf", "Volkswagen Polo", "BMW 320i", "BMW 520d",
  "Mercedes C200", "Mercedes E180", "Audi A3", "Audi A4",
  "Ford Focus", "Renault Clio", "Renault Megane", "Fiat Egea", "Toyota Corolla"
].sort();

const formatMessageDate = (timestamp: any) => {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

// --- PLAKA FORMATLAYICI (Örn: 34ABC123 -> 34 ABC 123) ---
const formatPlateDisplay = (plate?: string) => {
  if (!plate) return "---";
  const cleaned = plate.replace(/\s/g, ''); 
  const match = cleaned.match(/^(\d{1,2})([A-Z]{1,3})(\d{2,4})$/i);
  
  if (match) {
      return `${match[1]} ${match[2]} ${match[3]}`;
  }
  return plate; 
};

export default function DashboardScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const insets = useSafeAreaInsets(); // <-- Dinamik boşluk hesaplayıcı eklendi

  const [userData, setUserData] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [allMessages, setAllMessages] = useState<any[]>([]); 
  
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [tempStatus, setTempStatus] = useState("");
  
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [tempBrand, setTempBrand] = useState('');
  const [plateParts, setPlateParts] = useState({ part1: '', part2: '', part3: '' });

  const [isMessageModalVisible, setMessageModalVisible] = useState(false);
  const [isChartModalVisible, setChartModalVisible] = useState(false);
  const [isBrandPickerVisible, setBrandPickerVisible] = useState(false);
  const [isQrModalVisible, setQrModalVisible] = useState(false);

  const currentCar = vehicles[activeIndex] || {};
  const currentCarMessages = allMessages.filter(m => m.vehicleId === currentCar.id);
  const lastMessage = currentCarMessages.length > 0 ? currentCarMessages[0] : null;
  const unreadCount = currentCarMessages.filter(m => !m.isRead).length;

  useEffect(() => {
    const setupNotifications = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await updateDoc(doc(db, 'users', user.uid), { expoPushToken: token });
        }
      } catch (error) {
        console.log("Push token error:", error);
      }
    };
    setupNotifications();
  }, []);

  const setupFirestoreListeners = () => {
    const user = auth.currentUser;
    if (!user) { 
        setLoading(false);
        return () => {}; 
    }

    const userUnsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });

    const vehiclesQuery = collection(db, 'users', user.uid, 'vehicles');
    const vehiclesUnsub = onSnapshot(vehiclesQuery, (querySnapshot) => {
        const cars: any[] = [];
        querySnapshot.forEach((doc) => cars.push({ id: doc.id, ...doc.data() }));
        cars.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        setVehicles(cars);
        if (activeIndex >= cars.length && cars.length > 0) setActiveIndex(cars.length - 1);
        else if (cars.length === 0) setActiveIndex(0);
    });

    const messagesQuery = query(collection(db, 'users', user.uid, 'messages'), orderBy('createdAt', 'desc'));
    const messagesUnsub = onSnapshot(messagesQuery, (snapshot) => {
        const msgs: any[] = [];
        snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
        setAllMessages(msgs);
        setLoading(false);
    });

    return () => {
        userUnsub();
        vehiclesUnsub();
        messagesUnsub();
    };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { 
        router.replace('/login'); 
        return; 
    }
    let unsubscribeAll = setupFirestoreListeners();
    const subscription = AppState.addEventListener('change', nextAppState => {
        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
          if (unsubscribeAll) unsubscribeAll();
          unsubscribeAll = setupFirestoreListeners();
        }
        appState.current = nextAppState;
    });

    return () => { 
        if (unsubscribeAll) unsubscribeAll();
        subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (currentCar) setTempStatus(currentCar.customNote || "");
  }, [currentCar]);

  const handleSaveStatus = async () => {
    try {
      const user = auth.currentUser;
      if (user && currentCar.id) {
        const noteToSave = tempStatus.trim();
        await updateDoc(doc(db, 'users', user.uid, 'vehicles', currentCar.id), { customNote: noteToSave });
        await updateDoc(doc(db, 'vehicles', currentCar.id), { customNote: noteToSave });
        setIsEditingStatus(false);
        Keyboard.dismiss();
      }
    } catch (e) { Alert.alert("Hata", "Not güncellenemedi."); }
  };

  const toggleVehicleStatus = async (car: any) => {
      if (!car.id) return;
      try {
          const user = auth.currentUser;
          if (user) {
              const newStatus = car.status === 'active' ? 'passive' : 'active';
              await updateDoc(doc(db, 'users', user.uid, 'vehicles', car.id), { status: newStatus });
              await updateDoc(doc(db, 'vehicles', car.id), { status: newStatus });
          }
      } catch (error) { Alert.alert("Hata", "Durum güncellenemedi."); }
  };

  const saveVehicleChanges = async () => {
    if (!currentCar.id) return;
    if (tempBrand.trim() === '' || !plateParts.part1 || !plateParts.part2 || !plateParts.part3) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    try {
      const user = auth.currentUser;
      if (user) {
        const finalPlate = `${plateParts.part1}${plateParts.part2.toUpperCase()}${plateParts.part3}`;
        const updates = { brand: tempBrand, plate: finalPlate };
        
        await updateDoc(doc(db, 'users', user.uid, 'vehicles', currentCar.id), updates);
        await updateDoc(doc(db, 'vehicles', currentCar.id), updates);
        setIsEditingVehicle(false);
        Keyboard.dismiss();
      }
    } catch (e) { Alert.alert("Hata", "Güncelleme başarısız."); }
  };

  const handleDeleteCar = () => {
    if (!currentCar.id) return;
    Alert.alert("Aracı Sil", "Bu aracı kalıcı olarak silmek istiyor musunuz?", [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: async () => {
            setLoading(true);
            const result = await deleteVehicle(currentCar.id);
            setLoading(false);
            if (result.success) {
                Alert.alert("Başarılı", "Araç silindi.");
                if (activeIndex > 0) setActiveIndex(prev => prev - 1);
            } else { Alert.alert("Hata", result.message); }
        }}
    ]);
  };

  const openMessageModal = () => {
      setMessageModalVisible(true);
      const user = auth.currentUser;
      if(user) {
          const unreadMsgs = currentCarMessages.filter(m => !m.isRead);
          unreadMsgs.forEach(async (msg) => {
              try { await updateDoc(doc(db, 'users', user.uid, 'messages', msg.id), { isRead: true }); } catch(e){}
          });
      }
  };

  const startEditingVehicle = () => {
    if (!currentCar.id) return;
    setTempBrand(currentCar.brand || "");
    const plateString = (currentCar.plate || "").replace(/\s/g, ''); 
    const match = plateString.match(/^(\d{1,2})([A-Z]{1,3})(\d{2,4})$/i);

    if (match) {
        setPlateParts({ part1: match[1] || '', part2: match[2] || '', part3: match[3] || '' });
    } else {
        setPlateParts({ part1: plateString.substring(0, 2), part2: plateString.substring(2), part3: '' });
    }
    setIsEditingVehicle(true);
  };

  const cancelVehicleEdit = () => { setIsEditingVehicle(false); };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
    if(isEditingVehicle) setIsEditingVehicle(false);
  };

  const handleSelectBrand = (selectedBrand: string) => {
      setTempBrand(selectedBrand);
      setBrandPickerVisible(false);
  };

  const getRealWeeklyStats = () => {
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const defaultStats = [
      { day: 'Pzt', value: 0, index: 1 }, { day: 'Sal', value: 0, index: 2 }, 
      { day: 'Çar', value: 0, index: 3 }, { day: 'Per', value: 0, index: 4 }, 
      { day: 'Cum', value: 0, index: 5 }, { day: 'Cmt', value: 0, index: 6 }, 
      { day: 'Paz', value: 0, index: 0 }
    ];

    if (!currentCar.weeklyStats) return defaultStats;

    return defaultStats.map(stat => ({
        day: stat.day,
        value: currentCar.weeklyStats[stat.index] || 0,
        index: stat.index
    }));
  };

  const weeklyStats = getRealWeeklyStats();
  const maxStatValue = Math.max(...weeklyStats.map(s => s.value), 10); 
  
  const totalWeeklyScans = weeklyStats.reduce((sum, current) => sum + current.value, 0);

  if (loading) return <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={COLORS.primary}/></View>;

  const safeUserData = userData || {};
  const qrCodeValue = `https://park-asistani.web.app/scan?code=${currentCar.activationCode || 'error'}`;

  return (
    // DEĞİŞİKLİK: SafeAreaView kaldırıldı, View ve paddingTop: insets.top kullanıldı.
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Tekrar Merhaba,</Text>
            <Text style={styles.userName}>{safeUserData.firstName || "Sürücü"} 👋</Text>

            <View style={styles.statusContainer}>
              {isEditingStatus ? (
                <View style={styles.editInputWrapper}>
                  <TextInput
                    style={styles.statusInput}
                    value={tempStatus}
                    onChangeText={setTempStatus}
                    autoFocus
                    onBlur={() => setIsEditingStatus(false)}
                    onSubmitEditing={handleSaveStatus}
                  />
                  <TouchableOpacity onPress={handleSaveStatus} style={styles.saveBtn}>
                    <CheckCircle size={24} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.statusDisplay} onPress={() => setIsEditingStatus(true)} activeOpacity={0.7}>
                  <Text style={styles.statusText} numberOfLines={1}>
                      {currentCar.customNote || "Bu araç için not ekleyin ✏️"}
                  </Text>
                  <Pencil size={16} color={COLORS.textGray} style={{ opacity: 0.9}} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/profile')}>
            <User size={20} color={COLORS.textGray} />
          </TouchableOpacity>
        </View>

        {/* GARAJ CAROUSEL */}
        <View style={styles.carouselContainer}>
            {vehicles.length > 0 ? (
                <>
                    <ScrollView
                        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll} scrollEventThrottle={16}
                        contentContainerStyle={styles.carouselContent} decelerationRate="fast"
                        snapToInterval={width - 48 + 12} snapToAlignment="center"
                        keyboardShouldPersistTaps="handled"
                    >
                        {vehicles.map((car, index) => {
                            const isCurrentEditing = isEditingVehicle && index === activeIndex;
                            const isActive = car.status === 'active';
                            return (
                                <View key={car.id} style={[styles.cardWrapper, { width: CARD_WIDTH }]}>
                                    <View style={styles.darkCard}>
                                            <View style={styles.cardHeader}>
                                                <View style={styles.brandBadge}>
                                                    <Car size={18} color="#D1D5DB" />
                                                    {isCurrentEditing ? (
                                                        <TouchableOpacity style={styles.inputBrandSelectTrigger} onPress={() => setBrandPickerVisible(true)}>
                                                            <Text style={styles.inputBrandSelectText} numberOfLines={1}>{tempBrand || "Seç"}</Text>
                                                            <ChevronDown size={16} color="white" />
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <Text style={styles.brandText}>{car.brand || "Marka Yok"}</Text>
                                                    )}
                                                </View>
                                                <TouchableOpacity style={styles.statusBadge} onPress={() => toggleVehicleStatus(car)} activeOpacity={0.7}>
                                                    <View style={[styles.statusDot, { backgroundColor: isActive ? COLORS.success : COLORS.passive }]} />
                                                    <Text style={[styles.statusTextBadge, { color: isActive ? COLORS.success : COLORS.passive }]}>
                                                        {isActive ? "Aktif" : "Pasif"}
                                                    </Text>
                                                    <RefreshCw size={10} color={isActive ? COLORS.success : COLORS.passive} style={{marginLeft: 4, opacity: 0.7}} />
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.plateSection}>
                                                {isCurrentEditing ? (
                                                    <View style={styles.plateInputContainer}>
                                                        <TextInput style={[styles.plateInput, styles.plateInputSmall]} value={plateParts.part1} onChangeText={(t) => setPlateParts(p=>({...p, part1:t}))} maxLength={2} keyboardType="number-pad" />
                                                        <TextInput style={[styles.plateInput, styles.plateInputMedium]} value={plateParts.part2} onChangeText={(t) => setPlateParts(p=>({...p, part2:t}))} autoCapitalize="characters" />
                                                        <TextInput style={[styles.plateInput, styles.plateInputSmall]} value={plateParts.part3} onChangeText={(t) => setPlateParts(p=>({...p, part3:t}))} maxLength={4} keyboardType="number-pad" />
                                                    </View>
                                                ) : (
                                                    <Text style={styles.plateText}>{formatPlateDisplay(car.plate)}</Text>
                                                )}
                                                <View style={styles.codeContainer}>
                                                    <Fingerprint size={14} color="#6B7280" style={{marginRight: 6}} />
                                                    <Text style={styles.codeText}>Güvenlik ID: </Text>
                                                    <Text style={styles.codeValue}>#{car.activationCode || "N/A"}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.cardFooter}>
                                                <TouchableOpacity style={styles.qrBtn} onPress={() => setQrModalVisible(true)}>
                                                    <QrCode size={18} color="#111827" />
                                                    <Text style={styles.qrBtnText}>QR Göster</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteCar}>
                                                    <Trash2 size={18} color={COLORS.textGray} />
                                                    <Text style={styles.deleteBtnText}>Sil</Text>
                                                </TouchableOpacity>
                                            </View>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                    <View style={styles.pagination}>
                        {vehicles.map((_, i) => (
                            <View key={i} style={[styles.dot, i === activeIndex ? styles.activeDot : styles.inactiveDot]} />
                        ))}
                    </View>
                </>
            ) : (
                <View style={[styles.cardWrapper, { width: CARD_WIDTH, marginHorizontal: 24 }]}>
                    <View style={[styles.darkCard, { justifyContent:'center', alignItems:'center' }]}>
                        <Text style={{color:'white'}}>Kayıtlı Araç Yok</Text>
                        <Text style={{color:'gray', fontSize: 12, marginTop: 5}}>Yeni bir kayıt oluşturun.</Text>
                    </View>
                </View>
            )}
        </View>

        {vehicles.length > 0 && (
            <View style={{alignItems: 'center'}}>
                {isEditingVehicle ? (
                <View style={styles.editActionsContainer}>
                    <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelVehicleEdit}>
                        <Text style={styles.cancelEditText}>Vazgeç</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.saveEditBtn, { backgroundColor: COLORS.primary }]} onPress={saveVehicleChanges}>
                        <Text style={styles.saveEditText}>Kaydet</Text>
                    </TouchableOpacity>
                </View>
                ) : (
                <TouchableOpacity style={styles.editBtnLeft} onPress={startEditingVehicle}>
                    <Edit size={18} color={COLORS.textGray} />
                    <Text style={styles.editText}>Görüntülenen Aracı Düzenle</Text>
                </TouchableOpacity>
                )}
            </View>
        )}

        <View style={styles.statsRow}>
            <TouchableOpacity style={[styles.statCard, styles.statCardBlue]} onPress={openMessageModal}>
                <View style={styles.statTopRow}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <MessageCircleMore size={20} color="#FFFFFF" />
                </View>
                <ArrowRight size={18} color="rgba(255,255,255,0.6)" />
                </View>
                <View>
                    <Text style={styles.statValueLight}>{unreadCount}</Text>
                    <Text style={styles.statLabelLight}>Yeni Mesaj</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.statCard, styles.statCardWhite]} onPress={() => setChartModalVisible(true)}>
                <View style={styles.statTopRow}>
                <View style={[styles.iconBox, { backgroundColor: COLORS.primaryLight }]}>
                    <Scan size={20} color={COLORS.primary} />
                </View>
                <BarChart3 size={18} color={COLORS.textGray} />
                </View>
                <View>
                    <Text style={styles.statValueDark}>{totalWeeklyScans}</Text>
                    <Text style={styles.statLabelDark}>Görüntülenme</Text>
                </View>
            </TouchableOpacity>
        </View>

        <View style={styles.messageContainer}>
            {lastMessage ? (
                <TouchableOpacity style={styles.messageCard} activeOpacity={0.7} onPress={openMessageModal}>
                    <View style={styles.messageContent}>
                        <View style={styles.messageIconBox}>
                        <MessageSquareText size={24} color={COLORS.primary} />
                        </View>
                        <View style={{flex: 1}}>
                        <View style={styles.messageHeaderRow}>
                            <Text style={styles.messageTitle}>Son Mesaj</Text>
                            <Text style={styles.messageTime}>{formatMessageDate(lastMessage.createdAt)}</Text>
                        </View>
                        <Text style={styles.messageBody} numberOfLines={2}>
                            "{lastMessage.text}"
                        </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            ) : (
                <View style={[styles.messageCard, styles.emptyMessageCard]}>
                    <MessageCircle size={20} color={COLORS.textGray} style={{marginRight: 12}} />
                    <Text style={{color: COLORS.textGray, fontSize: 13}}>Henüz mesajınız yok.</Text>
                </View>
            )}
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
                <ShieldCheck size={18} color={COLORS.primary} />
                <Text style={styles.infoTitle}>Güvenli QR Park Asistanı</Text>
            </View>
            <Text style={styles.infoText}>
              Kişisel numaranızı paylaşmadan araçlarınız için güvenli bir iletişim kanalı oluşturun.
            </Text>
          </View>
          <Text style={styles.versionText}>v1.0.4</Text>
        </View>

      </ScrollView>

      {/* QR MODAL */}
      <Modal animationType="fade" transparent={true} visible={isQrModalVisible} onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { alignItems: 'center', padding: 30 }]}>
                <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom: 20}}>
                    <Text style={styles.modalTitle}>Araç QR Kodu</Text>
                    <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.modalCloseBtn}>
                        <X size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                </View>
                
                <View style={{ padding: 20, backgroundColor: 'white', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 }}>
                    <QRCode 
                        value={qrCodeValue} 
                        size={200}
                        backgroundColor='white'
                        color='black'
                    />
                </View>

                <Text style={{ marginTop: 20, fontSize: 18, fontWeight: '800', color: COLORS.textDark, letterSpacing: 2 }}>
                    {currentCar.activationCode}
                </Text>
                <Text style={{ marginTop: 5, color: COLORS.textGray, fontSize: 13, textAlign: 'center' }}>
                    Bu kodu aracınızın camına yapıştırın. Tarayan kişi size güvenle ulaşabilsin.
                </Text>
            </View>
        </View>
      </Modal>

      {/* MESAJLAR MODAL */}
      <Modal animationType="slide" transparent={true} visible={isMessageModalVisible} onRequestClose={() => setMessageModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { height: '80%' }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Mesajlar ({currentCarMessages.length})</Text>
                    <TouchableOpacity onPress={() => setMessageModalVisible(false)} style={styles.modalCloseBtn}>
                        <X size={24} color={COLORS.textDark} />
                    </TouchableOpacity>
                </View>
                
                {currentCarMessages.length > 0 ? (
                    <FlatList
                        data={currentCarMessages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => (
                            <View style={styles.modalListItem}>
                                <View style={styles.modalListIcon}>
                                    <MessageCircle size={18} color={COLORS.primary} />
                                </View>
                                <View style={{flex: 1}}>
                                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 4}}>
                                            <Text style={styles.modalListTitle}>İsimsiz Sürücü</Text>
                                            <Text style={styles.modalListDate}>{formatMessageDate(item.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.modalListBody}>{item.text}</Text>
                                </View>
                            </View>
                        )}
                    />
                ) : (
                    <View style={styles.emptyListContainer}>
                        <MessageCircle size={48} color={COLORS.textGray} />
                        <Text style={{ marginTop: 12, color: COLORS.textGray }}>Bu araç için mesaj bulunamadı.</Text>
                    </View>
                )}
            </View>
        </View>
      </Modal>

      {/* İSTATİSTİK GRAFİĞİ MODAL */}
      <Modal animationType="slide" transparent={true} visible={isChartModalVisible} onRequestClose={() => setChartModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Haftalık İstatistik</Text>
              <TouchableOpacity onPress={() => setChartModalVisible(false)} style={styles.modalCloseBtn}>
                  <X size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
              {weeklyStats.map((stat, i) => {
                const barHeight = (stat.value / maxStatValue) * 150;
                const finalHeight = barHeight > 0 ? barHeight : 4;
                const isToday = stat.index === new Date().getDay();

                return (
                  <View key={i} style={styles.barWrapper}>
                    <Text style={{ fontSize: 11, color: stat.value > 0 ? COLORS.primary : COLORS.textGray, marginBottom: 6, fontWeight: '700' }}>
                      {stat.value}
                    </Text>
                    <View style={[
                      styles.bar, 
                      { 
                        height: finalHeight, 
                        backgroundColor: stat.value > 0 ? (isToday ? COLORS.primary : 'rgba(37, 99, 235, 0.4)') : '#E5E7EB' 
                      }
                    ]} />
                    <Text style={[
                      styles.barLabel, 
                      { color: stat.value > 0 ? COLORS.textDark : COLORS.textGray, fontWeight: stat.value > 0 ? '700' : '400' }
                    ]}>
                      {stat.day}
                    </Text>
                  </View>
                );
              })}
            </View>
            
            <View style={{marginTop: 20, padding: 15, backgroundColor: COLORS.primaryLight, borderRadius: 12}}>
              <Text style={{fontSize: 13, color: COLORS.primary, textAlign: 'center', lineHeight: 18}}>
                 Bu grafik, aracınızın QR kodunun bu haftaki günlük okutulma sayılarını gösterir. Her pazartesi sıfırlanır.
              </Text>
            </View>

        </View>
       </View>
      </Modal>

      <Modal animationType="slide" transparent={true} visible={isBrandPickerVisible}>
          <View style={styles.modalOverlay}><View style={[styles.modalContent, { height: '70%' }]}>
            <Text style={styles.modalTitle}>Araç Modeli Seç</Text>
            <FlatList data={CAR_MODELS} keyExtractor={item=>item} renderItem={({item})=>(
                <TouchableOpacity style={styles.brandOptionItem} onPress={() => handleSelectBrand(item)}>
                    <Text style={styles.brandOptionText}>{item}</Text>
                </TouchableOpacity>
            )}/></View></View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    pageContent: { paddingVertical: 20, paddingBottom: 120 }, // <-- paddingTop küçültüldü (inset ile dengelendi)
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 24 },
    headerLeft: { flex: 1 },
    greeting: { fontSize: 15, color: '#6B7280', marginBottom: 4 },
    userName: { fontSize: 32, fontWeight: '800', color: '#1F2937', marginBottom: 12 },
    statusContainer: { alignSelf: 'flex-start' },
    statusDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
    statusText: { color: '#4B5563', fontSize: 13, fontWeight: '500', marginRight: 8, maxWidth: width * 0.55 },
    editInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 12 },
    statusInput: { fontSize: 14, minWidth: 150, height: 40 },
    saveBtn: { marginLeft: 8 },
    profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
    
    carouselContainer: { marginBottom: 10 },
    carouselContent: { paddingHorizontal: 24 },
    cardWrapper: { marginRight: 12 },
    darkCard: { backgroundColor: COLORS.darkCard, borderRadius: 24, padding: 24, minHeight: 200, justifyContent: 'space-between', shadowColor: COLORS.darkCard, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandBadge: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
    brandText: { color: '#E5E7EB', fontWeight: '600', marginLeft: 6, fontSize: 14 },
    inputBrandSelectTrigger: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', padding: 8, borderRadius: 8, marginLeft: 10, flex: 1, justifyContent:'space-between' },
    inputBrandSelectText: { color: 'white', fontSize: 13 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusTextBadge: { fontWeight: '700', fontSize: 11 },
    plateSection: { marginVertical: 20, alignItems: 'flex-start' },
    plateText: { color: '#FFFFFF', fontSize: 40, fontWeight: '900', letterSpacing: 1.5, textAlign: 'left' },
    plateInputContainer: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8 },
    plateInput: { backgroundColor: COLORS.inputBg, color: '#FFFFFF', borderRadius: 12, padding: 10, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    plateInputSmall: { width: 60 },
    plateInputMedium: { width: 90 },
    codeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
    codeText: { color: COLORS.textGray, fontSize: 12 },
    codeValue: { color: '#E5E7EB', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
    cardFooter: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: 12, marginTop: 10 },
    qrBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
    qrBtnText: { color: '#111827', fontWeight: '700', marginLeft: 6, fontSize: 13 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
    deleteBtnText: { color: COLORS.textGray, fontWeight: '600', marginLeft: 6, fontSize: 13 },
    pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
    dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
    activeDot: { width: 24, backgroundColor: '#111827' },
    inactiveDot: { width: 6, backgroundColor: '#D1D5DB' },
    editBtnLeft: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 24 },
    editText: { color: '#6B7280', fontSize: 14, fontWeight: '500', marginLeft: 6 },
    editActionsContainer: { flexDirection: 'row', gap: 15, marginVertical: 20 },
    saveEditBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
    saveEditText: { color: '#fff', fontWeight: '700' },
    cancelEditBtn: { backgroundColor: COLORS.darkBtn, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
    cancelEditText: { color: '#FFFFFF', fontWeight: '700' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 20 },
    statCard: { width: '48%', padding: 18, borderRadius: 24, minHeight: 130, justifyContent: 'space-between' },
    statCardBlue: { backgroundColor: COLORS.primary },
    statCardWhite: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
    statTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
    iconBox: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statValueLight: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
    statLabelLight: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
    statValueDark: { fontSize: 32, fontWeight: '800', color: '#111827' },
    statLabelDark: { fontSize: 13, color: '#6B7280' },
    messageContainer: { paddingHorizontal: 24, marginTop: 4 },
    messageCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1, marginBottom: 4 },
    emptyMessageCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderStyle: 'dashed' },
    messageContent: { flexDirection: 'row', alignItems: 'flex-start' },
    messageIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    messageHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    messageTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    messageTime: { fontSize: 12, color: COLORS.textGray, fontWeight: '500' },
    messageBody: { fontSize: 13, color: '#4B5563', lineHeight: 18 },
    bottomSection: { paddingHorizontal: 24, marginTop: 10, alignItems: 'center' },
    infoCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: '#E5E7EB' },
    infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginLeft: 8 },
    infoText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
    versionText: { marginTop: 24, color: '#D1D5DB', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 24, fontWeight: '800' },
    modalCloseBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
    emptyListContainer: { alignItems: 'center', marginTop: 50 },
    chartContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 180 },
    barWrapper: { alignItems: 'center' },
    bar: { width: 14, borderRadius: 6 },
    barLabel: { fontSize: 12, marginTop: 8 },
    brandOptionItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    brandOptionText: { fontSize: 16 },
    
    // Klasik Mesaj Listesi Stili
    modalListItem: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    modalListIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    modalListTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
    modalListDate: { fontSize: 12, color: COLORS.textGray },
    modalListBody: { fontSize: 14, color: '#4B5563', lineHeight: 20 }
});