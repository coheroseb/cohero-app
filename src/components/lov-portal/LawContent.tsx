
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
  Scale,
  Library,
  ChevronDown
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
    <div className="max-w-4xl mx-auto space-y-40 pb-64" id="law-content-section">
      {/* Law Hero Sanctuary */}
      <header className="py-24 space-y-12 border-b border-slate-100/50">
        <div className="flex flex-wrap items-center gap-4">
            <span className="px-6 py-2 bg-slate-900 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl">
                {docData.forkortelse || 'LOV'}
            </span>
            <span className="px-6 py-2 bg-amber-50 text-amber-950 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-200">
                LBK NR. {docData.number || '0000'} AF {docData.date || 'DATO'}
            </span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-950 serif leading-[0.9] tracking-tighter transition-all hover:tracking-tight duration-700">
            {docData.titel.split(' ').map((word, i) => (
                <span key={i} className={i % 4 === 3 ? "italic font-light text-amber-900" : ""}>
                    {word}{' '}
                </span>
            ))}
        </h1>
        
        <div className="flex flex-wrap items-center gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="italic">Gældende dansk lovgivning</span>
            </div>
            <div className="h-4 w-px bg-slate-100 hidden md:block"></div>
            <div className="flex items-center gap-3">
                <Library className="w-4 h-4 opacity-30" />
                <span>Dokument ID: {docData.uniqueDocumentId?.slice(-8) || 'REF-001'}</span>
            </div>
        </div>
      </header>

      {/* Chapters & Paragraphs as "Knowledge Bubbles" */}
      <div className="space-y-48">
        {docData.kapitler.map((chapter, cIdx) => (
          <section 
            key={cIdx} 
            id={`chapter-${cIdx}`} 
            className="space-y-16 scroll-mt-32"
          >
            <div className="flex items-center gap-8 group">
                <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-900 font-black serif text-2xl shadow-sm group-hover:bg-amber-950 group-hover:text-amber-400 transition-all duration-700">
                    {chapter.nummer?.match(/\d+/)?.[0] || (cIdx + 1)}
                </div>
                <div className="space-y-2">
                   <h2 className="text-3xl md:text-4xl font-black text-slate-950 serif italic tracking-tight group-hover:text-amber-950 transition-colors">{chapter.titel}</h2>
                   <div className="h-1 w-12 bg-amber-400 rounded-full group-hover:w-32 transition-all duration-700" />
                </div>
            </div>

            <div className="grid gap-8">
              {chapter.paragraffer.map((para, pIdx) => {
                const paraKey = `${lawId}-${cIdx}-${pIdx}`;
                const isExpanded = expandedParaKey === paraKey;
                const isActiveInNav = activeParagraphNumber === para.nummer;
                const savedId = `${lawId}-${para.nummer.replace(/[§\s\.]/g, '-')}`;
                const analysis = paraAnalysis[paraKey];
                const analyzing = isAnalysingPara[paraKey];

                return (
                  <motion.div 
                    key={paraKey}
                    id={`para-${paraKey}`}
                    initial={false}
                    className={`relative p-12 md:p-20 rounded-[4rem] transition-all duration-1000 border-2 ${isActiveInNav ? 'bg-white shadow-2xl border-amber-950/20 scale-[1.02] z-10' : 'bg-transparent border-transparent hover:bg-white hover:shadow-xl hover:border-slate-50'}`}
                  >
                    {/* Floating Controls */}
                    <div className="absolute top-12 right-12 flex items-center gap-3 sm:opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <button 
                            onClick={() => onToggleSave(para)}
                            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isSaved(savedId) ? 'bg-amber-950 border-amber-950 text-amber-400 shadow-xl' : 'bg-white border-slate-100 text-slate-300 hover:border-amber-950 hover:text-amber-950'}`}
                        >
                            {isSaved(savedId) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Paragraph Identity */}
                    <div className="inline-flex items-center gap-4 mb-12">
                       <div className={`px-6 py-2.5 rounded-2xl font-black text-lg serif tracking-tighter transition-all duration-700 ${isActiveInNav ? 'bg-amber-950 text-amber-400 shadow-2xl rotate-1' : 'bg-slate-50 text-slate-900 group-hover:bg-amber-100'}`}>
                          {para.nummer}
                       </div>
                       {isActiveInNav && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm"
                          >
                             Aktiv Reference
                          </motion.div>
                       )}
                    </div>

                    {/* Pure Legal Text Reading Area */}
                    <div 
                        onMouseUp={() => onMouseUp(paraKey)}
                        className={`prose-lg md:prose-2xl font-serif leading-[1.6] text-slate-900 selection:bg-amber-200 transition-all duration-700 ${isActiveInNav ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                    >
                       <InteractiveParagraphBody 
                          text={para.tekst} 
                          onSubElementClick={onSubElementClick} 
                          selectedSubElement={selectedSubElement}
                       />
                    </div>

                    {/* Contextual Action Bar */}
                    <div className="mt-16 pt-12 border-t border-slate-50/50 flex flex-wrap items-center justify-between gap-8">
                        <div className="flex gap-4">
                           <button 
                              onClick={() => {
                                if (isExpanded) setExpandedParaKey(null);
                                else { setExpandedParaKey(paraKey); setActiveParagraphNumber(para.nummer); }
                              }}
                              className={`flex items-center gap-3 px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${isExpanded ? 'bg-amber-950 text-white shadow-2xl' : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-950 hover:shadow-lg'}`}
                           >
                              {isExpanded ? 'Luk Analyse' : 'Udforsk Jura'}
                              <ChevronDown className={`w-4 h-4 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                           </button>
                           
                           {isPremium && !analysis && (
                              <button 
                                 onClick={() => onAnalyze(para, paraKey)}
                                 disabled={analyzing}
                                 className="w-14 h-14 bg-amber-50 text-amber-950 rounded-full flex items-center justify-center border border-amber-200 hover:bg-amber-950 hover:text-amber-400 transition-all group/ai"
                              >
                                 {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5 group-hover/ai:scale-110 transition-transform" />}
                              </button>
                           )}
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                           <button onClick={() => onCopy(para.tekst, paraKey)} className="hover:text-amber-950 transition-colors flex items-center gap-2">
                              {copiedId === paraKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              Kopier
                           </button>
                        </div>
                    </div>

                    {/* Integrated AI Insights Sanctuary */}
                    <AnimatePresence>
                       {isExpanded && (
                          <motion.div 
                             initial={{ opacity: 0, scale: 0.98, y: 10 }}
                             animate={{ opacity: 1, scale: 1, y: 0 }}
                             exit={{ opacity: 0, scale: 0.98, y: 10 }}
                             className="mt-12 overflow-hidden bg-[#FDFCF8] rounded-[3rem] p-12 md:p-16 border border-amber-50 shadow-inner"
                          >
                             {analysis ? (
                                <ParagraphAnalysisView analysis={analysis} />
                             ) : analyzing ? (
                                <div className="py-24 text-center space-y-8">
                                   <div className="relative inline-block">
                                      <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-amber-500 shadow-2xl border border-amber-50">
                                         <Brain className="w-12 h-12" />
                                      </div>
                                      <div className="absolute inset-0 border-4 border-dashed border-amber-400/20 rounded-[2.5rem] animate-spin-slow opacity-50" />
                                   </div>
                                   <div className="space-y-4">
                                      <p className="font-black text-amber-950 serif italic text-3xl">AI'en reflekterer over paragraffen...</p>
                                      <div className="flex items-center justify-center gap-3">
                                         {[0, 1, 2].map(i => (
                                            <motion.div 
                                               key={i} 
                                               animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                                               transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                                               className="w-1.5 h-1.5 rounded-full bg-amber-400"
                                            />
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             ) : (
                                <div className="grid md:grid-cols-2 gap-12">
                                   <div className="space-y-8">
                                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-amber-950 shadow-sm border border-amber-50"><Brain className="w-8 h-8" /></div>
                                      <div className="space-y-4">
                                         <h4 className="text-3xl font-black text-amber-950 serif italic">Dybdegående Analyse</h4>
                                         <p className="text-slate-500 font-medium leading-relaxed italic">Lad AI'en dekonstruere juraen og give dig en forklaring på hvordan den anvendes i dit daglige arbejde.</p>
                                      </div>
                                      <button 
                                        onClick={() => onAnalyze(para, paraKey)}
                                        className="inline-flex items-center gap-4 px-10 py-5 bg-amber-950 text-amber-400 rounded-full text-xs font-black uppercase tracking-widest hover:bg-rose-900 transition-all hover:shadow-2xl active:scale-95"
                                      >
                                        Start AI Tolkning <ArrowRight className="w-4 h-4" />
                                      </button>
                                   </div>
                                   <div className="bg-white/50 p-10 rounded-[2.5rem] border border-slate-50 space-y-8">
                                      <div className="space-y-4">
                                         <h5 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                                            <Info className="w-4 h-4" /> Juridisk Kontekst
                                         </h5>
                                         <p className="text-sm font-medium text-slate-400 leading-relaxed italic">Her kan du snart finde relaterede domsafgørelser og principmeddelelser direkte koblet til denne paragraf.</p>
                                      </div>
                                      <div className="h-px bg-slate-50 w-full" />
                                      <div className="flex gap-3">
                                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200"><Scale className="w-5 h-5" /></div>
                                         <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200"><Library className="w-5 h-5" /></div>
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

// --- REFINED SUB-COMPONENTS ---

const InteractiveParagraphBody = ({ text, highlight, onSubElementClick, selectedSubElement }: any) => {
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
        <div className="space-y-8">
            {lines.map((line, i) => {
                if (line.id?.startsWith('Stk.')) { lastStk = line.id; lastNr = null; }
                else if (line.id?.startsWith('Nr.') || line.id?.match(/^\d+\)/)) lastNr = line.id;

                const isSelected = selectedSubElement === line.id;
                let indent = "";
                if (line.id) {
                    if (/^\d+\)/.test(line.id) || /^Nr\./.test(line.id)) indent = "pl-12 sm:pl-20";
                    else if (/^[a-z]\)/.test(line.id)) indent = "pl-20 sm:pl-32 border-l-2 border-slate-50 ml-4 py-1";
                }

                return (
                    <motion.div 
                      key={i} 
                      initial={false}
                      className={`flex gap-6 group/line ${indent} transition-all duration-700 ${isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'}`}
                    >
                        {line.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onSubElementClick(line.id, lastStk, lastNr); }}
                                className={`mt-1.5 shrink-0 px-3 py-1 rounded-xl font-black serif text-[10px] sm:text-xs border transition-all duration-500 ${isSelected ? 'bg-amber-950 text-amber-400 border-amber-950 scale-110 shadow-xl' : 'bg-transparent text-slate-300 border-slate-100 hover:border-amber-950 hover:text-amber-950 group-hover/line:border-slate-300'}`}
                            >
                                {line.id}
                            </button>
                        )}
                        <div className={`flex-1 transition-all duration-700 ${isSelected ? 'text-amber-950 font-bold' : ''}`}>{line.content}</div>
                    </motion.div>
                );
            })}
        </div>
    );
};

const ParagraphAnalysisView = ({ analysis }: { analysis: ParagraphAnalysisData }) => (
    <div className="space-y-20">
        <div className="flex items-center justify-between border-b border-amber-100 pb-10">
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 bg-amber-400 text-amber-950 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-amber-400/20 rotate-3"><Brain className="w-8 h-8" /></div>
               <div>
                  <h4 className="text-3xl font-black text-amber-950 serif italic">AI Reflektion</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-950/30 mt-1">Dybde-analyse på sagsniveau</p>
               </div>
            </div>
            <div className="hidden sm:flex items-center gap-4">
               <div className="px-5 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Præcision: Høj</div>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
           <div className="space-y-12">
              <section className="space-y-6">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Betydning i praksis
                 </h5>
                 <p className="text-xl md:text-2xl text-amber-950 font-medium leading-[1.6] serif italic p-8 bg-white rounded-[2rem] border-l-4 border-amber-400 shadow-sm">
                    "{analysis.interpretation || 'Analyse under forberedelse...'}"
                 </p>
              </section>

              <div className="space-y-6">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 px-2 font-black">Nøgle-begreber</h5>
                 <div className="flex flex-wrap gap-3">
                    {analysis.keyTerms?.map((term, i) => (
                       <span key={i} className="px-6 py-2.5 bg-white text-slate-900 rounded-2xl text-[11px] font-black border border-slate-100 shadow-sm hover:border-amber-950 transition-all cursor-default uppercase tracking-widest">{term}</span>
                    ))}
                 </div>
              </div>
           </div>

           <div className="space-y-12">
              <div className="bg-slate-950 p-12 rounded-[3.5rem] text-white shadow-3xl relative overflow-hidden group/box hover:scale-[1.02] transition-transform duration-700">
                 <div className="absolute top-0 right-0 p-12 opacity-10 group-hover/box:rotate-12 transition-all duration-1000 grayscale"><Scale className="w-32 h-32" /></div>
                 <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400 mb-8 flex items-center gap-3">
                    <Info className="w-4 h-4" /> Anvendelse for dig
                 </h5>
                 <p className="text-lg md:text-xl font-medium leading-relaxed italic opacity-90 border-l border-amber-400/30 pl-8">
                    {analysis.application || 'Venter på systemets vurdering...'}
                 </p>
              </div>

              {analysis.relatedPrinciples && analysis.relatedPrinciples.length > 0 && (
                 <div className="space-y-6">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 px-4">Beslægtede Domme & Principper</h5>
                    <div className="grid gap-3">
                       {analysis.relatedPrinciples.map((p, i) => (
                          <div key={i} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] flex items-center justify-between group/p hover:border-amber-950 transition-all cursor-pointer">
                             <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-amber-200 group-hover/p:bg-amber-500 transition-colors shadow-sm" />
                                <span className="text-xs font-bold text-slate-600 group-hover/p:text-amber-950 tracking-tight">{p}</span>
                             </div>
                             <ArrowRight className="w-4 h-4 opacity-0 group-hover/p:opacity-100 group-hover/p:translate-x-1 transition-all text-amber-950" />
                          </div>
                        ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
    </div>
);
