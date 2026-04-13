'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Brain, 
  Target, 
  Scale, 
  Zap, 
  Check, 
  Bookmark,
  ChevronDown
} from 'lucide-react';
import { triggerHapticFeedback } from '@/lib/haptics';
import { ImpactStyle } from '@capacitor/haptics';

const NativeConceptExplainer: React.FC<{ 
  searchQuery: string, 
  setSearchQuery: (v: string) => void,
  handleExplain: (v: string) => void,
  isLoading: boolean,
  explanation: any,
  isSaved: boolean,
  handleToggleSave: () => void
}> = ({ 
  searchQuery, 
  setSearchQuery, 
  handleExplain, 
  isLoading, 
  explanation,
  isSaved,
  handleToggleSave
}) => {

  const [activeTab, setActiveTab] = useState<'def' | 'prac' | 'law'>('def');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(ImpactStyle.Medium);
    handleExplain(searchQuery);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Search Input Bar */}
      <div className="px-5 py-6 sticky top-0 bg-slate-50/80 backdrop-blur-xl z-20">
        <form onSubmit={handleSearch} className="relative group">
          <input 
            type="text"
            placeholder="Søg i teorier og begreber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-3xl text-[16px] font-bold shadow-xl focus:outline-none focus:border-indigo-500 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {!explanation ? (
        <div className="px-5 pt-10 text-center space-y-8">
           <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl border border-slate-100">
             <Brain className="w-12 h-12 text-indigo-600" />
           </div>
           <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Hvad vil du lære?</h2>
             <p className="text-slate-500 font-medium px-4">Indtast et socialfagligt begreb eller en teori for at få en lynforklaring.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-3 pt-4">
             {['Mentalisering', 'Systemisk Teori', 'Retssikkerhed', 'Magtanvendelse'].map(t => (
               <button 
                key={t}
                onClick={() => { setSearchQuery(t); handleExplain(t); }}
                className="p-4 bg-white border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 active:bg-slate-50 shadow-sm"
               >
                 {t}
               </button>
             ))}
           </div>
        </div>
      ) : (
        <div className="px-5 space-y-6 pt-4">
           {/* Header / Save Row */}
           <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{searchQuery}</h1>
                <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mt-1">Analyse færdig ✨</p>
              </div>
              <button 
                onClick={() => { triggerHapticFeedback(ImpactStyle.Light); handleToggleSave(); }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isSaved ? 'bg-amber-100 text-amber-600' : 'bg-white border border-slate-200 text-slate-300'}`}
              >
                <Bookmark className="w-6 h-6" fill={isSaved ? "currentColor" : "none"} />
              </button>
           </div>

           {/* Tabs */}
           <div className="flex bg-slate-200/50 p-1 rounded-2xl">
              {[
                { id: 'def', label: 'Definition', icon: Brain },
                { id: 'prac', label: 'Praksis', icon: Target },
                { id: 'law', label: 'Jura', icon: Scale }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => { triggerHapticFeedback(ImpactStyle.Light); setActiveTab(t.id as any); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
           </div>

           {/* Content Sections */}
           <div className="space-y-4">
              {activeTab === 'def' && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                  <div className="prose-sm text-[16px] leading-[1.7] font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: explanation.definition }} />
                  {explanation.etymology && (
                    <div className="pt-6 border-t border-slate-50 italic text-[14px] text-slate-500" dangerouslySetInnerHTML={{ __html: explanation.etymology }} />
                  )}
                </div>
              )}

              {activeTab === 'prac' && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                   <div className="prose-sm text-[16px] leading-[1.7] font-medium text-slate-700" dangerouslySetInnerHTML={{ __html: explanation.relevance }} />
                   {explanation.practicalExample && (
                     <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 italic text-[14px] text-indigo-900/60" dangerouslySetInnerHTML={{ __html: explanation.practicalExample }} />
                   )}
                </div>
              )}

              {activeTab === 'law' && (
                <div className="space-y-4">
                   {explanation.legalContext ? (
                     <>
                        <div className="bg-slate-900 p-8 rounded-[3rem] text-white space-y-6 shadow-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-400 text-amber-950 rounded-xl flex items-center justify-center">
                              <Scale className="w-5 h-5" />
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Paragraf {explanation.legalContext.paragraphNumber}</p>
                               <h3 className="text-xl font-black tracking-tight">{explanation.legalContext.lawTitle}</h3>
                            </div>
                          </div>
                          <p className="text-[17px] font-medium leading-relaxed italic text-slate-300" dangerouslySetInnerHTML={{ __html: `"${explanation.legalContext.exactText}"` }} />
                        </div>
                        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                           <p className="text-[15px] font-medium text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: explanation.legalContext.relevance }} />
                        </div>
                     </>
                   ) : (
                     <div className="p-10 text-center bg-white rounded-[2.5rem] border border-slate-100 space-y-4">
                        <Scale className="w-10 h-10 text-slate-100 mx-auto" />
                        <p className="text-sm font-bold text-slate-400">Ingen direkte juridisk kobling fundet for dette begreb.</p>
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default NativeConceptExplainer;
