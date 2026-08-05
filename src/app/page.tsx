'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Brain, ArrowRight, Scale, ChevronRight, FileText,
  ArrowUpRight, CheckCircle2, Building2, BookOpen, Music, Check, Gift, Bird, Ghost,
  ShieldCheck, Zap, Lock, Globe, Users, Bell, Search, Menu, X, Star, FileBox,
  Gavel, Briefcase, Award, Layers, ShieldAlert, Cpu, HeartHandshake, CheckCircle, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import TikTokFeed from '@/components/home/TikTokFeed';
import ReviewMarquee from '@/components/home/ReviewMarquee';
import TrustStats from '@/components/home/TrustStats';
import HeaderNavbar from '@/components/HeaderNavbar';

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
  const [activeMockupTab, setActiveMockupTab] = useState<'pensum' | 'lovportal' | 'sagsanalyse' | 'secondOpinion'>('pensum');
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
       
       {/* HEADER NAVBAR */}
       <HeaderNavbar />

       {/* 1. HERO SECTION - COHERO STUDENT */}
       <header className="relative min-h-[100dvh] flex flex-col justify-center pt-36 pb-20 px-5 sm:px-8 overflow-hidden bg-[#FAF9F6] text-slate-900 border-b border-slate-200/80">
         {/* Background Glows */}
         <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[140px] pointer-events-none" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-amber-500/10 blur-[160px] pointer-events-none" />
         
         {/* Grid Pattern */}
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
                 className="inline-flex items-center gap-2.5 px-4 py-2 bg-indigo-50/80 border border-indigo-200/80 rounded-full shadow-sm"
               >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-900">
                    Cohéro Student · Den nye standard for velfærdsstuderende
                  </span>
               </motion.div>

               <motion.h1 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                 className="text-[42px] sm:text-[62px] lg:text-[74px] font-black text-slate-900 tracking-tight leading-[1.05]"
               >
                 Læs smartere.<br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 italic pr-2">
                   Ikke hårdere.
                 </span>
               </motion.h1>

               <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                 className="text-lg sm:text-xl text-slate-600 max-w-xl font-medium leading-relaxed"
               >
                 Cohéro Student strukturerer dit pensum, foreslår relevant litteratur direkte ud fra dine læringsmål med præcise sidetal, og giver dig juridisk og metodisk rygdækning gennem hele dit studie.
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
                     Opret gratis profil <ArrowRight className="w-5 h-5" />
                  </button>
                  <a 
                    href="#pro-tools"
                    className="px-10 py-5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-900 rounded-[2rem] text-base sm:text-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                     Se funktioner
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
                   <span>100% GDPR-Sikret & Dansk Hosting</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600" />
                   <span>Udviklet med studerende & undervisere</span>
                 </div>
               </motion.div>
            </div>

            {/* Right Mockup/Interactive Window Column */}
            <div className="lg:col-span-5 relative w-full flex justify-center mt-10 lg:mt-0">
               {/* Glow Behind Mockup */}
               <div className="absolute inset-[-40px] bg-indigo-500/10 rounded-full filter blur-[110px] pointer-events-none" />

               {/* Floating Badge 1: Pensum Match */}
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.6 }}
                 className="float-animation absolute top-[8%] left-[-20px] sm:left-[-40px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-xl flex items-center gap-3 z-20 pointer-events-none"
               >
                 <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl border border-indigo-200/80">
                   <BookOpen className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="text-[12px] font-black text-slate-900 leading-none">Præcist Pensum-Match</span>
                   <span className="text-[10px] text-indigo-700 mt-1 font-semibold">Sidehenvisning & APA-referencer</span>
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
                 <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl border border-amber-200/80">
                   <Zap className="w-5 h-5" />
                 </div>
                 <div className="flex flex-col text-left">
                   <span className="text-[12px] font-black text-slate-900 leading-none">Spar timer på læsning</span>
                   <span className="text-[10px] text-slate-500 mt-1 font-semibold">Overblik over studieordningen</span>
                 </div>
               </motion.div>

               {/* Interactive Showcase Window */}
               <div className="w-full max-w-[490px] bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/10 relative z-10">
                  {/* Window Header */}
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        <span className="ml-2 text-[10px] font-mono text-slate-400 font-semibold">student.cohero.dk/dashboard</span>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/80">
                       STUDENT V3.0
                     </span>
                  </div>

                  {/* Tabs */}
                  <div className="grid grid-cols-4 border-b border-slate-200/80 bg-slate-50/50">
                     {[
                        { id: 'pensum', label: 'Pensum' },
                        { id: 'lovportal', label: 'Lovportal' },
                        { id: 'sagsanalyse', label: 'Sagsanalyse' },
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
                     {activeMockupTab === 'pensum' && (
                        <div className="space-y-4 text-left">
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                              <Search className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-slate-700 font-medium">Pensumsøgning: Barnets Lov § 43...</span>
                           </div>
                           
                           <div className="space-y-2.5">
                              <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-3.5 relative overflow-hidden">
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                                      Pensum Match
                                    </span>
                                    <span className="text-[9px] text-indigo-800 font-mono font-bold">Side 142</span>
                                 </div>
                                 <h4 className="text-xs font-bold text-slate-900">Socialt Arbejde med Børn og Unge</h4>
                                 <p className="text-[11px] text-slate-600 leading-normal mt-1 font-medium">
                                   "Betingelser for samvær og kontakt under anbringelse reguleres efter Barnets Lov § 43..."
                                 </p>
                              </div>

                              <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5">
                                 <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
                                      Supplerende Kilde
                                    </span>
                                    <span className="text-[9px] text-amber-900 font-mono font-bold">Side 89</span>
                                 </div>
                                 <h4 className="text-xs font-bold text-slate-900">Vejledning om Barnets Lov</h4>
                                 <p className="text-[11px] text-slate-600 leading-normal mt-1 font-medium">
                                   "Det overordnede formål er at understøtte barnets stabile relationer..."
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
                                 <h4 className="text-xs font-black uppercase text-amber-800">§ 5. Helhedsvurdering</h4>
                                 <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase font-bold border border-emerald-200">Gældende ret</span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic font-medium">"Kommunen skal behandle ansøgninger om hjælp i forhold til alle de muligheder..."</p>
                              
                              <div className="bg-amber-100/60 border border-amber-200 rounded-xl p-3 mt-2">
                                 <span className="text-[9px] font-black text-amber-900 uppercase block mb-1">AI Fortolkning i øjenhøjde:</span>
                                 <p className="text-[11px] text-slate-800 leading-normal font-medium">
                                    Kommunen må ikke kun se snævert på ét enkelt problem. De skal afdække, om borgeren har brug for andre typer hjælp.
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}

                     {activeMockupTab === 'sagsanalyse' && (
                        <div className="space-y-4 text-left">
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
                              <Brain className="w-4 h-4 text-indigo-600" />
                              <span className="text-xs text-slate-700 font-medium">Metodisk Case-Analyse</span>
                           </div>
                           
                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                 <h4 className="text-xs font-bold text-slate-900">Forvaltningsretlig Vurdering</h4>
                                 <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md border border-indigo-200">
                                   Partshøring § 19
                                 </span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                Casen indeholder oplysninger der kræver skriftlig partshøring før endelig afgørelse kan træffes.
                              </p>
                              <div className="border-t border-slate-200 pt-2 text-[10px] text-emerald-700 flex items-center gap-1.5 font-bold">
                                 <CheckCircle className="w-3.5 h-3.5" /> Metodisk verificeret til opgaveskrivning.
                              </div>
                           </div>
                        </div>
                     )}

                     {activeMockupTab === 'secondOpinion' && (
                        <div className="space-y-4 text-left">
                           <div className="border border-amber-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-amber-50/50">
                              <FileText className="w-7 h-7 text-amber-600 mb-2" />
                              <span className="text-xs font-bold text-slate-900">Eksamensopgave_Final.docx</span>
                              <span className="text-[9px] text-slate-500 mt-1 font-semibold">Uvildig Second Opinion udført på 15 sekunder</span>
                           </div>

                           <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-slate-900">Faglig Kriteriematch</span>
                                 </div>
                                 <p className="text-[10px] text-slate-500 font-medium">Opgaven opfylder læringsmålene for 4. semester.</p>
                              </div>
                              <div className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-2 rounded-xl border border-emerald-200">
                                 95% Match
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Footer CTA in card */}
                     <div className="border-t border-slate-200/80 pt-4 flex items-center justify-between text-[11px] text-slate-500 mt-4 font-semibold">
                        <span>Prøv Cohero Student helt gratis</span>
                        <button onClick={onStart} className="text-indigo-600 font-extrabold hover:underline flex items-center gap-1">
                           Opret gratis profil <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
       </header>

       {/* 2. TRUST BADGES ROW */}
       <section className="py-12 bg-white border-b border-slate-200/80 relative z-20 shadow-sm">
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
             <div className="flex flex-wrap justify-center gap-8 sm:gap-14 md:gap-20 items-center text-slate-600 font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                <div className="flex items-center gap-2.5">
                   <ShieldCheck className="w-5 h-5 text-emerald-600" />
                   <span>100% GDPR-Sikret</span>
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
                   <span>4.9 / 5 Stjerner på Trustpilot</span>
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
                       Særtilbud på Cohero Student
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
                          <span className="text-3xl font-black tracking-[0.2em]">{campaigns[0].discountCode || 'STUDENT2026'}</span>
                       </div>
                    </div>
                    <Link 
                      href="/upgrade"
                      className="w-full py-5 px-8 bg-white text-slate-900 rounded-[20px] font-black uppercase text-[13px] tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      Aktiver Rabat <ArrowRight className="w-5 h-5" />
                    </Link>
                 </div>
              </div>
           </motion.div>
        </section>
       )}

       {/* 3. SOLUTIONS BY TARGET GROUP / UDDANNELSES-MÅLGRUPPER */}
       <section id="solutions" className="py-24 sm:py-32 px-5 sm:px-8 bg-white border-b border-slate-200/80 relative z-20">
          <div className="max-w-7xl mx-auto space-y-16">
             <div className="text-center max-w-3xl mx-auto space-y-6">
                <Reveal>
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/80 shadow-sm">
                    Skræddersyede Løsninger
                  </span>
                  <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-4">
                     Bygget til din uddannelse.
                  </h2>
                  <p className="text-slate-600 text-lg font-medium">
                     Uanset om du læser til socialrådgiver, pædagog, sagsbehandler eller arbejder i velfærdssektoren.
                  </p>
                </Reveal>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    icon: Briefcase,
                    title: "Socialrådgiverstuderende",
                    desc: "Søg direkte i dit pensum, håndter børne- og voksensager og slå op i lovgivningen med præcise sidetal og APA-referencer.",
                    tag: "Socialrådgiver",
                    color: "text-amber-700",
                    bg: "bg-amber-50 border-amber-200/80"
                  },
                  {
                    icon: HeartHandshake,
                    title: "Pædagoguddannelsen",
                    desc: "Styrk dine pædagogiske observationer, handleplaner og tværfaglige vurderinger med høj metodisk stringens.",
                    tag: "Pædagogik",
                    color: "text-indigo-700",
                    bg: "bg-indigo-50 border-indigo-200/80"
                  },
                  {
                    icon: GraduationCap,
                    title: "Professionshøjskoler & KP, VIA, UCL, Absalon",
                    desc: "Tilpasset studieordninger på tværs af landets professionshøjskoler og uddannelsessteder.",
                    tag: "Studieordninger",
                    color: "text-emerald-700",
                    bg: "bg-emerald-50 border-emerald-200/80"
                  },
                  {
                    icon: BookOpen,
                    title: "Efteruddannelse & Praksis",
                    desc: "Gør overgangen fra studiet til det professionelle arbejdsliv nem og sikker.",
                    tag: "Faglig Sparring",
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

       {/* 4. PRO FEATURE SHOWCASE - COHERO STUDENT TOOLS */}
       <section id="pro-tools" className="relative z-20 bg-[#FAF9F6] px-5 sm:px-8 py-24 sm:py-36 border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto space-y-20">
             
             <div className="text-center max-w-3xl mx-auto space-y-6">
               <Reveal>
                 <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/80 shadow-sm">
                   Kerneværktøjer
                 </span>
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-4">
                    Alt hvad du skal bruge til studiet,<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 italic">
                      samlet ét sted.
                    </span>
                 </h2>
               </Reveal>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[minmax(320px,auto)]">
               
               {/* Bento 1: Pensumsøgning & Litteratur */}
               <Reveal className="md:col-span-8 h-full">
                 <div onClick={onStart} className="h-full bg-white border border-slate-200/90 rounded-[3rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer hover:border-indigo-400 transition-all duration-500 shadow-lg hover:shadow-2xl">
                    <div className="absolute top-0 right-0 w-[70%] h-[70%] bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-bl-full -z-10 transition-transform duration-700 group-hover:scale-110"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div>
                          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-200/80 mb-8 text-indigo-700 group-hover:scale-110 transition-transform shadow-sm">
                             <BookOpen className="w-8 h-8" />
                          </div>
                          <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-200 mb-4">
                             Pensumsøgning & APA Referencer
                          </div>
                          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 tracking-tight">Intelligent Pensumsøgning</h3>
                          <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                            Søg semantisk i hele dit pensum og få konkrete litteraturforslag koblet direkte til dine læringsmål med præcise sidetal og færdige APA-referencer.
                          </p>
                       </div>
                       <div className="pt-10 flex items-center gap-2 text-indigo-700 font-extrabold uppercase tracking-widest text-[11px]">
                         Prøv Pensumsøgning <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 2: Begrebsguiden & Metodik */}
               <Reveal delay={0.1} className="md:col-span-4 h-full">
                 <div onClick={onStart} className="h-full bg-slate-900 text-white rounded-[3rem] p-8 sm:p-12 relative overflow-hidden group cursor-pointer shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(15,23,42,0.4)] transition-all duration-500">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.3)_0%,transparent_50%)] -z-10"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                       <div>
                          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 mb-8 text-indigo-300 group-hover:scale-110 transition-transform">
                             <Brain className="w-8 h-8" />
                          </div>
                          <div className="inline-block px-3 py-1 bg-indigo-500/25 text-indigo-200 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-400/30 mb-4">
                             Begrebsguiden & Videnskabsteori
                          </div>
                          <h3 className="text-3xl font-black mb-4 tracking-tight">Begrebsafklaring</h3>
                          <p className="text-base text-slate-300 font-medium leading-relaxed">
                            Pædagogiske og praksisnære forklaringer på komplekse faglige og videnskabsteoretiske begreber.
                          </p>
                       </div>
                       <div className="pt-8 flex items-center gap-2 text-indigo-300 font-extrabold uppercase tracking-widest text-[11px]">
                         Udforsk Begrebsguiden <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                       </div>
                    </div>
                 </div>
               </Reveal>

               {/* Bento 3: Second Opinion & Eksamenssparring (Full Width Light Card) */}
               <Reveal className="md:col-span-12 h-full">
                 <div className="h-full bg-white border border-slate-200/90 rounded-[3.5rem] p-8 sm:p-16 relative overflow-hidden text-slate-900 flex flex-col lg:flex-row gap-12 items-center justify-between shadow-xl hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-[60%] h-full bg-[radial-gradient(circle_at_100%_50%,rgba(245,158,11,0.12)_0%,transparent_70%)] -z-10"></div>
                    
                    <div className="lg:w-1/2 space-y-6">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/80 rounded-full mb-2">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Second Opinion AI</span>
                       </div>
                       <h3 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900">
                         Uvildig Second Opinion på dine opgaver
                       </h3>
                       <p className="text-lg text-slate-600 font-medium leading-relaxed">
                         Vores specialiserede AI dekonstruerer bedømmelseskriterier og matcher dem direkte op mod din studieordnings læringsmål. Få et objektivt grundlag for opgaven før du afleverer.
                       </p>
                       <button onClick={onStart} className="mt-4 px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-colors inline-flex items-center gap-3 shadow-xl shadow-slate-900/10">
                          Analysér din opgave <ArrowRight className="w-5 h-5" />
                       </button>
                    </div>

                    <div className="lg:w-1/2 w-full flex justify-center">
                       <div className="relative w-full max-w-md bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 shadow-xl text-slate-900 transform hover:rotate-0 transition-all duration-500">
                          <div className="flex justify-between items-start mb-8">
                             <div className="w-12 h-12 bg-amber-100 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-center">
                               <FileText className="w-6 h-6" />
                             </div>
                             <div className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-200">
                               Læringsmål Match
                             </div>
                          </div>
                          <div className="space-y-5">
                             <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                   <span>Teoretisk Dybde</span>
                                   <span className="text-slate-900 font-extrabold">88%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-amber-500 w-[88%]"></div>
                                </div>
                             </div>
                             <div>
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                   <span>Metodisk Stringens</span>
                                   <span className="text-indigo-700 font-extrabold">95%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                   <div className="h-full bg-indigo-600 w-[95%]"></div>
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
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">TikTok Fællesskab</span>
                 </div>
                 <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight mt-6">
                    Mød os hvor <br /> <span className="italic text-indigo-600">du er.</span>
                 </h2>
                 <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mt-6 max-w-md mx-auto lg:mx-0">
                    Vi deler dagligt tips, faglige indsigter og studiehacks direkte i dit feed.
                 </p>
                 <Link href="/tiktok" className="mt-8 inline-flex items-center gap-2 text-slate-900 font-bold uppercase tracking-widest text-[13px] border-b-2 border-slate-900 pb-1 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                    Følg os på TikTok <ArrowUpRight className="w-4 h-4" />
                 </Link>
              </Reveal>
            </div>
            <div className="w-full lg:w-5/12">
               <TikTokFeed />
            </div>
         </div>
       </section>

       {/* 7. PRICING SECTION - COHERO STUDENT TIERS */}
       <section id="pricing" className="bg-white py-32 sm:py-44 px-5 sm:px-8 relative z-20">
          <div className="max-w-7xl mx-auto text-center space-y-16">
             <Reveal>
               <span className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-200/80 shadow-sm">
                 Gennemskuelige Priser
               </span>
               <h2 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight mt-4">
                 Din fremtidige <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 italic">
                   faglighed.
                 </span>
               </h2>
             </Reveal>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch mt-16 text-left">
               {/* Free Plan */}
               <Reveal delay={0} className="w-full">
                 <div className="h-full bg-white border border-slate-200/90 p-10 sm:p-14 rounded-[3.5rem] flex flex-col hover:shadow-xl transition-all">
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
                           <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                           <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={onStart} className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                      Start gratis
                    </button>
                 </div>
               </Reveal>

               {/* Kollega+ */}
               <Reveal delay={0.1} className="w-full lg:-mt-8 lg:mb-[-2rem] relative z-10">
                  <div className="h-full bg-slate-900 p-10 sm:p-14 rounded-[4rem] shadow-2xl flex flex-col text-white relative overflow-hidden border border-white/10">
                     <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.25)_0%,transparent_60%)]"></div>
                     <div className="relative z-10">
                           <div className="inline-block bg-indigo-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 shadow-xl shadow-indigo-500/20">
                             Mest Populære
                           </div>
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
                     <button onClick={onStart} className="relative z-10 w-full py-7 bg-indigo-500 text-white rounded-[2.5rem] font-bold text-[13px] uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">
                       Vælg Kollega+
                     </button>
                  </div>
               </Reveal>

               {/* Semesterpakken */}
               <Reveal delay={0.2} className="w-full">
                  <div className="h-full bg-white p-10 sm:p-14 rounded-[3.5rem] border border-slate-200/90 flex flex-col hover:shadow-xl transition-all relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col h-full">
                       <h3 className="text-2xl font-black text-slate-900 mb-2">Semesterpakken</h3>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Spar på Kollega+</p>
                       <div className="mb-10">
                         <div className="text-5xl font-black text-slate-900 tracking-tighter mb-4">329 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/5 mdr</span></div>
                         <p className="text-emerald-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                           <CheckCircle2 className="w-3.5 h-3.5" /> Spar 116 kr. totalt
                         </p>
                       </div>
                       <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                         Præcis det samme som Kollega+ – alle funktioner og ubegrænset adgang – bare betalt samlet for et helt semester.
                       </p>
                       <div className="mt-auto pt-8">
                         <button onClick={onStart} className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-bold text-[13px] uppercase tracking-widest hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all">
                           Vælg Semester
                         </button>
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
