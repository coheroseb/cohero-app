'use client';

import React from 'react';
import { 
  Building, 
  Users, 
  Mail, 
  ArrowUpRight, 
  Zap, 
  ShieldCheck, 
  Target, 
  ArrowRight,
  Sparkles,
  BarChart4,
  Library,
  ChevronRight,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: any, title: string, description: string, delay?: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    className="group p-8 bg-white/60 backdrop-blur-xl border border-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-1 transition-all duration-500"
  >
    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-inner">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="text-xl font-black text-amber-950 mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-500 font-medium leading-relaxed text-sm">
      {description}
    </p>
  </motion.div>
);

export default function SamarbejdePage() {
  return (
    <div className="bg-[#FBFAF7] min-h-screen selection:bg-amber-200 overflow-x-hidden">
      
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-amber-200/20 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-slate-200/30 rounded-full blur-[100px] opacity-40"></div>
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100 mb-10 shadow-sm"
          >
            <Globe className="w-4 h-4" /> Organisations-løsninger
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-8xl font-black text-slate-800 tracking-tighter leading-[0.95] mb-8 serif italic"
          >
            Fremtidens <span className="text-amber-600">socialrådgivere</span> <br className="hidden md:block" /> starter her.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed mb-12"
          >
            Vi tilbyder skræddersyede partnerskaber til professionshøjskoler, kommuner og praktiksteder, der ønsker at løfte de studerendes faglige dannelse og praksis-parathed.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <a href="mailto:kontakt@cohero.dk" className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3">
              Få et skræddersyet tilbud <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link href="/portal" className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all shadow-sm">
              Se platformen
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CORE VALUE ROWS */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mb-3 text-center">Hvorfor vælge Cohéro?</h2>
            <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight serif">Styrk broen mellem teori og praksis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Realistisk Træning" 
              description="Studerende træner i komplekse, virkelighedsnære cases baseret på gældende dansk lovgivning – uden risiko for klientfejl."
              delay={0.1}
            />
            <FeatureCard 
              icon={BarChart4} 
              title="Dokumentationskvalitet" 
              description="Vores AI-motor giver øjeblikkelig taksonomisk feedback på journalnotater, hvilket sikrer en højere faglig standard."
              delay={0.2}
            />
            <FeatureCard 
              icon={Library} 
              title="Lov-forståelse" 
              description="Pædagogiske forklaringer af de tungeste paragraffer gør sociallovgivningen tilgængelig og anvendelig i hverdagen."
              delay={0.3}
            />
            <FeatureCard 
              icon={ShieldCheck} 
              title="Eksamens-sikker" 
              description="Eksamens-Arkitekten hjælper de studerende med at strukturere deres opgaver, så de kan fokusere på den faglige substans."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* THE PARTNERSHIP MODEL */}
      <section className="py-32 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-amber-500 rounded-full blur-[180px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
            <div className="lg:col-span-6 space-y-10">
               <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400 border border-white/10">
                  <Target className="w-4 h-4" /> Partner-modellen
               </div>
               <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter serif leading-[1.1]">
                 Enkel integration. <br /> Maksimalt udbytte.
               </h2>
               <p className="text-xl text-white/60 font-medium leading-relaxed max-w-xl">
                 Vi fjerner alt det tunge administration. Ved at indgå en partneraftale kan I via e-maildomæner (f.eks. @via.dk eller @kp.dk) give hele årgange eller personalegrupper adgang med ét klik.
               </p>
               
               <ul className="space-y-6">
                 {[
                   "Løbende opdateret indhold baseret på nyeste lovgivning",
                   "Mængderabat baseret på antal licenser",
                   "Support til implementering i undervisning/praksis",
                   "Mulighed for skræddersyede cases til jeres specifikke fokus"
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-4 text-white/80 font-bold">
                     <div className="w-6 h-6 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                       <CheckCircle2 className="w-4 h-4" />
                     </div>
                     {item}
                   </li>
                 ))}
               </ul>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-white/5 backdrop-blur-3xl p-10 md:p-16 rounded-[4rem] border border-white/10 shadow-2xl relative">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl"></div>
                  
                  <div className="space-y-8">
                     <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center shadow-inner">
                        <Mail className="w-10 h-10" />
                     </div>
                     <h3 className="text-3xl font-black text-white serif">Klar til en uforpligtende dialog?</h3>
                     <p className="text-white/40 font-medium">Vi sammensætter en pakke, der passer til jeres behov og budget.</p>
                     
                     <div className="pt-8 border-t border-white/5">
                        <a href="mailto:kontakt@cohero.dk" className="group flex items-center justify-between p-8 bg-white text-slate-900 rounded-[2.5rem] hover:bg-amber-400 transition-all duration-500">
                           <span className="text-lg font-black uppercase tracking-widest">Send forespørgsel</span>
                           <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <ArrowRight className="w-6 h-6" />
                           </div>
                        </a>
                     </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER SPOTLIGHT */}
      <footer className="py-20 px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-auto"></div>
            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Invester i fagligheden</p>
            <div className="flex items-center justify-center gap-10 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                <div className="text-2xl font-black text-slate-900 serif italic">Cohéro <span className="text-amber-600">Org.</span></div>
            </div>
          </div>
      </footer>

    </div>
  );
}

const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
