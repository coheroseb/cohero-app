'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { useAuth, useFirestore } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { Settings, User, CreditCard, Loader2, CheckCircle, ArrowUpRight, Gift, ChevronDown, ShieldAlert, Users2, Send, Info, Award, Sparkles, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cancelSubscription } from '@/app/actions';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { deleteUser, updateProfile } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { requestNotificationPermission } from '@/firebase/messaging';
import { encryptData, decryptData } from '@/lib/encryption';


export default function SettingsPage() {
  const { user, userProfile, refetchUserProfile, handleLogout, handleResendVerification } = useApp();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

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

    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', user.uid);

      batch.update(userRef, {
        username: capitalizedUsername,
        phoneNumber: phoneNumber.trim(),
        semester: isQualified ? '' : semester,
        institution: isQualified ? '' : institution,
        profession: profession,
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

    // This is a security-sensitive operation and might require recent sign-in.
    // The modal handles the specific error message for this.
    await deleteUser(auth.currentUser);

    // This logs out and redirects to home
    handleLogout();
  };
  
  const handleResendClick = async () => {
    setIsResending(true);
    await handleResendVerification();
    setIsResending(false);
  };


  if (!userProfile) {
     return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className='text-slate-500 mt-4'>Henter indstillinger...</p>
      </div>
    );
  }

  const subscriptionWillBeCancelled = userProfile?.stripeCancelAtPeriodEnd === true;
  const isSpecialSubscription = userProfile?.stripePriceId?.startsWith('b2b-') || userProfile?.stripePriceId?.startsWith('redeemed-');


  return (
    <div className="bg-[#FDFCF8] min-h-screen selection:bg-amber-100">
      <header className="bg-white border-b border-amber-100 px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 text-slate-600 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-inner">
              <Settings className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-950 serif leading-tight tracking-tight">
                Indstillinger
              </h1>
              <p className="text-sm sm:text-base text-slate-500 mt-1 italic font-medium">
                Administrer din profil, dannelse og dit medlemskab.
              </p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 sm:space-y-16 pb-32">
        {!user?.emailVerified && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-900 p-6 sm:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm animate-ink">
            <div className="flex items-start gap-4">
              <ShieldAlert className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
              <div className="text-center md:text-left">
                <h3 className="font-bold text-lg">Bekræft din e-mailadresse</h3>
                <p className="text-sm mt-1 opacity-80 leading-relaxed">
                  For at sikre din konto og modtage vigtige opdateringer, bedes du bekræfte din e-mail.
                </p>
              </div>
            </div>
            <Button onClick={handleResendClick} disabled={isResending} variant="outline" className="w-full md:w-auto bg-white/50 h-12 px-8 rounded-xl shrink-0">
              {isResending ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Send className="w-4 h-4 mr-2"/>}
              {isResending ? 'Sender...' : 'Gensend link'}
            </Button>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100/60 shadow-sm space-y-10 animate-ink">
          <div className="flex items-center gap-4 border-b border-amber-50 pb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 serif">Din Profil</h2>
          </div>

          {error && <p className="text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 font-medium">{error}</p>}
          
          <div className="grid gap-8">
            <div>
                <label htmlFor="username" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Brugernavn</label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full h-12 rounded-xl focus:ring-amber-900/5 transition-all" />
            </div>

            <div>
                <label htmlFor="phoneNumber" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Telefonnummer (til opgaver)</label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full h-12 rounded-xl focus:ring-amber-900/5 transition-all" placeholder="Eks. +45 12 34 56 78" />
            </div>

            <div>
                <label htmlFor="profession" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Profession</label>
                <div className="relative group">
                    <select id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} className="appearance-none flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950/20 disabled:cursor-not-allowed disabled:opacity-50 pr-10 cursor-pointer">
                        <option value="" disabled>Vælg profession...</option>
                        <option value="Socialrådgiver">Socialrådgiver</option>
                        <option value="Pædagog">Pædagog</option>
                        <option value="Lærer">Lærer</option>
                        <option value="Sygeplejerske">Sygeplejerske</option>
                        <option value="Andet">Andet</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-amber-950 transition-colors" />
                </div>
            </div>

            {!isQualified && (
                <div className="grid sm:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="semester" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Semester</label>
                        <Input id="semester" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full h-12 rounded-xl" placeholder="f.eks. 4. semester" />
                    </div>
                    <div>
                        <label htmlFor="institution" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Uddannelsesinstitution</label>
                        <div className="relative group">
                            <select id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} className="appearance-none flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950/20 disabled:cursor-not-allowed disabled:opacity-50 pr-10 cursor-pointer">
                                <option value="" disabled>Vælg institution...</option>
                                <option value="Københavns Professionshøjskole">Københavns Professionshøjskole</option>
                                <option value="VIA University College">VIA University College</option>
                                <option value="UC SYD">UC SYD</option>
                                <option value="UCL Erhvervsakademi og Professionshøjskole">UCL Erhvervsakademi og Professionshøjskole</option>
                                <option value="Professionshøjskolen Absalon">Professionshøjskolen Absalon</option>
                                <option value="UCN">UCN</option>
                                <option value="Aalborg Universitet">Aalborg Universitet</option>
                                <option value="Andet">Andet</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-amber-950 transition-colors" />
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
              <input
                  id="isQualified"
                  type="checkbox"
                  checked={isQualified}
                  onChange={(e) => setIsQualified(e.target.checked)}
                  className="h-5 w-5 rounded-lg border-amber-300 bg-white text-amber-600 focus:ring-amber-500 cursor-pointer"
                  disabled={!profession}
              />
              <label htmlFor="isQualified" className={`text-sm font-bold cursor-pointer ${!profession ? 'text-slate-400' : 'text-amber-950'}`}>
                  Jeg er færdiguddannet {profession ? profession.toLowerCase() : '...'}
              </label>
          </div>

          <div className="flex items-center gap-4 border-b border-amber-50 pb-6 pt-10">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 serif">Finansiel Info (Udbetaling)</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="sm:col-span-1">
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">CPR Nummer</label>
                <Input 
                    placeholder="DDMMYY-XXXX" 
                    value={userProfile?.cprNumber ? '••••••-••••' : ''} 
                    onChange={async (e) => {
                        const encrypted = await encryptData(e.target.value);
                        updateDoc(doc(firestore!, 'users', user!.uid), { cprNumber: encrypted }).then(() => refetchUserProfile());
                    }}
                    className="w-full h-12 rounded-xl"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Registreringsnr.</label>
                <Input 
                    placeholder="4 cifre" 
                    value={userProfile?.bankReg ? '••••' : ''} 
                    onChange={async (e) => {
                        const encrypted = await encryptData(e.target.value);
                        updateDoc(doc(firestore!, 'users', user!.uid), { bankReg: encrypted }).then(() => refetchUserProfile());
                    }}
                    className="w-full h-12 rounded-xl"
                />
            </div>
            <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-3 px-1">Kontonummer</label>
                <Input 
                    placeholder="Op til 10 cifre" 
                    value={userProfile?.bankAccount ? '••••••••' : ''} 
                    onChange={async (e) => {
                        const encrypted = await encryptData(e.target.value);
                        updateDoc(doc(firestore!, 'users', user!.uid), { bankAccount: encrypted }).then(() => refetchUserProfile());
                    }}
                    className="w-full h-12 rounded-xl"
                />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-amber-50">
            {success && <div className="flex items-center gap-2 text-sm font-bold text-emerald-600"><CheckCircle className="w-4 h-4"/> Indstillinger gemt</div>}
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto h-12 px-10 rounded-xl shadow-lg shadow-amber-950/10 active:scale-95 transition-all">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
              {isLoading ? 'Gemmer...' : 'Gem ændringer'}
            </Button>
          </div>
        </form>

        <section className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100/60 shadow-sm space-y-10 animate-ink">
          <div className="flex items-center gap-4 border-b border-amber-50 pb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 serif">Notifikationer</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100">
              <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${notificationStatus === 'granted' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {notificationStatus === 'granted' ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                  </div>
                  <div className="text-center md:text-left">
                      <h3 className="font-bold text-amber-950">Push-notifikationer</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {notificationStatus === 'granted' 
                            ? 'Du har slået notifikationer til på denne enhed.' 
                            : notificationStatus === 'denied'
                            ? 'Du har blokeret notifikationer. Tjek dine browserindstillinger.'
                            : notificationStatus === 'unsupported'
                            ? 'Denne browser understøtter ikke push-notifikationer.'
                            : 'Modtag push-beskeder om nye analyser og case-opdateringer.'
                          }
                      </p>
                  </div>
              </div>
              
              {(notificationStatus === 'default' || notificationStatus === 'granted') && (
                  <Button 
                    onClick={handleEnableNotifications} 
                    disabled={isRequestingNotifications}
                    className="w-full md:w-auto h-12 px-8 rounded-xl shrink-0 shadow-lg active:scale-95 transition-all"
                  >
                      {isRequestingNotifications ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bell className="w-4 h-4 mr-2" />}
                      {notificationStatus === 'granted' ? 'Opdater token' : 'Slå til'}
                  </Button>
              )}
          </div>
        </section>

        <section className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100/60 shadow-sm space-y-8 animate-ink">
            <div className="flex items-center gap-4 border-b border-amber-50 pb-6">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                    <Award className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-amber-950 serif">Dine Mærkater</h2>
            </div>
            {userProfile?.badges && userProfile.badges.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                {userProfile.badges.map((badge: string) => (
                    <span key={badge} className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl shadow-sm">
                    {badge}
                    </span>
                ))}
                </div>
            ) : (
                <div className="py-10 text-center border-2 border-dashed border-amber-50 rounded-3xl">
                    <p className="text-sm text-slate-400 italic">Du har endnu ikke modtaget nogen mærkater. <br/> Fortsæt dit arbejde i Case-træneren for at optjene dem.</p>
                </div>
            )}
        </section>

        <section className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100/60 shadow-sm space-y-10 animate-ink">
          <div className="flex items-center gap-4 border-b border-amber-50 pb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 serif">Dit Medlemskab</h2>
          </div>

          <div className="bg-amber-950 text-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase text-amber-400 tracking-[0.2em] mb-2">Nuværende plan</p>
                    <p className="text-3xl sm:text-4xl font-bold serif leading-none">{userProfile?.membership}</p>
                    {partnerInstitution && (
                      <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-amber-100/60 font-medium text-xs">
                        <Users2 className="w-3.5 h-3.5" />
                        <span>Aftale med {partnerInstitution}</span>
                      </div>
                    )}
                </div>
                {userProfile?.stripeCurrentPeriodEnd && (
                    <div className="text-center md:text-right bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                        <p className="text-[9px] font-black uppercase text-amber-400/60 tracking-widest mb-1.5">
                            {isSpecialSubscription || subscriptionWillBeCancelled ? 'Adgang udløber' : 'Næste fornyelse'}
                        </p>
                        <p className="text-base font-bold text-white">
                            {new Date(userProfile.stripeCurrentPeriodEnd).toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                )}
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-amber-50">
            {isSpecialSubscription ? (
                <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-50 px-4 py-2 rounded-xl italic">
                    <Info className="w-4 h-4"/>
                    Abonnement administreres af din uddannelsesinstitution
                </div>
            ) : subscriptionWillBeCancelled ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto">
                  <p className="text-sm font-bold text-rose-600 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4"/> Abonnement opsagt
                  </p>
                  <Link href="/upgrade" className="w-full sm:w-auto">
                    <Button variant="default" className="w-full sm:w-auto px-8 rounded-xl h-12 shadow-lg shadow-amber-950/10 active:scale-95 group">
                      Forny adgang
                      <ArrowUpRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Button>
                  </Link>
                </div>
            ) : (userProfile?.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) ? (
                <Link href="/upgrade" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto px-10 h-12 rounded-xl shadow-xl shadow-amber-950/10 group">
                        Opgrader til Kollega+
                        <Sparkles className="w-4 h-4 ml-2 text-amber-400" />
                    </Button>
                </Link>
             ) : (
                <Button onClick={handleCancelSubscription} disabled={isCancelling} variant="destructive" className="w-full sm:w-auto px-8 h-12 rounded-xl active:scale-95 transition-all">
                    {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
                    Opsig abonnement
                </Button>
             )}
          </div>
        </section>
        
        <form onSubmit={handleRedeemCode} className="bg-white p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border border-amber-100/60 shadow-sm space-y-8 animate-ink">
          <div className="flex items-center gap-4 border-b border-amber-50 pb-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 shadow-inner">
                <Gift className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-amber-950 serif">Indløs kode</h2>
          </div>

          {redeemStatus && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-fade-in-up ${redeemStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {redeemStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                {redeemStatus.message}
            </div>
          )}

          <div className="space-y-4">
            <label htmlFor="redemption-code" className="block text-[10px] font-black uppercase tracking-widest text-amber-900/40 px-1">Kampagnekode eller Partner-kode</label>
            <div className="flex flex-col sm:flex-row gap-4">
                <Input 
                    id="redemption-code" 
                    value={redemptionCode} 
                    onChange={(e) => setRedemptionCode(e.target.value)} 
                    className="flex-1 h-14 rounded-2xl font-mono tracking-widest text-center sm:text-left focus:ring-amber-950/10" 
                    placeholder="F.eks. SEMESTERSTART25" 
                />
                <Button type="submit" disabled={isRedeeming || !redemptionCode} className="h-14 px-10 rounded-2xl shadow-lg active:scale-95 transition-all">
                    {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Indløs'}
                </Button>
            </div>
          </div>
        </form>

        <section className="bg-rose-50/50 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] border-2 border-dashed border-rose-200 shadow-sm space-y-8 animate-ink">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-rose-600 rounded-2xl flex items-center justify-center shadow-sm border border-rose-100">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-rose-950 serif">Farezone</h2>
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-widest">Sikkerheds-indstillinger</p>
                </div>
            </div>
            <p className="text-sm text-rose-900/70 leading-relaxed font-medium">
              Ved at slette din konto fjerner du permanent al din data fra Cohéro, inklusiv dine refleksioner, byggeplaner og optjente point. <strong className="text-rose-900">Dette kan ikke fortrydes.</strong>
            </p>
            <div className="flex justify-end pt-6 border-t border-rose-200/50">
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                      <div className="w-full sm:w-auto" tabIndex={isRecentLogin ? undefined : 0}>
                          <Button
                              variant="destructive"
                              onClick={() => setIsDeleteModalOpen(true)}
                              disabled={!isRecentLogin || isDeleting}
                              className="w-full sm:w-auto h-12 px-8 rounded-xl active:scale-95 transition-all"
                          >
                              Slet min konto permanent
                          </Button>
                      </div>
                  </TooltipTrigger>
                  {!isRecentLogin && (
                      <TooltipContent className="bg-amber-950 text-white p-4 max-w-xs" side="top">
                          <p className="text-xs leading-relaxed">Af sikkerhedshensyn skal du have logget ind inden for de sidste 2 minutter for at slette din konto. Log venligst ud og ind igen.</p>
                      </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
        </section>
      </main>

       <DeleteAccountModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        username={userProfile?.username || ''}
      />
    </div>
  );
}
