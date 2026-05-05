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
  Music,
  Lock,
  Gift,
  Bird,
  Ghost
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
  const { openAuthPage, campaigns, effectiveTheme } = useApp();
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
    <div className={`flex flex-col selection:bg-amber-200 selection:text-amber-950 overflow-x-hidden font-sans antialiased ${
       effectiveTheme === 'christmas' ? 'bg-rose-50/50' :
       effectiveTheme === 'easter' ? 'bg-yellow-50/50' :
       effectiveTheme === 'halloween' ? 'bg-orange-50/20' :
       'bg-[#FDFBF7]'
    }`}>
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[100dvh] flex flex-col pt-32 sm:pt-40 lg:pt-48 pb-16 px-5 sm:px-8 overflow-hidden">
        {/* Dynamic Mobile-First Background */}
        <div className={`absolute inset-0 bg-gradient-to-b -z-20 ${
            effectiveTheme === 'christmas' ? 'from-rose-100/30 via-rose-50/20 to-rose-100/30' :
            effectiveTheme === 'easter' ? 'from-yellow-100/30 via-yellow-50/20 to-yellow-100/30' :
            effectiveTheme === 'halloween' ? 'from-orange-100/10 via-orange-50/5 to-orange-100/10' :
            'from-[#FFFDF9] via-[#FAF6EC]/60 to-[#FDFBF7]'
        }`}></div>
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

                <motion.h1 
                  animate={{ 
                    y: [0, -4, 0],
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="text-[40px] leading-[0.95] sm:text-6xl md:text-7xl xl:text-[85px] font-[900] text-slate-900 tracking-[-0.05em] w-full max-w-4xl lg:max-w-none"
                >
                  Mindre stress. <br className="hidden sm:block" />
                  <span className="relative inline-block mt-1 md:mt-2">
                    <motion.span 
                      animate={{ 
                        color: ["#1e293b", "#d97706", "#1e293b"],
                      }}
                      transition={{ 
                        duration: 8, 
                        repeat: Infinity, 
                        ease: "linear" 
                      }}
                      className="relative z-10 italic font-serif pr-4"
                    >
                      Mere overskud.
                    </motion.span>
                  </span>
                  <br className="hidden lg:block" />
                  Bedre resultater.
                </motion.h1>
                
                <p className="text-[16px] sm:text-lg lg:text-xl text-slate-600 max-w-lg lg:max-w-xl leading-relaxed sm:leading-relaxed font-medium">
                  Socialrådgiverstudiet er krævende, og lovgivningen er uoverskuelig. Cohéro strukturerer din viden og validerer din juridiske forståelse i realtid, så du kan fokusere på at gøre en forskel – med fuld professionel rygdækning.
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
                  </button>
              </div>
            </motion.div>
          </div>

          <motion.div 
            style={{ 
              perspective: "1200px",
              rotateX: 2,
              rotateY: -5
            }}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-1/2 relative z-10 mt-12 lg:mt-0 flex items-center justify-center h-[500px] sm:h-[650px]"
          >
            {/* Immersive Floating Interface Mockup */}
            <div className="relative w-full h-full max-w-2xl transform-gpu">
                {/* Main Dashboard Preview Card */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-20"
                >
                   <div className="h-14 bg-slate-50 border-b border-slate-100 flex items-center px-8 justify-between">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                      </div>
                      <div className="h-6 w-32 bg-slate-200/50 rounded-full animate-pulse"></div>
                   </div>
                   <div className="p-8 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="w-40 h-4 bg-slate-100 rounded"></div>
                          <div className="w-24 h-3 bg-slate-50 rounded"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 rounded-3xl bg-slate-50 border border-slate-100/50 p-4 space-y-3">
                           <div className="w-full h-2 bg-slate-200 rounded"></div>
                           <div className="w-2/3 h-2 bg-slate-100 rounded"></div>
                           <div className="w-1/2 h-2 bg-slate-100 rounded"></div>
                        </div>
                        <div className="h-32 rounded-3xl bg-amber-50/30 border border-amber-100/30 p-4 space-y-3">
                           <div className="w-full h-2 bg-amber-200/40 rounded"></div>
                           <div className="w-2/3 h-2 bg-amber-100/40 rounded"></div>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-50 w-full mb-2"></div>
                      <div className="space-y-3 pt-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-lg bg-slate-50"></div>
                            <div className="flex-1 h-2 bg-slate-50 rounded"></div>
                          </div>
                        ))}
                      </div>
                   </div>
                </motion.div>

                {/* Floating "Context Card" - Interactive Element 1 */}
                <motion.div 
                  animate={{ y: [0, 20, 0], x: [0, -10, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -top-12 -left-12 w-64 p-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl z-30 hidden sm:block border border-white/10 backdrop-blur-xl"
                >
                   <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center">
                        <Scale className="w-5 h-5 font-bold" />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase text-amber-400 tracking-widest">Lovportalen</div>
                        <div className="text-sm font-bold">Punkt 7.2 Analyseret</div>
                      </div>
                   </div>
                   <p className="text-[11px] text-slate-400 leading-relaxed italic">"Retssikkerheden for den enkelte borger vægtes tungt jf. Servicelovens §82..."</p>
                </motion.div>

                {/* Floating "AI Intelligence" - Interactive Element 2 */}
                <motion.div 
                  animate={{ y: [0, -25, 0], x: [0, 15, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-10 -right-8 w-72 p-6 bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] z-40 hidden sm:block border border-slate-100"
                >
                   <div className="flex flex-col gap-4">
                      <div className="flex -space-x-3">
                         {[1,2,3,4].map(i => <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-slate-${i*100+100}`}></div>)}
                         <div className="w-8 h-8 rounded-full border-2 border-white bg-amber-400 flex items-center justify-center text-[10px] font-black">+42</div>
                      </div>
                      <div className="h-0.5 w-full bg-slate-50"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fagfælle vurderet</span>
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />)}
                        </div>
                      </div>
                   </div>
                </motion.div>

                {/* Decorative Blobs */}
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-amber-200/20 rounded-full blur-[100px] -z-10 animate-pulse"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-[120px] -z-10"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. TRUST RIBBON (Immediate Credibility) */}
      <section className="py-8 sm:py-16 bg-white border-y border-slate-100 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-white to-transparent z-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col items-center">
           <Reveal>
             <p className="text-[10px] items-center text-center font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-slate-400 mb-6 sm:mb-8 px-4">Styrker dannelsen på tværs af professionshøjskoler i København, Aarhus, Odense & Roskilde</p>
           </Reveal>
           <div className="w-full overflow-x-auto no-scrollbar px-4 sm:px-6">
              <div className="flex items-center justify-start sm:justify-center gap-8 sm:gap-16 min-w-max pb-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">VIA UC Aarhus</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">KP København</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">UCL Odense</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">Absalon Roskilde</span>
                <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                <span className="text-[15px] sm:text-lg font-black uppercase tracking-[0.2em] text-slate-800">AAU Aalborg</span>
             </div>
           </div>
        </div>
      </section>



       {/* 1.2 DIFFERENTIATION SECTION (Innovative 'Bento-Neo' Layout) */}
      <section className="py-32 bg-[#FDFBF7] px-5 sm:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-20">
             <Reveal className="max-w-2xl">
               <h2 className="text-5xl sm:text-7xl font-[900] text-slate-900 tracking-[-0.05em] leading-[0.9] mb-8">
                 Designet til <br />
                 <span className="text-amber-500 italic font-serif">eliten</span> af fremtidens <br />
                 socialrådgivere.
               </h2>
             </Reveal>
             <Reveal delay={0.2} className="max-w-sm pb-2">
                <p className="text-lg text-slate-500 font-medium leading-relaxed border-l-2 border-amber-200 pl-6">
                  Vi bygger ikke bare software. Vi bygger den kognitive arkitektur, der gør dig i stand til at navigere i velfærdssystemets kompleksitet.
                </p>
             </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-[280px] sm:auto-rows-[340px]">
            {/* Bento Card 1: Power Feature */}
            <Reveal className="md:col-span-4 lg:col-span-7 row-span-2">
              <div className="group h-full bg-white border border-slate-100 rounded-[3rem] p-10 sm:p-16 flex flex-col justify-between relative overflow-hidden shadow-sm sm:hover:shadow-2xl transition-all duration-700">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-slate-50/50 to-transparent -z-10 group-hover:scale-110 transition-transform duration-1000"></div>
                <div className="relative z-10 space-y-8">
                  <div className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center rotate-[-8deg] group-hover:rotate-0 transition-transform duration-500 shadow-xl shadow-slate-900/20">
                    <Scale className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none italic">Socialretlig <br/>præcision.</h3>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-sm">
                      Med 50.000+ siders lovgivning integreret i hvert eneste svar, er Cohero dit anker i de sværeste faglige beslutninger.
                    </p>
                  </div>
                </div>
                <div className="relative z-10 pt-10">
                   <div className="inline-flex items-center gap-2 text-slate-900 font-black uppercase text-xs tracking-widest border-b-2 border-slate-900 pb-1 group-hover:gap-4 transition-all">
                      Se Lovportalen <ArrowRight className="w-4 h-4" />
                   </div>
                </div>
              </div>
            </Reveal>

            {/* Bento Card 2: Aesthetic Proof */}
            <Reveal delay={0.1} className="md:col-span-4 lg:col-span-5 row-span-1">
               <div className="h-full bg-amber-400 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center group cursor-pointer overflow-hidden relative">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-10 -right-10 w-40 h-40 border-[20px] border-white/10 rounded-full"
                  />
                  <h3 className="text-3xl font-black text-amber-950 tracking-tight italic z-10">Fra teori til handling.</h3>
                  <div className="mt-6 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform z-10">
                    <Star className="w-6 h-6 text-white fill-white" />
                  </div>
               </div>
            </Reveal>

            {/* Bento Card 3: Deep Tech */}
            <Reveal delay={0.2} className="md:col-span-2 lg:col-span-5 row-span-1">
               <div className="h-full bg-slate-900 text-white rounded-[3rem] p-10 flex flex-col justify-between group overflow-hidden relative border border-slate-800">
                  <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-amber-500/10 to-transparent -z-10"></div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold italic">Indbygget rygdækning.</h3>
                    <p className="text-sm text-slate-400 font-medium">Vi overvåger Folketinget, så du ikke behøver det.</p>
                  </div>
                  <div className="flex -space-x-3 pt-6">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-700 animate-pulse"></div>)}
                  </div>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 1.5 ACTIVE CAMPAIGN SPOTLIGHT (Premium Card) */}
      {campaigns && campaigns.length > 0 && (
        <section className="px-5 sm:px-8 py-10 -mt-20 relative z-30">
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



      {/* 3. CORE FEATURES (Product Showcase) */}
      <section id="vaerktojer" className="py-20 sm:py-32 bg-[#FDFBF7] px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mb-16 sm:mb-28 text-center lg:text-left mx-auto lg:mx-0">
            <Reveal>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/50 border border-amber-200/50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 mb-6 font-sans">Arsenalet</span>
              <h2 className="text-5xl sm:text-7xl lg:text-8xl font-[900] text-slate-900 tracking-[-0.05em] mb-6 sm:mb-8 leading-[0.9] text-balance">
                Værktøjer til din <br/> 
                <span className="italic font-serif text-amber-500">faglige præcision.</span>
              </h2>
              <p className="text-lg sm:text-2xl text-slate-500 leading-relaxed font-medium max-w-2xl">
                Vi har kondenseret årsværk af socialfaglig viden ind i lynhurtige værktøjer, der fjerner usikkerheden fra dit arbejde.
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
                    <p className="text-slate-300 text-[15px] sm:text-base leading-relaxed font-medium max-w-[280px]">Slå op i de mest relevante love med indbygget sprog-fortolkning i øjenhøjde.</p>
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
                     <p className="text-slate-500 text-[16px] sm:text-lg leading-relaxed font-medium max-w-2xl">Overvågning af nye lovforslag med direkte analyse af betydningen for velfærdsstaten og dit faglige virke.</p>
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

          </div>
        </div>
      </section>

      {/* 3.5 SECOND OPINION DEEP DIVE (Innovative Visual Stack) */}
      <section className="py-32 sm:py-48 bg-white relative overflow-hidden px-5 sm:px-8">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-50/50 -skew-x-12 -z-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 lg:gap-32">
          <div className="w-full lg:w-5/12 space-y-10 text-center lg:text-left">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-full mb-4">
                 <Scale className="w-3.5 h-3.5 text-amber-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Nyt: Second Opinion</span>
              </div>
              <h2 className="text-5xl sm:text-7xl font-[900] text-slate-900 tracking-[-0.05em] leading-[0.95] text-balance">
                Fik du ikke <br />
                <span className="italic font-serif text-amber-500">karakteren</span> <br />
                du fortjente?
              </h2>
              <p className="text-xl text-slate-500 font-medium leading-relaxed mt-8">
                Vi har udviklet en algoritme, der dekonstruerer bedømmelseskriterier og matcher dem mod din besvarelse. Få et objektivt grundlag for din klage — på under 60 sekunder.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                 <button onClick={onStart} className="group relative px-10 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center gap-3">Analyseér din opgave <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" /></span>
                 </button>
                 <div className="flex items-center gap-3 py-2 px-4 bg-slate-50 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Juridisk Privatliv</span>
                 </div>
              </div>
            </Reveal>
          </div>
          
          <div className="w-full lg:w-7/12 relative">
             <Reveal delay={0.3} className="relative">
                 {/* Spatial Stack Animation */}
                 <div className="relative min-h-[500px] flex items-center justify-center">
                    {/* Background Layer (Blur) */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/20 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                    
                    {/* Layered Analysis Cards */}
                    <motion.div 
                        initial={{ rotate: -5, x: -20, y: 20 }}
                        whileInView={{ rotate: -8, x: -40, y: 40 }}
                        className="absolute w-full max-w-sm bg-white border border-slate-100 rounded-[3rem] p-10 shadow-xl opacity-40 grayscale"
                    >
                         <div className="h-4 w-1/2 bg-slate-100 rounded mb-4"></div>
                         <div className="space-y-2">
                             <div className="h-2 w-full bg-slate-50 rounded"></div>
                             <div className="h-2 w-full bg-slate-50 rounded"></div>
                         </div>
                    </motion.div>

                    <motion.div 
                        initial={{ scale: 1, zIndex: 20 }}
                        whileHover={{ scale: 1.02 }}
                        className="relative w-full max-w-md bg-white border border-slate-100 rounded-[3rem] p-8 sm:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] z-20"
                    >
                        <div className="flex justify-between items-start mb-10">
                           <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><FileText className="w-8 h-8" /></div>
                           <div className="px-4 py-2 bg-rose-50 rounded-full text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">Kritisk afvigelse</div>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    <span>Teoretisk dybde</span>
                                    <span className="text-slate-900">85%</span>
                                </div>
                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      whileInView={{ width: '85%' }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                      className="h-full bg-amber-400"
                                    ></motion.div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                                    <span>Metodisk stringens</span>
                                    <span className="text-slate-900">92%</span>
                                </div>
                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      whileInView={{ width: '92%' }}
                                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                      className="h-full bg-slate-900"
                                    ></motion.div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-50">
                           <p className="text-sm text-slate-500 leading-relaxed font-medium italic">
                             "Analysen påviser at opgaven opfylder læringsmål for videnskabsteori på et væsentligt højere niveau end den tildelte karakter reflekterer."
                           </p>
                        </div>
                    </motion.div>
                 </div>
             </Reveal>
          </div>
        </div>
      </section>

      {/* 4. TIKTOK FEED SECTION */}
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





      {/* 6. PRICING SECTION (Premium Membership Experience) */}
      <section id="priser" className="py-32 sm:py-56 bg-[#FDFBF7] px-5 sm:px-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.05)_0%,transparent_70%)] -z-10"></div>
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 sm:mb-32 space-y-8">
            <Reveal>
              <h2 className="text-5xl sm:text-8xl font-[900] text-slate-900 tracking-tight leading-[0.9] text-balance">
                Vælg din <br />
                <span className="italic font-serif text-amber-500">rygdækning</span>.
              </h2>
              <p className="text-xl sm:text-2xl text-slate-500 font-medium max-w-xl mx-auto mt-8">
                Invester i din fremtidige karriere. <br className="hidden sm:block" /> Start din 7 dages professionelle prøveperiode i dag.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-lg mx-auto lg:max-w-none">
            {/* Free Plan - The Standard */}
            <Reveal delay={0} className="w-full">
              <div className="h-full bg-white/40 backdrop-blur-md border border-slate-200 p-10 sm:p-14 rounded-[3.5rem] flex flex-col transition-all sm:hover:shadow-xl sm:hover:border-slate-300">
                 <h3 className="text-2xl font-black text-slate-900 mb-2">Kollega</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Trial Access</p>
                 <div className="text-5xl font-black text-slate-900 mb-12 tracking-tighter">0 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/mdr</span></div>
                 <ul className="space-y-6 mb-16 flex-grow">
                   {[
                     "1 dagligt opslag i Begrebsguiden",
                     "1 AI Case-analyse pr. døgn",
                     "Udvalgte paragraffer i Lovportalen",
                     "Se dine personlige fremskridt",
                   ].map(item => (
                     <li key={item} className="flex items-center gap-5 text-[16px] text-slate-600 font-medium">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span>{item}</span>
                     </li>
                   ))}
                 </ul>
                 <button onClick={onStart} className="w-full py-6 border-2 border-slate-200 text-slate-900 rounded-[2rem] font-black uppercase text-xs tracking-widest sm:hover:bg-slate-900 sm:hover:text-white transition-all">Start nu</button>
              </div>
            </Reveal>

            {/* Kollega+ (The Flagship) */}
            <Reveal delay={0.1} className="w-full lg:-mt-8 lg:mb-[-2rem] relative z-10">
               <div className="h-full bg-slate-900 p-10 sm:p-14 rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col text-white relative overflow-hidden border border-white/10 group">
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(245,158,11,0.2)_0%,transparent_50%)]"></div>
                  <div className="relative z-10">
                        <div className="inline-block bg-amber-500 text-slate-900 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 shadow-xl shadow-amber-500/20">Mest Populære</div>
                        <p className="text-[11px] font-medium text-amber-200/60 mb-10 italic">Et Kollega+ medlemskab er en personlig investering i din faglighed</p>
                        <h3 className="text-3xl font-black mb-2">Kollega+</h3>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-10">Full Professional Access</p>
                        
                        <div className="mb-12">
                            <div className="text-6xl font-black tracking-tighter mb-4">89 kr. <span className="text-base font-medium text-slate-500 tracking-normal">/mdr</span></div>
                            <p className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <Zap className="w-4 h-4 fill-current" /> 7 Dages gratis prøve
                            </p>
                        </div>
                  </div>

                  <ul className="space-y-6 mb-16 flex-grow relative z-10">
                     {[
                       "Ubegrænset AI Case-Analytiker",
                       "Alle love med AI-forklaring",
                       "Journal-træning med feedback",
                       "Design egne kurser & pensum",
                       "Gem vigtige kilder & arkiv"
                     ].map(item => (
                       <li key={item} className="flex items-center gap-5 text-[16px] text-white font-medium">
                          <div className="w-6 h-6 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                             <Check className="w-4 h-4 text-amber-500" />
                          </div>
                          <span>{item}</span>
                       </li>
                     ))}
                  </ul>
                  <button onClick={onStart} className="relative z-10 w-full py-7 bg-amber-500 text-slate-900 rounded-[2.5rem] font-black uppercase text-[13px] tracking-[0.2em] shadow-2xl shadow-amber-500/30 sm:hover:scale-105 active:scale-95 transition-all">Tegn medlemskab</button>
               </div>
            </Reveal>

            {/* Semester pakke (Value Deck) */}
            <Reveal delay={0.2} className="w-full">
               <div className="h-full bg-white p-10 sm:p-14 rounded-[3.5rem] border border-slate-200 flex flex-col transition-all sm:hover:shadow-xl group cursor-pointer relative overflow-hidden">
                 <div className="absolute inset-0 bg-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Semesteret</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-10">Best Value Bundle</p>
                    <div className="text-5xl font-black text-slate-900 mb-12 tracking-tighter">329 kr. <span className="text-base font-medium text-slate-400 tracking-normal">/5 mdr</span></div>
                    <ul className="space-y-6 mb-16 flex-grow">
                    {[
                        "Alt fra Kollega+ inkluderet",
                        "Spar 115 kr. vs. månedlig betaling",
                        "Adgang fastlåst i 5 måneder",
                        "2nd Opinion & Eksamenshjælp"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-5 text-[16px] text-slate-600 font-medium">
                            <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                            <span>{item}</span>
                        </li>
                        ))}
                    </ul>
                    <button onClick={onStart} className="w-full py-6 border-2 border-indigo-100 text-indigo-600 rounded-[2rem] font-black uppercase text-xs tracking-widest sm:hover:bg-indigo-600 sm:hover:text-white transition-all">Vælg semester</button>
                 </div>
               </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA SECTION (Aurora Glow Effect) */}
      <section className="py-40 sm:py-64 bg-slate-950 text-center relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.15)_0,transparent_60%)] -z-10"></div>
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent -z-10"></div>
         
         {/* Animated Aurora Blobs */}
         <motion.div 
            animate={{ 
                x: [0, 100, 0],
                y: [0, 50, 0],
                scale: [1, 1.2, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[150px] -z-10"
         />
         
         <div className="max-w-4xl mx-auto space-y-12 relative z-10 px-6">
            <Reveal>
              <h2 className="text-6xl sm:text-8xl md:text-[120px] font-[900] text-white tracking-[-0.06em] leading-[0.85] text-balance">
                Klar til at mestre <br />
                <span className="italic font-serif text-amber-500">velfærden?</span>
              </h2>
              <p className="text-slate-400 text-xl sm:text-2xl mt-10 leading-relaxed font-medium max-w-2xl mx-auto">
                Bliv en del af eliten. Start din rejse mod en mere sikker og professionel hverdag som socialrådgiver.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
                 <button onClick={onStart} className="w-full sm:w-auto px-16 py-7 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-sm sm:hover:scale-110 active:scale-95 transition-all shadow-[0_0_60px_rgba(255,255,255,0.2)]">Opret profil</button>
                 <Link href="/paedagog" className="text-slate-400 font-bold border-b-2 border-slate-800 pb-1 sm:hover:text-white sm:hover:border-white transition-all text-sm tracking-wide py-4 sm:py-0">Er du pædagogstuderende?</Link>
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
