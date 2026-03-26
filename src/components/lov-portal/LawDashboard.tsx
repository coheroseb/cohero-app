
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Library, 
  Scale as ScaleIcon, 
  TrendingUp, 
  ArrowRight,
  Lock,
  Loader2,
  Sparkles,
  Search
} from 'lucide-react';
import { LawConfig } from '@/ai/flows/types';
import { LiveStatusBadge } from './LiveStatusBadge';

interface LawDashboardProps {
  lawsConfigs: LawConfig[];
  isPremium: boolean;
  trainingStats: any;
  onLawClick: (id: string) => void;
  lawsLoading: boolean;
}

export const LawDashboard = ({
  lawsConfigs,
  isPremium,
  trainingStats,
  onLawClick,
  lawsLoading
}: LawDashboardProps) => {

  const categories = [
    { title: "Børn, Unge & Familie", pattern: "bg-rose-50/30 text-rose-950 border-rose-100", icon: "🧸" },
    { title: "Generel Forvaltning", pattern: "bg-blue-50/30 text-blue-950 border-blue-100", icon: "🏛️" },
    { title: "Beskæftigelse", pattern: "bg-emerald-50/30 text-emerald-950 border-emerald-100", icon: "💼" },
    { title: "Social Støtte & Handicap", pattern: "bg-amber-50/30 text-amber-950 border-amber-100", icon: "🤝" },
    { title: "Sundhed & Andet", pattern: "bg-slate-50/30 text-slate-950 border-slate-100", icon: "🏥" }
  ];

  const getCategory = (lawName: string) => {
    const name = lawName.toLowerCase();
    if (name.includes('barn') || name.includes('forældre') || name.includes('skole')) return "Børn, Unge & Familie";
    if (name.includes('forvaltning') || name.includes('offentlighed') || name.includes('retssikkerhed')) return "Generel Forvaltning";
    if (name.includes('aktiv') || name.includes('beskæftigelse')) return "Beskæftigelse";
    if (name.includes('social service') || name.includes('handicap')) return "Social Støtte & Handicap";
    return "Sundhed & Andet";
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 space-y-32">
      {/* Hero Section */}
      <header className="relative py-24 text-center space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-3 px-6 py-2 bg-amber-950/5 rounded-full border border-amber-950/10 text-amber-950 text-[10px] font-black uppercase tracking-[0.3em]"
        >
          <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          Velkommen til fremtidens lovportal
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-9xl font-black text-slate-900 serif tracking-tighter leading-[0.9] -space-y-4"
        >
          Juridisk <span className="italic serif-alt text-amber-900 drop-shadow-sm font-light">Ekspertise</span> <br />
          <span className="text-slate-400">lige ved hånden.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed italic"
        >
          En intuitiv og enkel indgang til dansk lovgivning – designet specifikt til den moderne socialrådgiver.
        </motion.p>

        {/* Floating Quick Stats */}
        <div className="flex flex-wrap justify-center gap-4 mt-20">
           {[
             { label: "Love i systemet", val: lawsConfigs.length, icon: <Library className="w-4 h-4" /> },
             { label: "AI Kapacitet", val: "Aktiv", icon: <Sparkles className="w-4 h-4" /> },
             { label: "Din Mestring", val: `${trainingStats?.avgAccuracy || 0}%`, icon: <TrendingUp className="w-4 h-4" /> }
           ].map((stat, i) => (
             <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="px-8 py-5 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all"
             >
                <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">{stat.icon}</div>
                <div className="text-left">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                   <p className="text-lg font-black text-slate-900 serif">{stat.val}</p>
                </div>
             </motion.div>
           ))}
        </div>
      </header>

      {/* Main Library Grid */}
      {lawsLoading ? (
         <div className="py-20 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="w-12 h-12 text-amber-200 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Indlæser biblioteket...</p>
         </div>
      ) : (
         <div className="space-y-40">
            {categories.map((cat, groupIdx) => {
               const categoryLaws = (lawsConfigs || []).filter(l => getCategory(l.name) === cat.title);
               if (categoryLaws.length === 0) return null;

               return (
                  <section key={cat.title} className="space-y-16">
                     <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
                        <div className="space-y-4">
                           <div className="flex items-center gap-4">
                              <span className="text-4xl">{cat.icon}</span>
                              <h2 className="text-4xl md:text-5xl font-black text-slate-900 serif tracking-tight">{cat.title}</h2>
                           </div>
                           <p className="text-slate-400 font-medium px-12">Relevante love og regelsæt inden for {cat.title.toLowerCase()}.</p>
                        </div>
                        <div className="px-6 py-2 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                           {categoryLaws.length} dokumenter
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
                        {categoryLaws.map((law, idx) => {
                           const isLocked = !isPremium && groupIdx > 0;
                           return (
                              <MinimalLawCard 
                                 key={law.id} 
                                 law={law} 
                                 isLocked={isLocked} 
                                 mastery={trainingStats?.mastery.find((m: any) => m.id === law.id)}
                                 onClick={() => !isLocked && onLawClick(law.id)}
                                 idx={idx}
                              />
                           );
                        })}
                     </div>
                  </section>
               );
            })}
         </div>
      )}

      {/* Footer Call to Action */}
      <footer className="py-32">
         <div className="bg-amber-950 p-12 md:p-24 rounded-[4rem] text-center space-y-12 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden flex flex-wrap gap-12 rotate-12 items-center justify-center text-white/50 text-[10rem] font-black serif italic select-none">
               KURSUS LOV RET HJEMMEL PRAKSIS
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white serif leading-tight max-w-3xl mx-auto relative z-10">
               Klar til at mestre <br /><span className="text-amber-400 italic font-light">din praksis</span>?
            </h2>
            <p className="text-amber-100/60 max-w-xl mx-auto text-lg italic relative z-10">
               Gør som hundredevis af andre socialrådgivere og brug Cohéro som din daglige juridiske sparringspartner.
            </p>
            <div className="relative z-10 pt-8">
               <button className="px-12 py-6 bg-amber-400 text-amber-950 rounded-full font-black uppercase tracking-widest text-xs hover:bg-white transition-all shadow-2xl hover:shadow-white/20 active:scale-95">
                  Bliv Premium Medlem i dag
               </button>
            </div>
         </div>
      </footer>
    </div>
  );
};

const MinimalLawCard = ({ law, isLocked, mastery, onClick, idx }: any) => {
   return (
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true }}
         transition={{ delay: idx * 0.05 }}
         onClick={onClick}
         className={`group relative p-10 md:p-14 bg-white rounded-[3.5rem] border transition-all duration-700 overflow-hidden flex flex-col justify-between min-h-[420px] ${isLocked ? 'opacity-40 grayscale pointer-events-none' : 'border-slate-100 hover:border-amber-950/20 hover:shadow-[0_50px_100px_rgba(0,0,0,0.05)] cursor-pointer'}`}
      >
         <div className="absolute top-0 right-0 p-16 opacity-[0.02] group-hover:opacity-[0.08] group-hover:scale-125 transition-all duration-1000 grayscale">
            <ScaleIcon className="w-56 h-56 -rotate-12" />
         </div>

         <div className="space-y-10 relative z-10">
            <div className="flex items-center justify-between">
               <span className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                  {law.abbreviation}
               </span>
               {!isLocked && <LiveStatusBadge xmlUrl={law.xmlUrl} />}
            </div>

            <div className="space-y-4">
               <h4 className="text-3xl md:text-4xl font-black text-slate-900 serif leading-tight tracking-tight group-hover:text-amber-950 transition-colors">
                  {law.name}
               </h4>
               <p className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-900/30 italic">LBK NR: {law.lbk?.match(/\d+/)?.[0] || 'GÆLDENDE'}</p>
            </div>
         </div>

         <div className="pt-12 mt-12 border-t border-slate-50 relative z-10 flex items-center justify-between">
            {mastery ? (
               <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dine fremskridt</p>
                  <div className="w-32 h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                     <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${mastery.accuracy}%` }}
                        className="h-full bg-amber-400"
                     />
                  </div>
               </div>
            ) : (
               <div className="flex items-center gap-3 text-slate-300 group-hover:text-amber-950 transition-colors">
                  <Library className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isLocked ? 'Premium Låst' : 'Udforsk'}</span>
               </div>
            )}
            
            {!isLocked && (
               <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-amber-950 group-hover:text-white transition-all shadow-sm group-hover:shadow-2xl">
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
               </div>
            )}
         </div>
      </motion.div>
   );
};
