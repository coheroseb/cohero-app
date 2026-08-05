'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, BrainCircuit, Sparkles, Loader2, Send, Plus, Scale, Target, Zap, BookOpen, Quote, ChevronDown, ChevronUp, Lock, Check, History, X, RotateCcw, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, writeBatch, increment, collection, serverTimestamp } from 'firebase/firestore';
import type { Explanation } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { marked } from 'marked';

import { searchRetsinformationApiAction, getRetsinformationBillTextAction } from '@/app/actions';

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'concept' | 'followup';

interface ChatMsg {
  id: string;
  role: MsgRole;
  text?: string;          // user / followup
  explanation?: Partial<Explanation>; // concept
  conceptName?: string;
}

const stripHtml = (s: string) => s?.replace(/<[^>]*>/g, '') ?? '';

// ─── Expand section ───────────────────────────────────────────────────────────

function Section({ title, icon, children, open: defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; open?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-200/60">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-8 py-5 hover:bg-slate-50/50 transition-colors">
        <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{icon}{title}</span>
        <div className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
           <ChevronDown className="w-4 h-4 text-slate-300" />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-8 pb-8">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Citation Copy Button ──────────────────────────────────────────────────────

function CopyCitationButton({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const cleanText = citation.replace(/\*/g, '');
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 hover:border-amber-300 active:scale-95 transition-all text-amber-800 shrink-0 self-center"
      title="Kopier APA-reference"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-600 animate-in fade-in zoom-in duration-200" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-amber-600" />
      )}
    </button>
  );
}

// ─── Retsinformation API Section ────────────────────────────────────────────────
function RetsinformationSection({ conceptName }: { conceptName: string }) {
  const [bills, setBills] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBillText, setSelectedBillText] = useState<any | null>(null);
  const [loadingBill, setLoadingBill] = useState(false);

  useEffect(() => {
    if (!conceptName) return;
    let isMounted = true;
    setLoading(true);
    searchRetsinformationApiAction(conceptName)
      .then(res => {
        if (isMounted) {
          setBills(res.bills || []);
          setCases(res.cases || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Retsinformation API error:", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [conceptName]);

  const handleOpenBill = async (billNumber: string) => {
    setLoadingBill(true);
    try {
      const details = await getRetsinformationBillTextAction(billNumber);
      setSelectedBillText(details || { number: billNumber, title: 'Information ikke tilgængelig' });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBill(false);
    }
  };

  if (loading) {
    return (
      <Section title="Retsinformation API — Gældende Lovgivning" icon={<Scale className="w-3 h-3 text-indigo-500" />}>
        <div className="flex items-center gap-3 py-4 text-xs text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Henter retsakter og lovforslag fra retsinformation-api.dk...
        </div>
      </Section>
    );
  }

  if (bills.length === 0 && cases.length === 0) return null;

  return (
    <Section title="Retsinformation API — Gældende Lovgivning" icon={<Scale className="w-3 h-3 text-indigo-500" />} open={true}>
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Fundet hos retsinformation-api.dk ({bills.length} lovforslag, {cases.length} sager)
        </p>

        <div className="grid grid-cols-1 gap-2.5">
          {bills.slice(0, 4).map((bill, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between gap-2 group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                    {bill.number || 'Lovforslag'}
                  </span>
                  {bill.status && (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[9px] font-bold">
                      {bill.status}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                  {bill.title}
                </h4>
                {bill.short_title && bill.short_title !== bill.title && (
                  <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">{bill.short_title}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/40 text-[10px]">
                <span className="font-semibold text-slate-400">{bill.ressort || 'Folketinget'}</span>
                <button
                  onClick={() => handleOpenBill(bill.number)}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:underline"
                >
                  Læs bemærkninger & tekster →
                </button>
              </div>
            </div>
          ))}

          {cases.slice(0, 2).map((item, i) => (
            <div key={i} className="p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl text-xs flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider">{item.case_type || 'Parlamentarisk Sag'}</span>
                {item.status && <span className="text-[9px] font-bold text-amber-700">{item.status}</span>}
              </div>
              <p className="font-bold text-amber-950 leading-snug">{item.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bill details modal */}
      <AnimatePresence>
        {(selectedBillText || loadingBill) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[50000] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{selectedBillText?.number || 'Lovforslag'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Retsinformation API</p>
                  </div>
                </div>
                <button onClick={() => setSelectedBillText(null)} className="p-2 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 text-slate-700 leading-relaxed text-xs custom-scrollbar">
                {loadingBill ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span>Henter fuld lovtekst fra retsinformation-api.dk...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-slate-950">{selectedBillText?.title}</h4>
                      {selectedBillText?.short_title && (
                        <p className="text-xs italic text-slate-500">{selectedBillText.short_title}</p>
                      )}
                    </div>

                    {selectedBillText?.resume && (
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1">
                        <h5 className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Resumé</h5>
                        <p className="text-xs text-indigo-950 leading-relaxed">{selectedBillText.resume}</p>
                      </div>
                    )}

                    {selectedBillText?.decision_text && (
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Afgørelse</h5>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedBillText.decision_text}</p>
                      </div>
                    )}

                    {selectedBillText?.justification && (
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Begrundelse</h5>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedBillText.justification}</p>
                      </div>
                    )}

                    {selectedBillText?.voting_conclusion && (
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Afstemning</h5>
                        <p className="text-xs text-slate-700 leading-relaxed">{selectedBillText.voting_conclusion}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

// ─── Concept card (rich first-response) ──────────────────────────────────────

function ConceptCard({ msg, onAngleClick }: { msg: ChatMsg; onAngleClick: (q: string) => void }) {
  const { explanation: ex, conceptName } = msg;
  if (!ex) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 shadow-sm"><BrainCircuit className="w-4 h-4" /></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Akademisk Analyse</span>
      </div>
      <div className="bg-white border border-slate-200/60 shadow-[var(--shadow-sm)] rounded-[var(--radius-lg)] overflow-hidden group hover:border-slate-350 transition-all duration-500">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 bg-slate-50/50 border-b border-slate-200/60 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2 flex items-center gap-2">
               <Sparkles className="w-3 h-3" />
               Faglig Dybtjek
            </p>
            <h3 className="text-3xl font-black text-slate-950 serif tracking-tight">{conceptName}</h3>
            {ex.etymology && <p className="text-slate-400 text-xs font-medium mt-3 italic leading-relaxed">{stripHtml(ex.etymology).substring(0, 150)}…</p>}
          </div>
        </div>

        {/* Definition */}
        <div className="px-8 py-8">
          {ex.definition ? (
            <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-[1.8] font-medium serif text-base" 
                 dangerouslySetInnerHTML={{ __html: marked.parse(ex.definition) as string }} />
          ) : (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded-full w-3/4" />
              <div className="h-4 bg-slate-100 rounded-full w-full" />
              <div className="h-4 bg-slate-100 rounded-full w-5/6" />
            </div>
          )}
        </div>

        {/* Disambiguation angles */}
        {ex.disambiguation && ex.disambiguation.length > 0 && (
          <div className="px-8 pb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-4">Udforsk flere vinkler</p>
            <div className="flex flex-wrap gap-2.5">
              {ex.disambiguation.map((a, i) => (
                <button 
                  key={i} 
                  onClick={() => onAngleClick(a.query)}
                  className="px-5 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-black text-slate-600 hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-95 shadow-[var(--shadow-sm)]"
                >
                  {a.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {ex.relevance && (
          <Section title="Faglig relevans" icon={<Target className="w-3 h-3" />} open={true}>
            <div className="prose prose-sm prose-slate max-w-none text-slate-600" 
                 dangerouslySetInnerHTML={{ __html: marked.parse(ex.relevance || '') as string }} />
          </Section>
        )}

        {ex.practicalExample && (
          <Section title="Case eksempel" icon={<Zap className="w-3 h-3" />}>
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-600 italic leading-relaxed border border-slate-100" 
                 dangerouslySetInnerHTML={{ __html: marked.parse(ex.practicalExample || '') as string }} />
          </Section>
        )}

        {/* Juridisk forankring */}
        {((ex.legalAnchor && !ex.legalAnchor.toLowerCase().includes('ingen direkte')) || (ex.legalContext && ex.legalContext.exactText)) && (
          <Section title="Juridisk forankring" icon={<Scale className="w-3 h-3" />}>
            {ex.legalContext && ex.legalContext.exactText && (
              <div className="bg-amber-950 text-amber-100 rounded-2xl p-4 text-xs font-mono mb-3">
                <span className="text-amber-400 font-bold">{ex.legalContext.lawTitle} {ex.legalContext.paragraphNumber}</span>
                <p className="mt-2 text-amber-200/70 italic leading-relaxed">"{ex.legalContext.exactText}"</p>
                {ex.legalContext.relevance && (
                  <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-amber-300/60">
                    {ex.legalContext.relevance}
                  </div>
                )}
              </div>
            )}
            {ex.legalAnchor && !ex.legalAnchor.toLowerCase().includes('ingen direkte') && (
              <p className="text-xs text-slate-600 font-medium">{ex.legalAnchor}</p>
            )}
          </Section>
        )}

        {/* Retsinformation API Live Documents */}
        <RetsinformationSection conceptName={conceptName || ''} />

        {ex.criticalReflection && (
          <Section title="Kritisk refleksion" icon={<BrainCircuit className="w-3 h-3" />}>
            <div className="prose prose-sm text-slate-600 italic" 
                 dangerouslySetInnerHTML={{ __html: marked.parse(ex.criticalReflection || '') as string }} />
          </Section>
        )}

        {/* Tags row */}
        {ex.relatedConcepts && ex.relatedConcepts.length > 0 && (
          <div className="px-7 py-4 border-t border-slate-200/60 flex flex-wrap gap-1.5">
            {ex.relatedConcepts.map((c, i) => (
              <button key={i} onClick={() => onAngleClick(c)}
                className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition-all">
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Literature */}
        {ex.suggestedLiterature && ex.suggestedLiterature.length > 0 && (
          <div className="px-7 py-5 border-t border-slate-200/60">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Anbefalet litteratur</p>
            <div className="space-y-2">
              {ex.suggestedLiterature.map((b, i) => (
                <div key={i} className="flex flex-col gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-950">{b.title}</p>
                      <p className="text-[10px] text-amber-700 font-medium">{b.author}</p>
                    </div>
                  </div>
                  {(b.relevance || (b.chapters && b.chapters.length > 0)) && (
                    <div className="mt-1 pl-7 space-y-2">
                      {b.relevance && <p className="text-[10px] text-amber-900/60 leading-relaxed italic">"{b.relevance}"</p>}
                      {b.chapters && b.chapters.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {b.chapters.map((ch, j) => (
                            <span key={j} className="px-2 py-0.5 bg-white/50 border border-amber-200/50 rounded-lg text-[9px] font-bold text-amber-800">
                              {ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {b.apaCitation && (
                    <div className="mt-2 pl-7 flex items-start justify-between gap-3 p-3 bg-amber-950/5 border border-amber-950/10 rounded-xl">
                      <div className="text-[10px] text-amber-950/80 leading-relaxed font-sans pr-2">
                        <span className="font-bold text-[9px] text-amber-950/55 uppercase tracking-wider block mb-1">APA 7 Reference</span>
                        <span dangerouslySetInnerHTML={{ __html: marked.parseInline(b.apaCitation) as string }} />
                      </div>
                      <CopyCitationButton citation={b.apaCitation} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Socratic question */}
        {ex.socraticQuestion && (
          <div className="px-7 py-5 border-t border-amber-50 bg-amber-50/30 flex items-start gap-3">
            <Quote className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
            <p className="text-sm italic text-amber-950/60 font-medium serif">"{ex.socraticQuestion}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Follow-up AI message ─────────────────────────────────────────────────────

function FollowUpMsg({ msg }: { msg: ChatMsg }) {
  const isEmpty = !msg.text || msg.text.trim() === '';
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-amber-400 shadow-sm"><BrainCircuit className="w-4 h-4" /></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Opfølgning</span>
      </div>
      <div className="bg-white border border-slate-100 rounded-[2.5rem] px-8 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] min-h-[100px] flex flex-col justify-center">
        {isEmpty ? (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-2 h-2 bg-indigo-200 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        ) : (
          <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-[1.8] font-medium text-base serif" 
               dangerouslySetInnerHTML={{ __html: marked.parse(msg.text || '') as string }} />
        )}
      </div>
    </motion.div>
  );
}

// ─── User bubble ──────────────────────────────────────────────────────────────

function UserBubble({ msg }: { msg: ChatMsg }) {
  return (
    <div className="flex justify-end w-full">
      <motion.div 
        initial={{ opacity: 0, x: 20 }} 
        animate={{ opacity: 1, x: 0 }} 
        className="max-w-lg bg-slate-900 text-white rounded-[2.5rem] rounded-tr-lg px-8 py-5 shadow-xl shadow-slate-900/10 border border-slate-800"
      >
        <p className="text-lg font-bold leading-relaxed tracking-tight">{msg.text}</p>
      </motion.div>
    </div>
  );
}

// ─── Thinking dots ────────────────────────────────────────────────────────────

function Thinking() {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 5);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    'Konsulterer retsgrundlaget...',
    'Strukturerer analysen...',
    'Finder praktiske eksempler...',
    'Formulerer forklaringen...',
    'Gør det komplekse enkelt...'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-2xl w-full py-12"
    >
      <div className="flex flex-col items-center gap-8">
        <div className="relative">
          <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)]">
             <BrainCircuit className="w-8 h-8 text-slate-900" />
          </div>
          <div className="absolute inset-0 w-20 h-20 bg-indigo-500/10 rounded-[2.5rem] animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-3">
           <div className="flex items-center gap-2">
             {[0, 1, 2].map(i => (
               <motion.div 
                 key={i} 
                 className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                 animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
               />
             ))}
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">
              {steps[step]}
           </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── History sidebar ─────────────────────────────────────────────────────────

function HistorySidebar({ 
  open, 
  onClose, 
  recent, 
  onSelect 
}: { 
  open: boolean; 
  onClose: () => void; 
  recent: string[]; 
  onSelect: (s: string) => void; 
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-amber-950/20 backdrop-blur-sm z-[10000]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-xl z-[10001] flex flex-col border-l border-slate-200/60">
            <div className="p-6 border-b border-slate-200/60 flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Dine opslag
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recent.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Sparkles className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Du har ikke slået noget op endnu.</p>
                </div>
              ) : (
                recent.map((term, i) => (
                  <button key={i} onClick={() => { onSelect(term); onClose(); }}
                    className="w-full text-left p-4 hover:bg-slate-50 rounded-xl border border-slate-200/40 hover:border-slate-200 transition-all group">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-900 transition-colors">{term}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      <span className="text-[10px] font-medium text-slate-400">Gense forklaring</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-6 bg-amber-50/50 border-t border-amber-50">
              <p className="text-[10px] font-medium text-amber-900/40 text-center leading-relaxed">
                Her gemmes dine 10 seneste opslag.<br/>Klik for at genbesøge dem.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 pb-20 gap-10">
      <div className="space-y-4 px-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-amber-100 mb-2 sm:mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Din faglige makker
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-amber-950 serif tracking-tighter leading-tight sm:leading-none">Hvad vil du lære <span className="text-amber-400 italic">nu?</span></h2>
        <p className="mt-2 sm:mt-6 text-slate-500 font-medium max-w-md mx-auto text-xs sm:text-sm md:text-base leading-relaxed">
          Søg på begreber fra pensum, lovgivning eller praksis. Jeg forklarer det hurtigt, præcist og pædagogisk.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl px-2">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onPick(s)}
            className="p-4 bg-white border border-amber-100 rounded-2xl sm:rounded-3xl text-xs font-bold text-amber-900 hover:border-amber-400 hover:bg-amber-50/50 hover:scale-[1.02] transition-all text-center shadow-sm">
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

const SUGGESTIONS = ['Magtanvendelse', 'Mentalisering', 'Retssikkerhed', 'Systemisk Teori', 'Moralsk stress', 'Barnets perspektiv'];

function ConceptChatContent() {
  const { user, userProfile, refetchUserProfile, usageLimits } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTier = userProfile?.membership || 'Kollega';
  const effectiveTier = ['Kollega', 'Group Pro'].includes(currentTier) ? 'Kollega' : 'Kollega+';
  const lim = (usageLimits && usageLimits[effectiveTier]) ? (usageLimits[effectiveTier]?.concepts === -1 ? Infinity : (usageLimits[effectiveTier]?.concepts ?? 1)) : 1;

  // Hook to lock body scroll
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [currentConceptName, setCurrentConceptName] = useState('');
  const [currentDefinition, setCurrentDefinition] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlProcessed = useRef(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const hasConcept = messages.some(m => m.role === 'concept');

  // Build chat history for follow-up
  const buildHistory = useCallback(() => {
    const history: { role: 'user' | 'assistant'; content: string }[] = [];
    
    messages.forEach(m => {
      if (m.role === 'user' && m.text) {
        history.push({ role: 'user', content: m.text });
      } else if (m.role === 'followup' && m.text) {
        history.push({ role: 'assistant', content: m.text });
      } else if (m.role === 'concept' && m.explanation?.definition) {
        history.push({ role: 'assistant', content: `KONTEKST: Du har lige forklaret begrebet ${m.conceptName?.toUpperCase()}.\nDefinition: ${m.explanation.definition.replace(/<[^>]*>/g, '').substring(0, 1000)}` });
      }
    });
    
    return history;
  }, [messages]);

  const checkLimit = useCallback(() => {
    if (!userProfile || !usageLimits) return true;
    const tier = ['Kollega', 'Group Pro'].includes(userProfile.membership || 'Kollega') ? 'Kollega' : 'Kollega+';
    const currentLim = usageLimits[tier]?.concepts === -1 ? Infinity : (usageLimits[tier]?.concepts ?? 1);
    const today = new Date().toDateString();
    const last = userProfile.lastConceptExplainerUsage?.toDate().toDateString();
    const count = last === today ? userProfile.dailyConceptExplainerCount || 0 : 0;
    if (count >= currentLim) {
      setLimitError(`Dine opslag for i dag er brugt (${currentLim} stk.). Opgrader til Kollega+ for fri adgang.`);
      return false;
    }
    return true;
  }, [userProfile, usageLimits]);

  const trackUsage = useCallback(async (term: string) => {
    if (!user || !userProfile || !firestore) return;
    const batch = writeBatch(firestore);
    const recent = [term, ...(userProfile.recentConcepts || [])].filter((t, i, s) => s.indexOf(t) === i).slice(0, 10);
    batch.set(doc(collection(firestore, 'userActivities')), {
      userId: user.uid, userName: userProfile.username || user.displayName || 'Anonym',
      actionText: `slog begrebet "${term}" op.`, createdAt: serverTimestamp(),
    });
    batch.update(doc(firestore, 'users', user.uid), {
      lastConceptExplainerUsage: serverTimestamp(),
      dailyConceptExplainerCount: increment(1),
      recentConcepts: recent,
    });
    await batch.commit();
    await refetchUserProfile();
  }, [user, userProfile, firestore, refetchUserProfile]);

  const sendMessage = useCallback(async (term: string) => {
    if (!term.trim() || !user || !userProfile || !firestore) return;
    setInput('');
    setLimitError(null);
    if (!checkLimit()) return;

    const isInitial = !hasConcept;
    const aiMsgId = (Date.now() + 1).toString();
    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', text: term };
    setMessages(prev => [...prev, userMsg]);

    const normalised = term.toLowerCase().trim().replace(/[^a-z0-9æøå-]/g, '-');
    const profKey = (userProfile.profession || 'socialrådgiver').toLowerCase().replace(/[^a-z0-9æøå-]/g, '-');
    const cacheKey = `cohero-explainer-${normalised}-${profKey}`;

    setLoading(true);

    try {
        const flowPath = "/runAiFlow";
        const prodBaseUrl = "https://runaiflow-7pguetq4hq-uc.a.run.app";
        const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
          ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + flowPath) 
          : (prodBaseUrl + flowPath);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        // Helper to handle streaming
        const handleStream = async (
          reader: ReadableStreamDefaultReader<Uint8Array>, 
          onChunk: (data: any) => void
        ) => {
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value, { stream: true });
            buffer += text;
            
            // Split by double newline (standard SSE) or single newline (sometimes used)
            const parts = buffer.split(/\n\n|\n/);
            buffer = parts.pop() || '';
            
            for (const part of parts) {
              const line = part.trim();
              if (line.startsWith('data: ')) {
                let chunk;
                try {
                  const lineData = line.substring(6).trim();
                  if (!lineData) continue;
                  chunk = JSON.parse(lineData);
                } catch (e) {
                  // Partial JSON is common in streaming, but SSE should deliver whole lines
                  console.warn("[Stream] Parse error for line:", line, e);
                  continue;
                }
                
                console.log("[Stream] Raw chunk:", chunk);
                if (chunk && chunk.error) {
                  throw new Error(chunk.error);
                }
                
                // Genkit sends data in various nested forms:
                // 1. { chunk: { ... } } -> streaming partials
                // 2. { done: true, result: { data: { ... } } } -> final result
                // 3. { message: { ... } } -> sometimes used in different versions
                
                let data = null;
                if (chunk.chunk) data = chunk.chunk;
                else if (chunk.done && chunk.result) data = chunk.result.data || chunk.result;
                else if (chunk.message) data = chunk.message;
                else if (!chunk.index && !chunk.done) data = chunk; // Raw object
                
                if (data) {
                  console.log("[Stream] Extracted data:", data);
                  onChunk(data);
                }
              }
            }
          }
        };

        if (isInitial) {
          // Check cache first
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const explanation = JSON.parse(cached);
            setMessages(prev => [...prev, { id: aiMsgId, role: 'concept', explanation, conceptName: term }]);
            setCurrentDefinition(explanation.definition || '');
            setCurrentConceptName(term);
            trackUsage(term);
            setLoading(false);
            return;
          }

          // Check DB first
          const docRef = doc(firestore, 'conceptExplanations-v2', `${normalised}--${profKey}`);
          const genRef = doc(firestore, 'conceptExplanations-v2', normalised);
          const [snap1, snap2] = await Promise.all([getDoc(docRef), getDoc(genRef)]);

          if (snap1.exists() || snap2.exists()) {
            const explanation = (snap1.exists() ? snap1.data() : snap2.data())?.explanation;
            setMessages(prev => [...prev, { id: aiMsgId, role: 'concept', explanation, conceptName: term }]);
            setCurrentDefinition(explanation.definition || '');
            setCurrentConceptName(term);
            trackUsage(term);
            setLoading(false);
            return;
          }

          // No cache, no DB - start AI generation
          setMessages(prev => [...prev, { id: aiMsgId, role: 'concept', explanation: {} as any, conceptName: term }]);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              flowName: 'explainConceptFlow', 
              data: { 
                concept: term, 
                profession: userProfile.profession || 'Socialrådgiver'
              }, 
              stream: true 
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errText}`);
          }

          if (!response.body) throw new Error('No response body received from server');
          
          await handleStream(response.body.getReader(), (data) => {
            setMessages(prev => prev.map(m => {
              if (m.id !== aiMsgId) return m;
              
              const currentEx = m.explanation || {};
              
              if (typeof data === 'string') {
                // If it's a raw string, it's a delta, so we APPEND to definition
                return {
                  ...m,
                  explanation: {
                    ...currentEx,
                    definition: (currentEx.definition || '') + data
                  } as Explanation
                };
              } else {
                // If it's an object, it's accumulated, so we OVERWRITE/MERGE
                return {
                  ...m,
                  explanation: {
                    ...currentEx,
                    ...data
                  } as Explanation
                };
              }
            }));
          });

          // After stream completion, find the final state and save
          setMessages(currentMessages => {
             const finalMsg = currentMessages.find(m => m.id === aiMsgId);
             const explanation = finalMsg?.explanation as Explanation;
             if (explanation && explanation.definition) {
                setCurrentDefinition(explanation.definition);
                setCurrentConceptName(term);
                // Background save
                (async () => {
                  const batch = writeBatch(firestore);
                  batch.set(docRef, { conceptName: term, explanation, profession: userProfile.profession, createdAt: serverTimestamp() });
                  if (!snap2.exists()) batch.set(genRef, { conceptName: term, explanation, profession: 'Generel', createdAt: serverTimestamp() });
                  await batch.commit();
                  sessionStorage.setItem(cacheKey, JSON.stringify(explanation));
                })();
             }
             return currentMessages;
          });

          trackUsage(term);

        } else {
          // Follow-up chat with streaming
          setMessages(prev => [...prev, { id: aiMsgId, role: 'followup', text: '' }]);

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              flowName: 'unifiedChatFlow', 
              data: {
                message: term,
                chatHistory: buildHistory(),
                persona: 'academic',
                context: {
                  relevantDocumentIds: [],
                  lawContext: `AKTUEL FAGLIG KONTEKST:\nBegreb: ${currentConceptName}\nDefinition: ${stripHtml(currentDefinition).substring(0, 1000)}`,
                },
              },
              stream: true
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errText}`);
          }

          if (!response.body) throw new Error('No response body received from server');

          await handleStream(response.body.getReader(), (data) => {
            // Extraction
            const answer = data.answer || data.text;
            
            if (answer) {
              // Genkit sends accumulated objects, so we OVERWRITE
              setMessages(prev => prev.map(m => 
                m.id === aiMsgId ? { ...m, text: answer } : m
              ));
            } else if (typeof data === 'string' && data.length > 0) {
              // If it's a raw string, it might be a delta, so we APPEND
              setMessages(prev => prev.map(m => 
                m.id === aiMsgId ? { ...m, text: (m.text || '') + data } : m
              ));
            }
          });
        }
    } catch (err: any) {
      console.error('[ConceptExplainer] Error:', err);
      // Remove placeholder AI message
      setMessages(prev => prev.filter(m => m.id !== aiMsgId));

      if (err.name !== 'AbortError') {
        const isGeminiError = err.message?.includes('GoogleGenerativeAI') || err.message?.includes('Gemini');
        toast({ 
          variant: 'destructive', 
          title: 'Fejl', 
          description: isGeminiError 
            ? 'Der opstod en midlertidig fejl hos Google Gemini. Prøv venligst igen om et øjeblik.' 
            : 'Noget gik galt. Prøv igen.' 
        });
      } else {
        toast({ 
            variant: 'destructive', 
            title: 'Forbindelse afbrudt', 
            description: 'Svaret tog for lang tid. Prøv venligst igen.' 
          });
      }
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [user, userProfile, firestore, hasConcept, currentConceptName, currentDefinition, buildHistory, checkLimit, refetchUserProfile, toast, trackUsage]);

  const startNew = useCallback(() => {
    setMessages([]);
    setCurrentConceptName('');
    setCurrentDefinition('');
    setLimitError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle URL ?term=
  useEffect(() => {
    if (urlProcessed.current || !userProfile || !firestore) return;
    const term = searchParams?.get('term');
    if (term) { 
      urlProcessed.current = true; 
      sendMessage(decodeURIComponent(term)); 
    }
  }, [searchParams, sendMessage, userProfile, firestore]);

  return (
    <div className="flex flex-col bg-slate-50/60 h-[calc(100vh-3.5rem)] md:h-screen w-full relative overflow-hidden">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200/60 px-8 py-4 z-50">
        <PageHeader
          title="Begrebsforklarer"
          subtitle="Slå faglige og juridiske begreber op og få en dybdegående akademisk forklaring."
          icon={<Brain className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <div className="flex items-center gap-3">
               <div className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Online</span>
               </div>
               
               <button 
                 onClick={() => setShowHistory(!showHistory)}
                 className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shadow-sm ${showHistory ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 shadow-sm'}`}
               >
                 <History className="w-4 h-4" />
               </button>
               
               <button 
                 onClick={startNew}
                 className="w-10 h-10 bg-white text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-100 transition-all shadow-sm active:scale-95 group flex items-center justify-center"
                 title="Start forfra"
               >
                 <RotateCcw className="w-4 h-4 group-hover:rotate-[-90deg] transition-transform duration-500" />
               </button>
            </div>
          }
        />
      </div>
      
      <HistorySidebar 
        open={showHistory} 
        onClose={() => setShowHistory(false)} 
        recent={userProfile?.recentConcepts || []}
        onSelect={(term) => {
          startNew();
          sendMessage(term);
        }}
      />

      {/* ── Main Chat Area ─────────────────────────────── */}
      <main className="grow overflow-y-auto pt-10 pb-40 px-6 bg-slate-50/60">
        <div className="max-w-3xl mx-auto space-y-12">
          
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="py-20 flex flex-col items-center text-center space-y-8"
               >
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-center text-slate-900 relative">
                     <Brain className="w-12 h-12" />
                     <div className="absolute -top-2 -right-2 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-amber-950 shadow-lg rotate-12">
                        <Sparkles className="w-5 h-5" />
                     </div>
                  </div>
                  <div className="space-y-3">
                     <h2 className="text-4xl font-black text-slate-950 serif tracking-tight">Hvad vil du forstå i dag?</h2>
                     <p className="text-slate-400 font-medium max-w-md mx-auto">Indtast et juridisk eller fagligt begreb, og lad AI'en bryde det ned for dig.</p>
                  </div>

                  {/* Suggestions */}
                  <div className="flex flex-wrap justify-center gap-3 max-w-xl">
                     {['Retssikkerhed', 'Habilitet', 'Magtfordrejning', 'Socialret', 'Forvaltningsloven'].map((term) => (
                        <button
                          key={term}
                          onClick={() => sendMessage(term)}
                          className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-slate-50/50 transition-all active:scale-95 shadow-sm"
                        >
                           {term}
                        </button>
                     ))}
                  </div>
               </motion.div>
            )}
          </AnimatePresence>

          {messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-4`}>
              {m.role === 'user' && (
                <div className="max-w-[80%] bg-slate-900 text-white px-6 py-4 rounded-xl rounded-tr-sm font-bold text-base shadow-[var(--shadow-sm)] border border-slate-800">
                  {m.text}
                </div>
              )}
              {m.role === 'concept' && <ConceptCard msg={m} onAngleClick={sendMessage} />}
              {m.role === 'followup' && <FollowUpMsg msg={m} />}
            </div>
          ))}
          
          {loading && <Thinking />}
          
          <div ref={bottomRef} className="h-10" />
        </div>
      </main>

      {/* ── Input Area ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-8 z-50 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="bg-white/90 backdrop-blur-3xl p-3 rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)] border border-slate-200/60 relative group transition-all duration-500 focus-within:ring-4 focus-within:ring-indigo-500/10"
          >
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-all duration-500">
                  <BrainCircuit className="w-6 h-6" />
               </div>
               <input
                 ref={inputRef}
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={hasConcept ? `Spørg mere om ${currentConceptName}…` : "Indtast begreb (f.eks. Habilitet)..."}
                 disabled={loading}
                 className="grow bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-bold text-lg px-2 h-14"
               />
               <button 
                 type="submit"
                 disabled={loading || !input.trim()}
                 className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-lg ${
                   loading || !input.trim() 
                   ? 'bg-slate-100 text-slate-300' 
                   : 'bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-slate-900/20'
                 }`}
               >
                 {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
               </button>
            </div>
          </form>
          
          {/* Limit indicator */}
          {['Kollega', 'Group Pro'].includes(userProfile?.membership || 'Kollega') && (
             <p className="text-center mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {Math.max(0, lim - (userProfile?.dailyConceptExplainerCount || 0))} gratis forklaringer tilbage i dag
             </p>
          )}
        </div>
      </div>

      {/* PREMIUM TEASER OVERLAY FOR FREE TIER */}
      {limitError && (
          <div className="absolute inset-0 z-[100] bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 text-center space-y-8 relative overflow-hidden"
              >
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                  </div>
                  
                  <div className="w-20 h-20 bg-slate-50 text-slate-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-slate-100 relative z-10">
                      <Brain className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-3 relative z-10">
                      <h2 className="text-3xl font-black text-slate-950 serif tracking-tight">Kollega+ Eksklusivt</h2>
                      <p className="text-slate-500 leading-relaxed italic text-sm">
                          Få fri adgang til Guiden og dyk ned i alle pensums begreber uden begrænsninger.
                      </p>
                  </div>

                  <div className="space-y-4 text-left relative z-10 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                      {[
                          "Ubegrænsede opslag på begreber",
                          "Dybdegående faglige analyser",
                          "Juridisk forankring & cases",
                          "Sokratisk dialog & sparring"
                      ].map((feat, i) => (
                          <div key={i} className="flex items-center gap-3 text-[12px] font-bold text-slate-700">
                              <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                              {feat}
                          </div>
                      ))}
                  </div>

                  <div className="space-y-4 relative z-10">
                      <button onClick={() => router.push('/upgrade')} className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 text-[12px]">
                          Opgrader til Kollega+
                      </button>
                      <button onClick={() => setLimitError(null)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em] w-full">
                          Måske senere
                      </button>
                  </div>
              </motion.div>
          </div>
      )}
    </div>
  );
}

export default function ConceptExplainerPage() {
  return (
    <Suspense>
      <ConceptChatContent />
    </Suspense>
  );
}