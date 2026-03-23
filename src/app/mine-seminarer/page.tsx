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
  Share2,
  BookOpen,
  FolderOpen
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
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SeminarAnalysis, QuizData } from '@/ai/flows/types';
import { generateQuizAction } from '@/app/actions';
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
// Slide Feed Card
// ---------------------------------------------------------------------------
const SlideCard: React.FC<{
  slide: any;
  note: string;
  onNoteChange: (v: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}> = ({ slide, note, onNoteChange, isOpen, onToggle, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${isOpen ? 'border-indigo-200 shadow-2xl shadow-indigo-500/5' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'}`}
    >
      <button onClick={onToggle} className="w-full h-20 flex items-center gap-6 px-6 text-left transition-colors relative">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500 ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
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
          </div>
          {note && <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><FileText className="w-3.5 h-3.5" /></div>}
          <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center transition-transform duration-500 ${isOpen ? 'rotate-180 bg-indigo-50 text-indigo-600' : 'text-slate-300'}`}>
              <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="px-8 pb-10 space-y-8 pt-4">
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-100 rounded-full" />
                <div className="pl-6 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Analytisk Resumé</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{slide.summary}</p>
                </div>
              </div>

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
                    <Textarea placeholder="Tilføj dine egne noter eller refleksioner..." value={note} onChange={e => onNoteChange(e.target.value)} className="bg-slate-50 border-transparent rounded-[1.5rem] text-xs min-h-[100px] resize-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all p-5 font-medium leading-relaxed" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Seminar Detail (Feed View)
// ---------------------------------------------------------------------------
const SeminarDetailView: React.FC<{ seminar: SavedSeminar; user: any; onClose: () => void }> = ({ seminar, user, onClose }) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<number, string>>(() => (seminar.slides || []).reduce((acc, s) => { if (s.notes) acc[s.slideNumber] = s.notes; return acc; }, {} as Record<number, string>));
  const [debouncedNotes] = useDebounce(notes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showMindmap, setShowMindmap] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openSlides, setOpenSlides] = useState<Set<number>>(new Set([0]));
  const [expandAll, setExpandAll] = useState(false);
  const isInitialMount = useRef(true);

  const slides = seminar.slides || [];
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
          <Button size="lg" variant="outline" onClick={() => setShowMindmap(true)} className="rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 h-12 px-6 hidden sm:flex items-center gap-2 transition-all"><Share2 className="w-4 h-4" /><span className="font-black">RELATIONSKORT</span></Button>
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
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gennemgang</p>
                <button onClick={handleExpandAll} className="flex items-center gap-2 py-2 px-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-500">{expandAll ? 'Fold alle' : 'Udvid alle'}</button>
              </div>
              <div className="space-y-4">
                {slides.map((s, i) => <SlideCard key={s.slideNumber} slide={s} note={notes[s.slideNumber] || ''} onNoteChange={v => setNotes(prev => ({ ...prev, [s.slideNumber]: v }))} isOpen={openSlides.has(i)} onToggle={() => toggleSlide(i)} index={i} />)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showMindmap && <MindmapOverlay seminar={seminar} onClose={() => setShowMindmap(false)} />}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seminar Card
// ---------------------------------------------------------------------------
const SeminarCard: React.FC<{ seminar: SavedSeminar; onOpen: () => void; onDelete: () => void; onCategorize: (cat: string) => void; viewMode: 'grid' | 'list' }> = ({ seminar, onOpen, onDelete, onCategorize, viewMode }) => {
  const [showCatPicker, setShowCatPicker] = useState(false);
  const totalConcepts = seminar.slides?.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0) || 0;
  const date = seminar.createdAt?.toDate();

  const handleSetCat = (cat: string) => { onCategorize(cat); setShowCatPicker(false); };

  const content = (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl transition-all p-1 group">
      <div className="p-7 flex-1" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl group-hover:rotate-6 transition-transform">
            <Presentation className="w-7 h-7" />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={e => { e.stopPropagation(); setShowCatPicker(!showCatPicker); }} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><FolderOpen className="w-4 h-4"/></button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 serif leading-tight mb-2 truncate group-hover:text-indigo-800 transition-colors">{seminar.overallTitle}</h3>
        {seminar.category && <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4 border border-amber-100">{seminar.category}</span>}
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
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 p-6 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-[0.2em] text-center">Vælg Kategori</p>
            <div className="grid grid-cols-2 gap-2">
                {['Socialret', 'Forvaltningsret', 'Civilret', 'Strafferet', 'Sundhedsret'].map(c => (
                    <button key={c} onClick={() => handleSetCat(c)} className="p-3 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-bold transition-all">{c}</button>
                ))}
                <button onClick={() => handleSetCat('')} className="p-3 border border-slate-200 text-slate-400 rounded-xl text-[10px] font-bold col-span-2">Ryd Kategori</button>
            </div>
            <button onClick={() => setShowCatPicker(false)} className="mt-4 text-[9px] font-black uppercase text-slate-300">Annuller</button>
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
  const { user } = useApp();
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
      if (sortBy === 'newest') return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
      if (sortBy === 'oldest') return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      return a.overallTitle.localeCompare(b.overallTitle);
    });
    return res;
  }, [seminars, searchQuery, sortBy, filterLaws, activeCategory]);

  const categories = useMemo(() => Array.from(new Set(seminars.map(s => s.category).filter(Boolean))) as string[], [seminars]);

  const handleOpenCatMindmap = () => {
    if (!activeCategory) return;
    const catSeminars = seminars.filter(s => s.category === activeCategory);
    const allSlides = catSeminars.flatMap(s => s.slides || []);
    setCategoryMindmapData({ id: 'cat-map', overallTitle: `Relationskort: ${activeCategory}`, slides: allSlides, createdAt: { toDate: () => new Date() } } as any);
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

      <main className="max-w-7xl mx-auto px-5 sm:px-10 py-12">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100"><History className="w-3 h-3" /> Historik & Arkiv</div>
                <h2 className="text-5xl font-black text-slate-900 serif tracking-tighter">Din faglige udvikling</h2>
                <p className="text-slate-500 font-medium italic text-lg max-w-2xl">Et samlet overblik over al din viden.</p>
            </div>
            <div className="p-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl serif">{seminars.length}</div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Viden</p><p className="text-xl font-black text-slate-900 leading-none serif">Seminarer</p></div>
            </div>
        </div>

        <div className="mb-12 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full max-w-md group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input type="text" placeholder="Søg i titler, begreber, noter..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full h-16 pl-14 pr-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm text-sm font-semibold focus:ring-4 focus:ring-indigo-50 transition-all outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100 h-14 px-3">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-2" />
                    {['newest', 'title'].map(s => <button key={s} onClick={() => setSortBy(s as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{s === 'newest' ? 'Nyeste' : 'A-Z'}</button>)}
                    <div className="w-px h-6 bg-slate-200 mx-2" />
                    <select value={activeCategory || ''} onChange={e => setActiveCategory(e.target.value || null)} className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 border-none focus:ring-0 cursor-pointer">
                        <option value="">Alle Kategorier</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <button onClick={() => setFilterLaws(!filterLaws)} className={`h-14 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterLaws ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50' }`}><Scale className="w-3.5 h-3.5 mr-2 inline" /> Kun Love</button>
            </div>
        </div>

        {activeCategory && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 p-8 bg-slate-900 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 -translate-y-1/2" />
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-white backdrop-blur-md group-hover:rotate-12 transition-transform duration-500"><Share2 className="w-10 h-10" /></div>
                    <div><h4 className="text-2xl font-black text-white serif mb-1">Relationskort: {activeCategory}</h4><p className="text-indigo-200/60 font-medium italic">Vis overblik på tværs af alle {filtered.length} seminarer i denne kategori.</p></div>
                </div>
                <Button onClick={handleOpenCatMindmap} size="lg" className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all relative z-10">ÅBEN KATEGORI-KORT</Button>
            </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map(s => <SeminarCard key={s.id} seminar={s} viewMode={viewMode} onOpen={() => setOpenSeminar(s)} onDelete={() => handleDelete(s.id)} onCategorize={cat => handleCategorize(s.id, cat)} />)}
        </div>

        {!isLoading && filtered.length === 0 && (
            <div className="py-40 text-center"><div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8"><FileSearch className="w-12 h-12"/></div><h3 className="text-2xl font-black text-slate-900 serif mb-2">Ingen resultater</h3><p className="text-slate-400 italic">Prøv en anden søgning eller kategori.</p></div>
        )}
      </main>

      {openSeminar && <SeminarDetailView seminar={openSeminar} user={user} onClose={() => setOpenSeminar(null)} />}
      {categoryMindmapData && <MindmapOverlay seminar={categoryMindmapData} onClose={() => setCategoryMindmapData(null)} />}
    </div>
  );
}
