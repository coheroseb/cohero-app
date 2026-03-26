
'use client';

import React from 'react';
import { 
  X, 
  List,
  Target,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { LawContentType } from '@/ai/flows/types';
import { motion } from 'framer-motion';

interface LawContextSidebarProps {
  docData: LawContentType;
  onChapterClick: (idx: number) => void;
  activeParagraphNumber: string | null;
  onClose?: () => void;
}

export const LawContextSidebar = ({
  docData,
  onChapterClick,
  activeParagraphNumber,
  onClose
}: LawContextSidebarProps) => {

  return (
    <aside className="w-96 bg-transparent flex flex-col sticky top-0 h-screen z-30 transition-all duration-1000 hidden lg:flex border-l border-slate-100/50">
      <div className="p-12 space-y-16 py-32 overflow-y-auto custom-scrollbar flex-1">
          {/* Header */}
          <header className="space-y-6">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400 shadow-2xl rotate-3"><List className="w-6 h-6" /></div>
                  <div>
                      <h3 className="text-sm font-black text-slate-950 uppercase tracking-[0.3em] leading-none">Indhold</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-2">Hurtig navigation</p>
                  </div>
              </div>
          </header>

          {/* Chapters Navigation */}
          <nav className="space-y-12">
              {docData.kapitler.map((chapter, idx) => {
                  const isActive = activeParagraphNumber && chapter.paragraffer.some(p => p.nummer === activeParagraphNumber);
                  
                  return (
                      <motion.div 
                        key={idx} 
                        className="space-y-4"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.5 }}
                      >
                          <button 
                              onClick={() => onChapterClick(idx)}
                              className={`w-full text-left group flex items-start gap-6 transition-all duration-700 ${isActive ? 'text-slate-950' : 'text-slate-300 hover:text-slate-950'}`}
                          >
                              <div className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-700 ${isActive ? 'bg-amber-500 scale-150 shadow-[0_0_15px_rgba(251,191,36,0.8)]' : 'bg-slate-100 group-hover:bg-amber-300'}`} />
                              <div className="flex-1 min-w-0">
                                 <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Kapitel {chapter.nummer?.match(/\d+/)?.[0] || (idx + 1)}</p>
                                 <h4 className={`text-base font-black serif tracking-tight leading-tight transition-all duration-700 ${isActive ? 'italic' : 'group-hover:translate-x-1'}`}>{chapter.titel}</h4>
                              </div>
                          </button>

                          {isActive && (
                              <div className="pl-8 space-y-4 pt-4 border-l-2 border-slate-50 ml-0.5">
                                  {chapter.paragraffer.map((p, pIdx) => (
                                      <button 
                                          key={pIdx}
                                          onClick={() => onChapterClick(idx)}
                                          className={`w-full text-left text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 hover:text-amber-950 flex items-center gap-3 ${activeParagraphNumber === p.nummer ? 'text-amber-600' : 'text-slate-300'}`}
                                      >
                                          {activeParagraphNumber === p.nummer && <ChevronRight className="w-3 h-3" />}
                                          {p.nummer}
                                      </button>
                                  ))}
                              </div>
                          )}
                      </motion.div>
                  )
              })}
          </nav>
      </div>

      <div className="p-12 pb-32">
          <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm space-y-6 relative overflow-hidden group/card hover:shadow-2xl transition-all duration-1000">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 grayscale"><BookOpen className="w-24 h-24" /></div>
             <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-950">Studievej</span>
             </div>
             <p className="text-sm font-medium leading-relaxed text-slate-400 italic">Brug indholdsfortegnelsen til at skabe hurtige visuelle sammenhænge i din lov-læsning.</p>
          </div>
      </div>
    </aside>
  );
};
