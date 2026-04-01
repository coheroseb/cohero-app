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
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { ErrorLogger } from '@/components/ErrorLogger';
import { 
  signOut, 
  User, 
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, DocumentData, serverTimestamp, updateDoc } from 'firebase/firestore';
import { sendStreakReminderEmailAction } from '@/app/actions';
import { UserProfile } from '@/ai/flows/types';
import { calculateStudyStarted } from '@/lib/education';
import { Home, Compass, BookOpen, User as UserIcon, MessageSquare, QrCode, Sparkles, Presentation, Scale, Shield, CalendarDays } from 'lucide-react';

type GameType = 'theorist' | 'paragraph' | 'method';

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null | undefined;
  isUserLoading: boolean;
  openAuthPage: (mode: 'signin' | 'signup', priceId?: string) => void;
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
  isNavbarHidden: boolean;
  setIsNavbarHidden: (hidden: boolean) => void;
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

const MobileTabNavigation = ({ userProfile }: { userProfile: any }) => {
    const pathname = usePathname();
    const router = useRouter();
    const isGroupsApp = pathname?.startsWith('/rum/groups');

    const mainTabs = [
        { label: 'Hjem', icon: Home, path: '/portal' },
        { label: 'Semester', icon: CalendarDays, path: '/mit-semester' },
        { label: 'Jura', icon: Scale, path: '/lov-portal' },
        { label: 'Grupper', icon: MessageSquare, path: '/rum/groups' },
    ];

    if (userProfile?.role === 'admin') {
        mainTabs.push({ label: 'Admin', icon: Shield, path: '/admin' });
    }

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
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const isUpdatingProfile = React.useRef(false);
  const isStandaloneGroups = useMemo(() => pathname?.startsWith('/rum/groups'), [pathname]);
  const isRaadgivning = useMemo(() => pathname?.startsWith('/raadgivning'), [pathname]);
  const isLovPortalView = useMemo(() => pathname?.startsWith('/lov-portal/view'), [pathname]);

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

  useEffect(() => {
    if (isUserLoading) {
      setUserProfile(undefined);
      return;
    }
    if (!user || !firestore) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    }, (error) => {
      console.error('Error listening to user profile:', error);
      setUserProfile(null);
    });

    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

  const refetchUserProfile = useCallback(async () => {
    // Keep this as a no-op or simple trigger for backward compatibility if needed,
    // though onSnapshot handles most cases now.
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastPlayedTimestamp = userProfile.lastCompletedChallengeDate?.toDate ? userProfile.lastCompletedChallengeDate.toDate() : (userProfile.lastCompletedChallengeDate ? new Date(userProfile.lastCompletedChallengeDate) : null);
    
    if (lastPlayedTimestamp) {
        const lastPlayedDate = new Date(lastPlayedTimestamp);
        lastPlayedDate.setHours(0, 0, 0, 0);
        setHasPlayedDailyChallenge(today.getTime() === lastPlayedDate.getTime());
    } else {
        setHasPlayedDailyChallenge(false);
    }
  }, [userProfile]);

  // Consolidate maintenance tasks: Streak and Missing Start Date
  useEffect(() => {
    if (!user || userProfile === undefined || userProfile === null || !firestore || isUpdatingProfile.current) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const runMaintenance = async () => {
        const updateObj: any = {};
        
        // 1. Streak check
        const lastStreakUpdate = userProfile.lastDailyChallengeDate?.toDate 
            ? userProfile.lastDailyChallengeDate.toDate() 
            : (userProfile.lastDailyChallengeDate ? new Date(userProfile.lastDailyChallengeDate) : null);
        
        if (lastStreakUpdate) {
            lastStreakUpdate.setHours(0, 0, 0, 0);
        }

        if (!lastStreakUpdate || lastStreakUpdate.getTime() !== today.getTime()) {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            let newStreak = 1;
            if (lastStreakUpdate && lastStreakUpdate.getTime() === yesterday.getTime()) {
                newStreak = (userProfile.dailyChallengeStreak || 0) + 1;
            }

            const currentHighest = userProfile.highestStreak || 0;
            const finalHighest = Math.max(currentHighest, newStreak);

            updateObj.dailyChallengeStreak = newStreak;
            updateObj.lastDailyChallengeDate = serverTimestamp();
            updateObj.lastLogin = serverTimestamp();
            if (finalHighest > currentHighest) {
                updateObj.highestStreak = finalHighest;
            }
        }

        // 2. Missing Start Date check
        if (!userProfile.isQualified && userProfile.semester && !userProfile.studyStarted) {
            updateObj.studyStarted = calculateStudyStarted(userProfile.semester);
        }

        // If anything needs updating, do it in one go
        if (Object.keys(updateObj).length > 0) {
            isUpdatingProfile.current = true;
            try {
                console.log(`[AppProvider] Consolidating profile maintenance for ${user.uid}:`, Object.keys(updateObj));
                await updateDoc(doc(firestore, 'users', user.uid), updateObj);
            } catch (err) {
                console.error("Failed to update profile maintenance:", err);
            } finally {
                // Keep it locked for a bit to let the snapshot settle
                setTimeout(() => {
                    isUpdatingProfile.current = false;
                }, 2000);
            }
        }
    };

    runMaintenance();
  }, [user, userProfile, firestore]);


  useEffect(() => {
    if (isUserLoading || userProfile === undefined) {
      return;
    }
    
    if (!user) {
      // AUTO-LOGIN REDIRECT FOR PWA
      if (isNativeApp && pathname === '/') {
          router.push('/auth?mode=signin');
      }
      return;
    }

    const needsOnboarding = userProfile === null || (userProfile && !userProfile.isQualified && (!userProfile.institution || !userProfile.semester || !userProfile.studyStarted));

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
        // We've removed the auto-redirect to portal from landing page
        // Users can now explore the homepage and use the navbar to enter the portal
    }
  }, [user, isUserLoading, userProfile, pathname, router, isStandaloneGroups, isNativeApp]);

  const showOnboardingModal = useMemo(() => {
    if (isUserLoading || userProfile === undefined || !user || isStandaloneGroups || pathname === '/') {
        return false;
    }
    return userProfile === null || (!userProfile.isQualified && (!userProfile.institution || !userProfile.semester || !userProfile.studyStarted));
  }, [isUserLoading, userProfile, user, isStandaloneGroups, pathname]);

  const showFeatureIntroRedirect = useMemo(() => {
    if (isUserLoading || userProfile === undefined || !user || isStandaloneGroups || pathname === '/' || pathname?.startsWith('/velkommen')) {
        return false;
    }
    // Only redirect if onboarding is complete but intro hasn't been seen
    const onboardingComplete = userProfile && (userProfile.isQualified || (userProfile.institution && userProfile.semester && userProfile.studyStarted));
    return onboardingComplete && !userProfile.hasSeenFeatureIntro && !showOnboardingModal;
  }, [isUserLoading, userProfile, user, isStandaloneGroups, pathname, showOnboardingModal]);

  useEffect(() => {
    if (showFeatureIntroRedirect) {
        router.push(`/velkommen?callbackUrl=${encodeURIComponent(pathname || '/portal')}`);
    }
  }, [showFeatureIntroRedirect, router, pathname]);

  const openAuthPage = (mode: 'signin' | 'signup' = 'signup', priceId?: string) => {
    const authUrl = isStandaloneGroups ? `/rum/groups/auth` : `/auth`;
    const callbackPart = pathname?.includes('/join/') ? `&callbackUrl=${encodeURIComponent(pathname)}` : '';
    router.push(`${authUrl}?mode=${mode}${priceId ? `&priceId=${priceId}` : ''}${callbackPart}`);
  };
  
  const openTeamModal = () => {
    if (user) {
      setIsTeamModalOpen(true);
    } else {
      openAuthPage('signin');
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
    isNavbarHidden,
    setIsNavbarHidden
  }), [user, userProfile, isUserLoading, hasPlayedDailyChallenge, cookieConsent, dailyChallengeGameType, refetchUserProfile, handleLogout, openAuthPage, openTeamModal, handleResendVerification, handleLogin, handleSignup, handleGoogleLogin, isNativeApp, isNavbarHidden, setIsNavbarHidden]);


  const pageBackground = useMemo(() => {
    if (pathname?.includes('/lov-portal')) return 'bg-[#F9F7F2]';
    if (pathname?.includes('/rum/groups')) return 'bg-[#F8FAFC]';
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
        {mounted && !isNativeApp && !isStandaloneGroups && !isRaadgivning && !isNavbarHidden && (
          <>
            {showUpgradeBanner && <UpgradeBanner />}
            <Navbar onAuth={(mode) => openAuthPage(mode)} user={user} userProfile={userProfile} onLogout={handleLogout} />
          </>
        )}
        <main className={`flex-grow relative ${isNativeApp ? 'pb-24 pt-4' : (isStandaloneGroups || isRaadgivning) ? 'pt-0' : pathname === '/' ? 'pt-0' : 'pt-24 md:pt-32'} ${isLovPortalView ? 'lg:h-screen lg:overflow-hidden' : ''}`}>
            {/* Soft top gradient to blend with navbar when scrolling */}
            {!isNativeApp && !isStandaloneGroups && !isRaadgivning && (
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-inherit to-transparent pointer-events-none z-10`} />
            )}
            
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
                {children}
            </motion.div>
        </main>
        {mounted && !isNativeApp && !isStandaloneGroups && !isRaadgivning && !isLovPortalView && <Footer />}
        
        {mounted && isNativeApp && user && <MobileTabNavigation userProfile={userProfile} />}

        <Suspense fallback={null}>
            {/* AuthModal has been removed */}
        </Suspense>
        {!isStandaloneGroups && showOnboardingModal && <OnboardingModal onComplete={refetchUserProfile} />}
        {isTeamModalOpen && <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />}
        <ErrorLogger user={user} userProfile={userProfile} />
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
