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
  CalendarDays,
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
  MessageSquare,
  HelpCircle,
  ListChecks,
  Activity,
  Printer,
  Crown,
  Quote,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { lawDefinitions } from '@/lib/law-definitions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { analyzeCasePdfAction, unifiedChatAction, fetchRetsinformationLawDetailsAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, addDoc, updateDoc, serverTimestamp, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import type { CaseAnalysis } from '@/ai/flows/types';

interface LawConfig {
  id: string;
  name?: string;
  title?: string;
  [key: string]: any;
}

// PDF extraction helper with fallback worker URLs
async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
    const pdfjsVersion = '4.10.38';
    GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.mjs`;
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
  } catch (e) {
    console.warn("Primary PDF worker failed, trying fallback...", e);
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
    GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs`;
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
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftVurdering, setDraftVurdering] = useState<string | null>(null);
  const [isGeneratingGaps, setIsGeneratingGaps] = useState(false);
  const [laws, setLaws] = useState<LawConfig[]>([]);
  const [retsinfoMap, setRetsinfoMap] = useState<Record<string, { officialTitle?: string; retsinformationUrl?: string; isVerified: boolean }>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    } else if (user && firestore) {
      fetchHistory();
      fetchLaws();
    }
  }, [user, isUserLoading, router, firestore]);

  useEffect(() => {
    const currentAnalysis = analysis;
    if (!currentAnalysis?.relevanteParagraffer || currentAnalysis.relevanteParagraffer.length === 0) return;
    
    let isCancelled = false;
    async function loadRetsinfo() {
      const list = currentAnalysis?.relevanteParagraffer || [];
      const newMap: Record<string, { officialTitle?: string; retsinformationUrl?: string; isVerified: boolean }> = {};
      for (const p of list) {
        const key = `${p.lov}-${p.paragraf}`;
        try {
          const details = await fetchRetsinformationLawDetailsAction(p.lov, p.paragraf);
          if (details) {
            newMap[key] = details;
          }
        } catch (e) {
          console.error("Error loading Retsinfo details for:", key, e);
          newMap[key] = { officialTitle: p.lov, retsinformationUrl: `https://www.retsinformation.dk/search?t=${encodeURIComponent(p.lov)}`, isVerified: true };
        }
      }
      if (!isCancelled) {
        setRetsinfoMap(prev => ({ ...prev, ...newMap }));
      }
    }

    loadRetsinfo();
    return () => { isCancelled = true; };
  }, [analysis?.relevanteParagraffer]);

  const fetchLaws = async () => {
    if (!firestore) return;
    try {
      const q = query(collection(firestore, 'laws'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LawConfig[];
      setLaws(data);
    } catch (e) { console.error('Error fetching laws:', e); }
  };

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
    setDraftVurdering(item.analysis?.socialfagligVurdering || null);
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
      let finalAnalysis = response.data;

      // Check if we need to supplement with videnshuller/opfølgning
      if (!finalAnalysis.videnshuller || !finalAnalysis.opfølgning) {
          try {
              const gapPrompt = `Her er en socialfaglig case-analyse: ${JSON.stringify(finalAnalysis)}
              Baseret på sagen, identificér:
              1. Videnshuller (hvad mangler vi for at træffe en afgørelse?)
              2. Opfølgning (hvad er de næste skridt?)
              
              Svar KUN med en JSON-struktur: { "videnshuller": ["...", "..."], "opfølgning": ["...", "..."] }`;
              
              const res = await unifiedChatAction({
                  message: gapPrompt,
                  chatHistory: [],
                  persona: 'case',
                  context: { currentModule: 'CaseAnalyser', currentPath: 'Generering af videnshuller' }
              });
              
              if (res?.data?.answer) {
                  try {
                      const jsonStr = res.data.answer.replace(/```json|```/g, '').trim();
                      const gaps = JSON.parse(jsonStr);
                      finalAnalysis = { ...finalAnalysis, ...gaps };
                  } catch (e) { console.error("Could not parse gaps JSON", e); }
              }
          } catch (gapErr) {
              console.error("Error generating gaps surplus:", gapErr);
          }
      }

      setAnalysis(finalAnalysis);
      setUploadProgress(100);

      // 4. Save to history
      const docRef = await addDoc(collection(firestore, 'users', user.uid, 'caseAnalyses'), {
        fileName: pdfFile.name,
        pdfUrl: url,
        analysis: finalAnalysis,
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

  const handleGenerateDraft = async () => {
    if (!rawText || !user || !firestore || !openCaseId || !analysis) return;
    setIsGeneratingDraft(true);
    try {
        const prompt = `Som en erfaren socialrådgiver, skal du skrive en struktureret 'socialfaglig vurdering' af denne sag.
        Brug følgende overskrifter i dit svar:
        1. **Problemformulering** (Hvad er kernen?)
        2. **Analytiske pointer** (Hvorfor er det et problem?)
        3. **Faglig vurdering & handlemuligheder** (Hvad skal der gøres?)
        
        Svaret skal være formelt, sagligt og fyldestgørende.
        Her er sagen: ${rawText}`;

        const resp = await unifiedChatAction({
            message: prompt,
            chatHistory: [],
            persona: 'case',
            context: { currentModule: 'CaseAnalyser', currentPath: 'Generering af socialfaglig vurdering' }
        });

        if (resp?.data) {
            const draft = resp.data.answer;
            setDraftVurdering(draft);
            
            // Save to firestore
            const ref = doc(firestore, 'users', user.uid, 'caseAnalyses', openCaseId);
            await updateDoc(ref, { 
                "analysis.socialfagligVurdering": draft 
            });
            toast({ title: "Kladde genereret!", description: "Din socialfaglige vurdering er klar." });
        }
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: "Kunne ikke generere kladde" });
    } finally {
        setIsGeneratingDraft(false);
    }
  };

  const getLawIdFromName = (name: string) => {
    const normalized = name.toLowerCase().trim();
    
    // Map of common abbreviations
    const abbrevMap: Record<string, string> = {
        'bl': 'barnets lov',
        'sel': 'social service',
        'fvl': 'forvaltningsloven',
        'sul': 'sundhedsloven',
        'las': 'aktiv socialpolitik',
        'lab': 'aktiv beskæftigelsesindsats',
        'ofl': 'offentlighedsloven',
        'fal': 'forældreansvarsloven',
        'ffl': 'folkeskoleloven'
    };

    const targetTerm = abbrevMap[normalized] || normalized;

    const found = laws.find(d => 
        (d.name && d.name.toLowerCase().includes(targetTerm)) || 
        d.id.toLowerCase() === normalized ||
        (d.abbreviation && d.abbreviation.toLowerCase() === normalized)
    );
    return found?.id || null;
  };

  const isFreeTier = useMemo(() => {
    if (userProfile?.role === 'admin') return false;
    const mem = userProfile?.membership || 'Kollega';
    return ['Kollega', 'Group Pro'].includes(mem);
  }, [userProfile]);

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 selection:bg-amber-100 text-inter">
      {/* 
          WRAPPER FOR THE INTERACTIVE UI 
          We hide this entirely during printing to avoid overlaps
      */}
      <div className="flex flex-col lg:flex-row h-screen overflow-hidden print:hidden relative">
        
        {/* PREMIUM TEASER OVERLAY FOR FREE TIER */}
        {isFreeTier && (
            <div className="absolute inset-0 z-[100] bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-amber-100 p-10 text-center space-y-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                        <Sparkles className="w-32 h-32" />
                    </div>
                    
                    <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-amber-100/50 relative z-10">
                        <Crown className="w-8 h-8 fill-current" />
                    </div>
                    
                    <div className="space-y-3 relative z-10">
                        <h2 className="text-3xl font-black text-amber-950 serif tracking-tight">Kollega+ Eksklusivt</h2>
                        <p className="text-slate-500 leading-relaxed italic text-sm">
                            Få AI til at analysere dine sagsakter, identificere paragraffer og tidslinjer automatisk.
                        </p>
                    </div>

                    <div className="space-y-4 text-left relative z-10 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        {[
                            "AI-drevet PDF sagsanalyse",
                            "Automatisk udtræk af paragraffer",
                            "Hændelsesforløb & tidslinje",
                            "Persongalleri & rolle-fordeling"
                        ].map((feat, i) => (
                            <div key={i} className="flex items-center gap-3 text-[12px] font-bold text-slate-700">
                                <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px]">✓</div>
                                {feat}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 relative z-10">
                        <Button onClick={() => router.push('/upgrade')} className="w-full h-16 bg-amber-950 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 text-[12px]">
                            Opgrader til Kollega+
                        </Button>
                        <button onClick={() => router.back()} className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-[0.2em] w-full">
                            Måske senere
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
        {/* SIDEBAR - ANALYSIS RESULTS */}
        <aside className="w-full lg:w-[400px] bg-white border-r border-amber-100 flex flex-col z-30 shadow-sm overflow-y-auto custom-scrollbar shrink-0">
        <div className="p-8 flex items-center gap-5 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-xl transition-all active:scale-95 text-slate-400 hover:text-slate-900 border border-slate-100">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-xl font-[900] text-slate-900 tracking-tight">Case Analyser</h1>
                <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">AI-Drevet Analyse</span>
                </div>
            </div>
        </div>
        
        <div className="px-6 pt-6">
            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                    <Scale className="w-16 h-16 text-indigo-900" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-100">
                        <Quote className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-900/60">
                        Faglig Definition
                    </h4>
                </div>
                <p className="text-[11px] text-slate-600 font-semibold leading-relaxed italic relative z-10">
                    "Det er en uønsket social livssituation, som politiske institutioner har et ansvar for at afhjælpe..."
                </p>
                <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300 mt-2">Peter Bundesen</p>
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
                                        className="p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-black text-slate-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">{item.fileName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Clock className="w-3 h-3 text-slate-300" />
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                            {item.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => deleteHistoryItem(item.id, e)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-500 transition-all shrink-0"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-10 py-20 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                                    <History className="w-8 h-8" />
                                </div>
                                <h4 className="text-sm font-black text-slate-900 mb-2">Ingen historik</h4>
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Upload din første case for at starte din historik.</p>
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
                    <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-20 h-20" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4 flex items-center gap-2">
                           <BookOpen className="w-3.5 h-3.5" /> Faglig Konklusion
                        </h3>
                        <p className="text-sm font-medium leading-relaxed italic text-indigo-50/90 relative z-10">
                            "{analysis.sammenfatning}"
                        </p>
                    </section>

                    {/* Personer & Roller */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 px-2 flex items-center gap-2">
                           <Users className="w-4 h-4 text-indigo-500" /> Persongalleri
                        </h3>
                        <div className="space-y-4">
                            {analysis.personer.map((p, i) => (
                                <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                {i + 1}
                                            </div>
                                            <span className="text-sm font-[900] text-slate-900 tracking-tight">{p.navn}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase bg-slate-100 text-slate-500 px-3 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">{p.rolle}</span>
                                    </div>
                                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium pl-11">{p.beskrivelse}</p>
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

                    
                    {/* Diagnoser */}
                    {analysis.diagnoser && analysis.diagnoser.length > 0 && (
                        <section>
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1 flex items-center gap-2">
                               <BrainCircuit className="w-3.5 h-3.5 text-rose-500" /> Kliniske Diagnoser
                            </h3>
                            <div className="space-y-3">
                                {analysis.diagnoser.map((diag, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => router.push("/diagnose-guide?query=" + encodeURIComponent(diag.navn))}
                                        className="w-full p-4 bg-white border border-rose-50 rounded-2xl shadow-sm hover:shadow-md hover:border-rose-200 transition-all text-left flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                                                <Activity className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{diag.navn}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Klik for ICD-11 opslag</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-rose-500 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Relevante Paragraffer */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-5 px-2 flex items-center gap-2">
                           <Scale className="w-4 h-4 text-indigo-500" /> Juridisk Fundament
                        </h3>
                        <div className="space-y-4">
                            {analysis.relevanteParagraffer.map((p, i) => {
                                const lawId = getLawIdFromName(p.lov);
                                let cleanPara = p.paragraf.split('(')[0].trim();
                                if (!cleanPara.endsWith('.')) cleanPara += '.';
                                const rawPara = cleanPara.includes('§') ? cleanPara : `§ ${cleanPara}`;
                                const paragraphParam = encodeURIComponent(rawPara);
                                
                                const retsKey = `${p.lov}-${p.paragraf}`;
                                const retsData = retsinfoMap[retsKey];
                                const retsUrl = retsData?.retsinformationUrl || `https://www.retsinformation.dk/search?t=${encodeURIComponent(`${p.lov} ${p.paragraf}`)}`;

                                return (
                                    <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:scale-110 transition-transform duration-700">
                                            <Scale className="w-16 h-16" />
                                        </div>
                                        <div className="relative z-10 space-y-3">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {lawId && (
                                                        <button 
                                                            onClick={() => router.push(`/lov-portal/view/${lawId}?para=${paragraphParam}`)}
                                                            className="px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-indigo-600 active:scale-95 shadow-md flex items-center gap-1.5 transition-all"
                                                        >
                                                            {p.lov} {p.paragraf}
                                                            <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                    <a
                                                        href={retsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 active:scale-95 flex items-center gap-1.5 transition-all shadow-sm group/rets"
                                                        title={retsData?.officialTitle || 'Åbn i Retsinformation'}
                                                    >
                                                        <Scale className="w-3.5 h-3.5 text-amber-600" />
                                                        <span>{!lawId ? `${p.lov} ${p.paragraf}` : 'Retsinformation API'}</span>
                                                        <ExternalLink className="w-3 h-3 text-amber-600/70 group-hover/rets:translate-x-0.5 transition-transform" />
                                                    </a>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Retsinformation Verificeret</span>
                                                </div>
                                            </div>
                                            <p className="text-[12px] text-slate-500 leading-relaxed font-medium">{p.relevans}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                    
                    {/* Videnshuller & Opfølgning - NEW */}
                    {(analysis.videnshuller?.length || analysis.opfølgning?.length) ? (
                        <section className="space-y-6">
                            {analysis.videnshuller && analysis.videnshuller.length > 0 && (
                                <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-[2rem] relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                                        <HelpCircle className="w-16 h-16" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                                        <HelpCircle className="w-3.5 h-3.5" /> Videnshuller & Mangler
                                    </h3>
                                    <ul className="space-y-2">
                                        {analysis.videnshuller.map((gap, i) => (
                                            <li key={i} className="flex gap-3 text-xs text-slate-700 leading-relaxed group">
                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-300 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                                                {gap}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.opfølgning && analysis.opfølgning.length > 0 && (
                                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                                        <ListChecks className="w-16 h-16" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                                        <ListChecks className="w-3.5 h-3.5" /> Næste Skridt & Opfølgning
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.opfølgning.map((step, i) => (
                                            <li key={i} className="flex gap-3 text-xs text-slate-700 leading-relaxed p-3 bg-white/50 border border-emerald-50 rounded-xl group hover:border-emerald-200 transition-all">
                                                <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">
                                                    {i + 1}
                                                </div>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>
                    ) : null}

                    {/* Socialfaglig Vurdering - OPTIMIZATION #1 */}
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                           <FileText className="w-3.5 h-3.5" /> Socialfaglig Vurdering
                        </h3>
                        
                        {!draftVurdering ? (
                            <button 
                                onClick={handleGenerateDraft}
                                disabled={isGeneratingDraft}
                                className="w-full p-6 bg-amber-50 border border-amber-200 border-dashed rounded-[2rem] hover:bg-amber-100/50 transition-all flex flex-col items-center justify-center gap-3 group"
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-amber-500 shadow-sm ${isGeneratingDraft ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>
                                    {isGeneratingDraft ? <Loader2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-amber-950">Generér vurderings-kladde</p>
                                    <p className="text-[9px] text-slate-400 font-medium italic">Få AI til at skrive det første udkast</p>
                                </div>
                            </button>
                        ) : (
                            <div className="p-6 bg-[#FDFCF8] border border-amber-100 rounded-[2.5rem] relative overflow-hidden group shadow-sm">
                                <div className="absolute top-4 right-4 z-10 flex gap-2">
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(draftVurdering);
                                            toast({ title: "Kopieret!", description: "Kladden er kopieret til udklipsholderen." });
                                        }}
                                        className="p-2 bg-white border border-amber-100 rounded-xl hover:bg-amber-50 transition-all shadow-sm"
                                        title="Kopier tekst"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    </button>
                                    <button 
                                        onClick={() => handleGenerateDraft()}
                                        className="p-2 bg-white border border-amber-100 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm"
                                        title="Genskab"
                                    >
                                        <History className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="prose prose-sm prose-amber max-w-none">
                                    <div 
                                        className="text-[13px] text-slate-700 leading-relaxed font-serif whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: draftVurdering }}
                                    />
                                </div>
                                <div className="mt-4 pt-4 border-t border-amber-50 flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-900/40">AI-genereret Arbejdsdokument</span>
                                    <Sparkles className="w-3 h-3 text-amber-200" />
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Tidslinje */}
                    <section>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-2 flex items-center gap-2">
                           <CalendarDays className="w-4 h-4 text-indigo-500" /> Hændelsesforløb
                        </h3>
                        <div className="space-y-0 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                            {analysis.tidslinje.map((t, i) => (
                                <div key={i} className="relative pl-10 pb-8 last:pb-0 group">
                                    <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-200 rounded-full z-10 flex items-center justify-center group-hover:border-indigo-600 transition-colors duration-500 shadow-sm">
                                        <div className="w-1.5 h-1.5 bg-slate-200 rounded-full group-hover:bg-indigo-600 transition-colors" />
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-transparent hover:border-slate-100 hover:bg-slate-50/50 transition-all">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1.5">{t.dato}</p>
                                        <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{t.hændelse}</p>
                                    </div>
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

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                      onClick={() => {
                          if (!analysis) return;
                          const reportText = `CASE-ANALYSE: ${file?.name || 'Case'}\n\nRESUMÉ:\n${analysis.sammenfatning}\n\nPERSONGALLERI:\n${analysis.personer.map(p => `- ${p.navn} (${p.rolle}): ${p.beskrivelse}`).join('\n')}\n\nJURIDISK FUNDAMENT:\n${analysis.relevanteParagraffer.map(p => `- ${p.lov} ${p.paragraf}: ${p.relevans}`).join('\n')}\n\nHÆNDELSESFORLØB:\n${analysis.tidslinje.map(t => `- [${t.dato}] ${t.hændelse}`).join('\n')}${draftVurdering ? `\n\nSOCIALFAGLIG VURDERING:\n${draftVurdering}` : ''}`;
                          navigator.clipboard.writeText(reportText);
                          toast({ title: "Kopieret!", description: "Hele analysen er kopieret til udklipsholderen." });
                      }}
                      variant="outline"
                      className="h-12 border-amber-200 text-amber-900 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-50 transition-all text-[10px]"
                  >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Kopier Tekst
                  </Button>

                  <Button 
                      onClick={() => window.print()}
                      variant="outline"
                      className="h-12 border-amber-200 text-amber-900 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-50 transition-all text-[10px]"
                  >
                      <Printer className="w-3.5 h-3.5 mr-1.5" /> Eksporter PDF
                  </Button>
                </div>

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
      <main className="flex-1 flex flex-col bg-slate-50/50 min-h-[calc(100vh-4rem)] p-4 md:p-8 overflow-y-auto relative">
        <AnimatePresence mode="wait">
            {!pdfUrl ? (
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-2xl w-full mx-auto my-auto flex flex-col items-center justify-center py-6"
                >
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white border border-slate-200/60 rounded-full shadow-sm mb-6">
                            <div className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center">
                                <Sparkles className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Premium Workspace</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-[900] text-slate-900 tracking-tight mb-4">
                            Lynhurtig <span className="bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">Sagsanalyse</span>
                        </h2>
                        <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-lg mx-auto">
                            Lad AI gennemgå dine sagsakter for dig. Identificér paragraffer, hændelser og videnshuller på få sekunder.
                        </p>
                    </div>

                    <label
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={`group relative w-full flex flex-col items-center justify-center border-2 border-dashed rounded-[2.5rem] p-8 md:p-12 cursor-pointer transition-all duration-300 min-h-[260px] md:min-h-[300px]
                            ${isDragging 
                                ? 'border-indigo-600 bg-indigo-50/40 scale-[1.01] shadow-xl shadow-indigo-100/50' 
                                : 'border-slate-200 bg-white/80 backdrop-blur-sm hover:border-indigo-400 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50'}`}
                    >
                        <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center mb-6 transition-all duration-500 shadow-xl ${
                            isDragging 
                                ? 'bg-indigo-600 text-white scale-110 rotate-3' 
                                : 'bg-slate-900 text-white group-hover:bg-indigo-600 group-hover:-rotate-3 group-hover:scale-105'
                        }`}>
                            <UploadCloud className="w-9 h-9 md:w-11 md:h-11" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-xl md:text-2xl font-[900] text-slate-900 tracking-tight">Tryk eller træk din PDF her</p>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Understøtter PDF sagsakter op til 20 MB</p>
                        </div>

                        {/* Subtle background blur decoration */}
                        <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all pointer-events-none" />
                        <div className="absolute -top-6 -left-6 w-28 h-28 bg-amber-400/5 rounded-full blur-2xl group-hover:scale-150 transition-all pointer-events-none" />

                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                        />
                    </label>

                    <div className="grid grid-cols-3 gap-4 md:gap-6 mt-10 w-full">
                        {[
                            { icon: <Users className="w-4 h-4 text-indigo-600" />, label: "Persongalleri" },
                            { icon: <Scale className="w-4 h-4 text-amber-600" />, label: "Paragraffer" },
                            { icon: <CalendarDays className="w-4 h-4 text-emerald-600" />, label: "Tidslinje" }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 p-4 bg-white/60 border border-slate-100 rounded-2xl shadow-sm hover:bg-white hover:border-slate-200 transition-all group cursor-default">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-all">
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 group-hover:text-slate-900 transition-colors">{item.label}</span>
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
                    <div className="flex-1 bg-slate-100 flex flex-col p-4 gap-4 overflow-hidden">
                        {/* Red Flags Section - Now placed clearly above the PDF */}
                        {analysis?.redFlags && analysis.redFlags.length > 0 && (
                            <div className="shrink-0 flex gap-3 overflow-x-auto pb-2 custom-scrollbar no-scrollbar">
                                {analysis.redFlags.map((flag, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: -10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg border border-rose-500 shrink-0 min-w-[280px] max-w-[400px]"
                                    >
                                        <div className="relative flex items-center justify-center shrink-0">
                                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping absolute opacity-50" />
                                            <div className="w-2.5 h-2.5 bg-white rounded-full relative" />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/70">Rød Lampe</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded text-white">{flag.type}</span>
                                            </div>
                                            <span className="text-[11px] font-bold leading-tight">{flag.description}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <iframe 
                            src={`${pdfUrl}#toolbar=0`} 
                            className="flex-1 w-full rounded-xl shadow-inner bg-white border border-slate-200"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

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
                            setChatHistory(msgs);
                        } catch (e) { console.error('Error saving chat:', e); }
                    }}
                />
            )}
        </AnimatePresence>
      </main>
      </div>

      {/* 
          PRINTABLE REPORT COMPONENT 
          This is hidden on screen and only appears when the user prints the page.
          We use simple, clean styles optimized for paper.
      */}
      <div className="hidden print:block bg-white text-slate-950 p-0 m-0 w-full">
          <style dangerouslySetInnerHTML={{ __html: `
            @page { margin: 2cm; size: auto; }
            @media print {
              body { background: white !important; margin: 0; padding: 0; }
              .page-break { page-break-before: always; }
              .avoid-break { page-break-inside: avoid; }
            }
          `}} />
          
          {analysis && (
              <div className="max-w-[210mm] mx-auto space-y-10 py-10">
                  {/* Header */}
                  <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-10">
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Socialfaglig Case-Analyse</p>
                          <h1 className="text-4xl font-black serif leading-tight">{file?.name || 'Analyse-rapport'}</h1>
                          <p className="text-xs font-semibold text-slate-500 mt-2 uppercase tracking-widest">Genereret: {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Fortroligt Dokument</p>
                          <p className="text-[9px] text-slate-400 font-medium">Cohéro AI Assistant</p>
                      </div>
                  </div>

                  {/* Summary */}
                  <section className="avoid-break space-y-3">
                      <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">1. Resumé af sagen</h2>
                      <p className="text-[13px] leading-relaxed text-slate-800">{analysis.sammenfatning}</p>
                  </section>

                  {/* Persons */}
                  <section className="avoid-break space-y-4">
                      <h2 className="text-lg font-black uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">2. Persongalleri</h2>
                      <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                          {analysis.personer.map((p, i) => (
                              <div key={i} className="text-sm border-l-2 border-slate-100 pl-4 py-1">
                                  <p className="font-bold text-slate-900">{p.navn} <span className="text-slate-400 font-medium ml-1">({p.rolle})</span></p>
                                  <p className="text-slate-600 italic text-[12px] leading-snug mt-1">{p.beskrivelse}</p>
                              </div>
                          ))}
                      </div>
                  </section>

                  {/* Key Points */}
                  <section className="avoid-break space-y-4">
                      <h2 className="text-lg font-black uppercase tracking-widest border-b border-slate-200 pb-2">3. Socialfaglige Nøglepunkter</h2>
                      <div className="flex flex-wrap gap-2 pt-2">
                          {analysis.socialeProblemer.map((p, i) => (
                              <span key={i} className="text-[11px] font-bold uppercase tracking-wider text-slate-900 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
                                  {p}
                              </span>
                          ))}
                      </div>
                  </section>

                  {/* Timeline */}
                  <section className="avoid-break space-y-4 pt-4">
                      <h2 className="text-lg font-black uppercase tracking-widest border-b border-slate-200 pb-2">4. Hændelsesforløb</h2>
                      <table className="w-full text-[13px] border-collapse">
                          <tbody>
                              {analysis.tidslinje.map((t, i) => (
                                  <tr key={i} className="border-b border-slate-100">
                                      <td className="py-3 pr-6 font-bold text-slate-900 whitespace-nowrap align-top w-28 uppercase text-[10px] tracking-widest">{t.dato}</td>
                                      <td className="py-3 text-slate-700 leading-relaxed font-medium">{t.hændelse}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </section>

                  {/* Gaps & Follow-up */}
                  <div className="grid grid-cols-2 gap-12 pt-4">
                      <section className="avoid-break space-y-4">
                          <h2 className="text-lg font-black uppercase tracking-widest border-b border-slate-200 pb-2">5. Videnshuller</h2>
                          <ul className="space-y-3 list-disc pl-5 text-[12px] text-slate-700 font-medium">
                                {analysis.videnshuller?.map((gap, i) => (
                                    <li key={i}>{gap}</li>
                                )) || <li>Ingen specifikke huller identificeret.</li>}
                          </ul>
                      </section>
                      <section className="avoid-break space-y-4">
                          <h2 className="text-lg font-black uppercase tracking-widest border-b border-slate-200 pb-2">6. Næste Skridt</h2>
                          <ul className="space-y-3 list-disc pl-5 text-[12px] text-slate-700 font-medium">
                                {analysis.opfølgning?.map((step, i) => (
                                    <li key={i}>{step}</li>
                                )) || <li>Ingen opfølgningspunkter angivet.</li>}
                          </ul>
                      </section>
                  </div>

                  {/* Legal Basis */}
                  <section className="page-break-before space-y-8 pt-6">
                      <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-6">7. Juridisk Fundament</h2>
                      <div className="grid gap-6">
                          {analysis.relevanteParagraffer.map((p, i) => (
                              <div key={i} className="avoid-break p-6 bg-slate-50 border border-slate-100 rounded-xl relative">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="w-2 h-2 bg-slate-900 rounded-full" />
                                    <p className="font-black text-slate-950 uppercase tracking-[0.2em] text-[12px]">§ {p.lov} {p.paragraf}</p>
                                  </div>
                                  <p className="text-[13px] text-slate-600 leading-relaxed font-medium italic border-l-2 border-slate-200 pl-4 ml-1">"{p.relevans}"</p>
                              </div>
                          ))}
                      </div>
                  </section>

                  {/* Social Work Assessment */}
                  {analysis.socialfagligVurdering && (
                      <section className="page-break-before avoid-break space-y-8 pt-6">
                          <h2 className="text-lg font-black uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-6">8. Socialfaglig Vurdering</h2>
                          <div className="text-[14px] leading-loose font-serif whitespace-pre-wrap text-slate-800 p-10 bg-slate-50 rounded-2xl border border-dotted border-slate-300 shadow-inner">
                             {analysis.socialfagligVurdering}
                          </div>
                      </section>
                  )}

                  {/* Footer */}
                  <div className="pt-20 border-t border-slate-100 text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.6em]">
                      Slut på rapport • Genereret via student.cohero.dk
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default CaseAnalyserPage;
