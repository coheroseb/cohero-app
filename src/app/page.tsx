'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Brain, ArrowRight, Scale, ChevronRight, FileText,
  ArrowUpRight, CheckCircle2, Building, BookOpen, Music, Check, Gift, Bird, Ghost,
  ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useApp } from '@/app/provider';
import TikTokFeed from '@/components/home/TikTokFeed';
import ReviewMarquee from '@/components/home/ReviewMarquee';
import TrustStats from '@/components/home/TrustStats';

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const { openAuthPage, campaigns, effectiveTheme, isUserLoading, user } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/portal');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onStart = () => openAuthPage('signup');

  // Scroll animations for the Hero Section
  const { scrollYProgress } = useScroll();
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <div className={`flex flex-col selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden font-sans antialiased bg-[#FAF9F6]`}>
       
       {/* 1. HERO SECTION */}
       <motion.section 
         style={{ scale: heroScale, opacity: heroOpacity }}
         className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-32 pb-20 px-5 sm:px-8 overflow-hidden sticky top-0"
       >
          <div className="absolute inset-0 -z-20">
             <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-[120px]"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-amber-100/50 to-orange-100/40 blur-[150px]"></div>
          </div>
          
          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 flex flex-col items-center mt-[-5dvh]">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
               className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-xl border border-white/80 rounded-full shadow-sm mb-4"
             >
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Den nye standard for socialrådgivere</span>
             </motion.div>

             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
               className="text-[50px] sm:text-[80px] lg:text-[100px] font-black text-slate-900 tracking-tight leading-[0.95]"
             >
               Læs smartere.<br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 italic pr-2">Ikke hårdere.</span>
             </motion.h1>

             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
               className="text-lg sm:text-2xl text-slate-500 max-w-2xl font-medium leading-relaxed"
             >
               Cohéro strukturerer din viden, foreslår relevant litteratur direkte ud fra dine læringsmål med præcise sidetal, og genererer færdige APA-referencer.
             </motion.p>

             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
               className="pt-6"
             >
                <button 
                  onClick={onStart}
                  className="group relative flex items-center gap-3 px-10 py-5 sm:px-12 sm:py-6 bg-slate-900 text-white rounded-[2rem] text-lg sm:text-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]"
                >
                   Opret gratis profil <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
             </motion.div>
          </div>
       </motion.section>

       {/* Spacer to allow sticky hero to scroll out */}
       <div className="h-[15dvh]"></div>

       {/* Active Campaign Spotlight */}
       {campaigns && campaigns.length > 0 && (
        <section className="px-5 sm:px-8 py-10 relative z-30">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className={`max-w-6xl mx-auto rounded-[3.5rem] p-10 md:p-16 border-2 shadow-2xl relative overflow-hidden group ${
               campaigns[0].theme === 'christmas' ? 'bg-rose-600 border-rose-500 text-white' :
               campaigns[0].theme === 'easter' ? 'bg-yellow-400 border-yellow-300 text-yellow-950' :
               campaigns[0].theme === 'halloween' ? 'bg-orange-600 border-orange-500 text-white' :
               'bg-slate-900 border-slate-800 text-white'
             }`}
           >
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                  {campaigns[0].theme === 'christmas' ? <Gift className="w-64 h-64" /> :
                   campaigns[0].theme === 'easter' ? <Bird className="w-64 h-64" /> :
                   campaigns[0].theme === 'halloween' ? <Ghost className="w-64 h-64" /> :
                   <Sparkles className="w-64 h-64" />}
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                 <div className="flex-1 space-y-6 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
                       Tidsbegrænset tilbud
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none italic">{campaigns[0].title}</h2>
                    <p className="text-xl md:text-2xl font-medium opacity-80 max-w-2xl leading-relaxed text-current">
                       {campaigns[0].bannerText}
                    </p>
                 </div>

                 <div className="flex flex-col items-center gap-6 shrink-0 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-3">Anvend denne kode</p>
                       <div className="px-10 py-5 bg-white/10 rounded-2xl border-2 border-dashed border-white/40 flex items-center justify-center">
                          <span className="text-3xl font-black tracking-[0.2em]">{campaigns[0].discountCode || 'AUTOMATISK'}</span>
                       </div>
                    </div>
                    <Link 
                      href="/upgrade"
                      className="w-full py-5 px-8 bg-white text-slate-900 rounded-[20px] font-black uppercase text-[13px] tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Benyt tilbud nu <ArrowRight className="w-5 h-5" />
                    </Link>
                 </div>
              </div>
           </motion.div>
        </section>
       )}

       {/* 2. THE PLATFORM SHOWCASE (BENTO GRID) */}
       <section className="relative z-20 bg-white rounded-t-[3rem] sm:rounded-t-[4rem] shadow-[0_-20px_40px_rgba(0,0,0,0.02)] px-5 sm:px-8 py-24 sm:py-32">
          <div className="max-w-7xl mx-auto space-y-20">
             
             <div className="text-center max-w-3xl mx-auto space-y-6">
               <Reveal>
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                    Alt hvad du skal bruge,<br />
                    <span className="text-slate-400">samlet ét sted.</span>
                 </h2>
               </Reveal>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)]">
               
               {/* Bento 1: Intelligent Litteratursøgning (Large) */}
               <Reveal className="md:col-span-8 h-full">
                 <div onClick={onStart} className="h-full bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer hover:bg-white transition-colors hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
                    <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-gradient-to-bl from-indigo-200/40 to-transparent rounded-bl-full -z-10 transition-transform duration-700 group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col h-full">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-8 text-indigo-600 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                          <BookOpen className="w-8 h-8" />
                       </div>
                       <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Pensumsøgning</h3>
                       <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
                         Søg semantisk i hele dit pensum. Få konkrete litteraturforslag koblet direkte til dine læringsmål med sidetal og APA-referencer.
                       </p>
                       <div className="mt-auto pt-10 flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-widest text-[11px]">
                         Prøv funktionen <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 2: Begrebsguiden */}
               <Reveal delay={0.1} className="md:col-span-4 h-full">
                 <div onClick={onStart} className="h-full bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer text-white shadow-xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] transition-all">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.4)_0%,transparent_50%)] -z-10"></div>
                    <div className="relative z-10 flex flex-col h-full">
                       <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 mb-8 text-indigo-300 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                          <Brain className="w-8 h-8" />
                       </div>
                       <h3 className="text-3xl font-black mb-4 tracking-tight">Begrebsguiden</h3>
                       <p className="text-base text-slate-300 font-medium leading-relaxed">
                         Få pædagogiske og praksisnære forklaringer på komplekse faglige begreber.
                       </p>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 3: Folketinget */}
               <Reveal className="md:col-span-4 h-full">
                 <div onClick={onStart} className="h-full bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer hover:bg-white transition-colors hover:shadow-[0_40px_80px_-20px_rgba(225,29,72,0.15)]">
                    <div className="relative z-10 flex flex-col h-full">
                       <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center border border-rose-200 mb-8 text-white group-hover:-translate-y-2 transition-transform shadow-md">
                          <Building className="w-8 h-8" />
                       </div>
                       <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Folketinget</h3>
                       <p className="text-base text-slate-600 font-medium leading-relaxed">
                         Overvåg nye lovforslag med direkte analyse af betydningen for velfærdsstaten.
                       </p>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 4: Lovportalen */}
               <Reveal delay={0.1} className="md:col-span-8 h-full">
                 <div onClick={onStart} className="h-full bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer hover:bg-white transition-colors hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] flex flex-col md:flex-row gap-8 items-center justify-between">
                    <div className="relative z-10 flex flex-col h-full justify-center md:w-1/2">
                       <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 mb-8 text-amber-600">
                          <Scale className="w-8 h-8" />
                       </div>
                       <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Lovportalen</h3>
                       <p className="text-lg text-slate-500 font-medium leading-relaxed">
                         Slå op i de mest relevante love med indbygget sprogfortolkning i øjenhøjde.
                       </p>
                    </div>
                    {/* Abstract Representation of Law */}
                    <div className="md:w-1/2 h-full min-h-[200px] w-full bg-slate-100/50 rounded-3xl border border-slate-200 p-6 flex flex-col gap-4 relative overflow-hidden">
                       <div className="w-3/4 h-4 bg-slate-200 rounded-full"></div>
                       <div className="w-full h-3 bg-slate-200/50 rounded-full"></div>
                       <div className="w-5/6 h-3 bg-slate-200/50 rounded-full"></div>
                       <div className="w-1/2 h-3 bg-slate-200/50 rounded-full"></div>
                       
                       <motion.div 
                         initial={{ y: 50, opacity: 0 }}
                         whileInView={{ y: 0, opacity: 1 }}
                         transition={{ delay: 0.3 }}
                         className="absolute bottom-6 right-6 bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-lg"
                       >
                          Fortolket på dansk
                       </motion.div>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 5: Second Opinion (Full Width Layered) */}
               <Reveal className="md:col-span-12 h-full mt-10">
                 <div className="h-full bg-slate-900 rounded-[3rem] p-8 sm:p-16 relative overflow-hidden text-white flex flex-col md:flex-row gap-12 items-center justify-between">
                    <div className="absolute top-0 right-0 w-[50%] h-full bg-[radial-gradient(circle_at_100%_50%,rgba(244,63,94,0.3)_0%,transparent_70%)] -z-10"></div>
                    
                    <div className="md:w-1/2 space-y-6">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Nyhed: Second Opinion</span>
                       </div>
                       <h3 className="text-4xl sm:text-5xl font-black tracking-tight">Fik du ikke karakteren du fortjente?</h3>
                       <p className="text-lg text-slate-300 font-medium leading-relaxed">
                         Vores algoritme dekonstruerer bedømmelseskriterier og matcher dem mod din besvarelse. Få et objektivt grundlag for din klage — på under 60 sekunder.
                       </p>
                       <button onClick={onStart} className="mt-4 px-8 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 transition-colors inline-flex items-center gap-3">
                          Analysér din opgave <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="md:w-1/2 w-full flex justify-center">
                       <div className="relative w-full max-w-sm bg-white border border-slate-100 rounded-[2rem] p-8 shadow-2xl text-slate-900 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                          <div className="flex justify-between items-start mb-8">
                             <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                             <div className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100">Kritisk afvigelse</div>
                          </div>
                          <div className="space-y-4">
                             <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span>Teoretisk dybde</span>
                                <span className="text-slate-900">85%</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400 w-[85%]"></div>
                             </div>
                             <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400 mt-4">
                                <span>Metodisk stringens</span>
                                <span className="text-slate-900">92%</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[92%]"></div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               </Reveal>

             </div>
          </div>
       </section>

       {/* 3. TRUST STATS */}
       <div className="bg-[#FAF9F6] px-5 py-20 relative z-20">
         <TrustStats />
         <ReviewMarquee />
       </div>

       {/* 4. TIKTOK FEED */}
       <section className="bg-white py-32 px-5 sm:px-8 border-t border-slate-100 relative z-20 overflow-hidden">
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Reveal>
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full mb-2">
                    <Music className="w-4 h-4 text-slate-900" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">TikTok Fællesskab</span>
                 </div>
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-6">
                    Mød os hvor <br /> <span className="italic text-slate-400">du er.</span>
                 </h2>
                 <p className="text-lg sm:text-xl text-slate-500 font-medium leading-relaxed mt-6 max-w-md mx-auto lg:mx-0">
                    Vi deler dagligt tips, faglige indsigter og bag-om-kameraet direkte til din feed.
                 </p>
                 <Link href="/tiktok" className="mt-8 inline-flex items-center gap-2 text-slate-900 font-bold uppercase tracking-widest text-[13px] border-b-2 border-slate-900 pb-1 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                    Følg med her <ArrowUpRight className="w-4 h-4" />
                 </Link>
              </Reveal>
            </div>
            <div className="w-full lg:w-5/12">
               <TikTokFeed />
            </div>
         </div>
       </section>

       {/* 5. PRICING SECTION (All 3 Tiers) */}
       <section className="bg-[#FAF9F6] py-32 sm:py-48 px-5 sm:px-8 relative z-20">
          <div className="max-w-7xl mx-auto text-center space-y-16">
             <Reveal>
               <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight">
                 Din fremtidige <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-amber-500 italic">faglighed.</span>
               </h2>
             </Reveal>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mt-16 text-left">
               {/* Free Plan */}
               <Reveal delay={0} className="w-full">
                 <div className="h-full bg-white border border-slate-200 p-10 sm:p-14 rounded-[3.5rem] flex flex-col hover:shadow-xl hover:border-slate-300 transition-all">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Gratis</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Basis Adgang</p>
                    <div className="text-5xl font-black text-slate-900 mb-12 tracking-tighter">0 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/mdr</span></div>
                    <ul className="space-y-6 mb-16 flex-grow">
                      {[
                        "Begrænset Pensumsøgning",
                        "1 dagligt opslag i Begrebsguiden",
                        "Udvalgte paragraffer i Lovportalen",
                        "Se dine personlige fremskridt",
                      ].map(item => (
                        <li key={item} className="flex items-center gap-4 text-slate-600 font-medium">
                           <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                           <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={onStart} className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Start gratis</button>
                 </div>
               </Reveal>

               {/* Kollega+ */}
               <Reveal delay={0.1} className="w-full lg:-mt-8 lg:mb-[-2rem] relative z-10">
                  <div className="h-full bg-slate-900 p-10 sm:p-14 rounded-[4rem] shadow-2xl flex flex-col text-white relative overflow-hidden border border-white/10">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.2)_0%,transparent_50%)]"></div>
                     <div className="relative z-10">
                           <div className="inline-block bg-indigo-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-indigo-500/20">Mest Populære</div>
                           <h3 className="text-3xl font-black mb-2">Kollega+</h3>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-10">Fuld Adgang</p>
                           
                           <div className="mb-12">
                               <div className="text-6xl font-black tracking-tighter mb-4">89 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/mdr</span></div>
                               <p className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                   <Zap className="w-4 h-4 fill-current" /> 7 dages gratis prøve
                               </p>
                           </div>
                     </div>

                     <ul className="space-y-6 mb-16 flex-grow relative z-10">
                        {[
                          "Ubegrænset Pensumsøgning",
                          "Ubegrænset AI Opslagsværk",
                          "Fuld adgang til Lovportalen",
                          "Folketinget Direkte overvågning",
                          "Gem vigtige kilder & arkiv"
                        ].map(item => (
                          <li key={item} className="flex items-center gap-4 text-white font-medium">
                             <div className="w-6 h-6 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
                                <Check className="w-4 h-4 text-indigo-400" />
                             </div>
                             <span>{item}</span>
                          </li>
                        ))}
                     </ul>
                     <button onClick={onStart} className="relative z-10 w-full py-7 bg-indigo-500 text-white rounded-[2.5rem] font-bold text-[13px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">Vælg Kollega+</button>
                  </div>
               </Reveal>

               {/* Semesterpakken */}
               <Reveal delay={0.2} className="w-full">
                  <div className="h-full bg-white p-10 sm:p-14 rounded-[3.5rem] border border-slate-200 flex flex-col hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col h-full">
                       <h3 className="text-2xl font-black text-slate-900 mb-2">Semesterpakken</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Spar på Kollega+</p>
                       <div className="mb-10">
                         <div className="text-5xl font-black text-slate-900 tracking-tighter mb-4">329 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/5 mdr</span></div>
                         <p className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Spar 116 kr. totalt
                         </p>
                       </div>
                       <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Præcis det samme som Kollega+ – alle funktioner og ubegrænset adgang – bare betalt samlet for et helt semester.</p>
                       <div className="mt-auto pt-8">
                         <button onClick={onStart} className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest hover:border-slate-300 hover:shadow-md transition-all">Vælg Semester</button>
                       </div>
                    </div>
                  </div>
               </Reveal>
             </div>
          </div>
       </section>
    </div>
  );
}
