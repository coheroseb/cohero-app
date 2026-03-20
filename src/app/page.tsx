
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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';

const Reveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
  >
    {children}
  </motion.div>
);

export default function LandingPage() {
  const { openAuthPage } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // We remove the activeTrack state as it's no longer needed for switching between tracks on the landing page.
  const activeTrack = 'social';

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onStart = () => openAuthPage('signup');

  const handleInstallClick = async (e: React.MouseEvent) => {
    if (!deferredPrompt) {
        // Fallback or info if not supported/already installed
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
    <div className="flex flex-col selection:bg-amber-100 selection:text-amber-900 overflow-x-hidden bg-[#FDFCF8]">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[95vh] lg:min-h-[90vh] flex items-center pt-32 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.08)_0,transparent_70%)] -z-10"></div>
        <div className="absolute top-20 left-10 w-64 h-64 bg-amber-100/30 rounded-full blur-[100px] animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-12 items-center gap-12 lg:gap-24">
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 md:space-y-10">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTrack}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8 md:space-y-10"
                >
                  <h1 className="text-4xl sm:text-6xl md:text-7xl xl:text-8xl font-bold text-amber-950 serif leading-[1.05] md:leading-[0.95] tracking-tight max-w-5xl">
                    Din intelligente <br />
                    <span className="text-amber-700 italic relative inline-block mt-2 md:mt-4 px-2">
                      digitale kollega.
                      <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-3 md:h-4 text-amber-300/40 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                          <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                      </svg>
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-2xl text-slate-500 max-w-xl leading-relaxed font-medium">
                    Cohéro ruster dig til at mestre juraen, etikken og det faglige skøn gennem intelligent sparring på dine egne cases og journaler.
                  </p>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex flex-col items-center lg:items-start gap-6 pt-4 w-full reveal">
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <button 
                    onClick={onStart}
                    className="group relative px-10 md:px-12 py-5 md:py-6 bg-amber-950 text-white rounded-2xl text-lg md:text-xl font-bold transition-all hover:bg-amber-900 hover:shadow-2xl hover:scale-[1.02] active:scale-95 w-full sm:w-auto overflow-hidden shadow-xl shadow-amber-950/20"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            Kom i gang gratis
                            <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-2 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </button>
                    
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center gap-3 px-8 py-5 md:py-6 bg-white border-2 border-amber-950 text-amber-950 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-50 active:scale-95 transition-all shadow-lg"
                    >
                        <Download className="w-5 h-5" />
                        Hent App
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
                    <div className="flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            <ShieldCheck className="w-4 h-4" />
                            7 dages gratis prøveperiode
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Ingen binding • Opret på 30 sek.</p>
                    </div>

                    <div className="flex items-center gap-4 py-2 px-4 bg-white/50 backdrop-blur-sm rounded-xl border border-amber-100 shadow-sm">
                        <div className="flex -space-x-2">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-amber-100 flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-amber-900">S{i}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-amber-500 fill-amber-500" />)}
                            </div>
                            <p className="text-[9px] font-black text-amber-950/60 uppercase tracking-widest leading-none text-center sm:text-left">Brugt på tværs af landets uddannelser</p>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative reveal mt-8 lg:mt-0">
              <div className="relative bg-white p-3 md:p-4 rounded-[2.5rem] md:rounded-[3.5rem] border border-amber-100 shadow-2xl transition-transform duration-700 hover:scale-[1.01] overflow-hidden group">
                <Image 
                  src="/nan_jul.jpg" 
                  alt="Stifterne af Cohéro"
                  width={800}
                  height={600}
                  priority
                  className="rounded-[2rem] md:rounded-[3rem] object-cover shadow-inner grayscale-[0.1] group-hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute bottom-4 left-4 md:-bottom-6 md:-left-6 bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-amber-50 flex items-center gap-4 animate-float-spine">
                   <div className="w-10 h-10 md:w-14 md:h-14 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 fill-current" />
                   </div>
                   <div>
                      <p className="text-[8px] md:text-[10px] font-black uppercase text-slate-300 tracking-widest mb-0.5">Din sikkerhed</p>
                      <p className="text-sm md:text-base font-bold text-amber-950 serif leading-none">Faglig rygdækning</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST RIBBON */}
      <section className="py-12 md:py-20 bg-white border-y border-amber-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <Reveal>
             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-900/40 mb-8 md:mb-10 px-4">Styrker dannelsen på tværs af landets professionshøjskoler</p>
           </Reveal>
           <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700 cursor-default">
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-amber-950">VIA UC</span>
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-amber-950 px-2 border-x border-amber-100">KP</span>
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-amber-950">UCL</span>
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-amber-950 px-2 border-x border-amber-100">Absalon</span>
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-amber-950">AAU</span>
           </div>
        </div>
      </section>

      {/* 3. CORE FEATURES BENTO GRID */}
      <section id="vaerktojer" className="py-24 md:py-32 bg-[#FDFCF8] px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-16 md:mb-24 reveal text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-bold text-amber-950 serif mb-6 md:mb-8 leading-tight tracking-tight px-4 md:px-0">Værktøjer der <span className="text-amber-700 italic">skærper</span> din dømmekraft.</h2>
            <p className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium">
              Vores digitale økosystem er designet til at understøtte dig der, hvor teorien møder virkeligheden – uanset om du er på farten eller ved computeren.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 md:gap-8">
             
             {/* Begrebsguiden - PRIMARY */}
             <div onClick={onStart} className="md:col-span-2 lg:col-span-8 bg-white border border-amber-100 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm relative overflow-hidden group hover:shadow-2xl hover:border-amber-950 transition-all cursor-pointer">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                   <Library className="w-64 h-64 -rotate-12 text-amber-900" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                   <div className="w-20 h-20 md:w-32 md:h-32 bg-amber-50 text-amber-700 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform shadow-inner">
                      <Wand2 className="w-10 h-10 md:w-16 md:h-16" />
                   </div>
                   <div className="text-center md:text-left space-y-4 md:space-y-6">
                      <span className="inline-block px-4 py-1.5 bg-amber-50 text-amber-700 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">Intelligent Opslagsværk</span>
                      <h3 className="text-3xl md:text-5xl font-bold text-amber-950 serif leading-tight">Begrebsguiden</h3>
                      <p className="text-slate-500 text-base md:text-xl leading-relaxed italic font-medium">"Få pædagogiske og praksisnære forklaringer på komplekse faglige begreber fra dit pensum."</p>
                      <div className="flex items-center justify-center md:justify-start gap-3 text-amber-950 font-black uppercase text-xs tracking-widest pt-2 md:pt-4 group-hover:translate-x-2 transition-transform">
                        Prøv Begrebsguiden <ArrowRight className="w-5 h-5" />
                      </div>
                   </div>
                </div>
             </div>

             {/* Lovportalen - SECONDARY */}
             <div onClick={onStart} className="lg:col-span-4 bg-amber-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl text-white flex flex-col justify-between group cursor-pointer overflow-hidden border border-amber-900 hover:scale-[1.02] transition-all">
                <div>
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center mb-8 md:mb-10 backdrop-blur-sm group-hover:bg-amber-400 group-hover:text-amber-950 transition-colors">
                    <Scale className="w-7 h-7 md:w-8 md:h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold serif mb-4 leading-tight">Lovportalen</h3>
                  <p className="text-amber-100/60 text-sm md:text-base leading-relaxed">Slå op i de mest relevante love for socialt arbejde med indbygget AI-fortolkning i øjenhøjde.</p>
                </div>
                <div className="pt-8 md:pt-12 flex items-center justify-between border-t border-white/10">
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Åbn Lovportalen</span>
                   <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-amber-950 transition-all">
                    <ChevronRight className="w-5 h-5" />
                   </div>
                </div>
             </div>

             {/* Folketinget - LARGE MOBILE */}
             <div onClick={onStart} className="md:col-span-2 lg:col-span-8 bg-white border border-amber-100 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col md:flex-row items-center gap-8 md:gap-12 group hover:shadow-2xl hover:border-amber-950 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                <div className="flex-1 space-y-4 md:space-y-6 text-center md:text-left order-2 md:order-1">
                   <div className="flex items-center justify-center md:justify-start gap-2 text-[9px] md:text-[10px] font-black text-rose-600 uppercase tracking-widest">
                      <Zap className="w-4 h-4 fill-current" /> Sagens kerne i realtid
                   </div>
                   <h3 className="text-3xl md:text-5xl font-bold text-amber-950 serif leading-tight">Folketinget Direkte</h3>
                   <p className="text-slate-500 text-base md:text-xl leading-relaxed italic">"Overvågning af lovforslag med direkte analyse af betydningen for socialrådgiverens virke."</p>
                   <div className="flex items-center justify-center md:justify-start gap-3 text-amber-950 font-black uppercase text-xs tracking-widest pt-2 group-hover:translate-x-2 transition-transform">
                        Overvåg lovgivning <ArrowRight className="w-5 h-5" />
                   </div>
                </div>
                <div className="w-20 h-20 md:w-40 md:h-40 bg-rose-50 text-rose-600 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform shadow-inner order-1 md:order-2">
                   <Building className="w-10 h-10 md:w-20 md:h-20" />
                </div>
             </div>

             {/* Memento - QUICK TASK */}
             <div onClick={onStart} className="lg:col-span-4 bg-white border border-amber-100 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col justify-between group hover:bg-amber-50/30 hover:border-amber-950 transition-all cursor-pointer shadow-sm hover:shadow-xl">
                <div>
                   <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-50 text-amber-700 rounded-2xl md:rounded-3xl flex items-center justify-center mb-8 md:mb-10 shadow-inner group-hover:scale-110 transition-transform">
                    <Brain className="w-7 h-7 md:w-8 md:h-8" />
                   </div>
                   <h3 className="text-2xl md:text-3xl font-bold text-amber-950 serif mb-4 leading-tight">Memento</h3>
                   <p className="text-slate-500 text-sm md:text-base leading-relaxed">Træn din paratviden med huskespil om paragraffer og vigtige teorier fra pensum.</p>
                </div>
                <div className="pt-8 md:pt-12 text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-between group-hover:text-amber-950 transition-colors">
                   <span>Start træning</span>
                   <Trophy className="w-5 h-5 text-amber-500" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 4. SOCIAL PROOF / QUOTE SECTION */}
      <section className="py-24 md:py-32 bg-white relative overflow-hidden px-6">
        <div className="max-w-4xl mx-auto text-center reveal">
           <div className="w-16 h-16 md:w-24 md:h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-10 md:mb-16 shadow-inner">
              <Quote className="w-8 h-8 md:w-12 md:h-12 text-amber-700 opacity-20" />
           </div>
           <blockquote className="text-2xl md:text-5xl font-bold text-amber-950 serif leading-[1.3] italic mb-10 md:mb-16 tracking-tight px-4">
             "Cohéro har givet mig den faglige rygdækning, jeg manglede i min praktik. At kunne tjekke juraen og få sparring har gjort mig langt mere tryg i myndighedsrollen."
           </blockquote>
           <div className="space-y-2">
              <p className="text-lg md:text-xl font-bold text-amber-950">Mads Henriksen</p>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-700/50 px-6">Socialrådgiverstuderende • 6. semester</p>
           </div>
        </div>
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-amber-100/10 rounded-full blur-[100px] -ml-32"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-indigo-100/10 rounded-full blur-[100px] -mr-32"></div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="priser" className="py-24 md:py-32 bg-[#FDFCF8] px-6 border-t border-amber-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24 space-y-4 md:space-y-6 reveal">
            <h2 className="text-4xl md:text-6xl font-bold text-amber-950 serif tracking-tight leading-none px-4">Prøv <span className="text-amber-700 italic">Kollega+</span> i dag.</h2>
            <p className="text-lg md:text-xl text-slate-500 italic max-w-xl mx-auto px-4">Fuld rygdækning gennem hele dit studie. Start din gratis prøveperiode nu.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-10 items-stretch max-w-5xl mx-auto lg:max-w-none pt-10">
            {/* Free Plan */}
            <div className="bg-white border border-amber-100 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm flex flex-col transition-all duration-500 hover:shadow-xl relative overflow-hidden group reveal">
               <h3 className="text-2xl font-bold text-amber-950 serif mb-1">Kollega</h3>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 italic">Det fundamentale</p>
               <div className="text-4xl md:text-5xl font-black text-amber-950 mb-10 serif">0 kr. <span className="text-base font-normal text-slate-300 italic">/mdr</span></div>
               <ul className="space-y-4 mb-12 flex-grow">
                 {[
                   "3 daglige opslag i Guiden",
                   "3 daglige STAR-tolkninger",
                   "Begrænset Lovportal-adgang",
                   "1 daglig Journal-træning",
                   "3 daglige Case-simuleringer"
                 ].map(item => (
                   <li key={item} className="flex items-start gap-4 text-sm text-slate-500 font-medium leading-tight">
                     <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                     <span>{item}</span>
                   </li>
                 ))}
               </ul>
               <button onClick={onStart} className="w-full py-5 border-2 border-amber-950 text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-950 hover:text-white transition-all active:scale-95 shadow-sm">Kom i gang</button>
            </div>

            {/* Kollega+ */}
            <div className="relative lg:scale-105 z-10 reveal pt-6 md:pt-0">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-amber-950 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl z-20 whitespace-nowrap animate-pulse">
                    Første 7 dage gratis
                </div>
                
               <div onClick={onStart} className="bg-amber-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(69,26,3,0.4)] flex flex-col text-white cursor-pointer border-2 border-amber-400/30 h-full relative overflow-hidden group">
                  <div className="mt-4">
                        <h3 className="text-2xl font-bold serif mb-1">Kollega+</h3>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-8 italic">For den dedikerede studerende</p>
                        
                        <div className="mb-8">
                            <div className="text-4xl md:text-5xl font-black serif leading-none">89 kr. <span className="text-base font-normal text-amber-100/30 italic">/mdr</span></div>
                            <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest mt-2">Ingen binding • Start med 0 kr.</p>
                        </div>
                  </div>

                  <ul className="space-y-4 mb-12 flex-grow">
                    {[
                      "Ubegrænset Lovportal-adgang",
                      "Fuld overvågning af Folketinget",
                      "Ubegrænsede opslag i Guiden",
                      "Ubegrænset STAR-tolkning",
                      "Ubegrænset Journal-træning",
                      "Op til 3 månedlige Second Opinions",
                      "Personligt arkiv over dine analyser"
                    ].map(item => (
                      <li key={item} className="flex items-start gap-4 text-sm md:text-base text-amber-50/90 font-bold leading-tight">
                        <div className="p-0.5 bg-amber-400 rounded-full shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-amber-950" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-6 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest hover:bg-white hover:scale-105 transition-all active:scale-95 shadow-xl shadow-amber-400/20">Prøv gratis nu</button>
                  
                  <div className="mt-4 text-center opacity-40">
                      <p className="text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3" />
                        Sikker checkout via Stripe
                      </p>
                  </div>
               </div>
            </div>

            {/* Semester pakke */}
            <div onClick={onStart} className="bg-white border border-amber-100 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm flex flex-col transition-all duration-500 hover:shadow-xl relative overflow-hidden cursor-pointer group reveal">
               <h3 className="text-2xl font-bold text-amber-950 serif mb-1">Semesteret</h3>
               <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 italic">Mest værdi for pengene</p>
               <div className="text-4xl md:text-5xl font-black text-amber-950 mb-10 serif">329 kr. <span className="text-base font-normal text-slate-300 italic">/5 mdr.</span></div>
               <ul className="space-y-4 mb-12 flex-grow">
                 {[
                   "Alt fra Kollega+ i 5 måneder",
                   "Spar 116 kr. (svarende til -25%)",
                   "Gælder for hele semesteret",
                   "Perfekt til eksamensperioden",
                   "Første adgang til beta-værktøjer"
                 ].map((item, i) => (
                   <li key={i} className="flex items-start gap-4 text-sm text-slate-500 font-medium leading-tight">
                       <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                       <span>{item}</span>
                    </li>
                  ))}
               </ul>
               <button className="w-full py-5 border-2 border-amber-950 text-amber-950 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-950 hover:text-white transition-all active:scale-95 shadow-sm">Sikr dit semester</button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FINAL CALL TO ACTION */}
      <section className="py-32 md:py-48 bg-amber-950 text-center relative overflow-hidden px-6">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0,transparent_70%)] -z-10"></div>
         <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 relative z-10 reveal px-4">
            <h2 className="text-4xl md:text-8xl font-bold text-white serif tracking-tight leading-none">Din dannelse starter nu.</h2>
            <p className="text-amber-100/50 text-lg md:text-2xl max-w-xl mx-auto leading-relaxed italic">
              "Det kræver mod at være usikker. Det kræver Cohéro at blive sikker i dit faglige virke."
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-8 pt-8 w-full md:w-auto">
               <button onClick={onStart} className="w-full sm:w-auto px-12 md:px-16 py-6 md:py-8 bg-amber-400 text-amber-950 rounded-2xl font-black uppercase tracking-widest text-base md:text-lg hover:bg-white hover:scale-110 transition-all shadow-2xl shadow-amber-400/20 active:scale-95">Kom i gang gratis</button>
               <Link href="/paedagog" className="text-white font-bold border-b-2 border-white/20 pb-1 hover:border-amber-400 transition-all text-base md:text-lg">Pædagogstuderende? Læs her</Link>
            </div>
         </div>
         <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-400/5 rounded-full blur-[120px] pointer-events-none"></div>
      </section>

    </div>
  );
}
