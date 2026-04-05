import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- KRİTİK DÜZELTME ---
// TypeScript'in bu fonksiyonu bulamama hatasını susturuyoruz.
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBvUzZNb-FKUeQHDYnBcUEJd1T-Oa8Eprc",
  authDomain: "camda-qr.firebaseapp.com",
  projectId: "camda-qr",
  storageBucket: "camda-qr.firebasestorage.app",
  messagingSenderId: "351896923765",
  appId: "1:351896923765:web:7fbe525e96a288df66d23c",
  measurementId: "G-4M32C02WKZ"
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// --- AUTH BAŞLATMA ---
let auth: any;

try {
  // Persistence ile başlatmayı dene
  auth = initializeAuth(app, {
    // Burada da AsyncStorage tip hatasını susturuyoruz
    persistence: getReactNativePersistence(AsyncStorage as any)
  });
} catch (e) {
  // Hata olursa veya zaten başlatılmışsa normal al
  auth = getAuth(app);
}

// Database başlat
export const db = getFirestore(app);
export { auth };
