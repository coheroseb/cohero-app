
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Target, 
  Users, 
  Zap, 
  Globe, 
  Rocket,
  Brain,
  Shield,
  Heart,
  Quote,
  ArrowRight,
  X
} from 'lucide-react';
import Link from 'next/link';
import { BookSpine } from '@/components/BookSpine';
import { useApp } from '@/app/provider';
import QRCode from 'react-qr-code';

const SLIDES = [
  {
    id: 'problem',
    title: 'Udfordringen',
    subtitle: 'Problemet',
    description: 'I 2030 kommer vi til at mangle cirka 35.600 velfærdsmedarbejdere – herunder op mod 5.000 socialrådgivere. Vi er her for at sikre, at de ikke bare rekrutteres, men også fastholdes.',
    icon: null,
    color: 'from-amber-500 to-yellow-500',
    background: 'bg-slate-900'
  },
  {
    id: 'team',
    title: 'Menneskene Bag',
    subtitle: 'Om Julie og Sebastian',
    description: 'Drevet af en fælles passion for at gøre en forskel. Vi startede Cohéro for at bygge den rygdækning, som velfærdens helte fortjener.',
    icon: null,
    color: 'from-rose-500 to-pink-500',
    background: 'bg-slate-950',
    team: [
        { name: 'Julie', role: 'Founder & Uddannelses-ekspert', bio: 'Bachelor i uddannelsesvidenskab og læser kandidat i arbejdsliv.' },
        { name: 'Sebastian', role: 'Founder & Socialrådgiver', bio: 'Uddannet socialrådgiver og læser en kandidat i arbejdsliv.' }
    ]
  },
  {
    id: 'intro',
    title: 'Innovation',
    subtitle: 'Teknologi til træning',
    description: 'Vi bygger bro mellem teori og praksis for at skabe næste generation af velfærdsprofessionelle med værktøjer, der rent faktisk gør en forskel.',
    icon: <Sparkles className="w-12 h-12 text-rose-500" />,
    color: 'from-rose-500 to-orange-500',
    background: 'bg-slate-900'
  },
  {
    id: 'mission-detailed',
    title: 'Vores Mission',
    subtitle: 'Rygdækning',
    description: 'Vi udvikler AI-drevne værktøjer og praksisnær træning, der giver studerende og færdiguddannede den nødvendige tyngde til at navigere i komplekse faglige udfordringer.',
    icon: <Shield className="w-12 h-12 text-indigo-500" />,
    color: 'from-indigo-500 to-rose-500',
    background: 'bg-slate-950'
  },
  {
    id: 'tools',
    title: 'Metodik',
    subtitle: 'Praksisnær læring',
    description: 'Vi træner fremtidens socialrådgivere i at skrive præcise, metodiske og juridisk holdbare journaler. Fra usikker kladde til professionelt dokument.',
    icon: null,
    color: 'from-emerald-500 to-teal-500',
    background: 'bg-slate-900'
  },
  {
    id: 'community',
    title: 'Medskabelse',
    subtitle: 'Løsninger findes på midten mellem den studerende og uddannelsen',
    description: 'Løsningen findes hverken hos uddannelserne eller hos de studerende alene – den findes et sted på midten, hvor vi sammen bygger broen til praksis.',
    icon: null,
    color: 'from-emerald-500 to-teal-500',
    background: 'bg-slate-900'
  },
  {
    id: 'spark',
    title: 'Identitet',
    subtitle: 'Faglig stolthed',
    description: 'At bære Cohéros logo udstråler en dyb faglig stolthed. Det er et symbol på modet til at innovere, tænke nyt og ambitionen om konstant at forbedre sin profession.',
    icon: null,
    color: 'from-blue-500 to-cyan-500',
    background: 'bg-slate-950'
  },
  {
    id: 'analogy',
    title: 'Hvorfor AI-træning?',
    subtitle: 'Simulering redder liv',
    description: 'Vi forventer at kirurgen har opereret på en dukke, og at soldaten har trænet bykamp i en simulator. Hvorfor skulle vi ikke forvente det samme af dem, der håndterer menneskers liv?',
    icon: null,
    color: 'from-orange-500 to-red-600',
    background: 'bg-slate-900'
  },
  {
    id: 'begrebsguiden',
    title: 'Teori',
    subtitle: 'Begrebsguide',
    description: 'Begrebsguiden gør op med frustrationen over svære akademiske termer. Vi oversætter teorien til et sprog, alle kan forstå – uden at miste dybden.',
    icon: null,
    color: 'from-purple-600 to-pink-600',
    background: 'bg-slate-950'
  },
  {
    id: 'outro',
    title: 'Fremtiden',
    subtitle: 'Rejsen er lige begyndt',
    description: 'Vi inviterer dig med til at forme fremtidens velfærd. Det her er kun det første skridt på en vigtig rejse for professionen.',
    icon: <Rocket className="w-12 h-12 text-rose-500" />,
    color: 'from-rose-500 to-orange-500',
    background: 'bg-slate-950'
  }
];

export default function PresentationModule() {
  const { effectiveTheme } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [animationScene, setAnimationScene] = useState(0); // 0: Search, 1: Analysis, 2: Quiz
  const [isQRExpanded, setIsQRExpanded] = useState(false);

  const nextSlide = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Cycle animation scenes for specific slides
  useEffect(() => {
    const slideId = SLIDES[currentSlide].id;
    const animatedSlides = ['spark', 'tools', 'begrebsguiden', 'analogy'];
    if (animatedSlides.includes(slideId)) {
      const interval = setInterval(() => {
        setAnimationScene(prev => (prev + 1) % 3);
      }, 5000);
      return () => clearInterval(interval);
    } else {
      setAnimationScene(0);
    }
  }, [currentSlide]);

  const slide = SLIDES[currentSlide];

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-1000 ${slide.background} text-white selection:bg-rose-500/30`}>
      {/* Background gradients kept for depth */}

      {/* Abstract Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-to-br ${slide.color} blur-[120px] rounded-full`}
        />
        <motion.div 
          animate={{ 
            rotate: -360,
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-to-tl ${slide.color} blur-[120px] opacity-40 rounded-full`}
        />
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-50 flex gap-1 px-1 pt-1">
        {SLIDES.map((_, i) => (
          <div key={i} className="flex-1 h-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={false}
              animate={{ width: i <= currentSlide ? '100%' : '0%' }}
              className={`h-full bg-gradient-to-r ${slide.color} transition-colors duration-500`}
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-6 pt-24 pb-20 md:pt-40 md:pb-32 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? 1000 : -1000,
                opacity: 0,
                scale: 0.9
              }),
              center: {
                x: 0,
                opacity: 1,
                scale: 1
              },
              exit: (direction: number) => ({
                x: direction < 0 ? 1000 : -1000,
                opacity: 0,
                scale: 1.1
              })
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.4 },
              scale: { duration: 0.4 }
            }}
            className="max-w-7xl w-full"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              {/* Left Column: Narrative Content */}
              <div className="text-left space-y-8 md:space-y-12">
                {slide.icon && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block p-6 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-2xl"
                  >
                {slide.icon}
              </motion.div>
            )}

                <div className="space-y-4">
                  {slide.title && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className={`text-sm font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r ${slide.color}`}
                    >
                      {slide.title}
                    </motion.span>
                  )}
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]"
                  >
                    {slide.subtitle}
                  </motion.h2>
                </div>

                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed max-w-xl"
                >
                  {slide.description}
                </motion.p>
              </div>

              {/* Right Column: Interactive Elements & Visuals */}
              <div className="w-full relative min-h-[500px] flex items-center justify-center">

            {/* Interactive Elements for specific slides */}
            {slide.id === 'intro' && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full relative"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { t: 'Innovation', d: 'Fremtidens løsninger', icon: <Rocket className="w-6 h-6 text-rose-500" /> },
                     { t: 'Faglighed', d: 'Metodisk tyngde', icon: <Brain className="w-6 h-6 text-orange-500" /> },
                     { t: 'Fællesskab', d: 'Stærk rygdækning', icon: <Users className="w-6 h-6 text-amber-500" /> }
                   ].map((item, i) => (
                     <motion.div 
                       key={item.t}
                       initial={{ opacity: 0, scale: 0.9 }}
                       animate={{ opacity: 1, scale: 1 }}
                       transition={{ delay: 1 + i * 0.2 }}
                       className="p-8 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-2xl hover:bg-white/10 transition-all group cursor-default"
                     >
                        <div className="mb-4 p-3 inline-block rounded-xl bg-white/5 group-hover:scale-110 transition-transform">
                          {item.icon}
                        </div>
                        <h4 className="text-xl font-black text-white mb-2">{item.t}</h4>
                        <p className="text-sm text-slate-500 font-medium">{item.d}</p>
                     </motion.div>
                   ))}
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                  className="pt-12"
                >
                   <div className="flex items-center justify-center gap-4 text-slate-500 text-sm font-bold animate-bounce">
                      <span>Brug piletasterne for at starte</span>
                      <ChevronRight className="w-4 h-4" />
                   </div>
                </motion.div>
              </motion.div>
            )}

            {slide.id === 'mission-detailed' && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full space-y-12"
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-indigo-600/20 to-rose-600/20 border border-white/10 backdrop-blur-3xl relative overflow-hidden group shadow-2xl"
                >
                   <div className="absolute top-8 left-12">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Vores Vision</p>
                   </div>
                   <Quote className="w-20 h-20 text-white/10 mb-8 mx-auto group-hover:scale-110 transition-transform" />
                   <p className="text-3xl md:text-5xl font-serif italic text-white leading-relaxed text-center max-w-5xl mx-auto">
                     ”At skabe teknologiske løsninger til velfærdsuddannelserne, der giver de studerende et digitalt rum for træning og faglig fordybelse”
                   </p>
                   <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-rose-500/10 blur-[100px] rounded-full" />
                   <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full" />
                </motion.div>
              </motion.div>
            )}

             {slide.id === 'problem' && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full space-y-6"
              >
                <div className="relative h-[650px] rounded-[3rem] bg-slate-900/40 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl p-12 flex flex-col justify-between group">
                   {/* Background Decorative Elements */}
                   <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] rounded-full" />
                   <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full" />
                   
                   {/* Top Section: The Crisis Number */}
                   <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-4">
                         <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                            <Users className="w-6 h-6" />
                         </div>
                         <p className="text-xs font-black uppercase tracking-[0.3em] text-rose-500/50">Arbejdskrafts-krise 2030</p>
                      </div>
                      
                      <div className="flex items-baseline gap-4">
                         <motion.h3 
                           animate={{ opacity: [0.7, 1, 0.7] }}
                           transition={{ duration: 3, repeat: Infinity }}
                           className="text-7xl md:text-8xl font-black text-white tracking-tighter"
                         >
                           35.600
                         </motion.h3>
                         <p className="text-xl font-bold text-slate-500 leading-tight">færre hænder i<br />velfærden</p>
                      </div>
                   </div>

                   {/* Middle Section: The Split / The Tension */}
                   <div className="relative z-10 grid grid-cols-2 gap-8">
                      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 relative overflow-hidden group/item hover:bg-white/10 transition-colors">
                         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/item:opacity-10 transition-opacity">
                            <Zap className="w-20 h-20 text-rose-500" />
                         </div>
                         <h4 className="text-xl font-black text-rose-500 uppercase tracking-widest">Burnout</h4>
                         <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Nyuddannede forlader faget efter få år på grund af manglende støtte og urealistiske krav.
                         </p>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '85%' }}
                              transition={{ duration: 2, delay: 1.5 }}
                              className="h-full bg-rose-500"
                            />
                         </div>
                         <p className="text-[10px] font-black uppercase text-rose-500/50">Risiko for frafald: Høj</p>
                      </div>

                      <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 space-y-4 relative overflow-hidden group/item hover:bg-white/10 transition-colors">
                         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/item:opacity-10 transition-opacity">
                            <Shield className="w-20 h-20 text-emerald-500" />
                         </div>
                         <h4 className="text-xl font-black text-emerald-500 uppercase tracking-widest">Løsningen</h4>
                         <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Cohéro bygger den nødvendige rygdækning gennem praksisnær læring og metodisk tyngde.
                         </p>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 2, delay: 1.8 }}
                              className="h-full bg-emerald-500"
                            />
                         </div>
                         <p className="text-[10px] font-black uppercase text-emerald-500/50">Faglig Rygdækning: Sikret</p>
                      </div>
                   </div>

                   {/* Bottom Section: The Bridge Footer */}
                   <div className="relative z-10 flex items-center justify-between pt-8 border-t border-white/5">
                      <div className="flex gap-12">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Kilde</p>
                            <p className="text-xs font-bold text-white/50">KL & Dansk Socialrådgiverforening</p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
                            <p className="text-xs font-bold text-amber-500">Kritisk mangel</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Cohéro Solution Active</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                   {[
                     { t: '35.600', d: 'Velfærdsmedarbejdere', color: 'text-rose-500' },
                     { t: '5.000', d: 'Socialrådgivere', color: 'text-amber-500' },
                     { t: '2030', d: 'Deadline for løsning', color: 'text-white' }
                   ].map((stat, i) => (
                      <motion.div 
                        key={stat.d}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 + i * 0.1 }}
                        className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-1"
                      >
                         <h5 className={`text-2xl font-black ${stat.color}`}>{stat.t}</h5>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.d}</p>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
             )}

            {slide.id === 'spark' && (
              <motion.div 
                initial={{ opacity: 0, y: 40, perspective: 1000 }}
                animate={{ opacity: 1, y: 0, rotateY: [-3, 3, -3] }}
                transition={{ 
                  opacity: { delay: 0.8 },
                  y: { delay: 0.8 },
                  rotateY: { duration: 12, repeat: Infinity, ease: "linear" }
                }}
                className="w-full h-[600px] relative group"
              >
                <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000" />
                
                <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/10 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl h-full flex flex-col relative">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />
                  
                  <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 relative z-10">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                           {[0, 1, 2].map(i => (
                             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${animationScene === i ? 'bg-blue-500' : 'bg-white/10'}`} />
                           ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Cohéro Identity v1.0</span>
                     </div>
                  </div>

                  <div className="flex-grow relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {animationScene === 0 && (
                        <motion.div 
                          key="identity-logo"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.2 }}
                          className="absolute inset-0 flex flex-col items-center justify-center space-y-8"
                        >
                           <motion.div 
                             animate={{ 
                               scale: [1, 1.1, 1],
                               filter: ["drop-shadow(0 0 20px rgba(59,130,246,0.2))", "drop-shadow(0 0 40px rgba(59,130,246,0.5))", "drop-shadow(0 0 20px rgba(59,130,246,0.2))"]
                             }}
                             transition={{ duration: 4, repeat: Infinity }}
                             className="w-24 h-24 rounded-[2rem] bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-2xl"
                           >
                              <Shield className="w-12 h-12" />
                           </motion.div>
                           <div className="text-center space-y-2">
                              <p className="text-xs font-black uppercase tracking-[0.5em] text-blue-400">Mere end software</p>
                              <h4 className="text-3xl font-black text-white">Et stærkt fagligt symbol</h4>
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 1 && (
                        <motion.div 
                          key="identity-values"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-12 absolute inset-0 grid grid-cols-2 gap-6"
                        >
                           {[
                             { t: 'Innovation', d: 'Modet til at udfordre status quo.', icon: <Rocket className="w-6 h-6" /> },
                             { t: 'Metodik', d: 'Faglig tyngde i hver eneste linje.', icon: <Target className="w-6 h-6" /> },
                             { t: 'Stolthed', d: 'Bær logoet med oprejst pande.', icon: <Shield className="w-6 h-6" /> },
                             { t: 'Fremtid', d: 'Vi bygger broen til næste generation.', icon: <Sparkles className="w-6 h-6" /> }
                           ].map((item, i) => (
                             <motion.div 
                               key={item.t}
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: i * 0.15 }}
                               className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between group/card hover:bg-white/10 transition-colors"
                             >
                                <div className="text-blue-400 mb-4">{item.icon}</div>
                                <div>
                                   <p className="text-sm font-black uppercase tracking-widest text-white mb-1">{item.t}</p>
                                   <p className="text-xs text-slate-500 leading-tight">{item.d}</p>
                                </div>
                             </motion.div>
                           ))}
                        </motion.div>
                      )}

                      {animationScene === 2 && (
                        <motion.div 
                          key="identity-innovation"
                          initial={{ opacity: 0, rotateX: 20 }}
                          animate={{ opacity: 1, rotateX: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="p-12 absolute inset-0 flex flex-col items-center justify-center space-y-8"
                        >
                           <div className="relative">
                              <motion.div 
                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-48 h-48 rounded-full bg-blue-500/20 blur-3xl absolute -inset-4"
                              />
                              <div className="relative z-10 p-10 rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-400/30 backdrop-blur-2xl text-center space-y-4">
                                 <Zap className="w-12 h-12 text-blue-400 mx-auto" />
                                 <h4 className="text-2xl font-black text-white leading-tight">Vær med til at<br />forbedre professionen</h4>
                                 <p className="text-sm text-blue-200/70 font-medium">Bliv en del af bevægelsen</p>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {slide.id === 'tools' && (
              <motion.div 
                initial={{ opacity: 0, y: 40, perspective: 1000 }}
                animate={{ opacity: 1, y: 0, rotateX: [2, -2, 2] }}
                transition={{ 
                  opacity: { delay: 0.8 },
                  y: { delay: 0.8 },
                  rotateX: { duration: 10, repeat: Infinity, ease: "linear" }
                }}
                className="w-full h-[600px] relative group"
              >
                <div className="absolute -inset-10 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-1000" />
                
                <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/10 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl h-full flex flex-col relative">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />
                  
                  <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 relative z-10">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                           {[0, 1, 2].map(i => (
                             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${animationScene === i ? 'bg-emerald-500' : 'bg-white/10'}`} />
                           ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Journaltræner v5.0</span>
                     </div>
                  </div>

                  <div className="flex-grow relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {animationScene === 0 && (
                        <motion.div 
                          key="journal-draft"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-10 space-y-6 text-left absolute inset-0"
                        >
                           <div className="flex items-center gap-4 mb-4">
                              <div className="px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Kladde under udarbejdelse...</div>
                           </div>
                           <div className="space-y-4">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 3 }}
                                className="h-4 bg-white/10 rounded-full"
                              />
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '80%' }}
                                transition={{ duration: 2, delay: 0.5 }}
                                className="h-4 bg-white/10 rounded-full"
                              />
                              <div className="p-6 rounded-2xl bg-white/5 border border-dashed border-white/20 text-slate-400 text-sm leading-relaxed">
                                 "Borgeren virker frustreret over situationen. Jeg tænker at vi skal kigge på muligheden for..."
                              </div>
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 1 && (
                        <motion.div 
                          key="journal-feedback"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.05 }}
                          className="p-10 space-y-6 text-left absolute inset-0"
                        >
                           <div className="flex items-center gap-4 mb-2">
                              <span className="px-4 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">AI Feedback</span>
                           </div>
                           <div className="space-y-4">
                              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                                 <motion.div 
                                   initial={{ x: '-100%' }}
                                   animate={{ x: '100%' }}
                                   transition={{ duration: 2, repeat: Infinity }}
                                   className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent"
                                 />
                                 <p className="text-sm text-slate-300">"Borgeren virker <span className="bg-rose-500/20 border-b-2 border-rose-500 text-rose-200">frustreret</span> over situationen..."</p>
                              </div>
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-4"
                              >
                                 <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                                 <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Metode-tip</p>
                                    <p className="text-xs text-slate-300">Undgå subjektive vurderinger. Prøv i stedet at beskrive de konkrete observationer, der leder til din vurdering.</p>
                                 </div>
                              </motion.div>
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 2 && (
                        <motion.div 
                          key="journal-perfect"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-10 space-y-6 text-left absolute inset-0 flex flex-col justify-center"
                        >
                           <div className="text-center space-y-4">
                              <motion.div 
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                              >
                                 <Target className="w-10 h-10 text-emerald-400" />
                              </motion.div>
                              <h4 className="text-2xl font-black text-white">Professionel Journal</h4>
                           </div>
                           <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/30 text-sm text-emerald-50/80 leading-relaxed shadow-2xl">
                              "Borgeren udtrykker verbalt utilfredshed med sagsbehandlingstiden og hæver stemmen. Objektivt vurderet er der behov for en afklaring af..."
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                 <p className="text-[10px] font-black uppercase text-slate-500">Metodik</p>
                                 <p className="text-sm font-bold text-emerald-400">100% Ok</p>
                              </div>
                              <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                                 <p className="text-[10px] font-black uppercase text-slate-500">Objektivitet</p>
                                 <p className="text-sm font-bold text-emerald-400">Optimal</p>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {slide.id === 'team' && slide.team && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full"
              >
                {slide.team.map((member: any, i: number) => (
                  <div key={member.name} className="relative group">
                    <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-2xl transition-all hover:bg-white/10 text-left space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Quote className="w-12 h-12 rotate-180" />
                       </div>
                       <div className="space-y-2 relative z-10">
                          <h4 className="text-4xl md:text-5xl font-serif italic tracking-tight text-white/90">{member.name}</h4>
                          <p className={`text-[10px] font-black uppercase tracking-[0.4em] text-transparent bg-clip-text bg-gradient-to-r ${slide.color}`}>{member.role}</p>
                       </div>
                       <p className="text-base text-slate-400 leading-relaxed italic border-l-2 border-white/10 pl-6 py-2">
                         "{member.bio}"
                       </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {slide.id === 'analogy' && (
              <motion.div 
                initial={{ opacity: 0, y: 40, perspective: 1000 }}
                animate={{ opacity: 1, y: 0, rotateY: [-2, 2, -2] }}
                transition={{ 
                  opacity: { delay: 0.8 },
                  y: { delay: 0.8 },
                  rotateY: { duration: 10, repeat: Infinity, ease: "linear" }
                }}
                className="w-full h-[600px] relative group"
              >
                <div className="absolute -inset-10 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-orange-500/20 transition-colors duration-1000" />
                
                <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/10 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl h-full flex flex-col relative">
                  <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 relative z-10">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                           {[0, 1].map(i => (
                             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${animationScene % 2 === i ? 'bg-orange-500' : 'bg-white/10'}`} />
                           ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Simulering v4.0</span>
                     </div>
                  </div>

                  <div className="flex-grow relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {animationScene % 2 === 0 ? (
                        <motion.div 
                          key="medical"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="absolute inset-0 p-12 flex flex-col items-center justify-center space-y-8"
                        >
                           <div className="flex items-center gap-12">
                              <motion.div 
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-32 h-48 bg-white/5 border-2 border-white/10 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center gap-4"
                              >
                                 <Heart className="w-12 h-12 text-rose-500 animate-pulse" />
                                 <div className="w-16 h-2 bg-white/10 rounded-full" />
                                 <div className="w-12 h-2 bg-white/10 rounded-full" />
                                 <p className="text-[10px] font-black uppercase text-slate-500">Dukke / Simulator</p>
                              </motion.div>
                              <ArrowRight className="w-8 h-8 text-white/20" />
                              <div className="grid grid-cols-1 gap-4 text-left">
                                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                    <p className="text-xs font-black uppercase text-rose-400">Operationer</p>
                                    <p className="text-sm text-slate-300">Kirurger øver på virtuelle patienter.</p>
                                 </div>
                                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                    <p className="text-xs font-black uppercase text-rose-400">Genoplivning</p>
                                    <p className="text-sm text-slate-300">CPR trænes gentagne gange på dukker.</p>
                                 </div>
                              </div>
                           </div>
                           <p className="text-sm font-bold text-slate-400 italic">"Man træner, før man står med rigtige mennesker"</p>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="military"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="absolute inset-0 p-12 flex flex-col items-center justify-center space-y-8"
                        >
                           <div className="flex items-center gap-12">
                              <motion.div 
                                className="w-48 h-32 bg-slate-800 border-2 border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center"
                              >
                                 <div className="absolute inset-0 bg-emerald-500/10" />
                                 <Target className="w-12 h-12 text-emerald-500" />
                                 <motion.div 
                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="absolute w-20 h-20 border border-emerald-500 rounded-full"
                                 />
                                 <p className="absolute bottom-2 text-[8px] font-black uppercase text-emerald-500/50">Tactical Sim</p>
                              </motion.div>
                              <div className="grid grid-cols-1 gap-4 text-left">
                                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                    <p className="text-xs font-black uppercase text-emerald-400">Krisehåndtering</p>
                                    <p className="text-sm text-slate-300">Bykamp og stress-kommunikation.</p>
                                 </div>
                                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                                    <p className="text-xs font-black uppercase text-emerald-400">Beslutningstagning</p>
                                    <p className="text-sm text-slate-300">Øvelse i scenarier, der ligner virkeligheden.</p>
                                 </div>
                              </div>
                           </div>
                           <p className="text-sm font-bold text-slate-400 italic">"Simulering gør dig klar til det uforudsigelige"</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {slide.id === 'lovportalen' && (
              <motion.div 
                initial={{ opacity: 0, y: 40, perspective: 1000 }}
                animate={{ opacity: 1, y: 0, rotateY: [-2, 2, -2] }}
                transition={{ 
                  opacity: { delay: 0.8 },
                  y: { delay: 0.8 },
                  rotateY: { duration: 10, repeat: Infinity, ease: "linear" }
                }}
                className="w-full h-[600px] relative group"
              >
                {/* Decorative Glows */}
                <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-1000" />
                
                <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/10 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl h-full flex flex-col relative">
                  {/* Holographic Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />
                  
                  <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 relative z-10">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                           {[0, 1, 2].map(i => (
                             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${animationScene === i ? 'bg-blue-500' : 'bg-white/10'}`} />
                           ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Scene {animationScene + 1}: {['Søgning', 'Analyse', 'Træning'][animationScene]}</span>
                     </div>
                  </div>

                  <div className="flex-grow relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {animationScene === 0 && (
                        <motion.div 
                          key="search"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="p-8 space-y-6 text-left absolute inset-0"
                        >
                           <div className="space-y-2">
                              <div className="h-4 w-1/4 bg-blue-500/20 rounded-full" />
                              <div className="h-12 w-full bg-white/5 rounded-xl border border-white/10 flex items-center px-4 relative overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: '100%' }}
                                   transition={{ duration: 2, delay: 0.5 }}
                                   className="absolute left-0 top-0 bottom-0 bg-blue-500/5"
                                 />
                                 <motion.span 
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: 1 }}
                                   transition={{ delay: 0.7 }}
                                   className="text-sm text-blue-400 font-mono z-10"
                                 >
                                   Søger i Serviceloven...
                                 </motion.span>
                                 <motion.div 
                                   animate={{ opacity: [0, 1, 0] }}
                                   transition={{ duration: 0.8, repeat: Infinity }}
                                   className="w-[2px] h-5 bg-blue-400 ml-1 z-10"
                                 />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              {[1, 2, 3, 4].map(i => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 1 + i * 0.1 }}
                                  className={`p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 ${i === 1 ? 'border-blue-500/30 bg-blue-500/5' : ''}`}
                                >
                                  <div className={`h-3 w-1/3 rounded-full ${i === 1 ? 'bg-blue-400/40' : 'bg-white/10'}`} />
                                  <div className="h-2 w-full bg-white/5 rounded-full" />
                                </motion.div>
                              ))}
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 1 && (
                        <motion.div 
                          key="analysis"
                          initial={{ opacity: 0, scale: 0.8, rotateX: -20 }}
                          animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                          exit={{ opacity: 0, scale: 1.1, rotateX: 20 }}
                          className="p-10 space-y-8 text-left absolute inset-0"
                        >
                           <div className="flex items-center gap-6 border-b border-white/10 pb-6">
                              <motion.div 
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                                className="w-16 h-16 rounded-2xl bg-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center text-white text-2xl font-black"
                              >
                                § 42
                              </motion.div>
                              <div>
                                 <h4 className="text-2xl font-black text-white tracking-tight">Dækning af merudgifter</h4>
                                 <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Serviceloven • Kapitel 9</p>
                              </div>
                           </div>
                           <div className="space-y-6">
                              <motion.div 
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-8 rounded-3xl bg-white/5 border border-white/10 italic text-lg text-slate-300 leading-relaxed relative overflow-hidden"
                              >
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50" />
                                "Kommunalbestyrelsen skal yde dækning af nødvendige merudgifter..."
                              </motion.div>
                              <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1 }}
                                className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-400/30 flex items-start gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
                              >
                                <motion.div 
                                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                  className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none"
                                />
                                <Brain className="w-10 h-10 text-blue-300 shrink-0 mt-1" />
                                <div className="space-y-3 relative z-10">
                                   <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">AI Deep Analysis</p>
                                   <p className="text-lg text-blue-50 leading-snug font-medium">
                                      Her skal du være særligt opmærksom på væsentlighedskriteriet. 
                                   </p>
                                </div>
                              </motion.div>
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 2 && (
                        <motion.div 
                          key="quiz"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-8 space-y-8 text-left absolute inset-0 flex flex-col justify-center"
                        >
                           <div className="text-center space-y-2">
                              <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                              <h4 className="text-2xl font-black tracking-tight">Klar til at teste din viden?</h4>
                              <p className="text-slate-400">Tag en hurtig quiz i Merudgiftsbekendtgørelsen</p>
                           </div>
                           <div className="space-y-3">
                              {[
                                'Hvad er aldersgrænsen for støtte?',
                                'Hvilke udgifter er dækket?',
                                'Hvordan beregnes væsentlighed?'
                              ].map((q, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.5 + i * 0.2 }}
                                  className={`p-4 rounded-xl border flex items-center justify-between ${i === 0 ? 'bg-emerald-500/20 border-emerald-500/40' : 'bg-white/5 border-white/10'}`}
                                >
                                   <span className="text-sm font-medium">{q}</span>
                                   {i === 0 && <ChevronRight className="w-4 h-4 text-emerald-400" />}
                                </motion.div>
                              ))}
                           </div>
                           <motion.div 
                             animate={{ scale: [1, 1.05, 1] }}
                             transition={{ duration: 2, repeat: Infinity }}
                             className="w-full py-4 bg-emerald-500 rounded-2xl text-center font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20"
                           >
                             Start Træning Nu
                           </motion.div>
                       </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {slide.id === 'begrebsguiden' && (
              <motion.div 
                initial={{ opacity: 0, y: 40, perspective: 1000 }}
                animate={{ opacity: 1, y: 0, rotateY: [2, -2, 2] }}
                transition={{ 
                  opacity: { delay: 0.8 },
                  y: { delay: 0.8 },
                  rotateY: { duration: 10, repeat: Infinity, ease: "linear" }
                }}
                className="w-full h-[600px] relative group"
              >
                {/* Decorative Glows */}
                <div className="absolute -inset-10 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors duration-1000" />
                
                <div className="rounded-[2.5rem] bg-slate-900/40 border border-white/10 overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl h-full flex flex-col relative">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] z-50 pointer-events-none bg-[length:100%_4px,3px_100%]" />
                  
                  <div className="bg-white/5 px-8 py-6 border-b border-white/10 flex items-center justify-between shrink-0 relative z-10">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                           {[0, 1, 2].map(i => (
                             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${animationScene === i ? 'bg-purple-500' : 'bg-white/10'}`} />
                           ))}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Begrebsguiden v2.0</span>
                     </div>
                  </div>

                  <div className="flex-grow relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      {animationScene === 0 && (
                        <motion.div 
                          key="begreb-input"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-12 flex flex-col items-center justify-center h-full space-y-8 text-center"
                        >
                           <motion.div 
                             animate={{ scale: [1, 1.05, 1] }}
                             transition={{ duration: 4, repeat: Infinity }}
                             className="w-24 h-24 rounded-3xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30"
                           >
                              <Brain className="w-12 h-12" />
                           </motion.div>
                           <div className="space-y-4 max-w-md w-full">
                              <h4 className="text-2xl font-black text-white">Hvilket begreb driller?</h4>
                              <div className="h-16 w-full bg-white/5 rounded-2xl border border-white/10 flex items-center px-6 relative overflow-hidden">
                                 <motion.span 
                                   initial={{ opacity: 0 }}
                                   animate={{ opacity: 1 }}
                                   transition={{ delay: 0.5 }}
                                   className="text-xl text-purple-300 font-bold"
                                 >
                                   Bourdieu's Habitus...
                                 </motion.span>
                                 <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-[3px] h-8 bg-purple-400 ml-1" />
                              </div>
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 1 && (
                        <motion.div 
                          key="begreb-explain"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          className="p-8 space-y-4 absolute inset-0 text-left overflow-y-auto"
                        >
                           <div className="flex items-center gap-4">
                              <span className="px-4 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-500/30">Forklaring</span>
                           </div>
                           <div className="space-y-2">
                              {[
                                { t: 'Analogien', c: 'Tænk på det som din "autopilot" eller en rygsæk af erfaringer, du altid bærer.', color: 'bg-rose-500/20 text-rose-400' },
                                { t: 'Akademisk', c: 'Habitus er et system af varige og overførbare dispositioner...', color: 'bg-blue-500/20 text-blue-400' },
                                { t: 'I praksis', c: 'Du ser det, når en borger reagerer ud fra ubevidste mønstre...', color: 'bg-amber-500/20 text-amber-400' },
                                { t: 'Læs videre', c: 'Bourdieu (2005): "Distinktionen" • Kap. 2, s. 42-58.', color: 'bg-indigo-500/20 text-indigo-400' }
                              ].map((item, i) => (
                                <motion.div 
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.3 }}
                                  className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/10 space-y-1"
                                >
                                   <p className={`text-[10px] font-black uppercase tracking-widest ${item.color.split(' ')[1]}`}>{item.t}</p>
                                   <p className="text-xs md:text-sm text-slate-300 leading-tight md:leading-relaxed">{item.c}</p>
                                </motion.div>
                              ))}
                           </div>
                        </motion.div>
                      )}

                      {animationScene === 2 && (
                        <motion.div 
                          key="begreb-praxis"
                          initial={{ opacity: 0, rotateX: 45 }}
                          animate={{ opacity: 1, rotateX: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="p-12 absolute inset-0 flex flex-col items-center justify-center space-y-10"
                        >
                           <div className="relative">
                              <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="w-48 h-48 rounded-full border-2 border-dashed border-purple-500/20 flex items-center justify-center"
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2">
                                 <Zap className="w-10 h-10 text-purple-400" />
                                 <p className="text-xl font-black text-white">Nu forstår du det!</p>
                                 <p className="text-xs text-slate-400">Begrebet er nu gemt i din vidensbase</p>
                              </div>
                              
                              {/* Floating elements around */}
                              {[0, 60, 120, 180, 240, 300].map(deg => (
                                <motion.div 
                                  key={deg}
                                  animate={{ 
                                    y: [0, -10, 0],
                                    opacity: [0.3, 1, 0.3]
                                  }}
                                  transition={{ duration: 3, repeat: Infinity, delay: deg/60 }}
                                  className="absolute w-8 h-8 rounded-lg bg-white/10 border border-white/10 backdrop-blur-md"
                                  style={{ 
                                    top: '50%',
                                    left: '50%',
                                    transform: `rotate(${deg}deg) translateX(100px) rotate(-${deg}deg)`
                                  }}
                                />
                              ))}
                           </div>
                           <motion.button 
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             className="px-12 py-4 bg-purple-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-purple-500/40"
                           >
                             Udforsk flere begreber
                           </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {slide.id === 'community' && (
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="w-full space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                   <div className="space-y-8 text-left">
                      <div className="space-y-4">
                         <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-400">Medskabelse</p>
                         <h4 className="text-4xl md:text-6xl font-black text-white leading-[0.9] tracking-tighter">
                            Udviklet sammen<br />med jer.
                         </h4>
                      </div>
                      <p className="text-xl text-slate-400 leading-relaxed font-medium">
                         Vi udvikler og forfiner platformen i tæt samarbejde med både de studerende og uddannelserne. Fordi løsningen findes hverken hos uddannelserne eller hos de studerende alene – den findes et sted på midten.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                            <Users className="w-6 h-6 text-emerald-500" />
                            <h5 className="text-white font-bold">Studerende</h5>
                            <p className="text-xs text-slate-500">Direkte feedback fra hverdagen.</p>
                         </div>
                         <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                            <Globe className="w-6 h-6 text-blue-500" />
                            <h5 className="text-white font-bold">Institutioner</h5>
                            <p className="text-xs text-slate-500">Akademisk dybde og relevans.</p>
                         </div>
                      </div>
                   </div>

                   <div className="relative aspect-square">
                      {/* Interactive Synergy Visual */}
                      <div className="absolute inset-0 flex items-center justify-center">
                         <motion.div 
                           animate={{ rotate: 360 }}
                           transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                           className="w-full h-full border-2 border-dashed border-white/10 rounded-full"
                         />
                         
                         {/* Connecting Points */}
                         {[0, 120, 240].map(deg => (
                           <motion.div 
                             key={deg}
                             animate={{ 
                               scale: [1, 1.1, 1],
                               opacity: [0.5, 1, 0.5]
                             }}
                             transition={{ duration: 4, repeat: Infinity, delay: deg/120 }}
                             className="absolute w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl"
                             style={{ 
                               top: '50%',
                               left: '50%',
                               transform: `rotate(${deg}deg) translateX(150px) rotate(-${deg}deg)`
                             }}
                           >
                              <Sparkles className="w-6 h-6 text-emerald-400" />
                           </motion.div>
                         ))}

                         {/* Central Core */}
                         <motion.div 
                           animate={{ 
                             scale: [1, 1.05, 1],
                             boxShadow: [
                               "0 0 40px rgba(16,185,129,0.2)",
                               "0 0 80px rgba(16,185,129,0.4)",
                               "0 0 40px rgba(16,185,129,0.2)"
                             ]
                           }}
                           transition={{ duration: 3, repeat: Infinity }}
                           className="w-40 h-40 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 flex flex-col items-center justify-center gap-2 shadow-2xl z-10"
                         >
                            <Target className="w-12 h-12 text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Fælles Mål</span>
                         </motion.div>

                         {/* Connecting Lines (Simulated with Gradient Overlays) */}
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(16,185,129,0.05)_100%)] pointer-events-none" />
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {slide.id === 'outro' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="w-full text-center space-y-12"
              >
                <div className="relative p-20 rounded-[4rem] bg-white/5 border border-white/10 backdrop-blur-3xl overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-indigo-500/10" />
                   
                   <motion.div 
                     animate={{ 
                       rotate: 360,
                       scale: [1, 1.2, 1]
                     }}
                     transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                     className="absolute -top-1/2 -right-1/2 w-full h-full bg-rose-500/5 blur-[120px] rounded-full"
                   />

                   <div className="relative z-10 space-y-8">
                      <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="inline-block p-6 rounded-[2rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl"
                      >
                         <Rocket className="w-12 h-12 text-rose-500" />
                      </motion.div>
                      
                      <div className="space-y-4">
                         <h4 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                            Lad os skabe fremtiden<br />sammen.
                         </h4>
                         <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
                            Vi inviterer dig med til at forme fremtidens velfærd. Lad os gøre en forskel sammen.
                         </p>
                      </div>

                      <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-12">
                         <Link href="/" className="inline-flex items-center gap-4 px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.3)] group/btn">
                           Start din rejse nu
                           <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                         </Link>

                         <div 
                           className="flex flex-col items-center gap-4 group/qr cursor-zoom-in"
                           onClick={() => setIsQRExpanded(true)}
                         >
                            <div className="p-4 bg-white rounded-3xl shadow-2xl transition-transform group-hover:scale-110 duration-500">
                               <QRCode 
                                 value={typeof window !== 'undefined' ? `${window.location.origin}/journey/konkurrence` : ''} 
                                 size={120}
                                 level="H"
                               />
                            </div>
                            <div className="text-center">
                               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Scan & Deltag</p>
                               <p className="text-xs font-bold text-rose-500">Vind eksklusive præmier</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">
                   Cohéro © 2026 • Designet med stolthed
                </p>
              </motion.div>
            )}
                </div>
              </div>
            </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex items-center justify-between pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${currentSlide === 0 ? 'opacity-0 scale-50' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-110 active:scale-95 text-white'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextSlide}
            disabled={currentSlide === SLIDES.length - 1}
            className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${currentSlide === SLIDES.length - 1 ? 'opacity-0 scale-50' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-110 active:scale-95 text-white'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="pointer-events-auto">
           {currentSlide === SLIDES.length - 1 ? (
             <Link href="/" className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/20">
               Tilbage til Platformen
             </Link>
           ) : (
             <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
               {currentSlide + 1} / {SLIDES.length}
             </div>
           )}
        </div>
      </div>

      {/* QR Expansion Modal */}
      <AnimatePresence>
        {isQRExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsQRExpanded(false)}
            className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-12 rounded-[3rem] shadow-[0_0_100px_rgba(244,63,94,0.3)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <p className="text-white font-black uppercase tracking-[0.4em] text-sm">Scan for at deltage</p>
              </div>

              <QRCode 
                value={typeof window !== 'undefined' ? `${window.location.origin}/journey/konkurrence` : ''} 
                size={400}
                level="H"
                className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
              />

              <button 
                onClick={() => setIsQRExpanded(false)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-12 text-center space-y-2"
            >
              <h4 className="text-3xl font-black text-white tracking-tighter">Deltag i Konkurrencen</h4>
              <p className="text-rose-400 font-bold uppercase tracking-widest text-sm">Scan koden med dit kamera</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo watermark */}
      <div className="absolute top-6 md:top-12 left-1/2 -translate-x-1/2 opacity-100 flex items-end -space-x-[1px] scale-[0.6] md:scale-[1.2] lg:scale-[1.5] origin-top transition-all hover:scale-[1.3] md:hover:scale-[1.6] cursor-pointer z-[100]">
        <BookSpine isGhost index={0} theme={effectiveTheme} width="w-4" height="h-10" color="bg-white" decoration="plain" tilt="-rotate-1" />
        <BookSpine isGhost index={1} theme={effectiveTheme} width="w-5" height="h-14" color="bg-white" decoration="bands" />
        <BookSpine isGhost index={2} theme={effectiveTheme} width="w-2.5" height="h-11" color="bg-white" decoration="plain" />

        <BookSpine isGhost index={3} theme={effectiveTheme} letter="C" width="w-6" height="h-16" color="bg-white" decoration="bands" />
        <BookSpine isGhost index={4} theme={effectiveTheme} letter="o" width="w-6" height="h-13" color="bg-white" decoration="gold" />
        <BookSpine isGhost index={5} theme={effectiveTheme} letter="h" width="w-6" height="h-18" color="bg-white" decoration="bands" tilt="-rotate-[1.5deg]" />
        <BookSpine isGhost index={6} theme={effectiveTheme} letter="é" width="w-6" height="h-15" color="bg-white" decoration="stripes" />
        <BookSpine isGhost index={7} theme={effectiveTheme} letter="r" width="w-6" height="h-17" color="bg-white" decoration="bands" />
        <BookSpine isGhost index={8} theme={effectiveTheme} letter="o" width="w-6" height="h-12" color="bg-white" decoration="gold" tilt="rotate-[1deg]" />

        <BookSpine isGhost index={9} theme={effectiveTheme} width="w-4" height="h-14" color="bg-white" decoration="ornament" />
        <BookSpine isGhost index={10} theme={effectiveTheme} width="w-5" height="h-10" color="bg-white" decoration="plain" tilt="rotate-2" />
        <BookSpine isGhost index={11} theme={effectiveTheme} width="w-4" height="h-13" color="bg-white" decoration="bands" />
      </div>
    </div>
  );
}
