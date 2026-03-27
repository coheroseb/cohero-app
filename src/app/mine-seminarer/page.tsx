'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Calendar,
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
  Link as LinkIcon
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
import { generateQuizAction, getUserUidByEmailAction, chatWithSeminarAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SavedSeminar extends DocumentData {
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
const QuizView: React.FC<{ quizData: QuizData; onFinish: () => void }> = ({ quizData, onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = quizData.questions[idx];
  const progress = ((idx + 1) / quizData.questions.length) * 100;

  const handleAnswer = (i: number) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correctOptionIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (idx < quizData.questions.length - 1) {
      setIdx(i => i + 1); setSelected(null); setAnswered(false);
    } else { setDone(true); }
  };

  const getBtnClass = (i: number) => {
    if (!answered) return 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700';
    if (i === q.correctOptionIndex) return 'bg-emerald-50 border-emerald-300 text-emerald-900';
    if (i === selected) return 'bg-rose-50 border-rose-300 text-rose-900';
    return 'bg-slate-50 opacity-50 border-slate-100 text-slate-500';
  };

  if (done) return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/30">
        <Trophy className="w-12 h-12 text-white" />
      </div>
      <h3 className="text-3xl font-black text-slate-900 mb-3">Quiz Fuldført!</h3>
      <p className="text-slate-500 text-lg mb-10">
        Du fik <span className="font-black text-indigo-600">{score}</span> ud af <span className="font-bold">{quizData.questions.length}</span> rigtige.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button size="lg" onClick={onFinish} className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-14 font-black">Afslut</Button>
        <Button variant="outline" className="rounded-2xl h-14 font-bold" onClick={() => { setIdx(0); setSelected(null); setAnswered(false); setScore(0); setDone(false); }}>Prøv igen</Button>
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
// Mindmap Overlay
// ---------------------------------------------------------------------------
const MindmapOverlay: React.FC<{
  seminar: SavedSeminar;
  onClose: () => void;
}> = ({ seminar, onClose }) => {
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const conceptSlides = (seminar.slides || []).filter(s => (s.keyConcepts?.length || 0) > 0);
  const totalConcepts = conceptSlides.reduce((acc, s) => acc + (s.keyConcepts?.length || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
    >
      <div className="absolute top-8 right-8 z-10">
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 shadow-xl border border-white/10">
           <X className="w-6 h-6" />
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full h-full max-w-7xl bg-[#FDFCF8] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20 relative"
      >
        <div className="p-8 sm:p-12 border-b border-slate-100 flex items-center justify-between shrink-0 relative bg-white/80 backdrop-blur-xl z-20">
            <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 mb-2">
                    <Share2 className="w-3 h-3" /> Relationskort
                </div>
                <h3 className="text-3xl font-black text-slate-900 serif tracking-tight">{seminar.overallTitle}</h3>
                <p className="text-xs text-slate-400 font-medium italic">Visuelt overblik over {totalConcepts} begreber fordelt på {conceptSlides.length} kerneslides.</p>
            </div>
            
            <div className="hidden md:flex gap-6">
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                    <p className="text-sm font-black text-emerald-500">Fuldt kortlagt</p>
                </div>
            </div>
        </div>

        <div className="flex-1 relative overflow-auto custom-scrollbar flex items-center justify-center min-h-[600px] bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
             <div className="relative w-[1400px] h-[1000px] flex items-center justify-center pointer-events-auto">
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                   {conceptSlides.map((slide, idx) => {
                      const angle = (idx / conceptSlides.length) * 2 * Math.PI;
                      const xNode = 700 + Math.cos(angle) * 320;
                      const yNode = 500 + Math.sin(angle) * 320;
                      
                      return (
                        <g key={`${slide.slideNumber}-${idx}`}>
                            <motion.line 
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: idx * 0.1 }}
                                x1="700" y1="500" x2={xNode} y2={yNode} 
                                stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6"
                            />
                            {(slide.keyConcepts || []).map((_, cIdx) => {
                                const subAngle = angle - 0.4 + (cIdx / Math.max(1, (slide.keyConcepts?.length || 1) - 1)) * 0.8;
                                const xSub = xNode + Math.cos(subAngle) * 160;
                                const ySub = yNode + Math.sin(subAngle) * 160;
                                return (
                                    <motion.line 
                                        key={cIdx}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 0.4 }}
                                        transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                                        x1={xNode} y1={yNode} x2={xSub} y2={ySub} 
                                        stroke="#818cf8" strokeWidth="1"
                                    />
                                );
                            })}
                        </g>
                      );
                   })}
                </svg>

                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-[450px] left-[650px] w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl z-30 border-8 border-[#FDFCF8]"
                >
                    <BookOpen className="w-10 h-10 relative z-10" />
                </motion.div>

                {conceptSlides.map((slide, idx) => {
                    const angle = (idx / conceptSlides.length) * 2 * Math.PI;
                    const xNode = 700 + Math.cos(angle) * 320;
                    const yNode = 500 + Math.sin(angle) * 320;
                    const isActive = activeSlide === idx;

                    return (
                        <div key={`${slide.slideNumber}-${idx}`} className="contents">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onMouseEnter={() => setActiveSlide(idx)}
                                onMouseLeave={() => setActiveSlide(null)}
                                style={{ top: yNode - 45, left: xNode - 110 }}
                                className={`absolute w-[220px] p-4 text-center transition-all cursor-default z-20 ${isActive ? 'scale-110' : ''}`}
                            >
                                <div className={`mb-3 mx-auto w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-md ${isActive ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    {slide.slideNumber}
                                </div>
                                <span className={`text-[11px] font-black uppercase tracking-widest transition-colors block leading-tight ${isActive ? 'text-indigo-600 font-black' : 'text-slate-500 font-bold'}`}>
                                    {slide.slideTitle}
                                </span>
                            </motion.div>

                            {(slide.keyConcepts || []).map((concept: any, cIdx: number) => {
                                const subAngle = angle - 0.4 + (cIdx / Math.max(1, (slide.keyConcepts?.length || 1) - 1)) * 0.8;
                                const xSub = xNode + Math.cos(subAngle) * 160;
                                const ySub = yNode + Math.sin(subAngle) * 160;

                                return (
                                    <motion.div
                                        key={cIdx}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.8 + idx * 0.05 + cIdx * 0.02 }}
                                        style={{ top: ySub - 22, left: xSub - 60 }}
                                        className="absolute w-[130px] z-10"
                                    >
                                        <Link href={`/concept-explainer?term=${encodeURIComponent(concept.term)}`}>
                                            <div className={`group/node bg-white border rounded-xl px-3 py-2.5 shadow-sm transition-all cursor-pointer text-center ${isActive ? 'border-indigo-200 shadow-indigo-100 ring-4 ring-indigo-50/50' : 'border-slate-100 hover:border-indigo-400 hover:shadow-lg'}`}>
                                                <p className="text-[11px] font-bold text-slate-800 truncate leading-tight group-hover/node:text-indigo-600">{concept.term}</p>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    );
                })}
             </div>
        </div>

        <div className="px-12 py-8 border-t border-slate-100 flex items-center justify-between text-[11px] bg-white z-20 shrink-0">
             <div className="flex gap-8">
                <div className="flex items-center gap-2.5 font-bold text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-slate-900" /> {seminar.overallTitle}</div>
                <div className="flex items-center gap-2.5 font-bold text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-lg shadow-indigo-200" /> Slides</div>
                <div className="flex items-center gap-2.5 font-bold text-slate-600"><div className="w-2.5 h-2.5 rounded-full bg-indigo-50 border border-indigo-200" /> Begreber</div>
             </div>
             <p className="text-slate-400 font-bold flex items-center gap-2">
                <ArrowDownAZ className="w-3.5 h-3.5" /> Klik på et begreb for at lære mere i Begrebsguiden
             </p>
        </div>
      </motion.div>
    </motion.div>
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden">
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
  onClose: () => void;
}> = ({ title, slides, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allConcepts = useMemo(() => {
    const map = new Map<string, { term: string; context: string; slideNumbers: number[] }>();
    slides.forEach(slide => {
      (slide.keyConcepts || []).forEach((c: any) => {
        const termRaw = c.term || c.keyword || 'Ukendt begreb';
        const term = termRaw.trim();
        if (!map.has(term)) {
          map.set(term, { 
            term, 
            context: c.context || c.explanation || 'Ingen forklaring tilgængelig.', 
            slideNumbers: [slide.slideNumber] 
          });
        } else {
          const existing = map.get(term)!;
          if (!existing.slideNumbers.includes(slide.slideNumber)) {
            existing.slideNumbers.push(slide.slideNumber);
            existing.slideNumbers.sort((a, b) => a - b);
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.term.localeCompare(b.term));
  }, [slides]);

  const filteredConcepts = useMemo(() => {
    if (!searchQuery) return allConcepts;
    const q = searchQuery.toLowerCase();
    return allConcepts.filter(c => c.term.toLowerCase().includes(q) || c.context.toLowerCase().includes(q));
  }, [allConcepts, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-hidden"
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
                    {filteredConcepts.map((item, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.term}</h4>
                                <div className="flex gap-1.5 flex-wrap justify-end max-w-[120px]">
                                    {item.slideNumbers.map(n => (
                                        <span key={n} className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-md">Slide {n}</span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.context}</p>
                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-end">
                                <Link href={`/concept-explainer?term=${encodeURIComponent(item.term)}`} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1.5">
                                    Slå op i Begrebsguiden <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        </div>
                    ))}
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

function SlideCard({ slide, note, onNoteChange, isOpen, onToggle, index, isSelected, onSelect }: SlideCardProps) {
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
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500 ${
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
          <div className="hidden sm:flex items-center gap-2">
            {slide.keyConcepts?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            {slide.legalFrameworks?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
            {slide.practicalTools?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            {slide.imageUrls?.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
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
}

// ---------------------------------------------------------------------------
// Seminar Detail (Feed View)
// ---------------------------------------------------------------------------
const SeminarDetailView: React.FC<{ seminar: SavedSeminar; user: any; userProfile: any; onClose: () => void }> = ({ seminar, user, userProfile, onClose }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeSlide, setActiveSlide] = useState<number | null>(null);
  const [showMindmap, setShowMindmap] = useState(false);
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
  const isInitialMount = useRef(true);

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
      const result = await generateQuizAction({ topic: seminar.overallTitle, numQuestions: 5, contextText });
      setQuizData(result.data);
    } catch { toast({ title: 'Fejl', description: 'Quiz kunne ikke genereres.', variant: 'destructive' }); }
    finally { setIsGeneratingQuiz(false); }
  };

  const totals = { 
    concepts: slides.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0),
    law: slides.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0),
    tools: slides.reduce((a, s) => a + (s.practicalTools?.length || 0), 0)
  };

  const isPremium = useMemo(() => {
    if (!userProfile) return false;
    if (userProfile.isQualified) return true;
    return ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
  }, [userProfile]);


  return (
    <div className="fixed inset-x-0 bottom-0 top-0 sm:top-[80px] z-[200] bg-[#FDFCF8] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-3 sm:px-6 md:px-10 py-3 sm:py-5 flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0 h-14 sm:h-16 md:h-24">
        <button onClick={quizData ? () => setQuizData(null) : onClose} className="p-2 sm:p-3 bg-slate-50 rounded-lg sm:rounded-[1.25rem] text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 shrink-0 shadow-sm border border-slate-100"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5"><h2 className="font-black text-slate-900 truncate text-xs sm:text-lg md:text-lg serif tracking-tight">{seminar.overallTitle}</h2><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 flex-shrink-0" /></div>
          <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 line-clamp-1">{slides.length} slides · {seminar.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
          {saveStatus === 'saved' && <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1 whitespace-nowrap hidden sm:flex"><CheckCircle className="w-3 h-3" /> Gemt</span>}
          <Button size="sm" variant="outline" onClick={() => setShowMindmap(true)} className="rounded-lg sm:rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 h-8 sm:h-10 md:h-12 px-2 sm:px-4 md:px-6 hidden sm:flex items-center gap-1 sm:gap-2 transition-all text-[10px] sm:text-[12px] md:text-[14px]"><Sparkles className="w-3.5 h-3.5 sm:w-4 md:w-4" /><span className="hidden md:inline">RELATIONSKORT</span></Button>
          <Button size="sm" variant="outline" onClick={() => setShowChat(true)} className="rounded-lg sm:rounded-2xl bg-indigo-50 border-indigo-100 hover:bg-indigo-100 text-indigo-600 h-8 sm:h-10 md:h-12 px-2 sm:px-4 md:px-6 flex items-center gap-1 sm:gap-2 transition-all text-[10px] sm:text-[12px] md:text-[14px]">
            <BrainCircuit className="w-3.5 h-3.5 sm:w-4 md:w-4" />
            <span className="md:inline">CHAT MED AI</span>
          </Button>
          <Button size="sm" onClick={handleStartQuiz} disabled={isGeneratingQuiz} className="rounded-lg sm:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white h-8 sm:h-10 md:h-12 px-2 sm:px-4 md:px-6 shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 group text-[10px] sm:text-[12px] md:text-[14px]">
            {isGeneratingQuiz ? <Loader2 className="w-3 h-3 sm:w-4 md:w-4 animate-spin" /> : <Trophy className="w-3.5 h-3.5 sm:w-4 md:w-4 group-hover:rotate-12 transition-transform" />}
            <span className="hidden sm:inline md:ml-2">TAG QUIZ</span>
          </Button>
        </div>
      </header>
      <AnimatePresence mode="wait">
        {quizData ? (
          <motion.div key="quiz" className="flex-1 overflow-y-auto bg-white"><QuizView quizData={quizData} onFinish={() => setQuizData(null)} /></motion.div>
        ) : (
          <motion.div key="feed" className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Indhold', val: slides.length, icon: <Presentation className="w-4 h-4"/>, color: 'bg-slate-900 text-white' },
                  { label: 'Begreber', val: totals.concepts, icon: <Tags className="w-4 h-4"/>, color: 'bg-indigo-50 text-indigo-700' },
                  { label: 'Love', val: totals.law, icon: <Scale className="w-4 h-4"/>, color: 'bg-rose-50 text-rose-700' },
                  { label: 'Metoder', val: totals.tools, icon: <Wrench className="w-4 h-4"/>, color: 'bg-emerald-50 text-emerald-700' }
                ].map(s => (
                  <div key={s.label} className={`${s.color} rounded-[2rem] p-5 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-2 opacity-60">{s.icon}<span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span></div>
                    <p className="text-3xl font-black serif">{s.val}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gennemgang</p>
                  <button 
                    onClick={handleSelectAll}
                    className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {selectedSlides.size === slides.length ? 'Fravælg alle' : 'Vælg alle'}
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowMindmap(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/10 border-b-4 border-indigo-800">
                    <BrainCircuit className="w-4 h-4" /> Relationskort
                  </button>
                  <button onClick={() => setShowConceptList(true)} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-lg shadow-amber-600/10 border-b-4 border-amber-700">
                    <BookOpen className="w-4 h-4" /> Begreber
                  </button>
                </div>
              </div>

              <div className="space-y-4 relative">
                {slides.map((s, i) => (
                  <SlideCard 
                    key={`${s.slideNumber}-${i}`} 
                    slide={s} 
                    note={notes[s.slideNumber] || ''} 
                    onNoteChange={v => setNotes(prev => ({ ...prev, [s.slideNumber]: v }))} 
                    isOpen={openSlides.has(i)} 
                    onToggle={() => toggleSlide(i)} 
                    index={i}
                    isSelected={selectedSlides.has(i)}
                    onSelect={(e) => handleToggleSelect(i, e)}
                  />
                ))}

                <AnimatePresence>
                  {selectedSlides.size > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.9 }}
                      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-8 border border-slate-800"
                    >
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valgt</span>
                        <span className="text-xl font-black serif">{selectedSlides.size} {selectedSlides.size === 1 ? 'slide' : 'slides'}</span>
                      </div>
                      <div className="w-px h-10 bg-slate-800" />
                      <button 
                        onClick={handleDeleteSelected}
                        disabled={isDeletingSlides}
                        className="flex items-center gap-3 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isDeletingSlides ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Slet valgte
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
            {showMindmap && (
              <MindmapOverlay seminar={seminar} onClose={() => setShowMindmap(false)} />
            )}
            {showConceptList && (
              <ConceptListOverlay 
                title={seminar.overallTitle} 
                slides={seminar.slides} 
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

  const content = (
    <div className="flex flex-col h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-0.5 sm:p-1 group relative">
      <div className="p-4 sm:p-5 md:p-6 lg:p-7 flex-1" onClick={onOpen}>
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-slate-900 rounded-lg sm:rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl group-hover:rotate-6 transition-transform flex-shrink-0">
            <Presentation className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={e => { e.stopPropagation(); setShowCatPicker(!showCatPicker); }} 
                className={`p-1.5 sm:p-2 transition-colors rounded-lg sm:rounded-xl ${seminar.category ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-slate-50' }`}>
                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 sm:p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
          </div>
        </div>
        <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 serif leading-tight mb-2 truncate group-hover:text-indigo-800 transition-colors">{seminar.overallTitle}</h3>
        {seminar.category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-amber-50 text-amber-700 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-3 sm:mb-4 border border-amber-100 shadow-sm">
                <Tags className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {seminar.category}
            </span>
        )}
        <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] font-bold text-slate-400 mt-auto">
          <div className="flex items-center gap-1 whitespace-nowrap"><Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{date?.toLocaleDateString('da-DK')}</div>
          <div className="flex items-center gap-1 tracking-widest uppercase text-[8px] sm:text-[10px] whitespace-nowrap">{seminar.slides?.length || 0} Slides</div>
        </div>
      </div>
      
      <div className="px-4 sm:px-5 md:px-6 lg:px-7 py-3 sm:py-4 lg:py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-1.5 sm:gap-2"><div className="w-1 h-1 rounded-full bg-indigo-400" /><span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalConcepts} Begreber</span></div>
         <div className="flex items-center gap-1.5 sm:gap-2 text-indigo-600 font-black text-[9px] sm:text-[11px] group-hover:translate-x-1 transition-transform">ÅBEN <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></div>
      </div>
      
      {showCatPicker && (
        <div className="absolute inset-0 bg-white/98 backdrop-blur-md z-30 p-8 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200 rounded-[2.5rem]" onClick={e => e.stopPropagation()}>
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
                        className="w-full h-12 pl-10 pr-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
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

            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-4">
                <button onClick={() => handleSetCat('')} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all">Slet Kategori</button>
                <button onClick={() => setShowCatPicker(false)} className="text-[10px] font-black uppercase text-slate-300 hover:text-slate-600 px-3 py-2 transition-all">Luk</button>
            </div>
        </div>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
        <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-indigo-200 cursor-pointer flex items-center gap-4 group" onClick={onOpen}>
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400"><Presentation className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0"><h3 className="font-bold text-slate-900 truncate leading-snug">{seminar.overallTitle}</h3><p className="text-[10px] text-slate-400">{seminar.category || 'Ingen kategori'}</p></div>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
            <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-500" />
        </motion.div>
    );
  }
  return <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">{content}</motion.div>;
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
  const [categoryMindmapData, setCategoryMindmapData] = useState<SavedSeminar | null>(null);
  const [categoryConceptListData, setCategoryConceptListData] = useState<{ title: string; slides: any[] } | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [categoryChatData, setCategoryChatData] = useState<{ title: string; seminars: any[] } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, 'users', user.uid, 'seminars'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => { setSeminars(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedSeminar))); setIsLoading(false); }, () => setIsLoading(false));
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

  const handleOpenCategoryMindmap = () => {
    if (!activeCategory) return;
    const filtered = seminars.filter(s => s.category === activeCategory);
    const allSlides = filtered.flatMap(s => s.slides);
    setCategoryMindmapData({
        ...filtered[0],
        overallTitle: `${activeCategory} - Alle Seminarer`,
        slides: allSlides,
        createdAt: { toDate: () => new Date() }
    });
  };

  const handleOpenCategoryConceptList = () => {
    if (!activeCategory) return;
    const filtered = seminars.filter(s => s.category === activeCategory);
    const allSlides = filtered.flatMap(s => s.slides);
    setCategoryConceptListData({
        title: `${activeCategory} - Samlet Begrebsoverblik`,
        slides: allSlides
    });
  const stats = useMemo(() => {
    const totalSeminars = seminars.length;
    const totalConcepts = seminars.reduce((acc, s) => acc + (s.slides?.reduce((a, sl) => a + (sl.keyConcepts?.length || 0), 0) || 0), 0);
    const totalNotes = seminars.reduce((acc, s) => acc + (s.slides?.filter(sl => sl.notes).length || 0), 0);
    return { seminars: totalSeminars, concepts: totalConcepts, notes: totalNotes };
  }, [seminars]);


  if (isLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <Link href="/portal" className="p-2.5 sm:p-3 bg-slate-50 text-slate-400 rounded-xl sm:rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm shrink-0"><ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /></Link>
            <div className="min-w-0"><h1 className="text-lg sm:text-xl font-black text-slate-900 serif truncate">Mine Seminarer</h1><p className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-500/60 tracking-widest mt-0.5 hidden sm:block">Vidensbibliotek</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
             <div className="flex items-center gap-1.5 p-1 sm:p-1.5 bg-slate-50 rounded-lg sm:rounded-2xl border border-slate-100">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><List className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
             </div>
             <Link href="/seminar-architect" className="shrink-0"><Button size="sm" className="rounded-lg sm:rounded-2xl bg-slate-900 hover:bg-indigo-900 text-white h-9 sm:h-10 md:h-12 px-2.5 sm:px-4 md:px-6 shadow-xl text-xs sm:text-sm md:text-base"><Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-0 sm:mr-2" /><span className="hidden sm:inline">Ny analyse</span></Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10">
        <div className="mb-8 sm:mb-12 flex flex-col md:flex-row items-baseline justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 serif tracking-tighter">Mit Vidensbibliotek</h1>
                <p className="text-slate-400 font-medium text-xs sm:text-sm">Organiser, repetér og visualiser dine studier.</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
                <button 
                    onClick={() => setShowStats(!showStats)} 
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${showStats ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                >
                    <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">{showStats ? 'Skjul Statistik' : 'Vis Statistik'}</span><span className="sm:hidden">{showStats ? 'Skjul' : 'Vis'}</span>
                </button>
                <Link href="/seminar-architect">
                    <Button className="rounded-xl bg-slate-900 hover:bg-indigo-900 text-white h-11 px-6 shadow-xl"><Plus className="w-4 h-4 mr-2" /> Ny Analyse</Button>
                </Link>
            </div>
        </div>


        <AnimatePresence>
            {showStats && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-12"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        {[
                            { label: 'Total Viden', val: stats.seminars, sub: 'Gennemførte seminarer', icon: <Presentation className="w-5 h-5"/>, color: 'text-slate-900', bg: 'bg-slate-50' },
                            { label: 'Faglige Begreber', val: stats.concepts, sub: 'Kortlagt i biblioteket', icon: <Tags className="w-5 h-5"/>, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                            { label: 'Studienoter', val: stats.notes, sub: 'Gemte refleksioner', icon: <FileText className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-50/50' }
                        ].map((s, i) => (
                            <div key={i} className="flex items-center gap-6">
                                <div className={`w-14 h-14 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center`}>{s.icon}</div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{s.label}</p>
                                    <p className={`text-2xl font-black serif ${s.color}`}>{s.val}</p>
                                    <p className="text-[10px] font-medium text-slate-400">{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Unified Filter Bar - Only show for Mine Seminarer view */}
        <div className="mb-8 sm:mb-10 p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
            <div className="flex-1 relative w-full group">
                <Search className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Søg..." 
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full h-10 sm:h-14 pl-10 sm:pl-14 pr-3 sm:pr-6 bg-transparent rounded-lg sm:rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none" 
                />
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
                <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block" />
                
                <select 
                    value={activeCategory || ''} 
                    onChange={e => setActiveCategory(e.target.value || null)} 
                    className="flex-1 sm:flex-none h-9 sm:h-10 px-2 sm:px-4 bg-slate-50 border-none rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                    <option value="">Alle Kategorier</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-50 p-1 rounded-lg sm:rounded-xl">
                    {['newest', 'title'].map(s => (
                        <button 
                            key={s} onClick={() => setSortBy(s as any)} 
                            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            {s === 'newest' ? 'Dato' : 'A-Z'}
                        </button>
                    ))}
                </div>

                <div className="h-8 w-px bg-slate-100 mx-1 hidden md:block" />

                <button 
                    onClick={() => setFilterLaws(!filterLaws)} 
                    className={`h-9 sm:h-10 px-2 sm:px-4 rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterLaws ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-300 hover:text-slate-600' }`}
                >
                    <Scale className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>

        {activeCategory && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="mb-10 flex items-center justify-between p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-900/10 relative group z-[20]"
            >
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-3xl opacity-50 group-hover:scale-110 transition-transform duration-1000" />
                </div>
                <div className="bg-white/60 backdrop-blur-xl border border-slate-200/50 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Kategori Analyse</p>
                            <h4 className="text-lg font-black text-slate-900 serif">Visualiser {activeCategory}</h4>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleOpenCategoryMindmap}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                <Sparkles className="w-4 h-4" /> Mindmap
                            </button>
                            <button 
                                onClick={handleOpenCategoryConceptList}
                                className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
                            >
                                <BookOpen className="w-4 h-4" /> Begreber
                            </button>
                            <button 
                                onClick={() => setCategoryChatData({ title: activeCategory || '', seminars: filtered })}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                            >
                                <BrainCircuit className="w-4 h-4 text-indigo-400" /> Chat med viden
                            </button>
                        </div>
                    </div>
            </motion.div>
        )}

          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filtered.map(s => <SeminarCard key={s.id} seminar={s} viewMode={viewMode} onOpen={() => setOpenSeminar(s)} onDelete={() => handleDelete(s.id)} onCategorize={cat => handleCategorize(s.id, cat)} existingCategories={categories} />)}
            </div>

            {!isLoading && filtered.length === 0 && (
                <div className="py-40 text-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8"><FileSearch className="w-12 h-12"/></div><h3 className="text-2xl font-black text-slate-900 serif mb-2">Ingen resultater</h3><p className="text-slate-400 italic">Prøv en anden søgning eller kategori.</p></div>
            )}
          </>

      </main>

      {(() => {
          const s = seminars.find(s => s.id === openSeminar?.id);
          return s ? <SeminarDetailView seminar={s} user={user} userProfile={userProfile} onClose={() => setOpenSeminar(null)} /> : null;
      })()}
      <AnimatePresence>
            {categoryMindmapData && (
                <MindmapOverlay seminar={categoryMindmapData} onClose={() => setCategoryMindmapData(null)} />
            )}
            {categoryConceptListData && (
                <ConceptListOverlay 
                    title={categoryConceptListData.title}
                    slides={categoryConceptListData.slides}
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
          </AnimatePresence>
    </div>
  );
}
}
