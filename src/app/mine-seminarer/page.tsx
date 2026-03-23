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
      {/* Progress */}
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
  const totalItems = (slide.keyConcepts?.length || 0) + (slide.legalFrameworks?.length || 0) + (slide.practicalTools?.length || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group bg-white rounded-3xl border transition-all duration-500 overflow-hidden ${isOpen ? 'border-indigo-200 shadow-2xl shadow-indigo-500/5' : 'border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md'}`}
    >
      {/* Card Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full h-20 flex items-center gap-6 px-6 text-left transition-colors relative"
      >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 transition-all duration-500 ${isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
          {slide.slideNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-slate-900 truncate leading-tight serif">{slide.slideTitle}</p>
          {!isOpen && (
            <p className="text-[11px] text-slate-400 font-medium truncate mt-1 italic">{slide.summary}</p>
          )}
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

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-10 space-y-8 pt-4">
              {/* Summary Section */}
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-100 rounded-full" />
                <div className="pl-6 space-y-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Analytisk Resumé</p>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {slide.summary}
                    </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Concepts */}
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

                {/* Legal */}
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

                {/* Methods */}
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

              {/* Notes Area */}
              <div className="pt-6 border-t border-slate-50">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <FileText className="w-3.5 h-3.5" /> Mine studienoter
                    </h4>
                    {note && <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Noter gemt</span>}
                </div>
                <div className="relative group">
                    <Textarea
                    placeholder="Tilføj dine egne noter eller refleksioner til dette slide..."
                    value={note}
                    onChange={e => onNoteChange(e.target.value)}
                    className="bg-slate-50 border-transparent rounded-[1.5rem] text-xs min-h-[100px] resize-none focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 transition-all p-5 font-medium leading-relaxed"
                    />
                    <div className="absolute right-4 bottom-4 opacity-20 pointer-events-none group-focus-within:opacity-10 transition-opacity">
                        <ArrowLeft className="w-5 h-5 rotate-[135deg]" />
                    </div>
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
  const [notes, setNotes] = useState<Record<number, string>>(() =>
    (seminar.slides || []).reduce((acc, s) => { if (s.notes) acc[s.slideNumber] = s.notes; return acc; }, {} as Record<number, string>)
  );
  const [debouncedNotes] = useDebounce(notes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [openSlides, setOpenSlides] = useState<Set<number>>(new Set([0]));
  const [expandAll, setExpandAll] = useState(false);
  const isInitialMount = useRef(true);

  const slides = seminar.slides || [];

  const toggleSlide = (index: number) => {
    setOpenSlides(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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
      const updated = (snap.data().slides || []).map((s: any) => ({
        ...s, notes: debouncedNotes[s.slideNumber] ?? s.notes ?? ''
      }));
      await updateDoc(ref, { slides: updated });
      setSaveStatus('saved');
    } catch { setSaveStatus('idle'); }
  }, [user, seminar.id, firestore, debouncedNotes]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    handleAutoSaveNotes();
  }, [debouncedNotes, handleAutoSaveNotes]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (saveStatus === 'saved') t = setTimeout(() => setSaveStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  const handleStartQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizData(null);
    try {
      const contextText = slides.map(s => `Slide ${s.slideNumber} (${s.slideTitle}): ${s.summary}`).join('\n');
      const result = await generateQuizAction({ topic: seminar.overallTitle, numQuestions: 5, contextText });
      setQuizData(result.data);
    } catch { toast({ title: 'Fejl', description: 'Quiz kunne ikke genereres.', variant: 'destructive' }); }
    finally { setIsGeneratingQuiz(false); }
  };

  const totalConcepts = slides.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0);
  const totalLaw = slides.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0);
  const totalTools = slides.reduce((a, s) => a + (s.practicalTools?.length || 0), 0);

  return (
    <div className="fixed inset-x-0 bottom-0 top-0 sm:top-[80px] z-[200] bg-[#FDFCF8] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500">
      {/* Top bar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 sm:px-10 py-5 flex items-center gap-6 shrink-0 h-24">
        <button onClick={quizData ? () => setQuizData(null) : onClose}
          className="p-3 bg-slate-50 rounded-[1.25rem] text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 shrink-0 shadow-sm border border-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-black text-slate-900 truncate text-lg serif tracking-tight">{seminar.overallTitle}</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {slides.length} slides · Oprettet {seminar.createdAt?.toDate().toLocaleDateString('da-DK')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            {saveStatus === 'saving' && <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest animate-pulse">Autogemmer...</span>}
            {saveStatus === 'saved' && (
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Note gemt
                </span>
            )}
          </div>
          
          <button onClick={() => window.print()} className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all rounded-xl hidden sm:block">
            <FileText className="w-5 h-5" />
          </button>

          <Button size="lg" onClick={handleStartQuiz} disabled={isGeneratingQuiz}
            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6 shadow-xl shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95 group">
            {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />}
            <span className="font-black">TAG QUIZ</span>
          </Button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {quizData ? (
          <motion.div key="quiz" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="flex-1 overflow-y-auto bg-white">
            <QuizView quizData={quizData} onFinish={() => setQuizData(null)} />
          </motion.div>
        ) : (
          <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-10">
              {/* Stats row - Grid optimized */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Indhold', val: slides.length, sub: 'Slides', color: 'bg-slate-900 text-white shadow-xl shadow-slate-900/10', icon: <Presentation className="w-4 h-4"/> },
                  { label: 'Begreber', val: totalConcepts, sub: 'Faglige termer', color: 'bg-indigo-50 text-indigo-700 border border-indigo-100', icon: <Tags className="w-4 h-4"/> },
                  { label: 'Love', val: totalLaw, sub: 'Referencer', color: 'bg-rose-50 text-rose-700 border border-rose-100', icon: <Scale className="w-4 h-4"/> },
                  { label: 'Metoder', val: totalTools, sub: 'Værktøjer', color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', icon: <Wrench className="w-4 h-4"/> },
                ].map(({ label, val, sub, color, icon }) => (
                  <div key={label} className={`${color} rounded-[2rem] p-5 flex flex-col items-center justify-center transition-transform hover:scale-[1.02] duration-300`}>
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                        {icon}
                        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
                    </div>
                    <p className="text-3xl font-black serif">{val}</p>
                    <p className="text-[10px] font-bold opacity-60 mt-1">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gennemgang af præsentation</p>
                </div>
                <button 
                    onClick={handleExpandAll} 
                    className="flex items-center gap-2 py-2 px-4 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 hover:shadow-md transition-all active:scale-95"
                >
                  {expandAll ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandAll ? 'Fold alle' : 'Udvid alle'}
                </button>
              </div>

              {/* Slide feed */}
              <div className="space-y-4">
                {slides.map((slide, i) => (
                  <SlideCard
                    key={slide.slideNumber}
                    slide={slide}
                    note={notes[slide.slideNumber] || ''}
                    onNoteChange={val => setNotes(prev => ({ ...prev, [slide.slideNumber]: val }))}
                    isOpen={openSlides.has(i)}
                    onToggle={() => toggleSlide(i)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Seminar Card (Archive)
// ---------------------------------------------------------------------------
const SeminarCard: React.FC<{ seminar: SavedSeminar; onOpen: () => void; onDelete: () => void; viewMode: 'grid' | 'list' }> = ({ seminar, onOpen, onDelete, viewMode }) => {
  const totalConcepts = seminar.slides?.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0) || 0;
  const totalLaw = seminar.slides?.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0) || 0;
  const date = seminar.createdAt?.toDate();

  if (viewMode === 'list') {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer flex items-center gap-4"
            onClick={onOpen}
        >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-105">
                <Presentation className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate leading-snug">{seminar.overallTitle}</h3>
                <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        {date?.toLocaleDateString('da-DK')}
                    </p>
                    <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-widest">{seminar.slides?.length || 0} slides</span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                    {totalConcepts > 0 && <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">{totalConcepts} Begreber</span>}
                    {totalLaw > 0 && <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none">{totalLaw} Love</span>}
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-all group-hover:translate-x-1" />
            </div>
        </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 hover:-translate-y-1 transition-all duration-500 cursor-pointer overflow-hidden p-1"
      onClick={onOpen}
    >
      <div className="p-7">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl flex items-center justify-center shrink-0 shadow-xl shadow-slate-900/20 group-hover:rotate-6 transition-transform duration-500">
            <Presentation className="w-7 h-7 text-indigo-400" />
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all shrink-0 opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
            <div>
                <h3 className="font-black text-slate-900 leading-tight mb-2 text-lg line-clamp-2 serif">{seminar.overallTitle}</h3>
                {seminar.fileName && (
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] truncate">{seminar.fileName}</p>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                    <LayoutGrid className="w-3 h-3 text-slate-400"/>
                    <span className="text-[10px] font-black text-slate-700 tracking-widest leading-none">{seminar.slides?.length || 0} SLIDES</span>
                </div>
                {totalConcepts > 0 && (
                    <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
                        <Tags className="w-3 h-3 text-indigo-400"/>
                        <span className="text-[10px] font-black text-indigo-700 tracking-widest leading-none">{totalConcepts} BEGREBER</span>
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            {date && (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Dato</p>
                        <p className="text-[11px] font-bold text-slate-600">
                            {date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            )}
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-500 shadow-lg shadow-indigo-500/20">
                <ChevronRight className="w-6 h-6" />
            </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
function MineSeminarerPageContent() {
  const { user } = useApp();
  const firestore = useFirestore();
  const [seminars, setSeminars] = useState<SavedSeminar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSeminar, setOpenSeminar] = useState<SavedSeminar | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [filterLaws, setFilterLaws] = useState(false);

  useEffect(() => {
    if (!user || !firestore) return;
    const q = query(collection(firestore, 'users', user.uid, 'seminars'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSeminars(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedSeminar)));
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsub();
  }, [user, firestore]);

  const handleDelete = async (id: string) => {
    if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette dette videnskort?')) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'seminars', id));
    if (openSeminar?.id === id) setOpenSeminar(null);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...seminars];

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(s =>
          s.overallTitle?.toLowerCase().includes(q) ||
          s.slides?.some(sl =>
            sl.slideTitle?.toLowerCase().includes(q) ||
            sl.summary?.toLowerCase().includes(q) ||
            sl.keyConcepts?.some((c: any) => c.term?.toLowerCase().includes(q)) ||
            sl.notes?.toLowerCase().includes(q)
          )
        );
    }

    if (filterLaws) {
        result = result.filter(s => s.slides?.some(sl => sl.legalFrameworks?.length > 0));
    }

    result.sort((a, b) => {
        if (sortBy === 'newest') return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        if (sortBy === 'oldest') return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
        if (sortBy === 'title') return (a.overallTitle || '').localeCompare(b.overallTitle || '');
        return 0;
    });

    return result;
  }, [seminars, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const totalSeminars = seminars.length;
    const totalSlides = seminars.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
    const totalConcepts = seminars.reduce((acc, s) => acc + s.slides?.reduce((a, sl) => a + (sl.keyConcepts?.length || 0), 0), 0);
    const totalLaws = seminars.reduce((acc, s) => acc + s.slides?.reduce((a, sl) => a + (sl.legalFrameworks?.length || 0), 0), 0);
    
    return { totalSeminars, totalSlides, totalConcepts, totalLaws };
  }, [seminars]);

  const groups = useMemo(() => {
    const g: Record<string, SavedSeminar[]> = {};
    filteredAndSorted.forEach(s => {
      const d = s.createdAt?.toDate();
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!g[k]) g[k] = [];
      g[k].push(s);
    });
    return g;
  }, [filteredAndSorted]);

  const groupKeys = useMemo(() => Object.keys(groups).sort((a, b) => {
      if (sortBy === 'oldest') return a.localeCompare(b);
      return b.localeCompare(a);
  }), [groups, sortBy]);

  return (
    <>
      <AnimatePresence>
        {openSeminar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="z-[200] relative">
            <SeminarDetailView seminar={openSeminar} user={user} onClose={() => setOpenSeminar(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#FDFCF8] selection:bg-indigo-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[40]">
          <div className="max-w-7xl mx-auto px-5 sm:px-10 h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/portal" className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95 shadow-sm">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black text-slate-900 serif tracking-tight">Mine Seminarer</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60 mt-0.5">Vidensbibliotek</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4" /></button>
                </div>
                <Link href="/seminar-architect">
                    <Button size="lg" className="rounded-2xl bg-slate-900 hover:bg-indigo-900 text-white h-12 px-6 shadow-xl shadow-slate-950/20 transition-all hover:scale-105 active:scale-95">
                        <Plus className="w-4 h-4 mr-2" /> Ny analyse
                    </Button>
                </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-5 sm:px-10 py-12">
          {/* Dashboard Hub */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                        <History className="w-3 h-3" /> Historik & Arkiv
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 serif tracking-tighter">Din faglige udvikling</h2>
                    <p className="text-slate-500 font-medium italic text-lg max-w-2xl leading-relaxed">Et samlet overblik over al din viden fra seminarer, kurser og oplæg – transformeret til aktive læringskort.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="p-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-200 transition-all">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Activity className="w-6 h-6"/></div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Total Viden</p>
                            <p className="text-2xl font-black text-slate-900 leading-none serif">{stats.totalSeminars}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Analyserede Slides', val: stats.totalSlides, icon: <LayoutGrid className="w-5 h-5"/>, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Aktive Begreber', val: stats.totalConcepts, icon: <Tags className="w-5 h-5"/>, color: 'text-indigo-600 bg-indigo-50' },
                    { label: 'Lovhjemler fundet', val: stats.totalLaws, icon: <Scale className="w-5 h-5"/>, color: 'text-rose-600 bg-rose-50' },
                    { label: 'Anvendte Metoder', val: stats.totalLaws > 5 ? stats.totalLaws - 2 : 0, icon: <Wrench className="w-5 h-5"/>, color: 'text-emerald-600 bg-emerald-50' },
                ].map((stat, i) => (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} key={i} className={`p-6 rounded-[2.5rem] border border-white shadow-sm flex flex-col items-center justify-center text-center space-y-3 ${stat.color} bg-white/40 backdrop-blur-sm`}>
                        <div className="w-10 h-10 rounded-xl bg-white shadow-inner flex items-center justify-center opacity-60">{stat.icon}</div>
                        <div>
                            <p className="text-2xl font-black serif leading-none mb-1">{stat.val}</p>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-tight">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12 bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-900/5">
            <div className="relative w-full sm:max-w-md group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Søg i titler, begreber, noter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-4 bg-slate-50 border-none rounded-[1.5rem] text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-600 bg-white rounded-full shadow-sm"><X className="w-3.5 h-3.5" /></button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-[1.25rem] border border-slate-100 h-14 px-3">
                    <SlidersHorizontal className="w-4 h-4 text-slate-400 mr-2" />
                    {[
                        { id: 'newest', label: 'Nyeste', icon: <Clock className="w-3.5 h-3.5"/> },
                        { id: 'title', label: 'A-Z', icon: <ArrowDownAZ className="w-3.5 h-3.5"/> }
                    ].map(btn => (
                        <button 
                            key={btn.id}
                            onClick={() => setSortBy(btn.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === btn.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {btn.icon} {btn.label}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>
                    <button 
                        onClick={() => setFilterLaws(!filterLaws)}
                        className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterLaws ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Scale className="w-3.5 h-3.5" /> Kun Love
                    </button>
                </div>
            </div>
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-600" />
                    <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-400 animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Organiserer vidensbibliotek</p>
            </div>
          ) : filteredAndSorted.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 shadow-inner">
              {searchQuery ? (
                <div className="max-w-sm mx-auto">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6"><FileSearch className="w-10 h-10"/></div>
                  <h3 className="text-xl font-black text-slate-900 serif mb-2">Ingen resultater</h3>
                  <p className="text-sm text-slate-400 mb-8 italic">Vi kunne ikke finde noget der matchede din søgning på "{searchQuery}".</p>
                  <button onClick={() => setSearchQuery('')} className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-900/20">Ryd filtre</button>
                </div>
              ) : (
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[2.5rem] flex items-center justify-center text-indigo-200 mx-auto mb-8 shadow-inner"><BookCopy className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-black text-slate-900 serif mb-3">Dit bibliotek er tomt</h3>
                  <p className="text-sm text-slate-400 mb-10 leading-relaxed px-10 italic">Her samles alle dine uploadede seminar-filer, når de er blevet analyseret af Seminar-Arkitekten.</p>
                  <Link href="/seminar-architect">
                    <Button size="lg" className="bg-slate-900 hover:bg-indigo-950 text-white rounded-2xl h-14 px-10 shadow-2xl shadow-slate-950/20 transition-all hover:scale-105">
                      <Sparkles className="w-5 h-5 mr-3" /> Få din første analyse
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-16">
              {groupKeys.map(key => {
                const [year, month] = key.split('-');
                const title = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('da-DK', { month: 'long', year: 'numeric' });
                const items = groups[key];
                return (
                  <section key={key} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center gap-6">
                        <div className="w-3 h-3 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20"></div>
                        <h3 className="text-[13px] font-black uppercase tracking-[0.4em] text-slate-900/30 whitespace-nowrap capitalize">{title}</h3>
                        <div className="h-px w-full bg-gradient-to-r from-slate-100 to-transparent" />
                    </div>
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
                      {items.map(seminar => (
                        <SeminarCard key={seminar.id} seminar={seminar} onOpen={() => setOpenSeminar(seminar)} onDelete={() => handleDelete(seminar.id)} viewMode={viewMode} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const MineSeminarerPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/');
  }, [user, isUserLoading, router]);
  if (isUserLoading || !user) return <AuthLoadingScreen />;
  return <MineSeminarerPageContent />;
};

export default MineSeminarerPage;
