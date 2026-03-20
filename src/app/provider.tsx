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
import { Home, Compass, BookOpen, User as UserIcon, MessageSquare, QrCode } from 'lucide-react';

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
        <div className="bg-amber-900 text-white text-center text-sm font-bold p-3">
            <Link href="/upgrade" className="hover:underline">
                Du er gratis Kollega medlem. Opgrader for ubegrænset adgang.
            </Link>
        </div>
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [hasPlayedDailyChallenge, setHasPlayedDailyChallenge] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isNativeApp, setIsNativeApp] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const isStandaloneGroups = useMemo(() => pathname?.startsWith('/rum/groups'), [pathname]);

  useEffect(() => {
    // Check if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://');
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
      setShowOnboarding(false);
      
      // AUTO-LOGIN REDIRECT FOR PWA
      if (isNativeApp && pathname === '/') {
          router.push('/auth?mode=login');
      }
      return;
    }

    const needsOnboarding = userProfile === null || (!userProfile.isQualified && (!userProfile.institution || !userProfile.semester));

    if (isStandaloneGroups) {
        setShowOnboarding(false); // We handle onboarding via page in groups
        if (needsOnboarding && !pathname?.includes('/onboarding')) {
            const redirectUrl = `/rum/groups/onboarding${pathname?.includes('/join/') ? `?callbackUrl=${encodeURIComponent(pathname)}` : ''}`;
            router.push(redirectUrl);
        }
        return;
    }

    if (pathname === '/' && needsOnboarding) {
        setShowOnboarding(false);
    } else {
        setShowOnboarding(needsOnboarding);
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

  if (IS_PRE_LAUNCH) {
    return <ComingSoon />;
  }

  const showUpgradeBanner = !isStandaloneGroups && userProfile && userProfile.membership === 'Kollega';

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


  return (
    <AppContext.Provider
      value={contextValue}
    >
      <div className={`min-h-screen flex flex-col selection:bg-amber-200 ${isNativeApp ? 'native-app' : ''}`}>
        {!isNativeApp && !isStandaloneGroups && (
          <div className="sticky top-0 z-50">
            {showUpgradeBanner && <UpgradeBanner />}
            <Navbar onAuth={() => openAuthPage()} user={user} userProfile={userProfile} onLogout={handleLogout} />
          </div>
        )}
        <main className={`flex-grow ${isNativeApp ? 'pb-24 pt-4' : ''}`}>
            {children}
        </main>
        {!isNativeApp && !isStandaloneGroups && <Footer />}
        
        {isNativeApp && user && <MobileTabNavigation />}

        <Suspense fallback={null}>
            {/* AuthModal has been removed */}
        </Suspense>
        {!isStandaloneGroups && showOnboarding && <OnboardingModal onComplete={refetchUserProfile} />}
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
