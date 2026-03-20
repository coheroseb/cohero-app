
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookCopy, 
  ChevronDown, 
  Trash2, 
  Loader2, 
  Quote, 
  HelpCircle, 
  BookOpen, 
  Plus, 
  Tags, 
  Scale, 
  Wrench, 
  FileText, 
  CheckCircle, 
  Info, 
  BrainCircuit, 
  MoreVertical,
  Search,
  Presentation,
  Save,
  UploadCloud,
  File,
  X,
  Sparkles,
  Calendar,
  ChevronRight,
  Clock,
  Layout,
  Trophy,
  History
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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
  addDoc,
  setDoc,
  where,
  getDocs,
  increment,
  limit
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { SeminarAnalysis, QuizData } from '@/ai/flows/types';
import { generateQuizAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";


// --- TYPES ---
interface SavedSeminar extends DocumentData {
  id: string;
  overallTitle: string;
  slides: (SeminarAnalysis['slides'][number] & { notes?: string })[];
  createdAt: { toDate: () => Date };
  title?: string;
  keyConcepts?: any[];
  legalFrameworks?: any[];
  practicalTools?: any[];
}

// --- COMPONENTS ---

const QuizView: React.FC<{ quizData: QuizData; onFinish: () => void }> = ({ quizData, onFinish }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [quizComplete, setQuizComplete] = useState(false);

    const handleAnswerSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedAnswer(index);
        setIsAnswered(true);
        if (index === quizData.questions[currentQuestionIndex].correctOptionIndex) {
            setScore(s => s + 1);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setQuizComplete(true);
        }
    };
    
    const getButtonClass = (index: number) => {
        if (!isAnswered) {
          return "bg-white border-amber-100 hover:border-amber-400 hover:bg-amber-50/50";
        }
        const correctIndex = quizData.questions[currentQuestionIndex].correctOptionIndex;
        if (index === correctIndex) {
          return "bg-emerald-50 border-emerald-300 text-emerald-900 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
        }
        if (index === selectedAnswer && index !== correctIndex) {
          return "bg-rose-50 border-rose-300 text-rose-900";
        }
        return "bg-white opacity-40 border-slate-100";
    };

    if (quizComplete) {
        return (
            <div 
              className="text-center py-16 px-8 bg-white rounded-[3rem] border border-amber-100 shadow-2xl max-w-lg mx-auto"
            >
                <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8">
                   <Trophy className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-4xl font-bold text-amber-950 serif mb-4">Quiz Fuldført!</h3>
                <p className="text-xl text-slate-500 mb-10">
                  Du fik <span className="text-amber-950 font-black">{score}</span> ud af <span className="font-bold">{quizData.questions.length}</span> rigtige.
                </p>
                <div className="flex flex-col gap-4">
                  <Button size="lg" onClick={onFinish} className="w-full">
                    Afslut & Gem Resultat
                  </Button>
                  <Button variant="secondary" onClick={() => {
                    setCurrentQuestionIndex(0);
                    setSelectedAnswer(null);
                    setIsAnswered(false);
                    setScore(0);
                    setQuizComplete(false);
                  }}>
                    Prøv igen
                  </Button>
                </div>
            </div>
        )
    }

    const question = quizData.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quizData.questions.length) * 100;
    
    return (
        <div className="max-w-2xl mx-auto py-12 px-6">
            <div className="mb-12">
              <div className="flex justify-between items-end mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40">Videns-check</p>
                <p className="text-xs font-bold text-amber-950 serif">Spørgsmål {currentQuestionIndex + 1} af {quizData.questions.length}</p>
              </div>
              <div className="w-full h-1.5 bg-amber-50 rounded-full overflow-hidden border border-amber-100">
                <div 
                  className="h-full bg-amber-950" style={{width: `${progress}%`}}
                />
              </div>
            </div>

            <div className="space-y-10">
                <h2 className="text-3xl font-bold text-amber-950 serif leading-tight text-center">{question.question}</h2>
                
                <div className="grid gap-4">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={isAnswered}
                      className={`group w-full p-6 rounded-2xl border-2 text-left flex items-start gap-5 transition-all duration-300 ${getButtonClass(index)}`}
                    >
                      <div className={`w-8 h-8 flex-shrink-0 rounded-md flex items-center justify-center font-bold text-xs border-2 border-current mt-1 ${isAnswered && index === quizData.questions[currentQuestionIndex].correctOptionIndex ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-amber-200 text-amber-900 group-hover:border-amber-400'}`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1 font-medium text-lg pt-0.5">{option}</span>
                    </button>
                  ))}
                </div>

                {isAnswered && (
                  <div className="mt-8 p-8 bg-white rounded-3xl border border-amber-100 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Info className="w-4 h-4 text-amber-700" />
                      </div>
                      <h4 className="font-black uppercase text-[10px] tracking-widest text-amber-900">Forklaring</h4>
                    </div>
                    <p className="text-slate-600 leading-relaxed italic">"{question.explanation}"</p>
                    <Button size="lg" onClick={handleNextQuestion} className="w-full mt-8 shadow-lg shadow-amber-950/10">
                      {currentQuestionIndex < quizData.questions.length - 1 ? 'Næste spørgsmål' : 'Se resultat'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
            </div>
        </div>
    );
};

const SeminarDetailView: React.FC<{ seminar: SavedSeminar, user: any }> = ({ seminar, user }) => {
    const { userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [notes, setSlideNotes] = useState<Record<number, string>>(() => {
        if (!seminar.slides || !Array.isArray(seminar.slides)) return {};
        return seminar.slides.reduce((acc, slide) => {
            if (slide.notes) {
                acc[slide.slideNumber] = slide.notes;
            }
            return acc;
        }, {} as Record<number, string>);
    });
    
    const [debouncedNotes] = useDebounce(notes, 1500);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const isInitialMount = useRef(true);

    const [quizData, setQuizData] = useState<QuizData | null>(null);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    const handleStartQuiz = async () => {
        if (!seminar || !user || !seminar.slides) return;
        setIsGeneratingQuiz(true);
        setQuizData(null);
        try {
            const contextText = seminar.slides.map(s => `Slide ${s.slideNumber} (${s.slideTitle}): ${s.summary}`).join('\n');
            const result = await generateQuizAction({
                topic: `Seminaret '${seminar.overallTitle}'`,
                numQuestions: 5,
                contextText: contextText,
            });
            setQuizData(result.data);

        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingQuiz(false);
        }
    };

    const handleAutoSaveNotes = useCallback(async () => {
        if (!user || !seminar.id || !firestore) return;

        const hasChanges = seminar.slides.some(slide => {
            const serverNote = slide.notes || '';
            const clientNote = debouncedNotes[slide.slideNumber];
            return clientNote !== undefined && serverNote !== clientNote;
        });

        if (!hasChanges) {
             if (saveStatus !== 'idle' && saveStatus !== 'saved') setSaveStatus('saved');
            return;
        }

        setSaveStatus('saving');
        try {
            const seminarRef = doc(firestore, 'users', user.uid, 'seminars', seminar.id);
            
            const seminarSnap = await getDoc(seminarRef);
            if (!seminarSnap.exists()) {
                console.error("Cannot save notes, document does not exist:", seminar.id);
                setSaveStatus('idle'); 
                return;
            }

            const existingSlides = seminarSnap.data().slides || [];
            const updatedSlides = existingSlides.map((slide: any) => ({
                ...slide,
                notes: debouncedNotes[slide.slideNumber] ?? slide.notes ?? ''
            }));
            
            await updateDoc(seminarRef, { slides: updatedSlides });
            setSaveStatus('saved');
        } catch (error) {
            console.error("Error auto-saving notes:", error);
            // toast({
            //     variant: "destructive",
            //     title: "Fejl ved lagring",
            //     description: "Dine noter kunne ikke gemmes automatisk. Tjek din internetforbindelse.",
            // });
            setSaveStatus('idle');
        }
    }, [user, seminar.id, seminar.slides, firestore, debouncedNotes, toast, saveStatus]);
    
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (seminar.id) {
          handleAutoSaveNotes();
        }
    }, [debouncedNotes, seminar.id, handleAutoSaveNotes]);
    
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if(saveStatus === 'saved') {
            timer = setTimeout(() => setSaveStatus('idle'), 2000);
        }
        return () => clearTimeout(timer);
    }, [saveStatus]);

    if (quizData) {
        return (
            <div className="bg-amber-50/30 min-h-[500px]">
                <QuizView 
                  quizData={quizData} 
                  onFinish={() => setQuizData(null)} 
                />
            </div>
        )
    }

    const isNewFormat = seminar.slides && Array.isArray(seminar.slides);

    return (
        <div className="bg-slate-50/50 p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-amber-100 pb-8">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-amber-900/40 mb-1">Analyse-dybde</h4>
                  <p className="text-lg font-bold text-amber-950 serif">{isNewFormat ? `${seminar.slides.length} Slides analyseret` : 'Gammel format'}</p>
                </div>
                <Button onClick={handleStartQuiz} disabled={isGeneratingQuiz} className="shadow-xl shadow-amber-950/10">
                    {isGeneratingQuiz ? <Loader2 className="w-4 h-4 animate-spin"/> : <BrainCircuit className="w-4 h-4"/>}
                    Start Videns-Quiz
                </Button>
            </div>

            {isNewFormat ? (
                <div className="space-y-10">
                    {seminar.slides.map((slide, index) => (
                        <div key={index} className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 mb-8">
                              <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-100 flex items-center justify-center font-black serif text-xl">
                                {slide.slideNumber}
                              </div>
                              <h4 className='font-bold text-2xl text-amber-950 serif'>{slide.slideTitle}</h4>
                            </div>
                            
                            <p className="text-slate-500 italic mb-10 leading-relaxed text-lg border-l-4 border-amber-100 pl-6">
                              "{slide.summary}"
                            </p>
                            
                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    {slide.keyConcepts && slide.keyConcepts.length > 0 && (
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                                              <Tags className="w-3.5 h-3.5"/> Kernebegreber
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {slide.keyConcepts.map((c: any, i: number) => (
                                                    <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`} className="bg-indigo-50 text-indigo-800 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100">
                                                        {c.term}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {slide.legalFrameworks && slide.legalFrameworks.length > 0 && (
                                        <div className="pt-3 mt-3 border-t border-dashed">
                                           <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                                             <Scale className="w-3.5 h-3.5"/> Lovgrundlag
                                           </h5>
                                            <ul className="space-y-3">
                                                {slide.legalFrameworks.map((l: any, i: number) => <li key={i} className="text-sm text-slate-700 bg-rose-50/30 p-4 rounded-2xl border border-rose-100">
                                                    <span className="font-bold text-rose-900">{l.law} {l.paragraphs.join(', ')}:</span>
                                                    <p className="mt-1 text-xs italic opacity-70">{l.relevance}</p>
                                                  </li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    {slide.practicalTools && slide.practicalTools.length > 0 && (
                                        <div className="space-y-4">
                                             <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                               <Wrench className="w-3.5 h-3.5"/> Metodiske Greb
                                             </h5>
                                             <ul className="space-y-3">
                                                {slide.practicalTools.map((t: any, i: number) => (
                                                  <li key={i} className="text-sm text-slate-700 bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                                                    <span className="font-bold text-emerald-900">{t.tool}:</span>
                                                    <p className="mt-1 text-xs italic opacity-70">{t.description}</p>
                                                  </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                         <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                           <FileText className="w-3.5 h-3.5"/> Mine Noter
                                         </h5>
                                         <Textarea
                                             placeholder="Tilføj dine noter til dette slide..."
                                             value={notes[slide.slideNumber] || ''}
                                             onChange={(e) => setSlideNotes(prev => ({...prev, [slide.slideNumber]: e.target.value}))}
                                             className="mt-2 bg-amber-50/30 border-amber-100"
                                             rows={3}
                                         />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p>Gammelt format, ingen slide-opdeling</p>
            )}

            <div className="flex justify-end pt-8 border-t border-amber-100 min-h-[40px] items-center">
                  {saveStatus === 'saving' && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin"/> Gemmer noter...</div>}
                  {saveStatus === 'saved' && <div className="flex items-center gap-2 text-xs text-emerald-600"><CheckCircle className="w-4 h-4"/> Gemt!</div>}
            </div>
        </div>
    )
}

function MineSeminarerPageContent() {
    const { user } = useApp();
    const firestore = useFirestore();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [seminars, setSeminars] = useState<SavedSeminar[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!user || !firestore) return;
      const q = query(collection(firestore, 'users', user.uid, 'seminars'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        setSeminars(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSeminar)));
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching seminars:", error);
        setIsLoading(false);
      });
      return () => unsub();
    }, [user, firestore]);
    
    const handleDelete = async (id: string) => {
        if (!user || !firestore || !window.confirm('Er du sikker på, du vil slette dette videnskort?')) return;
        
        const docRef = doc(firestore, 'users', user.uid, 'seminars', id);
        try {
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting seminar analysis: ", error);
        }
    };
    
    const filteredSeminars = useMemo(() => {
        if (!seminars) return [];
        if (!searchQuery) return seminars;

        const lowercasedQuery = searchQuery.toLowerCase();
        
        return seminars.filter(seminar => {
            if (seminar.overallTitle?.toLowerCase().includes(lowercasedQuery)) return true;
            if (seminar.title?.toLowerCase().includes(lowercasedQuery)) return true;

            if (seminar.slides) {
                for (const slide of seminar.slides) {
                    if (slide.slideTitle?.toLowerCase().includes(lowercasedQuery)) return true;
                    if (slide.summary?.toLowerCase().includes(lowercasedQuery)) return true;
                    if (slide.keyConcepts?.some(c => c.term.toLowerCase().includes(lowercasedQuery))) return true;
                    if (slide.legalFrameworks?.some(l => l.law.toLowerCase().includes(lowercasedQuery))) return true;
                    if (slide.practicalTools?.some(t => t.tool.toLowerCase().includes(lowercasedQuery))) return true;
                    if (slide.notes?.toLowerCase().includes(lowercasedQuery)) return true;
                }
            }
            return false;
        });
    }, [seminars, searchQuery]);

    const groupedSeminars = useMemo(() => {
        if (!filteredSeminars) return {};
        return filteredSeminars.reduce((acc, seminar) => {
            const date = seminar.createdAt?.toDate();
            if (!date) return acc;
    
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(seminar);
            return acc;
        }, {} as Record<string, SavedSeminar[]>);
    }, [filteredSeminars]);

    const sortedGroupKeys = useMemo(() => Object.keys(groupedSeminars).sort((a, b) => b.localeCompare(a)), [groupedSeminars]);
    
    return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex items-center gap-4">
            <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                Mine Seminarer
              </h1>
              <p className="text-base text-slate-500">
                Oversigt over dine gemte videnskort fra Seminar-Arkitekten.
              </p>
            </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8">
            <Link href="/seminar-architect">
                <Button>
                    <Plus className="w-4 h-4 mr-2"/>
                    Analyser nyt seminar
                </Button>
            </Link>
        </div>
        {isLoading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
        ) : filteredSeminars.length === 0 ? (
             <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-100">
                <BookCopy className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Du har ingen gemte seminarer endnu.</p>
                <p className="text-sm text-slate-400 mt-2">Gå til <Link href="/seminar-architect" className="underline font-semibold text-amber-700">Seminar-Arkitekten</Link> for at analysere dit første.</p>
             </div>
        ) : (
            <div className="space-y-12">
                {sortedGroupKeys.map(groupKey => {
                    const seminarsInGroup = groupedSeminars[groupKey];
                    if (seminarsInGroup.length === 0) return null;
                    const groupTitle = new Date(parseInt(groupKey.split('-')[0]), parseInt(groupKey.split('-')[1]) - 1).toLocaleString('da-DK', { month: 'long', year: 'numeric' });

                    return (
                        <section key={groupKey}>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-4 mb-4">
                                {groupTitle}
                            </h2>
                            <div className="space-y-4">
                                {seminarsInGroup.map(seminar => (
                                    <div key={seminar.id} className="bg-white rounded-2xl border border-amber-100/60 shadow-sm overflow-hidden">
                                        <div className="p-6 flex justify-between items-center cursor-pointer hover:bg-amber-50/30" onClick={() => setExpandedId(prev => prev === seminar.id ? null : seminar.id)}>
                                            <div>
                                                <p className="font-bold text-amber-950">{seminar.overallTitle || seminar.title}</p>
                                                <p className="text-xs text-slate-400 mt-1">{seminar.createdAt?.toDate().toLocaleDateString('da-DK')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(seminar.id); }}>
                                                    <Trash2 className="w-4 h-4 text-rose-500"/>
                                                </Button>
                                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === seminar.id ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        {expandedId === seminar.id && <SeminarDetailView seminar={seminar} user={user} />}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )
                })}
            </div>
        )}
      </main>
    </div>
    )
}

const MineSeminarerPageWrapper = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }
    
    return <MineSeminarerPageContent />;
}

export default MineSeminarerPageWrapper;
