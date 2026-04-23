'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, BrainCircuit, Sparkles, Loader2, Send, Plus, Scale, Target, Zap, BookOpen, Quote, ChevronDown, ChevronUp, Lock, Check, History, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, writeBatch, increment, collection, serverTimestamp } from 'firebase/firestore';
import { explainConceptAction, conceptFollowUpAction } from '@/app/actions';
import type { Explanation } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import { marked } from 'marked';

// ─── Types ────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'concept' | 'followup';

interface ChatMsg {
  id: string;
  role: MsgRole;
  text?: string;          // user / followup
  explanation?: Explanation; // concept
  conceptName?: string;
}

const stripHtml = (s: string) => s?.replace(/<[^>]*>/g, '') ?? '';

// ─── Expand section ───────────────────────────────────────────────────────────

function Section({ title, icon, children, open: defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; open?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-amber-50">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-7 py-4 hover:bg-amber-50/40 transition-colors">
        <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-amber-950/40">{icon}{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-amber-200" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-200" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-7 pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Concept card (rich first-response) ──────────────────────────────────────

function ConceptCard({ msg, onAngleClick }: { msg: ChatMsg; onAngleClick: (q: string) => void }) {
  const { explanation: ex, conceptName } = msg;
  if (!ex) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400"><BrainCircuit className="w-3.5 h-3.5" /></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-950/30">Guiden</span>
      </div>
      <div className="bg-white border border-amber-100 rounded-[2rem] overflow-hidden shadow-lg shadow-amber-950/5">
        {/* Header */}
        <div className="px-7 py-5 bg-amber-950 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-950 to-amber-900" />
          <div className="relative z-10">
            <p className="text-[8px] font-black uppercase tracking-widest text-amber-400/60 mb-1">Faglig analyse</p>
            <h3 className="text-xl font-black text-white serif">{conceptName}</h3>
            {ex.etymology && <p className="text-amber-200/50 text-[10px] italic mt-1 line-clamp-1">{stripHtml(ex.etymology).substring(0, 100)}…</p>}
          </div>
        </div>

        {/* Definition */}
        <div className="px-7 py-7">
          {ex.definition ? (
            <div className="prose prose-sm prose-amber max-w-none text-slate-700 leading-relaxed font-medium serif" dangerouslySetInnerHTML={{ __html: ex.definition }} />
          ) : (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-amber-100 rounded-full w-3/4" />
              <div className="h-4 bg-amber-100 rounded-full w-full" />
              <div className="h-4 bg-amber-100 rounded-full w-5/6" />
            </div>
          )}
        </div>

        {/* Disambiguation angles */}
        {ex.disambiguation && ex.disambiguation.length > 0 && (
          <div className="px-7 pb-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-950/30 mb-2">Vælg en vinkel</p>
            <div className="flex flex-wrap gap-2">
              {ex.disambiguation.map((a, i) => (
                <button key={i} onClick={() => onAngleClick(a.query)}
                  className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-bold text-amber-950 hover:bg-amber-100 transition-colors">
                  {a.title} →
                </button>
              ))}
            </div>
          </div>
        )}

        {ex.relevance && (
          <Section title="Faglig relevans" icon={<Target className="w-3 h-3" />}>
            <div className="prose prose-sm prose-slate max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: ex.relevance }} />
          </Section>
        )}

        {ex.practicalExample && (
          <Section title="Case eksempel" icon={<Zap className="w-3 h-3" />}>
            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-600 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: ex.practicalExample }} />
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

        {ex.criticalReflection && (
          <Section title="Kritisk refleksion" icon={<BrainCircuit className="w-3 h-3" />}>
            <div className="prose prose-sm text-slate-600 italic" dangerouslySetInnerHTML={{ __html: ex.criticalReflection }} />
          </Section>
        )}

        {/* Tags row */}
        {ex.relatedConcepts && ex.relatedConcepts.length > 0 && (
          <div className="px-7 py-4 border-t border-amber-50 flex flex-wrap gap-1.5">
            {ex.relatedConcepts.map((c, i) => (
              <button key={i} onClick={() => onAngleClick(c)}
                className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-bold text-amber-800 hover:bg-amber-100 transition-colors">
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Literature */}
        {ex.suggestedLiterature && ex.suggestedLiterature.length > 0 && (
          <div className="px-7 py-5 border-t border-amber-50">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-950/30 mb-3">Anbefalet litteratur</p>
            <div className="space-y-2">
              {ex.suggestedLiterature.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <div><p className="text-[11px] font-bold text-amber-950">{b.title}</p><p className="text-[10px] text-amber-700">{b.author}</p></div>
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400"><BrainCircuit className="w-3.5 h-3.5" /></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-950/30">Guiden</span>
      </div>
      <div className="bg-white border border-amber-100 rounded-[2rem] px-7 py-6 shadow-sm min-h-[80px] flex flex-col justify-center">
        {isEmpty ? (
          <div className="flex items-center gap-2">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 bg-amber-200 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        ) : (
          <div className="prose prose-sm prose-amber max-w-none text-slate-700 leading-relaxed" 
               dangerouslySetInnerHTML={{ __html: marked.parse(msg.text || '') as string }} />
        )}
      </div>
    </motion.div>
  );
}

// ─── User bubble ──────────────────────────────────────────────────────────────

function UserBubble({ msg }: { msg: ChatMsg }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
      <div className="max-w-lg bg-amber-950 text-white rounded-[2rem] rounded-tr-lg px-6 py-4 shadow-lg">
        <p className="text-sm font-semibold leading-relaxed">{msg.text}</p>
      </div>
    </motion.div>
  );
}

// ─── Thinking dots ────────────────────────────────────────────────────────────

function Thinking() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400"><BrainCircuit className="w-3.5 h-3.5" /></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-950/30">Guiden</span>
      </div>
      <div className="bg-white border border-amber-100 rounded-[2rem] px-7 py-5 shadow-sm flex items-center gap-3">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 bg-amber-300 rounded-full"
            animate={{ y: [0, -8, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-950/25 ml-2">Analyserer…</span>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const SUGGESTIONS = ['Magtanvendelse', 'Mentalisering', 'Retssikkerhed', 'Systemisk Teori', 'Moralsk stress', 'Barnets perspektiv'];

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
            className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-[10001] flex flex-col border-l border-amber-50">
            <div className="p-6 border-b border-amber-50 flex items-center justify-between">
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                Dine opslag
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-amber-50 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {recent.length === 0 ? (
                <div className="text-center py-20 px-6">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-amber-200" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Du har ikke slået noget op endnu.</p>
                </div>
              ) : (
                recent.map((term, i) => (
                  <button key={i} onClick={() => { onSelect(term); onClose(); }}
                    className="w-full text-left p-4 hover:bg-amber-50 rounded-2xl border border-transparent hover:border-amber-100 transition-all group">
                    <p className="text-sm font-bold text-amber-950 group-hover:text-amber-900 transition-colors">{term}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1 h-1 bg-amber-400 rounded-full" />
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

// ─── User bubble ──────────────────────────────────────────────────────────────
function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 pb-20 gap-10">
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Din faglige makker
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-amber-950 serif tracking-tighter">Hvad vil du lære <span className="text-amber-400 italic">nu?</span></h2>
        <p className="mt-6 text-slate-500 font-medium max-w-md mx-auto text-sm md:text-base leading-relaxed">
          Søg på begreber fra pensum, lovgivning eller praksis. Jeg forklarer det hurtigt, præcist og pædagogisk.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onPick(s)}
            className="p-4 bg-white border border-amber-100 rounded-3xl text-xs font-bold text-amber-900 hover:border-amber-400 hover:bg-amber-50/50 hover:scale-[1.02] transition-all text-center">
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ConceptChatContent() {
  const { user, userProfile, refetchUserProfile, usageLimits } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();

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
    const tier = ['Kollega', 'Group Pro'].includes(userProfile.membership || '') ? 'Kollega' : 'Kollega+';
    const lim = usageLimits[tier]?.concepts === -1 ? Infinity : (usageLimits[tier]?.concepts ?? 1);
    const today = new Date().toDateString();
    const last = userProfile.lastConceptExplainerUsage?.toDate().toDateString();
    const count = last === today ? userProfile.dailyConceptExplainerCount || 0 : 0;
    if (count >= lim) {
      setLimitError(`Dine opslag for i dag er brugt (${lim} stk.). Opgrader til Kollega+ for fri adgang.`);
      return false;
    }
    return true;
  }, [userProfile, usageLimits]);

  const sendMessage = useCallback(async (term: string) => {
    if (!term.trim() || !user || !userProfile || !firestore) return;
    setInput('');
    setLimitError(null);
    if (!checkLimit()) return;

    const userMsg: ChatMsg = { id: Date.now().toString(), role: 'user', text: term };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      if (!hasConcept) {
        // ── First message: concept explanation ──
        setCurrentConceptName(term);
        let explanation: Explanation | null = null;
        const aiMsgId = (Date.now() + 1).toString();
        const initialAiMsg: ChatMsg = { id: aiMsgId, role: 'concept', explanation: {} as any, conceptName: term };
        setMessages(prev => [...prev, initialAiMsg]);
        
        const normalised = term.toLowerCase().trim().replace(/[^a-z0-9æøå-]/g, '-');
        const profKey = (userProfile.profession || 'socialrådgiver').toLowerCase().replace(/[^a-z0-9æøå-]/g, '-');
        const cacheKey = `cohero-explainer-${normalised}-${profKey}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          explanation = JSON.parse(cached);
        } else {
          // Check Firestore first
          const docRef = doc(firestore, 'conceptExplanations-v2', `${normalised}--${profKey}`);
          const genRef = doc(firestore, 'conceptExplanations-v2', normalised);
          const [snap1, snap2] = await Promise.all([getDoc(docRef), getDoc(genRef)]);

          if (snap1.exists()) {
            explanation = snap1.data().explanation;
          } else if (snap2.exists()) {
            explanation = snap2.data().explanation;
          } else {
            // ── Streaming fetch ──
            const flowPath = "/runAiFlow";
            const prodBaseUrl = "https://runaiflow-7pguetq4hq-uc.a.run.app";
            
            const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
              ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + flowPath)
              : (prodBaseUrl + flowPath);

            console.log(`[ConceptExplainer] Fetching from ${url}...`);
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ flowName: 'explainConceptFlow', data: { concept: term, profession: userProfile.profession || 'Socialrådgiver', stream: true }, stream: true }),
            });

            if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Server returned ${response.status}: ${errText}`);
            }

            if (!response.body) throw new Error('No response body received from server');
            
            const isStreaming = response.headers.get('Content-Type')?.includes('text/event-stream');
            
            if (!isStreaming) {
              const res = await response.json();
              explanation = res.data;
            } else {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let finalExplanation: Explanation | null = null;

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const lineData = line.substring(6).trim();
                      if (!lineData) continue;
                      const chunk = JSON.parse(lineData);
                      console.log('[ConceptExplainer] Concept chunk:', chunk);
                      
                      if (chunk.done) {
                        finalExplanation = chunk.result?.data || chunk.result;
                      } else {
                        const partialExp = chunk.output || (chunk.definition ? chunk : null);
                        if (partialExp) {
                          if (partialExp.definition) {
                            setLoading(false); 
                            setCurrentDefinition(partialExp.definition);
                          }
                          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, explanation: partialExp } : m));
                        }
                      }
                    } catch (e) {
                      console.warn('[ConceptExplainer] Stream parse error:', e);
                    }
                  }
                }
              }
              explanation = finalExplanation;
            }

            if (explanation) {
              const batch = writeBatch(firestore);
              batch.set(docRef, { conceptName: term, explanation, profession: userProfile.profession, createdAt: serverTimestamp() });
              if (!snap2.exists()) batch.set(genRef, { conceptName: term, explanation, profession: 'Generel', createdAt: serverTimestamp() });
              await batch.commit();
            }
          }
        }

        if (explanation) {
          sessionStorage.setItem(cacheKey, JSON.stringify(explanation));
          setCurrentConceptName(term);
          setCurrentDefinition(explanation.definition || '');
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, explanation: explanation! } : m));
        }

        // Track usage
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

      } else {
        // ── Follow-up: conversational streaming ──
        const aiMsgId = (Date.now() + 1).toString();
        const initialAiMsg: ChatMsg = { id: aiMsgId, role: 'followup', text: '' };
        setMessages(prev => [...prev, initialAiMsg]);

        const flowPath = "/runAiFlow";
        const prodBaseUrl = "https://runaiflow-7pguetq4hq-uc.a.run.app";
        
        const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
          ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + flowPath)
          : (prodBaseUrl + flowPath);

        const history = buildHistory();
        const safeDef = (currentDefinition || messages.find(m => m.role === 'concept')?.explanation?.definition || '').replace(/<[^>]*>/g, '');
        
        console.log(`[ConceptExplainer] Fetching followup from ${url}...`);
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            flowName: 'unifiedChatFlow', 
            data: { 
              message: term,
              chatHistory: history,
              persona: 'academic',
              context: {
                relevantDocumentIds: [],
                lawContext: `AKTUEL FAGLIG KONTEKST:\nBegreb: ${currentConceptName}\nDefinition (uddrag): ${safeDef.substring(0, 1500)}`,
              },
            }, 
            stream: true 
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Server returned ${response.status}: ${errText}`);
        }
        
        const isStreaming = response.headers.get('Content-Type')?.includes('text/event-stream');
        
        if (!isStreaming) {
          const res = await response.json();
          const answer = res.data?.answer || '';
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: answer } : m));
        } else {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const lineData = line.substring(6).trim();
                  if (!lineData) continue;
                  const chunk = JSON.parse(lineData);
                  console.log('[ConceptExplainer] Followup chunk:', chunk);
                  
                  if (chunk.done) {
                    setLoading(false);
                    const finalAnswer = chunk.result?.data?.answer || chunk.result?.answer || '';
                    if (finalAnswer) {
                      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: finalAnswer } : m));
                    }
                  } else {
                    const partialAnswer = chunk.output?.answer || chunk.answer;
                    if (partialAnswer !== undefined) {
                      setLoading(false);
                      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: partialAnswer } : m));
                    }
                  }
                } catch (e) {
                  console.warn('[ConceptExplainer] Followup stream parse error:', e);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Fejl', description: 'Noget gik galt. Prøv igen.' });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [user, userProfile, firestore, hasConcept, currentConceptName, currentDefinition, buildHistory, checkLimit, refetchUserProfile, toast]);

  const startNew = useCallback(() => {
    setMessages([]);
    setCurrentConceptName('');
    setCurrentDefinition('');
    setLimitError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Handle URL ?term=
  useEffect(() => {
    if (urlProcessed.current) return;
    const term = searchParams?.get('term');
    if (term) { urlProcessed.current = true; sendMessage(decodeURIComponent(term)); }
  }, [searchParams, sendMessage]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#FDFCF8] z-[9999]">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="shrink-0 h-16 bg-white/95 backdrop-blur-md border-b border-amber-50 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Link href="/portal" className="p-2.5 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition-all border border-amber-100">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-md">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-amber-950 leading-none">Guiden</h1>
              {currentConceptName && <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[180px]">{currentConceptName}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasConcept && (
            <button onClick={startNew}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-950 hover:bg-amber-100 transition-all">
              <Plus className="w-3.5 h-3.5" /> Nyt begreb
            </button>
          )}
          <button onClick={() => setShowHistory(!showHistory)}
            className={`p-2.5 rounded-xl border transition-all ${showHistory ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}>
            <History className="w-4 h-4" />
          </button>
          <Link href="/upgrade" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-950 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-900 transition-all">
            Opgrader
          </Link>
        </div>
      </header>
      
      <HistorySidebar 
        open={showHistory} 
        onClose={() => setShowHistory(false)} 
        recent={userProfile?.recentConcepts || []}
        onSelect={(term) => {
          startNew();
          sendMessage(term);
        }}
      />

      {/* ── Messages area ──────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-[#FDFCF8]">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 flex flex-col items-center">
          <div className="w-full max-w-2xl space-y-8">
          {messages.length === 0 && !loading && (
            <EmptyState onPick={sendMessage} />
          )}

          {messages.map(msg => (
            <div key={msg.id} className="w-full">
              {msg.role === 'user' && <UserBubble msg={msg} />}
              {msg.role === 'concept' && <ConceptCard msg={msg} onAngleClick={sendMessage} />}
              {msg.role === 'followup' && <FollowUpMsg msg={msg} />}
            </div>
          ))}

          {loading && (messages[messages.length - 1]?.role === 'user' || messages[messages.length - 1]?.role === 'followup') && <Thinking />}

          {limitError && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="max-w-lg mx-auto bg-amber-50 border-2 border-dashed border-amber-200 rounded-3xl p-8 text-center space-y-4">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm font-medium text-slate-600">{limitError}</p>
              <Link href="/upgrade" className="inline-block px-6 py-3 bg-amber-950 text-amber-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-900 transition-all">
                Lås op
              </Link>
            </motion.div>
          )}

          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-amber-50 bg-white/95 backdrop-blur-xl px-4 py-4 pb-[env(safe-area-inset-bottom,16px)]">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(input); }}
          className="max-w-3xl mx-auto flex items-center gap-3"
        >
          {hasConcept && (
            <button
              type="button"
              onClick={startNew}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-colors"
              title="Start ny samtale"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Nyt begreb</span>
            </button>
          )}
          {hasConcept && (
            <div className="hidden sm:flex shrink-0 items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-100 rounded-2xl">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 max-w-[100px] truncate">{currentConceptName}</span>
            </div>
          )}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={hasConcept ? `Spørg mere om ${currentConceptName}…` : 'Søg et begreb, stil et spørgsmål…'}
              className="w-full pl-5 pr-14 py-4 bg-white border-2 border-amber-100 rounded-2xl text-sm font-medium text-amber-950 focus:border-amber-950 focus:ring-4 focus:ring-amber-950/5 outline-none transition-all placeholder:text-slate-300"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-amber-950 text-amber-400 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
        <p className="text-center text-[9px] text-slate-300 font-medium mt-2">Guiden husker samtalen – spørg løs om begrebet</p>
      </div>
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