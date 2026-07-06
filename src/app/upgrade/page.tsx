'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ShieldAlert,
  ArrowUpRight,
  Loader2,
  Zap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Crown,
  Lock,
  MessageSquare,
  Building,
  HelpCircle
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : Promise.resolve(null);

const getPriceId = (envValue: string | undefined, fallback: string) => {
  if (!envValue || envValue === 'undefined' || envValue === 'null' || envValue.trim() === '') {
    return fallback;
  }
  return envValue;
};

const PRICE_IDS = {
  PLUS: getPriceId(process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID, 'price_1SvHSKPzEHK36eTSIFYtGJxD'),
  SEMESTER: getPriceId(process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID, 'price_1SvHTOPzEHK36eTSoiTu8m3C'),
};

const fadeIn = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

const UpgradePageContent: React.FC = () => {
  const { user, userProfile } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCentralized = useMemo(() => userProfile?.stripePriceId?.startsWith('b2b-') || userProfile?.stripePriceId?.startsWith('redeemed-'), [userProfile]);

  const handleSubscription = async (priceId: string | undefined) => {
    if (!priceId) {
        setError('Pris-ID er ikke tilgængeligt. Prøv venligst igen senere.');
        return;
    }
    if (!user || !userProfile || !firestore) {
        router.push('/auth?mode=signup');
        return;
    }

    setIsSubscribing(priceId);
    setError(null);

    try {
        const currentStripeCustomerId = userProfile.stripeCustomerId || undefined;
        const originPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

        const result = await createCheckoutSession({
            priceId,
            userId: user.uid,
            userEmail: user.email || undefined,
            userName: userProfile.username || user.displayName || undefined,
            stripeCustomerId: currentStripeCustomerId,
            originPath: originPath,
        });

        if (!result.success) {
            setError(`Der opstod en fejl: ${result.error}`);
            setIsSubscribing(null);
            return;
        }

        const { sessionId, stripeCustomerId: newStripeCustomerId } = result;

        if (newStripeCustomerId && newStripeCustomerId !== currentStripeCustomerId) {
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { stripeCustomerId: newStripeCustomerId }, { merge: true });
        }

        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error('Stripe.js er ikke indlæst.');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId: sessionId! });

        if (stripeError) {
            console.error('Stripe error:', stripeError);
            setError(`Fejl ved checkout: ${stripeError.message}`);
        }
    } catch (e: any) {
        console.error('Subscription error:', e);
        setError(`Der opstod en fejl: ${e.message}`);
    } finally {
        setIsSubscribing(null);
    }
  };

  const isSuccess = searchParams?.get('success') === 'true';

  if (isCentralized) {
    return (
      <div className="bg-slate-50/60 min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 md:p-14 rounded-[var(--radius-lg)] border border-slate-200/60 shadow-[var(--shadow-md)] max-w-lg w-full text-center space-y-6 relative z-10"
          >
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                 <ShieldAlert className="w-7 h-7" />
               </div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Central Aftale Aktiv
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Dit Cohéro-medlemskab administreres i øjeblikket centralt gennem din uddannelsesinstitution eller kommune. Du har allerede ubegrænset prioriteret adgang.
                </p>
               <button
                 onClick={() => router.push('/portal')}
                 className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm"
               >
                  Gå til portalen
               </button>
          </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-slate-50/60 min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 md:p-14 rounded-[var(--radius-lg)] border border-slate-200/60 shadow-[var(--shadow-md)] max-w-lg w-full text-center space-y-6 relative z-10"
          >
               <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                 <Sparkles className="w-7 h-7" />
               </div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Velkommen til Cohéro+! 🎉
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Tusind tak for din opgradering! Din konto er nu udvidet med fuld adgang til alle platformens avancerede værktøjer med det samme.
                </p>
               <button
                 onClick={() => router.push('/portal')}
                 className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm"
               >
                  Kom i gang med det samme
               </button>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen pb-32 font-sans text-slate-900 selection:bg-indigo-100">
      
      {error && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-rose-50 text-rose-600 px-6 py-4 rounded-xl border border-rose-200 shadow-lg flex items-center gap-3">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-bold text-xs">{error}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-10">
        <PageHeader
          title="Opgrader din profil"
          subtitle="Vælg den plan, der bedst understøtter din studie- og arbejdsform."
          icon={<Crown className="w-5 h-5" />}
          backHref="/portal"
        />

        {/* Pricing Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-stretch">
          
          {/* Kollega (Free) */}
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white border border-slate-200/60 rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-sm)] flex flex-col justify-between"
          >
             <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Kollega</h3>
                  <p className="label-xs text-slate-400 mt-1">Fundamentet</p>
                </div>
                
                <div className="py-4 border-y border-slate-100">
                  <div className="text-3xl font-black text-slate-900">0 kr. <span className="text-xs text-slate-400 font-medium">/ md</span></div>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Adgang til Lovportalen",
                    "Begrebsguide (1 opslag/dag)",
                    "Studie-Arkitekt (1 opgave/md)",
                    "STAR-analyse (1 analyse/dag)",
                    "Journal-træning (1 ugentlig)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                      <Check className="w-4 h-4 text-slate-300 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
             </div>
             
             <div className="w-full mt-8 py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs text-center border border-slate-100">
                Nuværende plan
             </div>
          </motion.div>

          {/* Kollega+ (Pro) */}
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="relative bg-slate-900 text-white border border-slate-800 rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-lg)] flex flex-col justify-between overflow-hidden"
          >
             {/* Premium Background Glow */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
             
             <div className="absolute top-6 right-6 bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                Mest Populær
             </div>

             <div className="space-y-6 relative z-10">
                <div>
                  <h3 className="text-lg font-black text-white">Kollega+</h3>
                  <p className="label-xs text-indigo-400 mt-1">Ubegrænset adgang</p>
                </div>
                
                <div className="py-4 border-y border-white/5">
                  <div className="text-3xl font-black text-white">89 kr. <span className="text-xs text-slate-500 font-medium">/ md</span></div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">7 dages gratis prøveperiode</p>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Alt i gratis-versionen",
                    "Ubegrænset Studie-Arkitekt",
                    "Ubegrænset Lovportal-søgning",
                    "Ubegrænset STAR-analyse",
                    "Ubegrænset Journal-træner",
                    "Prioriteret support"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                      <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
             </div>

             <button
               onClick={() => handleSubscription(PRICE_IDS.PLUS)}
               disabled={isSubscribing === PRICE_IDS.PLUS}
               className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
             >
                {isSubscribing === PRICE_IDS.PLUS ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Aktiver prøveperiode <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
             </button>
          </motion.div>

          {/* Semesteret (Pack) */}
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="bg-white border border-slate-200/60 rounded-[var(--radius-lg)] p-8 shadow-[var(--shadow-sm)] flex flex-col justify-between"
          >
             <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Semesterpakken</h3>
                  <p className="label-xs text-emerald-600 mt-1">Engangsbetaling</p>
                </div>
                
                <div className="py-4 border-y border-slate-100">
                  <div className="text-3xl font-black text-slate-900">329 kr. <span className="text-xs text-slate-400 font-medium">/ engangs</span></div>
                  <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Spar over 25%</p>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Alt fra Kollega+ i 5 måneder",
                    "Ingen løbende abonnement",
                    "Det mest økonomiske studievalg",
                    "Ubegrænset adgang til nye features",
                    "Automatisk udløb efter semesteret"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
             </div>

             <button
               onClick={() => handleSubscription(PRICE_IDS.SEMESTER)}
               disabled={isSubscribing === PRICE_IDS.SEMESTER}
               className="w-full mt-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98"
             >
                {isSubscribing === PRICE_IDS.SEMESTER ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Vælg Semesterpakken <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
             </button>
          </motion.div>

        </div>

        {/* B2B / Institution Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 p-8 bg-white border border-slate-200/60 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
            <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500">
                  <Building className="w-3 h-3" /> Institutioner
                </div>
                <h3 className="text-xl font-black text-slate-900">
                   Uddannelsesaftaler & Kommuner
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                   Vi tilbyder skræddersyede løsninger og licensaftaler til uddannelsesinstitutioner og kommuner, der ønsker at integrere Cohéro på studiet eller arbejdspladsen.
                </p>
            </div>
            <Link href="/samarbejde" className="shrink-0">
                <Button variant="outline" className="w-full md:w-auto h-12 rounded-xl text-xs font-bold px-6 flex items-center gap-2 border-slate-200 hover:bg-slate-50">
                   Kontakt os angående B2B <ArrowUpRight className="w-4 h-4" />
                </Button>
            </Link>
        </motion.div>
      </div>

      <footer className="mt-24 py-8 border-t border-slate-200/40">
         <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Lock className="w-3 h-3 text-indigo-500" /> Sikker checkout med Stripe
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
               Cohéro © {new Date().getFullYear()} · Innovative Education
            </span>
         </div>
      </footer>
    </div>
  );
};

const UpgradePage = () => {
    return (
      <React.Suspense fallback={<AuthLoadingScreen />}>
        <UpgradePageContent />
      </React.Suspense>
    );
};

export default UpgradePage;
