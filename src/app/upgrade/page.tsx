'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Check,
  ShieldAlert,
  ArrowUpRight,
  Loader2,
  Building,
  Zap,
  Sparkles,
  GraduationCap,
  Scale,
  BookOpen,
  ArrowLeft,
  ShieldCheck,
  Star,
  Lock,
  FileText,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { createCheckoutSession } from '@/app/actions';
import { loadStripe } from '@stripe/stripe-js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const UpgradePageContent: React.FC = () => {
  const { user, userProfile } = useApp();
  const router = useRouter();
  const firestore = useFirestore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFromGroups = useMemo(() => searchParams.get('source') === 'groups', [searchParams]);

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
        const currentStripeCustomerId = userProfile.stripeCustomerId || null;
        const originPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;


        const { sessionId, stripeCustomerId: newStripeCustomerId } = await createCheckoutSession({
            priceId,
            userId: user.uid,
            userEmail: user.email,
            userName: userProfile.username || user.displayName,
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
            setError(`Fejl ved checkout: ${''}${stripeError.message}`);
        }
    } catch (e: any) {
        console.error('Subscription error:', e);
        setError(`Der opstod en fejl: ${e.message}`);
    } finally {
        setIsSubscribing(null);
    }
  };

  const isCentralized = useMemo(() => userProfile?.stripePriceId?.startsWith('b2b-') || userProfile?.stripePriceId?.startsWith('redeemed-'), [userProfile]);

  if (isCentralized) {
    return (
      <div className="bg-[#FDFCF8] min-h-screen flex items-center justify-center text-center p-6">
          <div className="bg-white p-12 md:p-20 rounded-[4rem] border border-amber-100 shadow-2xl max-w-2xl animate-ink">
               <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                 <ShieldAlert className="w-10 h-10" />
               </div>
               <h1 className="text-3xl font-bold text-amber-950 serif mb-6">
                  Dit kollegaskab administreres centralt
                </h1>
                <p className="text-lg text-slate-500 leading-relaxed italic mb-12">
                  Du har adgang gennem en partneraftale (kommune, skole eller kode) og kan derfor ikke ændre dit abonnement manuelt her.
                </p>
              <button
                onClick={() => router.push(isFromGroups ? '/rum/groups' : '/portal')}
                className="px-10 py-5 bg-amber-950 text-white rounded-2xl font-bold hover:scale-105 transition-transform shadow-xl"
              >
                  Tilbage til {isFromGroups ? 'Project Group' : 'portalen'}
              </button>
          </div>
      </div>
    );
  }

  // --- SPECIAL GROUP PRO PLAN ---
  if (isFromGroups) {
    return (
        <div className="bg-[#FDFCF8] min-h-screen pb-32 selection:bg-amber-100 overflow-x-hidden">
             <header className="bg-white border-b border-amber-100/50 pt-20 pb-16 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
                <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 animate-ink">
                <Link href="/rum/groups" className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 hover:text-amber-950 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Tilbage til Project Group
                </Link>
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full mb-8 border border-amber-100 shadow-sm">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Ubegrænset Samarbejde</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-amber-950 serif mb-6 leading-tight">
                    Cohéro <span className="italic text-amber-700">Group Pro</span>.
                </h1>
                <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed italic">
                    Opret så mange grupper du vil. Invitér dine kolleger. <br className="hidden md:block" /> Styr jeres fælles projekter med professionelle værktøjer.
                </p>
                </div>
            </header>

            <main className="py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse whitespace-nowrap z-30">
                        Første 7 dage gratis
                    </div>
                    <div
                        onClick={() => handleSubscription("price_1SvHYWPzEHK36eTS7pSgY5Wp")}
                        className="bg-amber-950 p-12 md:p-16 rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(45,20,3,0.4)] flex flex-col md:flex-row items-center gap-12 text-white group cursor-pointer relative overflow-hidden border-2 border-amber-400/20 mt-4"
                    >
                        <div className="flex-1 space-y-8">
                            <div>
                                <h3 className="text-3xl font-bold serif mb-2 text-amber-400">Group Pro</h3>
                                <p className="text-sm font-black uppercase tracking-widest text-amber-100/40 italic">Ubegrænset samarbejde</p>
                            </div>
                            
                            <ul className="space-y-4">
                                {[
                                    "Opret ubegrænsede studiegrupper",
                                    "Fuld adgang til Projektoverblik",
                                    "Invitér op til 50 kolleger pr. gruppe",
                                    "Del kilder, links og rådata",
                                    "Synkronisér jeres fælles kalender"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-4 text-base font-bold leading-tight">
                                        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                                            <Check className="w-3 h-3 text-amber-950" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="w-full md:w-80 p-8 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col items-center text-center">
                            <div className="mb-6">
                                <div className="text-6xl font-black serif">39 kr.</div>
                                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mt-2">Prøv gratis i 7 dage</p>
                            </div>
                            <Button size="lg" className="w-full h-16 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white active:scale-95 shadow-xl shadow-amber-400/20">
                                {isSubscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Prøv gratis nu'}
                            </Button>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                         <Link href="/upgrade" className="text-sm font-bold text-amber-900/40 hover:text-amber-950 transition-colors underline">
                            Ønsker du i stedet fuld adgang til hele Cohéro (89 kr/md)?
                        </Link>
                    </div>
                </div>
            </main>
            <footer className="max-w-4xl mx-auto px-6 text-center opacity-40 grayscale">
                <span className="text-[10px] font-black uppercase tracking-widest">Sikker Betaling via Stripe • Cohéro Project Group</span>
            </footer>
        </div>
    );
  }

  return (
    <div className="bg-[#FDFCF8] min-h-screen pb-32 selection:bg-amber-100 overflow-x-hidden">
      <header className="bg-white border-b border-amber-100/50 pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-50"></div>
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center relative z-10 animate-ink">
          <Link href="/portal" className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/40 hover:text-amber-950 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Tilbage til Portalen
          </Link>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-full mb-8 border border-amber-100 shadow-sm">
             <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Investering i din professionelle dannelse</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-amber-950 serif mb-6 leading-tight">
            Vælg dit <span className="italic text-amber-700">kollegaskab</span>.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed italic">
            Freemium for alle studerende – rygdækning for dem, der vil det ekstra. <br className="hidden md:block" /> Opgrader for ubegrænset sparring og dannelse.
          </p>
        </div>
      </header>

      <main className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 items-stretch">
            
            {/* Free: Kollega */}
            <div className="p-10 bg-white border border-amber-100 rounded-[3.5rem] shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <FileText className="w-24 h-24" />
               </div>
               <h3 className="text-2xl font-bold text-amber-950 serif mb-2">
                    Kollega
                </h3>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 italic">
                    Det fundamentale
                </p>
                <div className="text-5xl font-black text-amber-950 mb-10 serif">
                    0 kr. <span className="text-base font-normal text-slate-300">/mdr</span>
                </div>
                <ul className="space-y-5 mb-12 flex-grow">
                 {[
                   "3 daglige opslag i Guiden",
                   "3 daglige STAR-tolkninger",
                   "Begrænset Lovportal-adgang",
                   "Folketinget Direkte (Top 5 sager)",
                   "1 ugentlig øvelse i Refleksionslog",
                   "1 daglig Journal-træning",
                   "3 daglige Case-simuleringer",
                   "1 månedlig opgave i Arkitekten"
                 ].map(item => (
                   <li key={item} className="flex items-start gap-3 text-sm text-slate-500 font-medium leading-tight">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                     <span>{item}</span>
                   </li>
                 ))}
               </ul>
               <div className="w-full mt-auto py-5 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest text-center cursor-default">
                  Din nuværende plan
               </div>
            </div>

            {/* Paid: Kollega+ - HIGHLIGHTED */}
            <div className="relative lg:scale-110 z-20 pt-6 md:pt-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse whitespace-nowrap z-30">
                    Første 7 dage gratis
                </div>
                <div
                    onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID)}
                    className="bg-amber-950 p-12 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(45,20,3,0.4)] flex flex-col text-white group cursor-pointer h-full relative overflow-hidden"
                >
                    <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap className="w-24 h-24" />
                    </div>
                    <h3 className="text-2xl font-bold serif mb-2">Kollega+</h3>
                    <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-8 italic">For den dedikerede</p>
                    <div className="mb-10">
                        <div className="text-5xl font-black serif">89 kr.<span className="text-sm font-normal text-amber-100/30">/mdr</span></div>
                        <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mt-1">Prøv gratis i 7 dage</p>
                    </div>
                    
                    <ul className="space-y-5 mb-12 flex-grow">
                        {[
                        "Ubegrænset Lovportal-adgang",
                        "Fuld overvågning af Folketinget",
                        "Ubegrænsede opslag i Guiden",
                        "Ubegrænset STAR-tolkning",
                        "Ubegrænset Journal-træning",
                        "3 månedlige opgaver i Arkitekten",
                        "3 månedlige Second Opinions",
                        "Personligt arkiv over analyser"
                        ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-amber-50/80 font-bold leading-tight">
                            <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 fill-amber-400" />
                            <span>{item}</span>
                        </li>
                        ))}
                    </ul>
                    
                    <div className="w-full mt-auto py-5 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-widest group-hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20">
                        {isSubscribing === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Prøv gratis nu'}
                        <ArrowUpRight className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {/* Semester pakke */}
            <div 
              onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID)}
              className="p-10 bg-white border border-amber-100 rounded-[3.5rem] shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 relative overflow-hidden cursor-pointer">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-24 h-24" />
               </div>
               <h3 className="text-2xl font-bold text-amber-950 serif mb-2">Semesteret</h3>
               <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 italic">Kollega+ i 5 mdr.</p>
               <div className="text-5xl font-black text-amber-950 mb-10 serif">329 kr.<span className="text-base font-normal text-slate-300">/5 mdr.</span></div>
               
               <ul className="space-y-5 mb-12 flex-grow">
                  {[
                    "Alt fra Kollega+",
                    "Gælder for et helt semester",
                    "Spar 116 kr. ift. månedspris",
                    "Fuld adgang til alt tools"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-500 font-medium leading-tight">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                       <span>{item}</span>
                    </li>
                  ))}
               </ul>
               
               <div className="w-full mt-auto py-5 border-2 border-amber-950 text-amber-950 rounded-2xl font-black uppercase text-xs tracking-widest group-hover:bg-amber-950 group-hover:text-white transition-all flex items-center justify-center gap-2">
                  {isSubscribing === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Sikr dit semester'}
               </div>
            </div>

            {/* LEVEL 4: KOLLEGA++ (The Personal Coach) */}
            <div
                onClick={() => handleSubscription(process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID)}
                className="p-10 bg-white border-2 border-purple-200 rounded-[3.5rem] shadow-sm flex flex-col group hover:shadow-xl transition-all duration-500 relative overflow-hidden cursor-pointer">
               <div className="absolute top-4 right-8">
                  <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Personlig Coach</span>
               </div>
               <h3 className="text-2xl font-bold text-amber-950 serif mb-2">Kollega++</h3>
               <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-8 italic">For den Ambitiøse</p>
               <div className="text-5xl font-black text-amber-950 mb-10 serif">599 kr.<span className="text-sm font-normal text-slate-300">/mdr</span></div>
               
               <ul className="space-y-5 mb-12 flex-grow">
                  {[
                    "Alt fra Kollega+",
                    "45 min. sparring m. socialrådgiver",
                    "30 min. opgave-review",
                    "Direkte mail-support",
                    "Beta-adgang til nye tools"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-500 font-medium leading-tight">
                       <div className="w-4 h-4 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-purple-600" />
                       </div>
                       <span>{item}</span>
                    </li>
                  ))}
               </ul>
               
               <div className="w-full mt-auto py-5 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-purple-600/20 group-hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isSubscribing === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Coaching'}
                  <ArrowUpRight className="w-4 h-4" />
               </div>
            </div>
          </div>

          <div className="mt-32 max-w-5xl mx-auto">
            <div className="bg-white p-12 md:p-20 rounded-[4rem] border-2 border-dashed border-amber-200 shadow-sm relative overflow-hidden group">
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-amber-50 text-amber-700 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner group-hover:rotate-6 transition-transform">
                        <Building className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl md:text-5xl font-bold text-amber-950 serif mb-6">Uddannelsesinstitution eller Kommune?</h3>
                    <p className="text-xl text-slate-500 mb-12 max-w-2xl italic leading-relaxed">
                      Vi tilbyder skræddersyede B2B-løsninger, der giver jeres studerende eller praktikanter fuld adgang og styrker den faglige dannelse i stor skala.
                    </p>
                    <Link href="/samarbejde" className="group inline-flex items-center justify-center px-12 py-6 bg-amber-950 text-white rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-2xl shadow-amber-950/20">
                        Se partnerskabsmuligheder
                        <ArrowUpRight className="w-5 h-5 ml-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-5 pointer-events-none"></div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-4xl mx-auto px-6 text-center">
         <div className="flex flex-wrap items-center justify-center gap-12 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <span className="text-xs font-black uppercase tracking-widest">Sikker Betaling via Stripe</span>
            <div className="h-4 w-[1px] bg-amber-200 hidden md:block"></div>
            <span className="text-xs font-black uppercase tracking-widest">100% Tilfredshedsgaranti</span>
            <div className="h-4 w-[1px] bg-amber-200 hidden md:block"></div>
            <span className="text-xs font-black uppercase tracking-widest">Afmeld når som helst</span>
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
