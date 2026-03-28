'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  UploadCloud, 
  Loader2, 
  X, 
  Users, 
  MapPin, 
  AlertCircle, 
  Scale, 
  Calendar,
  ChevronRight,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  File,
  History,
  Lock,
  ArrowUpAZ,
  BrainCircuit,
  MessageSquare
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { analyzeCasePdfAction, unifiedChatAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import type { CaseAnalysis } from '@/ai/flows/types';

// PDF extraction helper (reused from SeminarArchitect but simplified)
async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38';
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '').join(' ');
    fullText += strings + "\n\n";
  }
  return fullText;
}

// ---------------------------------------------------------------------------
// Case Chat Overlay
// ---------------------------------------------------------------------------
const CaseChatOverlay: React.FC<{
  title: string;
  caseText: string;
  onClose: () => void;
  initialMessages?: { role: 'user' | 'assistant' | 'system'; content: string }[];
  onSave?: (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) => void;
}> = ({ title, caseText, onClose, initialMessages = [], onSave }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant' | 'system'; content: string }[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    try {
      const resp = await unifiedChatAction({
        message: text,
        chatHistory: messages as any,
        persona: 'case',
        context: {
          currentModule: 'CaseAnalyser',
          // Special context for case persona to know about the text
          currentPath: `Case: ${title}\n\n${caseText}`
        }
      });

      if (resp?.data) {
        setMessages(prev => [...prev, { role: 'assistant', content: resp.data.answer }]);
      }
    } catch (err: any) {
       console.error(err);
       setMessages(prev => [...prev, { role: 'assistant', content: "Beklager, der skete en fejl. Prøv igen senere." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 overflow-hidden">
      <div className="absolute top-8 right-8 z-10">
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 shadow-xl border border-white/10">
           <X className="w-6 h-6" />
        </button>
      </div>

      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full h-full max-w-2xl bg-white rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-amber-100 relative">
        <div className="p-6 sm:p-8 border-b border-amber-50 flex items-center gap-4 shrink-0 bg-[#FDFCF8]/80 backdrop-blur-xl z-20">
            <div className="w-12 h-12 bg-amber-950 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-900/20">
                <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-black text-amber-950 serif tracking-tight">Case Sparring</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Stil spørgsmål til casen: {title}</p>
            </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
            {messages.length === 0 && (
                <div className="py-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center text-amber-200 mx-auto shadow-inner">
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <div className="max-w-xs mx-auto">
                        <h4 className="text-lg font-black text-amber-950 serif mb-2">Hvad vil du vide?</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Jeg har læst sagsakterne og kan hjælpe dig med at forstå detaljerne eller finde citater.</p>
                    </div>
                </div>
            )}

            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 sm:p-6 rounded-[2rem] shadow-sm text-sm leading-relaxed ${
                        m.role === 'user' 
                          ? 'bg-amber-950 text-white rounded-tr-none' 
                          : 'bg-[#FDFCF8] border border-amber-100 text-slate-700 rounded-tl-none font-medium'
                    }`}>
                        <div dangerouslySetInnerHTML={{ __html: m.content }} />
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-[#FDFCF8] border border-amber-100 p-6 rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-amber-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-amber-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-amber-900 rounded-full animate-bounce" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tænker...</span>
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 sm:p-8 bg-white border-t border-amber-50">
            <div className="relative group">
                <input 
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Stil et spørgsmål til sagen..."
                    className="w-full h-14 pl-6 pr-16 bg-[#FDFCF8] border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-amber-200 focus:outline-none focus:ring-4 focus:ring-amber-50/50 transition-all placeholder:text-slate-400"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-2 h-10 w-10 bg-amber-950 text-white rounded-xl flex items-center justify-center transition-all hover:bg-black active:scale-90 disabled:opacity-50"
                >
                    <ArrowUpAZ className="w-5 h-5 rotate-180" />
                </button>
            </div>
            <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest mt-4">Sparring baseres på det uploade dokument.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CaseAnalyserPage: React.FC = () => {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const storage = useStorage();
  const router = useRouter();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [openCaseId, setOpenCaseId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [rawText, setRawText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    } else if (user && firestore) {
      fetchHistory();
    }
  }, [user, isUserLoading, router]);

  const fetchHistory = async () => {
    if (!user || !firestore) return;
    setIsHistoryLoading(true);
    try {
      const q = query(
        collection(firestore, 'users', user.uid, 'caseAnalyses'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const loadAnalysis = (item: any) => {
    setOpenCaseId(item.id);
    setAnalysis(item.analysis);
    setPdfUrl(item.pdfUrl);
    setFile({ name: item.fileName } as File);
    setChatHistory(item.chatHistory || []);
    setRawText(item.rawText || null);
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    if (!confirm('Er du sikker på, at du vil slette denne analyse?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'caseAnalyses', id));
      setHistory(prev => prev.filter(item => item.id !== id));
      toast({ title: 'Analyse slettet' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Kunne ikke slette' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      handleAnalyze(selectedFile);
    } else if (selectedFile) {
      toast({ variant: 'destructive', title: "Ugyldig filtype", description: "Vælg venligst en PDF-fil." });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      handleAnalyze(droppedFile);
    } else if (droppedFile) {
      toast({ variant: 'destructive', title: "Ugyldig filtype", description: "Vælg venligst en PDF-fil." });
    }
  };

  const handleAnalyze = async (pdfFile: File) => {
    if (!user || !firestore || !storage) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    setPdfUrl(null);
    setOpenCaseId(null);
    setChatHistory([]);
    setRawText(null);
    setUploadProgress(10);

    try {
      // 1. Upload to storage for viewing
      const storageRef = ref(storage, `case-analyses/${user.uid}/${Date.now()}_${pdfFile.name}`);
      setUploadProgress(30);
      await uploadBytes(storageRef, pdfFile);
      const url = await getDownloadURL(storageRef);
      setPdfUrl(url);
      setUploadProgress(50);

      // 2. Extract text for AI
      const text = await extractTextFromPdf(pdfFile);
      setRawText(text);
      setUploadProgress(70);

      // 3. Call AI action
      const response = await analyzeCasePdfAction({ caseText: text });
      setAnalysis(response.data);
      setUploadProgress(100);

      // 4. Save to history
      const docRef = await addDoc(collection(firestore, 'users', user.uid, 'caseAnalyses'), {
        fileName: pdfFile.name,
        pdfUrl: url,
        analysis: response.data,
        rawText: text,
        chatHistory: [],
        createdAt: serverTimestamp(),
      });
      setOpenCaseId(docRef.id);

      toast({ title: "Analyse færdig!", description: "Casen er nu gennemgået." });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke analysere filen." });
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
      fetchHistory();
    }
  };

  const isFreeTier = useMemo(() => 
    userProfile?.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership),
    [userProfile]
  );

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  if (isFreeTier) {
      return (
          <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-8 text-inter">
              <div className="max-w-md w-full text-center space-y-8">
                  <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-amber-100/50">
                      <Lock className="w-8 h-8" />
                  </div>
                  <div className="space-y-4">
                      <h1 className="text-3xl font-black text-amber-950 serif tracking-tight">Kollega+ Eksklusivt</h1>
                      <p className="text-slate-500 leading-relaxed italic text-sm">
                        Case-Analytikeren er et avanceret AI-værktøj forbeholdt vores Kollega+ medlemmer. 
                      </p>
                  </div>
                  <div className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-2xl space-y-8 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                          <Sparkles className="w-32 h-32" />
                      </div>
                      <div className="space-y-4 text-left relative z-10">
                          {[
                              "AI-drevet PDF sagsanalyse",
                              "Automatisk udtræk af paragraffer",
                              "Hændelsesforløb & tidslinje",
                              "Persongalleri & rolle-fordeling"
                          ].map((feat, i) => (
                              <div key={i} className="flex items-center gap-3 text-[13px] font-bold text-slate-700">
                                  <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                                  {feat}
                              </div>
                          ))}
                      </div>
                      <div className="space-y-4 relative z-10">
                        <Button onClick={() => router.push('/upgrade')} className="w-full h-16 bg-amber-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 text-[12px]">
                            Lås op nu
                        </Button>
                        <button onClick={() => router.back()} className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em] w-full">
                            Gå tilbage
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 selection:bg-amber-100 overflow-hidden h-screen text-inter">
      
      {/* SIDEBAR - ANALYSIS RESULTS */}
      <aside className="w-full lg:w-[400px] bg-white border-r border-amber-100 flex flex-col z-30 shadow-sm overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-6 flex items-center gap-4 border-b border-amber-50 bg-[#FDFCF8]/50 sticky top-0 z-10 backdrop-blur-md">
            <button onClick={() => router.back()} className="p-2 hover:bg-amber-50 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-amber-900" />
            </button>
            <div>
                <h1 className="text-lg font-bold text-amber-950 serif">Case-Analytikeren</h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/60">Din faglige AI-assistent</p>
            </div>
        </div>
        <div className="px-6 pt-6 -mb-4">
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                    <Scale className="w-12 h-12" />
                </div>
                <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-900/60 mb-2 flex items-center gap-2">
                    Peter Bundesens definition
                </h4>
                <p className="text-[11px] text-amber-950 font-medium leading-relaxed italic">
                    "Det er en oplevet, uønsket social livssituation, som der er en udbredt opfattelse om, at politiske institutioner har et ansvar for at afhjælpe. Løsningsindsatsen kan udføres af de politiske institutioner alene eller i samarbejde med andre aktører"
                </p>
            </div>
        </div>

        <div className="flex-1 p-6 space-y-8">
            {!analysis && !isAnalyzing ? (
                <div className="space-y-6">
                    <div className="px-1">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                           <History className="w-3.5 h-3.5" /> Tidligere Analyser
                        </h3>
                        
                        {isHistoryLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Henter historik...</span>
                            </div>
                        ) : history.length > 0 ? (
                            <div className="space-y-3">
                                {history.map((item) => (
                                    <div 
                                        key={item.id} 
                                        onClick={() => loadAnalysis(item)}
                                        className="p-4 bg-white border border-amber-50 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-amber-950 truncate max-w-[180px]">{item.fileName}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium">
                                                        {item.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-8 opacity-40 py-20">
                                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-200 mb-6">
                                    <Search className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-bold text-amber-950 mb-2">Ingen sags-historik</p>
                                <p className="text-xs text-slate-500 text-balance">Dine gennemgåede cases vil dukke op her, når du uploader din første fil.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : isAnalyzing ? (
                <div className="space-y-6 py-10">
                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                            <Loader2 className="w-12 h-12 animate-spin text-amber-950/20" />
                            <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-amber-950 animate-pulse" />
                        </div>
                        <p className="text-sm font-bold text-amber-950">Analyserer casen...</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Identificerer personer og paragraffer</p>
                    </div>
                    <div className="w-full h-1.5 bg-amber-50 rounded-full overflow-hidden border border-amber-100">
                        <motion.div 
                            className="h-full bg-amber-900" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            ) : analysis ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 animate-ink pb-10">
                    {/* Summary */}
                    <section className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-900/60 mb-3 flex items-center gap-2">
                           <BookOpen className="w-3 h-3" /> Faglig Opsummering
                        </h3>
                        <p className="text-sm text-amber-950 leading-relaxed italic">
                            "{analysis.sammenfatning}"
                        </p>
                    </section>

                    {/* Personer & Roller */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
                           <Users className="w-3.5 h-3.5" /> Personer & Roller
                        </h3>
                        <div className="space-y-3">
                            {analysis.personer.map((p, i) => (
                                <div key={i} className="p-4 bg-white border border-amber-50 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-amber-950">{p.navn}</span>
                                        <span className="text-[8px] font-black uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">{p.rolle}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">{p.beskrivelse}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sociale Problemer */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
                           <AlertCircle className="w-3.5 h-3.5" /> Sociale Problemer
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.socialeProblemer.map((prob, i) => (
                                <span key={i} className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-[10px] font-bold">
                                    {prob}
                                </span>
                            ))}
                        </div>
                    </section>

                    {/* Relevante Paragraffer */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
                           <Scale className="w-3.5 h-3.5" /> Juridisk Fundament
                        </h3>
                        <div className="space-y-3">
                            {analysis.relevanteParagraffer.map((p, i) => (
                                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <Scale className="w-12 h-12" />
                                    </div>
                                    <div className="relative z-10">
                                        <p className="text-xs font-black text-slate-900 mb-1">{p.lov} {p.paragraf}</p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">{p.relevans}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Tidslinje */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
                           <Calendar className="w-3.5 h-3.5" /> Hændelsesforløb
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-amber-100">
                            {analysis.tidslinje.map((t, i) => (
                                <div key={i} className="relative pl-6">
                                    <div className="absolute left-0 top-1.5 w-3.5 h-3.5 bg-white border-2 border-amber-900 rounded-full z-10" />
                                    <p className="text-[9px] font-black text-amber-900 uppercase mb-1">{t.dato}</p>
                                    <p className="text-xs text-slate-600 leading-normal">{t.hændelse}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </motion.div>
            ) : null}
        </div>

        {analysis && (
            <div className="p-6 border-t border-amber-50 space-y-3">
                <Button 
                    onClick={() => setShowChat(true)}
                    className="w-full h-14 bg-amber-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 text-[11px]"
                >
                    <MessageSquare className="w-4 h-4 mr-2" /> Start Case Sparring
                </Button>

                <Button 
                    variant="ghost" 
                    onClick={() => { setFile(null); setAnalysis(null); setPdfUrl(null); setOpenCaseId(null); setChatHistory([]); setRawText(null); }} 
                    className="w-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-12"
                >
                    <X className="w-4 h-4 mr-2" /> Ryd Analyse
                </Button>
            </div>
        )}
      </aside>

      {/* MAIN AREA - PDF VIEWER OR UPLOAD */}
      <main className="flex-1 flex flex-col bg-slate-900/5 items-center justify-center p-8 relative">
        <AnimatePresence mode="wait">
            {!pdfUrl ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="max-w-xl w-full"
                >
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-900">Nyt Værktøj</span>
                        </div>
                        <h2 className="text-4xl font-bold text-amber-950 serif mb-4">Case-Analytikeren</h2>
                        <p className="text-slate-500 text-lg italic leading-relaxed">
                            Upload en PDF af din case og lad AI identificere de faglige nøglepunkter på få sekunder.
                        </p>
                    </div>

                    <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] p-20 cursor-pointer transition-all duration-500 h-[400px]
                            ${isDragging ? 'border-amber-500 bg-amber-50/50 scale-[1.02]' : 'border-amber-100 bg-white hover:border-amber-300 hover:bg-amber-50/20'}`}
                    >
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 shadow-lg ${isDragging ? 'bg-amber-950 text-white' : 'bg-amber-50 text-amber-200 group-hover:bg-amber-100'}`}>
                            <UploadCloud className="w-12 h-12" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl font-bold text-amber-950 serif">Tryk eller træk din PDF her</p>
                            <p className="text-sm text-slate-400">Understøtter kun .pdf filer</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />
                    </label>

                    <div className="grid grid-cols-3 gap-6 mt-12">
                        {[
                            { icon: <Users className="w-5 h-5" />, label: "Person-træning" },
                            { icon: <Scale className="w-5 h-5" />, label: "Juridisk overblik" },
                            { icon: <AlertCircle className="w-5 h-5" />, label: "Problem-identifikation" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 text-amber-900/40">
                                <div className="p-3 bg-white rounded-xl border border-amber-50 shadow-sm">{item.icon}</div>
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full h-full flex flex-col rounded-3xl overflow-hidden border border-amber-100 shadow-2xl bg-white"
                >
                    <div className="h-14 bg-white border-b border-amber-50 flex items-center justify-between px-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <File className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-bold text-amber-950">{file?.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Visningsmode</span>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-100 flex items-center justify-center p-4">
                        <iframe 
                            src={`${pdfUrl}#toolbar=0`} 
                            className="w-full h-full rounded-xl shadow-inner bg-white border border-slate-200"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Røde Lamper (Blinking Red Flags) */}
        <div className="absolute top-12 left-12 flex flex-wrap gap-3 z-30 pointer-events-none pr-32">
            {analysis?.redFlags?.map((flag, i) => (
                <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="pointer-events-auto flex items-center gap-3 bg-rose-600/90 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-rose-400 backdrop-blur-md cursor-help group"
                    title={flag.description}
                >
                    <div className="relative flex items-center justify-center shrink-0">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping absolute opacity-50" />
                        <div className="w-3 h-3 bg-white rounded-full relative" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/70 leading-none">Rød Lampe</span>
                            <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded text-white leading-none">{flag.type}</span>
                        </div>
                        <span className="text-xs font-bold leading-tight mt-1">{flag.description}</span>
                    </div>
                </motion.div>
            ))}
        </div>

        {/* Floating action for history if needed */}
        {pdfUrl && !isAnalyzing && (
            <div className="absolute top-12 right-12 flex gap-3">
                 <button 
                    onClick={() => { setFile(null); setAnalysis(null); setPdfUrl(null); }}
                    className="p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-100 shadow-xl text-slate-400 hover:text-rose-500 transition-all hover:scale-105 active:scale-95 z-30"
                    title="Luk PDF"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        )}
        {/* Modals and Overlays */}
        <AnimatePresence>
            {showChat && openCaseId && rawText && (
                <CaseChatOverlay 
                    title={file?.name || 'Case'}
                    caseText={rawText}
                    initialMessages={chatHistory}
                    onClose={() => setShowChat(false)}
                    onSave={async (msgs) => {
                        if (!user || !firestore || !openCaseId) return;
                        try {
                            const ref = doc(firestore, 'users', user.uid, 'caseAnalyses', openCaseId);
                            await updateDoc(ref, { chatHistory: msgs });
                        } catch (e) { console.error('Error saving chat:', e); }
                    }}
                />
            )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CaseAnalyserPage;
