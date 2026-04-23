'use client';

import React, { useState, useCallback, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Brain, BrainCircuit, Sparkles, Loader2, Send, Plus, Scale, Target, Zap, BookOpen, Quote, ChevronDown, ChevronUp, Lock, Check, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, writeBatch, increment, collection, serverTimestamp } from 'firebase/firestore';
import { explainConceptAction, conceptFollowUpAction } from '@/app/actions';
import type { Explanation } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';

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
          <div className="prose prose-sm prose-amber max-w-none text-slate-700 leading-relaxed font-medium serif" dangerouslySetInnerHTML={{ __html: ex.definition }} />
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

        {(ex.legalAnchor || ex.legalContext) && (
          <Section title="Juridisk forankring" icon={<Scale className="w-3 h-3" />}>
            {ex.legalContext && (
              <div className="bg-amber-950 text-amber-100 rounded-2xl p-4 text-xs font-mono mb-3">
                <span className="text-amber-400 font-bold">{ex.legalContext.lawTitle} {ex.legalContext.paragraphNumber}</span>
                <p className="mt-2 text-amber-200/70 italic">{ex.legalContext.exactText}</p>
              </div>
            )}
            {ex.legalAnchor && <p className="text-xs text-slate-600">{ex.legalAnchor}</p>}
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
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400"><BrainCircuit className="w-3.5 h-3.5" /></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-amber-950/30">Guiden</span>
      </div>
      <div className="bg-white border border-amber-100 rounded-[2rem] px-7 py-6 shadow-sm">
        <div className="prose prose-sm prose-amber max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text || '' }} />
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

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center px-6 pb-20 gap-10">
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Din faglige makker
        </div>
        <h2 className="text-5xl md:text-7xl font-black text-amber-950 serif tracking-tighter">Hvad vil du lære <span className="text-amber-400 italic">nu?</span></h2>
        <p className="text-slate-500 font-medium italic mt-4 max-w-md mx-auto">Søg et begreb, stil et spørgsmål eller beskriv en situation. Guiden besvarer alt.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => onPick(s)}
            className="px-5 py-3 bg-white border border-amber-100 rounded-2xl text-xs font-bold text-amber-950 hover:border-amber-950 hover:shadow-lg transition-all">
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
  const buildHistory = useCallback(() =>
    messages
      .filter(m => m.role !== 'concept')
      .map(m => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text || '',
      })),
    [messages]
  );

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
        // ── First message: full concept explanation ──
        const normalised = term.toLowerCase().trim().replace(/[^a-z0-9æøå-]/g, '-');
        const profKey = (userProfile.profession || 'socialrådgiver').toLowerCase().replace(/[^a-z0-9æøå-]/g, '-');
        const cacheKey = `cohero-explainer-${normalised}-${profKey}`;

        let explanation: Explanation | null = null;

        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          explanation = JSON.parse(cached);
        } else {
          const docRef = doc(firestore, 'conceptExplanations-v2', `${normalised}--${profKey}`);
          const genRef = doc(firestore, 'conceptExplanations-v2', normalised);
          const [snap1, snap2] = await Promise.all([getDoc(docRef), getDoc(genRef)]);

          if (snap1.exists()) {
            explanation = snap1.data().explanation;
          } else if (snap2.exists()) {
            explanation = snap2.data().explanation;
          } else {
            const res = await explainConceptAction({ concept: term, profession: userProfile.profession || 'Socialrådgiver' });
            explanation = res.data;
            const saveData = { conceptName: term, explanation, profession: userProfile.profession, createdAt: serverTimestamp() };
            const batch = writeBatch(firestore);
            batch.set(docRef, saveData);
            if (!snap2.exists()) batch.set(genRef, { ...saveData, profession: 'Generel' });
            await batch.commit();
          }

          sessionStorage.setItem(cacheKey, JSON.stringify(explanation));
        }

        setCurrentConceptName(term);
        setCurrentDefinition(explanation?.definition || '');

        const aiMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: 'concept', explanation: explanation!, conceptName: term };
        setMessages(prev => [...prev, aiMsg]);

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
        // ── Follow-up: conversational ──
        const res = await conceptFollowUpAction({
          message: term,
          conceptName: currentConceptName,
          conceptDefinition: currentDefinition,
          chatHistory: buildHistory(),
          profession: userProfile.profession,
        });
        const aiMsg: ChatMsg = { id: (Date.now() + 1).toString(), role: 'followup', text: res.data.answer };
        setMessages(prev => [...prev, aiMsg]);
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
    <div className="fixed inset-0 flex flex-col bg-[#FDFCF8] z-[100]">

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

      {/* ── Messages area ──────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          {messages.length === 0 && !loading && (
            <EmptyState onPick={sendMessage} />
          )}

          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'user' && <UserBubble msg={msg} />}
              {msg.role === 'concept' && <ConceptCard msg={msg} onAngleClick={sendMessage} />}
              {msg.role === 'followup' && <FollowUpMsg msg={msg} />}
            </div>
          ))}

          {loading && <Thinking />}

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