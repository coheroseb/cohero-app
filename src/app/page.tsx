'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  Brain, 
  ArrowRight, 
  Star, 
  Zap, 
  Scale, 
  Quote, 
  ChevronRight,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Building,
  Wand2,
  Trophy,
  Library,
  ShieldCheck,
  Check,
  Heart,
  Users,
  GraduationCap,
  Download,
  Music
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useApp } from '@/app/provider';
import PWAInstallGuide from '@/components/PWAInstallGuide';
import HeroIllustration from '@/components/home/HeroIllustration';
import SeminarArchitectVisualization from '@/components/SeminarArchitectVisualization';
import TikTokFeed from '@/components/home/TikTokFeed';
import ReviewMarquee from '@/components/home/ReviewMarquee';

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

export default function LandingPage() {
  const { openAuthPage } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  
  const { isUserLoading, user } = useApp();
  const activeTrack = 'social';

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Handle sticky CTA visibility on scroll for mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyCTA(true);
      } else {
        setShowStickyCTA(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onStart = () => openAuthPage('signup');

  const handleInstallClick = async (e: React.MouseEvent) => {
    if (!deferredPrompt) {
        setIsInstallGuideOpen(true);
        return;
    }
    e.preventDefault();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };


  return (
    <div className="flex flex-col selection:bg-amber-200 selection:text-amber-950 overflow-x-hidden bg-[#FDFBF7] font-sans antialiased">
      <div className="pt-20 sm:pt-24 lg:pt-28">
         <ReviewMarquee />
      </div>
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center pb-16 px-5 sm:px-8 overflow-hidden">
        {/* Dynamic Mobile-First Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EC]/60 to-[#FDFBF7] -z-20"></div>
        <div className="absolute top-[-10%] sm:top-0 right-[-10%] sm:left-1/2 sm:-translate-x-1/2 w-[120%] sm:w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.12)_0%,transparent_60%)] -z-10"></div>
        <div className="absolute top-20 left-4 sm:left-10 w-48 sm:w-64 h-48 sm:h-64 bg-amber-200/40 rounded-full blur-[80px] sm:blur-[100px] animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Main Hero Text */}
          <div className="flex-1 flex flex-col items-center text-center lg:items-start lg:text-left space-y-6 sm:space-y-10 w-full mt-8 lg:mt-0">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTrack}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="space-y-5 sm:space-y-8 flex flex-col items-center lg:items-start w-full"
              >
                {/* Mobile top badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-50 border border-amber-200/50 rounded-full shadow-sm mb-2">
                   <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" />
                   <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-900">Din nye digitale makker</span>
                </div>

                <motion.h1 
                  animate={{ 
                    y: [0, -8, 0],
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="text-[40px] leading-[1.05] sm:text-6xl md:text-7xl xl:text-[88px] font-extrabold text-slate-900 tracking-[-0.04em] w-full max-w-[20ch] lg:max-w-none"
                >
                  Gør dit studieliv <br className="hidden sm:block" />
                  <span className="relative inline-block mt-2 md:mt-4 px-2 sm:px-4 shrink-0 overflow-hidden py-2">
                    <motion.span 
                      animate={{ 
                        color: ["#d97706", "#b45309", "#d97706"],
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="relative z-10"
                    >
                      meget lettere.
                    </motion.span>
                    
                    {/* Continuous Underline Pulse */}
                    <motion.svg 
                      animate={{ 
                        opacity: [0.8, 1, 0.8],
                        scaleX: [1, 1.02, 1]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="absolute -bottom-1 sm:-bottom-3 left-0 w-full h-3 sm:h-5 text-amber-300/60 -z-10" 
                      viewBox="0 0 100 10" 
                      preserveAspectRatio="none"
                    >
                        <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    </motion.svg>
                    
                    {/* Shimmer Effect */}
                    <motion.div 
                      animate={{ 
                        x: ['-100%', '200%'] 
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        repeatDelay: 2,
                        ease: "easeInOut" 
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] z-20 pointer-events-none"
                    />
                  </span>
                </motion.h1>
                
                <p className="text-[17px] sm:text-xl lg:text-2xl text-slate-600 max-w-lg lg:max-w-xl leading-relaxed sm:leading-relaxed font-medium">
                  Din komplette platform til socialrådgiverstudiet. Fra intelligens i opgavebygningen til Danmarks største praktik-arkiv og markedsplads. 
                </p>
              </motion.div>
            </AnimatePresence>
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="flex flex-col w-full sm:w-auto items-center lg:items-start gap-5 pt-4"
            >
              <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3 sm:gap-4">
                  <button 
                  onClick={onStart}
                  className="group relative flex justify-center items-center px-8 sm:px-10 py-5 sm:py-6 bg-slate-900 text-white rounded-[20px] sm:rounded-2xl text-[17px] sm:text-xl font-bold transition-all active:scale-[0.98] sm:hover:bg-slate-800 sm:hover:scale-[1.02] shadow-xl shadow-slate-900/10 w-full overflow-hidden will-change-transform"
                  >
                      <span className="relative z-10 flex items-center justify-center gap-3">
                          Kom i gang gratis
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                  
                  <button
                      onClick={handleInstallClick}
                      className="flex justify-center items-center gap-2.5 px-6 sm:px-8 py-5 sm:py-6 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-800 rounded-[20px] sm:rounded-2xl font-bold text-[15px] sm:text-[13px] uppercase sm:tracking-widest active:scale-[0.98] sm:hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto will-change-transform"
                  >
                      <Download className="w-5 h-5 sm:w-4 sm:h-4 text-slate-500" />
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

          {/* Hero Illustration Container - Animated and Dynamic */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full lg:w-5/12 relative z-10 mt-6 lg:mt-0 px-4 sm:px-0 flex items-center justify-center min-h-[450px] lg:min-h-[600px]"
          >
            <div className="w-full h-full relative group">
               <HeroIllustration />
               
               {/* Founder Reference (Optional, but kept as a subtle trust element or removed if preferred) */}
               <div className="absolute -bottom-8 right-0 text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity whitespace-nowrap">
                 <Users className="w-3 h-3" /> Stiftet af socialrådgivere
               </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 2. TRUST RIBBON (Mobile Scroller) */}
      <section className="py-8 sm:py-16 bg-white border-y border-slate-100 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <Reveal>
             <p className="text-[10px] items-center text-center font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 mb-6 sm:mb-8 px-4">Styrker dannelsen på tværs af professionshøjskoler</p>
           </Reveal>
           <div className="w-full overflow-x-auto no-scrollbar px-4 sm:px-6">
             <div className="flex items-center justify-start sm:justify-center gap-8 sm:gap-16 min-w-max pb-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">VIA UC</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">KP</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">UCL</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">Absalon</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">AAU</span>
             </div>
           </div>
        </div>
      </section>


      {/* 3. CITIZEN ASSISTANCE SECTION (New Marketplace Promo) */}
      <section className="py-24 sm:py-40 bg-zinc-950 relative overflow-hidden px-5 sm:px-8">
        {/* Abstract Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500 rounded-full blur-[150px]"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-amber-500 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            
            {/* Illustration Side */}
            <div className="w-full lg:w-1/2 order-2 lg:order-1">
                <Reveal className="relative flex items-center justify-center">
                    <div className="relative w-full aspect-square max-w-md">
                        {/* Center Shield */}
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.05, 1],
                                rotate: [0, 2, 0, -2, 0]
                            }}
                            transition={{ 
                                duration: 8, 
                                repeat: Infinity, 
                                ease: "easeInOut" 
                            }}
                            className="absolute inset-0 m-auto w-40 h-40 sm:w-56 sm:h-56 bg-gradient-to-br from-rose-500 to-rose-600 rounded-[3rem] shadow-[0_30px_60px_-15px_rgba(244,63,94,0.5)] flex items-center justify-center border-4 border-white/20 z-20"
                        >
                            <ShieldCheck className="w-20 h-20 sm:w-28 sm:h-28 text-white" />
                        </motion.div>

                        {/* Orbiting Elements */}
                        {[
                            { icon: Heart, delay: 0, color: 'bg-amber-400', label: 'Omsorg' },
                            { icon: Scale, delay: 2, color: 'bg-indigo-400', label: 'Retssikkerhed' },
                            { icon: Users, delay: 4, color: 'bg-emerald-400', label: 'Bisidder' },
                            { icon: GraduationCap, delay: 6, color: 'bg-blue-400', label: 'Ekspertise' },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    rotate: 360
                                }}
                                transition={{
                                    duration: 15,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: -item.delay
                                }}
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

                        {/* Connection Lines Decor */}
                        <div className="absolute inset-0 border-2 border-white/5 rounded-full scale-110 opacity-30"></div>
                        <div className="absolute inset-0 border-2 border-white/5 rounded-full scale-75 opacity-30"></div>
                    </div>
                </Reveal>
            </div>

            {/* Text Side */}
            <div className="w-full lg:w-1/2 order-1 lg:order-2 space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full mb-4">
                            <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-100/80">For borgere og forældre</span>
                        </div>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight">
                            Har du brug for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 italic">faglig hjælp?</span>
                        </h2>
                        <p className="text-xl text-amber-100/60 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 mt-6">
                            Står du overfor en svær sag, har brug for en bisidder til et møde eller hjælp til en ansøgning? Vores studerende hjælper dig sikkert gennem systemet.
                        </p>
                    </Reveal>
                </div>

                <Reveal delay={0.2}>
                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                        <Link 
                            href="/raadgivning" 
                            className="group relative px-10 py-6 bg-white text-zinc-950 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl hover:scale-105 transition-all w-full sm:w-auto overflow-hidden active:scale-95"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                Start anmodning
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </span>
                        </Link>
                        <div className="flex items-center gap-4 py-2">
                            <div className="flex -space-x-3">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                        {['H','L','M'][i-1]}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] whitespace-nowrap font-bold text-amber-100/40 uppercase tracking-widest">Hjælp fra hele landet</p>
                        </div>
                    </div>
                </Reveal>
            </div>

          </div>
        </div>
      </section>

      {/* 4. CORE FEATURES (Mobile-First Card Layout) */}
      <section id="vaerktojer" className="py-20 sm:py-32 bg-[#FDFBF7] px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-12 sm:mb-20 text-center lg:text-left mx-auto lg:mx-0">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-[-0.03em] mb-4 sm:mb-6 leading-tight">
                Værktøjer der <span className="text-amber-500 line-through decoration-amber-200 decoration-4 sm:decoration-8">skærper</span><br/> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-400 italic">udvikler</span> din dømmekraft.
              </h2>
              <p className="text-[17px] sm:text-xl text-slate-500 leading-relaxed font-medium">
                Vores digitale økosystem er bygget 'mobile first', mod at støtte dig der, hvor teorien møder virkeligheden.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
             
             {/* Feature 1: Begrebsguiden */}
             <Reveal className="lg:col-span-8">
               <div onClick={onStart} className="h-full bg-white border border-slate-100 p-8 sm:p-12 lg:p-16 rounded-[32px] sm:rounded-[48px] shadow-sm relative overflow-hidden group sm:hover:shadow-2xl sm:hover:border-amber-200 transition-all cursor-pointer active:scale-[0.98]">
                  <div className="absolute top-[-20%] right-[-10%] p-12 opacity-[0.03] sm:group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                     <Library className="w-80 h-80 -rotate-12 text-slate-900" />
                  </div>
                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-10">
                     <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 rounded-[24px] sm:rounded-[32px] flex items-center justify-center flex-shrink-0 sm:group-hover:rotate-6 sm:group-hover:scale-105 transition-all shadow-sm border border-amber-200/50">
                        <Wand2 className="w-10 h-10 sm:w-12 sm:h-12" />
                     </div>
                     <div className="space-y-4">
                        <span className="inline-block px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border border-slate-200">Intelligent Opslagsværk</span>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">Begrebsguiden</h3>
                        <p className="text-slate-500 text-[16px] sm:text-lg leading-relaxed font-medium">Få pædagogiske og praksisnære forklaringer på komplekse faglige begreber direkte fra dit pensum.</p>
                        <div className="flex items-center gap-2 text-amber-600 font-bold uppercase text-[13px] tracking-wider pt-2 sm:group-hover:translate-x-2 transition-transform">
                          Prøv guiden <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                     </div>
                  </div>
               </div>
             </Reveal>

             {/* Feature 2: Lovportalen */}
             <Reveal delay={0.1} className="lg:col-span-4">
               <div onClick={onStart} className="h-full bg-slate-900 p-8 sm:p-12 rounded-[32px] sm:rounded-[48px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] text-white flex flex-col justify-between group cursor-pointer overflow-hidden relative active:scale-[0.98] transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-[24px] flex items-center justify-center mb-6 sm:mb-8 backdrop-blur-md sm:group-hover:bg-amber-400 sm:group-hover:text-amber-950 transition-colors border border-white/5">
                      <Scale className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300 sm:group-hover:text-amber-950 transition-colors" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight mb-3">Lovportalen</h3>
                    <p className="text-slate-300 text-[15px] sm:text-base leading-relaxed font-medium max-w-[280px]">Slå op i de mest relevante love med indbygget AI-fortolkning i øjenhøjde.</p>
                  </div>
                  <div className="pt-10 flex items-center justify-between border-t border-white/10 mt-auto relative z-10">
                     <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Åbn Portalen</span>
                     <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 sm:group-hover:bg-white sm:group-hover:text-slate-900 transition-all">
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                     </div>
                  </div>
               </div>
             </Reveal>

             {/* Feature 3: Folketinget */}
             <Reveal className="lg:col-span-12">
               <div onClick={onStart} className="bg-gradient-to-br from-rose-50 to-white border border-rose-100 p-8 sm:p-12 lg:p-16 rounded-[32px] sm:rounded-[48px] flex flex-col sm:flex-row items-start sm:items-center gap-8 sm:gap-12 group sm:hover:shadow-2xl sm:hover:border-rose-200 transition-all cursor-pointer shadow-sm relative overflow-hidden active:scale-[0.98]">
                  <div className="flex-1 space-y-4 sm:space-y-6 order-2 sm:order-1 relative z-10">
                     <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-rose-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-rose-100 mb-2">
                        <Zap className="w-3.5 h-3.5 fill-current" /> Sagens kerne i realtid
                     </div>
                     <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">Folketinget Direkte</h3>
                     <p className="text-slate-500 text-[16px] sm:text-lg leading-relaxed font-medium max-w-2xl">Overvågning af nye lovforslag med direkte analyse af betydningen for dit faglige virke som socialrådgiver.</p>
                     <div className="flex items-center gap-2 text-rose-600 font-bold uppercase text-[13px] tracking-wider pt-2 sm:group-hover:translate-x-2 transition-transform">
                          Overvåg lovgivning <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                     </div>
                  </div>
                  <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white text-rose-500 rounded-[24px] sm:rounded-[32px] flex items-center justify-center flex-shrink-0 sm:group-hover:-translate-y-2 transition-all shadow-xl border border-rose-100 order-1 sm:order-2 relative z-10">
                     <Building className="w-10 h-10 sm:w-16 sm:h-16" />
                  </div>
                  {/* Decor */}
                  <div className="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-64 bg-rose-200/20 rounded-full blur-[60px] pointer-events-none"></div>
               </div>
             </Reveal>

             {/* Feature 4: Seminar-Arkitekten Visualization */}
             <Reveal delay={0.1} className="lg:col-span-12">
               <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-8 sm:p-12 lg:p-16 rounded-[32px] sm:rounded-[48px] shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-transparent to-transparent pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="max-w-2xl mb-8 sm:mb-12">
                      <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-purple-300 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-400/30 mb-4">
                        <Sparkles className="w-3.5 h-3.5" /> Visualisering
                      </div>
                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none mb-3 sm:mb-4">Seminar-Arkitekten</h3>
                      <p className="text-slate-300 text-[16px] sm:text-lg leading-relaxed font-medium">Opbyg intelligente seminarserier med struktureret feedback, faglige kilder og praksisnære vejledninger.</p>
                    </div>
                    <div className="flex items-center gap-2 text-purple-300 font-bold uppercase text-[13px] tracking-wider sm:group-hover:translate-x-2 transition-transform">
                      Udforsk værktøjet <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                  <div className="mt-12 sm:mt-16 -mx-8 sm:-mx-12 lg:-mx-16 px-8 sm:px-12 lg:px-16 py-8 sm:py-12 bg-gradient-to-t from-black/40 to-transparent">
                    <SeminarArchitectVisualization />
                  </div>
               </div>
             </Reveal>
          </div>
        </div>
      </section>


      {/* 4. SOCIAL PROOF */}
      <section className="py-20 sm:py-32 bg-white relative overflow-hidden px-5 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-[24px] flex items-center justify-center mx-auto mb-8 sm:mb-12 shadow-sm border border-amber-100/50">
                <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500" />
             </div>
             <blockquote className="text-[22px] sm:text-3xl md:text-5xl font-extrabold text-slate-800 leading-[1.3] sm:leading-[1.4] tracking-tight mb-8 sm:mb-12 px-2 sm:px-4 text-balance">
               "At kunne tjekke juraen og få sparring har gjort mig langt mere tryg i min praktik."
             </blockquote>
             <div className="space-y-1 sm:space-y-2 flex flex-col items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-full mb-3 flex items-center justify-center border border-slate-200 overflow-hidden">
                    <Image src="/nan_jul.jpg" alt="Student" width={48} height={48} className="object-cover w-full h-full scale-150 grayscale object-top" />
                </div>
                <p className="text-[17px] sm:text-xl font-bold text-slate-900">Mads Henriksen</p>
                <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 px-6">Socialrådgiverstuderende, 6. semester</p>
             </div>
          </Reveal>
        </div>
        <div className="absolute top-1/2 left-[-10%] sm:left-0 w-64 h-64 bg-amber-100/30 rounded-full blur-[80px] sm:blur-[100px] pointer-events-none"></div>
      </section>
      {/* 4.5 TIKTOK FEED SECTION */}
      <section className="py-24 sm:py-40 bg-[#FDFBF7] relative overflow-hidden px-5 sm:px-8 border-t border-slate-100/50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(251,191,36,0.08)_0%,transparent_100%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/50 rounded-full mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Live fra TikTok</span>
                </div>
              </Reveal>
              <Reveal delay={0.1}>
                <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-[-0.04em] leading-[1.05]">
                  Følg rejsen <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-500 italic">bag facaden.</span>
                </h2>
                <p className="text-xl text-slate-500 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed mt-6">
                  Vi deler dagligt tips, tricks og faglige indsigter direkte til din feed. Bliv en del af vores fællesskab på TikTok.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                  <Link 
                    href="/tiktok" 
                    className="group relative px-10 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl hover:scale-105 transition-all w-full sm:w-auto overflow-hidden active:scale-95 text-center"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      Se arkivet
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </span>
                  </Link>
                  <div className="flex items-center gap-3 py-2 opacity-50">
                    <Music className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opdateres hver uge</span>
                  </div>
                </div>
              </Reveal>
            </div>

            <div className="w-full lg:w-5/12 flex justify-center">
              <Reveal delay={0.3} className="relative">
                {/* Decorative background elements for the video holder */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-amber-200/20 to-rose-200/20 blur-3xl opacity-50 -z-10 animate-pulse" />
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-100/50 rounded-full blur-2xl -z-10" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl -z-10" />
                
                {/* TikTok Feed Component */}
                <TikTokFeed />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="priser" className="py-20 sm:py-32 bg-[#FDFBF7] px-5 sm:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-20 space-y-4 sm:space-y-6">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none px-2">
                Prøv <span className="text-amber-500">Kollega+</span> i dag.
              </h2>
              <p className="text-[17px] sm:text-xl text-slate-500 font-medium max-w-xl mx-auto px-4">
                Fuld rygdækning i studietet. Start gratis – ingen binding.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-8 items-stretch max-w-lg mx-auto lg:max-w-none">
            {/* Free Plan */}
            <Reveal delay={0} className="w-full">
              <div className="h-full bg-white border border-slate-200 p-8 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm flex flex-col transition-all active:scale-[0.98] sm:hover:border-slate-300">
                 <h3 className="text-[22px] sm:text-2xl font-bold text-slate-900 mb-1">Kollega</h3>
                 <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 sm:mb-8">Det fundamentale</p>
                 <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-8 sm:mb-10 tracking-tight">0 kr. <span className="text-[15px] sm:text-base font-medium text-slate-400 tracking-normal text-balance">/mdr</span></div>
                 <ul className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-grow">
                   {[
                     "3 daglige opslag i Guiden",
                     "3 daglige STAR-tolkninger",
                     "Begrænset Lovportal",
                     "1 daglig Journal-træning"
                   ].map(item => (
                     <li key={item} className="flex items-start gap-4 text-[15px] sm:text-[16px] text-slate-600 font-medium">
                       <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                       <span>{item}</span>
                     </li>
                   ))}
                 </ul>
                 <button onClick={onStart} className="w-full py-4 sm:py-5 border-2 border-slate-200 text-slate-700 rounded-[20px] font-bold uppercase text-[13px] tracking-wider sm:hover:bg-slate-50 sm:hover:text-slate-900 transition-all active:scale-[0.98]">Vælg plan</button>
              </div>
            </Reveal>

            {/* Kollega+ (Highlighted) */}
            <Reveal delay={0.1} className="w-full lg:-mt-4 lg:mb-[-1rem] relative z-10">
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-5 sm:px-6 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/30 z-20 whitespace-nowrap hidden sm:block">
                    Mest populære
                </div>
                
               <div onClick={onStart} className="h-full bg-slate-900 p-8 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col text-white cursor-pointer border border-slate-800 relative overflow-hidden active:scale-[0.98] transition-transform">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/20 blur-[60px] rounded-full"></div>
                  
                  <div className="relative z-10">
                        <div className="sm:hidden inline-block bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-amber-500/30">
                            Mest Populære
                        </div>
                        <h3 className="text-[22px] sm:text-2xl font-bold mb-1">Kollega+</h3>
                        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-amber-400 mb-6 sm:mb-8">Til den dedikerede studerende</p>
                        
                        <div className="mb-8">
                            <div className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2">89 kr. <span className="text-[15px] sm:text-base font-medium text-slate-400 tracking-normal">/mdr</span></div>
                            <p className="text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider">Første 7 dage gratis</p>
                        </div>
                  </div>

                  <ul className="space-y-4 sm:space-y-5 mb-10 sm:mb-12 flex-grow relative z-10">
                    {[
                      "Ubegrænset Lovportal-adgang",
                      "Fuld Folketingsovervågning",
                      "Ubegrænsede opslag i Guiden",
                      "Ubegrænset STAR-tolkning",
                      "Personligt arkiv over analyser",
                      "Prioriteret support"
                    ].map(item => (
                      <li key={item} className="flex items-start gap-4 text-[15px] sm:text-[16px] text-slate-200 font-medium">
                        <div className="bg-amber-500/20 rounded-full p-0.5 shrink-0 mt-1">
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                        </div>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="relative z-10 w-full py-4 sm:py-5 bg-white text-slate-900 rounded-[20px] font-black uppercase text-[13px] tracking-wider sm:hover:bg-slate-100 transition-all active:scale-[0.98] shadow-lg shadow-white/10">Start gratis prøve</button>
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
                     "Gælder hele semesteret",
                     "Ekstra case-adgang"
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-4 text-[15px] sm:text-[16px] text-slate-600 font-medium">
                         <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                         <span>{item}</span>
                      </li>
                    ))}
                 </ul>
                 <button className="w-full py-4 sm:py-5 border-2 border-slate-200 text-slate-700 rounded-[20px] font-bold uppercase text-[13px] tracking-wider sm:hover:bg-slate-50 sm:hover:text-slate-900 transition-all active:scale-[0.98]">Betal én gang</button>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA SECTION */}
      <section className="py-24 sm:py-40 bg-gradient-to-b from-slate-900 to-slate-950 text-center relative overflow-hidden px-5 sm:px-8 mb-0 md:mb-0">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0,transparent_60%)] -z-10"></div>
         <div className="max-w-3xl mx-auto space-y-8 sm:space-y-12 relative z-10 reveal px-2">
            <Reveal>
              <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-[-0.03em] leading-tight">Din faglige rejse<br className="sm:hidden" /> <span className="text-amber-400">starter nu.</span></h2>
              <p className="text-slate-400 text-[17px] sm:text-2xl mt-4 sm:mt-6 leading-relaxed font-medium">
                Bliv sikker i dit faglige virke.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-6 sm:pt-8 w-full">
                 <button onClick={onStart} className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 bg-white text-slate-900 rounded-[20px] font-black uppercase tracking-widest text-[15px] sm:text-base sm:hover:scale-105 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98]">Vis mig hvordan</button>
                 <Link href="/paedagog" className="text-slate-400 font-bold border-b border-slate-600 pb-1 sm:hover:text-white sm:hover:border-white transition-all text-[15px] sm:text-base w-full sm:w-auto py-3 sm:py-0">Går du på pædagoguddannelsen?</Link>
              </div>
            </Reveal>
         </div>
      </section>

      {/* MOBILE STICKY CTA (Bottom Bar) */}
      <AnimatePresence>
        {showStickyCTA && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:hidden bg-white/80 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <button 
                onClick={onStart}
                className="w-full relative flex justify-center items-center px-6 py-4 bg-slate-900 text-white rounded-[16px] text-[16px] font-bold active:scale-[0.98] transition-transform shadow-lg"
            >
                Start din gratis prøve
                <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PWAInstallGuide isOpen={isInstallGuideOpen} onClose={() => setIsInstallGuideOpen(false)} />
    </div>
  );
}
