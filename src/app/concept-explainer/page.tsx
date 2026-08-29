'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Brain, 
  BrainCircuit, 
  Sparkles, 
  Loader2, 
  Send, 
  Plus, 
  Scale, 
  Target, 
  Zap, 
  BookOpen, 
  Quote, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Check, 
  History, 
  X, 
  RotateCcw, 
  Copy, 
  ExternalLink,
  Server,
  Layers,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, writeBatch, increment, collection, serverTimestamp } from 'firebase/firestore';
import type { Explanation } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { marked } from 'marked';

import { 
  searchRetsinformationLawsAction, 
  explainConceptAction, 
  unifiedChatAction 
} from '@/app/actions';

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
  text?: string;
  explanation?: Partial<Explanation>;
  conceptName?: string;
}

const stripHtml = (s: string) => s?.replace(/<[^>]*>/g, '') ?? '';

// ─── Expand section ───────────────────────────────────────────────────────────

function Section({ title, icon, children, open: defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; open?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-100">
      <button 
        onClick={() => setOpen(!open)} 
        className="w-full flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 hover:bg-slate-50/70 transition-colors text-left"
      >
        <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-wider text-slate-700">
          {icon}
          {title}
        </span>
        <div className={`transition-transform duration-300 text-slate-400 ${open ? 'rotate-180 text-indigo-600' : ''}`}>
           <ChevronDown className="w-4 h-4" />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            className="overflow-hidden"
          >
            <div className="px-6 sm:px-8 pb-6 sm:pb-8">{children}</div>
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
      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all text-slate-600 hover:text-indigo-600 shrink-0 self-center shadow-sm"
      title="Kopier APA-reference"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600 animate-in fade-in zoom-in duration-200" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

// ─── Retsinformation API Section ────────────────────────────────────────────────

function RetsinformationSection({ conceptName }: { conceptName: string }) {
  const [laws, setLaws] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conceptName) return;
    let isMounted = true;
    setLoading(true);
    searchRetsinformationLawsAction(conceptName)
      .then(res => {
        if (isMounted) {
          setLaws(res.laws || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Retsinformation API error:", err);
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [conceptName]);

  if (loading) {
    return (
      <Section title="Retsinformation API — Relevante Love & Paragraffer" icon={<Scale className="w-3.5 h-3.5 text-indigo-500" />}>
        <div className="flex items-center gap-3 py-4 text-xs text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          Søger efter gældende love og relevante paragraffer hos Retsinformation...
        </div>
      </Section>
    );
  }

  if (laws.length === 0) return null;

  return (
    <Section title="Retsinformation API — Relevante Love & Paragraffer" icon={<Scale className="w-3.5 h-3.5 text-indigo-500" />} open={true}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Gældende dansk lovgivning fundet via Retsinformation ({laws.length} kilder)
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Retsinformation Verificeret
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {laws.slice(0, 5).map((law, i) => (
            <div key={i} className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between gap-3 group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/80 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3 h-3 text-indigo-500" />
                    {law.lawName || 'Gældende Lov'}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-widest">
                    Gældende Lovgivning
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                  {law.title}
                </h4>
                {law.summary && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {law.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/50 text-[10px]">
                <span className="font-semibold text-slate-400">Retsinformation API</span>
                <a
                  href={law.retsinformationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 group-hover:underline"
                >
                  Læs lovtekst hos Retsinformation <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Concept card (rich first-response) ──────────────────────────────────────

function ConceptCard({ msg, onAngleClick }: { msg: ChatMsg; onAngleClick: (q: string) => void }) {
  const { explanation: ex, conceptName } = msg;
  if (!ex) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
          <BrainCircuit className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
          Akademisk Begrebsanalyse · Leveret af ai.cohero.dk
        </span>
      </div>

      <div className="bg-white border border-slate-200/80 shadow-xl shadow-slate-200/40 rounded-3xl overflow-hidden group hover:border-indigo-200 transition-all duration-500">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-8 pb-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Søjle 4: Videnssøgning
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">{conceptName}</h3>
            {ex.etymology && (
              <p className="text-slate-500 text-xs font-medium mt-3 italic leading-relaxed">
                {stripHtml(ex.etymology)}
              </p>
            )}
          </div>
        </div>

        {/* Definition */}
        <div className="px-6 sm:px-8 py-6 sm:py-8">
          {ex.definition ? (
            <div 
              className="prose prose-sm prose-slate max-w-none text-slate-700 leading-[1.8] font-medium text-sm sm:text-base" 
              dangerouslySetInnerHTML={{ __html: marked.parse(ex.definition) as string }} 
            />
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
          <div className="px-6 sm:px-8 pb-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Udforsk flere vinkler</p>
            <div className="flex flex-wrap gap-2">
              {ex.disambiguation.map((a, i) => (
                <button 
                  key={i} 
                  onClick={() => onAngleClick(a.query)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all active:scale-95 shadow-sm"
                >
                  {a.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {ex.relevance && (
          <Section title="Faglig relevans & anvendelse" icon={<Target className="w-3.5 h-3.5 text-indigo-600" />} open={true}>
            <div 
              className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: marked.parse(ex.relevance || '') as string }} 
            />
          </Section>
        )}

        {ex.practicalExample && (
          <Section title="Praksis- & Case-eksempel" icon={<Zap className="w-3.5 h-3.5 text-amber-500" />}>
            <div 
              className="bg-slate-50 rounded-2xl p-5 text-xs text-slate-700 leading-relaxed border border-slate-200/70" 
              dangerouslySetInnerHTML={{ __html: marked.parse(ex.practicalExample || '') as string }} 
            />
          </Section>
        )}

        {/* Juridisk forankring */}
        {((ex.legalAnchor && !ex.legalAnchor.toLowerCase().includes('ingen direkte')) || (ex.legalContext && ex.legalContext.exactText)) && (
          <Section title="Juridisk forankring & Lovhjemmel" icon={<Scale className="w-3.5 h-3.5 text-indigo-600" />}>
            {ex.legalContext && ex.legalContext.exactText && (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 text-xs font-mono mb-3 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">
                  {ex.legalContext.lawTitle} {ex.legalContext.paragraphNumber}
                </span>
                <p className="mt-1 text-slate-300 italic leading-relaxed">"{ex.legalContext.exactText}"</p>
                {ex.legalContext.relevance && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-[11px] text-indigo-300">
                    {ex.legalContext.relevance}
                  </div>
                )}
              </div>
            )}
            {ex.legalAnchor && !ex.legalAnchor.toLowerCase().includes('ingen direkte') && (
              <p className="text-xs text-slate-600 font-medium leading-relaxed">{ex.legalAnchor}</p>
            )}
          </Section>
        )}

        {/* Retsinformation API Live Documents */}
        <RetsinformationSection conceptName={conceptName || ''} />

        {ex.criticalReflection && (
          <Section title="Kritisk refleksion & Dilemmaer" icon={<BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />}>
            <div 
              className="prose prose-sm text-slate-600 italic leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: marked.parse(ex.criticalReflection || '') as string }} 
            />
          </Section>
        )}

        {/* Tags row */}
        {ex.relatedConcepts && ex.relatedConcepts.length > 0 && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex flex-wrap gap-2">
            {ex.relatedConcepts.map((c, i) => (
              <button 
                key={i} 
                onClick={() => onAngleClick(c)}
                className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Literature */}
        {ex.suggestedLiterature && ex.suggestedLiterature.length > 0 && (
          <div className="px-6 sm:px-8 py-6 border-t border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Anbefalet litteratur & APA 7th</p>
            <div className="space-y-3">
              {ex.suggestedLiterature.map((b, i) => (
                <div key={i} className="flex flex-col gap-2.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{b.title}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{b.author}</p>
                    </div>
                  </div>
                  {(b.relevance || (b.chapters && b.chapters.length > 0)) && (
                    <div className="mt-1 pl-7 space-y-2">
                      {b.relevance && <p className="text-[11px] text-slate-600 leading-relaxed italic">"{b.relevance}"</p>}
                      {b.chapters && b.chapters.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {b.chapters.map((ch, j) => (
                            <span key={j} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-700">
                              {ch}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {b.apaCitation && (
                    <div className="mt-2 pl-7 flex items-start justify-between gap-3 p-3 bg-white border border-slate-200/80 rounded-xl shadow-sm">
                      <div className="text-[10px] text-slate-700 leading-relaxed font-sans pr-2">
                        <span className="font-bold text-[9px] text-indigo-600 uppercase tracking-wider block mb-1">APA 7 Reference</span>
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
          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-indigo-50/40 flex items-start gap-3">
            <Quote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm italic text-slate-700 font-medium leading-relaxed">
              "{ex.socraticQuestion}"
            </p>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm">
          <BrainCircuit className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Opfølgende Svar · ai.cohero.dk</span>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-3xl px-6 sm:px-8 py-6 sm:py-8 shadow-xl shadow-slate-200/40 min-h-[90px] flex flex-col justify-center">
        {isEmpty ? (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div 
                key={i} 
                className="w-2 h-2 bg-indigo-500 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} 
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} 
              />
            ))}
          </div>
        ) : (
          <div 
            className="prose prose-sm prose-slate max-w-none text-slate-700 leading-[1.8] font-medium text-sm sm:text-base" 
            dangerouslySetInnerHTML={{ __html: marked.parse(msg.text || '') as string }} 
          />
        )}
      </div>
    </motion.div>
  );
}

// ─── Thinking dots ────────────────────────────────────────────────────

function Thinking() {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 5);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    'Forbinder til ai.cohero.dk serveren...',
    'Konsulterer retsgrundlaget & forvaltningsret...',
    'Strukturerer den akademiske analyse...',
    'Finder praksiseksempler & APA 7th kilder...',
    'Færdiggør begrebsforklaringen...'
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-3xl w-full py-10"
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-md">
             <BrainCircuit className="w-8 h-8 text-indigo-600 animate-pulse" />
          </div>
          <div className="absolute inset-0 w-16 h-16 bg-indigo-500/10 rounded-3xl animate-ping" />
        </div>
        <div className="flex flex-col items-center gap-2">
           <div className="flex items-center gap-2">
             {[0, 1, 2].map(i => (
               <motion.div 
                 key={i} 
                 className="w-2 h-2 bg-indigo-500 rounded-full"
                 animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
                 transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} 
               />
             ))}
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
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
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[10000]" 
          />
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-[10001] flex flex-col border-l border-slate-200/80"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                Dine Begrebsopslag
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recent.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Sparkles className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Du har ikke slået noget op endnu.</p>
                </div>
              ) : (
                recent.map((term, i) => (
                  <button 
                    key={i} 
                    onClick={() => { onSelect(term); onClose(); }}
                    className="w-full text-left p-3.5 hover:bg-indigo-50/50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-all group"
                  >
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{term}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      <span className="text-[10px] font-medium text-slate-400">Gense forklaring</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100">
              <p className="text-[10px] font-medium text-slate-400 text-center leading-relaxed">
                Her gemmes dine 10 seneste opslag.<br/>Klik for at genbesøge dem.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Content Component ───────────────────────────────────────────────────

function ConceptChatContent() {
  const { user, userProfile, refetchUserProfile, usageLimits } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const isPaidUser = userProfile?.membership === 'Cohéro Student' || 
                     userProfile?.membership === 'Semesterpakken' || 
                     userProfile?.membership === 'Kollega+' || 
                     userProfile?.role === 'admin';

  const lim = isPaidUser ? Infinity : 3;

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

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const hasConcept = messages.some(m => m.role === 'concept');

  const buildHistory = useCallback(() => {
    const history: { role: 'user' | 'assistant'; content: string }[] = [];
    
    messages.forEach(m => {
      if (m.role === 'user' && m.text) {
        history.push({ role: 'user', content: m.text });
      } else if (m.role === 'followup' && m.text) {
        history.push({ role: 'assistant', content: m.text });
      } else if (m.role === 'concept' && m.explanation?.definition) {
        history.push({ 
          role: 'assistant', 
          content: `KONTEKST: Du har lige forklaret begrebet ${m.conceptName?.toUpperCase()}.\nDefinition: ${m.explanation.definition.replace(/<[^>]*>/g, '').substring(0, 1000)}` 
        });
      }
    });
    
    return history;
  }, [messages]);

  const checkLimit = useCallback(() => {
    if (isPaidUser) return true;
    const today = new Date().toDateString();
    const last = userProfile?.lastConceptExplainerUsage?.toDate?.()?.toDateString?.();
    const count = last === today ? userProfile?.dailyConceptExplainerCount || 0 : 0;
    if (count >= lim) {
      setLimitError(`Du har nået grænsen for gratis opslag i dag (${lim} stk.). Opgrader til Cohéro Student eller Semesterpakken for ubegrænset adgang.`);
      return false;
    }
    return true;
  }, [isPaidUser, userProfile, lim]);

  const trackUsage = useCallback(async (term: string) => {
    if (!user || !userProfile || !firestore) return;
    try {
      const batch = writeBatch(firestore);
      const recent = [term, ...(userProfile.recentConcepts || [])].filter((t, i, s) => s.indexOf(t) === i).slice(0, 10);
      batch.set(doc(collection(firestore, 'userActivities')), {
        userId: user.uid, 
        userName: userProfile.username || user.displayName || 'Anonym',
        actionText: `slog begrebet "${term}" op via Begrebsguiden.`, 
        createdAt: serverTimestamp(),
      });
      batch.update(doc(firestore, 'users', user.uid), {
        lastConceptExplainerUsage: serverTimestamp(),
        dailyConceptExplainerCount: increment(1),
        recentConcepts: recent,
      });
      await batch.commit();
      await refetchUserProfile();
    } catch (err) {
      console.warn('[trackUsage] Tracking non-critical error:', err);
    }
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
    scrollToBottom();

    const normalised = term.toLowerCase().trim().replace(/[^a-z0-9æøå-]/g, '-');
    const profKey = (userProfile.profession || 'socialrådgiver').toLowerCase().replace(/[^a-z0-9æøå-]/g, '-');
    const cacheKey = `cohero-explainer-${normalised}-${profKey}`;

    setLoading(true);

    try {
      if (isInitial) {
        // Check session storage cache first
        const cached = typeof window !== 'undefined' ? sessionStorage.getItem(cacheKey) : null;
        if (cached) {
          const explanation = JSON.parse(cached);
          setMessages(prev => [...prev, { id: aiMsgId, role: 'concept', explanation, conceptName: term }]);
          setCurrentDefinition(explanation.definition || '');
          setCurrentConceptName(term);
          trackUsage(term);
          setLoading(false);
          scrollToBottom();
          return;
        }

        // Check Firestore database
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
          scrollToBottom();
          return;
        }

        // Call backend flow via ai.cohero.dk
        const rawResult: any = await explainConceptAction({
          concept: term,
          profession: userProfile.profession || 'Socialrådgiver'
        });

        let explanation = (rawResult?.data?.explanation || rawResult?.data || rawResult?.explanation || rawResult) as Explanation;
        
        if (typeof explanation === 'string') {
          explanation = {
            definition: explanation,
            etymology: '',
            relevance: '',
            perspectives: [],
            examples: [],
            faq: []
          } as any;
        } else if (explanation && !explanation.definition && (explanation as any).answer) {
          explanation = {
            definition: (explanation as any).answer,
            etymology: '',
            relevance: '',
            perspectives: [],
            examples: [],
            faq: []
          } as any;
        }

        if (explanation && (explanation.definition || explanation.etymology || explanation.relevance)) {
          setMessages(prev => [...prev, { id: aiMsgId, role: 'concept', explanation, conceptName: term }]);
          setCurrentDefinition(explanation.definition || '');
          setCurrentConceptName(term);

          // Background cache save
          (async () => {
            try {
              const batch = writeBatch(firestore);
              batch.set(docRef, { conceptName: term, explanation, profession: userProfile.profession, createdAt: serverTimestamp() });
              if (!snap2.exists()) batch.set(genRef, { conceptName: term, explanation, profession: 'Generel', createdAt: serverTimestamp() });
              await batch.commit();
              sessionStorage.setItem(cacheKey, JSON.stringify(explanation));
            } catch (e) {
              console.error("Error saving concept explanation:", e);
            }
          })();
        } else {
          throw new Error("Kunne ikke generere begrebsforklaring.");
        }

        trackUsage(term);
      } else {
        // Follow-up chat via ai.cohero.dk unified chat
        const resp = await unifiedChatAction({
          message: term,
          chatHistory: buildHistory() as any,
          persona: 'kollega',
          context: {
            relevantDocumentIds: [],
            lawContext: `AKTUEL FAGLIG KONTEKST:\nBegreb: ${currentConceptName}\nDefinition: ${stripHtml(currentDefinition).substring(0, 1000)}`,
          }
        });

        const answerText = (resp as any)?.data?.answer || (resp as any)?.answer || "Beklager, jeg kunne ikke besvare spørgsmålet.";
        setMessages(prev => [...prev, { id: aiMsgId, role: 'followup', text: answerText }]);
      }
    } catch (err: any) {
      console.error('[ConceptExplainer] Error:', err);
      toast({ 
        title: "Fejl ved indlæsning", 
        description: err.message || "Der opstod en fejl ved analysen af begrebet. Prøv igen.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [user, userProfile, firestore, hasConcept, currentConceptName, currentDefinition, buildHistory, checkLimit, toast, trackUsage, scrollToBottom]);

  const startNew = useCallback(() => {
    setMessages([]);
    setCurrentConceptName('');
    setCurrentDefinition('');
    setLimitError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (urlProcessed.current || !userProfile || !firestore) return;
    const term = searchParams?.get('term');
    if (term) { 
      urlProcessed.current = true; 
      sendMessage(decodeURIComponent(term)); 
    }
  }, [searchParams, sendMessage, userProfile, firestore]);

  const suggestions = [
    'Retssikkerhed', 
    'Habilitet', 
    'Magtfordrejning', 
    'Socialret', 
    'Forvaltningsloven', 
    'Skøn under regel', 
    'Partshøring',
    'Proportionalitetsprincippet',
    'Tavshedspligt & Notatpligt'
  ];

  return (
    <div className="flex flex-col bg-[#F8FAFC] min-h-screen w-full relative">

      {/* ── Page Header ─────────────────────────────────── */}
      <div className="shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-6 sm:px-8 py-4 z-40 sticky top-0">
        <PageHeader
          title="Begrebsguide & Fagsprog"
          subtitle="Slå faglige og juridiske begreber op og få en dybdegående akademisk forklaring forankret i gældende ret."
          icon={<Brain className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
               {/* AI Server Status Badge */}
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                    ai.cohero.dk · Online
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider sm:hidden">
                    Online
                  </span>
               </div>
               
               <button 
                 onClick={() => setShowHistory(!showHistory)}
                 className={`h-10 px-3.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all shadow-sm ${
                   showHistory 
                     ? 'bg-slate-900 text-white border-slate-900' 
                     : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                 }`}
                 title="Se historik"
               >
                 <History className="w-4 h-4 text-indigo-600" />
                 <span className="hidden md:inline">Historik</span>
               </button>
               
               <button 
                 onClick={startNew}
                 className="h-10 px-3.5 bg-white text-slate-600 hover:text-indigo-600 rounded-2xl border border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all shadow-sm active:scale-95 flex items-center gap-2 text-xs font-bold"
                 title="Start forfra"
               >
                 <RotateCcw className="w-4 h-4" />
                 <span className="hidden md:inline">Nulstil</span>
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

      {/* ── Main Area ─────────────────────────────── */}
      <main className="grow overflow-y-auto pt-8 pb-48 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-10">
          
          <AnimatePresence mode="popLayout">
            {messages.length === 0 && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="py-12 sm:py-20 flex flex-col items-center text-center space-y-8"
               >
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 flex items-center justify-center text-indigo-600">
                       <Brain className="w-10 h-10 sm:w-12 sm:h-12" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-amber-400 to-amber-300 rounded-2xl flex items-center justify-center text-amber-950 shadow-md">
                       <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>

                  <div className="space-y-3 px-2">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest">
                       <Sparkles className="w-3 h-3" /> Søjle 4 · Videnssøgning & Begrebsguide
                     </span>
                     <h2 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
                       Hvad vil du forstå i dag?
                     </h2>
                     <p className="text-slate-500 font-medium max-w-lg mx-auto text-xs sm:text-sm leading-relaxed">
                       Indtast et juridisk eller fagligt begreb, og lad Cohéro AI-serveren analysere begrebet, finde lovhjemmel og opstille APA 7th kilder.
                     </p>
                  </div>

                  {/* Suggestions */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl px-2">
                     {suggestions.map((term) => (
                        <button
                          key={term}
                          onClick={() => sendMessage(term)}
                          className="px-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition-all active:scale-95 shadow-sm"
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
                <div className="max-w-[85%] bg-slate-950 text-white px-6 py-4 rounded-3xl rounded-tr-md font-bold text-sm sm:text-base shadow-xl shadow-slate-900/10 border border-slate-800">
                  {m.text}
                </div>
              )}
              {m.role === 'concept' && <ConceptCard msg={m} onAngleClick={sendMessage} />}
              {m.role === 'followup' && <FollowUpMsg msg={m} />}
            </div>
          ))}
          
          {loading && <Thinking />}
          
          <div ref={bottomRef} className="h-6" />
        </div>
      </main>

      {/* ── Floating Input Box ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-40 pointer-events-none">
        <div className="max-w-3xl mx-auto w-full pointer-events-auto">
          <form 
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="bg-white/95 backdrop-blur-2xl p-2 sm:p-2.5 rounded-3xl shadow-2xl shadow-slate-300/50 border border-slate-200/90 relative group transition-all duration-300 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400"
          >
            <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Search className="w-5 h-5" />
               </div>
               <input
                 ref={inputRef}
                 type="text"
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 placeholder={hasConcept ? `Stil opfølgende spørgsmål om ${currentConceptName}…` : "Indtast begreb (f.eks. Habilitet, Partshøring)..."}
                 disabled={loading}
                 className="grow bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-bold text-sm sm:text-base px-2 h-12 outline-none"
               />
               <button 
                 type="submit"
                 disabled={loading || !input.trim()}
                 className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md shrink-0 ${
                   loading || !input.trim() 
                   ? 'bg-slate-100 text-slate-300' 
                   : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white hover:scale-105 active:scale-95 shadow-indigo-600/20'
                 }`}
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
               </button>
            </div>
          </form>
          
          {/* Limit / Tier indicator */}
          {!isPaidUser && (
             <p className="text-center mt-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {Math.max(0, lim - (userProfile?.dailyConceptExplainerCount || 0))} gratis forklaringer tilbage i dag · <Link href="/upgrade" className="text-indigo-600 hover:underline font-extrabold">Opgrader til Semesterpakken</Link>
             </p>
          )}
        </div>
      </div>

      {/* PREMIUM UPGRADE MODAL */}
      {limitError && (
          <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 sm:p-10 text-center space-y-6 relative overflow-hidden"
              >
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                      <Brain className="w-8 h-8" />
                  </div>
                  
                  <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        Cohéro Student &bull; Ubegrænset
                      </span>
                      <h2 className="text-2xl font-black text-slate-950 tracking-tight">Få fri adgang til Begrebsguiden</h2>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        Få ubegrænsede faglige begrebsanalyser, dybdegående lovhjemmel og direkte APA 7th kildereferencer.
                      </p>
                  </div>

                  <div className="space-y-3 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      {[
                          "Ubegrænsede opslag på alle faglige begreber",
                          "Akademiske analyser via ai.cohero.dk",
                          "Retsinformation API & gældende lovgivning",
                          "Opfølgende AI-dialog og sparring"
                      ].map((feat, i) => (
                          <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-slate-700">
                              <div className="w-4 h-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[9px] font-black">✓</div>
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