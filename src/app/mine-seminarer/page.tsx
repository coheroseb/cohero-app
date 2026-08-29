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
  Target,
  Check
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
      transition={{ delay: index * 0.02 }}
      className={`group bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
        isOpen 
          ? 'border-indigo-300 shadow-md ring-1 ring-indigo-500/10' 
          : 'border-slate-200/80 shadow-sm hover:border-slate-300 hover:shadow-md'
      } ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-md' : ''}`}
    >
      <div className="w-full flex items-center relative">
        {onSelect && (
          <button 
            onClick={onSelect}
            className={`absolute left-5 z-20 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
              isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 opacity-60 hover:opacity-100'
            }`}
            title={isSelected ? "Fravælg slide" : "Vælg slide"}
          >
            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
          </button>
        )}
        <button 
          onClick={onToggle} 
          className={`w-full py-5 px-6 sm:px-7 flex items-center gap-4 text-left transition-colors relative ${onSelect ? 'pl-14' : ''}`}
        >
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 transition-all ${
            isOpen 
              ? 'bg-indigo-600 text-white shadow-sm' 
              : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'
          }`}>
            {slide.slideNumber}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 truncate text-sm sm:text-base leading-tight">
              {slide.slideTitle || `Slide ${slide.slideNumber}`}
            </h4>
            {!isOpen && slide.summary && (
              <p className="text-xs text-slate-400 font-medium truncate mt-1">
                {slide.summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              {slide.keyConcepts?.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-bold">
                  {slide.keyConcepts.length} {slide.keyConcepts.length === 1 ? 'begreb' : 'begreber'}
                </span>
              )}
              {slide.legalFrameworks?.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md text-[10px] font-bold">
                  {slide.legalFrameworks.length} lov
                </span>
              )}
              {slide.practicalTools?.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold">
                  {slide.practicalTools.length} metode
                </span>
              )}
            </div>

            {note && (
              <div className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-bold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span className="hidden xs:inline">Note</span>
              </div>
            )}

            <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center transition-transform duration-300 ${
              isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-400'
            }`}>
              <ChevronDown className="w-4 h-4" />
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
            transition={{ duration: 0.3, ease: 'easeOut' }} 
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-6 sm:p-7 space-y-6 bg-slate-50/40">
              
              {/* Summary */}
              {slide.summary && (
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Analytisk Resumé
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {slide.summary}
                  </p>
                </div>
              )}

              {/* Images */}
              {slide.imageUrls && slide.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {slide.imageUrls.map((url: string, i: number) => (
                    <div 
                      key={i} 
                      className="aspect-video bg-white rounded-2xl overflow-hidden border border-slate-200/80 relative group/img cursor-zoom-in shadow-sm hover:shadow-md transition-all" 
                      onClick={() => window.open(url, '_blank')}
                    >
                      <img src={url} alt={`Slide content ${i}`} className="w-full h-full object-contain p-2" />
                    </div>
                  ))}
                </div>
              )}

              {/* Three-column Insights: Concepts, Laws, Tools */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Concepts */}
                {slide.keyConcepts?.length > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5" /> Centrale Begreber
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {slide.keyConcepts.map((c: any, i: number) => (
                        <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`}>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all cursor-pointer">
                            {c.term}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Frameworks */}
                {slide.legalFrameworks?.length > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Juridisk Ramme
                    </h5>
                    <ul className="space-y-2">
                      {slide.legalFrameworks.map((l: any, i: number) => (
                        <li key={i} className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-100/80">
                          <p className="font-bold text-rose-900 text-xs mb-0.5">
                            {l.law} {l.paragraphs?.join(', ')}
                          </p>
                          {l.relevance && (
                            <p className="text-[11px] text-rose-700/80 leading-normal">
                              {l.relevance}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practical Tools / Methods */}
                {slide.practicalTools?.length > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Metoder & Praksis
                    </h5>
                    <ul className="space-y-2">
                      {slide.practicalTools.map((t: any, i: number) => (
                        <li key={i} className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/80">
                          <p className="font-bold text-emerald-900 text-xs mb-0.5">
                            {t.tool}
                          </p>
                          {t.description && (
                            <p className="text-[11px] text-emerald-700/80 leading-normal">
                              {t.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Study Notes */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" /> Mine Studienoter
                  </span>
                  {note && (
                    <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Noter gemmes automatisk
                    </span>
                  )}
                </div>
                <Textarea 
                  placeholder="Skriv dine personlige noter, refleksioner eller spørgsmål til dette slide..." 
                  value={note} 
                  onChange={e => onNoteChange(e.target.value)} 
                  className="bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm min-h-[90px] resize-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all p-3.5 font-medium leading-relaxed" 
                />
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
  
  const handleExpandAll = () => { 
    if (expandAll) { 
      setOpenSlides(new Set([0])); 
    } else { 
      setOpenSlides(new Set(slides.map((_, i) => i))); 
    } 
    setExpandAll(!expandAll); 
  };

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

  useEffect(() => { 
    if (isInitialMount.current) { 
      isInitialMount.current = false; 
      return; 
    } 
    handleAutoSaveNotes(); 
  }, [debouncedNotes, handleAutoSaveNotes]);

  useEffect(() => { 
    let t: NodeJS.Timeout; 
    if (saveStatus === 'saved') t = setTimeout(() => setSaveStatus('idle'), 2500); 
    return () => clearTimeout(t); 
  }, [saveStatus]);

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
    } catch { 
      toast({ title: 'Fejl', description: 'Quiz kunne ikke genereres.', variant: 'destructive' }); 
    } finally { 
      setIsGeneratingQuiz(false); 
    }
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
    <div className="fixed inset-0 z-[150] bg-[#F8FAFC] overflow-hidden flex flex-col font-sans">
      
      {/* ── Top Header ─────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200/80 px-6 sm:px-8 py-3.5 flex items-center justify-between shrink-0 z-40 shadow-sm">
        
        {/* Left: Back + Title */}
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={quizData ? () => setQuizData(null) : onClose} 
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95 shrink-0"
            title="Tilbage til oversigten"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-black text-slate-900 truncate text-base sm:text-lg tracking-tight">
                {seminar.overallTitle}
              </h2>
              {seminar.category && (
                <span className="hidden sm:inline-flex px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-md text-[10px] font-bold">
                  {seminar.category}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-0.5">
              <span>{slides.length} slides</span>
              <span>•</span>
              <span>{seminar.createdAt?.toDate ? seminar.createdAt.toDate().toLocaleDateString('da-DK') : 'Oplæg'}</span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {saveStatus === 'saving' && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gemmer noter...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <Check className="w-3.5 h-3.5" /> Noter gemt
            </span>
          )}

          <button 
            onClick={() => setReadingMode(!readingMode)}
            className={`p-2.5 rounded-xl transition-all border ${
              readingMode 
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={readingMode ? "Forlad fuldskærm" : "Læsetilstand"}
          >
            <Eye className="w-4 h-4" />
          </button>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowChat(true)} 
            className="rounded-xl bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700 h-10 px-4 flex items-center gap-2 transition-all text-xs font-bold shadow-sm"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Spørg AI</span>
          </Button>

          <Button 
            size="sm" 
            onClick={handleStartQuiz} 
            disabled={isGeneratingQuiz} 
            className="rounded-xl bg-slate-900 hover:bg-indigo-600 text-white h-10 px-4 shadow-sm transition-all flex items-center gap-2 text-xs font-bold"
          >
            {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            <span className="hidden sm:inline">Start Quiz</span>
          </Button>

          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all ml-1"
            title="Luk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Main Viewport ──────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Slide Rail / Timeline */}
        {!readingMode && !quizData && (
          <aside className="w-56 lg:w-64 border-r border-slate-200/80 bg-white flex flex-col overflow-hidden hidden sm:flex shrink-0">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Oversigt ({slides.length})
              </span>
              <button 
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
              >
                {selectedSlides.size === slides.length ? 'Fravælg alle' : 'Vælg alle'}
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {slides.map((s, i) => {
                const isOpen = openSlides.has(i);
                return (
                  <button 
                    key={i}
                    onClick={() => scrollToSlide(i)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-3 border ${
                      isOpen 
                        ? 'bg-indigo-50/80 text-indigo-900 border-indigo-200/80 shadow-sm' 
                        : 'bg-transparent text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {s.slideNumber}
                    </span>
                    <span className="truncate flex-1">
                      {s.slideTitle || `Slide ${s.slideNumber}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Content / Quiz View */}
        <AnimatePresence mode="wait">
          {quizData ? (
            <motion.div key="quiz" className="flex-1 overflow-y-auto bg-white">
              <QuizView userId={user.uid} topic={seminar.overallTitle} quizData={quizData} onFinish={() => setQuizData(null)} />
            </motion.div>
          ) : (
            <motion.div 
              key="feed" 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10 space-y-6"
            >
              <div className={`${readingMode ? 'max-w-4xl' : 'max-w-3xl'} mx-auto space-y-6`}>
                
                {/* Compact Stats & Action Bar */}
                {!readingMode && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700">
                        <Presentation className="w-3.5 h-3.5 text-slate-500" />
                        <span>{slides.length} Slides</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700">
                        <Tags className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{totals.concepts} Begreber</span>
                      </div>
                      {totals.law > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-700">
                          <Scale className="w-3.5 h-3.5 text-rose-500" />
                          <span>{totals.law} Love</span>
                        </div>
                      )}
                      {totals.tools > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700">
                          <Wrench className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{totals.tools} Metoder</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleExpandAll}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        {expandAll ? 'Fold alle ind' : 'Fold alle ud'}
                      </button>
                      <button 
                        onClick={() => setShowConceptList(true)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Begrebsoverblik</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Slides List */}
                <div className="space-y-4 relative">
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
                </div>

                {/* Floating Bulk Action Bar */}
                <AnimatePresence>
                  {selectedSlides.size > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 30, scale: 0.95 }}
                      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 border border-slate-800"
                    >
                      <span className="text-xs font-bold text-slate-300">
                        {selectedSlides.size} {selectedSlides.size === 1 ? 'slide markeret' : 'slides markerede'}
                      </span>
                      <button 
                        onClick={handleDeleteSelected}
                        disabled={isDeletingSlides}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isDeletingSlides ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        <span>Slet markerede</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Slide-over Overlays: Concepts & AI Chat ─────── */}
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
      <div className="h-full bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden">
        {/* Top Section */}
        <div className="p-6 sm:p-7 flex-1 cursor-pointer" onClick={onOpen}>
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-sm group-hover:scale-105 transition-all">
              <Presentation className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              <button 
                onClick={e => { e.stopPropagation(); setShowCatPicker(!showCatPicker); }} 
                className={`p-2 rounded-lg transition-all ${seminar.category ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-indigo-600' }`}
                title="Skift kategori"
              >
                <FolderOpen className="w-4 h-4"/>
              </button>
              <button 
                onClick={e => { e.stopPropagation(); onDelete(); }} 
                className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                title="Slet oplæg"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          </div>

          <h3 className="text-lg font-black text-slate-900 leading-snug mb-2.5 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {seminar.overallTitle}
          </h3>

          {seminar.category && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold border border-amber-200/60 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {seminar.category}
            </div>
          )}

          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
              {date ? date.toLocaleDateString('da-DK', { year: 'numeric', month: 'short' }) : 'Dato'}
            </div>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <div>{seminar.slides?.length || 0} Slides</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between group-hover:bg-indigo-50/20 transition-colors">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold">
              {totalConcepts} Begreber
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
            <span>Åbn Oplæg</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
      
      {showCatPicker && (
        <div className="absolute inset-0 bg-white/98 backdrop-blur-md z-30 p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200 rounded-3xl border border-slate-200" onClick={e => e.stopPropagation()}>
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-32">
      
      {/* ── Top Header ─────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 sticky top-0 z-30">
        <PageHeader
          title="Mine Oplæg & Seminarer"
          icon={<Presentation className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl shrink-0">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Gittervisning"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  title="Listevisning"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => setShowStats(!showStats)} 
                className={`h-11 px-4 sm:px-5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border shrink-0 ${
                  showStats 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <Activity className="w-4 h-4 text-indigo-500" /> 
                <span>{showStats ? 'Skjul Statistik' : 'Statistik'}</span>
              </button>

              <Link href="/seminar-architect" className="shrink-0">
                <Button className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white h-11 px-5 shadow-sm text-xs font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Nyt Oplæg
                </Button>
              </Link>
            </div>
          }
        />
      </div>

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 relative z-10 space-y-6">

        {/* ── Statistics Drawer ───────────────────────────── */}
        <AnimatePresence>
          {showStats && (
            <motion.div 
              initial={{ height: 0, opacity: 0, y: -10 }} 
              animate={{ height: 'auto', opacity: 1, y: 0 }} 
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
                {[
                  { label: 'Oplæg & Seminarer', val: stats.seminars, sub: 'Gemte analyser', icon: <Presentation className="w-5 h-5"/>, color: 'text-slate-950', bg: 'bg-slate-50 border border-slate-200/60' },
                  { label: 'Kortlagte Begreber', val: stats.concepts, sub: 'Faglige nøgleord', icon: <Tags className="w-5 h-5"/>, color: 'text-indigo-600', bg: 'bg-indigo-50/60 border border-indigo-100' },
                  { label: 'Studienoter', val: stats.notes, sub: 'Egne notater', icon: <FileText className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-50/60 border border-emerald-100' }
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center shrink-0`}>
                      {s.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
                      <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                      <p className="text-[10px] font-medium text-slate-400">{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search & Filter Toolbar ─────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Søg i dine oplæg, emner, slides eller noter..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full h-12 pl-11 pr-10 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                {['newest', 'title'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setSortBy(s as any)} 
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      sortBy === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {s === 'newest' ? 'Nyeste' : 'A-Å'}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setFilterLaws(!filterLaws)} 
                className={`h-10 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 ${
                  filterLaws 
                    ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm' 
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                }`}
                title="Filtrer oplæg med lovstof"
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lovstof</span>
              </button>
            </div>
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  activeCategory === null
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                Alle kategorier ({seminars.length})
              </button>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(activeCategory === c ? null : c)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                    activeCategory === c
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {c} ({seminars.filter(s => s.category === c).length})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Active Category Deep Dive Banner ────────────── */}
        {activeCategory && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white rounded-3xl border border-indigo-200/80 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                  Kategori-overblik
                </span>
                <span className="text-xs font-bold text-slate-400">• {filtered.length} oplæg</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 leading-tight">Dyk ned i {activeCategory}</h4>
              <p className="text-xs text-slate-500 font-medium">Se begrebssammenhænge, kør en master quiz eller chat med hele emnet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button 
                onClick={() => setShowCategoryDeepDive(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-indigo-600 shadow-sm active:scale-95 transition-all"
              >
                <Target className="w-4 h-4 text-indigo-400" /> 
                <span>Kategori Analyse</span>
              </button>
              <button 
                onClick={handleOpenCategoryConceptList}
                className="p-2.5 bg-amber-50 text-amber-700 rounded-2xl hover:bg-amber-100 transition-colors border border-amber-200/60"
                title="Vis Begreber for kategorien"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCategoryChatData({ title: activeCategory || '', seminars: filtered })}
                className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition-colors border border-indigo-200/60"
                title="Chat med viden i kategorien"
              >
                <BrainCircuit className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Seminar Cards Grid ──────────────────────────── */}
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {filtered.map(s => (
            <SeminarCard 
              key={s.id} 
              seminar={s} 
              viewMode={viewMode} 
              onOpen={() => setOpenSeminar(s)} 
              onDelete={() => handleDelete(s.id)} 
              onCategorize={cat => handleCategorize(s.id, cat)} 
              existingCategories={categories} 
            />
          ))}
        </div>

        {/* ── Empty State ─────────────────────────────────── */}
        {!isLoading && filtered.length === 0 && (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8">
            <Presentation className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">
                {searchQuery || activeCategory ? 'Ingen oplæg matchede din søgning' : 'Dit oplægsarkiv er tomt'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || activeCategory 
                  ? 'Prøv at nulstille søgefeltet eller fjerne kategorifilteret.'
                  : 'Upload og analyser dine PowerPoint- og PDF-slides i Oplægsarkitekten for at få dem struktureret her.'}
              </p>
            </div>
            {!searchQuery && !activeCategory && (
              <Link href="/seminar-architect" className="inline-block pt-2">
                <Button className="rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white h-11 px-6 text-xs font-black uppercase tracking-wider">
                  <Plus className="w-4 h-4 mr-2" /> Start første oplægsanalyse
                </Button>
              </Link>
            )}
          </div>
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
