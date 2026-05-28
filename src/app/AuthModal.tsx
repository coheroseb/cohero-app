'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ShieldCheck, Sparkles, ChevronRight, Gift, Loader2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch, getDoc, query, where, getDocs, collection, increment, updateDoc } from 'firebase/firestore';
import { generateWelcomeEmailAction, createCheckoutSession, sendPasswordResetEmailAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { sendVerificationEmail } from '@/lib/auth-helpers';
import { useApp } from '@/app/provider';


const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PartnerDomainConfig {
    institutionName: string;
    membershipLevel: 'Kollega+' | 'Semesterpakken' | 'Kollega+';
    durationInMonths?: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialState?: 'login' | 'signup';
  priceId?: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialState = 'signup', priceId: initialPriceId }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialState === 'login' ? 'login' : 'signup');
  const [loading, setLoading] = useState(false);
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { user, userProfile, refetchUserProfile } = useApp();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(initialPriceId || null);

  useEffect(() => {
    setMode(initialState === 'login' ? 'login' : 'signup');
  }, [initialState]);
  
  useEffect(() => {
    setPendingPriceId(initialPriceId || null);
  }, [initialPriceId]);

  // Handle redirection/closing only when profile is actually loaded
  useEffect(() => {
    if (isOpen && isWaitingForProfile && user && userProfile !== undefined) {
      if (pendingPriceId) {
        initiateCheckout(user, pendingPriceId);
      } else {
        const callbackUrl = searchParams?.get('callbackUrl');
        router.push(callbackUrl || '/portal');
        onClose();
      }
      setIsWaitingForProfile(false);
      setLoading(false);
    }
  }, [user, userProfile, isWaitingForProfile, isOpen, pendingPriceId, router, searchParams, onClose]);

  if (!isOpen) return null;

  const initiateCheckout = async (user: any, priceId: string, userNameForCheckout?: string) => {
    if (!firestore) return;

    try {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const currentStripeCustomerId = userData?.stripeCustomerId || null;
        
        const finalUserName = userNameForCheckout || userData?.username || user.displayName;
        const originPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;


        const { sessionId, stripeCustomerId: newStripeCustomerId } = await createCheckoutSession({
            priceId,
            userId: user.uid,
            userEmail: user.email,
            userName: finalUserName,
            stripeCustomerId: currentStripeCustomerId,
            originPath: originPath,
        });

        if (newStripeCustomerId && newStripeCustomerId !== currentStripeCustomerId) {
            await setDoc(userRef, { stripeCustomerId: newStripeCustomerId }, { merge: true });
        }

        const stripe = await stripePromise;
        if (!stripe) throw new Error('Stripe.js has not loaded yet.');
        if (!sessionId) throw new Error('Failed to create a valid checkout session.');

        await stripe.redirectToCheckout({ sessionId });

    } catch (error: any) {
        console.error('Failed to create checkout session:', error);
        setError(`Fejl ved start af betaling: ${error.message}`);
        setLoading(false);
        setIsWaitingForProfile(false);
    }
  };
  
  const handleNewUser = async (user: any, priceId?: string | null, displayName?: string | null) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    const userRef = doc(firestore, 'users', user.uid);
    
    let partnerConfig: PartnerDomainConfig | null = null;
    if (user.email) {
      const domain = user.email.substring(user.email.lastIndexOf('@') + 1);
      const partnerDocRef = doc(firestore, 'partnerDomains', domain);
      const partnerDocSnap = await getDoc(partnerDocRef);
      if (partnerDocSnap.exists()) {
        partnerConfig = partnerDocSnap.data() as PartnerDomainConfig;
      }
    }
    
    const finalUsername = displayName || user.displayName || 'Ny Bruger';

    const termsRef = doc(firestore, 'globalConfigs', 'terms');
    const termsSnap = await getDoc(termsRef);
    const latestTermsVersion = termsSnap.exists() ? (termsSnap.data()?.version || '1.0.0') : '1.0.0';

    const newUserDoc: any = {
      id: user.uid,
      username: finalUsername,
      email: user.email,
      email_verified: user.emailVerified,
      acceptedTermsVersion: latestTermsVersion,
      acceptedTermsAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      profilePicture: user.photoURL || '',
      bio: '',
      membership: partnerConfig ? partnerConfig.membershipLevel : (priceId ? 'Temp' : 'Kollega'),
      stripePriceId: partnerConfig ? `b2b-${user.email?.split('@')[1]}` : null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeCancelAtPeriodEnd: false,
      stripeCurrentPeriodEnd: null,
      stripeSubscriptionStatus: null,
      semester: '',
      institution: '',
      profession: '',
      isQualified: false,
      badges: [],
      cohéroPoints: 0,
      role: 'user',
      dailyTokenCount: 0,
      lastTokenUsage: null,
      monthlyInputTokens: 0,
      monthlyOutputTokens: 0,
      monthlyTokenTimestamp: null,
      isHighUsage: false,
    };

    if (partnerConfig?.durationInMonths) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + partnerConfig.durationInMonths);
        newUserDoc.stripeCurrentPeriodEnd = expiryDate.toISOString();
    }

    batch.set(userRef, newUserDoc);
    await batch.commit();

    if (partnerConfig) {
      toast({
        title: `Velkommen fra ${partnerConfig.institutionName}!`,
        description: `Din konto er automatisk blevet opgraderet til ${partnerConfig.membershipLevel}, da din uddannelsesinstitution har en aftale med os.`,
        duration: 10000,
      });
    }
    
    if (user.email) {
      try {
        await generateWelcomeEmailAction({ userName: finalUsername, userEmail: user.email });
      } catch (emailError) {
        console.error('Could not send welcome email:', emailError);
      }
    }

    // Now set the waiting flag so useEffect can handle final redirect/close
    setIsWaitingForProfile(true);
  };


  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);
      const isNewUser = !!additionalUserInfo?.isNewUser;

      if (isNewUser) {
        if(!user.emailVerified){
          await sendVerificationEmail(auth, user);
        }
        await handleNewUser(user, pendingPriceId, user.displayName);
      } else {
        setIsWaitingForProfile(true);
      }

    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Der opstod en fejl under Google login. Prøv venligst igen.');
      }
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!auth) return;
    setLoading(true);
    setError(null);
    const provider = new OAuthProvider('apple.com');
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);
      const isNewUser = !!additionalUserInfo?.isNewUser;

      if (isNewUser) {
        if(!user.emailVerified){
          await sendVerificationEmail(auth, user);
        }
        await handleNewUser(user, pendingPriceId, user.displayName || user.email?.split('@')[0] || 'Ny Bruger');
      } else {
        setIsWaitingForProfile(true);
      }

    } catch (err: any) {
      console.error('Apple sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Der opstod en fejl under Apple login. Prøv venligst igen.');
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        setIsWaitingForProfile(true);
      } else if (mode === 'forgot') {
        const res = await sendPasswordResetEmailAction({ userEmail: email });
        if (!res.success) throw new Error(res.message);
        setSuccess("Vi har sendt en e-mail til dig med instruktioner om, hvordan du nulstiller din adgangskode.");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendVerificationEmail(auth, user);
        await handleNewUser(user, pendingPriceId, email.split('@')[0]);
      }
    } catch (err: any) {
      if (err.message && !err.code) {
        setError(err.message);
      } else {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
            setError(mode === 'forgot' ? 'Ingen bruger fundet med denne email.' : 'Ugyldig email eller adgangskode.');
            break;
          case 'auth/wrong-password':
            setError('Forkert adgangskode.');
            break;
          case 'auth/email-already-in-use':
            setError('Emailen er allerede i brug.');
            break;
          case 'auth/weak-password':
            setError('Adgangskoden skal være på mindst 6 tegn.');
            break;
          case 'auth/invalid-email':
            setError('Ugyldig email adresse.');
            break;
          default:
            setError('Der opstod en fejl. Prøv venligst igen.');
            break;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-[#FDFCF8] w-full max-w-4xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden grid md:grid-cols-2 max-h-[95vh] overflow-y-auto sm:overflow-hidden animate-fade-in-up">
        
        <div className="bg-amber-950 p-8 sm:p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
               <Sparkles className="w-6 h-6 text-amber-400" />
               <span className="font-bold serif text-2xl">Cohéro</span>
            </div>
            <h2 className="text-4xl font-bold serif leading-tight mb-8">
              Træn din faglighed. Trygt.
            </h2>
            <ul className="space-y-6">
              {[
                "Øv dig i realistiske AI-genererede cases",
                "Få feedback på dine journalnotater",
                "Få komplekse paragraffer forklaret simpelt"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-amber-100/70 font-medium">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 text-xs text-amber-100/40 uppercase tracking-widest font-bold">
            Sammen skaber vi bedre socialrådgivere
          </div>
          
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-900 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="p-6 sm:p-8 md:p-12 relative flex flex-col justify-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 text-amber-900/40 hover:text-amber-900 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-xs mx-auto md:mx-0 w-full">
            <div className="mb-8 sm:mb-10 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold text-amber-950 serif mb-2">
                {mode === 'login' ? 'Velkommen tilbage' : mode === 'signup' ? 'Opret konto' : 'Glemt adgangskode?'}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed italic">
                {mode === 'forgot' 
                  ? 'Indtast din e-mail for at modtage et link til at nulstille din adgangskode.'
                  : pendingPriceId ? `Opret din konto for at fuldføre dit køb.` : 'Opret en gratis konto for at komme i gang.'}
              </p>
            </div>

            {mode !== 'forgot' && (
              <div className="flex flex-col gap-3 mb-4">
                <button
                   onClick={handleGoogleSignIn}
                   disabled={loading}
                   className="w-full py-3 sm:py-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center justify-center group h-12 sm:h-14"
                >
                   {loading ? (
                     <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                         <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                         <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                         <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                         <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.02,35.636,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                       </svg>
                       Fortsæt med Google
                     </>
                   )}
                </button>

                <button
                   onClick={handleAppleSignIn}
                   disabled={loading}
                   className="w-full py-3 sm:py-4 bg-slate-900 text-white hover:bg-black rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center group h-12 sm:h-14 shadow-sm"
                >
                   {loading ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                     <>
                       <svg className="w-5 h-5 mr-3 fill-current" viewBox="0 0 24 24">
                         <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.04 0-1.37-.62-2.52-.62-1.15 0-1.52.6-2.52.64-1.04.04-2.23-1-3.23-1.95-2.03-1.93-3.58-5.46-3.58-8.77 0-5.26 3.42-8.04 6.78-8.04 1.06 0 2.06.66 2.72.66.65 0 1.9-.8 3.19-.8 1.34 0 2.58.48 3.38 1.4-2.82 1.7-2.38 5.68.83 6.98-1.08 2.65-2.55 5.25-3.57 6.62zM12.03 5.07c1.38-1.68 2.3-4.02 2.05-6.07-2.05.08-4.53 1.36-6 3.08-1.27 1.48-2.38 3.86-2.09 5.87 2.27.17 4.67-1.2 6.04-2.88z"/>
                       </svg>
                       Fortsæt med Apple
                     </>
                   )}
                </button>
              </div>
            )}

            {mode !== 'forgot' && (
              <div className="flex items-center my-6">
                  <hr className="flex-grow border-amber-100/80"/>
                  <span className="mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Eller</span>
                  <hr className="flex-grow border-amber-100/80"/>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="pendingPriceId" value={pendingPriceId || ''} />
              
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border-amber-100 rounded-xl focus:ring-2 focus:ring-amber-900 focus:outline-none transition-all text-sm h-12"
                  required
                />
              </div>

              {mode !== 'forgot' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder={mode === 'login' ? "Din adgangskode" : "Vælg adgangskode"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-amber-100 rounded-xl focus:ring-2 focus:ring-amber-900 focus:outline-none transition-all text-sm h-12"
                    required
                  />
                </div>
              )}

              {error && <p className="text-[10px] text-rose-600 font-bold text-center pt-2">{error}</p>}
              {success && <p className="text-[10px] text-emerald-600 font-bold text-center pt-2">{success}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-amber-950 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-950 shadow-xl shadow-amber-950/10 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center group !mt-6 h-14"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{mode === 'forgot' ? 'Send nulstillingslink' : pendingPriceId ? 'Opret & Fortsæt' : (mode === 'login' ? 'Log ind' : 'Opret min profil')}</span>
                    <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center md:text-left flex flex-col gap-3">
              {mode === 'signup' && (
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                   Ved at oprette dig accepterer du vores <Link href="/terms-of-service" className="underline hover:text-amber-800">handelsbetingelser</Link> og vores <Link href="/etik" className="underline hover:text-amber-800">retningslinjer for etik</Link>.
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <button 
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-amber-900 hover:underline text-left"
                  type="button"
                >
                  {mode === 'login' ? 'Ny her? Opret en konto' : 'Har du allerede en konto? Log ind'}
                </button>
                
                {mode === 'login' && (
                  <button
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 text-left sm:text-right"
                    type="button"
                  >
                    Glemt adgangskode?
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
