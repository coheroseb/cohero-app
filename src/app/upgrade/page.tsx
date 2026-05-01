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
  Building,
  Zap,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Star,
  FileText,
  CheckCircle2,
  Users,
  Crown,
  Lock,
  Gift,
  Bird,
  Ghost
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';
import { doc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) 
  : Promise.resolve(null);

// Robust Price ID resolution helper
const getPriceId = (envValue: string | undefined, fallback: string) => {
  if (!envValue || envValue === 'undefined' || envValue === 'null' || envValue.trim() === '') {
    return fallback;
  }
  return envValue;
};

// Price IDs with hardcoded fallbacks to ensure the UI always works even if build environment varies
const PRICE_IDS = {
  PLUS: getPriceId(process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID, 'price_1SvHSKPzEHK36eTSIFYtGJxD'),
  SEMESTER: getPriceId(process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID, 'price_1SvHTOPzEHK36eTSoiTu8m3C'),
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const UpgradePageContent: React.FC = () => {
  const { user, userProfile, campaigns } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isCentralized = useMemo(() => userProfile?.stripePriceId?.startsWith('b2b-') || userProfile?.stripePriceId?.startsWith('redeemed-'), [userProfile]);

  const handleSubscription = async (priceId: string | undefined) => {
    if (!priceId) {
        console.error('Subscription error: Price ID is missing. Current config:', { PRICE_IDS });
        setError('(v2) Pris-ID er ikke tilgængeligt. Prøv venligst igen senere.');
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
            console.error('Stripe redirectToCheckout error:', stripeError);
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

  // --- CENTRALIZED B2B PLAN ---
  if (isCentralized) {
    return (
      <div className="bg-[#FDFCF8] min-h-screen flex items-center justify-center text-center p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-100 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-2xl relative z-10"
          >
               <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-4 ring-white">
                 <ShieldAlert className="w-10 h-10" />
               </div>
               <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-6">
                  Erklæring om Central Aftale
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed mb-12 font-medium">
                  Dit kollegaskab administreres i øjeblikket gennem en partneraftale (kommune, uddannelsesinstitution eller kampagnekode). Du har allerede fuld prioriteret adgang.
                </p>
               <button
                onClick={() => router.push('/portal')}
                className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-2xl shadow-slate-900/20"
              >
                  Tilbage til Portalen
              </button>
          </motion.div>
      </div>
    );
  }

  // --- SUCCESS STATE ---
  if (isSuccess) {
    return (
      <div className="bg-[#FDFCF8] min-h-screen flex items-center justify-center text-center p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[120px] opacity-30 pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="bg-white/80 backdrop-blur-3xl p-12 md:p-20 rounded-[4rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] max-w-2xl relative z-10"
          >
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner ring-4 ring-white">
                 <Sparkles className="w-10 h-10" />
               </div>
               <h1 className="text-4xl font-bold text-slate-800 tracking-tight mb-6">
                  Betaling Gennemført!
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed mb-12 font-medium">
                  Tusind tak for din opgradering. Din adgang til Cohéro er nu blevet udvidet, og du får fuldt udbytte af dine nye værktøjer øjeblikkeligt.
                </p>
               <button
                onClick={() => router.push('/portal')}
                className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-colors shadow-2xl shadow-emerald-600/20"
              >
                  Gå til Portalen
              </button>
          </motion.div>
      </div>
    );
  }



  // --- STANDARD UPGRADE PAGE ---
  return (
    <div className="bg-white min-h-screen pb-40 selection:bg-indigo-100 overflow-x-hidden relative font-sans text-slate-950">
      {/* Subtle Architectural Grid Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px]" />

      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl border border-rose-200 shadow-2xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      <header className="pt-32 pb-32 px-6 relative z-10 text-center">
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto space-y-12"
        >
          <h1 className="text-6xl sm:text-[100px] font-black leading-[0.8] tracking-tighter mb-12">
             Invester i din <br />
             <span className="italic serif text-indigo-600">faglige</span> fremtid.
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
             Vælg den plan der passer til din studieform. Fra de fundamentale værktøjer til den fulde faglige pakke.
          </p>
        </motion.div>
      </header>

      <main className="px-6 relative z-10">
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12 items-stretch"
        >
          
          {/* Kollega (Free) */}
          <motion.div 
            variants={fadeIn}
            className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden group"
          >
             <div className="space-y-8 h-full flex flex-col">
                <div className="space-y-2">
                    <h3 className="text-4xl font-black tracking-tighter italic serif">Kollega</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Fundamentet</p>
                </div>
                
                <div className="py-8 border-y border-slate-50">
                    <div className="text-5xl font-black tracking-tighter">0 <span className="text-lg text-slate-300 font-medium tracking-normal">kr. / md</span></div>
                </div>
                
                <ul className="space-y-6 flex-1">
                  {[
                    "Adgang til Lovportalen",
                    "Begrebsguide (1 opslag/dag)",
                    "Studie-Arkitekt (1 opgave/md)",
                    "STAR-analyse (1 analyse/dag)",
                    "Journal-træning (1 ugentlig)"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-4 text-[13px] font-black uppercase tracking-widest text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
               
               <div className="w-full py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] text-center border border-slate-100">
                  Nuværende plan
               </div>
             </div>
          </motion.div>

          {/* Kollega+ (Pro) - The Featured One */}
          <motion.div 
            variants={fadeIn}
            className="relative flex flex-col"
          >
              <div 
                  onClick={() => handleSubscription(PRICE_IDS.PLUS)}
                  className="bg-slate-950 rounded-[4rem] p-12 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.2)] flex flex-col cursor-pointer overflow-hidden transition-all hover:-translate-y-4 duration-700 h-full relative"
              >
                  <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                      <Zap className="w-40 h-40 text-white" />
                  </div>
                  
                  <div className="absolute top-10 right-10 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                      Mest Populær
                  </div>

                  <div className="space-y-8 h-full flex flex-col relative z-10">
                      <div className="space-y-2">
                          <h3 className="text-4xl font-black tracking-tighter text-white italic serif">Kollega+</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Ubegrænset adgang</p>
                      </div>
                      
                      <div className="py-8 border-y border-white/10">
                          <div className="text-6xl font-black tracking-tighter text-white">89 <span className="text-lg text-slate-500 font-medium tracking-normal">kr. / md</span></div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">7 dages gratis prøveperiode</p>
                      </div>
                      
                      <ul className="space-y-6 flex-1">
                          {[
                          "Alt i Kollega pakken",
                          "Ubegrænset Studie-Arkitekt",
                          "Ubegrænset Lovportal-adgang",
                          "Ubegrænset STAR-analyse",
                          "Ubegrænset Journal-træner",
                          "Fuld overvågning af Folketinget",
                          "Prioriteret support"
                          ].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-[13px] font-black uppercase tracking-widest text-slate-400">
                              <Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />
                              <span className="text-slate-200">{item}</span>
                          </li>
                          ))}
                      </ul>
                      
                      <div className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 group transition-colors">
                          {isSubscribing === PRICE_IDS.PLUS ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Begynd nu'}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                  </div>
              </div>
          </motion.div>

          {/* Semesteret (Pack) */}
          <motion.div 
            variants={fadeIn}
            className="flex flex-col"
          >
              <div 
                  onClick={() => handleSubscription(PRICE_IDS.SEMESTER)}
                  className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.05)] flex flex-col cursor-pointer overflow-hidden transition-all hover:-translate-y-4 duration-700 h-full relative"
              >
                  <div className="space-y-8 h-full flex flex-col">
                    <div className="space-y-2">
                        <h3 className="text-4xl font-black tracking-tighter italic serif">Semesteret</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Engangsbetaling</p>
                    </div>
                    
                    <div className="py-8 border-y border-slate-50">
                        <div className="text-5xl font-black tracking-tighter">329 <span className="text-lg text-slate-300 font-medium tracking-normal">kr.</span></div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-2">Spar over 25%</p>
                    </div>
                    
                    <ul className="space-y-6 flex-1">
                      {[
                        "Alt fra Kollega+ i 5 måneder",
                        "Ingen automatisk fornyelse",
                        "Det økonomisk stærkeste valg",
                        "Adgang til alle nye features",
                        "Fuld akademisk rygdækning"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-4 text-[13px] font-black uppercase tracking-widest text-slate-400">
                           <CheckCircle2 className="w-4 h-4 text-slate-950" />
                           <span className="text-slate-950">{item}</span>
                        </li>
                      ))}
                   </ul>
                   
                   <div className="w-full py-6 border-2 border-slate-950 text-slate-950 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-slate-950 hover:text-white transition-all">
                      {isSubscribing === PRICE_IDS.SEMESTER ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Vælg Semesterpakken'}
                      <ArrowRight className="w-4 h-4" />
                   </div>
                  </div>
              </div>
          </motion.div>

        </motion.div>

        {/* B2B / Institution Section */}
        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-60 max-w-6xl mx-auto pb-40 text-center"
        >
            <div className="h-px w-32 bg-slate-200 mx-auto mb-20" />
            
            <div className="space-y-12">
                <h3 className="text-4xl sm:text-6xl font-black tracking-tighter italic serif">
                   Uddannelsesinstitutioner <br /> & Kommuner.
                </h3>
                <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                   Vi tilbyder skræddersyede løsninger til uddannelser og kommuner, der ønsker at løfte det faglige niveau gennem innovative værktøjer.
                </p>
                <Link href="/samarbejde" className="inline-flex items-center justify-center px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-950/20 hover:-translate-y-1 transition-all">
                   Kontakt for B2B aftale
                   <ArrowUpRight className="w-4 h-4 ml-3" />
                </Link>
            </div>
        </motion.div>
      </main>
      
      <footer className="py-20 border-t border-slate-50">
         <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-12 opacity-30">
            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Lock className="w-3 h-3" /> Sikker Betaling</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Afmeld når du vil</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cohéro · Innovative Education</span>
         </div>
      </footer>

      <style jsx>{`
        .serif { font-family: 'Playfair Display', serif; }
      `}</style>
    </div>
  );
};

const UpgradePage = () => {
    return <UpgradePageContent />;
};

export default UpgradePage;
