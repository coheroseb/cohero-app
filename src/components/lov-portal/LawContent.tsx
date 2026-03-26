
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, 
  BookmarkCheck, 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Brain, 
  ArrowRight,
  Info,
  Scale
} from 'lucide-react';
import { LawContentType, ParagraphAnalysisData } from '@/ai/flows/types';

interface LawContentProps {
  docData: LawContentType;
  lawId: string;
  expandedParaKey: string | null;
  setExpandedParaKey: (key: string | null) => void;
  activeParagraphNumber: string | null;
  setActiveParagraphNumber: (num: string | null) => void;
  isAnalysingPara: Record<string, boolean>;
  paraAnalysis: Record<string, ParagraphAnalysisData>;
  onAnalyze: (para: any, key: string) => void;
  onToggleSave: (para: any) => void;
  isSaved: (id: string) => boolean;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
  isPremium: boolean;
  onSubElementClick: (sub: string, parentStk: string | null, parentNr: string | null) => void;
  selectedSubElement: string | null;
  onMouseUp: (paraKey: string) => void;
}

export const LawContent = ({
  docData,
  lawId,
  expandedParaKey,
  setExpandedParaKey,
  activeParagraphNumber,
  setActiveParagraphNumber,
  isAnalysingPara,
  paraAnalysis,
  onAnalyze,
  onToggleSave,
  isSaved,
  onCopy,
  copiedId,
  isPremium,
  onSubElementClick,
  selectedSubElement,
  onMouseUp
}: LawContentProps) => {

  return (
    <div className="space-y-16 pb-32" id="law-content-section">
      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
            <span className="px-4 py-1.5 bg-amber-950 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                {docData.forkortelse || 'LOV'}
            </span>
            <span className="px-4 py-1.5 bg-amber-50 text-amber-900/40 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border border-amber-100">
                {docData.number || 'LBK'}
            </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-amber-950 serif leading-[1.1] tracking-tight">
            {docData.titel}
        </h1>
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <span className="flex items-center gap-2 italic">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 
                Gældende lov
            </span>
            {docData.date && (
               <span className="flex items-center gap-2">
                  Sidst opdateret: {docData.date}
               </span>
            )}
        </div>
      </header>

      <div className="space-y-24">
        {docData.kapitler.map((chapter, cIdx) => (
          <section 
            key={cIdx} 
            id={`chapter-${cIdx}`} 
            className="space-y-10 scroll-mt-32"
          >
            <div className="flex items-end gap-6 border-b border-amber-100 pb-8">
                <div className="w-16 h-16 bg-amber-50 rounded-[1.5rem] flex items-center justify-center text-amber-950 font-black serif text-xl shadow-inner border border-amber-100/50">
                    {chapter.nummer || (cIdx + 1)}
                </div>
                <div>
                   <h2 className="text-2xl md:text-3xl font-black text-amber-950 serif italic tracking-tight">{chapter.titel}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-900/30 mt-2">Kapitel {chapter.nummer || (cIdx + 1)}</p>
                </div>
            </div>

            <div className="grid gap-12">
              {chapter.paragraffer.map((para, pIdx) => {
                const paraKey = `${lawId}-${cIdx}-${pIdx}`;
                const isExpanded = expandedParaKey === paraKey;
                const isActiveInNav = activeParagraphNumber === para.nummer;
                const savedId = `${lawId}-${para.nummer.replace(/[§\s\.]/g, '-')}`;
                const hasAnalysis = !!paraAnalysis[paraKey];
                const analyzing = isAnalysingPara[paraKey];

                return (
                  <motion.div 
                    key={paraKey}
                    id={`para-${paraKey}`}
                    initial={false}
                    animate={{ 
                        backgroundColor: isActiveInNav ? "rgba(251, 191, 36, 0.03)" : "transparent",
                    }}
                    className={`group relative rounded-[2.5rem] transition-all duration-500 p-8 md:p-12 hover:bg-white hover:shadow-2xl hover:shadow-amber-900/5 border-2 ${isActiveInNav ? 'border-amber-400 bg-amber-50/20' : 'border-transparent hover:border-amber-100'}`}
                  >
                    {/* Paragraph Meta */}
                    <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
                       <div className="flex items-center gap-4">
                          <div className={`px-5 py-2 rounded-2xl font-black text-sm serif transition-all ${isActiveInNav ? 'bg-amber-950 text-amber-400 scale-110 shadow-xl' : 'bg-amber-50 text-amber-950 group-hover:bg-amber-100'}`}>
                             {para.nummer}
                          </div>
                          {isActiveInNav && (
                             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600 animate-pulse">Aktiv Markering</span>
                          )}
                       </div>

                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => onCopy(para.tekst, paraKey)}
                            className="p-3 bg-white border border-slate-100 rounded-xl hover:border-amber-950 transition-all text-slate-400 hover:text-amber-950 active:scale-95"
                          >
                             {copiedId === paraKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => onToggleSave(para)}
                            className={`p-3 border rounded-xl transition-all active:scale-95 ${isSaved(savedId) ? 'bg-amber-950 text-amber-400 border-amber-950' : 'bg-white text-slate-400 border-slate-100 hover:border-amber-950 hover:text-amber-950'}`}
                          >
                             {isSaved(savedId) ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                          </button>
                       </div>
                    </div>

                    {/* Paragraph Content */}
                    <div 
                        onMouseUp={() => onMouseUp(paraKey)}
                        className={`prose-lg md:prose-xl font-serif leading-relaxed text-amber-950/80 selection:bg-amber-200 transition-colors ${isActiveInNav ? 'opacity-100 text-amber-950' : ''}`}
                    >
                       <InteractiveParagraphBody 
                          text={para.tekst} 
                          highlight="" 
                          onSubElementClick={onSubElementClick} 
                          selectedSubElement={selectedSubElement}
                       />
                    </div>

                    {/* Action Area */}
                    <div className="mt-12 flex flex-wrap items-center gap-4">
                       <button 
                          onClick={() => {
                            if (isExpanded) setExpandedParaKey(null);
                            else {
                                setExpandedParaKey(paraKey);
                                setActiveParagraphNumber(para.nummer);
                            }
                          }}
                          className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-amber-950 text-white' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-950'}`}
                       >
                          {isExpanded ? 'Luk værktøjskasse' : 'Åbn værktøjskasse'}
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                       </button>

                       {!hasAnalysis && isPremium && (
                          <button 
                             onClick={() => onAnalyze(para, paraKey)}
                             disabled={analyzing}
                             className="flex items-center gap-3 px-6 py-3.5 bg-amber-400/10 text-amber-900 border border-amber-200/50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 hover:text-amber-950 transition-all font-bold hover:shadow-lg hover:shadow-amber-400/20"
                          >
                             {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                             Hurtig Analyse
                          </button>
                       )}
                    </div>

                    {/* Expanded Tools Sidepanel */}
                    <AnimatePresence>
                       {isExpanded && (
                          <motion.div 
                             initial={{ opacity: 0, height: 0, marginTop: 0 }}
                             animate={{ opacity: 1, height: 'auto', marginTop: 32 }}
                             exit={{ opacity: 0, height: 0, marginTop: 0 }}
                             className="overflow-hidden bg-slate-50/50 rounded-[2.5rem] p-8 md:p-12 border border-slate-100"
                          >
                             {hasAnalysis ? (
                                <ParagraphAnalysisView analysis={paraAnalysis[paraKey]} />
                             ) : analyzing ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                                   <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-xl border border-amber-100">
                                      <Loader2 className="w-8 h-8 animate-spin" />
                                   </div>
                                   <div>
                                      <p className="font-black text-amber-950 serif italic text-xl">AI'en læser mellem linjerne...</p>
                                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Dette tager ca. 5-10 sekunder</p>
                                   </div>
                                </div>
                             ) : (
                                <div className="grid md:grid-cols-2 gap-8">
                                   <div className="p-8 bg-white rounded-[2rem] border border-slate-100 space-y-4">
                                      <h4 className="flex items-center gap-3 text-sm font-black text-amber-950 uppercase tracking-widest">
                                         <Brain className="w-4 h-4 text-amber-400" /> AI Tolkning
                                      </h4>
                                      <p className="text-sm text-slate-500 leading-relaxed font-medium">Få forklaret paragraffens betydning, kernebegreber og praktiske implikationer for socialrådgivere.</p>
                                      <button 
                                        onClick={() => onAnalyze(para, paraKey)}
                                        className="w-full py-4 bg-amber-950 text-amber-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-900 transition-all shadow-xl shadow-amber-900/10"
                                      >
                                        Start AI Analyse
                                      </button>
                                   </div>
                                   <div className="p-8 bg-white rounded-[2rem] border border-slate-100 space-y-4">
                                      <h4 className="flex items-center gap-3 text-sm font-black text-amber-950 uppercase tracking-widest">
                                         <Info className="w-4 h-4 text-emerald-400" /> Sammenhæng
                                      </h4>
                                      <p className="text-sm text-slate-500 leading-relaxed font-medium">Find relaterede afgørelser (principmeddelelser), vejledninger og sagsindsigter.</p>
                                      <div className="flex gap-2">
                                         <button className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">Kommer snart</button>
                                      </div>
                                   </div>
                                </div>
                             )}
                          </motion.div>
                       )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

const InteractiveParagraphBody = ({ text, highlight, onSubElementClick, selectedSubElement }: any) => {
    // Shared logic for breaking down stk/nr
    const regex = /(Stk\.\s\d+\.\s?|Nr\.\s\d+\.\s?|\d+\)\s?|[a-z]\)\s?)/g;
    const rawParts = text.split(regex);
    if (rawParts.length === 1) return <div>{text}</div>;

    const lines: any[] = [];
    let currentId: string | null = null;
    let currentContent = "";

    rawParts.forEach(part => {
        if (regex.test(part)) {
            if (currentId || currentContent.trim()) lines.push({ id: currentId, content: currentContent });
            currentId = part.trim();
            currentContent = "";
        } else currentContent += part;
    });
    if (currentId || currentContent.trim()) lines.push({ id: currentId, content: currentContent });

    let lastStk: string | null = null;
    let lastNr: string | null = null;

    return (
        <div className="space-y-4">
            {lines.map((line, i) => {
                if (line.id?.startsWith('Stk.')) { lastStk = line.id; lastNr = null; }
                else if (line.id?.startsWith('Nr.') || line.id?.match(/^\d+\)/)) lastNr = line.id;

                const isSelected = selectedSubElement === line.id;
                let indent = "";
                if (line.id) {
                    if (/^\d+\)/.test(line.id) || /^Nr\./.test(line.id)) indent = "pl-8 sm:pl-12";
                    else if (/^[a-z]\)/.test(line.id)) indent = "pl-16 sm:pl-24";
                }

                return (
                    <div key={i} className={`flex gap-3 group/line ${indent}`}>
                        {line.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSubElementClick(line.id, lastStk, lastNr); }}
                                className={`mt-0.5 shrink-0 px-2 py-0.5 rounded-md font-black serif text-[11px] sm:text-xs border transition-all ${isSelected ? 'bg-amber-950 text-amber-400 border-amber-950' : 'bg-amber-50 text-amber-900 border-amber-100 hover:bg-amber-100'}`}
                            >
                                {line.id}
                            </button>
                        )}
                        <div className={`flex-1 ${isSelected ? 'text-amber-950 font-bold' : ''}`}>{line.content}</div>
                    </div>
                );
            })}
        </div>
    );
};

const ParagraphAnalysisView = ({ analysis }: { analysis: ParagraphAnalysisData }) => (
    <div className="space-y-12">
        <div className="flex items-center justify-between border-b border-amber-100 pb-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-400 text-amber-950 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20"><Brain className="w-6 h-6" /></div>
               <div>
                  <h4 className="text-xl font-black text-amber-950 serif italic">AI Juridisk Analyse</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mt-1">Gennemført i realtid</p>
               </div>
            </div>
            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Færdig</span>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
           <div className="space-y-8">
              <section className="space-y-4">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Betydning i praksis
                 </h5>
                 <p className="text-lg text-slate-700 leading-relaxed font-medium">{analysis.interpretation}</p>
              </section>

              <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-700/60 mb-6 font-black uppercase tracking-widest">Kernebegreber</h5>
                 <div className="flex flex-wrap gap-2">
                    {analysis.keyTerms.map((term, i) => (
                       <span key={i} className="px-4 py-2 bg-white text-amber-950 rounded-xl text-xs font-bold border border-amber-200/50 shadow-sm">{term}</span>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-8">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group/box">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover/box:rotate-12 transition-transform"><Scale className="w-20 h-20" /></div>
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-6">Socialrådgiver-fokus</h5>
                 <p className="text-base font-medium leading-relaxed italic opacity-90">"{analysis.application}"</p>
              </div>

              {analysis.relatedPrinciples && analysis.relatedPrinciples.length > 0 && (
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">Beslægtede principper</h5>
                    <div className="space-y-2">
                       {analysis.relatedPrinciples.map((p, i) => (
                          <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 group/p hover:border-amber-950 transition-all cursor-default">
                             <div className="w-2 h-2 rounded-full bg-amber-200 group-hover/p:bg-amber-500 transition-colors" />
                             <span className="text-sm font-bold text-slate-600 group-hover/p:text-amber-950">{p}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
    </div>
);
