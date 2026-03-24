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
  Star,
  FileText,
  CheckCircle2,
  Users,
  Crown,
  Lock
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
        setError('Du skal være logget ind for at opgradere.');
        return;
    }

    setIsSubscribing(priceId);
    setError(null);

    try {
        const currentStripeCustomerId = userProfile.stripeCustomerId || undefined;
        const originPath = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;

        const { sessionId, stripeCustomerId: newStripeCustomerId } = await createCheckoutSession({
            priceId,
            userId: user.uid,
            userEmail: user.email || undefined,
            userName: userProfile.username || user.displayName || undefined,
            stripeCustomerId: currentStripeCustomerId,
            originPath: originPath,
        });

        if (newStripeCustomerId && newStripeCustomerId !== currentStripeCustomerId) {
            const userRef = doc(firestore, 'users', user.uid);
            await setDoc(userRef, { stripeCustomerId: newStripeCustomerId }, { merge: true });
        }

        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error('Stripe.js er ikke indlæst.');
        }

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

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
    <div className="bg-[#FAF9F6] min-h-screen pb-32 selection:bg-amber-200 overflow-x-hidden relative">
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-b from-amber-100/40 to-transparent rounded-full blur-[120px] opacity-70 pointer-events-none"></div>
      <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-slate-200/50 to-transparent rounded-full blur-[100px] opacity-50 pointer-events-none"></div>

      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-200 shadow-2xl flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      <header className="pt-32 pb-20 px-6 relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto flex flex-col items-center text-center"
        >
          <Link href="/portal" className="mb-12 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors bg-white/60 px-5 py-2.5 rounded-full border border-slate-200/50 backdrop-blur-md shadow-sm">
            <ArrowLeft className="w-4 h-4" /> Tilbage til Portalen
          </Link>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl mb-8 shadow-inner ring-4 ring-white">
             <Crown className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight mb-8 leading-[1.05]">
            Vælg dit <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400">kollegaskab</span>.
          </h1>
          
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
            Et fundament i særklasse for alle studerende. Kraftfulde, ubegrænsede AI-værktøjer for dem, der stræber efter toppen.
          </p>
        </motion.div>
      </header>

      <main className="px-6 relative z-10 -mt-8">
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end"
        >
          
          {/* Kollega (Free) */}
          <motion.div 
            variants={fadeIn}
            className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col h-[600px] relative overflow-hidden group"
          >
             <div className="absolute -right-8 -top-8 text-slate-100 group-hover:-rotate-12 transition-transform duration-700">
                <FileText className="w-48 h-48" />
             </div>
             <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Kollega</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Det Fundamentale</p>
                </div>
                <div className="mb-10">
                    <div className="text-5xl font-black text-slate-800 tracking-tight">0 <span className="text-xl text-slate-400 font-medium">kr.</span></div>
                </div>
                
                <ul className="space-y-4 mb-auto">
                 {[
                   "3 daglige opslag i Guiden",
                   "3 daglige STAR-tolkninger",
                   "Begrænset Lovportal",
                   "1 ugentlig Refleksionslog",
                   "1 daglig Journal-træning",
                   "1 månedlig Arkitekt-opgave"
                 ].map((item, i) => (
                   <li key={i} className="flex items-start gap-3 text-sm text-slate-600 font-medium leading-tight">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                     <span>{item}</span>
                   </li>
                 ))}
               </ul>
               
               <div className="w-full py-4 mt-8 bg-slate-100/50 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center border border-slate-200/50">
                  Din nuværende plan
               </div>
             </div>
          </motion.div>

          {/* Kollega+ (Pro) - Highlighted Dark Card */}
          <motion.div 
            variants={fadeIn}
            className="relative h-[640px] z-20 group"
          >
              <div className="absolute -inset-1 bg-gradient-to-t from-amber-400/50 to-amber-200/50 rounded-[3rem] blur-lg opacity-40 group-hover:opacity-70 transition duration-1000"></div>
              
              <div 
                  onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID)}
                  className="absolute inset-0 bg-slate-900 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl border border-slate-700/50 flex flex-col cursor-pointer overflow-hidden transition-transform group-hover:-translate-y-2 duration-500"
              >
                  <div className="absolute -right-8 -top-8 text-slate-800 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                      <Zap className="w-56 h-56" />
                  </div>
                  
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-300 via-amber-500 to-amber-300"></div>
                  
                  <div className="absolute top-6 right-8 bg-amber-400 text-amber-950 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse whitespace-nowrap z-30">
                      7 dage gratis
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-8">
                          <h3 className="text-3xl font-black text-white mb-2">Kollega+</h3>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Ubegrænset Adgang</p>
                      </div>
                      <div className="mb-10">
                          <div className="text-6xl font-black text-white tracking-tight">89 <span className="text-xl text-slate-500 font-medium">kr. / md</span></div>
                      </div>
                      
                      <ul className="space-y-4 mb-auto">
                          {[
                          "Ubegrænset Lovportal-adgang",
                          "Fuld overvågning af Folketinget",
                          "Ubegrænsede opslag i Guiden",
                          "Ubegrænset STAR-tolkning",
                          "Ubegrænset Journal-træning",
                          "3 månedlige opgaver i Arkitekten",
                          "Personligt arkiv over analyser"
                          ].map((item, i) => (
                          <li key={i} className="flex items-start gap-4 text-sm text-slate-300 font-medium leading-tight">
                              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 fill-amber-400" />
                              <span>{item}</span>
                          </li>
                          ))}
                      </ul>
                      
                      <div className="w-full mt-8 py-5 bg-amber-400 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)] group-hover:bg-white transition-colors">
                          {isSubscribing === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kom i gang nu'}
                          <ArrowUpRight className="w-4 h-4" />
                      </div>
                  </div>
              </div>
          </motion.div>

          {/* Semesteret (Pack) */}
          <motion.div 
            variants={fadeIn}
            onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID)}
            className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all flex flex-col h-[600px] relative overflow-hidden group cursor-pointer hover:-translate-y-2 duration-500"
          >
             <div className="absolute top-6 right-8 bg-slate-900 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                Spar 116 kr.
             </div>
             <div className="absolute -right-8 -top-8 text-slate-100 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                <Sparkles className="w-48 h-48" />
             </div>
             
             <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Semesteret</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kollega+ i 5 mdr.</p>
                </div>
                <div className="mb-10">
                    <div className="text-5xl font-black text-slate-800 tracking-tight">329 <span className="text-xl text-slate-400 font-medium">kr.</span></div>
                    <div className="text-xs text-slate-400 mt-2 font-bold">Betales engangsbeløb</div>
                </div>
                
                <ul className="space-y-4 mb-auto">
                  {[
                    "Alt fra Kollega+",
                    "Gælder for et helt semester",
                    "Spar penge ift. månedspris",
                    "Ingen automatisk fornyelse",
                    "Fuld adgang til alle værktøjer"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-sm text-slate-600 font-medium leading-tight">
                       <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                       <span>{item}</span>
                    </li>
                  ))}
               </ul>
               
               <div className="w-full py-4 mt-8 border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest text-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  {isSubscribing === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Køb Semesterpakke'}
               </div>
             </div>
          </motion.div>

          {/* Kollega++ (Coach) */}
          <motion.div 
            variants={fadeIn}
            onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID)}
            className="bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] p-8 lg:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-all flex flex-col h-[600px] relative overflow-hidden group cursor-pointer hover:-translate-y-2 duration-500"
          >
             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-400 to-indigo-500"></div>
             
             <div className="absolute top-6 right-8 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                Personlig Coach
             </div>
             
             <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Kollega++</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600">For den Ambitiøse</p>
                </div>
                <div className="mb-10">
                    <div className="text-5xl font-black text-slate-800 tracking-tight">599 <span className="text-xl text-slate-400 font-medium">kr. / md</span></div>
                </div>
                
                <ul className="space-y-4 mb-auto">
                  {[
                    "Alt fra Kollega+",
                    "45 min. sparring m. socialrådgiver",
                    "30 min. opgave-review",
                    "Direkte mail-support",
                    "Beta-adgang til nye tools"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-sm text-slate-600 font-medium leading-tight">
                       <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-purple-700" />
                       </div>
                       <span>{item}</span>
                    </li>
                  ))}
               </ul>
               
               <div className="w-full py-4 mt-8 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest text-center shadow-[0_10px_20px_-10px_rgba(147,51,234,0.5)] group-hover:bg-purple-700 transition-colors">
                  {isSubscribing === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Start Coaching'}
               </div>
             </div>
          </motion.div>

        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-32 max-w-5xl mx-auto pb-20"
        >
            <div className="bg-white/80 backdrop-blur-2xl p-12 md:p-20 rounded-[3rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rounded-full blur-[80px] -mr-20 -mt-20 opacity-60"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                    <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-white text-slate-800 rounded-[2rem] flex items-center justify-center shadow-inner ring-4 ring-slate-50 shrink-0 group-hover:rotate-6 transition-transform duration-500">
                        <Building className="w-10 h-10" />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">Uddannelsesinstitution eller Kommune?</h3>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-0">
                          Vi tilbyder skræddersyede B2B-løsninger, der giver jeres studerende, lærere, eller praktikanter fuld adgang og styrker den faglige dannelse i stor skala med mærkbare rabatter.
                        </p>
                    </div>

                    <Link href="/samarbejde" className="group/btn inline-flex items-center justify-center px-8 py-5 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:bg-black hover:-translate-y-1 shadow-2xl shadow-slate-900/20 shrink-0 whitespace-nowrap">
                        Kontakt Os
                        <ArrowUpRight className="w-4 h-4 ml-3 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </motion.div>
      </main>
      
      <footer className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
         <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-40 grayscale pointer-events-auto hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Lock className="w-3 h-3" /> Sikker Betaling (Stripe)</span>
            <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Afmeld når du vil</span>
            <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Support <a href="mailto:kontakt@cohero.dk" className="underline hover:text-slate-800">her</a></span>
         </div>
      </footer>

    </div>
  );
};

const UpgradePageWrapper = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <UpgradePageContent />;
};

export default UpgradePageWrapper;
