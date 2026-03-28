'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { Settings, User, CreditCard, Loader2, CheckCircle, ArrowUpRight, Gift, ChevronDown, ShieldAlert, Users2, Send, Info, Award, Sparkles, Bell, BellOff, Smartphone, Navigation, Mail, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cancelSubscription } from '@/app/actions';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { deleteUser, updateProfile } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { requestNotificationPermission } from '@/firebase/messaging';
import { encryptData } from '@/lib/encryption';
import { motion, AnimatePresence } from 'framer-motion';
import { INSTITUTIONS, PROFESSION_OPTIONS } from '@/lib/constants';

export default function SettingsPage() {
  const { user, userProfile, refetchUserProfile, handleLogout, handleResendVerification } = useApp();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'membership' | 'notifications' | 'security'>('profile');

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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    } else {
      setNotificationStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || user?.displayName || '');
      setPhoneNumber(userProfile.phoneNumber || '');
      setSemester(userProfile.semester || '');
      setInstitution(userProfile.institution || '');
      setProfession(userProfile.profession || '');
      setIsQualified(userProfile.isQualified || false);

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
    if (user?.metadata.lastSignInTime) {
      const lastSignIn = new Date(user.metadata.lastSignInTime).getTime();
      const now = new Date().getTime();
      const twoMinutes = 2 * 60 * 1000;
      setIsRecentLogin(now - lastSignIn < twoMinutes);
    }
  }, [user]);

  const capitalize = (s: string) => {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
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
      if (!user || !firestore || !redemptionCode) return;

      setIsRedeeming(true);
      setRedeemStatus(null);
      
      const codeRef = doc(firestore, 'redemptionCodes', redemptionCode.trim().toUpperCase());
      const userRef = doc(firestore, 'users', user.uid);
      
      try {
          const codeSnap = await getDoc(codeRef);
          if (!codeSnap.exists()) {
              throw new Error('Koden er ikke gyldig.');
          }
          const codeData = codeSnap.data();
          if (codeData.redeemedBy) {
              throw new Error('Koden er allerede blevet brugt.');
          }

          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + codeData.durationInMonths);

          const batch = writeBatch(firestore);
          
          batch.update(codeRef, {
              redeemedBy: user.uid,
              redeemedAt: serverTimestamp(),
          });
          
          batch.update(userRef, {
              membership: codeData.membershipLevel,
              stripeCurrentPeriodEnd: expiryDate.toISOString(),
              stripePriceId: `redeemed-${redemptionCode}`
          });
          
          await batch.commit();

          await refetchUserProfile();
          setRedeemStatus({ type: 'success', message: `Tillykke! Du har nu ${codeData.membershipLevel} indtil ${expiryDate.toLocaleDateString('da-DK')}.`});
          setRedemptionCode('');

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

  const handleConfirmDelete = async () => {
    if (!user || !firestore || !auth || !auth.currentUser) {
      throw new Error("Bruger eller database er ikke tilgængelig.");
    }
    
    const userRef = doc(firestore, 'users', user.uid);
    await deleteDoc(userRef);
    await deleteUser(auth.currentUser);
    handleLogout();
  };
  
  const handleResendClick = async () => {
    setIsResending(true);
    await handleResendVerification();
    setIsResending(false);
  };

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

  const tabs = [
    { id: 'profile', label: 'Profil & Uddannelse', icon: User },
    { id: 'membership', label: 'Medlemskab & Adgang', icon: CreditCard },
    { id: 'notifications', label: 'Notifikationer', icon: Bell },
    { id: 'security', label: 'Sikkerhed & Konto', icon: ShieldAlert },
  ] as const;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-32">
      {/* Premium Header Area */}
      <div className="bg-white border-b border-slate-200/60 pt-28 md:pt-32 pb-10 px-6 relative overflow-hidden">
         {/* Minimalist ambient glow */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-amber-200/20 to-transparent rounded-full blur-[80px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
         
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 relative z-10">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-800 shadow-sm shrink-0"
            >
               <Settings className="w-9 h-9" />
            </motion.div>
            <div className="text-center md:text-left">
               <motion.h1 
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1"
               >
                 Indstillinger
               </motion.h1>
               <motion.p 
                 initial={{ y: 10, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.1 }}
                 className="text-[15px] text-slate-500 font-medium"
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
                       <form onSubmit={handleSave} className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 overflow-hidden">
                          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                             <h2 className="text-xl font-bold text-slate-900">Personlig Information</h2>
                             <p className="text-xs font-semibold text-slate-500 mt-1">Opdater dit navn og din uddannelsesstatus.</p>
                          </div>
                          
                          <div className="p-8 space-y-8">
                              {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-2 animate-in fade-in"><ShieldAlert className="w-4 h-4" />{error}</div>}
                              
                              <div className="grid md:grid-cols-2 gap-8">
                                  <div className="space-y-2">
                                      <label htmlFor="username" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Fulde Navn</label>
                                      <div className="relative">
                                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full h-12 pl-11 bg-slate-50 focus:bg-white rounded-xl border-slate-200 font-bold text-slate-900 transition-all focus:ring-2 focus:ring-amber-500/20" />
                                      </div>
                                  </div>

                                  <div className="space-y-2">
                                      <label htmlFor="phoneNumber" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Telefonnummer</label>
                                      <div className="relative">
                                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                          <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full h-12 pl-11 bg-slate-50 focus:bg-white rounded-xl border-slate-200 font-bold text-slate-900 transition-all focus:ring-2 focus:ring-amber-500/20" placeholder="+45 12 34 56 78" />
                                      </div>
                                  </div>
                              </div>

                              <div className="w-full h-[1px] bg-slate-100" />

                              <div className="grid md:grid-cols-2 gap-8">
                                  <div className="space-y-2">
                                      <label htmlFor="profession" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Profession / Studie</label>
                                      <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/30 transition-all">
                                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                          <select id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} className="w-full h-12 pl-11 pr-10 bg-transparent text-sm font-bold text-slate-900 appearance-none outline-none cursor-pointer">
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
                                        <div className="space-y-2">

                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="semester" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Semester</label>
                                            <div className="relative">
                                                <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <Input id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full h-12 pl-11 bg-slate-50 focus:bg-white rounded-xl border-slate-200 font-bold text-slate-900 transition-all focus:ring-2 focus:ring-amber-500/20" placeholder="F.eks. 4. semester" />
                                            </div>
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <label htmlFor="institution" className="text-[11px] font-black uppercase tracking-widest text-slate-400">Uddannelsesinstitution</label>
                                            <div className="relative bg-slate-50 rounded-xl border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500/30 transition-all">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                <select id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} className="w-full h-12 pl-11 pr-10 bg-transparent text-sm font-bold text-slate-900 appearance-none outline-none cursor-pointer">
                                                    <option value="" disabled>Vælg institution...</option>
                                                    {INSTITUTIONS.map(inst => (
                                                        <option key={inst} value={inst}>{inst}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                     </>
                                  )}
                              </div>

                              <div className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between cursor-pointer group" onClick={() => setIsQualified(!isQualified)}>
                                  <div>
                                      <p className="text-sm font-bold text-slate-900">Er du færdiguddannet?</p>
                                      <p className="text-xs font-semibold text-slate-500 mt-0.5">Slå til hvis du har afsluttet dit studie.</p>
                                  </div>
                                  <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isQualified ? 'bg-amber-500' : 'bg-slate-300'}`}>
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

                       {/* Financial Form */}
                       <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm shadow-slate-200/20 overflow-hidden">
                          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><WalletIcon className="w-5 h-5 text-slate-400" /> Udbetalingsinfo</h2>
                             <p className="text-xs font-semibold text-slate-500 mt-1">Sikkert krypteret. Bruges til honorering ved opgaver.</p>
                          </div>
                          <div className="p-8 grid md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">CPR Nummer</label>
                                  <Input placeholder="DDMMYY-XXXX" value={userProfile?.cprNumber ? '••••••-••••' : ''} onChange={async (e) => { const enc = await encryptData(e.target.value); updateDoc(doc(firestore!, 'users', user!.uid), { cprNumber: enc }).then(refetchUserProfile); }} className="w-full h-12 bg-slate-50 rounded-xl font-mono text-center tracking-widest" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Reg. Nr.</label>
                                  <Input placeholder="4 cifre" value={userProfile?.bankReg ? '••••' : ''} onChange={async (e) => { const enc = await encryptData(e.target.value); updateDoc(doc(firestore!, 'users', user!.uid), { bankReg: enc }).then(refetchUserProfile); }} className="w-full h-12 bg-slate-50 rounded-xl font-mono text-center tracking-widest" />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Kontonummer</label>
                                  <Input placeholder="10 cifre" value={userProfile?.bankAccount ? '••••••••' : ''} onChange={async (e) => { const enc = await encryptData(e.target.value); updateDoc(doc(firestore!, 'users', user!.uid), { bankAccount: enc }).then(refetchUserProfile); }} className="w-full h-12 bg-slate-50 rounded-xl font-mono text-center tracking-widest" />
                              </div>
                          </div>
                       </div>
                       
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
                       <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-xl overflow-hidden relative group">
                          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-400/10 rounded-full blur-[80px] -mr-48 -mt-48 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
                          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-8 mb-8">
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80 mb-2 flex items-center gap-2">
                                  <Sparkles className="w-3.5 h-3.5" /> Nuværende Plan
                                </p>
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">{userProfile?.membership || 'Gratis Plan'}</h2>
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

                          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
                              {isSpecialSubscription ? (
                                  <p className="text-sm font-medium text-slate-400 italic">Dette abonnement administreres centralt af din institution.</p>
                              ) : subscriptionWillBeCancelled ? (
                                  <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                                      <p className="text-sm font-bold text-rose-400 flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20">
                                          <CheckCircle className="w-4 h-4"/> Opsagt - udløber snart
                                      </p>
                                      <Link href="/upgrade" className="w-full sm:w-auto ml-auto">
                                          <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 h-11 px-8 rounded-xl font-bold">
                                              Forny Adgang
                                          </Button>
                                      </Link>
                                  </div>
                              ) : (userProfile?.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) ? (
                                  <Link href="/upgrade" className="w-full sm:w-auto">
                                      <Button className="w-full bg-amber-400 text-amber-950 hover:bg-amber-300 h-11 px-8 rounded-xl font-bold shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                                          Opgrader til Kollega+
                                      </Button>
                                  </Link>
                              ) : (
                                  <Button variant="outline" onClick={handleCancelSubscription} disabled={isCancelling} className="w-full sm:w-auto h-11 px-8 border-white/20 bg-transparent text-white hover:bg-white/10 rounded-xl font-bold">
                                      {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                                      Opsig abonnement
                                  </Button>
                              )}
                          </div>
                       </div>

                       {/* Redeem Code */}
                       <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm p-8 flex flex-col md:flex-row gap-8 items-center justify-between">
                           <div className="flex items-start gap-4 flex-1">
                               <div className="w-12 h-12 rounded-[1.2rem] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                                   <Gift className="w-6 h-6" />
                               </div>
                               <div>
                                   <h3 className="text-lg font-bold text-slate-900 mb-1">Indløs Kampagnekode</h3>
                                   <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">Har du modtaget en kode fra dit studie eller en kampagne? Indløs den her for øjeblikkelig premium adgang.</p>
                                   
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
                                    <TooltipContent className="bg-slate-900 text-white p-4 max-w-xs border-none shadow-xl rounded-xl" side="bottom">
                                       <p className="text-xs font-semibold leading-relaxed text-slate-300"><span className="text-white">Sikkerhedslås:</span> Du skal have logget ind inden for de sidste 2 minutter for at slette din konto. Log af og log ind igen for at fortsætte.</p>
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
