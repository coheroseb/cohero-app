'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  BookOpen, 
  MessageSquare, 
  ClipboardCheck, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight,
  Target,
  FileText,
  UserCheck,
  Briefcase,
  Building2,
  Users,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLawRecommendations } from '@/lib/law-engine';
import Link from 'next/link';

const PREP_STEPS = [
  {
    id: 'research',
    title: 'Research & Kontekst',
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
    description: 'Forstå institutionens fundament før du starter.',
    tasks: [
      { id: 1, text: 'Læs institutionens vedtægter eller kerneopgave-beskrivelse.' },
      { id: 2, text: 'Undersøg målgruppen (alder, sociale udfordringer, baggrund).' },
      { id: 3, text: 'Find ud af, om stedet er privat, kommunalt eller selvejende.' },
      { id: 4, text: 'Download og gennemlæs det seneste tilsyn fra Socialtilsynet.' }
    ]
  },
  {
    id: 'law',
    title: 'Lovgivning & Jura',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    description: 'Hvilke paragraffer styrer hverdagen på stedet?',
    tasks: [
      { id: 5, text: 'Identificer hovedloven (f.eks. Barnets Lov, Serviceloven eller Lov om Social Service).' },
      { id: 6, text: 'Tjek specifikke paragraffer for støtte (f.eks. § 32, § 43 eller § 85).' },
      { id: 7, text: 'Forstå reglerne om tavshedspligt og oplysningspligt i denne specifikke kontekst.' }
    ]
  },
  {
    id: 'interview',
    title: 'Samtalen / Første møde',
    icon: <MessageSquare className="w-5 h-5 text-amber-500" />,
    description: 'Gode spørgsmål til din vejleder.',
    tasks: [
      { id: 8, text: 'Spørg ind til forventninger til din rolle (observatør vs. aktør).' },
      { id: 9, text: 'Hvad er deres tilgang til dokumentation og journalføring?' },
      { id: 10, text: 'Hvordan ser en typisk uge ud for en studerende her?' },
      { id: 11, text: 'Hvilke faglige metoder anvender de (f.eks. ICS, VUM eller recovery)?' }
    ]
  },
  {
    id: 'practical',
    title: 'Praktisk Tjekliste',
    icon: <ClipboardCheck className="w-5 h-5 text-rose-500" />,
    description: 'Gør hverdagen nemmere fra dag 1.',
    tasks: [
      { id: 12, text: 'Aftal mødetid og lokation for første dag.' },
      { id: 13, text: 'Spørg til påklædning (praktisk vs. formel).' },
      { id: 14, text: 'Find ud af frokostordning / køkkenfaciliteter.' },
      { id: 15, text: 'Sørg for at have styr på transport/rute.' }
    ]
  }
];

export const InternshipPrepTool = ({ selectedInstitution }: { selectedInstitution?: any }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);

  const toggleTask = (taskId: number) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const currentSteps = selectedInstitution ? PREP_STEPS.map(step => {
     if (step.id === 'research' && selectedInstitution.EJER_KODE_TEKST) {
        return {
           ...step,
           tasks: [
              ...step.tasks,
              { id: 101, text: `Undersøg hvad det betyder for din retssikkerhed at være på en ${selectedInstitution.EJER_KODE_TEKST.toLowerCase()} institution.` }
           ]
        };
     }
     if (step.id === 'practical' && selectedInstitution.TLF_NR) {
        return {
           ...step,
           tasks: [
              ...step.tasks,
              { id: 102, text: `Ring evt. direkte til ${selectedInstitution.TLF_NR} hvis du er i tvivl om mødested.` }
           ]
        };
     }
     return step;
  }) : PREP_STEPS;

  const progress = Math.round((completedTasks.length / currentSteps.reduce((acc, step) => acc + step.tasks.length, 0)) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Tool Header */}
      <header className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-[0_32px_64px_-16px_rgba(45,35,15,0.1)] border border-amber-100/50 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
         
         <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full text-rose-600 text-[10px] font-black uppercase tracking-widest">
               <Target className="w-3.5 h-3.5" />
               Praktikforberedelse
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 serif leading-tight">Gør dig klar til <span className="text-rose-600 italic">virkeligheden</span>.</h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
               Brug dette værktøj til at strukturere din forberedelse, så du starter din praktik med ro i maven og fagligheden i top.
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
               <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-emerald-500/20">
                     {progress}%
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Gennemført</span>
               </div>
               <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Forbereder dig til 30 ECTS</span>
               </div>
            </div>
         </div>

         <div className="w-full md:w-5/12 grid grid-cols-2 gap-4 relative z-10">
            {currentSteps.map((step, idx) => (
                <button 
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col gap-4 ${activeStep === idx 
                    ? 'bg-slate-900 border-slate-900 shadow-2xl shadow-slate-900/20 scale-[1.05]' 
                    : 'bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50/10'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeStep === idx ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {step.icon}
                  </div>
                  <h4 className={`text-[11px] font-black uppercase tracking-widest ${activeStep === idx ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                </button>
            ))}
         </div>
      </header>

      {selectedInstitution && (
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6"
         >
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-amber-400 text-amber-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20 shrink-0">
                  <Building2 className="w-8 h-8" />
               </div>
               <div className="space-y-1 text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Du forbereder praktik hos:</p>
                  <h3 className="text-xl font-black text-amber-950 serif">{selectedInstitution.INST_NAVN}</h3>
                  <p className="text-sm text-amber-800/60 font-medium">
                     {selectedInstitution.INST_ADR}, {selectedInstitution.POSTNR} {selectedInstitution.POSTDISTRIKT}
                  </p>
               </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3">
               <div className="px-5 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-amber-200 text-amber-900 font-bold text-xs">
                  {selectedInstitution.EJER_KODE_TEKST}
               </div>
               {selectedInstitution.INST_LEDER && (
                  <div className="px-5 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-2">
                     <Users className="w-4 h-4 opacity-40" />
                     {selectedInstitution.INST_LEDER}
                  </div>
               )}
            </div>
         </motion.div>
      )}

      {/* Active Step Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
         <div className="md:col-span-4 space-y-4">
            {currentSteps.map((step, idx) => (
               <button 
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full p-6 bg-white rounded-3xl border text-left transition-all ${activeStep === idx 
                    ? 'border-amber-500 shadow-xl' 
                    : 'border-slate-100 opacity-60 hover:opacity-100'}`}
               >
                  <div className="flex items-center gap-4">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${activeStep === idx ? 'bg-amber-100 text-amber-950' : 'bg-slate-50 text-slate-400'}`}>
                        {step.icon}
                     </div>
                     <div className="flex-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${activeStep === idx ? 'text-amber-600' : 'text-slate-400'}`}>Trin {idx + 1}</p>
                        <h5 className="text-sm font-bold text-slate-900">{step.title}</h5>
                     </div>
                     {step.tasks.every(t => completedTasks.includes(t.id)) && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                     )}
                  </div>
               </button>
            ))}
         </div>

         <div className="md:col-span-8 bg-white rounded-[3rem] border border-amber-100/50 shadow-xl p-8 sm:p-12 min-h-[500px] flex flex-col">
            <AnimatePresence mode="wait">
               <motion.div 
                  key={activeStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8 flex-grow"
               >
                  <div className="space-y-2">
                     <h3 className="text-2xl sm:text-3xl font-black text-slate-900 serif leading-none">{currentSteps[activeStep].title}</h3>
                     <p className="text-slate-500 font-medium">{currentSteps[activeStep].description}</p>
                  </div>

                  <div className="space-y-4 pt-6">
                     {currentSteps[activeStep].tasks.map((task) => (
                        <label 
                           key={task.id}
                           className={`flex items-center gap-5 p-5 sm:p-6 rounded-2xl border transition-all cursor-pointer group ${completedTasks.includes(task.id) 
                             ? 'bg-emerald-50/50 border-emerald-100' 
                             : 'bg-slate-50/30 border-slate-100 hover:bg-white hover:border-amber-200'}`}
                        >
                           <div className="relative">
                              <input 
                                 type="checkbox" 
                                 checked={completedTasks.includes(task.id)}
                                 onChange={() => toggleTask(task.id)}
                                 className="peer w-6 h-6 rounded-lg border-slate-200 text-amber-950 focus:ring-amber-500 transition-all cursor-pointer"
                              />
                              <div className="absolute inset-0 m-auto w-4 h-4 bg-emerald-500 rounded-md scale-0 peer-checked:scale-100 transition-transform pointer-events-none flex items-center justify-center">
                                 <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                           </div>
                           <span className={`text-[15px] font-bold leading-tight ${completedTasks.includes(task.id) ? 'text-emerald-950' : 'text-slate-700'}`}>
                              {task.text}
                           </span>
                        </label>
                     ))}
                  </div>

                  {currentSteps[activeStep].id === 'law' && (
                     <LawSuggestions instName={selectedInstitution?.INST_NAVN} instType={selectedInstitution?.inst_type_2_tekst} />
                  )}
               </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between pt-12 mt-auto border-t border-slate-100">
               <button 
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all disabled:opacity-0"
               >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Forrige Trin
               </button>
               
               <button 
                  onClick={() => {
                     if (activeStep < currentSteps.length - 1) {
                        setActiveStep(prev => prev + 1);
                     }
                  }}
                  className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all
                    ${activeStep === currentSteps.length - 1 ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' : 'bg-slate-900 text-white shadow-xl shadow-slate-950/20 hover:bg-rose-900'}`}
               >
                  {activeStep === currentSteps.length - 1 ? (
                    <>Færdig <CheckCircle2 className="w-4 h-4" /></>
                  ) : (
                    <>Næste Trin <ArrowRight className="w-4 h-4" /></>
                  )}
               </button>
            </div>
         </div>
      </div>

      {/* Study Board Advice */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden group">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.15)_0%,transparent_50%)] pointer-events-none"></div>
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10">
                  <UserCheck className="w-8 h-8 text-amber-400" />
               </div>
               <h3 className="text-3xl font-black serif leading-tight">Brug institutions-registret aktivt i dit valg</h3>
               <p className="text-slate-400 font-medium leading-relaxed">
                  Brug søgemaskinen her på siden til at finde tidligere tilsyn, lederens kontaktoplysninger og stedets geografiske placering. Det er en del af den gode forberedelse.
               </p>
            </div>
            <div className="flex flex-col gap-4">
               {[
                  { label: "Find de rigtige love", path: "/lov-portal", icon: <ShieldCheck className="w-4 h-4" /> },
                  { label: "Undersøg faglige metoder", path: "/concept-explainer", icon: <FileText className="w-4 h-4" /> }
               ].map((link, i) => (
                  <button 
                     key={i}
                     onClick={() => window.location.href = link.path}
                     className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-300">
                           {link.icon}
                        </div>
                        <span className="font-bold text-sm tracking-wide">{link.label}</span>
                     </div>
                     <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </button>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

const LawSuggestions = ({ instName, instType }: { instName?: string, instType?: string }) => {
   const recommendedLaws = useLawRecommendations(instName, instType);
   
   return (
      <div className="mt-12 space-y-6">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
               <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 tracking-wider">Målrettede Love fra Lovportalen</h4>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendedLaws.length > 0 ? (
               recommendedLaws.map((law) => (
                  <Link 
                     key={law.id}
                     href={`/lov-portal/view/${law.id}`}
                     className="p-6 rounded-[2rem] border border-amber-200 bg-amber-50/30 hover:bg-white hover:border-amber-950 transition-all group shadow-sm hover:shadow-xl"
                  >
                     <div className="flex items-start justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">{law.abbreviation}</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                     </div>
                     <p className="text-sm font-black text-slate-900 leading-tight mb-2 group-hover:text-amber-950 serif italic">{law.name}</p>
                     <p className="text-[10px] text-slate-500 leading-relaxed mb-4 line-clamp-2">{law.description}</p>
                     <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-amber-950 transition-colors">
                        Studér denne lov <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                     </div>
                  </Link>
               ))
            ) : (
               <div className="col-span-2 p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Søg efter en institution for at få konkrete anbefalinger</p>
               </div>
            )}
         </div>
      </div>
   );
};
