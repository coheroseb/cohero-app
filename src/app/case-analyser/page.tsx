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
  ExternalLink, 
  Copy, 
  Plus, 
  Send, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  FileCheck 
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import PageHeader from '@/components/PageHeader';
import { analyzeCasePdfAction, unifiedChatAction, fetchRetsinformationLawDetailsAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useStorage, useFirestore } from '@/firebase';
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
// Case Chat Overlay (AI Sparring Modal)
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

  const quickPrompts = [
    "Hvad er de primære bekymringspunkter?",
    "Hvilke lovparagraffer er mest relevante?",
    "Hvilke videnshuller skal afklares først?",
    "Lav en kort opsummering af tidslinjen"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[160] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        exit={{ scale: 0.95, y: 20 }}
        className="w-full h-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Case Sparring</h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">AI Assistent</span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate max-w-md mt-0.5">{title}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50/50 custom-scrollbar">
          {messages.length === 0 && (
            <div className="py-12 text-center space-y-6 max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 mb-1">Stil spørgsmål til sagen</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Jeg har læst hele sagsakten og kan hjælpe dig med at analysere detaljer, citere hændelser eller vurdere lovhjemmel.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qp)}
                    className="p-3 bg-white border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-left shadow-sm flex items-center justify-between group"
                  >
                    <span>{qp}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 sm:p-5 rounded-2xl shadow-sm text-xs sm:text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none font-medium'
              }`}>
                <div dangerouslySetInnerHTML={{ __html: m.content }} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200/80 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-slate-400">Analyserer sagsakten...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Stil et spørgsmål til sagsakten..."
              className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-50 transition-all placeholder:text-slate-400"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="h-12 px-5 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xs hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm"
            >
              <Send className="w-4 h-4 mr-1.5" /> Send
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function CaseAnalyserPage() {
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
  const [retsinfoMap, setRetsinfoMap] = useState<Record<string, { officialTitle?: string; retsinformationUrl?: string; isVerified: boolean }>>({});
  const [activeTab, setActiveTab] = useState<'summary' | 'paragraphs' | 'persons' | 'timeline' | 'gaps' | 'draft'>('summary');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    } else if (user && firestore) {
      fetchHistory();
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

  const fetchHistory = async () => {
    if (!user || !firestore) return;
    setIsHistoryLoading(true);
    try {
      const q = query(
        collection(firestore, 'users', user.uid, 'caseAnalyses'),
        orderBy('createdAt', 'desc'),
        limit(15)
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
    setActiveTab('summary');
  };

  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    if (!confirm('Er du sikker på, at du vil slette denne analyse?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'caseAnalyses', id));
      setHistory(prev => prev.filter(item => item.id !== id));
      if (openCaseId === id) {
        handleReset();
      }
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
    setUploadProgress(15);

    try {
      const storageRef = ref(storage, `case-analyses/${user.uid}/${Date.now()}_${pdfFile.name}`);
      setUploadProgress(35);
      await uploadBytes(storageRef, pdfFile);
      const url = await getDownloadURL(storageRef);
      setPdfUrl(url);
      setUploadProgress(55);

      const text = await extractTextFromPdf(pdfFile);
      setRawText(text);
      setUploadProgress(75);

      const response = await analyzeCasePdfAction({ caseText: text });
      let finalAnalysis = response.data;

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

      const docRef = await addDoc(collection(firestore, 'users', user.uid, 'caseAnalyses'), {
        fileName: pdfFile.name,
        pdfUrl: url,
        analysis: finalAnalysis,
        rawText: text,
        chatHistory: [],
        createdAt: serverTimestamp(),
      });
      setOpenCaseId(docRef.id);

      toast({ title: "Analyse fuldført!", description: "Sagsakten er nu færdiganalyseret." });
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
    if (!analysis || !rawText) return;
    setIsGeneratingDraft(true);
    try {
      const prompt = `Skriv en professionel socialfaglig vurdering-kladde for denne case på baggrund af følgende oplysninger:
      Case Resumé: ${analysis.sammenfatning}
      Involverede personer: ${JSON.stringify(analysis.personer)}
      Sociale problemer: ${analysis.socialeProblemer.join(', ')}
      Relevante paragraffer: ${analysis.relevanteParagraffer.map(p => `${p.lov} ${p.paragraf}`).join(', ')}
      
      Strukturer vurderingen med overskrifter:
      1. Sagens baggrund og anledning
      2. Socialfaglig analyse og ressourcevurdering
      3. Lovmæssig begrundelse og handlemuligheder
      4. Samlet konklusion og indstilling`;

      const resp = await unifiedChatAction({
        message: prompt,
        chatHistory: [],
        persona: 'case',
        context: { currentModule: 'CaseAnalyser', currentPath: 'Socialfaglig Vurdering' }
      });

      if (resp?.data?.answer) {
        setDraftVurdering(resp.data.answer);
        if (openCaseId && firestore && user) {
          await updateDoc(doc(firestore, 'users', user.uid, 'caseAnalyses', openCaseId), {
            'analysis.socialfagligVurdering': resp.data.answer
          });
        }
        toast({ title: "Kladde genereret!", description: "Socialfaglig vurdering er klar." });
      }
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke generere kladden." });
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setAnalysis(null);
    setPdfUrl(null);
    setOpenCaseId(null);
    setChatHistory([]);
    setRawText(null);
    setDraftVurdering(null);
  };

  const copyFullAnalysis = () => {
    if (!analysis) return;
    const reportText = `CASE-ANALYSE: ${file?.name || 'Case'}\n\nRESUMÉ:\n${analysis.sammenfatning}\n\nPERSONGALLERI:\n${analysis.personer.map(p => `- ${p.navn} (${p.rolle}): ${p.beskrivelse}`).join('\n')}\n\nJURIDISK FUNDAMENT:\n${analysis.relevanteParagraffer.map(p => `- ${p.lov} ${p.paragraf}: ${p.relevans}`).join('\n')}\n\nHÆNDELSESFORLØB:\n${analysis.tidslinje.map(t => `- [${t.dato}] ${t.hændelse}`).join('\n')}${draftVurdering ? `\n\nSOCIALFAGLIG VURDERING:\n${draftVurdering}` : ''}`;
    navigator.clipboard.writeText(reportText);
    toast({ title: "Kopieret!", description: "Hele analysen er kopieret til udklipsholderen." });
  };

  const isFreeTier = useMemo(() => {
    if (userProfile?.role === 'admin') return false;
    const mem = userProfile?.membership || 'Kollega';
    return ['Kollega', 'Group Pro'].includes(mem);
  }, [userProfile]);

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-32 text-slate-900 selection:bg-indigo-100">
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 sticky top-0 z-30">
        <PageHeader
          title="Sagsanalyse"
          subtitle="AI-drevet gennemgang af sagsakter. Udtræk automatisk paragraffer, tidslinje, persongalleri og videnshuller."
          icon={<FileText className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            analysis ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setShowChat(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm h-10 px-4 flex items-center gap-2"
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span>Case Sparring AI</span>
                </Button>

                <Button
                  onClick={copyFullAnalysis}
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-3.5 flex items-center gap-2"
                  title="Kopier hele analysen"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Kopier Alt</span>
                </Button>

                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 h-10 px-3.5 flex items-center gap-2"
                  title="Eksporter til PDF / Print"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Print Rapport</span>
                </Button>

                <Button
                  onClick={handleReset}
                  variant="ghost"
                  className="rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-10 px-3 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ny Analyse</span>
                </Button>
              </div>
            ) : undefined
          }
        />
      </div>

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 space-y-8">
        {isFreeTier && (
          <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 text-center space-y-6 relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                <Crown className="w-8 h-8 fill-current" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Kollega+ Eksklusivt</h2>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  Få AI til automatisk at analysere dine sagsakter, identificere lovparagraffer, persongalleri og tidslinjer.
                </p>
              </div>

              <div className="space-y-2.5 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs font-bold text-slate-700">
                {[
                  "AI-drevet PDF sagsanalyse",
                  "Automatisk udtræk af paragraffer & Retsinformation-links",
                  "Kronologisk hændelsesforløb & tidslinje",
                  "Persongalleri & rollefordeling",
                  "Kladde til socialfaglig vurdering"
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-2">
                <Button 
                  onClick={() => router.push('/upgrade')} 
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md text-xs"
                >
                  Opgrader til Kollega+
                </Button>
                <button 
                  onClick={() => router.back()} 
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors w-full"
                >
                  Tilbage til oversigten
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {!analysis && (
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 text-center space-y-6">
              <div className="max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Automatisk Sagsanalyse</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  Upload din sagsakt som PDF
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  AI gennemgår akten fortroligt, udtrækker paragraffer, opbygger persongalleriet og skaber en kronologisk tidslinje på få sekunder.
                </p>
              </div>

              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 sm:p-12 cursor-pointer transition-all duration-300 min-h-[260px] ${
                  isDragging 
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]' 
                    : 'border-slate-200 bg-slate-50/50 hover:bg-indigo-50/20 hover:border-indigo-300 hover:shadow-sm'
                }`}
              >
                {isAnalyzing ? (
                  <div className="space-y-4 text-center">
                    <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
                      <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                      <Sparkles className="w-5 h-5 text-indigo-600 absolute" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Analyserer sagsakten...</p>
                      <p className="text-xs text-slate-400 mt-1">Identificerer paragraffer, personer og tidslinje ({uploadProgress}%)</p>
                    </div>
                    <div className="w-48 h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white border border-slate-200 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 group-hover:border-indigo-200 transition-all">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <p className="text-base font-bold text-slate-900">
                      Tryk her eller træk din PDF hertil
                    </p>
                    <p className="text-xs text-slate-400 font-semibold mt-1">
                      Understøtter PDF-filer op til 20 MB
                    </p>
                  </>
                )}

                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  disabled={isAnalyzing}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
                {[
                  { icon: <Users className="w-4 h-4 text-indigo-600" />, title: "Persongalleri", desc: "Roller, netværk og relationer." },
                  { icon: <Scale className="w-4 h-4 text-amber-600" />, title: "Paragraffer", desc: "Automatiske Retsinformation-links." },
                  { icon: <CalendarDays className="w-4 h-4 text-emerald-600" />, title: "Tidslinje", desc: "Kronologisk hændelsesforløb." }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl flex items-start gap-3.5">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-slate-100">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Tidligere Sagsanalyser</h3>
                    <p className="text-xs text-slate-400 font-medium">Gemte analyser på din konto</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {history.length} {history.length === 1 ? 'analyse' : 'analyser'}
                </span>
              </div>

              {isHistoryLoading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">Henter historik...</span>
                </div>
              ) : history.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => loadAnalysis(item)}
                      className="p-4 bg-slate-50/60 hover:bg-indigo-50/40 border border-slate-200/70 hover:border-indigo-200 rounded-2xl transition-all cursor-pointer group flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {item.fileName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            {item.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                        title="Slet analyse"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                  <p className="text-xs font-bold text-slate-400">Ingen tidligere analyser fundet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Upload en PDF ovenfor for at starte din første analyse.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {analysis.redFlags && analysis.redFlags.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xs">
                <div className="w-9 h-9 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                      OBS: Kritiske Opmærksomhedspunkter ({analysis.redFlags.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {analysis.redFlags.map((flag, i) => (
                      <div key={i} className="bg-white/80 border border-rose-200/80 rounded-xl p-3 text-xs leading-relaxed text-slate-800">
                        <span className="font-bold text-rose-700 mr-1.5">[{flag.type}]:</span>
                        <span>{flag.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 flex flex-col h-[760px] overflow-hidden">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 px-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 truncate">{file?.name || 'Sagsakt.pdf'}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Sagsakt
                  </span>
                </div>

                {pdfUrl ? (
                  <iframe 
                    src={`${pdfUrl}#toolbar=0`} 
                    className="flex-1 w-full rounded-2xl bg-slate-50 border border-slate-200/80"
                    title="PDF Viewer"
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-300 text-xs font-semibold">
                    Ingen PDF forhåndsvisning tilgængelig
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col h-[760px] overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3 overflow-x-auto no-scrollbar shrink-0">
                  {[
                    { id: 'summary', label: 'Overblik', icon: <BookOpen className="w-3.5 h-3.5" /> },
                    { id: 'paragraphs', label: 'Paragraffer', icon: <Scale className="w-3.5 h-3.5" />, count: analysis.relevanteParagraffer?.length },
                    { id: 'persons', label: 'Persongalleri', icon: <Users className="w-3.5 h-3.5" />, count: analysis.personer?.length },
                    { id: 'timeline', label: 'Tidslinje', icon: <CalendarDays className="w-3.5 h-3.5" />, count: analysis.tidslinje?.length },
                    { id: 'gaps', label: 'Videnshuller', icon: <HelpCircle className="w-3.5 h-3.5" />, count: (analysis.videnshuller?.length || 0) + (analysis.opfølgning?.length || 0) },
                    { id: 'draft', label: 'Vurdering', icon: <FileCheck className="w-3.5 h-3.5" /> },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ml-0.5 ${
                          activeTab === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto pt-5 space-y-6 custom-scrollbar pr-1">
                  {activeTab === 'summary' && (
                    <div className="space-y-6">
                      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider">
                          <BookOpen className="w-4 h-4" />
                          <span>Faglig Sammenfatning</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                          "{analysis.sammenfatning}"
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Identificerede Sociale Problemer & Temaer</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.socialeProblemer.map((prob, i) => (
                            <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                              {prob}
                            </span>
                          ))}
                        </div>
                      </div>

                      {analysis.diagnoser && analysis.diagnoser.length > 0 && (
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-rose-500" />
                            <span>Kliniske Diagnoser Nævnt i Sagen</span>
                          </h4>
                          <div className="space-y-2">
                            {analysis.diagnoser.map((diag, i) => (
                              <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{diag.navn}</p>
                                  {diag.beskrivelse && (
                                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{diag.beskrivelse}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'paragraphs' && (
                    <div className="space-y-3.5">
                      {analysis.relevanteParagraffer.map((p, i) => {
                        const retsKey = `${p.lov}-${p.paragraf}`;
                        const retsData = retsinfoMap[retsKey];
                        const retsUrl = retsData?.retsinformationUrl || `https://www.retsinformation.dk/search?t=${encodeURIComponent(`${p.lov} ${p.paragraf}`)}`;

                        return (
                          <div key={i} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:bg-white hover:shadow-xs transition-all space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-black tracking-tight">
                                {p.lov} {p.paragraf}
                              </span>
                              <a
                                href={retsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 px-3 py-1 rounded-xl transition-colors"
                              >
                                <span>Slå op i Retsinformation</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              {p.relevans}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeTab === 'persons' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysis.personer.map((p, i) => (
                        <div key={i} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-xs font-black text-slate-900 truncate">{p.navn}</span>
                              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">
                                {p.rolle}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.beskrivelse}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'timeline' && (
                    <div className="space-y-3 relative before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                      {analysis.tidslinje.map((t, i) => (
                        <div key={i} className="relative pl-8 group">
                          <div className="absolute left-1.5 top-3 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600 shrink-0 shadow-xs" />
                          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl group-hover:bg-white transition-all">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                              {t.dato}
                            </span>
                            <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                              {t.hændelse}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'gaps' && (
                    <div className="space-y-6">
                      <div className="p-5 bg-rose-50/50 border border-rose-100 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-rose-700 text-xs font-black uppercase tracking-wider">
                          <HelpCircle className="w-4 h-4" />
                          <span>Videnshuller & Uafklarede Forhold</span>
                        </div>
                        <ul className="space-y-2">
                          {analysis.videnshuller?.map((gap, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed font-medium">
                              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mt-1.5 shrink-0" />
                              <span>{gap}</span>
                            </li>
                          )) || <li className="text-xs text-slate-400">Ingen specifikke huller identificeret.</li>}
                        </ul>
                      </div>

                      <div className="p-5 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-emerald-700 text-xs font-black uppercase tracking-wider">
                          <ListChecks className="w-4 h-4" />
                          <span>Anbefalede Næste Skridt & Handlinger</span>
                        </div>
                        <ul className="space-y-2.5">
                          {analysis.opfølgning?.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed font-medium p-2.5 bg-white/70 rounded-xl border border-emerald-100">
                              <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">
                                {i + 1}
                              </span>
                              <span className="mt-0.5">{step}</span>
                            </li>
                          )) || <li className="text-xs text-slate-400">Ingen opfølgningspunkter angivet.</li>}
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeTab === 'draft' && (
                    <div className="space-y-4">
                      {!draftVurdering ? (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-4">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900">Generér Socialfaglig Vurderings-kladde</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                              Lad AI skrive et professionelt første udkast til en socialfaglig vurdering baseret på analysen.
                            </p>
                          </div>
                          <Button
                            onClick={handleGenerateDraft}
                            disabled={isGeneratingDraft}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold h-10 px-5 shadow-sm"
                          >
                            {isGeneratingDraft ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Genererer kladde...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" /> Generér Kladde Nu
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                              Udkast til Socialfaglig Vurdering
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => {
                                  navigator.clipboard.writeText(draftVurdering);
                                  toast({ title: "Kopieret!", description: "Kladden er kopieret til udklipsholderen." });
                                }}
                                variant="outline"
                                className="h-8 px-3 text-xs font-bold border-slate-200 rounded-lg"
                              >
                                <Copy className="w-3.5 h-3.5 mr-1" /> Kopier
                              </Button>
                              <Button
                                onClick={handleGenerateDraft}
                                variant="outline"
                                className="h-8 px-3 text-xs font-bold border-slate-200 rounded-lg"
                                title="Gengenerér"
                              >
                                <History className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
                            {draftVurdering}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showChat && rawText && (
          <CaseChatOverlay
            title={file?.name || 'Case Sagsakt'}
            caseText={rawText}
            initialMessages={chatHistory}
            onClose={() => setShowChat(false)}
            onSave={async (msgs) => {
              if (!user || !firestore || !openCaseId) return;
              try {
                const refDoc = doc(firestore, 'users', user.uid, 'caseAnalyses', openCaseId);
                await updateDoc(refDoc, { chatHistory: msgs });
                setChatHistory(msgs);
              } catch (e) { console.error('Error saving chat:', e); }
            }}
          />
        )}
      </AnimatePresence>

      <div className="hidden print:block bg-white text-slate-950 p-0 m-0 w-full">
        {analysis && (
          <div className="max-w-[210mm] mx-auto space-y-8 py-8 font-sans">
            <div className="border-b-2 border-slate-900 pb-4">
              <h1 className="text-2xl font-black">Socialfaglig Sagsanalyse</h1>
              <p className="text-sm font-bold text-slate-600 mt-1">Dokument: {file?.name || 'Sagsakt'}</p>
              <p className="text-xs text-slate-400 mt-0.5">Dato: {new Date().toLocaleDateString('da-DK')}</p>
            </div>

            <section className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">1. Sammenfatning</h2>
              <p className="text-xs leading-relaxed text-slate-800">{analysis.sammenfatning}</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">2. Persongalleri</h2>
              <div className="grid grid-cols-2 gap-4">
                {analysis.personer.map((p, i) => (
                  <div key={i} className="text-xs border-l-2 border-slate-300 pl-3">
                    <p className="font-bold text-slate-900">{p.navn} ({p.rolle})</p>
                    <p className="text-slate-600 mt-0.5">{p.beskrivelse}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">3. Juridisk Fundament</h2>
              <div className="space-y-2">
                {analysis.relevanteParagraffer.map((p, i) => (
                  <div key={i} className="text-xs">
                    <span className="font-bold text-slate-900">{p.lov} {p.paragraf}:</span>
                    <span className="text-slate-700 ml-2">{p.relevans}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">4. Hændelsesforløb</h2>
              <div className="space-y-1.5 text-xs">
                {analysis.tidslinje.map((t, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="font-bold text-slate-900 w-24 shrink-0">{t.dato}</span>
                    <span className="text-slate-700">{t.hændelse}</span>
                  </div>
                ))}
              </div>
            </section>

            {draftVurdering && (
              <section className="space-y-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">5. Socialfaglig Vurdering</h2>
                <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">{draftVurdering}</p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
