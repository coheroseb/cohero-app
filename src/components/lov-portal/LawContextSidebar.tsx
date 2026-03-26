
'use client';

import React from 'react';
import { 
  Menu, 
  X, 
  BookOpen, 
  ChevronRight, 
  Search, 
  List,
  Target,
  FileText
} from 'lucide-react';
import { LawContentType } from '@/ai/flows/types';

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
    <aside className="w-80 bg-white/40 backdrop-blur-3xl border-l border-amber-100 flex flex-col sticky top-0 h-screen z-30 transition-all duration-700 hidden xl:flex">
      <div className="p-10 flex items-center justify-between border-b border-amber-50/50">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-950 shadow-sm border border-amber-100/50"><List className="w-5 h-5" /></div>
              <div>
                  <h3 className="text-sm font-black text-amber-950 uppercase tracking-widest leading-none">Indhold</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-900/30 mt-1">Hurtig-navigation</p>
              </div>
          </div>
          {onClose && (
             <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-xl transition-all">
                <X className="w-4 h-4 text-slate-400" />
             </button>
          )}
      </div>

      <nav className="flex-1 px-8 py-10 space-y-8 overflow-y-auto custom-scrollbar">
          {docData.kapitler.map((chapter, idx) => {
              const isActive = activeParagraphNumber && chapter.paragraffer.some(p => p.nummer === activeParagraphNumber);
              
              return (
                  <div key={idx} className="space-y-4">
                      <button 
                          onClick={() => onChapterClick(idx)}
                          className={`w-full text-left group flex items-start gap-4 transition-all ${isActive ? 'text-amber-950' : 'text-slate-400 hover:text-amber-950'}`}
                      >
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 transition-all ${isActive ? 'bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-200 group-hover:bg-amber-300'}`} />
                          <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Kapitel {chapter.nummer || (idx + 1)}</p>
                             <h4 className={`text-xs font-bold serif leading-tight truncate ${isActive ? 'font-black' : ''}`}>{chapter.titel}</h4>
                          </div>
                      </button>

                      {isActive && (
                          <div className="pl-6 space-y-3 pt-2 border-l border-amber-100/50 ml-1">
                              {chapter.paragraffer.map((p, pIdx) => (
                                  <button 
                                      key={pIdx}
                                      onClick={() => onChapterClick(idx)} // Should ideally scroll to specific para
                                      className={`w-full text-left text-[11px] font-bold transition-all truncate hover:text-amber-950 ${activeParagraphNumber === p.nummer ? 'text-amber-600' : 'text-slate-400'}`}
                                  >
                                      {p.nummer}
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              )
          })}
      </nav>

      <div className="p-8 border-t border-amber-50/50">
          <div className="p-6 bg-amber-950 rounded-[2.5rem] text-white shadow-2xl shadow-amber-950/20 space-y-4">
             <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Studie-fokus</span>
             </div>
             <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">Sæt bogmærker undervejs for at bygge din egen samling af referencer.</p>
          </div>
      </div>
    </aside>
  );
};
