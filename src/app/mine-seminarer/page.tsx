'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import {
  ArrowLeft,
  BookCopy,
  Trash2,
  Loader2,
  Info,
  BrainCircuit,
  Search,
  Presentation,
  Plus,
  Tags,
  Scale,
  Wrench,
  FileText,
  CheckCircle,
  Trophy,
  ChevronRight,
  CalendarDays,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  Filter,
  ArrowUpAZ,
  ArrowDownAZ,
  Clock,
  ArrowUpDown,
  SlidersHorizontal,
  History,
  Activity,
  FileSearch,
  ArrowRight,
  Share2,
  Share,
  BookOpen,
  FolderOpen,
  Eye,
  Link as LinkIcon,
  Target
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore } from '@/firebase';
import {
  collection,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  DocumentData,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SeminarAnalysis, QuizData } from '@/ai/flows/types';
import { generateQuizAction, getUserUidByEmailAction, chatWithSeminarAction, saveQuizResultAction, generateStudyScheduleAction, generateCategoryStudyPlanAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryDeepDiveOverlay from '@/components/seminars/CategoryDeepDiveOverlay';


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface SavedSeminar extends DocumentData {
  id: string;
  overallTitle: string;
  fileName?: string;
  category?: string;
  isShared?: boolean;
  sharedWith?: string[];
  slides: (SeminarAnalysis['slides'][number] & { notes?: string })[];
  createdAt: { toDate: () => Date };
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

// ---------------------------------------------------------------------------
// Quiz Component
// ---------------------------------------------------------------------------
const QuizView: React.FC<{ quizData: QuizData; onFinish: () => void; userId: string; topic: string }> = ({ quizData, onFinish, userId, topic }) => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [userResults, setUserResults] = useState<any[]>([]);

  const q = quizData.questions[idx];
  const progress = ((idx + 1) / quizData.questions.length) * 100;

  const handleAnswer = (i: number) => {
    if (answered) return;
    const isCorrect = i === q.correctOptionIndex;
    setSelected(i);
    setAnswered(true);
    if (isCorrect) setScore(s => s + 1);

    setUserResults(prev => [...prev, {
      question: q.question,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      userAnswerIndex: i
    }]);
  };

  const handleNext = async () => {
    if (idx < quizData.questions.length - 1) {
      setIdx(i => i + 1); setSelected(null); setAnswered(false);
    } else { 
      setDone(true); 
      
      // Save results
      saveQuizResultAction({
        userId,
        result: {
          id: crypto.randomUUID(),
          lawId: '',
          lawTitle: '',
          topic: topic,
          score,
          totalQuestions: quizData.questions.length,
          results: userResults
        }
      });
    }
  };

  const getBtnClass = (i: number) => {
    if (!answered) return 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700';
    if (i === q.correctOptionIndex) return 'bg-emerald-50 border-emerald-300 text-emerald-900';
    if (i === selected) return 'bg-rose-50 border-rose-300 text-rose-900';
    return 'bg-slate-50 opacity-50 border-slate-100 text-slate-500';
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/30">
        <Trophy className="w-12 h-12 text-white" />
      </div>
      <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter uppercase serif">Quiz Fuldført!</h3>
      <p className="text-slate-500 text-lg mb-10">
        Din præstation er nu gemt i dit dashboard. Du fik <span className="font-black text-indigo-600 underline decoration-indigo-200 decoration-4">{score}</span> ud af <span className="font-bold">{quizData.questions.length}</span> rigtige.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={onFinish} className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 font-black shadow-xl shadow-slate-900/10">Afslut</Button>
        <Button variant="outline" className="rounded-2xl h-14 font-bold border-slate-200" onClick={() => { setIdx(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); setUserResults([]); }}>Prøv igen</Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Spørgsmål {idx + 1} af {quizData.questions.length}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 sm:p-10 max-w-2xl mx-auto w-full">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-8 leading-snug">{q.question}</h2>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
              className={`w-full p-4 sm:p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all duration-200 ${getBtnClass(i)}`}>
              <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center font-black text-xs border-2 
                ${answered && i === q.correctOptionIndex ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-current opacity-60'}`}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className="font-semibold text-sm sm:text-base">{opt}</span>
            </button>
          ))}
        </div>
        {answered && (
          <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-sm text-slate-600 italic mb-4">"{q.explanation}"</p>
            <Button onClick={handleNext} className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12 font-bold">
              {idx < quizData.questions.length - 1 ? 'Næste spørgsmål' : 'Se resultat'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// Seminar Chat Overlay
// ---------------------------------------------------------------------------
const SeminarChatOverlay: React.FC<{
  title: string;
  seminars: { title: string; slides: any[] }[];
  onClose: () => void;
  initialMessages?: { role: 'user' | 'assistant'; content: string }[];
  onSave?: (messages: { role: 'user' | 'assistant'; content: string }[]) => void;
}> = ({ title, seminars, onClose, initialMessages = [], onSave }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync with Firestore on every message update
  useEffect(() => {
    if (messages.length > 0 && onSave) {
        onSave(messages);
    }
  }, [messages, onSave]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { role: 'user' as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const resp = await chatWithSeminarAction({
        seminars: seminars.map(s => ({
            title: s.title || (s as any).overallTitle || 'Seminar',
            slides: (s.slides || []).map(sl => ({
                slideNumber: sl.slideNumber,
                slideTitle: sl.slideTitle || 'Slide',
                summary: sl.summary || ''
            }))
        })),
        question: text,
        chatHistory: messages
      });

      if (resp?.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: resp.data.answer }]);
        setSuggestions(resp.data.suggestedFollowUpQuestions || []);
      }
    } catch (err: any) {
       console.error(err);
       setMessages(prev => [...prev, { role: 'assistant', content: "Beklager, der skete en fejl under chatten. Prøv venligst igen senere." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, pointerEvents: 'none' }} className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden">
      <div className="absolute top-8 right-8 z-10">
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 shadow-xl border border-white/10">
           <X className="w-6 h-6" />
        </button>
      </div>

      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full h-full max-w-4xl bg-[#FDFCF8] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 relative">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-white/80 backdrop-blur-xl z-20">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 serif tracking-tight">AI Vejleder: {title}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Spørg ind til dit materiale</p>
            </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
            {messages.length === 0 && (
                <div className="py-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-white border border-slate-100 rounded-3xl flex items-center justify-center text-slate-200 mx-auto shadow-sm">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <div className="max-w-sm mx-auto">
                        <h4 className="text-lg font-black text-slate-900 serif mb-2">Hvad vil du vide?</h4>
                        <p className="text-sm text-slate-500 font-medium">Jeg har læst dit materiale og er klar til at hjælpe dig med at forstå de svære begreber eller sammenhænge.</p>
                    </div>
                </div>
            )}

            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 sm:p-6 rounded-[2rem] shadow-sm text-sm leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none font-medium'
                    }`}>
                        <div dangerouslySetInnerHTML={{ __html: m.content }} />
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tænker...</span>
                    </div>
                </div>
            )}

            {suggestions.length > 0 && !isLoading && (
                <div className="flex flex-wrap gap-2 justify-start pt-4">
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => handleSend(s)} className="px-4 py-2 bg-white/60 hover:bg-white text-indigo-600 border border-indigo-100 rounded-full text-xs font-bold transition-all hover:shadow-md">
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>

        <div className="p-6 sm:p-8 bg-white border-t border-slate-100">
            <div className="relative group">
                <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Skriv dit spørgsmål her..."
                    className="w-full h-14 pl-6 pr-16 bg-slate-50 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-100 focus:outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-slate-400"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-2 h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-90 disabled:opacity-50 disabled:grayscale"
                >
                    <ArrowUpAZ className="w-5 h-5 rotate-180" />
                </button>
            </div>
            <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest mt-4">AI kan lave fejl. Dobbelttjek vigtige informationer.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Concept List Overlay
// ---------------------------------------------------------------------------
const ConceptListOverlay: React.FC<{
  title: string;
  slides: any[];
  learnedConcepts?: string[];
  onToggleLearned?: (term: string) => void;
  onClose: () => void;
}> = ({ title, slides, learnedConcepts = [], onToggleLearned, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allConcepts = useMemo(() => {
    const map = new Map<string, { term: string; occurrences: { slideNumber: number; slideTitle: string; context: string; slideSummary: string; seminarTitle: string }[] }>();
    slides.forEach(slide => {
      (slide.keyConcepts || []).forEach((c: any) => {
        const termRaw = c.term || c.keyword || 'Ukendt begreb';
        const term = termRaw.trim();
        const occurrence = {
          slideNumber: slide.slideNumber,
          slideTitle: slide.slideTitle || 'Slide',
          context: c.context || c.explanation || 'Ingen specifik forklaring på denne slide.',
          slideSummary: slide.summary || '',
          seminarTitle: slide.seminarTitle || title
        };

        if (!map.has(term)) {
          map.set(term, { term, occurrences: [occurrence] });
        } else {
          const existing = map.get(term)!;
          if (!existing.occurrences.some(o => o.slideNumber === slide.slideNumber)) {
            existing.occurrences.push(occurrence);
            existing.occurrences.sort((a, b) => a.slideNumber - b.slideNumber);
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.term.localeCompare(b.term));
  }, [slides]);

  const filteredConcepts = useMemo(() => {
    if (!searchQuery) return allConcepts;
    const q = searchQuery.toLowerCase();
    return allConcepts.filter(c => 
      c.term.toLowerCase().includes(q) || 
      c.occurrences.some(o => o.context.toLowerCase().includes(q) || o.slideSummary.toLowerCase().includes(q))
    );
  }, [allConcepts, searchQuery]);

  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
    >
      <div className="absolute top-8 right-8 z-10">
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 shadow-xl border border-white/10">
           <X className="w-6 h-6" />
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full h-full max-w-4xl bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 relative"
      >
        <div className="p-8 sm:p-10 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shrink-0 bg-white z-20">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100 mb-2">
                    <BookOpen className="w-3 h-3" /> {allConcepts.length} Begreber
                </div>
                <h3 className="text-2xl font-black text-slate-900 serif tracking-tight">{title}</h3>
                <p className="text-xs text-slate-400 font-medium italic">Samlet liste over unikke begreber fra materialet.</p>
            </div>
            <div className="relative group w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text"
                    placeholder="Søg i begreber..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 outline-none transition-all placeholder:text-slate-400"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-4 custom-scrollbar bg-slate-50/30">
            {filteredConcepts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                        <Tags className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {searchQuery ? 'Ingen resultater matcher din søgning' : 'Ingen begreber fundet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredConcepts.map((item, idx) => {
                        const isExpanded = expandedTerm === item.term;
                        return (
                        <div key={idx} className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-200 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                            <div className="p-6 flex items-start justify-between gap-4">
                                <div 
                                    onClick={() => setExpandedTerm(isExpanded ? null : item.term)}
                                    className="flex-1 min-w-0 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className={`text-lg font-black transition-colors uppercase tracking-tight ${learnedConcepts.includes(item.term) ? 'text-emerald-600 line-through opacity-60' : 'text-slate-900 group-hover:text-indigo-600'}`}>{item.term}</h3>
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-40" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.occurrences.length} {item.occurrences.length === 1 ? 'slide' : 'slides'}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 font-medium italic">
                                        "{item.occurrences[0].context}"
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {onToggleLearned && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onToggleLearned(item.term); }}
                                            className={`p-2.5 rounded-xl border-2 transition-all active:scale-90 ${learnedConcepts.includes(item.term) ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100 text-slate-200 hover:text-emerald-500 hover:border-emerald-100'}`}
                                            title={learnedConcepts.includes(item.term) ? 'Marker som ikke lært' : 'Marker som forstået'}
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                    )}
                                    <div 
                                        onClick={() => setExpandedTerm(isExpanded ? null : item.term)}
                                        className={`w-10 h-10 rounded-full bg-slate-50 cursor-pointer flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-300'}`}
                                    >
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                            
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-slate-50 bg-slate-50/30"
                                    >
                                        <div className="p-6 space-y-6">
                                            {item.occurrences.map((occ, oIdx) => (
                                                <div key={oIdx} className="bg-white p-5 rounded-2xl border border-white shadow-sm space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <span className="text-[10px] font-black uppercase text-indigo-600">{occ.seminarTitle}</span>
                                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-[7px] font-black rounded-md uppercase tracking-widest">KILDE</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-bold text-slate-400">Slide {occ.slideNumber}</span>
                                                                <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                                <span className="text-[9px] font-bold text-slate-400">{occ.slideTitle}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">Slide-kontekst</p>
                                                        <p className="text-xs text-slate-700 font-bold leading-relaxed">
                                                            {occ.context}
                                                        </p>
                                                    </div>
                                                    <div className="pt-3 border-t border-slate-50">
                                                        <p className="text-[9px] font-black uppercase text-slate-300 mb-1">Opsummering af slide</p>
                                                        <p className="text-[11px] text-slate-500 font-medium italic leading-relaxed">
                                                            {occ.slideSummary}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-2 flex justify-end">
                                               <Link href={`/concept-explainer?term=${encodeURIComponent(item.term)}`} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1.5 transition-all hover:translate-x-1">
                                                   Slå op i Begrebsguiden <ArrowRight className="w-3 h-3" />
                                               </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )})}
                </div>
            )}
        </div>

        <div className="px-10 py-6 border-t border-slate-100 bg-white text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Cohéro Vidensarkiv • {allConcepts.length} definitioner</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Slide Feed Card
// ---------------------------------------------------------------------------
interface SlideCardProps {
  slide: any;
  note: string;
  onNoteChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  isSelected?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
}

const SlideCard = React.memo(({ slide, note, onNoteChange, isOpen, onToggle, index, isSelected, onSelect }: SlideCardProps) => {
  const MotionDiv = motion.div;
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${
        isOpen 
          ? 'border-indigo-200 shadow-2xl shadow-indigo-500/5' 
          : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-lg' : ''}`}
    >
      <div className="w-full flex items-center relative">
        {onSelect && (
          <button 
            onClick={onSelect}
            className={`absolute left-5 z-20 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
              isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 opacity-0 group-hover:opacity-100'
            }`}
          >
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </button>
        )}
        <button 
          onClick={onToggle} 
          className={`w-full h-20 flex items-center gap-6 px-6 text-left transition-colors relative ${onSelect ? 'pl-14' : ''}`}
        >
        <div className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 transition-all duration-500 ${
          isOpen 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
            : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
        }`}>
          {slide.slideNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 truncate leading-tight serif">{slide.slideTitle}</p>
          {!isOpen && <p className="text-[11px] text-slate-400 font-medium truncate mt-1 italic">{slide.summary}</p>}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {slide.keyConcepts?.length > 0 && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-400" />}
            {slide.legalFrameworks?.length > 0 && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-400" />}
            {slide.practicalTools?.length > 0 && <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400" />}
          </div>
          {note && <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><FileText className="w-3.5 h-3.5" /></div>}
          <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform duration-500 ${
            isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-300'
          }`}>
              <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </button>
    </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <MotionDiv 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: 'auto', opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} 
            className="overflow-hidden"
          >
            <div className="px-8 pb-10 space-y-8 pt-4">
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-100 rounded-full" />
                <div className="pl-6 space-y-2 pb-6">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Analytisk Resumé</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{slide.summary}</p>
                </div>
              </div>

              {slide.imageUrls && slide.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {slide.imageUrls.map((url: string, i: number) => (
                    <div key={i} className="aspect-video bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-100 relative group/img cursor-zoom-in shadow-sm hover:shadow-md transition-all" onClick={() => window.open(url, '_blank')}>
                      <img src={url} alt={`Slide content ${i}`} className="w-full h-full object-contain group-hover/img:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover/img:bg-slate-900/5 transition-colors" />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {slide.keyConcepts?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center"><Tags className="w-3.5 h-3.5" /></div> Centrale Begreber
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {slide.keyConcepts.map((c: any, i: number) => (
                        <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`}>
                          <span className="group/tag inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-pointer shadow-sm">
                            {c.term}
                            <ArrowLeft className="w-3 h-3 rotate-180 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {slide.legalFrameworks?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600">
                      <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center"><Scale className="w-3.5 h-3.5" /></div> Juridisk Ramme
                    </h4>
                    <ul className="space-y-3">
                      {slide.legalFrameworks.map((l: any, i: number) => (
                        <li key={i} className="group/item p-4 bg-rose-50/50 rounded-2xl border border-rose-100 transition-colors hover:bg-rose-50">
                          <span className="font-black text-rose-900 text-xs flex items-center gap-2 mb-1 cursor-default"><div className="w-1 h-1 rounded-full bg-rose-400" /> {l.law} {l.paragraphs?.join(', ')}</span>
                          <span className="text-[11px] text-rose-700/70 font-medium leading-relaxed block">{l.relevance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {slide.practicalTools?.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><Wrench className="w-3.5 h-3.5" /></div> Metode & Praksis
                    </h4>
                    <ul className="space-y-3">
                      {slide.practicalTools.map((t: any, i: number) => (
                        <li key={i} className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 transition-colors hover:bg-emerald-50">
                          <span className="font-black text-emerald-900 text-xs flex items-center gap-2 mb-1 cursor-default"><div className="w-1 h-1 rounded-full bg-emerald-400" /> {t.tool}</span>
                          <span className="text-[11px] text-emerald-700/70 font-medium leading-relaxed block">{t.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><FileText className="w-3.5 h-3.5" /> Mine studienoter</h4>
                    {note && <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Noter gemt</span>}
                </div>
                <div className="relative group">
                    <Textarea 
                      placeholder="Tilføj dine egne noter eller refleksioner..." 
                      value={note} 
                      onChange={e => onNoteChange(e.target.value)} 
                      className="bg-slate-50 border-transparent rounded-[1.5rem] text-xs min-h-[100px] resize-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all p-5 font-medium leading-relaxed" 
                    />
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </AnimatePresence>
    </MotionDiv>
  );
});
SlideCard.displayName = 'SlideCard';

// ---------------------------------------------------------------------------
// Seminar Detail (Feed View)
// ---------------------------------------------------------------------------
const SeminarDetailView: React.FC<{ seminar: SavedSeminar; user: any; userProfile: any; onClose: () => void }> = ({ seminar, user, userProfile, onClose }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [showConceptList, setShowConceptList] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>(() => (seminar.slides || []).reduce((acc, s) => { if (s.notes) acc[s.slideNumber] = s.notes; return acc; }, {} as Record<number, string>));
  const [debouncedNotes] = useDebounce(notes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openSlides, setOpenSlides] = useState<Set<number>>(new Set([0]));
  const [expandAll, setExpandAll] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set());
  const [isDeletingSlides, setIsDeletingSlides] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const isInitialMount = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const slides = seminar.slides || [];
  
  const handleToggleSelect = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlides(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSlides.size === slides.length) {
      setSelectedSlides(new Set());
    } else {
      setSelectedSlides(new Set(slides.map((_, i) => i)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSlides.size === 0) return;
    if (!confirm(`Er du sikker på at du vil slette ${selectedSlides.size} slides? Dette kan ikke fortrydes.`)) return;

    setIsDeletingSlides(true);
    try {
      const newSlides = slides.filter((_, i) => !selectedSlides.has(i));
      await updateDoc(doc(firestore!, 'users', user.uid, 'seminars', seminar.id), {
        slides: newSlides
      });
      setSelectedSlides(new Set());
      toast({
        title: "Slides slettet",
        description: `${selectedSlides.size} slides er blevet fjernet fra seminaret.`,
      });
    } catch (error) {
      console.error("Error deleting slides:", error);
      toast({
        title: "Fejl",
        description: "Der opstod en fejl under sletning af slides.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingSlides(false);
    }
  };

  const toggleSlide = (index: number) => setOpenSlides(prev => { const next = new Set(prev); if (next.has(index)) next.delete(index); else next.add(index); return next; });
  const handleExpandAll = () => { if (expandAll) { setOpenSlides(new Set([0])); } else { setOpenSlides(new Set(slides.map((_, i) => i))); } setExpandAll(!expandAll); };

  const handleAutoSaveNotes = useCallback(async () => {
    if (!user || !seminar.id || !firestore) return;
    setSaveStatus('saving');
    try {
      const ref = doc(firestore, 'users', user.uid, 'seminars', seminar.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setSaveStatus('idle'); return; }
      const updated = (snap.data().slides || []).map((s: any) => ({ ...s, notes: debouncedNotes[s.slideNumber] ?? s.notes ?? '' }));
      await updateDoc(ref, { slides: updated });
      setSaveStatus('saved');
    } catch { setSaveStatus('idle'); }
  }, [user, seminar.id, firestore, debouncedNotes]);

  useEffect(() => { if (isInitialMount.current) { isInitialMount.current = false; return; } handleAutoSaveNotes(); }, [debouncedNotes, handleAutoSaveNotes]);
  useEffect(() => { let t: NodeJS.Timeout; if (saveStatus === 'saved') t = setTimeout(() => setSaveStatus('idle'), 2500); return () => clearTimeout(t); }, [saveStatus]);

  const handleStartQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const contextText = slides.map(s => `Slide ${s.slideNumber}: ${s.summary}`).join('\n');
      const result = await generateQuizAction({ 
        topic: seminar.overallTitle, 
        numQuestions: 5, 
        contextText,
        profession: userProfile?.profession
      });
      setQuizData(result.data);
    } catch { toast({ title: 'Fejl', description: 'Quiz kunne ikke genereres.', variant: 'destructive' }); }
    finally { setIsGeneratingQuiz(false); }
  };

  const scrollToSlide = (index: number) => {
    setOpenSlides(prev => new Set([...Array.from(prev), index]));
    const element = document.getElementById(`slide-${index}`);
    if (element && scrollContainerRef.current) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totals = { 
    concepts: slides.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0),
    law: slides.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0),
    tools: slides.reduce((a, s) => a + (s.practicalTools?.length || 0), 0)
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 sm:top-[80px] z-[1500] bg-[#FDFCF8] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500 font-sans">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-3 sm:px-6 md:px-10 py-3 sm:py-5 flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0 h-16 sm:h-20 md:h-24 z-50 shadow-sm">
        <button onClick={quizData ? () => setQuizData(null) : onClose} className="p-2 sm:p-3 bg-white border border-slate-100 rounded-xl sm:rounded-2xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 shrink-0 shadow-sm"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-black text-slate-950 truncate text-sm sm:text-xl md:text-2xl serif tracking-tight">{seminar.overallTitle}</h2>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] flex-shrink-0 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{slides.length} slides</p>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">{seminar.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button 
            onClick={() => setReadingMode(!readingMode)}
            className={`p-2.5 sm:p-3 rounded-2xl transition-all border ${readingMode ? 'bg-slate-950 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
            title="Læse Mode"
          >
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="h-8 sm:h-10 w-px bg-slate-100 hidden xs:block" />
          <Button size="sm" variant="outline" onClick={() => setShowChat(true)} className="rounded-xl sm:rounded-2xl bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-600 h-10 sm:h-12 px-3 sm:px-6 flex items-center gap-2 transition-all text-[9px] sm:text-xs font-black tracking-widest shadow-sm">
            <BrainCircuit className="w-4 h-4" />
            <span className="hidden lg:inline">SPØRG AI</span>
          </Button>
          <Button size="sm" onClick={handleStartQuiz} disabled={isGeneratingQuiz} className="rounded-xl sm:rounded-2xl bg-slate-950 hover:bg-slate-800 text-white h-10 sm:h-12 px-3 sm:px-6 shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 group text-[9px] sm:text-xs font-black tracking-widest">
            {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
            <span className="hidden sm:inline sm:ml-1 md:ml-2 uppercase">Quiz</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDE NAV FOR SLIDES */}
        {!readingMode && !quizData && (
            <aside className="w-16 md:w-20 border-r border-slate-100 bg-white/50 backdrop-blur-sm flex flex-col items-center py-8 gap-3 overflow-y-auto hidden sm:flex shrink-0 custom-scrollbar">
                {slides.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => scrollToSlide(i)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${openSlides.has(i) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                    >
                        {s.slideNumber}
                    </button>
                ))}
            </aside>
        )}

        <AnimatePresence mode="wait">
            {quizData ? (
            <motion.div key="quiz" className="flex-1 overflow-y-auto bg-white custom-scrollbar"><QuizView userId={user.uid} topic={seminar.overallTitle} quizData={quizData} onFinish={() => setQuizData(null)} /></motion.div>
            ) : (
            <motion.div 
                key="feed" 
                ref={scrollContainerRef}
                className={`flex-1 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] ${readingMode ? 'px-4' : 'px-4 sm:px-8'}`}
            >
                <div className={`${readingMode ? 'max-w-5xl' : 'max-w-4xl'} mx-auto py-12`}>
                
                <AnimatePresence>
                    {!readingMode && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-12"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                                {[
                                    { label: 'Indhold', val: slides.length, icon: <Presentation className="w-4 h-4 sm:w-5 sm:h-5"/>, bg: 'bg-slate-950 text-white shadow-2xl shadow-slate-900/20', sub: 'Slides' },
                                    { label: 'Begreber', val: totals.concepts, icon: <Tags className="w-4 h-4 sm:w-5 sm:h-5"/>, bg: 'bg-white text-indigo-600 border border-indigo-50 shadow-sm', sub: 'Begreber' },
                                    { label: 'Love', val: totals.law, icon: <Scale className="w-4 h-4 sm:w-5 sm:h-5"/>, bg: 'bg-white text-rose-600 border border-rose-50 shadow-sm', sub: 'Love' },
                                    { label: 'Metoder', val: totals.tools, icon: <Wrench className="w-4 h-4 sm:w-5 sm:h-5"/>, bg: 'bg-white text-emerald-600 border border-emerald-50 shadow-sm', sub: 'Metoder' }
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 text-center group hover:scale-105 transition-all duration-500`}>
                                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {s.icon}
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                        </div>
                                        <p className="text-2xl sm:text-4xl font-black serif mb-0.5 sm:mb-1">{s.val}</p>
                                        <p className="text-[7px] sm:text-[9px] font-bold opacity-40 uppercase tracking-widest">{s.sub}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-8 px-4">
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Gennemgang</span>
                            <div className="w-12 h-1 bg-indigo-500 rounded-full mt-1" />
                        </div>
                        <button 
                            onClick={handleSelectAll}
                            className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-600 transition-colors tracking-widest"
                        >
                            {selectedSlides.size === slides.length ? 'Fravælg alle' : 'Vælg alle'}
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setShowConceptList(true)} className="flex items-center gap-3 px-6 py-3 bg-amber-400 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-500 active:scale-95 transition-all shadow-xl shadow-amber-400/20">
                            <BookOpen className="w-4 h-4" /> Begreber
                        </button>
                    </div>
                </div>

                <div className="space-y-6 relative">
                    {slides.map((s, i) => (
                    <div id={`slide-${i}`} key={`${s.slideNumber}-${i}`}>
                        <SlideCard 
                            slide={s} 
                            note={notes[s.slideNumber] || ''} 
                            onNoteChange={v => setNotes(prev => ({ ...prev, [s.slideNumber]: v }))} 
                            isOpen={openSlides.has(i)} 
                            onToggle={() => toggleSlide(i)} 
                            index={i}
                            isSelected={selectedSlides.has(i)}
                            onSelect={(e) => handleToggleSelect(i, e)}
                        />
                    </div>
                    ))}

                    <AnimatePresence>
                    {selectedSlides.size > 0 && (
                        <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white px-10 py-5 rounded-[2.5rem] shadow-3xl flex items-center gap-10 border border-white/5 backdrop-blur-2xl"
                        >
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Markerede slides</span>
                            <span className="text-2xl font-black serif">{selectedSlides.size} <span className="text-slate-500 font-medium">stk</span></span>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <button 
                            onClick={handleDeleteSelected}
                            disabled={isDeletingSlides}
                            className="flex items-center gap-3 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-rose-600/20"
                        >
                            {isDeletingSlides ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                            Fjern fra arkiv
                        </button>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
            {showConceptList && (
              <ConceptListOverlay 
                title={seminar.overallTitle} 
                slides={seminar.slides.map(s => ({ ...s, seminarTitle: seminar.overallTitle }))} 
                learnedConcepts={userProfile?.learnedConcepts || []}
                onToggleLearned={async (term) => {
                    if (!user || !firestore) return;
                    const learned = userProfile?.learnedConcepts || [];
                    const newLearned = learned.includes(term) ? learned.filter(t => t !== term) : [...learned, term];
                    await updateDoc(doc(firestore, 'users', user.uid), { learnedConcepts: newLearned });
                }}
                onClose={() => setShowConceptList(false)} 
              />
            )}
            {showChat && (
                <SeminarChatOverlay 
                    title={seminar.overallTitle}
                    seminars={[{ title: seminar.overallTitle, slides: seminar.slides }]}
                    onClose={() => setShowChat(false)}
                    initialMessages={seminar.chatHistory || []}
                    onSave={async (msgs) => {
                        if (!user || !firestore) return;
                        try {
                            const ref = doc(firestore, 'users', user.uid, 'seminars', seminar.id);
                            await updateDoc(ref, { chatHistory: msgs });
                        } catch (e) { console.error('Error saving chat:', e); }
                    }}
                />
            )}
          </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seminar Card
// ---------------------------------------------------------------------------
const SeminarCard: React.FC<{ seminar: SavedSeminar; onOpen: () => void; onDelete: () => void; onCategorize: (cat: string) => void; existingCategories: string[]; viewMode: 'grid' | 'list' }> = ({ seminar, onOpen, onDelete, onCategorize, existingCategories, viewMode }) => {
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [newCat, setNewCat] = useState('');
  const totalConcepts = seminar.slides?.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0) || 0;
  const date = seminar.createdAt?.toDate();

  const handleSetCat = (cat: string) => { onCategorize(cat); setShowCatPicker(false); setNewCat(''); };

  const MotionDiv = motion.div;
  const content = (
    <MotionDiv 
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="group relative h-full"
    >
      <div className="h-full bg-white rounded-[var(--radius-lg)] border border-slate-200/60 shadow-[var(--shadow-sm)] hover:shadow-md hover:border-indigo-200 transition-all duration-500 flex flex-col overflow-hidden">
        {/* Top Section */}
        <div className="p-6 sm:p-8 flex-1 cursor-pointer" onClick={onOpen}>
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-950 rounded-xl flex items-center justify-center text-indigo-400 shadow-sm group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
              <Presentation className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100/50">
              <button 
                onClick={e => { e.stopPropagation(); setShowCatPicker(!showCatPicker); }} 
                className={`p-2 rounded-lg transition-all ${seminar.category ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-300 hover:text-indigo-600' }`}
              >
                <FolderOpen className="w-4 h-4"/>
              </button>
              <button 
                onClick={e => { e.stopPropagation(); onDelete(); }} 
                className="p-2 text-slate-200 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-indigo-900 transition-colors line-clamp-2">
            {seminar.overallTitle}
          </h3>

          {seminar.category && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100/50 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              {seminar.category}
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">
            <div className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" />{date?.toLocaleDateString('da-DK')}</div>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <div>{seminar.slides?.length || 0} Slides</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-indigo-50/30 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">
              {totalConcepts} Begreber
            </span>
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
            Studér <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
      
      {showCatPicker && (
        <div className="absolute inset-0 bg-white/98 backdrop-blur-md z-30 p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200 rounded-[var(--radius-lg)]" onClick={e => e.stopPropagation()}>
            <div className="mb-6">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] text-center">Definér Kategori</p>
                <div className="relative group">
                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Ny kategori..." 
                        value={newCat}
                        onChange={e => e.target.value.length <= 20 && setNewCat(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && newCat && handleSetCat(newCat)}
                        className="w-full h-12 pl-10 pr-4 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                    />
                    {newCat && (
                        <button 
                            onClick={() => handleSetCat(newCat)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest text-center">Eksisterende kategorier</p>
                <div className="grid grid-cols-2 gap-2 h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {existingCategories.length > 0 ? existingCategories.map(c => (
                        <button key={c} onClick={() => handleSetCat(c)} className={`p-3 rounded-xl text-[10px] font-bold transition-all truncate border ${seminar.category === c ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 text-slate-600' }`}>
                            {c}
                        </button>
                    )) : <p className="col-span-2 py-8 text-[10px] text-slate-300 italic text-center">Ingen kategorier endnu</p>}
                </div>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
                <button onClick={() => handleSetCat('')} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all">Slet Kategori</button>
                <button onClick={() => setShowCatPicker(false)} className="text-[10px] font-black uppercase text-slate-300 hover:text-slate-600 px-3 py-2 transition-all">Luk</button>
            </div>
        </div>
      )}
    </MotionDiv>
  );

  if (viewMode === 'list') {
    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[var(--radius-lg)] p-4 border border-slate-200/60 shadow-[var(--shadow-sm)] hover:border-indigo-200 cursor-pointer flex items-center gap-4 group" onClick={onOpen}>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Presentation className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-900 truncate leading-snug">{seminar.overallTitle}</h3><p className="text-[10px] text-slate-400">{seminar.category || 'Ingen kategori'}</p></div>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500" />
        </motion.div>
    );
  }
  return <MotionDiv layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">{content}</MotionDiv>;
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function MineSeminarerPage() {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const [seminars, setSeminars] = useState<SavedSeminar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSeminar, setOpenSeminar] = useState<SavedSeminar | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [filterLaws, setFilterLaws] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryConceptListData, setCategoryConceptListData] = useState<{ title: string; slides: any[] } | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [categoryChatData, setCategoryChatData] = useState<{ title: string; seminars: any[] } | null>(null);
  const [showCategoryDeepDive, setShowCategoryDeepDive] = useState(false);
  const [categoryQuizData, setCategoryQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Seminar useEffect triggered. User:", user?.uid, "Firestore instance exists:", !!firestore);
    if (!user || !firestore) return;
    console.log("Setting up seminars listener for user:", user.uid, "on database: cohero-database");
    const q = query(
      collection(firestore, 'users', user.uid, 'seminars')
    );
    const unsub = onSnapshot(q, snap => { 
      console.log("Seminars snapshot received, size:", snap.size);
      setSeminars(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedSeminar))); 
      setIsLoading(false); 
    }, (error) => {
      console.error("Firestore error in MineSeminarerPage:", error);
      toast({
        title: "Database Fejl",
        description: "Kunne ikke hente dine seminarer: " + error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    });
    return () => unsub();
  }, [user, firestore]);

  const handleDelete = async (id: string) => {
    if (!user || !firestore || !window.confirm('Er du sikker?')) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'seminars', id));
    if (openSeminar?.id === id) setOpenSeminar(null);
  };

  const handleCategorize = async (id: string, cat: string) => {
    if (!user || !firestore) return;
    await updateDoc(doc(firestore, 'users', user.uid, 'seminars', id), { category: cat });
  };


  const filtered = useMemo(() => {
    let res = [...seminars];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(s => s.overallTitle.toLowerCase().includes(q) || s.slides.some(sl => sl.summary.toLowerCase().includes(q)));
    }
    if (filterLaws) res = res.filter(s => s.slides.some(sl => (sl.legalFrameworks?.length || 0) > 0));
    if (activeCategory) res = res.filter(s => s.category === activeCategory);
    
    res.sort((a, b) => {
      const timeA = a.createdAt?.toDate?.()?.getTime() || 0;
      const timeB = b.createdAt?.toDate?.()?.getTime() || 0;
      if (sortBy === 'newest') return timeB - timeA;
      if (sortBy === 'oldest') return timeA - timeB;
      return (a.overallTitle || '').localeCompare(b.overallTitle || '');
    });
    return res;
  }, [seminars, searchQuery, sortBy, filterLaws, activeCategory]);

  const categories = useMemo(() => Array.from(new Set(seminars.map(s => s.category).filter(Boolean))) as string[], [seminars]);


  const handleGenerateCategoryQuiz = async (category: string, catSeminars: any[]) => {
    setIsGeneratingQuiz(true);
    try {
        const allContext = catSeminars.flatMap(s => s.slides.map((sl: any) => `Slide ${sl.slideNumber} (${sl.slideTitle}): ${sl.summary}`)).join('\n\n');
        const res = await generateQuizAction({
            topic: `Master Quiz: ${category}`,
            numQuestions: 10,
            difficulty: 'medium',
            contextText: allContext,
            profession: userProfile?.profession
        });

        if (res?.data) {
            setCategoryQuizData(res.data);
            setShowCategoryDeepDive(false);
            toast({
                title: "Master Quiz Klar!",
                description: "Vi har genereret en quiz baseret på hele kategorien.",
            });
        }
    } catch (e) {
        toast({
            title: "Fejl",
            description: "Kunne ikke generere kategori-quizzen.",
            variant: "destructive"
        });
    } finally {
        setIsGeneratingQuiz(false);
    }
  };


  const handleGenerateStudyPlan = async (category: string, catSeminars: any[]) => {
    if (!user || !firestore) return;
    setIsGeneratingPlan(true);
    try {
        const allContext = catSeminars.flatMap(s => s.slides.map((sl: any) => `Slide ${sl.slideNumber}: ${sl.summary}`)).join('\n\n');
        const res = await generateCategoryStudyPlanAction({ 
            topic: category, 
            context: allContext 
        });

        if (res?.data) {
            const currentPlans = userProfile?.categoryStudyPlans || {};
            const updatedPlans = {
                ...currentPlans,
                [category]: {
                    plan: res.data,
                    checkedSteps: []
                }
            };

            await updateDoc(doc(firestore, 'users', user.uid), {
                categoryStudyPlans: updatedPlans
            });
            toast({
                title: "Studieplan Genereret!",
                description: "Din personlige læseplan for " + category + " er nu klar.",
            });
        }
    } catch (e: any) {
        toast({
            title: "Fejl",
            description: "Kunne ikke generere studieplanen: " + e.message,
            variant: "destructive"
        });
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const handleToggleStudyPlanStep = async (category: string, stepId: string, isChecked: boolean) => {
    if (!user || !firestore || !userProfile) return;
    const currentPlan = userProfile.categoryStudyPlans?.[category];
    if (!currentPlan) return;

    let newChecked = [...(currentPlan.checkedSteps || [])];
    if (isChecked) {
        if (!newChecked.includes(stepId)) newChecked.push(stepId);
    } else {
        newChecked = newChecked.filter(id => id !== stepId);
    }

    try {
        const currentPlans = userProfile.categoryStudyPlans || {};
        const updatedPlans = {
            ...currentPlans,
            [category]: {
                ...currentPlan,
                checkedSteps: newChecked
            }
        };

        await updateDoc(doc(firestore, 'users', user.uid), {
            categoryStudyPlans: updatedPlans
        });
    } catch (e) {
        console.error('Error toggling step:', e);
    }
  };


  const handleOpenCategoryConceptList = () => {
    if (!activeCategory) return;
    const filtered = seminars.filter(s => s.category === activeCategory);
    const allSlides = filtered.flatMap(s => s.slides.map(sl => ({ ...sl, seminarTitle: s.overallTitle })));
    setCategoryConceptListData({
        title: `${activeCategory} - Samlet Begrebsoverblik`,
        slides: allSlides
    });
  };

  const stats = useMemo(() => {
    const totalSeminars = seminars.length;
    const totalConcepts = seminars.reduce((acc, s) => acc + (s.slides?.reduce((a, sl) => a + (sl.keyConcepts?.length || 0), 0) || 0), 0);
    const totalNotes = seminars.reduce((acc, s) => acc + (s.slides?.filter(sl => sl.notes).length || 0), 0);
    return { seminars: totalSeminars, concepts: totalConcepts, notes: totalNotes };
  }, [seminars]);


  if (isLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-32">
      <main className="max-w-7xl mx-auto px-6 py-10">
        <PageHeader
          title="Mit Vidensbibliotek"
          subtitle="Organiser, repetér og få AI-indsigt i alle dine seminarer."
          icon={<BookCopy className="w-5 h-5" />}
          backHref="/portal"
          actions={
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-100 shrink-0 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
              <button 
                onClick={() => setShowStats(!showStats)} 
                className={`h-11 px-4 sm:px-5 rounded-[var(--radius-sm)] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shrink-0 ${showStats ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 shadow-sm'}`}
              >
                <Activity className="w-3.5 h-3.5" /> {showStats ? 'Skjul Statistik' : 'Statistik'}
              </button>
              <Link href="/seminar-architect" className="shrink-0">
                <Button className="rounded-[var(--radius-sm)] bg-slate-900 hover:bg-indigo-600 text-white h-11 px-6 shadow-sm text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Ny Analyse
                </Button>
              </Link>
            </div>
          }
        />

        <AnimatePresence>
            {showStats && (
                <motion.div 
                    initial={{ height: 0, opacity: 0, y: -20 }} 
                    animate={{ height: 'auto', opacity: 1, y: 0 }} 
                    exit={{ height: 0, opacity: 0, y: -20 }}
                    className="overflow-hidden mb-12"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 p-6 sm:p-10 bg-white/40 backdrop-blur-xl rounded-[var(--radius-xl)] border border-slate-200/60 shadow-[var(--shadow-sm)]">
                        {[
                            { label: 'Total Viden', val: stats.seminars, sub: 'Seminarer', icon: <Presentation className="w-5 h-5 sm:w-6 sm:h-6"/>, color: 'text-slate-950', bg: 'bg-white shadow-sm' },
                            { label: 'Begreber', val: stats.concepts, sub: 'Kortlagt viden', icon: <Tags className="w-5 h-5 sm:w-6 sm:h-6"/>, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                            { label: 'Noter', val: stats.notes, sub: 'Studienoter', icon: <FileText className="w-5 h-5 sm:w-6 sm:h-6"/>, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-4 sm:gap-6 group">
                                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${s.bg} ${s.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-500`}>{s.icon}</div>
                                <div>
                                    <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">{s.label}</p>
                                    <p className={`text-2xl sm:text-3xl font-black ${s.color}`}>{s.val}</p>
                                    <p className="text-[8px] sm:text-[10px] font-medium text-slate-400">{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="mb-8 sm:mb-10 p-1.5 sm:p-2 bg-white rounded-[var(--radius-lg)] border border-slate-200/60 shadow-[var(--shadow-sm)] flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 overflow-hidden">
            <div className="flex-1 relative w-full group">
                <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Søg i dine seminarer..." 
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full h-11 sm:h-14 pl-11 sm:pl-14 pr-4 sm:pr-6 bg-transparent rounded-lg sm:rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none" 
                />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto p-1.5 sm:p-0">
                <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block" />
                
                <select 
                    value={activeCategory || ''} 
                    onChange={e => setActiveCategory(e.target.value || null)} 
                    className="flex-1 sm:flex-none h-10 px-3 sm:px-4 bg-slate-50 border-none rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                    <option value="">Kategori</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                    {['newest', 'title'].map(s => (
                        <button 
                            key={s} onClick={() => setSortBy(s as any)} 
                            className={`px-3 sm:px-4 py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            {s === 'newest' ? 'Dato' : 'A-Z'}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => setFilterLaws(!filterLaws)} 
                    className={`h-10 px-3 sm:px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${filterLaws ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-300 hover:text-slate-600' }`}
                >
                    <Scale className="w-4 h-4" />
                </button>
            </div>
        </div>

        {activeCategory && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="mb-10 flex items-center justify-between p-6 bg-slate-900 rounded-[var(--radius-lg)] text-white shadow-[var(--shadow-sm)] relative group z-[20]"
            >
                <div className="absolute inset-0 rounded-[var(--radius-lg)] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="bg-white border border-slate-200/60 p-6 sm:p-8 rounded-[var(--radius-lg)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[var(--shadow-sm)] relative z-10 w-full">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Intelligent Kategori Analyse</p>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <h4 className="text-2xl font-black text-slate-900 serif tracking-tight">Dyk ned i {activeCategory}</h4>
                            <p className="text-xs text-slate-400 font-medium">Få et panoramasyn over dine {filtered.length} seminarer og faglige forbindelser.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={() => setShowCategoryDeepDive(true)}
                                className="flex items-center gap-2.5 px-8 py-4 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-950 shadow-sm active:scale-95 transition-all group"
                            >
                                <Target className="w-4 h-4 text-indigo-400 group-hover:scale-125 transition-transform" /> START ANALYSE
                            </button>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleOpenCategoryConceptList}
                                    className="p-4 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors border border-amber-100"
                                    title="Vis Begreber"
                                >
                                    <BookOpen className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setCategoryChatData({ title: activeCategory || '', seminars: filtered })}
                                    className="p-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    title="Chat med viden"
                                >
                                    <BrainCircuit className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
            </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {filtered.map(s => <SeminarCard key={s.id} seminar={s} viewMode={viewMode} onOpen={() => setOpenSeminar(s)} onDelete={() => handleDelete(s.id)} onCategorize={cat => handleCategorize(s.id, cat)} existingCategories={categories} />)}
        </div>

        {!isLoading && filtered.length === 0 && (
          <EmptyState
            title="Biblioteket er tomt"
            description="Der er ikke noget materiale her endnu. Start din første analyse for at se din viden tage form."
            icon={<FileSearch className="w-6 h-6 text-slate-300" />}
            actionLabel="Start første analyse"
            actionHref="/seminar-architect"
            className="my-10"
          />
        )}
      </main>

      {(() => {
          const s = seminars.find(s => s.id === openSeminar?.id);
          return s ? <SeminarDetailView seminar={s} user={user} userProfile={userProfile} onClose={() => setOpenSeminar(null)} /> : null;
      })()}
      
      <AnimatePresence>
            {showCategoryDeepDive && activeCategory && (
                <CategoryDeepDiveOverlay 
                    category={activeCategory}
                    seminars={filtered}
                    onClose={() => setShowCategoryDeepDive(false)}
                    onStartMasterQuiz={() => handleGenerateCategoryQuiz(activeCategory, filtered)}
                    userProfile={userProfile}
                    isGeneratingPlan={isGeneratingPlan}
                    onGenerateStudyPlan={() => handleGenerateStudyPlan(activeCategory, filtered)}
                    onTogglePlanStep={(stepId, isChecked) => handleToggleStudyPlanStep(activeCategory, stepId, isChecked)}
                    onOpenSeminar={(s) => {
                        setOpenSeminar(s);
                        setShowCategoryDeepDive(false);
                    }}
                    onSaveResearch={async (data) => {
                        if (!user || !firestore) return;
                        try {
                            const ref = doc(firestore, 'users', user.uid);
                            await updateDoc(ref, { 
                                [`categoryResearch.${activeCategory}`]: data 
                            });
                        } catch (e) { console.error('Error saving category research:', e); }
                    }}
                />
            )}
            {categoryConceptListData && (
                <ConceptListOverlay 
                    title={categoryConceptListData.title}
                    slides={categoryConceptListData.slides}
                    learnedConcepts={userProfile?.learnedConcepts || []}
                    onToggleLearned={async (term) => {
                        if (!user || !firestore) return;
                        const learned = userProfile?.learnedConcepts || [];
                        const newLearned = learned.includes(term) ? learned.filter(t => t !== term) : [...learned, term];
                        await updateDoc(doc(firestore, 'users', user.uid), { learnedConcepts: newLearned });
                    }}
                    onClose={() => setCategoryConceptListData(null)}
                />
            )}
            {categoryChatData && (
                <SeminarChatOverlay 
                    title={`Kategori: ${categoryChatData.title}`}
                    seminars={categoryChatData.seminars}
                    onClose={() => setCategoryChatData(null)}
                    initialMessages={userProfile?.categoryChatHistory?.[categoryChatData.title] || []}
                    onSave={async (msgs) => {
                        if (!user || !firestore) return;
                        try {
                            const ref = doc(firestore, 'users', user.uid);
                            await updateDoc(ref, { 
                                [`categoryChatHistory.${categoryChatData.title}`]: msgs 
                            });
                        } catch (e) { console.error('Error saving category chat:', e); }
                    }}
                />
            )}

            {categoryQuizData && user && (
                <div className="fixed inset-0 z-[2000] bg-[#FDFCF8] flex flex-col p-4 sm:p-10 lg:p-20 overflow-hidden">
                    <div className="absolute top-6 right-6 z-[800]">
                        <button 
                            onClick={() => {
                                if (window.confirm('Vil du afslutte quizen? Dine fremskridt gemmes kun hvis du færdiggør den.')) {
                                    setCategoryQuizData(null);
                                }
                            }} 
                            className="p-3 bg-slate-900 text-white rounded-2xl transition-all active:scale-95 shadow-xl hover:bg-slate-800"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="max-w-4xl mx-auto w-full h-full bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col relative">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl pointer-events-none" />
                        <div className="p-10 border-b border-slate-100 bg-white/80 backdrop-blur-xl shrink-0 z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 serif tracking-tight">Kategori Master Quiz</h3>
                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mt-1">{activeCategory}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto relative z-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
                            <QuizView 
                                quizData={categoryQuizData} 
                                onFinish={() => setCategoryQuizData(null)} 
                                userId={user.uid} 
                                topic={`Kategori Master Quiz: ${activeCategory}`} 
                            />
                        </div>
                    </div>
                </div>
            )}

            {isGeneratingQuiz && (
                <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center text-white">
                    <div className="absolute top-8 right-8">
                        <button onClick={() => setIsGeneratingQuiz(false)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 animate-pulse shadow-2xl">
                        <Trophy className="w-12 h-12 text-indigo-600 animate-bounce" />
                    </div>
                    <h3 className="text-3xl font-black serif mb-2">Forbereder Master Quiz...</h3>
                    <p className="text-indigo-200 font-medium max-w-sm">Vi analyserer alle dine seminarer i denne kategori og udvælger de mest relevante spørgsmål til dig.</p>
                </div>
            )}
      </AnimatePresence>
    </div>
  );
}
