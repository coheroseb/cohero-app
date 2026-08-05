'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Brain, ArrowRight, Scale, ChevronRight, FileText,
  ArrowUpRight, CheckCircle2, Building2, BookOpen, Music, Check, Gift, Bird, Ghost,
  ShieldCheck, Zap, Lock, Globe, Users, Bell, Search, Menu, X, Star, FileBox,
  Gavel, Briefcase, Award, Layers, ShieldAlert, Cpu, HeartHandshake, CheckCircle
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
  const [activeMockupTab, setActiveMockupTab] = useState<'sagsanalyse' | 'lovportal' | 'journal' | 'secondOpinion'>('sagsanalyse');
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
    <div className="flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900 overflow-x-hidden font-sans antialiased bg-[#FAF9F6] text-slate-900">
       
       {/* FLOATING NAVIGATION BAR - LIGHT COHERO PRO STYLE */}
       <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 md:px-12">
         <div className="max-w-7xl mx-auto w-full bg-white/85 backdrop-blur-2xl border border-slate-200/80 rounded-[2rem] h-20 px-6 sm:px-8 flex items-center justify-between shadow-xl shadow-slate-900/5">
           <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 group">
                 <div className="flex items-end -space-x-[1.5px] scale-[0.85] origin-left">
                    <BookSpine index={0} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-5 sm:h-6" color="bg-slate-900" decoration="plain" tilt="-rotate-1" />
                    <BookSpine index={1} theme={effectiveTheme} width="w-2 sm:w-2.5" height="h-7 sm:h-8" color="bg-slate-900" decoration="bands" />
                    <BookSpine index={2} theme={effectiveTheme} width="w-1 sm:w-1.5" height="h-6 sm:h-7" color="bg-slate-900" decoration="plain" />

                    <BookSpine index={3} theme={effectiveTheme} letter="C" width="w-3 sm:w-3.5" height="h-8 sm:h-9" color="bg-slate-900" decoration="bands" />
                    <BookSpine index={4} theme={effectiveTheme} letter="o" width="w-3 sm:w-3.5" height="h-6 sm:h-7" color="bg-slate-900" decoration="gold" />
                    <BookSpine index={5} theme={effectiveTheme} letter="h" width="w-3 sm:w-3.5" height="h-9 sm:h-10" color="bg-slate-900" decoration="bands" tilt="-rotate-[1.5deg]" />
                    <BookSpine index={6} theme={effectiveTheme} letter="é" width="w-3 sm:w-3.5" height="h-7 sm:h-8" color="bg-slate-900" decoration="stripes" />
                    <BookSpine index={7} theme={effectiveTheme} letter="r" width="w-3 sm:w-3.5" height="h-8 sm:h-9" color="bg-slate-900" decoration="bands" />
                    <BookSpine index={8} theme={effectiveTheme} letter="o" width="w-3 sm:w-3.5" height="h-6 sm:h-7" color="bg-slate-900" decoration="gold" tilt="rotate-[1deg]" />

                    <BookSpine index={9} theme={effectiveTheme} width="w-1.5 sm:w-2" height="h-7 sm:h-8" color="bg-slate-900" decoration="ornament" />
                    <BookSpine index={10} theme={effectiveTheme} width="w-2 sm:w-2.5" height="h-5 sm:h-6" color="bg-slate-900" decoration="plain" tilt="rotate-2" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.25em] px-2.5 py-1 bg-amber-50 border border-amber-200/80 text-amber-700 rounded-full ml-1 shadow-sm">
                   Pro
                 </span>
              </Link>
           </div>
           
           <div className="hidden md:flex items-center gap-1.5">
              <a href="#pro-tools" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Værktøjer</a>
              <a href="#solutions" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Målgrupper</a>
              <a href="#pricing" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Priser</a>
              <Link href="/om-second-opinion" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Second Opinion</Link>
              <Link href="/shop" className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 uppercase tracking-wider transition-colors">Shop</Link>
           </div>

           <div className="flex items-center gap-4">
              {user ? (
                 <Link 
                   href="/portal"
                   className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md shadow-indigo-600/20"
                 >
                    Min Portal
                 </Link>
              ) : (
                 <>
                    <button 
                      onClick={() => openAuthPage('signin')} 
                      className="text-xs font-extrabold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors"
                    >
                       Log ind
                    </button>
                    <button 
                      onClick={() => openAuthPage('signup')} 
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-md shadow-slate-900/10"
                    >
                       Prøv Cohero Pro
                    </button>
                 </>
              )}
              
              {/* Mobile Hamburger menu button */}
              <button 
                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
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
                className="absolute top-24 left-4 right-4 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl z-40"
              >
                 <a href="#pro-tools" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Værktøjer</a>
                 <a href="#solutions" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Målgrupper</a>
                 <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Priser</a>
                 <Link href="/om-second-opinion" className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Second Opinion</Link>
                 <Link href="/shop" className="text-sm font-bold text-slate-700 hover:text-slate-900 uppercase tracking-wider py-2">Shop</Link>
                 
                 <div className="w-full h-[1px] bg-slate-100 my-2" />
                 
                 {user ? (
                    <Link 
                      href="/portal" 
                      className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-center font-bold text-sm uppercase tracking-widest transition-all"
                    >
                       Min Portal
                    </Link>
                 ) : (
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => { openAuthPage('signin'); setIsMobileMenuOpen(false); }} 
                         className="py-4 border border-slate-200 text-slate-900 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-50 transition-all"
                       >
                          Log ind
                       </button>
                       <button 
                         onClick={() => { openAuthPage('signup'); setIsMobileMenuOpen(false); }} 
                         className="py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all"
                       >
                          Prøv Pro
                       </button>
                    </div>
                 )}
              </motion.div>
           )}
         </AnimatePresence>
       </nav>

       {/* 1. HERO SECTION - LIGHT COHERO PRO LAYOUT */}
       <header className="relative min-h-[100dvh] flex flex-col justify-center pt-36 pb-20 px-5 sm:px-8 overflow-hidden bg-[#FAF9F6] text-slate-900 border-b border-slate-200/80">
         {/* Subtle Background Glows */}
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-amber-500/10 blur-[160px] pointer-events-none" />
         
         {/* Subtle Grid Pattern */}
         <div 
           className="absolute inset-0 opacity-[0.03] pointer-events-none"
           style={{ 
             backgroundImage: `radial-gradient(rgba(15, 23, 42, 0.6) 1px, transparent 1px)`,
             backgroundSize: '28px 28px'
           }}
         />

         <div className="max-w-7xl mx-auto w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            {/* Left Text Column */}
            <div className="lg:col-span-7 text-left space-y-8 flex flex-col items-start">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                 className="inline-flex items-center gap-2.5 px-4 py-2 bg-amber-50/80 border border-amber-200/80 rounded-full shadow-sm"
               >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-900">
                    Cohéro Pro · Digital AI-kollega til Velfærdssektoren
                  </span>
               </motion.div>

               <motion.h1 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                 className="text-[42px] sm:text-[62px] lg:text-[74px] font-black text-slate-900 tracking-tight leading-[1.05]"
               >
                 Din digitale AI-kollega til <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 italic pr-2">
                   socialt arbejde & jura.
                 </span>
               </motion.h1>

               <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                 className="text-lg sm:text-xl text-slate-600 max-w-xl font-medium leading-relaxed"
               >
                 Cohéro Pro giver socialrådgivere, sagsbehandlere og fagfolk krystalklar faglig rygdækning. Automatiser sagsanalyser, verificer paragraf-citeringer og løft den faglige kvalitet i hverdagen.
               </motion.p>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                 className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2"
               >
                  <button 
                    onClick={onStart}
                    className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-[2rem] text-base sm:text-lg font-extrabold uppercase tracking-wider transition-all shadow-xl shadow-slate-900/15 flex items-center justify-center gap-3 w-full sm:w-auto active:scale-95"
                  >
                     Prøv Cohero Pro gratis <ArrowRight className="w-5 h-5" />
                  </button>
                  <a 
                    href="#pro-tools"
                    className="px-10 py-5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-900 rounded-[2rem] text-base sm:text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                     Se Pro Værktøjer
                  </a>
               </motion.div>

               {/* Trust Badges under CTA */}
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.5 }}
                 className="flex flex-wrap items-center gap-6 text-slate-500 text-xs font-extrabold pt-4"
               >
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                   <span>100% GDPR & EU AI-Act Compliant</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600" />
                   <span>Praksisnær & Juridisk Verificeret</span>
                 </div>
               </motion.div>
            </div>

            {/* Right Mockup/Interactive Window Column */}
            <div className="lg:col-span-5 relative w-full flex justify-center mt-10 lg:mt-0">
               {/* Glow Behind Mockup */}
               <div className="absolute inset-[-40px] bg-indigo-500/10 rounded-full filter blur-[110px] pointer-events-none" />

               {/* Floating Badge 1: Legal Citation */}
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.6 }}
                 className="float-animation absolute top-[8%] left-[-20px] sm:left-[-40px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-20 pointer-events-none"
               >
                 <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-200/80">
                   <Scale className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="text-[12px] font-black text-slate-900 leading-none">Verificeret Paragraf</span>
                   <span className="text-[10px] text-amber-700 mt-1 font-semibold">Barnets Lov § 43 & Serviceloven</span>
                 </div>
               </motion.div>

               {/* Floating Badge 2: Efficiency */}
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.8 }}
                 className="float-animation absolute bottom-[8%] right-[-20px] sm:right-[-40px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-20 pointer-events-none"
                 style={{ animationDelay: '-3s' }}
               >
                 <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl border border-indigo-200/80">
                   <Zap className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="text-[12px] font-black text-slate-900 leading-none">60% Hurtigere Sagsanalyse</span>
                   <span className="text-[10px] text-slate-500 mt-1 font-semibold">Spar timer på journalisering</span>
                 </div>
               </motion.div>

               {/* Interactive Showcase Window - COHERO PRO DASHBOARD (LIGHT THEME) */}
               <div className="w-full max-w-[490px] bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 relative z-10">
                  {/* Window Header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="ml-2 text-[10px] font-mono text-slate-400 font-semibold">pro.cohero.dk/workstation</span>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80">
                       PRO V3.0
                     </span>
                  </div>

                  {/* Tabs */}
                  <div className="grid grid-cols-4 border-b border-slate-200/80 bg-slate-50/50">
                     {[
                        { id: 'sagsanalyse', label: 'Sagsanalyse' },
                        { id: 'lovportal', label: 'Lovportal' },
                        { id: 'journal', label: 'Journaling' },
                        { id: 'secondOpinion', label: 'Opinion' },
                     ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setActiveMockupTab(t.id as any)}
                          className={`py-3.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wider border-b-2 transition-all ${
                             activeMockupTab === t.id
                                ? 'border-indigo-600 text-indigo-900 bg-indigo-50/50'
                                : 'border-transparent text-slate-400 hover:text-slate-700'
                          }`}
                        >
                           {t.label}
                        </button>
                     ))}
                  </div>

                  {/* Tab Content Panel */}
                  <div className="p-6 min-h-[320px] flex flex-col justify-between bg-white">
                     {activeMockupTab === 'sagsanalyse' && (
                        <div className="space-y-4 text-left">
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                              <Search className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-slate-700 font-medium">Analyse af sagsakter: Børnesag § 90...</span>
                           </div>
                           
                           <div className="space-y-2.5">
                              <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 relative overflow-hidden">
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                      Verificeret Hjemmel
                                    </span>
                                    <span className="text-[9px] text-emerald-800 font-mono font-bold">Barnets Lov § 90</span>
                                 </div>
                                 <h4 className="text-xs font-bold text-slate-900">Samvær under anbringelse</h4>
                                 <p className="text-[11px] text-slate-600 leading-normal mt-1 font-medium">
                                   "Børn og unges ret til samvær med forældre og søskende skal tilgodeses..."
                                 </p>
                              </div>

                              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5">
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                                      Handlingsanvisning
                                    </span>
                                    <span className="text-[9px] text-amber-900 font-mono font-bold">Retssikkerhed</span>
                                 </div>
                                 <h4 className="text-xs font-bold text-slate-900">Partshøring & Oplysningspligt</h4>
                                 <p className="text-[11px] text-slate-600 leading-normal mt-1 font-medium">
                                   Husk at indhente skriftlig partshøring, jf. Forvaltningsloven § 19, inden afgørelse.
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeMockupTab === 'lovportal' && (
                        <div className="space-y-4 text-left">
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                              <Scale className="w-4 h-4 text-amber-600" />
                              <span className="text-xs text-slate-700 font-medium">Retssikkerhedsloven § 5 · Helhedsvurdering</span>
                           </div>
                           
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                 <h4 className="text-xs font-black uppercase text-amber-800">§ 5. Helhedsvurdering i sagsbehandling</h4>
                                 <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase font-bold border border-emerald-200">Gældende ret</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic font-medium">"Kommunen skal behandle ansøgninger om hjælp i forhold til alle de muligheder..."</p>
                              
                              <div className="bg-amber-100/60 border border-amber-200 rounded-xl p-3 mt-2">
                                 <span className="text-[9px] font-black text-amber-900 uppercase block mb-1">Juridisk Praksis-fortolkning:</span>
                                 <p className="text-[11px] text-slate-800 leading-normal font-medium">
                                    Afdæk samtlige støttebehov hos borgeren på tværs af økonomi, socialstøtte og sundhed. Sagsbehandleren har pligt til at rådgive bredt.
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeMockupTab === 'journal' && (
                        <div className="space-y-4 text-left">
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                              <Brain className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-slate-700 font-medium">Journalnotat Sparring & Kvalitetstjek</span>
                           </div>
                           
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-xs font-bold text-slate-900">Metodisk Journalnotat</h4>
                                 <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                                   SMART-Mål Match
                                 </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                Notatet opfylder kravene til faglig præcision, objektiv sprogbrug og direkte henvisning til borgers indsatsplan.
                              </p>
                              <div className="border-t border-slate-200 pt-2 text-[10px] text-emerald-700 flex items-center gap-1.5 font-bold">
                                 <CheckCircle className="w-3.5 h-3.5" /> Klar til journalisering i kommunalt fagsystem.
                              </div>
                           </div>
                        </div>
                     )}

                     {activeMockupTab === 'secondOpinion' && (
                        <div className="space-y-4 text-left">
                           <div className="border border-amber-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-amber-50/50">
                              <FileText className="w-7 h-7 text-amber-600 mb-2" />
                              <span className="text-xs font-bold text-slate-900">Afgørelse_Sagsfremstilling.pdf</span>
                              <span className="text-[9px] text-slate-500 mt-1 font-semibold">Uvildig AI-analyse udført på 15 sekunder</span>
                           </div>

                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-slate-900">Faglig Rygdækning</span>
                                 </div>
                                 <p className="text-[10px] text-slate-500 font-medium">Argumentation og paragrafer er 100% konsistente.</p>
                              </div>
                              <div className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-2 rounded-xl border border-emerald-200">
                                 98% Validitet
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Footer CTA in card */}
                     <div className="border-t border-slate-200/80 pt-4 flex items-center justify-between text-[11px] text-slate-500 mt-4 font-semibold">
                        <span>Prøv Cohero Pro helt uforpligtende</span>
                        <button onClick={onStart} className="text-indigo-600 font-extrabold hover:underline flex items-center gap-1">
                           Opret Pro profil <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       </header>

       {/* 2. TRUST BADGES ROW - LIGHT ENTERPRISE & COMPLIANCE */}
       <section className="py-12 bg-white border-b border-slate-200/80 relative z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
             <div className="flex flex-wrap justify-center gap-8 sm:gap-14 md:gap-20 items-center text-slate-600 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                <div className="flex items-center gap-2.5">
                   <ShieldCheck className="w-5 h-5 text-emerald-600" />
                   <span>100% GDPR & DPA Compliant</span>
                </div>
                <div className="flex items-center gap-2.5">
                   <Gavel className="w-5 h-5 text-amber-600" />
                   <span>Juridisk & Metodisk Valideret</span>
                </div>
                <div className="flex items-center gap-2.5">
                   <Globe className="w-5 h-5 text-indigo-600" />
                   <span>Dansk EU-Hosting</span>
                </div>
                <div className="flex items-center gap-2.5">
                   <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                   <span>4.9 / 5 Stjerner</span>
                </div>
             </div>
          </div>
        </section>

       {/* ACTIVE CAMPAIGN SPOTLIGHT */}
       {campaigns && campaigns.length > 0 && (
        <section className="px-5 sm:px-8 py-10 relative z-30 bg-[#FAF9F6]">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className={`max-w-6xl mx-auto rounded-[3.5rem] p-10 md:p-16 border-2 shadow-xl relative overflow-hidden group ${
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
                       Særtilbud på Cohero Pro
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none italic">{campaigns[0].title}</h2>
                    <p className="text-xl md:text-2xl font-medium opacity-80 max-w-2xl leading-relaxed text-current">
                       {campaigns[0].bannerText}
                    </p>
                 </div>

                 <div className="flex flex-col items-center gap-6 shrink-0 bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl">
                    <div className="text-center">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-3">Anvend denne rabatkode</p>
                       <div className="px-10 py-5 bg-white/20 rounded-2xl border-2 border-dashed border-white/40 flex items-center justify-center">
                          <span className="text-3xl font-black tracking-[0.2em]">{campaigns[0].discountCode || 'PRO2026'}</span>
                       </div>
                    </div>
                    <Link 
                      href="/upgrade"
                      className="w-full py-5 px-8 bg-white text-slate-900 rounded-[20px] font-black uppercase text-[13px] tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Aktiver Pro Rabat <ArrowRight className="w-5 h-5" />
                    </Link>
                 </div>
              </div>
           </motion.div>
        </section>
       )}

       {/* 3. SOLUTIONS BY TARGET GROUP / AUDIENCE */}
       <section id="solutions" className="py-24 sm:py-32 px-5 sm:px-8 bg-white border-b border-slate-200/80 relative z-20">
          <div className="max-w-7xl mx-auto space-y-16">
             <div className="text-center max-w-3xl mx-auto space-y-6">
                <Reveal>
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/80 shadow-sm">
                    Skræddersyede Løsninger
                  </span>
                  <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-4">
                     Bygget til hele velfærdssektoren.
                  </h2>
                  <p className="text-slate-600 text-lg font-medium">
                     Uanset om du sidder i myndighedssagsbehandling, praksispædagogik, kommune eller på studiet.
                  </p>
                </Reveal>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Briefcase,
                    title: "Socialrådgivere & Sagsbehandlere",
                    desc: "Håndter børne- og voksensager med direkte hjemmelsvisning, forvaltningsretlige tjek og kvalitetssikret journalføring.",
                    tag: "Myndighed & Praksis",
                    color: "text-amber-700",
                    bg: "bg-amber-50 border-amber-200/80"
                  },
                  {
                    icon: HeartHandshake,
                    title: "Pædagoger & Specialområdet",
                    desc: "Udarbejd pædagogiske observationer, handleplaner og tværfaglige vurderinger med høj metodisk stringens.",
                    tag: "Pædagogik & Støtte",
                    color: "text-indigo-700",
                    bg: "bg-indigo-50 border-indigo-200/80"
                  },
                  {
                    icon: Building2,
                    title: "Kommuner & Institutioner",
                    desc: "Samlede team-licenser med fuld datasikkerhed, anonymiseret databehandling og central styring.",
                    tag: "Enterprise & Afdelinger",
                    color: "text-emerald-700",
                    bg: "bg-emerald-50 border-emerald-200/80"
                  },
                  {
                    icon: BookOpen,
                    title: "Studerende & Forskning",
                    desc: "Broen mellem studieordningens læringsmål og den konkrete praksis i feltet.",
                    tag: "Uddannelse & Forskning",
                    color: "text-purple-700",
                    bg: "bg-purple-50 border-purple-200/80"
                  }
                ].map((item, i) => (
                  <Reveal key={i} delay={i * 0.1}>
                    <div 
                      onClick={onStart}
                      className="bg-slate-50/60 border border-slate-200/80 rounded-[2.5rem] p-8 flex flex-col justify-between h-full hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-500 hover:scale-[1.02] cursor-pointer group"
                    >
                      <div className="space-y-6">
                        <div className={`w-14 h-14 rounded-2xl ${item.bg} border flex items-center justify-center ${item.color} group-hover:rotate-6 transition-transform shadow-sm`}>
                           <item.icon className="w-7 h-7" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.bg} ${item.color}`}>
                           {item.tag}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed font-medium">{item.desc}</p>
                      </div>
                      <div className="pt-8 flex items-center gap-2 text-xs font-extrabold text-slate-700 group-hover:text-indigo-600 transition-colors">
                        Læs mere <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Reveal>
                ))}
             </div>
          </div>
       </section>

       {/* 4. PRO FEATURE SHOWCASE (LIGHT BENTO GRID) */}
       <section id="pro-tools" className="relative z-20 bg-[#FAF9F6] px-5 sm:px-8 py-24 sm:py-36 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto space-y-20">
             
             <div className="text-center max-w-3xl mx-auto space-y-6">
               <Reveal>
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/80 shadow-sm">
                   Kerneværktøjer
                 </span>
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-4">
                    Skabt til faglig fordybelse og <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 italic">
                      høj præcision.
                    </span>
                 </h2>
               </Reveal>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(320px,auto)]">
               
               {/* Bento 1: Juridisk Lovportal & Paragraf-Omsætter */}
               <Reveal className="md:col-span-8 h-full">
                 <div onClick={onStart} className="h-full bg-white border border-slate-200/90 rounded-[3rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer hover:border-amber-400 transition-all duration-500 shadow-lg hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-[70%] h-[70%] bg-gradient-to-bl from-amber-100/60 to-transparent rounded-bl-full -z-10 transition-transform duration-700 group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div>
                          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200/80 mb-8 text-amber-700 group-hover:scale-110 transition-transform shadow-sm">
                             <Scale className="w-8 h-8" />
                          </div>
                          <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-200 mb-4">
                             Lovportal & Paragraf-Omsætter
                          </div>
                          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Juridisk Citering & Fortolkning</h3>
                          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                            Slå direkte op i gældende lovgivning (Barnets Lov, Serviceloven, Forvaltningsloven, Retssikkerhedsloven). Få direkte citater med grønne validerings-badges og forklaringer i øjenhøjde.
                          </p>
                       </div>
                       <div className="pt-10 flex items-center gap-2 text-amber-700 font-extrabold uppercase tracking-widest text-[11px]">
                         Udforsk Lovportalen <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 2: AI Case-Analyser & Journal-Træner */}
               <Reveal delay={0.1} className="md:col-span-4 h-full">
                 <div onClick={onStart} className="h-full bg-slate-900 text-white rounded-[3rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] transition-all duration-500">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.3)_0%,transparent_50%)] -z-10"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div>
                          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-8 text-indigo-300 group-hover:scale-110 transition-transform">
                             <Brain className="w-8 h-8" />
                          </div>
                          <div className="inline-block px-3 py-1 bg-indigo-500/25 text-indigo-200 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-400/30 mb-4">
                             Case-Analyser & Journaling
                          </div>
                          <h3 className="text-3xl font-black mb-4 tracking-tight">Metodisk Sagsanalyse</h3>
                          <p className="text-base text-slate-300 font-medium leading-relaxed">
                            Automatisk gennemgang af kompleks sagsprosaik. Identificerer juridiske faldgruber og forvaltningsretlige mangler.
                          </p>
                       </div>
                       <div className="pt-8 flex items-center gap-2 text-indigo-300 font-extrabold uppercase tracking-widest text-[11px]">
                         Afprøv Sagsanalyse <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 3: Second Opinion & Quality Audit (Full Width Light Card) */}
               <Reveal className="md:col-span-12 h-full">
                 <div className="h-full bg-white border border-slate-200/90 rounded-[3.5rem] p-8 sm:p-16 relative overflow-hidden text-slate-900 flex flex-col lg:flex-row gap-12 items-center justify-between shadow-xl hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-[60%] h-full bg-[radial-gradient(circle_at_100%_50%,rgba(245,158,11,0.12)_0%,transparent_70%)] -z-10"></div>
                    
                    <div className="lg:w-1/2 space-y-6">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/80 rounded-full mb-2">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Second Opinion AI</span>
                       </div>
                       <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
                         Uvildig Faglig Sparring på Sagsfremstillinger
                       </h3>
                       <p className="text-lg text-slate-600 font-medium leading-relaxed">
                         Få et objektivt kvalitetstjek af dine faglige skrivelser, afgørelser eller eksamensopgaver. Vores model måler krystalklart op mod gældende retssikkerhed og metodiske retningslinjer.
                       </p>
                       <button onClick={onStart} className="mt-4 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors inline-flex items-center gap-3 shadow-xl shadow-slate-900/10">
                          Kør en Second Opinion <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="lg:w-1/2 w-full flex justify-center">
                       <div className="relative w-full max-w-md bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-xl text-slate-900 transform hover:rotate-0 transition-all duration-500">
                          <div className="flex justify-between items-start mb-8">
                             <div className="w-12 h-12 bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-center">
                               <FileText className="w-6 h-6" />
                             </div>
                             <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                               Faglig Konsistens
                             </div>
                          </div>
                          <div className="space-y-5">
                             <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                   <span>Juridisk Hjemmel Match</span>
                                   <span className="text-slate-900 font-extrabold">98%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-amber-500 w-[98%]"></div>
                                </div>
                             </div>
                             <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                   <span>Retssikkerhed & Partshøring</span>
                                   <span className="text-emerald-700 font-extrabold">100%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500 w-[100%]"></div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               </Reveal>

             </div>
          </div>
       </section>

       {/* 5. TRUST STATS & REVIEWS */}
       <div className="bg-white px-5 py-24 relative z-20 border-b border-slate-200/80">
         <TrustStats />
         <ReviewMarquee />
       </div>

       {/* 6. TIKTOK & COMMUNITY FEED */}
       <section className="bg-[#FAF9F6] py-28 px-5 sm:px-8 border-b border-slate-200/80 relative z-20 overflow-hidden">
         <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Reveal>
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full mb-2 shadow-sm">
                    <Music className="w-4 h-4 text-slate-900" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">Faglige Fællesskaber & Socials</span>
                 </div>
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-6">
                    Følg med i vores <br /> <span className="italic text-indigo-600">faglige univers.</span>
                 </h2>
                 <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mt-6 max-w-md mx-auto lg:mx-0">
                    Vi deler dagligt metodiske indsigter, juratips og praksisnære eksempler direkte i dit feed.
                 </p>
                 <Link href="/tiktok" className="mt-8 inline-flex items-center gap-2 text-slate-900 font-bold uppercase tracking-widest text-[13px] border-b-2 border-slate-900 pb-1 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                    Mød os på TikTok <ArrowUpRight className="w-4 h-4" />
                 </Link>
              </Reveal>
            </div>
            <div className="w-full lg:w-5/12">
               <TikTokFeed />
            </div>
         </div>
       </section>

       {/* 7. PRICING SECTION - LIGHT COHERO PRO TIERS */}
       <section id="pricing" className="bg-white py-32 sm:py-44 px-5 sm:px-8 relative z-20">
          <div className="max-w-7xl mx-auto text-center space-y-16">
             <Reveal>
               <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/80 shadow-sm">
                 Gennemskuelige Priser
               </span>
               <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mt-4">
                 Invester i din <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 italic">
                   faglige rygdækning.
                 </span>
               </h2>
             </Reveal>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mt-16 text-left">
               {/* Basis Plan */}
               <Reveal delay={0} className="w-full">
                 <div className="h-full bg-white border border-slate-200/90 p-10 sm:p-14 rounded-[3.5rem] flex flex-col hover:shadow-xl transition-all">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Gratis Basis</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Afprøv Værktøjerne</p>
                    <div className="text-5xl font-black text-slate-900 mb-12 tracking-tighter">0 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/mdr</span></div>
                    <ul className="space-y-6 mb-16 flex-grow">
                      {[
                        "Begrænset opslag i Lovportalen",
                        "Grundlæggende begrebsafklaring",
                        "Personlige gemte noter",
                      ].map(item => (
                        <li key={item} className="flex items-center gap-4 text-slate-600 font-medium">
                           <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                           <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={onStart} className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                      Start Gratis
                    </button>
                 </div>
               </Reveal>

               {/* Cohero Pro / Kollega+ */}
               <Reveal delay={0.1} className="w-full lg:-mt-8 lg:mb-[-2rem] relative z-10">
                  <div className="h-full bg-slate-900 p-10 sm:p-14 rounded-[4rem] shadow-2xl flex flex-col text-white relative overflow-hidden border border-white/10">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.25)_0%,transparent_60%)]"></div>
                     <div className="relative z-10">
                           <div className="inline-block bg-amber-400 text-slate-950 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-amber-400/20">
                             Mest Populære Pro Licens
                           </div>
                           <h3 className="text-3xl font-black mb-2">Cohero Pro (Kollega+)</h3>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300 mb-10">Ubegrænset Faglig AI</p>
                           
                           <div className="mb-12">
                               <div className="text-6xl font-black tracking-tighter mb-4">89 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/mdr</span></div>
                               <p className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                   <Zap className="w-4 h-4 fill-current" /> 7 dages gratis prøveperiode
                               </p>
                           </div>
                     </div>

                     <ul className="space-y-6 mb-16 flex-grow relative z-10">
                        {[
                          "Ubegrænset Lovportal & Paragraf-Omsætter",
                          "Fuld Case-Analyse & Journal Sparring",
                          "Second Opinion AI på alle skrivelser",
                          "100% GDPR & Anonymiseret Datastorage"
                        ].map(item => (
                          <li key={item} className="flex items-center gap-4 text-white font-medium">
                             <div className="w-6 h-6 bg-amber-400/20 rounded-full flex items-center justify-center border border-amber-400/30 flex-shrink-0">
                                <Check className="w-4 h-4 text-amber-300" />
                             </div>
                             <span>{item}</span>
                          </li>
                        ))}
                     </ul>
                     <button onClick={onStart} className="relative z-10 w-full py-7 bg-amber-400 text-slate-950 rounded-[2.5rem] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-amber-400/30 hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all">
                       Vælg Cohero Pro
                     </button>
                  </div>
               </Reveal>

               {/* Kommune & Team Licens */}
               <Reveal delay={0.2} className="w-full">
                  <div className="h-full bg-white p-10 sm:p-14 rounded-[3.5rem] border border-slate-200/90 flex flex-col hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                       <h3 className="text-2xl font-black text-slate-900 mb-2">Team & Kommune</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">For Afdelinger & Licenser</p>
                       <div className="mb-10">
                         <div className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Kontakt os</div>
                         <p className="text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                           <Building2 className="w-4 h-4" /> Tilpassede Kommune-aftaler
                         </p>
                       </div>
                       <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                         Til kommuner, institutioner og større afdelinger der ønsker samlet licensaftale, ISO-audit-trail og dedikeret onboarding.
                       </p>
                       <div className="mt-auto pt-8">
                         <a href="mailto:kontakt@cohero.dk?subject=Forespørgsel om Kommune/Team Licens" className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-center block">
                           Kontakt Salg
                         </a>
                       </div>
                    </div>
                  </div>
               </Reveal>
             </div>
          </div>
       </section>

       {/* FOOTER - LIGHT COHERO PRO STYLE */}
       <footer className="bg-slate-950 border-t border-slate-800 py-16 px-5 sm:px-8 text-slate-400 text-sm">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-left">
            <div className="space-y-4 md:col-span-1">
               <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-white tracking-tight">Cohéro Pro</span>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">
                 Digital AI-kollega til velfærdssektoren, socialt arbejde og juridisk sagsbehandling.
               </p>
               <p className="text-[11px] text-slate-400 pt-2">
                 © {new Date().getFullYear()} Cohéro ApS · CVR: 43219876
               </p>
            </div>

            <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Værktøjer</h4>
               <ul className="space-y-2.5 text-xs">
                  <li><a href="#pro-tools" className="hover:text-white transition-colors">Lovportalen</a></li>
                  <li><a href="#pro-tools" className="hover:text-white transition-colors">Case-Analyser</a></li>
                  <li><Link href="/om-second-opinion" className="hover:text-white transition-colors">Second Opinion</Link></li>
                  <li><Link href="/concept-explainer" className="hover:text-white transition-colors">Begrebsguiden</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Platform</h4>
               <ul className="space-y-2.5 text-xs">
                  <li><a href="#solutions" className="hover:text-white transition-colors">Socialrådgivere</a></li>
                  <li><a href="#solutions" className="hover:text-white transition-colors">Pædagoger</a></li>
                  <li><a href="#solutions" className="hover:text-white transition-colors">Kommuner</a></li>
                  <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Vilkår & Betingelser</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privatlivspolitik</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">Kontakt & Support</h4>
               <ul className="space-y-2.5 text-xs">
                  <li><a href="mailto:kontakt@cohero.dk" className="hover:text-white transition-colors">kontakt@cohero.dk</a></li>
                  <li><Link href="/faq" className="hover:text-white transition-colors">Ofte stillede spørgsmål (FAQ)</Link></li>
                  <li><Link href="/ambassadoer" className="hover:text-white transition-colors">Bliv Ambassadør</Link></li>
               </ul>
            </div>
         </div>
       </footer>

    </div>
  );
}
