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
import { generateQuizAction, getUserUidByEmailAction } from '@/app/actions';
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
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>(() => (seminar.slides || []).reduce((acc, s) => { if (s.notes) acc[s.slideNumber] = s.notes; return acc; }, {} as Record<number, string>));
  const [debouncedNotes] = useDebounce(notes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openSlides, setOpenSlides] = useState<Set<number>>(new Set([0]));
  const [expandAll, setExpandAll] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [selectedSlides, setSelectedSlides] = useState<Set<number>>(new Set());
  const [isDeletingSlides, setIsDeletingSlides] = useState(false);
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

  const handleToggleShare = async () => {
    if (!user || !seminar.id || !firestore) return;
    setIsUpdatingShare(true);
    try {
      if (!isPremium) {
        toast({ title: 'Kun for Kollega+', description: 'Kollega+ kræves for at dele materiale.', variant: 'destructive' });
        return;
      }
      const ref = doc(firestore, 'users', user.uid, 'seminars', seminar.id);
      await updateDoc(ref, { isShared: !seminar.isShared });
      toast({ title: seminar.isShared ? 'Deling deaktiveret' : 'Deling aktiveret!', description: seminar.isShared ? 'Seminar er nu privat igen.' : 'Seminar kan nu ses af andre Kollega+ brugere med linket.' });
    } catch {
      toast({ title: 'Fejl', description: 'Kunne ikke opdatere deling.', variant: 'destructive' });
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shared/seminar/${seminar.id}?o=${user?.uid}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link kopieret!', description: 'Linket er nu i din udklipsholder.' });
  };

  const handleInviteCollaborator = async () => {
    const email = collaboratorEmail.trim().toLowerCase();
    if (!email || !user || !seminar.id || !firestore) return;
    if (email === user.email?.toLowerCase()) {
        toast({ title: 'Fejl', description: 'Du kan ikke dele med dig selv.', variant: 'destructive' });
        return;
    }

    setIsAddingCollaborator(true);
    try {
        const res = await getUserUidByEmailAction(email);
        if (!res.success) {
            toast({ title: 'Bruger ikke fundet', description: 'Vi kunne ikke finde en bruger med den e-mail. Bed dem om at oprette en profil først.', variant: 'destructive' });
            return;
        }

        const ref = doc(firestore, 'users', user.uid, 'seminars', seminar.id);
        const currentSharedWith = seminar.sharedWith || [];
        
        if (currentSharedWith.includes(res.uid!)) {
            toast({ title: 'Allerede tilføjet', description: 'Denne bruger har allerede adgang.' });
            return;
        }

        await updateDoc(ref, { 
            sharedWith: arrayUnion(res.uid!) 
        });

        toast({ title: 'Adgang givet!', description: `${res.name} kan nu se dette seminar.` });
        setCollaboratorEmail('');
    } catch (e) {
        console.error(e);
        toast({ title: 'Fejl', description: 'Kunne ikke tilføje bruger.', variant: 'destructive' });
    } finally {
        setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCollaborator = async (uid: string) => {
    if (!user || !seminar.id || !firestore) return;
    try {
        const ref = doc(firestore, 'users', user.uid, 'seminars', seminar.id);
        await updateDoc(ref, { 
            sharedWith: arrayRemove(uid) 
        });
        toast({ title: 'Adgang fjernet', description: 'Brugeren har ikke længere adgang.' });
    } catch (e) {
        toast({ title: 'Fejl', description: 'Kunne ikke fjerne adgang.', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 sm:top-[80px] z-[200] bg-[#FDFCF8] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 sm:px-10 py-5 flex items-center gap-6 shrink-0 h-24">
        <button onClick={quizData ? () => setQuizData(null) : onClose} className="p-3 bg-slate-50 rounded-[1.25rem] text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 shrink-0 shadow-sm border border-slate-100"><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5"><h2 className="font-black text-slate-900 truncate text-lg serif tracking-tight">{seminar.overallTitle}</h2><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" /></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{slides.length} slides · Oprettet {seminar.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
        </div>
        <div className="flex items-center gap-4">
          {saveStatus === 'saved' && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Gemt</span>}
          <div className="relative">
            <Button size="lg" variant="outline" onClick={() => setShowSharePopover(!showSharePopover)} className={`rounded-2xl border-slate-200 h-12 px-6 flex items-center gap-2 transition-all ${seminar.isShared ? 'bg-amber-50 border-amber-200 text-amber-700' : 'hover:bg-slate-50 text-slate-600'}`}>
              <Share2 className="w-4 h-4" />
              <span className="font-black">DEL</span>
            </Button>
            
            <AnimatePresence>
              {showSharePopover && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-4 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-[250]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Del seminar</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Kollega+ Adgang</p>
                      </div>
                      <button onClick={() => setShowSharePopover(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${seminar.isShared ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                          <LinkIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{seminar.isShared ? 'Delt med andre' : 'Kun dig'}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{seminar.isShared ? 'Klik for at gøre privat' : 'Klik for at dele'}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={seminar.isShared ? "outline" : "default"} 
                        className={`rounded-xl h-10 ${seminar.isShared ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 text-white'}`}
                        onClick={handleToggleShare}
                        disabled={isUpdatingShare}
                      >
                        {isUpdatingShare ? <Loader2 className="w-4 h-4 animate-spin" /> : seminar.isShared ? 'Privat' : 'Del'}
                      </Button>
                    </div>

                    {seminar.isShared && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delingslink</p>
                        <div className="flex gap-2">
                          <input 
                            readOnly 
                            value={shareUrl} 
                            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[11px] font-medium text-slate-900 outline-none"
                          />
                          <Button size="sm" onClick={handleCopyLink} className="rounded-xl bg-slate-900 text-white px-4">
                            Kopiér
                          </Button>
                        </div>
                        <p className="text-[10px] text-amber-600 font-bold italic leading-relaxed text-center px-4">Linket virker kun for andre med Kollega+ medlemskab.</p>
                      </div>
                    )}

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Del med specifik kollega</p>
                        <div className="flex gap-2">
                            <input 
                                type="email"
                                placeholder="Indtast e-mail..."
                                value={collaboratorEmail}
                                onChange={e => setCollaboratorEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleInviteCollaborator()}
                                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[11px] font-medium text-slate-900 outline-none h-10 focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                            <Button 
                                size="sm" 
                                onClick={handleInviteCollaborator} 
                                disabled={isAddingCollaborator || !collaboratorEmail.includes('@')}
                                className="rounded-xl bg-indigo-600 text-white px-4 h-10"
                            >
                                {isAddingCollaborator ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tilføj'}
                            </Button>
                        </div>
                        {seminar.sharedWith && seminar.sharedWith.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Har adgang ({seminar.sharedWith.length})</p>
                                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {seminar.sharedWith.map(uid => (
                                        <div key={uid} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold">
                                                    {uid.slice(0, 2).toUpperCase()}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[120px]">Bruger: {uid.slice(0, 8)}...</span>
                                            </div>
                                            <button onClick={() => handleRemoveCollaborator(uid)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button size="lg" variant="outline" onClick={() => setShowMindmap(true)} className="rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 h-12 px-6 hidden sm:flex items-center gap-2 transition-all"><Sparkles className="w-4 h-4" /><span className="font-black">RELATIONSKORT</span></Button>
          <Button size="lg" onClick={handleStartQuiz} disabled={isGeneratingQuiz} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 group">
            {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />}
            <span className="font-black">TAG QUIZ</span>
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
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-1 group relative">
      <div className="p-7 flex-1" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl group-hover:rotate-6 transition-transform">
            <Presentation className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); setShowCatPicker(!showCatPicker); }} 
                className={`p-2 transition-colors rounded-xl ${seminar.category ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-slate-50' }`}>
                <FolderOpen className="w-4 h-4"/>
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 serif leading-tight mb-2 truncate group-hover:text-indigo-800 transition-colors">{seminar.overallTitle}</h3>
        {seminar.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4 border border-amber-100 shadow-sm">
                <Tags className="w-3 h-3" /> {seminar.category}
            </span>
        )}
        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 mt-auto">
          <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{date?.toLocaleDateString('da-DK')}</div>
          <div className="flex items-center gap-1.5 tracking-widest uppercase text-[10px]">{seminar.slides?.length || 0} Slides</div>
        </div>
      </div>
      
      <div className="px-7 py-5 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-400" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalConcepts} Begreber</span></div>
         <div className="flex items-center gap-2 text-indigo-600 font-black text-[11px] group-hover:translate-x-1 transition-transform">ÅBEN <ChevronRight className="w-3.5 h-3.5" /></div>
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
  const [isUpdatingCategoryShare, setIsUpdatingCategoryShare] = useState(false);
  const [showCategorySharePopover, setShowCategorySharePopover] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
  const [viewType, setViewType] = useState<'mine' | 'delt'>('mine');
  const [selectedSeminarForSharing, setSelectedSeminarForSharing] = useState<string | null>(null);
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

  const handleRemoveCollaborator = async (seminarId: string, uid: string) => {
    if (!user || !firestore) return;
    try {
      const ref = doc(firestore, 'users', user.uid, 'seminars', seminarId);
      await updateDoc(ref, {
        sharedWith: arrayRemove(uid)
      });
      toast({ title: 'Adgang fjernet', description: 'Brugeren har ikke længere adgang til seminaret.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Fejl', description: 'Kunne ikke fjerne adgang.', variant: 'destructive' });
    }
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
      if (sortBy === 'newest') return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      if (sortBy === 'oldest') return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      return a.overallTitle.localeCompare(b.overallTitle);
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
  };

  const stats = useMemo(() => {
    const totalSeminars = seminars.length;
    const totalConcepts = seminars.reduce((acc, s) => acc + (s.slides?.reduce((a, sl) => a + (sl.keyConcepts?.length || 0), 0) || 0), 0);
    const totalNotes = seminars.reduce((acc, s) => acc + (s.slides?.filter(sl => sl.notes).length || 0), 0);
    return { seminars: totalSeminars, concepts: totalConcepts, notes: totalNotes };
  }, [seminars]);

  const handleToggleCategoryShare = async () => {
    if (!user || !activeCategory || !firestore || !userProfile) return;
    setIsUpdatingCategoryShare(true);
    try {
      const isShared = (userProfile.sharedCategories || []).includes(activeCategory);
      let next = [...(userProfile.sharedCategories || [])];
      if (isShared) {
        next = next.filter(c => c !== activeCategory);
      } else {
        next.push(activeCategory);
      }
      const ref = doc(firestore, 'users', user.uid);
      await updateDoc(ref, { sharedCategories: next });
      toast({ 
        title: isShared ? 'Kategori privatiseret' : 'Kategori delt!', 
        description: isShared ? `"${activeCategory}" er nu privat.` : `Kategorien "${activeCategory}" er nu tilgængelig for andre Kollega+ brugere.` 
      });
    } catch {
      toast({ title: 'Fejl', description: 'Kunne ikke opdatere deling.', variant: 'destructive' });
    } finally {
      setIsUpdatingCategoryShare(false);
    }
  };

  const handleInviteCategoryCollaborator = async () => {
    const email = collaboratorEmail.trim().toLowerCase();
    if (!email || !user || !activeCategory || !userProfile || !firestore) return;
    
    if (email === user.email?.toLowerCase()) {
        toast({ title: 'Fejl', description: 'Du kan ikke dele med dig selv.', variant: 'destructive' });
        return;
    }

    setIsAddingCollaborator(true);
    try {
        const res = await getUserUidByEmailAction(email);
        if (!res.success) {
            toast({ title: 'Bruger ikke fundet', description: 'Vi kunne ikke finde en bruger med den e-mail.', variant: 'destructive' });
            return;
        }

        const permissions = userProfile.sharedCategoriesPermissions || {};
        const currentUids = permissions[activeCategory] || [];
        
        if (currentUids.includes(res.uid!)) {
            toast({ title: 'Allerede tilføjet', description: 'Denne bruger har allerede adgang til kategorien.' });
            return;
        }

        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            [`sharedCategoriesPermissions.${activeCategory}`]: arrayUnion(res.uid!)
        });

        toast({ title: 'Kategori delt!', description: `Adgang givet til ${res.name}.` });
        setCollaboratorEmail('');
    } catch (e) {
        console.error(e);
        toast({ title: 'Fejl', description: 'Kunne ikke tilføje person.', variant: 'destructive' });
    } finally {
        setIsAddingCollaborator(false);
    }
  };

  const handleRemoveCategoryCollaborator = async (uid: string) => {
    if (!user || !activeCategory || !userProfile || !firestore) return;
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
            [`sharedCategoriesPermissions.${activeCategory}`]: arrayRemove(uid)
        });
        toast({ title: 'Adgang fjernet', description: 'Personen har ikke længere adgang til kategorien.' });
    } catch (e) {
        toast({ title: 'Fejl', description: 'Kunne ikke fjerne adgang.', variant: 'destructive' });
    }
  };

  const categoryShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/shared/category/${encodeURIComponent(activeCategory || '')}?o=${user?.uid}` : '';

  const handleCopyCategoryLink = () => {
    navigator.clipboard.writeText(categoryShareUrl);
    toast({ title: 'Link kopieret!', description: 'Linket til kategorien er nu i din udklipsholder.' });
  };

  if (isLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[40]">
        <div className="max-w-7xl mx-auto px-5 sm:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="hidden sm:block"><h1 className="text-xl font-black text-slate-900 serif">Mine Seminarer</h1><p className="text-[10px] font-black uppercase text-indigo-500/60 tracking-widest mt-0.5">Vidensbibliotek</p></div>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
             </div>
             <Link href="/seminar-architect"><Button size="lg" className="rounded-2xl bg-slate-900 hover:bg-indigo-900 text-white h-12 px-6 shadow-xl"><Plus className="w-4 h-4 mr-2" /> Ny analyse</Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-10 py-10">
        <div className="mb-12 flex flex-col md:flex-row items-baseline justify-between gap-4">
            <div className="space-y-1">
                <h1 className="text-4xl font-black text-slate-900 serif tracking-tighter">Mit Vidensbibliotek</h1>
                <p className="text-slate-400 font-medium text-sm">Organiser, repetér og visualiser dine studier.</p>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setShowStats(!showStats)} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showStats ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                >
                    <Activity className="w-3.5 h-3.5" /> {showStats ? 'Skjul Statistik' : 'Vis Statistik'}
                </button>
                <Link href="/seminar-architect">
                    <Button className="rounded-xl bg-slate-900 hover:bg-indigo-900 text-white h-11 px-6 shadow-xl"><Plus className="w-4 h-4 mr-2" /> Ny Analyse</Button>
                </Link>
            </div>
        </div>

        {/* View Type Tabs */}
        <div className="mb-8 flex gap-2 border-b border-slate-100 pb-4">
          <button
            onClick={() => { setViewType('mine'); setSelectedSeminarForSharing(null); }}
            className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-lg transition-all ${
              viewType === 'mine'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mine Seminarer
          </button>
          <button
            onClick={() => { setViewType('delt'); }}
            className={`px-4 py-2 text-sm font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
              viewType === 'delt'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Administrer Deling
          </button>
        </div>

        <AnimatePresence>
            {showStats && viewType === 'mine' && (
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
        {viewType === 'mine' && (
        <div className="mb-10 p-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-2">
            <div className="flex-1 relative w-full group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Søg i titler, begreber, noter..." 
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
                    className="w-full h-14 pl-14 pr-6 bg-transparent rounded-2xl text-sm font-semibold focus:outline-none" 
                />
            </div>
            
            <div className="flex items-center gap-2 mr-2">
                <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block" />
                
                <select 
                    value={activeCategory || ''} 
                    onChange={e => setActiveCategory(e.target.value || null)} 
                    className="h-10 px-4 bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                >
                    <option value="">Alle Kategorier</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
                    {['newest', 'title'].map(s => (
                        <button 
                            key={s} onClick={() => setSortBy(s as any)} 
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >
                            {s === 'newest' ? 'Dato' : 'A-Z'}
                        </button>
                    ))}
                </div>

                <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block" />

                <button 
                    onClick={() => setFilterLaws(!filterLaws)} 
                    className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterLaws ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-300 hover:text-slate-600' }`}
                >
                    <Scale className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
        )}

        {activeCategory && viewType === 'mine' && (
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
                             <div className="relative">
                                <button 
                                    onClick={() => setShowCategorySharePopover(!showCategorySharePopover)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg ${(userProfile?.sharedCategories || []).includes(activeCategory || '') ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-slate-700 text-white hover:bg-slate-600 shadow-slate-900/20' }`}
                                >
                                    <Share2 className="w-4 h-4" /> {(userProfile?.sharedCategories || []).includes(activeCategory || '') ? 'Delt' : 'Del'}
                                </button>

                                <AnimatePresence>
                                    {showCategorySharePopover && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-4 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-6 z-[250]"
                                        >
                                            <div className="space-y-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-black text-slate-900 text-sm">Del kategori</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{activeCategory}</p>
                                                    </div>
                                                    <button onClick={() => setShowCategorySharePopover(false)} className="text-slate-300 hover:text-slate-900 transition-colors"><X className="w-4 h-4" /></button>
                                                </div>

                                                <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                                                    <p className="text-[11px] font-bold text-slate-600">{(userProfile?.sharedCategories || []).includes(activeCategory || '') ? 'Kategorien er delt' : 'Kategorien er privat'}</p>
                                                    <Button 
                                                        size="sm" 
                                                        className={`rounded-xl h-9 px-4 ${(userProfile?.sharedCategories || []).includes(activeCategory || '') ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white'}`}
                                                        onClick={handleToggleCategoryShare}
                                                        disabled={isUpdatingCategoryShare}
                                                    >
                                                        {isUpdatingCategoryShare ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (userProfile?.sharedCategories || []).includes(activeCategory || '') ? 'Privat' : 'Del'}
                                                    </Button>
                                                </div>

                                                {(userProfile?.sharedCategories || []).includes(activeCategory || '') && (
                                                        <div className="space-y-3 pt-2">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delingslink</p>
                                                            <div className="flex gap-2">
                                                                <input readOnly value={categoryShareUrl} className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-medium text-slate-900 outline-none" />
                                                                <Button size="sm" onClick={handleCopyCategoryLink} className="rounded-xl bg-slate-900 text-white px-3">Kopiér</Button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="space-y-3 pt-4 border-t border-slate-100">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Giv adgang til kollega</p>
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="email"
                                                                placeholder="Indtast e-mail..."
                                                                value={collaboratorEmail}
                                                                onChange={e => setCollaboratorEmail(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && handleInviteCategoryCollaborator()}
                                                                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-[11px] font-medium text-slate-900 outline-none h-10 focus:ring-2 focus:ring-indigo-100 transition-all"
                                                            />
                                                            <Button 
                                                                size="sm" 
                                                                onClick={handleInviteCategoryCollaborator} 
                                                                disabled={isAddingCollaborator || !collaboratorEmail.includes('@')}
                                                                className="rounded-xl bg-indigo-600 text-white px-4 h-10"
                                                            >
                                                                {isAddingCollaborator ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tilføj'}
                                                            </Button>
                                                        </div>
                                                        {userProfile?.sharedCategoriesPermissions?.[activeCategory || ''] && (userProfile.sharedCategoriesPermissions[activeCategory || ''].length > 0) && (
                                                            <div className="space-y-2 mt-4">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Har adgang ({userProfile.sharedCategoriesPermissions[activeCategory || ''].length})</p>
                                                                <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                                                                    {userProfile.sharedCategoriesPermissions[activeCategory || ''].map(uid => (
                                                                        <div key={uid} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                                                                            <span className="text-[10px] font-bold text-slate-500 truncate max-w-[120px]">Bruger: {uid.slice(0, 8)}...</span>
                                                                            <button onClick={() => handleRemoveCategoryCollaborator(uid)} className="p-1 text-slate-300 hover:text-rose-500 transition-colors">
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                    )}
                                </AnimatePresence>
                             </div>
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
                        </div>
                    </div>
            </motion.div>
        )}

        {/* Mine Seminarer View */}
        {viewType === 'mine' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filtered.map(s => <SeminarCard key={s.id} seminar={s} viewMode={viewMode} onOpen={() => setOpenSeminar(s)} onDelete={() => handleDelete(s.id)} onCategorize={cat => handleCategorize(s.id, cat)} existingCategories={categories} />)}
            </div>

            {!isLoading && filtered.length === 0 && (
                <div className="py-40 text-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8"><FileSearch className="w-12 h-12"/></div><h3 className="text-2xl font-black text-slate-900 serif mb-2">Ingen resultater</h3><p className="text-slate-400 italic">Prøv en anden søgning eller kategori.</p></div>
            )}
          </>
        )}

        {/* Administrer Deling View */}
        {viewType === 'delt' && (
          <div className="space-y-8">
            {seminars.filter(s => s.isShared || (s.sharedWith && s.sharedWith.length > 0)).length === 0 ? (
              <div className="py-40 text-center">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 mx-auto mb-8">
                  <Share2 className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 serif mb-2">Ingen delte seminarer</h3>
                <p className="text-slate-400 italic mb-6">Du har endnu ikke delt nogle seminarer med andre.</p>
                <button
                  onClick={() => setViewType('mine')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                >
                  Gå til Mine Seminarer
                </button>
              </div>
            ) : (
              seminars
                .filter(s => s.isShared || (s.sharedWith && s.sharedWith.length > 0))
                .map(seminar => (
                  <motion.div
                    key={seminar.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                      {/* Seminar Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <Presentation className="w-8 h-8" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-black text-slate-900 serif mb-1 truncate">
                              {seminar.overallTitle}
                            </h3>
                            {seminar.category && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest mb-3 border border-amber-100">
                                <Tags className="w-3 h-3" /> {seminar.category}
                              </span>
                            )}
                            <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {seminar.createdAt?.toDate().toLocaleDateString('da-DK')}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Presentation className="w-3.5 h-3.5" />
                                {seminar.slides?.length || 0} Slides
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sharing Status */}
                        <div className="mt-6 p-4 bg-slate-50 rounded-2xl space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-black text-slate-900 text-sm mb-1">Delestatus</h4>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {seminar.isShared && seminar.sharedWith && seminar.sharedWith.length > 0
                                  ? `Offentlig + ${seminar.sharedWith.length} kollega(er)`
                                  : seminar.isShared
                                  ? 'Offentlig deling'
                                  : seminar.sharedWith && seminar.sharedWith.length > 0
                                  ? `Delt med ${seminar.sharedWith.length} kollega(er)`
                                  : 'Ikke delt'}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedSeminarForSharing(selectedSeminarForSharing === seminar.id ? null : seminar.id)}
                              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              <ChevronDown
                                className={`w-5 h-5 transition-transform ${
                                  selectedSeminarForSharing === seminar.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>

                          {/* Detailed Sharing Information */}
                          <AnimatePresence>
                            {selectedSeminarForSharing === seminar.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-4 border-t border-slate-200 space-y-4"
                              >
                                {/* Public Share Status */}
                                <div>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Offentlig Deling
                                  </p>
                                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                          seminar.isShared
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-100 text-slate-400'
                                        }`}
                                      >
                                        {seminar.isShared ? '✓' : '−'}
                                      </div>
                                      <span className="text-[11px] font-bold text-slate-600">
                                        {seminar.isShared ? 'Aktiveret' : 'Deaktiveret'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Specific Collaborators */}
                                {seminar.sharedWith && seminar.sharedWith.length > 0 && (
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                      Delt med Kollegaer ({seminar.sharedWith.length})
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                      {seminar.sharedWith.map(uid => (
                                        <div
                                          key={uid}
                                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                                              {uid.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-[10px] font-bold text-slate-600 truncate">
                                                {uid.slice(0, 12)}...
                                              </p>
                                              <p className="text-[9px] text-slate-400">Bruger ID</p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleRemoveCollaborator(seminar.id, uid)}
                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors flex-shrink-0"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => setOpenSeminar(seminar)}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900 transition-all"
                          >
                            Åbn Detaljer
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        )}
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
          </AnimatePresence>
    </div>
  );
}
