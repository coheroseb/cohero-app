'use client';

import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  Suspense,
  useMemo,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import OnboardingModal from '@/components/OnboardingModal';
import Footer from '@/components/Footer';
import ComingSoon from '@/components/ComingSoon';
import TeamModal from '@/components/TeamModal';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { 
  signOut, 
  User, 
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, DocumentData, serverTimestamp, updateDoc } from 'firebase/firestore';
import { sendStreakReminderEmailAction } from '@/app/actions';
import { UserProfile } from '@/ai/flows/types';
import { Home, Compass, BookOpen, User as UserIcon, MessageSquare, QrCode, Sparkles } from 'lucide-react';

type GameType = 'theorist' | 'paragraph' | 'method';

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null | undefined;
  isUserLoading: boolean;
  openAuthPage: (mode: 'login' | 'signup', priceId?: string) => void;
  handleLogout: () => void;
  refetchUserProfile: () => Promise<void>;
  openTeamModal: () => void;
  hasPlayedDailyChallenge: boolean;
  setHasPlayedDailyChallenge: React.Dispatch<React.SetStateAction<boolean>>;
  handleResendVerification: () => Promise<void>;
  cookieConsent: 'granted' | 'denied' | 'pending';
  grantCookieConsent: () => void;
  denyCookieConsent: () => void;
  dailyChallengeGameType: GameType;
  handleLogin: (email: string, pass: string) => Promise<any>;
  handleSignup: (email: string, pass: string, displayName: string) => Promise<any>;
  handleGoogleLogin: () => Promise<any>;
  isNativeApp: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const UpgradeBanner = () => {
    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-6 md:bottom-10 right-6 md:right-10 z-[120] pointer-events-auto group"
        >
            <Link 
                href="/upgrade" 
                className="flex flex-row items-center gap-3 bg-white/95 backdrop-blur-xl border border-amber-200/50 shadow-2xl p-2.5 pr-6 rounded-full hover:bg-white hover:border-amber-300 hover:scale-105 transition-all cursor-pointer ring-4 ring-black/5"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-black group-hover:text-amber-900 transition-colors">Opgrader Konto</span>
                    <span className="text-sm font-bold text-slate-800 leading-tight">Lås alt op <span className="text-amber-500">→</span></span>
                </div>
            </Link>
        </motion.div>
    );
};

const MobileTabNavigation = () => {
    const pathname = usePathname();
    const router = useRouter();
    const isGroupsApp = pathname?.startsWith('/rum/groups');

    const mainTabs = [
        { label: 'Hjem', icon: Home, path: '/portal' },
        { label: 'Værktøjer', icon: Compass, path: '/pensum' },
        { label: 'Jura', icon: BookOpen, path: '/lov-portal' },
        { label: 'Grupper', icon: MessageSquare, path: '/rum/groups' },
        { label: 'Profil', icon: UserIcon, path: '/settings' },
    ];

    const groupsTabs = [
        { label: 'Mine grupper', icon: MessageSquare, path: '/rum/groups' },
        { label: 'Scan', icon: QrCode, path: '/rum/groups/join/scan' },
        { label: 'Indstillinger', icon: UserIcon, path: '/settings' },
    ];

    const tabs = isGroupsApp ? groupsTabs : mainTabs;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 px-6 py-3 flex items-center justify-between z-[100] pb-8 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            {tabs.map((tab) => {
                const isActive = pathname === tab.path;
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.path}
                        onClick={() => router.push(tab.path)}
                        className={`flex flex-col items-center gap-1 transition-all flex-1 ${isActive ? 'text-amber-950' : 'text-slate-300'}`}
                    >
                        <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-amber-50' : ''}`}>
                            <Icon className={`w-6 h-6 ${isActive ? 'fill-amber-950/10' : ''}`} />
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const IS_PRE_LAUNCH = false;

  const { user, isUserLoading, handleLogin, handleSignup, handleGoogleLogin } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null | undefined>(undefined);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [hasPlayedDailyChallenge, setHasPlayedDailyChallenge] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isNativeApp, setIsNativeApp] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const isStandaloneGroups = useMemo(() => pathname?.startsWith('/rum/groups'), [pathname]);

  useEffect(() => {
    setMounted(true);
    // Check if running as PWA
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://'));
    setIsNativeApp(isStandalone);
  }, []);

  const dailyChallengeGameType: GameType = useMemo(() => {
    const gameTypes: GameType[] = ['theorist', 'paragraph', 'method'];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return gameTypes[dayOfYear % gameTypes.length];
  }, []);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cohero_cookie_consent');
    if (storedConsent === 'granted') {
      setCookieConsent('granted');
    } else if (storedConsent === 'denied') {
      setCookieConsent('denied');
    } else {
      setCookieConsent('pending');
    }
  }, []);

  const grantCookieConsent = () => {
    localStorage.setItem('cohero_cookie_consent', 'granted');
    setCookieConsent('granted');
  };

  const denyCookieConsent = () => {
    localStorage.setItem('cohero_cookie_consent', 'denied');
    setCookieConsent('denied');
  };

  const refetchUserProfile = useCallback(async () => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        } else {
          console.warn(`No profile document found for user ${user.uid} during refetch.`);
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

  useEffect(() => {
    if (!userProfile) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastPlayedTimestamp = userProfile.lastDailyChallengeDate?.toDate();
    
    if (lastPlayedTimestamp) {
        const lastPlayedDate = new Date(lastPlayedTimestamp);
        lastPlayedDate.setHours(0, 0, 0, 0);
        setHasPlayedDailyChallenge(today.getTime() === lastPlayedDate.getTime());
    } else {
        setHasPlayedDailyChallenge(false);
    }
  }, [userProfile]);


  useEffect(() => {
    if (isUserLoading || userProfile === undefined) {
      return;
    }
    
    if (!user) {
      // AUTO-LOGIN REDIRECT FOR PWA
      if (isNativeApp && pathname === '/') {
          router.push('/auth?mode=login');
      }
      return;
    }

    const needsOnboarding = userProfile === null || (userProfile && !userProfile.isQualified && (!userProfile.institution || !userProfile.semester));

    if (isStandaloneGroups) {
        if (needsOnboarding && !pathname?.includes('/onboarding')) {
            const redirectUrl = `/rum/groups/onboarding${pathname?.includes('/join/') ? `?callbackUrl=${encodeURIComponent(pathname)}` : ''}`;
            router.push(redirectUrl);
        }
        return;
    }

    const isPartnerUser = userProfile && userProfile.stripePriceId?.startsWith('b2b-');
    const needsVerification = isPartnerUser && !user.emailVerified;

    if (!needsOnboarding && !needsVerification) {
      if (pathname === '/') {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl = urlParams.get('callbackUrl');
          if (callbackUrl) {
            router.push(callbackUrl);
          } else {
            router.push('/portal');
          }
        }
      }
    }
  }, [user, isUserLoading, userProfile, pathname, router, isStandaloneGroups, isNativeApp]);

  const showOnboardingModal = useMemo(() => {
    if (isUserLoading || userProfile === undefined || !user || isStandaloneGroups || pathname === '/') {
        return false;
    }
    return userProfile === null || (!userProfile.isQualified && (!userProfile.institution || !userProfile.semester));
  }, [isUserLoading, userProfile, user, isStandaloneGroups, pathname]);

  const openAuthPage = (mode: 'login' | 'signup' = 'signup', priceId?: string) => {
    const authUrl = isStandaloneGroups ? `/rum/groups/auth` : `/auth`;
    const callbackPart = pathname?.includes('/join/') ? `&callbackUrl=${encodeURIComponent(pathname)}` : '';
    router.push(`${authUrl}?mode=${mode}${priceId ? `&priceId=${priceId}` : ''}${callbackPart}`);
  };
  
  const openTeamModal = () => {
    if (user) {
      setIsTeamModalOpen(true);
    } else {
      openAuthPage('login');
    }
  };

  const handleLogout = () => {
    if (auth) signOut(auth);
    if (isStandaloneGroups) {
      router.push('/rum/groups');
    } else {
      router.push('/');
    }
  };
  
  const handleResendVerification = async () => {
    if (user && auth) {
      await sendEmailVerification(user);
    }
  };

  useEffect(() => {
    const reloadUserOnFocus = async () => {
      if (auth && auth.currentUser && !auth.currentUser.emailVerified) {
        await auth.currentUser.reload();
      }
    };

    window.addEventListener('focus', reloadUserOnFocus);

    return () => {
      window.removeEventListener('focus', reloadUserOnFocus);
    };
  }, [auth]);

  const showUpgradeBanner = !isStandaloneGroups && userProfile?.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership);

  const contextValue = useMemo((): AppContextType => ({
    user,
    userProfile,
    isUserLoading,
    openAuthPage,
    handleLogout,
    refetchUserProfile,
    openTeamModal,
    hasPlayedDailyChallenge,
    setHasPlayedDailyChallenge,
    handleResendVerification,
    cookieConsent,
    grantCookieConsent,
    denyCookieConsent,
    dailyChallengeGameType,
    handleLogin,
    handleSignup,
    handleGoogleLogin,
    isNativeApp,
  }), [user, userProfile, isUserLoading, hasPlayedDailyChallenge, cookieConsent, dailyChallengeGameType, refetchUserProfile, handleLogout, openAuthPage, openTeamModal, handleResendVerification, handleLogin, handleSignup, handleGoogleLogin, isNativeApp]);


  const pageBackground = useMemo(() => {
    if (pathname?.includes('/lov-portal')) return 'bg-[#F9F7F2]';
    if (pathname?.includes('/grupper') || pathname?.includes('/rum/groups')) return 'bg-[#F8FAFC]';
    if (pathname?.includes('/memento') || pathname?.includes('/case-trainer')) return 'bg-[#FFFBF5]';
    return 'bg-white';
  }, [pathname]);

  if (IS_PRE_LAUNCH) {
    return <ComingSoon />;
  }

  return (
    <AppContext.Provider
      value={contextValue}
    >
      <div className={`min-h-screen flex flex-col selection:bg-amber-200 transition-colors duration-1000 ${pageBackground} ${isNativeApp ? 'native-app' : ''}`}>
        {mounted && !isNativeApp && !isStandaloneGroups && (
          <>
            {showUpgradeBanner && <UpgradeBanner />}
            <Navbar onAuth={() => openAuthPage()} user={user} userProfile={userProfile} onLogout={handleLogout} />
          </>
        )}
        <main className={`flex-grow relative ${isNativeApp ? 'pb-24 pt-4' : isStandaloneGroups ? 'pt-0' : 'pt-24 md:pt-32'}`}>
            {/* Soft top gradient to blend with navbar when scrolling */}
            {!isNativeApp && !isStandaloneGroups && (
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-inherit to-transparent pointer-events-none z-10`} />
            )}
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
                {children}
            </motion.div>
        </main>
        {mounted && !isNativeApp && !isStandaloneGroups && <Footer />}
        
        {mounted && isNativeApp && user && <MobileTabNavigation />}

        <Suspense fallback={null}>
            {/* AuthModal has been removed */}
        </Suspense>
        {!isStandaloneGroups && showOnboardingModal && <OnboardingModal onComplete={refetchUserProfile} />}
        {isTeamModalOpen && <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />}
      </div>
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
