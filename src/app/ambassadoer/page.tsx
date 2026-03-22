'use client';

import React from 'react';
import { 
  Megaphone, 
  Users, 
  Sparkles, 
  Target, 
  ArrowRight, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Trophy,
  ArrowUpRight,
  ChevronRight,
  CheckCircle2,
  Quote,
  Info,
  Heart,
  Star,
  Coffee,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

export default function AmbassadorPage() {
  return (
    <div className="bg-[#FDFBF7] min-h-screen selection:bg-amber-200 selection:text-amber-950 font-sans antialiased overflow-x-hidden">
      
      {/* 1. HERO SECTION - Soft & Organic */}
      <section className="relative min-h-[70dvh] flex flex-col justify-center pt-32 pb-20 px-6 sm:px-12 overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EC]/40 to-[#FDFBF7] -z-20"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-100/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-96 h-96 bg-rose-100/20 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8 text-center lg:text-left">
              <Reveal>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200/50 rounded-full shadow-sm mb-4">
                   <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                   <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-900">Studerende for studerende</span>
                </div>
                <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-extrabold text-slate-900 tracking-[-0.04em] leading-[0.95] mb-6">
                  Bliv <span className="text-amber-600 italic">Ambassadør</span><br/> for Cohéro
                </h1>
                <p className="text-lg sm:text-2xl text-slate-600 max-w-2xl leading-relaxed font-medium mx-auto lg:mx-0">
                  Brænder du for den faglige dannelse? Vi søger dedikerede studerende, der vil være med til at præge fremtidens digitale makker.
                </p>
              </Reveal>
              
              <Reveal delay={0.2}>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
                  <a href="mailto:kontakt@cohero.dk?subject=Jeg vil gerne være ambassadør" className="w-full sm:w-auto">
                    <button className="group relative w-full px-10 py-5 bg-slate-900 text-white rounded-2xl text-lg font-bold transition-all active:scale-[0.98] sm:hover:bg-slate-800 sm:hover:scale-[1.02] shadow-xl shadow-slate-900/10 overflow-hidden">
                      <span className="relative z-10 flex items-center justify-center gap-3">
                        Ansøg nu <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </a>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest sm:ml-4">Taget under 30 sekunder</p>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.3} className="w-full lg:w-5/12 max-w-md">
              <div className="relative aspect-square">
                {/* Visual Representation of Ambassador Role */}
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[4rem] shadow-2xl overflow-hidden flex items-center justify-center group">
                   <div className="relative w-40 h-40">
                      <motion.div 
                        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-[3rem] border-4 border-dashed border-amber-200 opacity-40"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Megaphone className="w-20 h-20 text-amber-600 -rotate-12 transition-transform sm:group-hover:scale-110 sm:group-hover:rotate-0 duration-500" />
                      </div>
                   </div>
                   {/* Floating Tags */}
                   <div className="absolute top-10 right-10 bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-lg -rotate-6 animate-float-spine">
                      <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                   </div>
                   <div className="absolute bottom-10 left-10 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-lg rotate-12 animate-[float_5s_ease-in-out_infinite]">
                      <Star className="w-5 h-5 text-emerald-500 fill-emerald-500" />
                   </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. THE PERKS - Card Layout */}
      <section className="py-24 sm:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <Reveal>
              <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-none mb-6">
                Hvorfor blive <span className="text-amber-500">en del</span> af det?
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                Som ambassadør får du ikke bare titlen. Du bliver en del af maskinrummet og får værktøjer til din egen faglige rejse.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Lightbulb, 
                title: "Direkte Indflydelse", 
                desc: "Vær med til at bestemme hvilke værktøjer vi bygger næste gang. Din stemme er vores vigtigste rettesnor.",
                color: "bg-amber-100 text-amber-700",
                border: "border-amber-200"
              },
              { 
                icon: Trophy, 
                title: "Gratis Kollega+", 
                desc: "Som tak for din indsats får du altid gratis adgang til Kollega+ og alle vores fremtidige funktioner.",
                color: "bg-rose-100 text-rose-700",
                border: "border-rose-200"
              },
              { 
                icon: Coffee, 
                title: "Netværk & Sparring", 
                desc: "Mød andre dedikerede studerende fra hele landet til månedlige online kaffemøder i maskinrummet.",
                color: "bg-indigo-100 text-indigo-700",
                border: "border-indigo-200"
              }
            ].map((perk, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="h-full bg-white border border-slate-100 p-10 rounded-[40px] shadow-sm hover:shadow-xl hover:border-slate-200 transition-all group active:scale-[0.98]">
                  <div className={`w-16 h-16 ${perk.color} rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:rotate-6 transition-transform`}>
                    <perk.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{perk.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{perk.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. THE ROLE - Dark Section integration */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[3rem] sm:rounded-[5rem] overflow-hidden relative shadow-2xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -z-0"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -z-0"></div>
            
            <div className="relative z-10 px-8 py-16 sm:p-20 lg:p-32 flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8">
                <Reveal>
                  <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-none mb-6">
                    Hvad gør en <br className="hidden sm:block"/> <span className="text-amber-400">Ambassadør?</span>
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed font-medium">
                    Rollen er uformel og fleksibel. Det handler om at dele din begejstring og give os din ærlige feedback.
                  </p>
                </Reveal>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    "Del viden med studiekammerater",
                    "Feedback på nye funktioner",
                    "Månedlige korte tjek-ind",
                    "Hjælp os med at ramme plet"
                  ].map((task, i) => (
                    <Reveal key={i} delay={i * 0.1}>
                      <div className="flex items-center gap-4 text-white font-bold text-sm">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-amber-400 border border-white/5">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        {task}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>

              <Reveal delay={0.3} className="w-full lg:w-5/12">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] text-center space-y-8 relative overflow-hidden group">
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 blur-2xl rounded-full transition-transform group-hover:scale-150 duration-700"></div>
                   
                   <Quote className="w-12 h-12 text-white/10 mx-auto" />
                   <p className="text-white text-lg font-medium italic leading-relaxed relative z-10">
                    "Det giver en enorm tilfredsstillelse at være med til at skabe noget, som rent faktisk løser de problemer, vi sidder med i dagligdagen."
                   </p>
                   <div className="pt-4 border-t border-white/10">
                      <p className="text-white font-bold">Sara Nielsen</p>
                      <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest mt-1">Ambassadør, 4. Semester</p>
                   </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COUNTRY WIDE SECTION */}
      <section className="py-24 sm:py-40 px-6 bg-white relative">
        <div className="max-w-7xl mx-auto text-center space-y-16">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
              Vi søger på tværs af <span className="text-amber-600">hele landet.</span>
            </h2>
            <p className="text-slate-500 font-medium">Uanset hvor du læser, har vi brug for din stemme.</p>
          </Reveal>

          <div className="flex flex-wrap justify-center gap-4">
            {["KP", "VIA UC", "UCL", "UC SYD", "Absalon", "UCN", "AAU", "Andet"].map((uni, i) => (
              <Reveal key={uni} delay={i * 0.05}>
                <div className="px-8 py-5 bg-[#FDFBF7] border border-amber-100 rounded-2xl text-[13px] font-black text-amber-900 uppercase tracking-widest hover:border-amber-950 hover:bg-white hover:scale-105 transition-all shadow-sm cursor-default">
                  {uni}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        {/* Abstract background ink shape */}
        <div className="absolute bottom-0 right-0 w-full h-[50dvh] bg-gradient-to-t from-[#FDFBF7] to-transparent pointer-events-none -z-10"></div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="py-20 px-6 text-center">
         <Reveal>
            <div className="max-w-4xl mx-auto bg-white p-12 sm:p-20 rounded-[4rem] border border-amber-100 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-32 h-32 bg-rose-100/50 blur-3xl rounded-full -translate-x-12 -translate-y-12"></div>
               
               <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-6 relative z-10 serif">Hvad venter du på?</h2>
               <p className="text-slate-500 text-lg sm:text-xl font-medium mb-12 max-w-lg mx-auto relative z-10">
                 Send os en uforpligtende mail, hvis du vil høre mere om dine muligheder som ambassadør.
               </p>
               
               <a href="mailto:kontakt@cohero.dk?subject=Mere info om Ambassadørrollen" className="inline-block relative z-10 w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-12 py-6 bg-amber-950 text-amber-400 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 group-hover:bg-slate-900">
                    <Mail className="w-5 h-5" /> kontakt@cohero.dk
                  </button>
               </a>
               
               <p className="mt-8 text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">Vi glæder os til at høre fra dig</p>
            </div>
         </Reveal>
      </section>

      <footer className="py-20 text-center opacity-30 px-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cohéro Ambassadør-program © 2026</p>
      </footer>
    </div>
  );
}
