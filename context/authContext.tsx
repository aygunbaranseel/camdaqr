// context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
// YENİ: Web motoru yerine Native motoru içe aktarıyoruz
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

interface AuthProps {
  user: FirebaseAuthTypes.User | null; // Tip tanımlamasını Native motora göre güncelledik
  loading: boolean;
}

const AuthContext = createContext<AuthProps>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // YENİ: Firebase Native'in dinleyicisi: Oturum açıldı mı, kapandı mı?
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (loading) {
        setLoading(false); // Kontrol bitti, loading'i kapat
      }
    });

    return unsubscribe;
  }, [loading]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};