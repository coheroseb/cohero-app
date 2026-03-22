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
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-indigo-200 shadow-lg shadow-indigo-500/5' : 'border-slate-100 shadow-sm'}`}
    >
      {/* Card Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50/80 transition-colors"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
          {slide.slideNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 truncate text-sm">{slide.slideTitle}</p>
          {!isOpen && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{slide.summary}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {totalItems > 0 && (
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg">{totalItems} punkter</span>
          )}
          {note && <span className="w-2 h-2 rounded-full bg-amber-400" title="Du har noter på dette slide" />}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 space-y-5 border-t border-slate-100 pt-5">
              {/* Summary */}
              <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-indigo-200 pl-4">
                {slide.summary}
              </p>

              <div className="grid sm:grid-cols-3 gap-4">
                {/* Concepts */}
                {slide.keyConcepts?.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-2.5">
                      <Tags className="w-3 h-3" /> Begreber
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {slide.keyConcepts.map((c: any, i: number) => (
                        <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`}>
                          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer">
                            {c.term}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal */}
                {slide.legalFrameworks?.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-600 mb-2.5">
                      <Scale className="w-3 h-3" /> Lovgrundlag
                    </h4>
                    <ul className="space-y-2">
                      {slide.legalFrameworks.map((l: any, i: number) => (
                        <li key={i} className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs">
                          <span className="font-bold text-rose-900 block">{l.law} {l.paragraphs?.join(', ')}</span>
                          <span className="text-rose-700 opacity-80">{l.relevance}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Methods */}
                {slide.practicalTools?.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-2.5">
                      <Wrench className="w-3 h-3" /> Metoder
                    </h4>
                    <ul className="space-y-2">
                      {slide.practicalTools.map((t: any, i: number) => (
                        <li key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs">
                          <span className="font-bold text-emerald-900 block">{t.tool}</span>
                          <span className="text-emerald-700 opacity-80">{t.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <h4 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  <FileText className="w-3 h-3" /> Mine noter
                </h4>
                <Textarea
                  placeholder="Tilføj noter til dette slide..."
                  value={note}
                  onChange={e => onNoteChange(e.target.value)}
                  className="bg-slate-50 border-slate-100 rounded-xl text-xs min-h-[72px] resize-none focus:border-indigo-300 focus:ring-indigo-100"
                  rows={3}
                />
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
    <div className="fixed inset-x-0 bottom-0 top-[80px] z-[200] bg-slate-50 overflow-hidden flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 px-5 sm:px-8 py-3 flex items-center gap-4 shrink-0">
        <button onClick={quizData ? () => setQuizData(null) : onClose}
          className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-all active:scale-95 shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-slate-900 truncate text-sm">{seminar.overallTitle}</h2>
          <p className="text-[10px] font-bold text-slate-400">{slides.length} slides · {seminar.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest hidden sm:block">Gemmer...</span>}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Gemt</span>
            </div>
          )}
          <Button size="sm" onClick={handleStartQuiz} disabled={isGeneratingQuiz}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4 shadow-sm">
            {isGeneratingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />}
            Quiz
          </Button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {quizData ? (
          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto bg-white">
            <QuizView quizData={quizData} onFinish={() => setQuizData(null)} />
          </motion.div>
        ) : (
          <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Slides', val: slides.length, color: 'text-slate-700 bg-slate-100' },
                  { label: 'Begreber', val: totalConcepts, color: 'text-indigo-700 bg-indigo-50' },
                  { label: 'Love', val: totalLaw, color: 'text-rose-700 bg-rose-50' },
                  { label: 'Metoder', val: totalTools, color: 'text-emerald-700 bg-emerald-50' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`${color} rounded-2xl p-3 text-center`}>
                    <p className="text-xl font-black">{val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Slides</p>
                <button onClick={handleExpandAll} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors">
                  {expandAll ? '↑ Fold alle sammen' : '↓ Udvid alle'}
                </button>
              </div>

              {/* Slide feed */}
              <div className="space-y-3">
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
const SeminarCard: React.FC<{ seminar: SavedSeminar; onOpen: () => void; onDelete: () => void }> = ({ seminar, onOpen, onDelete }) => {
  const totalConcepts = seminar.slides?.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0) || 0;
  const totalLaw = seminar.slides?.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0) || 0;
  const date = seminar.createdAt?.toDate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer"
      onClick={onOpen}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Presentation className="w-5 h-5 text-white" />
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-black text-slate-900 leading-snug mb-1 text-sm line-clamp-2">{seminar.overallTitle}</h3>
        {seminar.fileName && (
          <p className="text-[10px] text-slate-400 font-medium truncate mb-4">{seminar.fileName}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2 py-0.5 bg-slate-50 rounded-md text-[10px] font-black text-slate-500">{seminar.slides?.length || 0} slides</span>
          {totalConcepts > 0 && <span className="px-2 py-0.5 bg-indigo-50 rounded-md text-[10px] font-black text-indigo-600">{totalConcepts} begreber</span>}
          {totalLaw > 0 && <span className="px-2 py-0.5 bg-rose-50 rounded-md text-[10px] font-black text-rose-600">{totalLaw} love</span>}
        </div>

        <div className="flex items-center justify-between">
          {date && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          <span className="text-[10px] font-black text-indigo-500 group-hover:text-indigo-700 transition-colors flex items-center gap-0.5">
            Åbn <ChevronRight className="w-3 h-3" />
          </span>
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

  const filtered = useMemo(() => {
    if (!searchQuery) return seminars;
    const q = searchQuery.toLowerCase();
    return seminars.filter(s =>
      s.overallTitle?.toLowerCase().includes(q) ||
      s.slides?.some(sl =>
        sl.slideTitle?.toLowerCase().includes(q) ||
        sl.summary?.toLowerCase().includes(q) ||
        sl.keyConcepts?.some((c: any) => c.term?.toLowerCase().includes(q)) ||
        sl.notes?.toLowerCase().includes(q)
      )
    );
  }, [seminars, searchQuery]);

  const groups = useMemo(() => {
    const g: Record<string, SavedSeminar[]> = {};
    filtered.forEach(s => {
      const d = s.createdAt?.toDate();
      if (!d) return;
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!g[k]) g[k] = [];
      g[k].push(s);
    });
    return g;
  }, [filtered]);

  const groupKeys = useMemo(() => Object.keys(groups).sort((a, b) => b.localeCompare(a)), [groups]);

  return (
    <>
      <AnimatePresence>
        {openSeminar && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <SeminarDetailView seminar={openSeminar} user={user} onClose={() => setOpenSeminar(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/portal" className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all active:scale-95">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-sm font-black text-slate-900">Mine Seminarer</h1>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{seminars.length} videnskort</p>
              </div>
            </div>
            <Link href="/seminar-architect">
              <Button size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-9 shadow-sm shadow-indigo-500/20">
                <Plus className="w-4 h-4 mr-1.5" /> Ny analyse
              </Button>
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
          {/* Page title */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">Dine videnskort</h2>
            <p className="text-sm text-slate-500">Analyserede seminar-præsentationer fra Seminar-Arkitekten.</p>
          </div>

          {/* Search */}
          {seminars.length > 2 && (
            <div className="relative max-w-sm mb-8">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Søg..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              {searchQuery ? (
                <>
                  <Search className="w-9 h-9 text-slate-200 mx-auto mb-3" />
                  <p className="font-bold text-slate-600 mb-1">Ingen resultater for "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="text-sm text-indigo-500 underline">Ryd søgning</button>
                </>
              ) : (
                <>
                  <BookCopy className="w-11 h-11 text-slate-200 mx-auto mb-4" />
                  <p className="font-black text-slate-700 mb-1">Ingen videnskort endnu</p>
                  <p className="text-sm text-slate-400 mb-6">Upload dine første seminar-slides for at komme i gang.</p>
                  <Link href="/seminar-architect">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11">
                      <Sparkles className="w-4 h-4 mr-2" /> Start Seminar-Arkitekten
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {groupKeys.map(key => {
                const [year, month] = key.split('-');
                const title = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('da-DK', { month: 'long', year: 'numeric' });
                const items = groups[key];
                return (
                  <section key={key}>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 capitalize">{title}</p>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(seminar => (
                        <SeminarCard key={seminar.id} seminar={seminar} onOpen={() => setOpenSeminar(seminar)} onDelete={() => handleDelete(seminar.id)} />
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
