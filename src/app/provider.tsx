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
import { Capacitor } from '@capacitor/core';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import OnboardingModal from '@/components/OnboardingModal';
import Footer from '@/components/Footer';
import ComingSoon from '@/components/ComingSoon';
import TeamModal from '@/components/TeamModal';
import CookieConsent from '@/components/CookieConsent';
import { ThemeDecorations } from '@/components/ThemeDecorations';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import TermsConsentModal from '@/components/TermsConsentModal';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { ErrorLogger } from '@/components/ErrorLogger';
import { 
  signOut, 
  User, 
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, DocumentData, serverTimestamp, updateDoc, collection, query, where } from 'firebase/firestore';
import { 
  Home, 
  CalendarDays, 
  Scale, 
  MessageSquare, 
  Plus, 
  Bell, 
  HandHelping, 
  GraduationCap, 
  CreditCard, 
  Sparkles, 
  Megaphone, 
  Zap, 
  Tag, 
  X, 
  ArrowRight, 
  Gift, 
  Bird, 
  Ghost,
  Compass,
  BookOpen,
  User as UserIcon,
  QrCode,
  Presentation,
  Shield,
  CheckCircle2,
  Snowflake,
  Flower2,
  Egg,
  Skull,
  AlertTriangle
} from 'lucide-react';
import { sendStreakReminderEmailAction } from '@/app/actions';
import { UserProfile } from '@/ai/flows/types';
import { calculateStudyStarted } from '@/lib/education';

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
  usageLimits: any;
  activeTheme: string;
  effectiveTheme: string;
  campaigns: any[];
  isMaintenanceMode: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const UpgradeBanner = () => {
    return (
        <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 20 }}
            className="fixed bottom-28 md:bottom-10 right-6 md:right-10 z-[120] pointer-events-auto group"
        >
            <Link 
                href="/upgrade" 
                className="flex flex-row items-center gap-3 bg-white/95 backdrop-blur-xl border border-amber-200/50 shadow-2xl p-2 md:p-2.5 pr-5 md:pr-6 rounded-full hover:bg-white hover:border-amber-300 hover:scale-105 transition-all cursor-pointer ring-4 ring-black/5"
            >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-inner">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="flex flex-col text-left">
                    <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-400 font-black group-hover:text-amber-900 transition-colors">Opgrader Konto</span>
                    <span className="text-xs md:text-sm font-bold text-slate-800 leading-tight">Lås alt op <span className="text-amber-500">→</span></span>
                </div>
            </Link>
        </motion.div>
    );
};

const PaymentFailedBanner = ({ onDismiss }: { onDismiss?: () => void }) => {
    return (
        <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-rose-600 text-white shadow-xl relative z-[10001] overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="font-black text-xs md:text-sm uppercase tracking-widest leading-tight">Betaling Fejlede</p>
                        <p className="text-[11px] md:text-xs font-medium text-white/80">Vi kunne ikke gennemføre din seneste betaling for Kollega+. Opdater dine oplysninger for at beholde adgangen.</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Link 
                        href="/settings" 
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                    >
                        Opdater kort <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    {onDismiss && (
                        <button 
                            onClick={onDismiss}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
            
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
                />
            </div>
        </motion.div>
    );
};

const CampaignBanner = ({ campaign, onDismiss }: { campaign: any, onDismiss: () => void }) => {
    const themeStyles = {
        christmas: 'bg-rose-600 text-white',
        easter: 'bg-emerald-800 text-white shadow-[0_0_20px_rgba(4,120,87,0.4)]',
        halloween: 'bg-orange-600 text-white',
        default: 'bg-slate-900 text-white'
    }[campaign.theme as keyof typeof themeStyles || 'default'];

    return (
        <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-[10000] p-4 md:p-3 transition-all duration-500 ${themeStyles} shadow-lg backdrop-blur-md bg-opacity-95 md:bg-opacity-90 overflow-hidden will-change-transform`}
            style={{ transform: 'translateZ(0)', WebkitBackdropFilter: 'blur(12px)' }}
        >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 px-4 relative">
                {/* Visual Accent */}
                <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl md:block hidden" />
                
                <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                    <div className="flex w-8 h-8 rounded-full bg-white/20 items-center justify-center shrink-0">
                        {campaign.theme === 'christmas' ? <Gift className="w-4 h-4" /> :
                         campaign.theme === 'easter' ? <Bird className="w-4 h-4" /> :
                         campaign.theme === 'halloween' ? <Ghost className="w-4 h-4" /> :
                         <Megaphone className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <p className="text-[12px] md:text-[13px] font-black uppercase tracking-widest text-current leading-tight">
                            {campaign.bannerText} 
                        </p>
                        {campaign.discountCode && (
                            <span className="inline-flex px-3 py-1 bg-white/20 rounded-lg border border-white/30 font-black text-[10px] md:text-xs whitespace-nowrap shadow-inner">
                               KODE: {campaign.discountCode}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto justify-center">
                    <Link 
                        href="/upgrade" 
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-4 py-2 md:py-1.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl shadow-black/10 active:scale-95"
                    >
                        Spar nu <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                <button 
                    onClick={onDismiss} 
                    className="absolute -top-1 -right-2 md:static md:ml-4 p-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
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
  const [usageLimits, setUsageLimits] = useState<any>(null);
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [latestTermsVersion, setLatestTermsVersion] = useState<string | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isUpdatingProfile = React.useRef(false);
  const maintenanceThrottleRef = React.useRef(0);
  const isStandaloneGroups = useMemo(() => pathname?.startsWith('/rum/groups'), [pathname]);
  const isRaadgivning = useMemo(() => pathname?.startsWith('/raadgivning'), [pathname]);
  const isLovPortal = useMemo(() => pathname?.startsWith('/lov-portal') && !pathname?.includes('/lov-stien'), [pathname]);
  const isMitSemester = useMemo(() => pathname?.startsWith('/mit-semester'), [pathname]);
  const isAdminPage = useMemo(() => pathname?.startsWith('/admin'), [pathname]);

  useEffect(() => {
    setMounted(true);
    // Check if running as PWA or Native App
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone || document.referrer.includes('android-app://'));
    setIsNativeApp(isStandalone || Capacitor.isNativePlatform());
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

  useEffect(() => {
    if (!firestore) return;
    const maintRef = doc(firestore, 'systemSettings', 'maintenance');
    const unsubscribe = onSnapshot(maintRef, (docSnap) => {
        if (docSnap.exists()) {
            setIsMaintenanceMode(docSnap.data().enabled || false);
        } else {
            setIsMaintenanceMode(false);
        }
    }, (err) => {
        console.error('[AppProvider] Maintenance listener error:', err);
    });
    return () => unsubscribe();
  }, [firestore]);

  useEffect(() => {
    if (!firestore) return;
    const limitsRef = doc(firestore, 'systemSettings', 'usageLimits');
    const unsubscribeLimits = onSnapshot(limitsRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsageLimits(docSnap.data());
      } else {
        // Fallback defaults
        setUsageLimits({
            Kollega: { concepts: 1, cases: 1, journal: 0, architect: 1, oralExam: 1, opinion: 0, star: 1, caseAnalyser: 0 },
            'Kollega+': { concepts: -1, cases: -1, journal: -1, architect: -1, oralExam: -1, opinion: 10, star: -1, caseAnalyser: -1 }
        });
      }
    }, (err) => {
        console.error('[AppProvider] UsageLimits listener error:', err);
    });

    const themeRef = doc(firestore, 'systemSettings', 'activeTheme');
    const unsubscribeTheme = onSnapshot(themeRef, (docSnap) => {
      if (docSnap.exists()) {
        setActiveTheme(docSnap.data().theme || 'default');
      } else {
        setActiveTheme('default');
      }
    }, (err) => {
        console.error('[AppProvider] Theme listener error:', err);
    });

    const campaignsRef = collection(firestore, 'campaigns');
    const activeCampaignsQuery = query(campaignsRef, where('isActive', '==', true), where('showBanner', '==', true));
    const unsubscribeCampaigns = onSnapshot(activeCampaignsQuery, (snap) => {
        const campaignData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCampaigns(campaignData);
    }, (err) => {
        console.error('[AppProvider] Campaigns listener error:', err);
    });

    const termsRef = doc(firestore, 'globalConfigs', 'terms');
    const unsubscribeTerms = onSnapshot(termsRef, (docSnap) => {
        if (docSnap.exists()) {
            setLatestTermsVersion(docSnap.data().version || '1.0.0');
        } else {
            setLatestTermsVersion('1.0.0');
        }
    }, (err) => {
        console.error('[AppProvider] Terms listener error:', err);
    });

    return () => {
        unsubscribeLimits();
        unsubscribeTheme();
        unsubscribeCampaigns();
        unsubscribeTerms();
    };
}, [firestore]);

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

    // Throttle: Only run maintenance logic if we haven't done it in the last 30 seconds
    const nowTime = Date.now();
    if (nowTime - maintenanceThrottleRef.current < 30000) return;
    maintenanceThrottleRef.current = nowTime;

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
                // Keep it locked for a bit to let the snapshot settle and prevent bouncing
                setTimeout(() => {
                    isUpdatingProfile.current = false;
                }, 10000); // 10s lock
            } catch (err) {
                console.error("Failed to update profile maintenance:", err);
                isUpdatingProfile.current = false;
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

  const showTermsModal = useMemo(() => {
    if (isUserLoading || userProfile === undefined || !user || !latestTermsVersion || isStandaloneGroups || pathname === '/' || isAdminPage) {
        return false;
    }
    // If onboarding is being shown, hide terms modal to avoid overlap
    if (showOnboardingModal) return false;

    // Check if user has accepted the latest version
    const acceptedVersion = userProfile?.acceptedTermsVersion;
    return acceptedVersion !== latestTermsVersion;
  }, [isUserLoading, userProfile, user, latestTermsVersion, isStandaloneGroups, pathname, showOnboardingModal, isAdminPage]);

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

  const openAuthPage = useCallback((mode: 'signin' | 'signup' = 'signup', priceId?: string) => {
    const authUrl = isStandaloneGroups ? `/rum/groups/auth` : `/auth`;
    const callbackPart = pathname?.includes('/join/') ? `&callbackUrl=${encodeURIComponent(pathname)}` : '';
    router.push(`${authUrl}?mode=${mode}${priceId ? `&priceId=${priceId}` : ''}${callbackPart}`);
  }, [isStandaloneGroups, pathname, router]);
  
  const openTeamModal = useCallback(() => {
    if (user) {
      setIsTeamModalOpen(true);
    } else {
      openAuthPage('signin');
    }
  }, [user, openAuthPage]);

  const handleLogout = useCallback(() => {
    if (auth) signOut(auth);
    if (isStandaloneGroups) {
      router.push('/rum/groups');
    } else {
      router.push('/');
    }
  }, [auth, isStandaloneGroups, router]);
  
  const handleResendVerification = useCallback(async () => {
    if (user && auth) {
      await sendEmailVerification(user);
    }
  }, [user, auth]);

  useEffect(() => {
    const reloadUserOnFocus = async () => {
      if (auth && auth.currentUser && !auth.currentUser.emailVerified) {
        await auth.currentUser.reload();
      }
    };

    // --- HEARTBEAT FOR REALTIME PRESENCE ---
    let heartbeatInterval: any;
    if (user && firestore && document.visibilityState === 'visible') {
        const sendHeartbeat = () => {
            const userRef = doc(firestore, 'users', user.uid);
            updateDoc(userRef, { lastActivityAt: serverTimestamp() }).catch(() => {});
        };
        // Initial heartbeat
        sendHeartbeat();
        // Every 45 seconds
        heartbeatInterval = setInterval(sendHeartbeat, 45000);
    }

    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && user && firestore) {
            const userRef = doc(firestore, 'users', user.uid);
            updateDoc(userRef, { lastActivityAt: serverTimestamp() }).catch(() => {});
        }
    };

    window.addEventListener('focus', reloadUserOnFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', reloadUserOnFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [auth, user, firestore]);

  const effectiveTheme = useMemo(() => {
    // 1. If admin has MANUALLY set a theme (Ember/Spring/Void), it wins
    if (activeTheme !== 'default') return activeTheme;

    // 2. If a campaign is active and has a theme, it takes priority over auto-fallbacks
    if (campaigns && campaigns.length > 0 && campaigns[0].theme) {
      return campaigns[0].theme;
    }
    
    // 3. No auto-fallbacks anymore as per user request
    return 'default';
  }, [campaigns, activeTheme]);

  const pageBackground = useMemo(() => {
    if (effectiveTheme === 'christmas') return 'bg-rose-50/50';
    if (effectiveTheme === 'easter') return 'bg-yellow-50/50';
    if (effectiveTheme === 'halloween') return 'bg-orange-50/20';
    
    if (pathname?.includes('/lov-portal')) return 'bg-[#F9F7F2]';
    if (pathname?.includes('/rum/groups')) return 'bg-[#F8FAFC]';
    if (pathname?.includes('/memento') || pathname?.includes('/case-trainer')) return 'bg-[#FFFBF5]';
    return pathname === '/' ? 'bg-[#FDFBF7]' : 'bg-white';
  }, [pathname, effectiveTheme]);

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
    setIsNavbarHidden,
    usageLimits,
    activeTheme,
    effectiveTheme,
    campaigns,
    isMaintenanceMode,
  }), [user, userProfile, isUserLoading, hasPlayedDailyChallenge, cookieConsent, dailyChallengeGameType, refetchUserProfile, handleLogout, openAuthPage, openTeamModal, handleResendVerification, handleLogin, handleSignup, handleGoogleLogin, isNativeApp, isNavbarHidden, setIsNavbarHidden, usageLimits, activeTheme, effectiveTheme, campaigns, isMaintenanceMode]);

  if (IS_PRE_LAUNCH) {
    return <ComingSoon />;
  }

  const showPaymentFailedBanner = mounted && userProfile?.stripeLastPaymentFailed && !isAdminPage;
  const showCampaignBanner = mounted && campaigns.length > 0 && (!user || userProfile?.membership !== 'Kollega+') && !isBannerDismissed;
  
  // Calculate total offset based on multiple possible banners
  const paymentOffset = showPaymentFailedBanner ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 72) : 0;
  const campaignOffset = showCampaignBanner ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 96 : 52) : 0;
  const totalBannerOffset = paymentOffset + campaignOffset;
  
  const showBannerOverlays = !isMaintenanceMode || (isMaintenanceMode && userProfile?.role === 'admin');

  return (
    <AppContext.Provider
      value={contextValue}
    >
      <div className={`${((isLovPortal || pathname?.includes('/simulator')) && !isNativeApp) ? 'h-screen overflow-hidden flex flex-col' : 'min-h-screen flex flex-col'} transition-all duration-500 ${pageBackground} ${isNativeApp ? 'native-app' : ''} selection:bg-amber-200`}>
        {showPaymentFailedBanner && showBannerOverlays && <PaymentFailedBanner />}
        {showCampaignBanner && showBannerOverlays && (
            <div style={{ top: `${paymentOffset}px`, position: 'sticky', zIndex: 10000 }}>
                <CampaignBanner campaign={campaigns[0]} onDismiss={() => setIsBannerDismissed(true)} />
            </div>
        )}
        <style dangerouslySetInnerHTML={{ __html: `
            ${effectiveTheme === 'christmas' ? `
                .bg-slate-900, .bg-\\[\\#1E293B\\], .bg-\\[\\#0f172a\\], .bg-\\[\\#020617\\], .bg-slate-800, .bg-slate-950 { background-color: #be123c !important; }
                .hover\\:bg-slate-800:hover, .hover\\:bg-slate-900:hover, .hover\\:bg-\\[\\#0f172a\\]:hover { background-color: #9f1239 !important; }
                .text-amber-600, .text-amber-500, .text-amber-400 { color: #facc15 !important; }
                .accent-color { color: #be123c !important; }
                .border-amber-200, .border-amber-100 { border-color: #fb7185 !important; }
            ` : effectiveTheme === 'easter' ? `
                .bg-slate-900, .bg-\\[\\#1E293B\\], .bg-\\[\\#0f172a\\], .bg-\\[\\#020617\\], .bg-slate-800, .bg-slate-950 { background-color: #047857 !important; color: white !important; font-weight: 800 !important; }
                .hover\\:bg-slate-800:hover, .hover\\:bg-slate-900:hover, .hover\\:bg-\\[\\#0f172a\\]:hover { background-color: #065f46 !important; }
                .text-amber-600, .text-amber-500, .text-amber-400 { color: #047857 !important; font-weight: 600 !important; }
                .accent-color { color: #047857 !important; }
                .border-amber-200, .border-amber-100 { border-color: #6ee7b7 !important; }
            ` : effectiveTheme === 'halloween' ? `
                .bg-slate-900, .bg-\\[\\#1E293B\\], .bg-\\[\\#0f172a\\], .bg-\\[\\#020617\\], .bg-slate-800, .bg-slate-950 { background-color: #7c3aed !important; }
                .hover\\:bg-slate-800:hover, .hover\\:bg-slate-900:hover, .hover\\:bg-\\[\\#0f172a\\]:hover { background-color: #6d28d9 !important; }
                .text-amber-600, .text-amber-500, .text-amber-400 { color: #f97316 !important; }
                .accent-color { color: #ea580c !important; }
                .border-amber-200, .border-amber-100 { border-color: #a78bfa !important; }
            ` : ''}
        ` }} />
        {mounted && !isNativeApp && !isStandaloneGroups && !isRaadgivning && !isAdminPage && !isNavbarHidden && showBannerOverlays && (
          <>
            {showUpgradeBanner && <UpgradeBanner />}
            <Navbar onAuth={(mode) => openAuthPage(mode)} user={user} userProfile={userProfile} onLogout={handleLogout} topOffset={totalBannerOffset} />
          </>
        )}
        <main 
          className={`relative ${isNativeApp ? 'pb-24 pt-4' : (isStandaloneGroups || isRaadgivning || isAdminPage) ? 'pt-0' : pathname === '/' ? 'pt-0' : 'pt-24 md:pt-32'} ${((isLovPortal || isMitSemester || pathname?.includes('/simulator')) && !isNativeApp) ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : 'flex-grow flex flex-col'}`}
          style={{ paddingTop: !isNativeApp && !isStandaloneGroups && !isRaadgivning && !isAdminPage && pathname !== '/' ? `calc(${totalBannerOffset}px + ${typeof window !== 'undefined' && window.innerWidth < 768 ? '6rem' : '8rem'})` : (totalBannerOffset > 0 && (pathname === '/' || isRaadgivning || isStandaloneGroups) ? `${totalBannerOffset}px` : undefined) }}
        >
            {/* Soft top gradient to blend with navbar when scrolling */}
            {!isNativeApp && !isStandaloneGroups && !isRaadgivning && !isAdminPage && (
                <div className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-inherit to-transparent pointer-events-none z-10`} />
            )}
            
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={isNativeApp ? "min-h-full" : "h-full"}
            >
                {children}
            </motion.div>
        </main>
        {mounted && !isNativeApp && !isStandaloneGroups && !isRaadgivning && !isLovPortal && !isMitSemester && !isAdminPage && !pathname?.includes('/simulator') && <Footer />}


        
        {mounted && isNativeApp && user && <MobileTabNavigation userProfile={userProfile} />}

        <Suspense fallback={null}>
            {/* AuthModal has been removed */}
        </Suspense>
        {!isStandaloneGroups && showOnboardingModal && showBannerOverlays && <OnboardingModal onComplete={refetchUserProfile} />}
        {user && latestTermsVersion && showTermsModal && !showOnboardingModal && (
            <TermsConsentModal 
                isOpen={showTermsModal} 
                userId={user.uid} 
                latestVersion={latestTermsVersion}
                onAccepted={refetchUserProfile}
            />
        )}
        {isTeamModalOpen && showBannerOverlays && <TeamModal isOpen={isTeamModalOpen} onClose={() => setIsTeamModalOpen(false)} />}
        <ErrorLogger user={user} userProfile={userProfile} />
        {showBannerOverlays && <ThemeDecorations />}
        {showBannerOverlays && <CookieConsent />}
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
