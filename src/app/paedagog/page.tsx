'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  ArrowRight, 
  Star, 
  Users, 
  Heart, 
  Zap, 
  Compass, 
  Quote, 
  Baby, 
  ShieldCheck, 
  BookMarked,
  Scale,
  Building,
  Check,
  CheckCircle2,
  Download,
  Library,
  Music,
  Lock,
  Wand2,
  GraduationCap,
  ChevronRight,
  Search,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ReviewMarquee from '@/components/home/ReviewMarquee';
import TikTokFeed from '@/components/home/TikTokFeed';
import PWAInstallGuide from '@/components/PWAInstallGuide';

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

const FloatingElement: React.FC<{ className: string; delay: number }> = ({ className, delay }) => (
  <motion.div 
    animate={{ 
      y: [0, -20, 0],
      rotate: [0, 10, -10, 0],
      opacity: [1, 0.8, 1]
    }}
    transition={{ 
      duration: 5, 
      delay, 
      repeat: Infinity, 
      ease: "easeInOut" 
    }}
    className={`absolute w-3 h-3 bg-emerald-950/5 rounded-full blur-[2px] ${className}`}
  />
);

interface PedagogueLandingContentProps {
  onStart: () => void;
}

const PedagogueLandingContent: React.FC<PedagogueLandingContentProps> = ({ onStart }) => {
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setShowStickyCTA(true);
      else setShowStickyCTA(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInstallClick = () => setIsInstallGuideOpen(true);

  return (
    <div className="flex flex-col selection:bg-emerald-100 selection:text-emerald-950 overflow-x-hidden bg-[#FDFBF7] font-sans antialiased">
      
      <div className="pt-20 sm:pt-24 lg:pt-28">
         <ReviewMarquee />
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center pb-16 px-5 sm:px-8 overflow-hidden">
        {/* Atmospheric Details */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-[#F1F9F4]/60 to-[#FDFBF7] -z-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90vw] h-[90vw] bg-emerald-50/20 rounded-full blur-[120px] -z-10"></div>
        <FloatingElement className="top-1/4 left-10" delay={0.5} />
        <FloatingElement className="top-1/3 right-20" delay={1.2} />
        <FloatingElement className="bottom-1/4 left-1/4" delay={2.5} />
        
        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          <div className="flex-1 flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 sm:space-y-10 w-full mt-8 lg:mt-0">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-50 border border-emerald-200/50 rounded-full shadow-sm mb-2">
                <Baby size={14} className="text-emerald-700" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-900">Den pædagogiske dannelsesrejse</span>
              </div>
            </Reveal>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-[40px] leading-[1.05] sm:text-6xl md:text-7xl xl:text-[88px] font-extrabold text-[#064e3b] tracking-[-0.04em] w-full max-w-[20ch] lg:max-w-none serif"
            >
              Fra teori til <br className="hidden sm:block" />
              <span className="relative inline-block mt-2 md:mt-4 px-2 sm:px-4 shrink-0 overflow-hidden py-2 italic text-[#065f46]">
                nærvær.
                <motion.svg 
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    scaleX: [0.98, 1.02, 0.98]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute -bottom-1 sm:-bottom-3 left-0 w-full h-3 sm:h-5 text-emerald-300/40 -z-10" 
                  viewBox="0 0 100 10" 
                  preserveAspectRatio="none"
                >
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                </motion.svg>
              </span>
            </motion.h1>
            
            <Reveal delay={0.1}>
              <p className="text-[17px] sm:text-xl lg:text-2xl text-slate-600 max-w-lg lg:max-w-xl leading-relaxed sm:leading-relaxed font-medium">
                Den komplette platform til pædagogstudiet. Mestre koblingen mellem udviklingspsykologi, inklusion og hverdagens etiske dilemmaer.
              </p>
            </Reveal>
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="flex flex-col w-full sm:w-auto items-center lg:items-start gap-5 pt-4"
            >
              <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 sm:gap-4">
                  <button 
                  onClick={onStart}
                  className="group relative flex justify-center items-center px-8 sm:px-10 py-5 sm:py-6 bg-[#064e3b] text-white rounded-[20px] sm:rounded-2xl text-[17px] sm:text-xl font-bold transition-all active:scale-[0.98] sm:hover:bg-[#065f46] sm:hover:scale-[1.02] shadow-xl shadow-emerald-900/10 w-full overflow-hidden will-change-transform"
                  >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                          Start din dannelse
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                  
                   <button
                       onClick={handleInstallClick}
                       className="flex justify-center items-center gap-2.5 px-6 sm:px-8 py-5 sm:py-6 bg-white/80 backdrop-blur-md border border-emerald-100 text-emerald-900 rounded-[20px] sm:rounded-2xl font-bold text-[15px] sm:text-[13px] uppercase sm:tracking-widest active:scale-[0.98] sm:hover:bg-emerald-50 transition-all shadow-sm w-full sm:w-auto will-change-transform"
                   >
                       <Download className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-600" />
                       Hent App
                   </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6 mt-4 opacity-90">
                  <div className="flex flex-col items-center sm:items-start gap-1">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[13px] sm:text-sm bg-emerald-50 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>7 dages gratis prøveperiode</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center sm:text-left mx-1">Ingen binding • Opret på 30 sek.</p>
                  </div>
              </div>
            </motion.div>
          </div>

          {/* Visual Demo Card */}
          <div className="lg:col-span-5 relative hidden lg:block reveal delay-2">
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 1, -1, 0]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="bg-white border border-emerald-100 p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center">
                    <Heart className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">Modul: Inklusion & Relationer</p>
                    <h3 className="text-xl font-bold text-emerald-950 serif">Relations-Spejlet</h3>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-2xl border-l-4 border-emerald-800 italic text-emerald-950/70 text-sm">
                    "Hvordan skaber jeg deltagelsesmuligheder for barnet, der trækker sig fra fællesskabet?"
                  </div>
                  
                  <div className="p-8 bg-[#064e3b] text-white rounded-2xl shadow-xl transform translate-x-8">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Faglig Resonans</span>
                    </div>
                    <p className="text-sm text-emerald-50/90 leading-relaxed">
                      "Prøv at analysere barnets position gennem Lave og Wengers begreb om 'legitim perifer deltagelse'. Er rammerne anerkendende nok?"
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -top-10 -right-10 z-20 bg-white p-6 rounded-3xl shadow-xl border border-emerald-50 -rotate-6">
                 <Compass className="w-8 h-8 text-emerald-600" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRUST RIBBON */}
      <section className="py-8 sm:py-16 bg-white border-y border-slate-100 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <Reveal>
             <p className="text-[10px] items-center text-center font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 mb-6 sm:mb-8 px-4">Styrker dannelsen på tværs af landets pædagoguddannelser</p>
           </Reveal>
           <div className="w-full overflow-x-auto no-scrollbar px-4 sm:px-6">
             <div className="flex items-center justify-start sm:justify-center gap-8 sm:gap-16 min-w-max pb-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500 font-serif italic text-emerald-950 scale-110">
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em]">Københavns Professionshøjskole</span>
                <div className="w-1 h-1 rounded-full bg-emerald-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em]">VIA UC</span>
                <div className="w-1 h-1 rounded-full bg-emerald-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em]">UCL Erhvervsakademi</span>
                <div className="w-1 h-1 rounded-full bg-emerald-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em]">Absalon</span>
                <div className="w-1 h-1 rounded-full bg-emerald-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em]">DMMH</span>
             </div>
           </div>
        </div>
      </section>

      {/* SECTION: HAR DU BRUG FOR FAGLIG HJÆLP? (Citizen Support) */}
      <section className="py-24 sm:py-40 bg-emerald-950 relative overflow-hidden px-5 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_70%)]"></div>
        <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl bg-emerald-400 rounded-full"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
            {/* Illustration side */}
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
                <Reveal className="relative flex items-center justify-center">
                    <div className="relative w-full aspect-square max-w-md">
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.05, 1],
                                rotate: [0, 2, 0, -2, 0]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 m-auto w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(16,185,129,0.4)] flex items-center justify-center border-4 border-white/20 z-20"
                        >
                            <ShieldCheck className="w-20 h-20 sm:w-28 sm:h-28 text-white" />
                        </motion.div>

                        {[
                            { icon: Heart, delay: 0, color: 'bg-emerald-400', label: 'Nærvær' },
                            { icon: Baby, delay: 2, color: 'bg-amber-400', label: 'Børnesyn' },
                            { icon: Users, delay: 4, color: 'bg-sky-400', label: 'Samarbejde' },
                            { icon: GraduationCap, delay: 6, color: 'bg-indigo-400', label: 'Pædagogik' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                animate={{ rotate: 360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: -item.delay }}
                                className="absolute inset-0 m-auto w-full h-full pointer-events-none"
                            >
                                <motion.div 
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: -item.delay }}
                                    className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 ${item.color} rounded-[1.5rem] shadow-2xl flex flex-col items-center justify-center gap-1 border-2 border-white/30 backdrop-blur-md pointer-events-auto`}
                                >
                                    <item.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-white/80 tracking-tighter">{item.label}</span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>
                </Reveal>
            </div>

            {/* Text Side */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2 space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-50/80">Netværk for forældre og fagfolk</span>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight serif">
                            Styrk din <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300 italic">faglige stemme.</span>
                        </h2>
                        <p className="text-xl text-emerald-100/60 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 mt-6">
                            Har du brug for sparring til en handleplan, hjælp til at forstå pædagogiske rapporter eller ønsker du at finde en ekspert indenfor inklusion? 
                        </p>
                    </Reveal>
                </div>

                <Reveal delay={0.2}>
                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <Link 
                            href="/raadgivning" 
                            className="group relative px-10 py-6 bg-white text-emerald-950 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl hover:scale-105 transition-all w-full sm:w-auto overflow-hidden active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                Få sparring her
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </span>
                        </Link>
                        <div className="flex items-center gap-4 py-2 opacity-50">
                             <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">Studerende & Eksperter fra hele landet</p>
                        </div>
                    </div>
                </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* PEDAGOGICAL TOOLS - CORE FEATURES */}
      <section id="vaerktojer" className="py-20 sm:py-32 bg-[#FDFBF7] px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12 sm:mb-20 text-center lg:text-left mx-auto lg:mx-0">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-950 tracking-[-0.03em] mb-4 sm:mb-6 leading-tight serif">
                Værktøjer til din <br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#064e3b] to-[#10b981] italic">pædagogiske praksis.</span>
              </h2>
              <p className="text-[17px] sm:text-xl text-slate-500 leading-relaxed font-medium">
                Fra logbog over dine observationer til AI-baseret teorikobling. Cohéro er dit fundament for faglig udvikling.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
             
             {/* Feature 1: Logbog */}
             <Reveal className="lg:col-span-8">
               <div onClick={onStart} className="h-full bg-white border border-emerald-100 p-8 sm:p-12 lg:p-16 rounded-[32px] sm:rounded-[48px] shadow-sm relative overflow-hidden group sm:hover:shadow-2xl sm:hover:border-emerald-200 transition-all cursor-pointer active:scale-[0.98]">
                  <div className="absolute top-[-20%] right-[-10%] p-12 opacity-[0.03] sm:group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                     <BookMarked className="w-80 h-80 -rotate-12 text-[#064e3b]" />
                  </div>
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-10">
                     <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 rounded-[24px] sm:rounded-[32px] flex items-center justify-center flex-shrink-0 sm:group-hover:rotate-6 sm:group-hover:scale-105 transition-all shadow-sm border border-emerald-200/50">
                        <BookMarked className="w-10 h-10 sm:w-12 sm:h-12" />
                     </div>
                     <div className="space-y-4">
                        <span className="inline-block px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border border-emerald-200">Studie-Refleksion</span>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#064e3b] tracking-tight leading-none px-1 serif">Min Logbog</h3>
                        <p className="text-slate-500 text-[16px] sm:text-lg leading-relaxed font-medium">Gense dine gemte analyser, observationer og refleksioner fra praktikforløb og undervisning.</p>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-[13px] tracking-wider pt-2 sm:group-hover:translate-x-2 transition-transform">
                          Se dine noter <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                     </div>
                  </div>
               </div>
             </Reveal>

             {/* Feature 2: Samtals-træner */}
             <Reveal delay={0.1} className="lg:col-span-4">
               <div onClick={onStart} className="h-full bg-emerald-950 p-8 sm:p-12 rounded-[32px] sm:rounded-[48px] shadow-2xl text-white flex flex-col justify-between group cursor-pointer overflow-hidden relative active:scale-[0.98] transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#065f46]/50 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-400/20 rounded-[24px] flex items-center justify-center mb-6 sm:mb-8 backdrop-blur-md sm:group-hover:bg-amber-400 sm:group-hover:text-amber-950 transition-colors border border-white/5">
                      <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-300 sm:group-hover:text-amber-950 transition-colors" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight mb-3 serif">Samtals-træner</h3>
                    <p className="text-emerald-100/60 text-[15px] sm:text-base leading-relaxed font-medium">Øv den svære forældresamtale eller sparring i en tryg AI-simulering.</p>
                  </div>
                  <div className="pt-10 flex items-center justify-between border-t border-emerald-800 mt-auto relative z-10">
                     <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Træn nu</span>
                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-emerald-700 flex items-center justify-center bg-white/5 sm:group-hover:bg-white sm:group-hover:text-emerald-950 transition-all">
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                     </div>
                  </div>
               </div>
             </Reveal>

             {/* Feature 3: Teori-kobleren */}
             <Reveal className="lg:col-span-12">
               <div onClick={onStart} className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 p-8 sm:p-12 lg:p-16 rounded-[32px] sm:rounded-[48px] flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12 group sm:hover:shadow-2xl sm:hover:border-sky-200 transition-all cursor-pointer shadow-sm relative overflow-hidden active:scale-[0.98]">
                  <div className="flex-1 space-y-4 sm:space-y-6 order-2 sm:order-1 relative z-10">
                     <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-sky-700 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-sky-100 mb-2">
                        <Brain className="w-3.5 h-3.5 fill-current" /> Fra observation til analyse
                     </div>
                     <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-sky-950 tracking-tight leading-none serif">Teori-kobleren</h3>
                     <p className="text-slate-500 text-[16px] sm:text-lg leading-relaxed font-medium max-w-2xl">Brug AI til at finde relevante teoretikere og begreber til dine observationer fra praktikken eller undervisningen.</p>
                     <div className="flex items-center gap-2 text-sky-600 font-bold uppercase text-[13px] tracking-wider pt-2 sm:group-hover:translate-x-2 transition-transform">
                          Start kobling <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                     </div>
                  </div>
                  <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white text-sky-500 rounded-[24px] sm:rounded-[32px] flex items-center justify-center flex-shrink-0 sm:group-hover:-translate-y-2 transition-all shadow-xl border border-sky-100 order-1 sm:order-2 relative z-10">
                     <Wand2 className="w-10 h-10 sm:w-16 sm:h-16" />
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-64 bg-sky-200/20 rounded-full blur-[60px] pointer-events-none"></div>
               </div>
             </Reveal>
          </div>
        </div>
      </section>

      {/* SECTION: TIKTOK FEED */}
      <section className="py-24 sm:py-40 bg-[#FDFBF7] relative overflow-hidden px-5 sm:px-8 border-t border-slate-100/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.05)_0%,transparent_100%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/50 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#064e3b]">Pædagogisk Inspiration</span>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#064e3b] tracking-[-0.04em] leading-[1.05] serif">
                  Inspiration til <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-amber-500 italic">din praktiske hverdag.</span>
                </h2>
                <p className="text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed mt-6">
                  Vi deler dagligt tips til aktiviteter, inklusion og pædagogisk sparring direkte på din feed.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                  <Link 
                    href="/tiktok" 
                    className="group relative px-10 py-6 bg-[#064e3b] text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl hover:scale-105 transition-all w-full sm:w-auto overflow-hidden active:scale-95 text-center"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Se alle videoer
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </span>
                  </Link>
                  <div className="flex items-center gap-3 py-2 opacity-50">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nyt indhold hver dag</span>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="w-full lg:w-5/12 flex justify-center">
              <Reveal delay={0.3} className="relative">
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-200/20 to-amber-200/20 blur-3xl opacity-50 -z-10 animate-pulse" />
                <TikTokFeed />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="priser" className="py-20 sm:py-32 bg-[#FDFBF7] px-5 sm:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20 space-y-4 sm:space-y-6">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-emerald-950 tracking-tight leading-none px-2 serif">
                Prøv <span className="text-amber-500 italic">Kollega+</span> i dag.
              </h2>
              <p className="text-[17px] sm:text-xl text-slate-500 font-medium max-w-xl mx-auto px-4">
                Fuld rygdækning gennem hele din pædagoguddannelse. Start gratis – ingen binding.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8 items-stretch max-w-lg mx-auto lg:max-w-none">
            {/* Free Plan */}
            <Reveal delay={0} className="w-full">
              <div className="h-full bg-white border border-slate-200 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm flex flex-col transition-all active:scale-[0.98] sm:hover:border-slate-300">
                 <h3 className="text-[22px] sm:text-2xl font-bold text-slate-900 mb-1">Kollega</h3>
                 <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 sm:mb-8">Grundstenen</p>
                 <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 sm:mb-10 tracking-tight">0 kr. <span className="text-[15px] sm:text-base font-medium text-slate-400 tracking-normal text-balance">/mdr</span></div>
                 <ul className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-grow">
                   {[
                     "1 dagligt opslag i Guiden",
                     "1 daglig logbogs-analyse",
                     "Begrænset Teori-kobler",
                     "Låst Samtals-træner",
                     "Låst Case-Analytiker"
                   ].map(item => (
                     <li key={item} className="flex items-start gap-4 text-[15px] sm:text-[16px] text-slate-600 font-medium leading-tight">
                       {item.startsWith('Låst') ? (
                         <Lock className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                       ) : (
                         <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                       )}
                       <span className={item.startsWith('Låst') ? 'text-slate-400' : ''}>{item}</span>
                     </li>
                   ))}
                 </ul>
                 <button onClick={onStart} className="w-full py-4 sm:py-5 border-2 border-slate-200 text-slate-700 rounded-[20px] font-bold uppercase text-[13px] tracking-wider sm:hover:bg-slate-50 transition-all">Vælg plan</button>
              </div>
            </Reveal>

            {/* Kollega+ (Highlighted) */}
            <Reveal delay={0.1} className="w-full lg:-mt-4 lg:mb-[-1rem] relative z-10">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 z-20 whitespace-nowrap hidden sm:block">
                    Mest populære
                </div>
                
               <div onClick={onStart} className="h-full bg-[#064e3b] p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-[0_30px_60px_-15px_rgba(6,78,59,0.4)] flex flex-col text-white cursor-pointer border border-[#065f46] relative overflow-hidden active:scale-[0.98] transition-transform">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/20 blur-[60px] rounded-full"></div>
                  
                  <div className="relative z-10">
                        <div className="sm:hidden inline-block bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-emerald-500/30">
                            Mest Populære
                        </div>
                        <h3 className="text-[22px] sm:text-2xl font-bold mb-1 serif">Kollega+</h3>
                        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-emerald-400 mb-6 sm:mb-8 tracking-[0.2em]">Din faglige opgradering</p>
                        
                        <div className="mb-8">
                            <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2">89 kr. <span className="text-[15px] sm:text-base font-medium text-emerald-200/40 tracking-normal">/mdr</span></div>
                            <p className="text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider font-sans">Første 7 dage gratis</p>
                        </div>
                  </div>

                  <ul className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-grow relative z-10 font-sans">
                     {[
                       "Ubegrænset Teori-kobler",
                       "Ubegrænset Samtals-træner",
                       "Ubegrænset Case-Analytiker",
                       "Ubegrænset Logbog-arkiv",
                       "Ubegrænsede opslag i Guiden",
                       "Eksklusivt pædagogisk netværk"
                     ].map(item => (
                       <li key={item} className="flex items-start gap-4 text-[15px] sm:text-[16px] text-emerald-50 font-medium leading-tight">
                         <div className="bg-emerald-500/20 rounded-full p-0.5 shrink-0 mt-1">
                             <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                          </div>
                          <span>{item}</span>
                       </li>
                     ))}
                  </ul>
                  <button className="relative z-10 w-full py-4 sm:py-5 bg-white text-emerald-950 rounded-[20px] font-black uppercase text-[13px] tracking-wider sm:hover:bg-emerald-50 transition-all shadow-lg active:scale-95">Start gratis prøve</button>
               </div>
            </Reveal>

            {/* Semester pakke */}
            <Reveal delay={0.2} className="w-full">
               <div onClick={onStart} className="h-full bg-white border border-slate-200 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm flex flex-col transition-all active:scale-[0.98] sm:hover:border-slate-300 cursor-pointer">
                 <h3 className="text-[22px] sm:text-2xl font-bold text-slate-900 mb-1">Semesteret</h3>
                 <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 sm:mb-8">Bedste værdi</p>
                 <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 sm:mb-10 tracking-tight">329 kr. <span className="text-[15px] sm:text-base font-medium text-slate-400 tracking-normal text-balance">/5 mdr</span></div>
                 <ul className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-grow">
                   {[
                     "Alt fra Kollega+",
                     "Spar 116 kr. (-25%)",
                     "Betal én gang for hele forløbet",
                     "Gælder hele semesteret"
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-4 text-[15px] sm:text-[16px] text-slate-600 font-medium">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                         <span>{item}</span>
                      </li>
                    ))}
                 </ul>
                 <button className="w-full py-4 sm:py-5 border-2 border-slate-200 text-slate-700 rounded-[20px] font-bold uppercase text-[13px] tracking-wider sm:hover:bg-slate-50 transition-all">Betal én gang</button>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 sm:py-40 bg-gradient-to-b from-[#064e3b] to-[#022c22] text-center relative overflow-hidden px-5 sm:px-8">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,transparent_60%)] -z-10"></div>
         <div className="max-w-3xl mx-auto space-y-8 sm:space-y-12 relative z-10">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-[-0.03em] leading-tight serif">Hver relation <br className="sm:hidden" /> <span className="text-emerald-400 italic">tæller.</span></h2>
              <p className="text-emerald-100/60 text-[17px] sm:text-2xl mt-4 sm:mt-6 leading-relaxed font-medium">
                Bliv en del af et kollegium, der løfter den pædagogiske faglighed.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8 w-full">
                 <button onClick={onStart} className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-white text-emerald-950 rounded-[20px] font-black uppercase tracking-widest text-[15px] sm:text-base sm:hover:scale-105 transition-all shadow-2xl active:scale-[0.98]">Vis mig hvordan</button>
                 <Link href="/" className="text-emerald-100/40 font-bold border-b border-emerald-800 pb-1 sm:hover:text-white sm:hover:border-emerald-500 transition-all text-[15px] sm:text-base w-full sm:w-auto py-3">Er du socialrådgiverstuderende?</Link>
              </div>
            </Reveal>
         </div>
      </section>

      {/* MOBILE STICKY CTA */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:hidden bg-white/80 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <button 
                onClick={onStart}
                className="w-full relative flex justify-center items-center px-6 py-4 bg-[#064e3b] text-white rounded-[16px] text-[16px] font-bold active:scale-[0.98] transition-all shadow-lg shadow-emerald-900/10"
            >
                Start din dannelse her
                <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PWAInstallGuide isOpen={isInstallGuideOpen} onClose={() => setIsInstallGuideOpen(false)} />
    </div>
  );
};

export default function PedagoguePage() {
  const { user, openAuthPage } = useApp();
  const router = useRouter();

  const handleStart = () => {
    if (user) {
      router.push('/portal');
    } else {
      openAuthPage('signup');
    }
  };

  return <PedagogueLandingContent onStart={handleStart} />;
}
