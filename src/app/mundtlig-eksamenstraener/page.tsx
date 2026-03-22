'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { 
  Mic, 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  HelpCircle, 
  Brain, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Quote, 
  MessageSquare, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  ShieldAlert,
  Gavel,
  History as HistoryIcon,
  Timer,
  Info,
  RefreshCw,
  Lock as LockIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { oralExamAnalysisAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { doc, updateDoc, serverTimestamp, increment, writeBatch, collection } from 'firebase/firestore';

// --- Types ---
interface TerminologyItem {
  term: string;
  feedback: string;
  suggestion: string;
}

interface LogicBridge {
  point: string;
  connectionToNext: string;
  status: 'strong' | 'weak';
}

interface TempoObservation {
  observation: string;
  suggestion: string;
}

interface AnalysisResult {
  terminologyAnalysis: TerminologyItem[];
  logicalBridgeAnalysis: LogicBridge[];
  tempoAnalysis: TempoObservation[];
  socraticQuestions: string[];
}

export default function MundtligEksamenstraenerPage() {
  const { user, userProfile, isUserLoading } = useApp();
  const router = useRouter();
  const { toast } = useToast();

  const [examType, setExamType] = useState('Bachelorprojekt');
  const [presentationText, setPresentationText] = useState('');
  const [ethicsContext, setEthicsContext] = useState('');
  const [lawContext, setLawContext] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveInterim, setLiveInterim] = useState('');
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<'Studerende' | 'Eksaminator'>('Studerende');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'terminology' | 'logic' | 'tempo' | 'questions'>('terminology');

  const firestore = useFirestore();

  const isPremiumUser = useMemo(() => !!userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership ?? ''), [userProfile]);

  const getDailyCount = (lastUsage?: any, dailyCount?: number) => {
    if (!lastUsage) return 0;
    const today = new Date();
    const lastUsageDate = typeof lastUsage.toDate === 'function' ? lastUsage.toDate() : new Date(lastUsage);
    return lastUsageDate.toDateString() === today.toDateString() ? dailyCount || 0 : 0;
  };

  const usedToday = userProfile ? getDailyCount(userProfile.lastOralExamUsage, userProfile.dailyOralExamCount) : 0;
  const totalAllowed = isPremiumUser ? Infinity : 0;
  const isOverLimit = !isPremiumUser;

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user || !userProfile) {
    return <AuthLoadingScreen />;
  }

  const handleStartAnalysis = async () => {
    if (!presentationText.trim()) {
      toast({
        title: "Tekst mangler",
        description: "Indtast venligst dit oplæg eller en transskribering.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await oralExamAnalysisAction({
        examType,
        presentationText,
        ethicsContext,
        lawContext
      });

      if (response && response.data) {
        setResult(response.data as AnalysisResult);
        
        // Usage tracking
        if (firestore && user) {
          const batch = writeBatch(firestore);
          const userRef = doc(firestore, 'users', user.uid);
          
          const updates: any = {
            lastOralExamUsage: serverTimestamp(),
            dailyOralExamCount: increment(1)
          };

          if (response.usage) {
              const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
              const pointsToAdd = Math.round(totalTokens * 0.05);
              if (pointsToAdd > 0) updates.cohéroPoints = increment(pointsToAdd);
              
              const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
              batch.set(tokenUsageRef, { 
                  flowName: 'oralExamAnalysis', 
                  ...response.usage, 
                  totalTokens, 
                  createdAt: serverTimestamp(), 
                  userId: user.uid, 
                  userName: userProfile.username || user.displayName || 'Anonym' 
              });
          }

          batch.update(userRef, updates);
          await batch.commit();
        }

        toast({
          title: "Analyse fuldført!",
          description: "Vi har gennemgået dit oplæg.",
        });
      } else {
        throw new Error("Fejl i AI-svar");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Fejl under analyse",
        description: "Der opstod en fejl i forbindelsen til AI'en. Prøv igen.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Ikke understøttet",
        description: "Din browser understøtter ikke stemmegenkendelse. Prøv Chrome eller Safari.",
        variant: "destructive"
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'da-DK';
    recognition.continuous = true;
    recognition.interimResults = true; // Enabled for live feel

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const now = Date.now();
          const elapsed = Math.floor((now - startTimeRef.current) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          const timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
          
          finalTranscript += `\n${timestamp} ${currentSpeaker}: ${transcript.trim()}`;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setPresentationText(prev => (prev + finalTranscript).trim());
        setLiveInterim(''); // Clear interim when finalized
      } else {
        setLiveInterim(interimTranscript);
      }
    };

    recognition.onstart = () => {
      setIsRecording(true);
      setLiveInterim('');
      if (!presentationText) startTimeRef.current = Date.now();
    };
    recognition.onend = () => {
      setIsRecording(false);
      setLiveInterim('');
    };
    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const resetAnalysis = () => {
    setResult(null);
    setPresentationText('');
  };

  return (
    <div className="bg-[#FDFBF7] min-h-[100dvh] selection:bg-blue-100 selection:text-blue-900 font-sans pb-24">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 sm:px-8 py-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/portal">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Mic className="w-6 h-6 text-blue-600" />
                Mundtlig Eksamenstræner
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI-Drevet Oplægstanalyse</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5">
               <Sparkles className="w-3 h-3 fill-current" /> Premium Analyse
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {isOverLimit ? (
            <motion.div 
              key="limit-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh] p-8 sm:p-12 text-center"
            >
              <div className="max-w-md w-full bg-white rounded-[36px] border border-slate-100 shadow-2xl shadow-slate-900/5 p-10 sm:p-14 flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-500/20">
                  <Mic className="w-10 h-10" />
                </div>
                <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Kollega+ Funktion</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 serif mb-4">Mundtlig Eksamenstræner</h3>
                <p className="text-slate-500 leading-relaxed mb-10 text-sm">
                  Få AI-feedback på dit mundtlige oplæg med terminologianalyse, logiske broer, tempovurdering og sokratiske spørgsmål. Eksklusivt for Kollega+ medlemmer.
                </p>
                <Link href="/upgrade" className="w-full">
                  <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Opgrader til Kollega+
                  </Button>
                </Link>
                <p className="text-[10px] text-slate-400 mt-4">Du kan også se alle muligheder på vores <Link href="/upgrade" className="underline">opgraderingsside</Link>.</p>
              </div>
            </motion.div>
          ) : !result && !isAnalyzing ? (
            <motion.div 
              key="input-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid lg:grid-cols-12 gap-8 md:gap-12"
            >
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-black uppercase tracking-widest text-slate-500">Dit Oplæg / Transskribering</label>
                    <span className="text-[10px] font-bold text-slate-400">Understøtter dansk tale-til-tekst paste</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl blur opacity-0 group-focus-within:opacity-20 transition duration-1000"></div>
                    <Textarea 
                      placeholder="Indsæt teksten fra dit oplæg her eller brug mikrofonen til at indtale det..."
                      className="min-h-[400px] rounded-[24px] border-slate-200 bg-white p-6 sm:p-8 text-lg font-medium leading-relaxed shadow-sm focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-all resize-none"
                      value={presentationText}
                      onChange={(e) => setPresentationText(e.target.value)}
                    />
                    
                    {/* Floating Recording Button & Controls */}
                    <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-30">
                        {isRecording && (
                            <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={currentSpeaker === 'Studerende' ? 'default' : 'outline'}
                                      className={`rounded-full text-[9px] h-7 font-black uppercase tracking-widest ${currentSpeaker === 'Studerende' ? 'bg-blue-600' : 'bg-white text-slate-400'}`}
                                      onClick={() => setCurrentSpeaker('Studerende')}
                                    >
                                      Studerende
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={currentSpeaker === 'Eksaminator' ? 'default' : 'outline'}
                                      className={`rounded-full text-[9px] h-7 font-black uppercase tracking-widest ${currentSpeaker === 'Eksaminator' ? 'bg-indigo-600' : 'bg-white text-slate-400'}`}
                                      onClick={() => setCurrentSpeaker('Eksaminator')}
                                    >
                                      Eksaminator
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-full animate-pulse shadow-sm">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Optager {currentSpeaker}...</span>
                                </div>
                                {liveInterim && (
                                  <div className="max-w-[300px] bg-white/90 backdrop-blur-sm p-4 rounded-3xl border border-blue-100 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed tabular-nums">
                                       <span className="text-blue-600 italic">Live:</span> "{liveInterim}"
                                    </p>
                                  </div>
                                )}
                            </div>
                        )}
                        <Button
                            onClick={toggleRecording}
                            className={`w-14 h-14 rounded-2xl shadow-xl transition-all active:scale-90 ${isRecording ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                            <Mic className={`w-6 h-6 ${isRecording ? 'animate-bounce' : ''}`} />
                        </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-blue-50/50 rounded-[32px] border border-blue-100 flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <HistoryIcon className="w-7 h-7" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-bold text-slate-900">Sådan virker det</h3>
                    <p className="text-sm text-slate-500 font-medium">Indsæt dit manuskript eller en optagelse af dig selv, der øver. AI'en analyserer din professionalisme og struktur.</p>
                  </div>
                  <Button 
                    onClick={handleStartAnalysis}
                    className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                  >
                    Start Analyse <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8">
                  <h3 className="text-lg font-black text-slate-900 serif tracking-tight">Kontekst & Indstillinger</h3>
                  
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Eksamenstype</label>
                    <select 
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                    >
                      <option>Bachelorprojekt</option>
                      <option>Tværs / Semesterprøve</option>
                      <option>Metode-eksamen</option>
                      <option>Juridisk Modul</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 ml-1">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Etiske dilemmaer (Valgfri)</label>
                    </div>
                    <Textarea 
                      placeholder="Nævn kort eventuelle etiske spidsfindigheder..."
                      className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-colors"
                      value={ethicsContext}
                      onChange={(e) => setEthicsContext(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 ml-1">
                      <Gavel className="w-4 h-4 text-blue-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Juridisk ramme (Valgfri)</label>
                    </div>
                    <Textarea 
                      placeholder="Hvilke paragraffer eller love er centrale?"
                      className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-colors"
                      value={lawContext}
                      onChange={(e) => setLawContext(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] text-white space-y-4 relative overflow-hidden shadow-xl shadow-indigo-500/20">
                    <div className="relative z-10">
                        <h4 className="font-extrabold text-xl serif">Gode Råd</h4>
                        <ul className="space-y-3 mt-4">
                            <li className="flex gap-3 text-sm text-indigo-50 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-indigo-200 shrink-0" />
                                Brug 10 minutter på at øve oplægget uden noter.
                            </li>
                            <li className="flex gap-3 text-sm text-indigo-50 font-medium">
                                <CheckCircle2 className="w-5 h-5 text-indigo-200 shrink-0" />
                                Ved mundtlig eksamen tæller din struktur 30%.
                            </li>
                        </ul>
                    </div>
                    <Brain className="absolute -right-8 -bottom-8 w-40 h-40 text-white/10 rotate-12" />
                </div>
              </div>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div 
              key="analyzing-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 blur-3xl animate-pulse rounded-full"></div>
                <div className="w-24 h-24 bg-white rounded-3xl border-2 border-blue-100 shadow-2xl flex items-center justify-center relative">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 serif tracking-tight">AI'en lytter til dine argumenter</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[0.35em] text-[10px] animate-pulse">Analyserer faglighed, struktur og flow</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analysis-results"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Analyse Gennemført
                  </div>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 serif tracking-tight leading-tight">Din X-Ray Analyse</h2>
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="outline" className="h-12 px-6 rounded-xl font-bold gap-2 text-slate-600" onClick={resetAnalysis}>
                     <RefreshCw className="w-4 h-4" /> Prøv igen
                   </Button>
                   <Button className="h-12 px-8 rounded-xl font-black uppercase tracking-widest gap-2 bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                     Hent Rapport <Zap className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                   </Button>
                </div>
              </div>

              {/* TABS NAVIGATION */}
              <div className="flex items-center gap-1 p-1 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
                {[
                  { id: 'terminology', label: 'Terminologi', icon: Activity },
                  { id: 'logic', label: 'Struktur', icon: TrendingUp },
                  { id: 'tempo', label: 'Tempo', icon: Timer },
                  { id: 'questions', label: 'Modspørgsmål', icon: MessageSquare },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-xl flex items-center gap-2.5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT */}
              <div className="grid gap-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'terminology' && (
                    <motion.div 
                      key="tab-terminology"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {result?.terminologyAnalysis.map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full group">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div className="space-y-4 flex-1">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hverdagssprog / Citater</p>
                              <h4 className="text-xl font-extrabold text-slate-900 border-l-4 border-blue-200 pl-4 py-1 italic">"{item.term}"</h4>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Anbefalet Begreb</p>
                                <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl font-bold text-lg">
                                    {item.suggestion}
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.feedback}</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'logic' && (
                     <motion.div 
                        key="tab-logic"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                     >
                        <div className="relative pl-8 border-l-2 border-slate-100 space-y-12">
                            {result?.logicalBridgeAnalysis.map((bridge, idx) => (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-12 top-0 w-8 h-8 rounded-full border-4 border-[#FDFBF7] flex items-center justify-center z-10 ${bridge.status === 'strong' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                                        {bridge.status === 'strong' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <AlertCircle className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm max-w-3xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-extrabold text-slate-900 tracking-tight">{bridge.point}</h4>
                                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${bridge.status === 'strong' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {bridge.status === 'strong' ? 'Stærk Kobling' : 'Svag Kobling'}
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">{bridge.connectionToNext}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </motion.div>
                  )}

                  {activeTab === 'tempo' && (
                    <motion.div 
                      key="tab-tempo"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid md:grid-cols-2 gap-8"
                    >
                      {result?.tempoAnalysis.map((item, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex gap-6 items-start">
                           <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 shrink-0">
                             <Timer className="w-8 h-8" />
                           </div>
                           <div className="space-y-4">
                             <h4 className="text-xl font-bold text-slate-900 serif tracking-tight">Observarsition ved {idx === 0 ? 'indledningen' : idx === 1 ? 'teorigennemgang' : 'analysen'}</h4>
                             <p className="text-sm text-slate-500 font-medium leading-relaxed italic border-l-2 border-amber-100 pl-4">{item.observation}</p>
                             <div className="p-5 bg-slate-900 text-white rounded-3xl text-sm font-bold shadow-lg">
                                <span className="text-amber-400">Råd:</span> {item.suggestion}
                             </div>
                           </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'questions' && (
                    <motion.div 
                      key="tab-questions"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="grid gap-6 max-w-4xl"
                    >
                       <div className="bg-amber-50/50 p-8 rounded-[40px] border border-amber-100 mb-6 flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                                <Info className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="font-bold text-amber-950 serif">Sokratsik Modspørgsmål</h4>
                                <p className="text-sm text-amber-900/60 font-medium leading-relaxed">Disse spørgsmål er designet til at presse din argumentation dér, hvor censor forventer mest af dig. Øv dine svar på disse.</p>
                            </div>
                       </div>
                       <div className="grid sm:grid-cols-3 gap-6">
                          {result?.socraticQuestions.map((q, idx) => (
                            <div key={idx} className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden group">
                                <span className="absolute -top-4 -right-4 text-[120px] font-black text-slate-50 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity select-none">{idx + 1}</span>
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <h4 className="text-xl font-extrabold text-slate-900 serif leading-tight">"{q}"</h4>
                                    <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                                        Eksamenstjek <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                          ))}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-12 bg-slate-900 rounded-[64px] text-white flex flex-col md:flex-row items-center gap-12 mt-12 overflow-hidden relative">
                 <div className="relative z-10 flex-1 space-y-6">
                    <h3 className="text-3xl md:text-4xl font-black serif tracking-tight">Klar til at erobre censoren?</h3>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
                      Brug denne feedback til at justere dine noter og hold en generalprøve med en medstuderende eller dit spejl.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button className="h-14 px-10 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                            Gennemse Igen
                        </Button>
                        <Button variant="outline" className="h-14 px-10 rounded-2xl border-white/20 text-white hover:bg-white/10 font-bold">
                            Del med læsegruppe
                        </Button>
                    </div>
                 </div>
                 <div className="relative z-10 w-full md:w-80 h-80 flex items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full"></div>
                    <Brain className="w-48 h-48 text-blue-500/20 animate-pulse" />
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 text-blue-400 opacity-40" />
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER NAV (MOBILE) */}
      <div className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%]">
          {!result && !isAnalyzing ? (
              <Button 
                onClick={handleStartAnalysis}
                className="w-full h-16 rounded-[24px] bg-blue-600 text-white font-black uppercase tracking-widest gap-2 shadow-2xl"
              >
                Analyser Oplæg <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
              </Button>
          ) : result && (
              <Button 
                onClick={resetAnalysis}
                className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest gap-2 shadow-2xl"
              >
                Ny Træning <RefreshCw className="w-5 h-5" />
              </Button>
          )}
      </div>

    </div>
  );
}
