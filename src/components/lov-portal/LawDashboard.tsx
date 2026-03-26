
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Library, 
  Scale as ScaleIcon, 
  Gavel, 
  TrendingUp, 
  Bookmark,
  ArrowRight,
  ChevronRight,
  Lock,
  Loader2,
  FileText,
  List
} from 'lucide-react';
import { LawConfig, LawContentType } from '@/ai/flows/types';
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

  const groupedLaws = {
    "Børn, Unge & Familie": (lawsConfigs || []).filter(l => [
      'barnets-lov', 'foraeldreansvarsloven', 'folkeskoleloven'
    ].includes(l.id)),
    "Generel Forvaltning": (lawsConfigs || []).filter(l => [
      'forvaltningsloven', 'offentlighedsloven', 'retssikkerhedsloven'
    ].includes(l.id)),
    "Beskæftigelse": (lawsConfigs || []).filter(l => [
      'lab-loven', 'aktivloven'
    ].includes(l.id)),
    "Social Støtte & Handicap": (lawsConfigs || []).filter(l => [
      'serviceloven'
    ].includes(l.id)),
    "Sundhed & Andet": (lawsConfigs || []).filter(l => [
      'sundhedsloven'
    ].includes(l.id))
  };

  return (
    <div className="space-y-24 pb-32">
      <header className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-amber-950 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-xl shadow-amber-900/40 animate-ink">
                    <Library className="w-3.5 h-3.5" /> JURIDISK VIDENSCENTER
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-amber-950 serif tracking-tighter leading-none">
                    Dit digitale <span className="text-amber-800 italic">Lov-bibliotek</span>.
                </h1>
                <p className="text-slate-500 font-medium italic text-xl max-w-2xl leading-relaxed">
                    Søg lynhurtigt i lovgivning, find relevant retspraksis og få AI-støtte til din sagsbehandling.
                </p>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4 shrink-0">
               <div className="p-6 bg-white rounded-[2rem] border border-amber-100 flex items-center gap-4 shadow-sm hover:shadow-xl transition-all">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-950 shadow-sm"><ScaleIcon className="w-6 h-6" /></div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Alle Love</p>
                     <p className="text-2xl font-black text-amber-950 serif">{lawsConfigs.length}</p>
                  </div>
               </div>
               <div className="p-6 bg-amber-950 rounded-[2rem] text-white flex items-center gap-4 shadow-2xl shadow-amber-950/20">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-amber-50/40">Din Mestring</p>
                     <p className="text-2xl font-black text-amber-50 serif">{trainingStats?.avgAccuracy || 0}%</p>
                  </div>
               </div>
            </div>
        </div>
      </header>

      {lawsLoading ? (
         <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-200"><Loader2 className="w-10 h-10 animate-spin" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Synkroniserer bibliotek...</p>
         </div>
      ) : (
         <div className="space-y-24">
            {Object.entries(groupedLaws).map(([category, laws], groupIdx) => laws.length > 0 && (
               <section key={category} className="space-y-12">
                  <div className="flex items-center gap-6">
                     <div className="h-px flex-1 bg-amber-100/50"></div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-900/40 whitespace-nowrap">{category}</h3>
                     <div className="h-px flex-1 bg-amber-100/50"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     {laws.map((law, idx) => {
                        const isLocked = !isPremium && idx > 0 && groupIdx > 0;
                        return (
                           <LawCard 
                              key={law.id} 
                              law={law} 
                              isLocked={isLocked} 
                              trainingStats={trainingStats}
                              onLawClick={onLawClick}
                              idx={idx}
                           />
                        );
                     })}
                  </div>
               </section>
            ))}
         </div>
      )}
    </div>
  );
};

const LawCard = ({ law, isLocked, trainingStats, onLawClick, idx }: any) => {
   const mastery = trainingStats?.mastery.find((m: any) => m.id === law.id);
   
   return (
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: idx * 0.05 }}
         onClick={() => !isLocked && onLawClick(law.id)}
         className={`group bg-white p-8 md:p-12 rounded-[3.5rem] border transition-all relative overflow-hidden flex flex-col justify-between min-h-[360px] cursor-pointer ${isLocked ? 'opacity-40 grayscale cursor-not-allowed' : 'border-amber-100/50 hover:border-amber-950/20 shadow-sm hover:shadow-2xl active:scale-[0.98]'}`}
      >
         <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 group-hover:opacity-10">
               <ScaleIcon className="w-48 h-48 rotate-12" />
         </div>
         
         <div className="relative z-10">
               <div className="flex justify-between items-start mb-10">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-950 border-amber-200 group-hover:bg-amber-950 group-hover:text-amber-400 group-hover:border-amber-950'}`}>
                     {law.abbreviation}
                  </span>
                  {isLocked ? (
                     <div className="bg-amber-950 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-xl shrink-0"><Lock className="w-3.5 h-3.5 text-amber-400" /><span className="text-[10px] font-black uppercase tracking-widest">Premium</span></div>
                  ) : (
                     <LiveStatusBadge xmlUrl={law.xmlUrl} />
                  )}
               </div>
               <h4 className="text-3xl font-black text-amber-950 serif leading-tight mb-8 group-hover:text-amber-800 transition-colors line-clamp-2">
                  {law.name}
               </h4>
               
               <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{law.lbk}</p>
         </div>

         <div className="relative z-10 pt-8 mt-10 border-t border-amber-50/50 flex items-center justify-between">
               <div>
                  {mastery ? (
                     <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-amber-50 rounded-full overflow-hidden border border-amber-100/50">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${mastery.accuracy}%` }}
                              className="h-full bg-amber-400 rounded-full"
                           ></motion.div>
                        </div>
                        <span className="text-[11px] font-black text-amber-950">{mastery.accuracy}%</span>
                     </div>
                  ) : (
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 group-hover:text-amber-950 transition-colors flex items-center gap-2">
                        {isLocked ? 'Låst' : 'Se Indhold'}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                     </span>
                  )}
               </div>
               {!isLocked && (
                  <div className="w-12 h-12 rounded-[1.5rem] bg-amber-50 flex items-center justify-center group-hover:bg-amber-950 group-hover:text-white transition-all shadow-sm group-hover:shadow-xl group-hover:shadow-amber-950/20">
                        <ArrowRight className="w-6 h-6" />
                  </div>
               )}
         </div>
      </motion.div>
   );
};
