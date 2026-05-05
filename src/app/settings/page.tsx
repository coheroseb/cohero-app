'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp, deleteDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Settings, User, CreditCard, Loader2, CheckCircle, ArrowUpRight, Gift, ChevronDown, ShieldAlert, Users2, Send, Info, Award, Sparkles, Bell, BellOff, Smartphone, Navigation, Mail, Briefcase, Building2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cancelSubscription, createPortalSessionAction, redeemCodeAction, listOneNoteNotebooksAction, syncOneNoteNotebookAction, getMicrosoftAuthUrlAction } from '@/app/actions';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { deleteUser, updateProfile } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { requestNotificationPermission } from '@/firebase/messaging';
import { encryptData } from '@/lib/encryption';
import { motion, AnimatePresence } from 'framer-motion';
import { INSTITUTIONS, PROFESSION_OPTIONS, SEMESTER_OPTIONS } from '@/lib/constants';

import { Capacitor } from '@capacitor/core';
import NativeSettings from '@/components/native/NativeSettings';

function capitalize(str: string) {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export default function SettingsPage() {
  const { user, userProfile, refetchUserProfile, handleLogout, handleResendVerification } = useApp();
  
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'membership' | 'notifications' | 'security' | 'integrations'>('profile');

  // Profile state
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [semester, setSemester] = useState('');
  const [institution, setInstitution] = useState('');
  const [profession, setProfession] = useState('');
  const [isQualified, setIsQualified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  // Curriculum/Modules state
  const [availableModules, setAvailableModules] = useState<{id: string, name: string}[]>([]);
  const [fetchingCurriculum, setFetchingCurriculum] = useState(false);

  // Notification state
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);

  // Redemption code state
  const [redemptionCode, setRedemptionCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Subscription state
  const [isCancelling, setIsCancelling] = useState(false);
  const [partnerInstitution, setPartnerInstitution] = useState<string | null>(null);

  // Delete account state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRecentLogin, setIsRecentLogin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Resend verification state
  const [isResending, setIsResending] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // OneNote state
  const [oneNoteNotebooks, setOneNoteNotebooks] = useState<any[]>([]);
  const [isOneNoteLoading, setIsOneNoteLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'integrations' && userProfile?.oneNoteAuth) {
        setIsOneNoteLoading(true);
        listOneNoteNotebooksAction()
            .then(setOneNoteNotebooks)
            .catch(err => console.error("Failed to list notebooks:", err))
            .finally(() => setIsOneNoteLoading(false));
    }
  }, [activeTab, userProfile?.oneNoteAuth]);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || user?.displayName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setSemester(userProfile.semester || '');
      
      const MAPPING: Record<string, string> = {
        "UCL": "UCL Erhvervsakademi og Professionshøjskole",
        "Absalon": "Professionshøjskolen Absalon",
        "UCN": "Professionshøjskolen UCN"
      };
      const inst = userProfile.institution || '';
      setInstitution(MAPPING[inst] || inst);

      setProfession(userProfile.profession || '');
      setIsQualified(userProfile.isQualified || false);
      setEmailNotificationsEnabled(userProfile.emailNotificationsEnabled ?? true);

      if (userProfile.stripePriceId?.startsWith('b2b-') && user?.email && firestore) {
        const domain = user.email.split('@')[1];
        const partnerDocRef = doc(firestore, 'partnerDomains', domain);
        getDoc(partnerDocRef).then(docSnap => {
            if (docSnap.exists()) {
                setPartnerInstitution(docSnap.data().institutionName);
            }
        });
      } else {
          setPartnerInstitution(null);
      }
    }
  }, [userProfile, user, firestore]);

  useEffect(() => {
    const fetchCurriculum = async () => {
      // Priority 1: Use modules from the user's custom uploaded curriculum
      if (userProfile?.customCurriculum?.modules && Array.isArray(userProfile.customCurriculum.modules)) {
        const mods = userProfile.customCurriculum.modules.map((m: any) => ({
          id: m.id || m.semester?.toString() || '',
          name: m.name || `${m.semester}. semester`
        }));
        setAvailableModules(mods);
        return;
      }

      // Priority 2: Use modules from the institutional curriculum
      if (!institution || !profession || !firestore) {
        setAvailableModules([]);
        return;
      }

      setFetchingCurriculum(true);
      try {
        const curriculumsRef = collection(firestore, 'curriculums');
        const q = query(
          curriculumsRef,
          where('institution', '==', institution),
          where('profession', '==', profession)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const curriculum = querySnapshot.docs[0].data();
          if (curriculum.modules && Array.isArray(curriculum.modules)) {
            const mods = curriculum.modules.map((m: any) => ({
              id: m.id || m.semester?.toString() || '',
              name: m.name || `${m.semester}. semester`
            }));
            setAvailableModules(mods);
          } else {
            setAvailableModules([]);
          }
        } else {
          setAvailableModules([]);
        }
      } catch (err) {
        console.error("Error fetching curriculum for settings:", err);
        setAvailableModules([]);
      } finally {
        setFetchingCurriculum(false);
      }
    };

    fetchCurriculum();
  }, [institution, profession, firestore, userProfile?.customCurriculum]);
  
  useEffect(() => {
    if (user?.metadata.lastSignInTime) {
      const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
      setIsRecentLogin(now - lastSignIn < fiveMinutes);
    }
  }, [user]);

  const handleResendClick = async () => {
    setIsResending(true);
    await handleResendVerification();
    setIsResending(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      setError('Bruger ikke logget ind. Prøv at genindlæse siden.');
      return;
    }

    setIsLoading(true);
    setSuccess(false);
    setError(null);

    const capitalizedUsername = capitalize(username.trim());

    // Automatically calculate studyStarted from semester
    const calculateStudyStarted = (semStr: string) => {
        const sem = parseInt(semStr.match(/\d+/)?.[0] || '1');
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); 
        
        let startMonth = 1; // Feb
        let startYear = currentYear;
        
        if (currentMonth >= 8) { // Sept or later
          startMonth = 8;
        } else if (currentMonth >= 1) { // Feb or later
          startMonth = 1;
        } else {
          // Jan belongs to previous year's Fall sem
          startMonth = 8;
          startYear = currentYear - 1;
        }
        
        let currentStart = new Date(startYear, startMonth, 1);
        for (let i = 1; i < sem; i++) {
            if (currentStart.getMonth() === 8) {
                currentStart.setMonth(1);
            } else {
                currentStart.setMonth(8);
                currentStart.setFullYear(currentStart.getFullYear() - 1);
            }
        }
        return currentStart.toISOString().split('T')[0];
    };

    const studyStarted = isQualified ? '' : calculateStudyStarted(semester);

    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);

      batch.update(userRef, {
        username: capitalizedUsername,
        phoneNumber: phoneNumber.trim(),
        semester: isQualified ? '' : semester,
        institution: isQualified ? '' : institution,
        profession: profession,
        studyStarted: isQualified ? '' : studyStarted,
        isQualified,
        emailNotificationsEnabled,
      });

      await batch.commit();
      
      await updateProfile(user, { displayName: capitalizedUsername });

      await refetchUserProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setError('Kunne ikke gemme indstillinger. Prøv venligst igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
      if (!user) return;
      setIsRequestingNotifications(true);
      try {
          const token = await requestNotificationPermission(user.uid);
          if (token) {
              setNotificationStatus('granted');
              toast({
                  title: 'Notifikationer slået til',
                  description: 'Du vil nu modtage push-beskeder på denne enhed.',
              });
          } else {
              setNotificationStatus(Notification.permission);
          }
      } catch (err: any) {
          console.error(err);
          setNotificationStatus(Notification.permission);
          toast({
              variant: 'destructive',
              title: 'Der skete en fejl',
              description: err.message || 'Kunne ikke aktivere notifikationer.',
          });
      } finally {
          setIsRequestingNotifications(false);
      }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !redemptionCode) return;

      setIsRedeeming(true);
      setRedeemStatus(null);
      
      try {
          const result = await redeemCodeAction({
              code: redemptionCode,
              userId: user.uid
          });
          
          if (!result.success) {
              throw new Error(result.message);
          }

          await refetchUserProfile();
          setRedeemStatus({ type: 'success', message: result.message! });
          setRedemptionCode('');
          toast({ title: "Kode indløst!", description: result.message });

      } catch (err: any) {
          console.error("Redemption error:", err);
          setRedeemStatus({ type: 'error', message: err.message || 'Der skete en fejl. Prøv igen.'});
      } finally {
          setIsRedeeming(false);
      }
  };
  
    const handleCancelSubscription = async () => {
        if (!user || !firestore || !userProfile?.stripeSubscriptionId) {
            setError('Stripe abonnements-ID ikke fundet. Kan ikke opsige abonnement.');
            return;
        }
        setIsCancelling(true);
        setError(null);
        try {
            const result = await cancelSubscription(userProfile.stripeSubscriptionId);
            if (result.success) {
                const userRef = doc(firestore, 'users', user.uid);
                await updateDoc(userRef, {
                    stripeCancelAtPeriodEnd: true,
                });
                await refetchUserProfile();
                toast({
                    title: 'Abonnement opsagt',
                    description: result.message,
                });
            } else {
                setError(result.message);
                toast({
                    variant: "destructive",
                    title: 'Fejl',
                    description: result.message,
                });
            }
        } catch (err: any) {
            setError(err.message || 'Kunne ikke opsige abonnement. Prøv igen.');
            toast({
                variant: "destructive",
                title: 'Serverfejl',
                description: err.message || 'Kunne ikke opsige abonnement. Prøv igen.',
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleManageSubscription = async () => {
        if (!userProfile?.stripeCustomerId) return;
        setIsPortalLoading(true);
        try {
            const { url } = await createPortalSessionAction(userProfile.stripeCustomerId);
            window.location.href = url;
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Portal Fejl',
                description: err.message || 'Kunne ikke indlæse betalingsportalen.',
            });
        } finally {
            setIsPortalLoading(false);
        }
    };

  const handleConfirmDelete = async () => {
    if (!user || !firestore || !auth || !auth.currentUser) {
      throw new Error("Bruger eller database er ikke tilgængelig.");
    }

    setIsDeleting(true);
    
    try {
      // 1. Cancel subscription if active and personal
      const isSpecialSubscription = userProfile?.stripePriceId?.startsWith('b2b-') || userProfile?.stripePriceId?.startsWith('redeemed-');
      if (userProfile?.stripeSubscriptionId && !isSpecialSubscription) {
        try {
          await cancelSubscription(userProfile.stripeSubscriptionId);
        } catch (subErr) {
          console.error("Failed to cancel subscription during deletion:", subErr);
          // We continue anyway, but we log the error
        }
      }

      // 2. Delete Firestore document first while we still have auth permissions
      await deleteDoc(doc(firestore, 'users', user.uid));

      // 3. Delete Auth user - this is the point of no return.
      await deleteUser(auth.currentUser);
      
      // 4. Logout and clean up navigation
      handleLogout();
    } catch (err: any) {
      setIsDeleting(false);
      throw err; // Re-throw to be caught by DeleteAccountModal
    }
  };

  const handleSyncNotebook = async (notebookId: string) => {
    setIsSyncing(notebookId);
    try {
      const result = await syncOneNoteNotebookAction(notebookId);
      if (result.success) {
        toast({ title: "Synkronisering færdig", description: `Hentet ${result.count} noter fra OneNote.` });
      } else {
        throw new Error(result.error || "Ukendt fejl");
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Synkronisering fejlede", description: err.message });
    } finally {
      setIsSyncing(null);
    }
  };

  if (Capacitor.isNativePlatform()) {
    return <NativeSettings />;
  }

  if (!userProfile) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
        <p className='text-sm font-bold text-slate-400 tracking-widest uppercase'>Henter indstillinger...</p>
      </div>
    );
  }

  const subscriptionWillBeCancelled = userProfile?.stripeCancelAtPeriodEnd === true;
  const isSpecialSubscription = userProfile?.stripePriceId?.startsWith('b2b-') || userProfile?.stripePriceId?.startsWith('redeemed-');
  const isPaidUser = !!userProfile?.membership && userProfile.membership !== 'Gratis Plan';

  const tabs = [
    { id: 'profile', label: 'Profil & Uddannelse', icon: User },
    { id: 'membership', label: 'Medlemskab & Adgang', icon: CreditCard },
    { id: 'notifications', label: 'Notifikationer', icon: Bell },
    { id: 'integrations', label: 'Integrationer', icon: Sparkles },
    { id: 'security', label: 'Sikkerhed & Konto', icon: ShieldAlert },
  ] as const;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-32">
      {/* Premium Header Area */}
      <div className="bg-white border-b border-slate-200/60 pt-20 sm:pt-28 md:pt-32 pb-8 sm:pb-10 px-4 sm:px-6 relative overflow-hidden">
         {/* Minimalist ambient glow */}
         <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
         
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 sm:gap-6 relative z-10">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-[1.5rem] bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-800 shadow-sm shrink-0"
            >
               <Settings className="w-7 h-7 sm:w-9 sm:h-9" />
            </motion.div>
            <div className="text-center md:text-left">
               <motion.h1 
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1"
               >
                 Indstillinger
               </motion.h1>
               <motion.p 
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
                 className="text-xs sm:text-[15px] text-slate-500 font-medium"
               >
                 Administrer din oplevelse og konto på Cohéro.
               </motion.p>
            </div>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-10">
         {/* Sidebar Navigation */}
         <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-1 bg-white p-2 rounded-[1.5rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 flex lg:flex-col overflow-x-auto lg:overflow-visible snap-x">
                {tabs.map(tab => {
                   const Icon = tab.icon;
                   const isActive = activeTab === tab.id;
                   return (
                     <button 
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id)}
                       className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all whitespace-nowrap snap-center ${
                         isActive 
                           ? 'bg-amber-50 text-amber-900 border border-amber-100/50 shadow-sm' 
                           : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                       }`}
                     >
                       <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                       <span className="text-sm">{tab.label}</span>
                     </button>
                   )
                })}
            </div>
         </aside>

         {/* Main Content Area */}
         <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15 }}
                 transition={{ duration: 0.25, ease: "easeOut" }}
                 className="space-y-8"
               >

                  {/* =========================================
                      PROFILE TAB
                      ========================================= */}
                  {activeTab === 'profile' && (
                    <div className="space-y-8">
                       <form onSubmit={handleSave} className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 overflow-hidden">
                          <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                             <h2 className="text-lg sm:text-xl font-bold text-slate-900">Personlig Information</h2>
                             <p className="text-[10px] sm:text-xs font-semibold text-slate-500 mt-1">Opdater dit navn og din uddannelsesstatus.</p>
                          </div>
                                     <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                              {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in"><ShieldAlert className="w-4 h-4" />{error}</div>}
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                  <div className="space-y-2">
                                      <label htmlFor="username" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Fulde Navn</label>
                                      <div className="relative">
                                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full h-12 pl-11 bg-slate-50 focus:bg-white rounded-xl border-slate-200 font-bold text-slate-900 transition-all focus:ring-2 focus:ring-amber-500/20" />
                                      </div>
                                  </div>

                                  <div className="space-y-2">
                                      <label htmlFor="phoneNumber" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Telefonnummer</label>
                                      <div className="relative">
                                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                          <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full h-12 pl-11 bg-slate-50 focus:bg-white rounded-xl border-slate-200 font-bold text-slate-900 transition-all focus:ring-2 focus:ring-amber-500/20" placeholder="+45 12 34 56 78" />
                                      </div>
                                  </div>
                              </div>

                              <div className="w-full h-[1px] bg-slate-100" />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                  <div className="space-y-2">
                                      <label htmlFor="profession" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Profession / Studie</label>
                                      <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/30 transition-all">
                                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                          <select id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full h-12 pl-11 pr-10 bg-transparent text-[13px] font-bold text-slate-900 appearance-none outline-none cursor-pointer">
                                              <option value="" disabled>Vælg profession...</option>
                                              {PROFESSION_OPTIONS.map(prof => (
                                                  <option key={prof} value={prof}>{prof}</option>
                                              ))}
                                          </select>
                                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                      </div>
                                  </div>

                                  {!isQualified && (
                                     <>
                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="institution" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Uddannelsesinstitution</label>
                                            <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/30 transition-all">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <select id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} className="w-full h-12 pl-11 pr-10 bg-transparent text-[13px] font-bold text-slate-900 appearance-none outline-none cursor-pointer">
                                                    <option value="" disabled>Vælg institution...</option>
                                                    {INSTITUTIONS.map(inst => (
                                                        <option key={inst} value={inst}>{inst}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="semester" className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">Semester</label>
                                            <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/30 transition-all">
                                                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <select
                                                    id="semester"
                                                    value={semester}
                                                    onChange={(e) => setSemester(e.target.value)}
                                                    className="w-full h-12 pl-11 pr-10 bg-transparent text-[13px] font-bold text-slate-900 appearance-none outline-none cursor-pointer"
                                                >
                                                    <option value="" disabled>Vælg semester...</option>
                                                    {availableModules.map(mod => (
                                                        <option key={mod.id} value={mod.id}>{mod.name}</option>
                                                    ))}
                                                    {!fetchingCurriculum && availableModules.length === 0 && SEMESTER_OPTIONS.map(sem => (
                                                        <option key={sem} value={sem}>{sem}. semester</option>
                                                    ))}
                                                </select>
                                                {fetchingCurriculum ? (
                                                   <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />
                                                ) : (
                                                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                )}
                                            </div>
                                        </div>
                                     </>
                                  )}
                              </div>

                              <div className="w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between cursor-pointer group" onClick={() => setIsQualified(!isQualified)}>
                                  <div>
                                      <p className="text-[13px] sm:text-sm font-bold text-slate-900">Er du færdiguddannet?</p>
                                      <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">Slå til hvis du har afsluttet dit studie.</p>
                                  </div>
                                  <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${isQualified ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${isQualified ? 'translate-x-5' : 'translate-x-0'}`} />
                                  </div>
                              </div>
                           </div>

                          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
                             <AnimatePresence>
                               {success && (
                                 <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                                   <CheckCircle className="w-4 h-4" /> Gemt
                                 </motion.div>
                               )}
                             </AnimatePresence>
                             <Button type="submit" disabled={isLoading} className="h-11 px-8 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md font-bold active:scale-[0.98] transition-all w-full md:w-auto">
                               {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                               Gem Profil
                             </Button>
                          </div>
                       </form>

                       
                       {/* Badges Section */}
                       <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 p-8">
                           <div className="flex items-center gap-3 mb-6">
                               <Award className="w-6 h-6 text-amber-500" />
                               <h2 className="text-xl font-bold text-slate-900">Dine Mærkater</h2>
                           </div>
                           {userProfile?.badges && userProfile.badges.length > 0 ? (
                              <div className="flex flex-wrap gap-3">
                                  {userProfile.badges.map((b: string) => (
                                      <div key={b} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
                                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                          <span className="text-xs font-black uppercase tracking-widest text-amber-900">{b}</span>
                                      </div>
                                  ))}
                              </div>
                           ) : (
                               <div className="w-full border-2 border-dashed border-slate-100 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Award className="w-6 h-6 text-slate-300" /></div>
                                   <p className="text-sm font-bold text-slate-500">Ingen mærkater endnu</p>
                                   <p className="text-xs font-medium text-slate-400 mt-1 max-w-sm">Deltag i træningsscenarier og fuldfør opgaver for at optjene gyldne mærkater til din profil.</p>
                               </div>
                           )}
                       </div>
                    </div>
                  )}

                  {/* =========================================
                      MEMBERSHIP TAB
                      ========================================= */}
                  {activeTab === 'membership' && (
                    <div className="space-y-8">
                       <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl sm:rounded-[2rem] p-6 sm:p-10 shadow-xl overflow-hidden relative group">
                          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[80px] -mr-48 -mt-48 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-8 mb-8">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80 mb-2 flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5" /> Nuværende Plan
                                </p>
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">{userProfile?.membership || 'Gratis Plan'}</h2>
                                {partnerInstitution && (
                                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/5 backdrop-blur-md">
                                    <Users2 className="w-3.5 h-3.5 text-amber-300" />
                                    <span className="text-xs font-bold text-amber-100">Studieaftale: {partnerInstitution}</span>
                                  </div>
                                )}
                             </div>
                             {userProfile?.stripeCurrentPeriodEnd && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md min-w-[200px]">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                      {isSpecialSubscription || subscriptionWillBeCancelled ? 'Adgang udløber' : 'Næste fornyelse'}
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                      {new Date(userProfile.stripeCurrentPeriodEnd).toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                             )}
                          </div>

                          <div className="relative z-10">
                              {isSpecialSubscription ? (
                                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                     <p className="text-sm font-bold text-amber-200 flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Dette abonnement administreres centralt af din institution.
                                     </p>
                                  </div>
                              ) : (
                                  <div className="flex flex-col gap-6">
                                      {subscriptionWillBeCancelled && (
                                          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
                                              <p className="text-sm font-bold text-rose-400 flex items-center gap-2">
                                                  <ShieldAlert className="w-4 h-4"/> Opsagt - din adgang udløber snart
                                              </p>
                                              <Link href="/upgrade">
                                                  <Button className="bg-white text-slate-900 hover:bg-slate-100 h-10 px-6 rounded-xl font-bold text-xs ring-2 ring-white/20">
                                                      Forny Adgang
                                                  </Button>
                                              </Link>
                                          </div>
                                      )}

                                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                                          {isPaidUser ? (
                                              <>
                                                  {userProfile?.stripeCustomerId && (
                                                      <Button 
                                                          onClick={handleManageSubscription} 
                                                          disabled={isPortalLoading}
                                                          className="w-full sm:w-auto bg-white text-slate-900 hover:bg-slate-100 h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl"
                                                      >
                                                          {isPortalLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CreditCard className="w-4 h-4 mr-2" />}
                                                          Administrer betaling
                                                      </Button>
                                                  )}
                                                  
                                                  {!subscriptionWillBeCancelled && (
                                                      <Button 
                                                          variant="ghost" 
                                                          onClick={handleCancelSubscription} 
                                                          disabled={isCancelling} 
                                                          className="w-full sm:w-auto h-12 px-8 bg-white/5 text-white hover:bg-rose-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 transition-all"
                                                      >
                                                          {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                                          Opsig abonnement
                                                      </Button>
                                                  )}
                                              </>
                                          ) : (
                                              <Link href="/upgrade" className="w-full sm:w-auto">
                                                  <Button className="w-full sm:w-auto bg-amber-400 text-amber-950 hover:bg-amber-300 h-12 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                                      Opgrader til Pro <Sparkles className="w-4 h-4 ml-2" />
                                                  </Button>
                                              </Link>
                                          )}

                                          {isPaidUser && userProfile?.membership !== 'Kollega+' && (
                                              <Link href="/upgrade" className="ml-auto">
                                                  <Button variant="outline" className="w-full sm:w-auto border-amber-400/30 text-amber-400 hover:bg-amber-400/10 h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest">
                                                      Skift Plan
                                                  </Button>
                                              </Link>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                       </div>

                       {/* Redeem Code */}
                       <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200/60 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row gap-6 sm:gap-8 items-center justify-between">
                           <div className="flex items-start gap-4 flex-1">
                               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] sm:rounded-[1.2rem] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                   <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                               </div>
                               <div>
                                   <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Indløs Kampagnekode</h3>
                                   <p className="text-[11px] sm:text-sm font-medium text-slate-500 leading-relaxed mb-4">Har du modtaget en kode fra dit studie eller en kampagne? Indløs den her for øjeblikkelig premium adgang.</p>
                                   
                                   <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-3">
                                       <Input 
                                          value={redemptionCode} 
                                          onChange={e => setRedemptionCode(e.target.value)} 
                                          placeholder="F.eks. CAMPUS24" 
                                          className="flex-1 h-12 bg-slate-50 border-slate-200 rounded-xl font-mono uppercase focus:ring-amber-500/20" 
                                       />
                                       <Button type="submit" disabled={isRedeeming || !redemptionCode} className="h-12 px-8 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800">
                                           {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Indløs'}
                                       </Button>
                                   </form>
                                   {redeemStatus && (
                                      <p className={`mt-3 text-sm font-bold flex items-center gap-2 ${redeemStatus.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          <Info className="w-4 h-4" /> {redeemStatus.message}
                                      </p>
                                   )}
                               </div>
                           </div>
                       </div>
                    </div>
                  )}

                  {/* =========================================
                      NOTIFICATIONS TAB
                      ========================================= */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-8">
                        {!user?.emailVerified && (
                          <div className="bg-amber-50/50 border border-amber-200/60 rounded-[2rem] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                             <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-amber-100/50 rounded-2xl flex items-center justify-center shrink-0 text-amber-600">
                                   <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-amber-950 mb-1">E-mail bekræftelse mangler</h3>
                                    <p className="text-sm font-medium text-amber-900/60">Bekræft din mail for at modtage opdateringer om porteføljer og systemnotifikationer.</p>
                                </div>
                             </div>
                             <Button onClick={handleResendClick} disabled={isResending} className="h-11 px-6 rounded-xl bg-white text-amber-900 hover:bg-amber-50 border border-amber-200 shadow-sm shrink-0 w-full sm:w-auto font-bold">
                                {isResending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                Gensend Link
                             </Button>
                          </div>
                        )}

                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600"><Bell className="w-5 h-5" /></div>
                               <div>
                                  <h2 className="text-xl font-bold text-slate-900">Push-Beskeder</h2>
                                  <p className="text-xs font-semibold text-slate-500 mt-1">Få besked når din AI arkitekt er færdig med tunge opgaver.</p>
                               </div>
                            </div>
                            <div className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm ${notificationStatus === 'granted' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                        {notificationStatus === 'granted' ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 mb-0.5">Notifikationer for denne enhed</h3>
                                        <p className="text-sm font-medium text-slate-500">
                                             {notificationStatus === 'granted' ? 'Aktiveret - Du modtager vigtige notifikationer.' : notificationStatus === 'denied' ? 'Blokeret i browserindstillingerne.' : notificationStatus === 'unsupported' ? 'Ikke understøttet i denne browser.' : 'Status ukendt / Ikke anmodet.'}
                                        </p>
                                    </div>
                                </div>
                                {(notificationStatus === 'default' || notificationStatus === 'granted') && (
                                    <Button onClick={handleEnableNotifications} disabled={isRequestingNotifications} className="h-11 px-8 rounded-xl font-bold shadow-sm w-full sm:w-auto">
                                        {isRequestingNotifications ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Bell className="w-4 h-4 mr-2" />}
                                        {notificationStatus === 'granted' ? 'Opdater Token' : 'Forbind Enhed'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600"><Mail className="w-5 h-5" /></div>
                               <div>
                                  <h2 className="text-xl font-bold text-slate-900">Email-Præferencer</h2>
                                  <p className="text-xs font-semibold text-slate-500 mt-1">Vælg hvilke mails du ønsker at modtage fra os.</p>
                               </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer group" onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${emailNotificationsEnabled ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 mb-0.5">Nyheder & Opdateringer</h3>
                                            <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                                Få vigtige platform-opdateringer, tips til din uddannelse og nye funktioner.
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${emailNotificationsEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200 ease-in-out ${emailNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSave} disabled={isLoading} className="h-10 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs">
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                        Gem Præferencer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                  )}

                  {/* =========================================
                      INTEGRATIONS TAB
                      ========================================= */}
                  {activeTab === 'integrations' && (
                    <div className="space-y-8">
                       <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                             <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                   <Sparkles className="w-5 h-5 text-amber-500" /> 
                                   Microsoft OneNote
                                </h2>
                                <p className="text-xs font-semibold text-slate-500 mt-1">Synkroniser dine noter direkte ind i Cohéro.</p>
                             </div>
                             {!userProfile?.oneNoteAuth ? (
                                <Button 
                                  disabled
                                  className="bg-slate-100 text-slate-400 font-bold rounded-xl h-11 px-6 shadow-sm flex items-center gap-2 cursor-not-allowed"
                                >
                                   Kommer snart
                                </Button>
                             ) : (
                                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-black uppercase tracking-widest">
                                   <CheckCircle className="w-4 h-4" /> Forbundet
                                </div>
                             )}
                          </div>
                          
                          <div className="p-8">
                             {userProfile?.oneNoteAuth ? (
                                <div className="space-y-6">
                                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Dine Notesbøger</h3>
                                   {isOneNoteLoading ? (
                                      <div className="flex flex-col items-center py-12">
                                         <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Henter notesbøger...</p>
                                      </div>
                                   ) : oneNoteNotebooks.length > 0 ? (
                                      <div className="grid gap-4">
                                         {oneNoteNotebooks.map(nb => (
                                            <div key={nb.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-amber-200 transition-all">
                                               <div className="flex items-center gap-4">
                                                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                                                     <BookOpen className="w-5 h-5" />
                                                  </div>
                                                  <div>
                                                     <p className="text-sm font-bold text-slate-900">{nb.displayName}</p>
                                                     <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">Senest ændret: {new Date(nb.lastModifiedDateTime).toLocaleDateString()}</p>
                                                  </div>
                                               </div>
                                               <Button 
                                                 onClick={() => handleSyncNotebook(nb.id)}
                                                 disabled={isSyncing === nb.id}
                                                 className="h-9 px-5 rounded-lg bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 font-bold text-xs shadow-sm"
                                               >
                                                  {isSyncing === nb.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-2" />}
                                                  Synkroniser
                                               </Button>
                                            </div>
                                         ))}
                                      </div>
                                   ) : (
                                      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                         <p className="text-sm font-bold text-slate-400">Ingen notesbøger fundet.</p>
                                      </div>
                                   )}
                                </div>
                             ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-slate-100">
                                   <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                      <Sparkles className="w-8 h-8 text-slate-200" />
                                   </div>
                                   <p className="text-sm font-bold text-slate-900 mb-1">Forbind dine noter</p>
                                   <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto px-6">
                                      Giv Cohéro adgang til dine OneNote notesbøger, så vi automatisk kan indeksere dine egne noter og bruge dem til din lærings-sti.
                                   </p>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  )}

                  {/* =========================================
                      SECURITY TAB
                      ========================================= */}
                  {activeTab === 'security' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-8 rounded-[2rem] border border-rose-100 shadow-sm relative overflow-hidden">
                           <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />
                           <h2 className="text-2xl font-black text-slate-900 mb-2">Farezone</h2>
                           <p className="text-sm font-medium text-slate-500 mb-8 max-w-2xl leading-relaxed">
                                Ved at slette din konto fjerner du permanent al din data fra Cohéro (journaler, cases, studieplaner m.m.). Denne handling sletter dig og dine data øjeblikkeligt fra databasen. <strong className="text-rose-600 font-bold">Handlingen kan ikke fortrydes.</strong>
                           </p>

                           <TooltipProvider>
                              <Tooltip delayDuration={0}>
                                 <TooltipTrigger asChild>
                                    <div className="inline-block" tabIndex={isRecentLogin ? undefined : 0}>
                                       <Button 
                                         variant="destructive" 
                                         onClick={() => setIsDeleteModalOpen(true)}
                                         disabled={!isRecentLogin || isDeleting}
                                         className="h-12 px-8 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-md shadow-rose-600/20"
                                       >
                                         <ShieldAlert className="w-4 h-4 mr-2" />
                                         Slet min konto permanent
                                       </Button>
                                    </div>
                                 </TooltipTrigger>
                                 {!isRecentLogin && (
                                    <TooltipContent className="bg-slate-900 text-white p-5 max-w-xs border-none shadow-2xl rounded-2xl" side="bottom">
                                       <div className="space-y-2">
                                          <p className="text-[14px] font-black tracking-tight text-white flex items-center gap-2">
                                             <ShieldAlert className="w-4 h-4 text-amber-400" /> Sikkerhedslås
                                          </p>
                                          <p className="text-xs font-medium leading-relaxed text-slate-300">
                                             For at beskytte din konto skal du have logget ind inden for de sidste <span className="text-amber-400 font-bold">5 minutter</span> for at slette den. 
                                          </p>
                                          <p className="text-xs font-bold text-slate-100">Log venligst ud og ind igen for at låse op.</p>
                                       </div>
                                    </TooltipContent>
                                 )}
                              </Tooltip>
                           </TooltipProvider>
                        </div>
                     </div>
                  )}

               </motion.div>
            </AnimatePresence>
         </main>
      </div>

      <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        username={userProfile?.username || ''}
      />
    </div>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
