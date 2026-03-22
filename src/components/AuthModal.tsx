
'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ShieldCheck, Sparkles, ChevronRight, Gift, Users } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import Link from 'next/link';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, writeBatch, getDoc, query, where, getDocs, collection, increment, updateDoc } from 'firebase/firestore';
import { generateWelcomeEmailAction, createCheckoutSession } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { sendVerificationEmail } from '@/lib/auth-helpers';


import { motion, AnimatePresence } from 'framer-motion';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface PartnerDomainConfig {
    institutionName: string;
    membershipLevel: 'Kollega+' | 'Semesterpakken' | 'Kollega++';
    durationInMonths?: number;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialState?: 'login' | 'signup';
  priceId?: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialState = 'signup', priceId: initialPriceId }) => {
  const [isLogin, setIsLogin] = useState(initialState === 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isGroupsSource = pathname?.startsWith('/rum/groups');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingPriceId, setPendingPriceId] = useState<string | null>(initialPriceId || null);

  useEffect(() => {
    setIsLogin(initialState === 'login');
  }, [initialState]);
  
  useEffect(() => {
    setPendingPriceId(initialPriceId || null);
  }, [initialPriceId]);

  const getRedirectUrl = () => {
    if (isGroupsSource) {
      return '/rum/groups';
    }
    return '/portal';
  };

  const initiateCheckout = async (user: any, priceId: string, userNameForCheckout?: string) => {
    if (!firestore || !auth) return;

    try {
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        const currentStripeCustomerId = userData?.stripeCustomerId || null;
        
        const finalUserName = userNameForCheckout || userData?.username || user.displayName;
        const originPath = `${pathname}${searchParams ? `?${searchParams.toString()}` : ''}`;

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

        await stripe.redirectToCheckout({ sessionId });

    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      setError(`Fejl ved start af betaling: ${error.message}`);
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

    const newUserDoc: any = {
      id: user.uid,
      username: finalUsername,
      email: user.email,
      email_verified: user.emailVerified,
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
      dailyOnlineColleagueCount: 0,
      lastOnlineColleagueUsage: null,
      dailyConceptExplainerCount: 0,
      lastConceptExplainerUsage: null,
      dailyModelGuideCount: 0,
      lastModelGuideUsage: null,
      dailyCaseTrainerCount: 0,
      weeklyCaseTrainerCount: 0,
      lastCaseTrainerUsage: null,
      dailyJournalTrainerCount: 0,
      lastJournalTrainerUsage: null,
      monthlySecondOpinionCount: 0,
      lastSecondOpinionUsage: null,
      notebookAnalysisCount: 0,
      dailyLawPortalCount: 0,
      lastLawPortalUsage: null,
      dailyChallengeStreak: 0,
      lastDailyChallengeDate: null,
      mementoLevels: { theorist: 0, paragraph: 0, method: 0 },
      weeklySynthesisHeatmapCount: 0,
      lastSynthesisHeatmapUsage: null,
      monthlyExamArchitectCount: 0,
      lastExamArchitectUsage: null,
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
    } else if (priceId) {
        await initiateCheckout(user, priceId, finalUsername); 
        return; 
    }
    
    if (user.email) {
      try {
        await generateWelcomeEmailAction({ userName: finalUsername, userEmail: user.email });
      } catch (emailError) {
        console.error('Could not send welcome email:', emailError);
      }
    }
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

      if (isNewUser && firestore) {
        if(!user.emailVerified){
          await sendVerificationEmail(auth, user);
        }
        await handleNewUser(user, pendingPriceId, user.displayName);
        if (!pendingPriceId) {
            window.location.href = getRedirectUrl();
        }
      } else if (pendingPriceId) {
        await initiateCheckout(user, pendingPriceId);
      } else {
        window.location.href = getRedirectUrl();
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Der opstod en fejl under Google login. Prøv venligst igen.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
         if (pendingPriceId) {
          await initiateCheckout(userCredential.user, pendingPriceId);
        } else {
            window.location.href = getRedirectUrl();
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await sendVerificationEmail(auth, user);
        await handleNewUser(user, pendingPriceId, email.split('@')[0]);

        if (!pendingPriceId) {
          window.location.href = getRedirectUrl();
        }
      }
    } catch (err: any) {
       switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          setError('Ugyldig email eller adgangskode.');
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
        default:
          setError('Der opstod en fejl. Prøv venligst igen.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden grid md:grid-cols-2"
          >
            
            <div className="bg-amber-950 p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-12">
                   {isGroupsSource ? <Users className="w-6 h-6 text-amber-500" /> : <Sparkles className="w-6 h-6 text-amber-500" />}
                   <span className="font-bold serif text-2xl">Cohéro {isGroupsSource ? 'Project Group' : ''}</span>
                </div>
                
                <h2 className="text-4xl font-bold serif leading-tight mb-8">
                  {isGroupsSource ? 'Dit faglige samarbejdsrum.' : 'Træn din faglighed. Trygt.'}
                </h2>
                
                <ul className="space-y-6">
                  {(isGroupsSource ? [
                    "Organisér jeres fælles studieprojekter",
                    "Del kilder, links og rådata nemt",
                    "Synkronisér jeres kalendere"
                  ] : [
                    "Øv dig i realistiske AI-genererede cases",
                    "Få feedback på dine journalnotater",
                    "Få komplekse paragraffer forklaret simpelt"
                  ]).map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-white/80 font-medium text-sm">
                      <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative z-10 text-[10px] text-white/40 uppercase tracking-widest font-black">
                {isGroupsSource ? 'Gør studiegruppen professionel' : 'Sammen skaber vi bedre socialrådgivere'}
              </div>
              
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-900 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="p-8 md:p-12 relative flex flex-col justify-center min-h-[500px]">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-amber-950 hover:bg-slate-50 rounded-full transition-colors z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-w-xs mx-auto md:mx-0 w-full relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isLogin ? 'login' : 'signup'}
                    initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-8">
                      <h3 className="text-3xl font-bold text-slate-900 serif mb-2">
                        {isLogin ? 'Velkommen tilbage' : 'Opret konto'}
                      </h3>
                      <p className="text-slate-500 text-sm font-medium">
                        {isGroupsSource 
                          ? (isLogin ? 'Log ind for at fortsætte i din gruppe.' : 'Opret en konto for at starte jeres samarbejde.')
                          : (pendingPriceId ? `Opret din konto for at fuldføre dit køb.` : 'Opret en gratis konto for at komme i gang.')}
                      </p>
                    </div>

                    <button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full mb-6 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-[1.25rem] font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center group"
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

                    <div className="flex items-center my-6 hidden">
                        <hr className="flex-grow border-slate-100"/>
                        <span className="mx-4 text-[10px] font-black tracking-widest uppercase text-slate-300">ELLER</span>
                        <hr className="flex-grow border-slate-100"/>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input type="hidden" name="pendingPriceId" value={pendingPriceId || ''} />
                      
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                        <input 
                          type="email" 
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm h-14 font-medium text-slate-900"
                          required
                        />
                      </div>

                      <div className="relative group">
                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                        <input 
                          type="password" 
                          placeholder="Vælg adgangskode"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-amber-950/5 focus:border-amber-950 transition-all text-sm h-14 font-medium text-slate-900"
                          required
                        />
                      </div>

                      {error && (
                         <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-rose-600 font-bold bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 text-center">
                           {error}
                         </motion.p>
                      )}

                      <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 !mt-6 bg-amber-950 text-white rounded-[1.25rem] font-black uppercase tracking-[0.1em] text-xs hover:bg-amber-900 transition-colors disabled:opacity-70 flex items-center justify-center group shadow-xl shadow-amber-950/20 active:scale-[0.98]"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            {pendingPriceId ? 'Opret & Fortsæt' : (isLogin ? 'Log ind' : 'Opret profil')}
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </form>

                    <div className="mt-8 text-center md:text-left pt-6 border-t border-slate-100">
                      <p className="text-[11px] text-slate-400 mb-4 font-medium">
                         {!isLogin && <>Ved at oprette dig accepterer du vores <Link href="/terms-of-service" className="text-slate-600 hover:text-amber-950 underline decoration-slate-300">handelsbetingelser</Link> og vores <Link href="/etik" className="text-slate-600 hover:text-amber-950 underline decoration-slate-300">retningslinjer for etik</Link>.</>}
                      </p>
                      <button 
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setError(null);
                        }}
                        className="text-sm font-bold text-amber-950 hover:underline"
                        type="button"
                      >
                        {isLogin ? 'Ny her? Opret en konto' : 'Har du allerede en konto? Log ind'}
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
