'use client';

import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { 
  signOut, 
  User, 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null | undefined;
  isUserLoading: boolean;
  openAuthPage: (mode: 'login' | 'signup') => void;
  handleLogout: () => void;
  refetchUserProfile: () => Promise<void>;
  handleLogin: (email: string, pass: string) => Promise<any>;
  handleSignup: (email: string, pass: string, displayName: string) => Promise<any>;
  handleGoogleLogin: () => Promise<any>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isUserLoading, handleLogin, handleSignup, handleGoogleLogin } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null | undefined>(undefined);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const refetchUserProfile = useCallback(async () => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error refetching user profile:', error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  }, [user, firestore]);

  useEffect(() => {
    if (isUserLoading) {
      setUserProfile(undefined);
      return;
    }
    if (!user) {
      setUserProfile(null);
      return;
    }
    if (userProfile === null) setUserProfile(undefined);
    refetchUserProfile();
  }, [user, isUserLoading, refetchUserProfile]);

  const openAuthPage = (mode: 'login' | 'signup' = 'signup') => {
    router.push(`/auth?mode=${mode}`);
  };
  
  const handleLogout = () => {
    if (auth) signOut(auth);
    router.push('/auth?mode=login');
  };

  const contextValue = useMemo((): AppContextType => ({
    user,
    userProfile,
    isUserLoading,
    openAuthPage,
    handleLogout,
    refetchUserProfile,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
  }), [user, userProfile, isUserLoading, refetchUserProfile, handleLogout, handleLogin, handleSignup, handleGoogleLogin]);

  return (
    <AppContext.Provider value={contextValue}>
        {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
