import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/firebaseConfig';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isDbChecked: boolean;
  registrationCompleted: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDbChecked: false,
  registrationCompleted: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDbChecked, setIsDbChecked] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const ref = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(ref);
          setRegistrationCompleted(snap.exists() && snap.data().registrationCompleted === true);
        } catch (e) {
          console.error('DB Check error:', e);
          setRegistrationCompleted(false);
        }
      } else {
        setRegistrationCompleted(false);
      }
      
      // Tüm işlemler bittiğinde loading'i ve DB kontrolünü kapat
      setIsDbChecked(true);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDbChecked, registrationCompleted }}>
      {children}
    </AuthContext.Provider>
  );
};