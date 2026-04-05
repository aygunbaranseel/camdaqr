import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// --- TİP TANIMLAMALARI ---
interface RegisterData {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  bloodType: string;
  plate: string;
  brand: string;
  color: string;
  customNote: string;
  permissions: {
    notifications: boolean;
    sms: boolean;
    calls: boolean;
  };
  // DEĞİŞİKLİK: Gizlilik ayarlarının tip tanımlamasını ekledik
  preferences?: {
    notifications: boolean;
    sms: boolean;
    calls: boolean;
    showName: boolean;
    showBloodType: boolean;
    showFullPlate: boolean;
    showCarModel: boolean;
  };
}

const formatTRPhone = (rawPhone: string) => {
  if (!rawPhone) return "";
  const cleaned = rawPhone.replace(/\D/g, ''); 
  const mainNum = cleaned.slice(-10);
  return `+90 ${mainNum.slice(0, 3)} ${mainNum.slice(3, 6)} ${mainNum.slice(6, 8)} ${mainNum.slice(8, 10)}`;
};

// --- NUMARA KONTROLÜ ---
export const checkPhoneNumberExists = async (rawPhone: string) => {
  try {
    const formattedPhone = formatTRPhone(rawPhone);
    const q = query(collection(db, "users"), where("phoneNumber", "==", formattedPhone));
    const snapshot = await getDocs(q);
    return !snapshot.empty; 
  } catch (error) {
    console.error("Numara kontrol hatası:", error);
    return false;
  }
};

// --- KOD KONTROLÜ ---
export const checkActivationCode = async (code: string) => {
  try {
    const formattedCode = code.trim().toUpperCase();
    const codeRef = doc(db, "activation_codes", formattedCode);
    const codeSnap = await getDoc(codeRef);

    if (!codeSnap.exists()) return { success: false, message: "Geçersiz aktivasyon kodu." };
    if (codeSnap.data().isActive) return { success: false, message: "Bu kod daha önce kullanılmış." };

    return { success: true, message: "Kod geçerli." };
  } catch (error) {
    console.error("Kod kontrol hatası:", error);
    return { success: false, message: "Bağlantı hatası oluştu." };
  }
};

// ---------------------------------------------------------
// KAYIT VE ARAÇ EKLEME FONKSİYONU
// ---------------------------------------------------------
export const completeRegistration = async (
    activationCode: string, 
    data: RegisterData, 
    isProfileUpdate: boolean 
) => {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, message: "Kullanıcı girişi yapılmamış." };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const formattedCode = activationCode.trim().toUpperCase();

      // 1. REFERANSLAR
      const codeRef = doc(db, "activation_codes", formattedCode);
      const userRef = doc(db, "users", user.uid);
      
      const newVehicleRef = doc(collection(db, "vehicles")); 
      const vehicleId = newVehicleRef.id; 

      const userVehicleRef = doc(db, "users", user.uid, "vehicles", vehicleId);

      // 2. KOD KONTROLÜ
      const codeDoc = await transaction.get(codeRef);
      if (!codeDoc.exists() || codeDoc.data().isActive) {
        throw "Kod geçersiz veya kullanılmış!"; 
      }

      const formattedPhone = formatTRPhone(data.phoneNumber || user.phoneNumber || "");

      // DEĞİŞİKLİK: Artık sabit (hardcoded) ayarlar değil, kullanıcının seçtiği ayarlar veritabanına yazılıyor!
      const finalPreferences = data.preferences ? data.preferences : {
        notifications: data.permissions.notifications,
        sms: data.permissions.sms,
        calls: data.permissions.calls,
        showCarModel: true,
        showName: true,
        showBloodType: true,
        showFullPlate: true
      };

      // 3. KULLANICI PROFİL İŞLEMİ
      if (isProfileUpdate) {
        const userPayload: any = {
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: formattedPhone,
            bloodType: data.bloodType,
            updatedAt: serverTimestamp(),
            preferences: finalPreferences
        };

        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) {
            userPayload.createdAt = serverTimestamp();
        }

        transaction.set(userRef, userPayload, { merge: true });
      }
      
      // 4. ARAÇ VERİSİ
      const vehicleData = {
        id: vehicleId,
        plate: data.plate.toUpperCase(),
        brand: data.brand,
        color: data.color,
        customNote: data.customNote,
        activationCode: formattedCode,
        ownerId: user.uid, 
        ownerPhone: formattedPhone,
        status: "active",
        createdAt: serverTimestamp(),
        scanCount: 0,
        notifications: 0,
        permissions: finalPreferences // Araç özelindeki izinleri de kullanıcının ana tercihleriyle eşitliyoruz
      };

      // 5. DUAL WRITE
      transaction.set(newVehicleRef, vehicleData);
      transaction.set(userVehicleRef, vehicleData);

      // 6. KODU GÜNCELLE
      transaction.update(codeRef, {
        isActive: true,
        usedBy: user.uid,
        linkedVehicleId: vehicleId,
        usedAt: serverTimestamp()
      });
    });

    return { success: true, message: "İşlem başarıyla tamamlandı!" };

  } catch (error: any) {
    console.error("Kayıt hatası:", error);
    const msg = typeof error === 'string' ? error : (error.message || "Bilinmeyen hata");
    return { success: false, message: msg };
  }
};

// ---------------------------------------------------------
// DÜZELTİLMİŞ ARAÇ SİLME FONKSİYONU
// (Read-before-Write Kuralına Uygun)
// ---------------------------------------------------------
export const deleteVehicle = async (vehicleId: string) => {
  const user = auth.currentUser;

  if (!user) {
    return { success: false, message: "Kullanıcı girişi yapılmamış." };
  }

  try {
    await runTransaction(db, async (transaction) => {
      // 1. REFERANSLAR
      const userVehicleRef = doc(db, "users", user.uid, "vehicles", vehicleId);
      const globalVehicleRef = doc(db, "vehicles", vehicleId);

      // --- [AŞAMA 1: TÜM OKUMA İŞLEMLERİ] ---
      
      // A) Araç verisini oku (Aktivasyon kodunu bulmak için)
      const userVehicleSnap = await transaction.get(userVehicleRef);
      
      if (!userVehicleSnap.exists()) {
        throw "Araç bulunamadı veya zaten silinmiş.";
      }

      const vehicleData = userVehicleSnap.data();
      const activationCode = vehicleData.activationCode;

      // B) Eğer aktivasyon kodu varsa, ONUN REFERANSINI DA ŞİMDİ OKU
      let codeRef = null;
      let codeSnap = null;

      if (activationCode) {
        codeRef = doc(db, "activation_codes", activationCode);
        codeSnap = await transaction.get(codeRef);
      }

      // --- [AŞAMA 2: TÜM YAZMA/SİLME İŞLEMLERİ] ---

      // A) Araçları sil (Her iki koleksiyondan)
      transaction.delete(userVehicleRef);
      transaction.delete(globalVehicleRef);

      // B) Aktivasyon kodunu güncelle (Eğer varsa)
      if (codeRef && codeSnap && codeSnap.exists()) {
        transaction.set(codeRef, {
            vehicleStatus: 'deleted',     // Silindi işareti
            deletedAt: serverTimestamp(), // Ne zaman silindi
            linkedVehicleId: null,        // Bağ kopar
            // isActive: true kalmaya devam eder
        }, { merge: true });
      }
    });

    return { success: true, message: "Araç başarıyla silindi." };

  } catch (error: any) {
    console.error("Silme hatası:", error);
    const errorMessage = typeof error === 'string' ? error : (error.message || "Silme işlemi başarısız.");
    return { success: false, message: errorMessage };
  }
};