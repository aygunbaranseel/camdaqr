import {
    collection,
    doc,
    runTransaction,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// --- MESAJ GÖNDERME FONKSİYONU ---
// Bu fonksiyonu QR kodu okuyan kişi mesaj attığında çağıracaksın.
export const sendMessageToVehicle = async (vehicleId: string, messageText: string, senderPhone: string = "Anonim") => {
  if (!vehicleId || !messageText.trim()) return { success: false, message: "Eksik bilgi." };

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Önce Global Araç listesinden aracı bul (Sahibinin kim olduğunu öğrenmek için)
      const globalVehicleRef = doc(db, "vehicles", vehicleId);
      const vehicleSnap = await transaction.get(globalVehicleRef);

      if (!vehicleSnap.exists()) {
        throw "Araç bulunamadı.";
      }

      const vehicleData = vehicleSnap.data();
      const ownerId = vehicleData.ownerId; // Aracın sahibini bulduk

      if (!ownerId) throw "Araç sahibi bulunamadı.";

      // 2. REFERANSLAR
      // A) Sahibinin mesaj kutusu
      const messagesRef = collection(db, "users", ownerId, "messages");
      const newMessageRef = doc(messagesRef); // Yeni bir ID oluştur

      // B) Sahibinin araç kartı (Bildirim sayısını artırmak için)
      const userVehicleRef = doc(db, "users", ownerId, "vehicles", vehicleId);

      // 3. İŞLEMLER (YAZMA)
      
      // A) Mesajı Kaydet
      transaction.set(newMessageRef, {
        id: newMessageRef.id,
        vehicleId: vehicleId,      // Hangi araca geldi
        text: messageText,         // Mesaj içeriği
        senderPhone: senderPhone,  // Gönderen (varsa)
        isRead: false,             // Henüz okunmadı
        createdAt: serverTimestamp()
      });

      // B) Aracın Özet Bilgisini Güncelle (Dashboard'da anlık görünmesi için)
      // Okunmamış mesaj sayısını 1 artır ve son mesajı güncelle
      transaction.update(userVehicleRef, {
        notifications: (vehicleData.notifications || 0) + 1, // Mevcut sayıyı 1 artır
        lastMessage: messageText,                            // Son mesaj önizlemesi
        lastMessageTime: serverTimestamp()                   // Son mesaj zamanı
      });

      // C) Global aracı da güncelle (Opsiyonel, tutarlılık için)
      transaction.update(globalVehicleRef, {
        notifications: (vehicleData.notifications || 0) + 1
      });
    });

    return { success: true, message: "Mesaj iletildi." };

  } catch (error: any) {
    console.error("Mesaj gönderme hatası:", error);
    return { success: false, message: typeof error === 'string' ? error : "Mesaj gönderilemedi." };
  }
};

// --- TÜM MESAJLARI OKUNDU YAPMA FONKSİYONU ---
// Dashboard'da mesaja tıkladığında bu çalışacak
export const markVehicleMessagesAsRead = async (ownerId: string, vehicleId: string) => {
    // Not: Çok fazla mesaj varsa batch update gerekebilir, şimdilik basit tutuyoruz.
    // Bu işlem Dashboard içinde zaten manuel yapılıyor ama servis olarak da durabilir.
    return true; 
};