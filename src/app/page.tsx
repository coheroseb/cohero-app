'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Brain, ArrowRight, Scale, ChevronRight, FileText,
  ArrowUpRight, CheckCircle2, Building, BookOpen, Music, Check, Gift, Bird, Ghost,
  ShieldCheck, Zap, Lock, Globe, Users, Bell, Search, Menu, X, Star, FileBox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { BookSpine } from '@/components/BookSpine';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMockupTab, setActiveMockupTab] = useState<'pensum' | 'begreber' | 'lovportal' | 'secondOpinion'>('pensum');
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

  return (
    <div className={`flex flex-col selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden font-sans antialiased bg-[#FAF9F6]`}>
       
       {/* Floating Navigation */}
       <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 md:px-12">
         <div className="max-w-7xl mx-auto w-full bg-[#090d16]/75 backdrop-blur-xl border border-white/5 rounded-[2rem] h-20 px-8 flex items-center justify-between shadow-2xl shadow-black/30">
           <div className="flex items-center gap-3">
              <Link href="/" className="flex items-end -space-x-[1.5px] scale-[0.85] origin-left">
                 <BookSpine index={0} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-5 sm:h-6" color="bg-white" decoration="plain" tilt="-rotate-1" />
                 <BookSpine index={1} theme={effectiveTheme} width="w-2 sm:w-2.5" height="h-7 sm:h-8" color="bg-white" decoration="bands" />
                 <BookSpine index={2} theme={effectiveTheme} width="w-1 sm:w-1.5" height="h-6 sm:h-7" color="bg-white" decoration="plain" />

                 <BookSpine index={3} theme={effectiveTheme} letter="C" width="w-3 sm:w-3.5" height="h-8 sm:h-9" color="bg-white" decoration="bands" />
                 <BookSpine index={4} theme={effectiveTheme} letter="o" width="w-3 sm:w-3.5" height="h-6 sm:h-7" color="bg-white" decoration="gold" />
                 <BookSpine index={5} theme={effectiveTheme} letter="h" width="w-3 sm:w-3.5" height="h-9 sm:h-10" color="bg-white" decoration="bands" tilt="-rotate-[1.5deg]" />
                 <BookSpine index={6} theme={effectiveTheme} letter="é" width="w-3 sm:w-3.5" height="h-7 sm:h-8" color="bg-white" decoration="stripes" />
                 <BookSpine index={7} theme={effectiveTheme} letter="r" width="w-3 sm:w-3.5" height="h-8 sm:h-9" color="bg-white" decoration="bands" />
                 <BookSpine index={8} theme={effectiveTheme} letter="o" width="w-3 sm:w-3.5" height="h-6 sm:h-7" color="bg-white" decoration="gold" tilt="rotate-[1deg]" />

                 <BookSpine index={9} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-7 sm:h-8" color="bg-white" decoration="ornament" />
                 <BookSpine index={10} theme={effectiveTheme} width="w-2 sm:w-2.5" height="h-5 sm:h-6" color="bg-white" decoration="plain" tilt="rotate-2" />
                 <BookSpine index={11} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-6 sm:h-7" color="bg-white" decoration="bands" />
              </Link>
           </div>
           
           <div className="hidden md:flex items-center gap-1.5">
              <a href="#showcase" className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors">Funktioner</a>
              <a href="#pricing" className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors">Priser</a>
              <Link href="/shop" className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors">Shop</Link>
              <Link href="/om-second-opinion" className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors">Second Opinion</Link>
           </div>

           <div className="flex items-center gap-4">
              {user ? (
                 <Link 
                   href="/portal"
                   className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all"
                 >
                    Min Portal
                 </Link>
              ) : (
                 <>
                    <button 
                      onClick={() => openAuthPage('signin')} 
                      className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                    >
                       Log ind
                    </button>
                    <button 
                      onClick={() => openAuthPage('signup')} 
                      className="shimmer-btn hidden sm:inline-flex px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all"
                    >
                       Opret gratis profil
                    </button>
                 </>
              )}
              
              {/* Mobile Hamburger menu button */}
              <button 
                className="md:hidden p-2 text-slate-400 hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                 {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
           </div>
         </div>

         {/* Mobile menu dropdown */}
         <AnimatePresence>
           {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-24 left-4 right-4 bg-[#090d16]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl z-40"
              >
                 <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider py-2">Funktioner</a>
                 <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider py-2">Priser</a>
                 <Link href="/shop" className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider py-2">Shop</Link>
                 <Link href="/om-second-opinion" className="text-sm font-bold text-slate-300 hover:text-white uppercase tracking-wider py-2">Second Opinion</Link>
                 
                 <div className="w-full h-[1px] bg-white/5 my-2" />
                 
                 {user ? (
                    <Link 
                      href="/portal" 
                      className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-center font-bold text-sm uppercase tracking-widest transition-all"
                    >
                       Min Portal
                    </Link>
                 ) : (
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => { openAuthPage('signin'); setIsMobileMenuOpen(false); }} 
                         className="py-4 border border-white/10 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/5 transition-all"
                       >
                          Log ind
                       </button>
                       <button 
                         onClick={() => { openAuthPage('signup'); setIsMobileMenuOpen(false); }} 
                         className="shimmer-btn py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all"
                       >
                          Opret konto
                       </button>
                    </div>
                 )}
              </motion.div>
           )}
         </AnimatePresence>
       </nav>

       {/* 1. HERO SECTION */}
       <header className="relative min-h-[100dvh] flex flex-col justify-center pt-32 pb-20 px-5 sm:px-8 overflow-hidden bg-[#090d16] text-white border-b border-white/5">
         {/* Glow Effects in Background */}
         <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-purple-500/15 blur-[140px] pointer-events-none" />
         
         {/* Grid pattern background */}
         <div 
           className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ 
             backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
             backgroundSize: '24px 24px'
           }}
         />

         <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
           {/* Left Text Column */}
           <div className="lg:col-span-7 text-left space-y-8 flex flex-col items-start">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full shadow-sm"
              >
                 <Sparkles className="w-4 h-4 text-indigo-400" />
                 <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Den nye standard for socialrådgiverstuderende</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-[44px] sm:text-[64px] lg:text-[76px] font-black text-white tracking-tight leading-[1.05]"
              >
                Læs smartere.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-amber-400 italic pr-2">Ikke hårdere.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg sm:text-xl text-slate-400 max-w-xl font-medium leading-relaxed"
              >
                Cohéro strukturerer din viden, foreslår relevant litteratur direkte ud fra dine læringsmål med præcise sidetal, og genererer færdige APA-referencer.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-4"
              >
                 <button 
                   onClick={onStart}
                   className="shimmer-btn px-10 py-5 rounded-[2rem] text-lg font-bold transition-all shadow-[0_20px_40px_-15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-3 w-full sm:w-auto"
                 >
                    Opret gratis profil <ArrowRight className="w-5 h-5" />
                 </button>
                 <a 
                   href="#showcase"
                   className="px-10 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-[2rem] text-lg font-bold transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                 >
                    Se funktioner
                 </a>
              </motion.div>
           </div>

           {/* Right Mockup/Interactive Column */}
           <div className="lg:col-span-5 relative w-full flex justify-center mt-10 lg:mt-0">
              {/* Glow Behind Mockup */}
              <div className="absolute inset-[-40px] bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />

              {/* Floating Badge 1: GDPR */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="float-animation absolute top-[10%] left-[-20px] sm:left-[-40px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3 z-20 pointer-events-none"
              >
                <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-black text-white leading-none">100% GDPR-Sikret</span>
                  <span className="text-[10px] text-slate-400 mt-1">Dansk hosting og kryptering</span>
                </div>
              </motion.div>

              {/* Floating Badge 2: Efficiency */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="float-animation absolute bottom-[10%] right-[-20px] sm:right-[-40px] bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3 z-20 pointer-events-none"
                style={{ animationDelay: '-3s' }}
              >
                <div className="bg-indigo-500/20 text-indigo-400 p-2 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-black text-white leading-none">Læs Hurtigere</span>
                  <span className="text-[10px] text-slate-400 mt-1">Spar timer på pensumlæsning</span>
                </div>
              </motion.div>

              {/* Interactive Showcase Window */}
              <div className="w-full max-w-[480px] bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
                 {/* Window Header */}
                 <div className="flex items-center justify-between px-6 py-4 bg-slate-900/40 border-b border-white/5">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                       <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                       <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">student.cohero.dk/dashboard</div>
                 </div>

                 {/* Tabs */}
                 <div className="grid grid-cols-4 border-b border-white/5 bg-slate-900/20">
                    {[
                       { id: 'pensum', label: 'Pensum' },
                       { id: 'begreber', label: 'Begreber' },
                       { id: 'lovportal', label: 'Lovportal' },
                       { id: 'secondOpinion', label: 'Opinion' },
                    ].map((t) => (
                       <button
                         key={t.id}
                         onClick={() => setActiveMockupTab(t.id as any)}
                         className={`py-3 text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${
                            activeMockupTab === t.id
                               ? 'border-indigo-500 text-white bg-white/5'
                               : 'border-transparent text-slate-400 hover:text-slate-200'
                         }`}
                       >
                          {t.label}
                       </button>
                    ))}
                 </div>

                 {/* Tab content panel */}
                 <div className="p-6 min-h-[300px] flex flex-col justify-between">
                    {activeMockupTab === 'pensum' && (
                       <div className="space-y-4 text-left">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                             <Search className="w-4 h-4 text-indigo-400" />
                             <span className="text-xs text-slate-300">Barnets Lov § 43 samvær...</span>
                          </div>
                          
                          <div className="space-y-2">
                             <div className="bg-white/5 border border-white/5 rounded-xl p-3 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-md">Pensum Match</span>
                                   <span className="text-[9px] text-slate-400 font-mono">Side 142</span>
                                </div>
                                <h4 className="text-xs font-bold text-white">Socialt Arbejde med Børn og Unge</h4>
                                <p className="text-[11px] text-slate-400 leading-normal mt-1">"Betingelser for samvær og kontakt under anbringelse reguleres efter Barnets Lov § 43..."</p>
                             </div>

                             <div className="bg-white/5 border border-white/5 rounded-xl p-3 opacity-60">
                                <div className="flex justify-between items-center mb-1">
                                   <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md">Supplerende</span>
                                   <span className="text-[9px] text-slate-400 font-mono">Side 89</span>
                                </div>
                                <h4 className="text-xs font-bold text-white">Vejledning om Barnets Lov</h4>
                                <p className="text-[11px] text-slate-400 leading-normal mt-1">"Det overordnede formål er at understøtte barnets stabile relationer..."</p>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeMockupTab === 'begreber' && (
                       <div className="space-y-4 text-left">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                             <Brain className="w-4 h-4 text-purple-400" />
                             <span className="text-xs text-slate-300">Søg ord: Helhedsvurdering</span>
                          </div>
                          
                          <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                             <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white">Helhedsvurdering</h4>
                                <span className="text-[9px] font-black uppercase bg-purple-500/25 text-purple-300 px-2 py-0.5 rounded-md">Metode & Ret</span>
                             </div>
                             <p className="text-[11px] text-slate-300 leading-relaxed">
                                Princippet om, at myndigheden skal vurdere alle forhold i borgerens liv (økonomi, helbred, sociale forhold, netværk) for at yde den rette støtte, jf. Retssikkerhedsloven § 5.
                             </p>
                             <div className="border-t border-white/5 pt-2 text-[10px] text-slate-400 italic">
                                💡 Tip: Vigtigt til eksamen i forvaltningsret!
                             </div>
                          </div>
                       </div>
                    )}

                    {activeMockupTab === 'lovportal' && (
                       <div className="space-y-4 text-left">
                          <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3">
                             <Scale className="w-4 h-4 text-amber-400" />
                             <span className="text-xs text-slate-300">Slå op: Retssikkerhedsloven § 5</span>
                          </div>
                          
                          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 space-y-2">
                             <div className="flex justify-between items-center">
                                <h4 className="text-xs font-black uppercase text-amber-400">§ 5. Helhedsvurdering</h4>
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md uppercase font-bold">Gældende</span>
                             </div>
                             <p className="text-[10px] text-slate-400 italic">"Kommunen skal behandle ansøgninger om hjælp i forhold til alle de muligheder..."</p>
                             
                             <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 mt-2">
                                <span className="text-[9px] font-black text-amber-300 uppercase block mb-1">AI Fortolkning i øjenhøjde:</span>
                                <p className="text-[11px] text-slate-200 leading-normal">
                                   Kommunen må ikke kun se snævert på ét enkelt problem. De skal afdække, om borgeren har brug for andre typer hjælp undervejs.
                                </p>
                             </div>
                          </div>
                       </div>
                    )}

                    {activeMockupTab === 'secondOpinion' && (
                       <div className="space-y-4 text-left">
                          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white/5">
                             <FileText className="w-8 h-8 text-rose-400 mb-2" />
                             <span className="text-xs font-bold text-white text-ellipsis overflow-hidden max-w-full">Eksamensbesvarelse_Endelig.docx</span>
                             <span className="text-[9px] text-slate-400 mt-1">Analyse fuldført på 12 sekunder</span>
                          </div>

                          <div className="bg-white/5 border border-white/5 rounded-xl p-3.5 flex items-center justify-between">
                             <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                   <span className="w-2 h-2 rounded-full bg-rose-500" />
                                   <span className="text-xs font-bold text-white">Manglende partshøring</span>
                                </div>
                                <p className="text-[10px] text-slate-400">Forvaltningsloven § 19 er ikke nævnt i din vurdering.</p>
                             </div>
                             <div className="bg-rose-500/20 text-rose-400 text-xs font-black px-3 py-2 rounded-xl border border-rose-500/30">
                                92% Match
                             </div>
                          </div>
                       </div>
                    )}

                    {/* Footer CTA in card */}
                    <div className="border-t border-white/5 pt-4 flex items-center justify-between text-[11px] text-slate-400 mt-4">
                       <span>Prøv det nu helt gratis</span>
                       <button onClick={onStart} className="text-indigo-400 font-bold hover:underline flex items-center gap-1">
                          Opret profil <ChevronRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
         </div>
       </header>

       {/* 2. TRUST BADGES ROW */}
       <section className="py-12 bg-white border-b border-slate-100 relative z-20">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
             <div className="flex flex-wrap justify-center gap-6 sm:gap-12 md:gap-20 items-center text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                <div className="flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-indigo-500" />
                   <span>100% GDPR-Sikret</span>
                </div>
                <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                   <span>Udviklet med studerende</span>
                </div>
                <div className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-indigo-500" />
                   <span>AI Fortolkning</span>
                </div>
                <div className="flex items-center gap-2">
                   <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                   <span>4.9 på Trustpilot</span>
                </div>
             </div>
          </div>
        </section>

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
       <section id="showcase" className="relative z-20 bg-white rounded-t-[3rem] sm:rounded-t-[4rem] shadow-[0_-20px_40px_rgba(0,0,0,0.02)] px-5 sm:px-8 py-24 sm:py-32">
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

               {/* Bento 4: Lovportalen */}
               <Reveal delay={0.1} className="md:col-span-12 h-full">
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
       <section id="pricing" className="bg-[#FAF9F6] py-32 sm:py-48 px-5 sm:px-8 relative z-20">
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
