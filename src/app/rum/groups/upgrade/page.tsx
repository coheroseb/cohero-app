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
  Users,
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

export default function GroupsUpgradePage() {
  const { user, userProfile, isUserLoading } = useApp();
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
        const originPath = pathname;

        const { sessionId, stripeCustomerId: newStripeCustomerId } = await createCheckoutSession({
            priceId,
            userId: user.uid,
            userEmail: user.email || undefined,
            userName: userProfile.username || user.displayName || undefined,
            stripeCustomerId: currentStripeCustomerId,
            originPath: originPath || undefined,
            trialDays: 30,
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

  useEffect(() => {
      if (!isUserLoading && !user) {
          router.push('/');
      }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
      return <AuthLoadingScreen />;
  }

  const isSuccess = searchParams?.get('success') === 'true';

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
                onClick={() => router.push('/rum/groups')}
                className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-2xl shadow-slate-900/20"
              >
                  Tilbage til Project Group
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
                  Tusind tak for opgraderingen! I har nu fået fuldstændig, ubegrænset adgang til alle funktioner i Project Group. Samarbejdet kan for alvor begynde.
                </p>
               <button
                onClick={() => router.push('/rum/groups')}
                className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-colors shadow-2xl shadow-emerald-600/20"
              >
                  Tilbage til Project Group
              </button>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#FCFBF8] min-h-screen pb-32 selection:bg-amber-200 overflow-x-hidden relative">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-amber-100/50 to-transparent rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-slate-100 to-transparent rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

         <AnimatePresence>
           {error && (
             <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-200 shadow-2xl flex items-center gap-3"
             >
                 <ShieldAlert className="w-5 h-5" />
                 <span className="font-bold text-sm">{error}</span>
             </motion.div>
           )}
         </AnimatePresence>

         <header className="pt-24 pb-16 px-6 relative z-10 w-full flex flex-col items-center">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl mx-auto flex flex-col items-center text-center"
            >
                <Link href="/rum/groups" className="mb-12 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-md">
                    <ArrowLeft className="w-4 h-4" /> Tilbage til Project Group
                </Link>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full mb-8 shadow-2xl shadow-slate-900/20">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Ubegrænset Samarbejde</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tight mb-8 leading-[1.1]">
                    Cohéro <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-700">Group Pro</span>.
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-500 max-w-2xl leading-relaxed font-medium">
                    Opret utallige studiegrupper, invitér dine kolleger og synkroniser jeres projekter i realtid.
                </p>
            </motion.div>
        </header>

        <main className="py-12 px-6 relative z-10">
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={fadeIn}
                className="max-w-4xl mx-auto"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-[3.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    
                    <div
                        onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID)}
                        className="bg-white/80 backdrop-blur-3xl p-10 md:p-16 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center gap-12 cursor-pointer relative overflow-hidden border border-white"
                    >
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-5 pointer-events-none">
                            <Users className="w-64 h-64" />
                        </div>

                        <div className="flex-1 space-y-10 z-10">
                            <div>
                                <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                                    Første måned gratis
                                </div>
                                <h3 className="text-4xl font-black text-slate-800 mb-2">Group Pro</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Kollektiv Intelligens</p>
                            </div>
                            
                            <ul className="space-y-5">
                                {[
                                    "Opret ubegrænsede studiegrupper",
                                    "Fuld adgang til Projektoverblik",
                                    "Invitér op til 50 kolleger pr. gruppe",
                                    "Del kilder, links og rådata",
                                    "Synkronisér jeres fælles kalender"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-lg font-semibold text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-amber-700" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full md:w-80 p-8 bg-slate-900 rounded-[2.5rem] flex flex-col items-center text-center shadow-2xl relative z-10">
                            <div className="mb-8">
                                <div className="text-white text-6xl font-black tracking-tight mb-2">39<span className="text-2xl text-slate-400 font-medium">kr.</span></div>
                                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">Opkræves månedligt</p>
                            </div>
                            <Button size="lg" className="w-full h-16 bg-white text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 hover:text-amber-950 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                                {isSubscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Prøv gratis nu'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                     <Link href="/upgrade" className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors border-b border-transparent hover:border-slate-800 pb-1">
                        Ønsker du i stedet fuld adgang til hele Cohéro (89 kr/md)?
                    </Link>
                </div>
            </motion.div>
        </main>

        <footer className="absolute bottom-6 inset-x-0 text-center pointer-events-none">
           <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 opacity-40 grayscale pointer-events-auto hover:opacity-100 hover:grayscale-0 transition-all duration-700">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><Lock className="w-3 h-3" /> Sikker Betaling (Stripe)</span>
              <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Afmeld når du vil</span>
              <div className="h-1 w-1 rounded-full bg-slate-300 hidden md:block"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Support <a href="mailto:support@cohero.dk" className="underline hover:text-slate-800">her</a></span>
           </div>
        </footer>
    </div>
  );
}
