'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Presentation,
  ArrowLeft, 
  Sparkles, 
  UploadCloud,
  File,
  X,
  Loader2,
  Tags,
  Scale,
  Wrench,
  FileText,
  CheckCircle,
  Info,
  History,
  Layers,
  Zap,
  ChevronRight,
  BookOpen,
  Lock,
  FileUp,
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { seminarArchitectAction } from '@/app/actions';
import type { SeminarAnalysis } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { useFirestore } from '@/firebase';
import { collection, doc, addDoc, serverTimestamp, writeBatch, increment, getDoc, updateDoc } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';

// ---------------------------------------------------------------------------
// File Parsers
// ---------------------------------------------------------------------------

async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
  const pdfjsVersion = '4.10.38';
  GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const slideTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '').join(' ');
    slideTexts.push(`--- SLIDE ${i} ---\n${strings}`);
  }
  return slideTexts.join('\n\n');
}

/**
 * Robust PPTX text extractor using proper XML DOM parsing.
 * Walks the slide XML tree to collect ALL text nodes in reading order,
 * preserving paragraph breaks and handling all text run variants.
 */
async function extractTextFromPptx(file: File): Promise<string> {
  const PizZip = (await import('pizzip')).default;
  const buffer = await file.arrayBuffer();
  const zip = new PizZip(buffer);

  const slideTexts: string[] = [];

  // Find all slide files and sort them numerically
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return na - nb;
    });

  if (slideFiles.length === 0) {
    throw new Error('Ingen slides fundet. Er filen en gyldig .pptx?');
  }

  // Also get the slide-layout order from presentation.xml if possible
  let slideOrder: string[] = slideFiles; // fallback to file order
  try {
    const presXml = zip.file('ppt/presentation.xml')?.asText() || '';
    const rIdMatches = presXml.matchAll(/r:id="(rId\d+)"/g);
    // Map rIds to slide filenames via slide relationships
    // This is optional — file sort order is usually correct
  } catch { /* ignore */ }

  for (let si = 0; si < slideOrder.length; si++) {
    const fileName = slideOrder[si];
    const slideNum = si + 1;
    
    try {
      const xml = zip.file(fileName)?.asText() || '';
      if (!xml) continue;

      // ----------------------------------------------------------------
      // Parse XML using native browser DOMParser (client-side only)
      // ----------------------------------------------------------------
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');

      // Collect text from all paragraphs in the slide body
      // Namespace-aware: look for a:txBody > a:p > a:r > a:t
      const paragraphs: string[] = [];

      // Get all shape text bodies
      const spNodes = doc.querySelectorAll('sp, graphicFrame, pic');
      const txBodies = doc.querySelectorAll('txBody');

      const allParas: Element[] = [];
      txBodies.forEach(tb => {
        tb.querySelectorAll('p').forEach(p => allParas.push(p));
      });

      // Also grab any stray paragraphs
      if (allParas.length === 0) {
        doc.querySelectorAll('p').forEach(p => allParas.push(p));
      }

      for (const para of allParas) {
        // Collect all text runs in this paragraph
        const runs: string[] = [];
        const tNodes = para.querySelectorAll('t');
        tNodes.forEach(t => {
          const txt = t.textContent?.trim();
          if (txt) runs.push(txt);
        });
        const lineText = runs.join(' ').trim();
        if (lineText) paragraphs.push(lineText);
      }

      // Fallback: raw regex if DOMParser yielded nothing (e.g., namespace issues)
      if (paragraphs.length === 0) {
        const rawMatches = xml.match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g) || [];
        rawMatches.forEach(m => {
          const txt = m.replace(/<[^>]+>/g, '').trim();
          if (txt) paragraphs.push(txt);
        });
      }

      const slideText = paragraphs.join('\n').trim();
      slideTexts.push(`--- SLIDE ${slideNum} ---\n${slideText || '(Ingen tekst)'}`);
    } catch (err) {
      console.warn(`[PPTX] Failed to parse slide ${slideNum}:`, err);
      slideTexts.push(`--- SLIDE ${slideNum} ---\n(Fejl under udlæsning af slide)`);
    }
  }

  if (slideTexts.length === 0) {
    throw new Error('Ingen slides kunne udlæses fra PowerPoint-filen.');
  }

  console.log(`[PPTX] Extracted ${slideTexts.length} slides from ${file.name}`);
  return slideTexts.join('\n\n');
}

async function extractText(file: File): Promise<string> {
  const isPptx = file?.name.toLowerCase().endsWith('.pptx') || file.type.includes('presentationml');
  if (isPptx) return extractTextFromPptx(file);
  throw new Error('Kun PowerPoint (.pptx) filer understøttes.');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SlideCard = ({ slide, notes, onNotesChange }: { slide: any; notes: string; onNotesChange: (val: string) => void }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-500 overflow-hidden group">
    {/* Card Header */}
    <div className="flex items-center gap-4 p-6 sm:p-8 border-b border-slate-50">
      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0 group-hover:bg-indigo-600 transition-colors">
        {slide.slideNumber}
      </div>
      <h3 className="text-lg font-bold text-slate-900 leading-tight">{slide.slideTitle}</h3>
    </div>

    {/* Card Body */}
    <div className="p-6 sm:p-8 space-y-6">
      <p className="text-slate-500 leading-relaxed text-sm italic border-l-2 border-indigo-100 pl-4">{slide.summary}</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-5">
          {slide.keyConcepts?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Tags className="w-3 h-3" /> Begreber
              </h4>
              <div className="flex flex-wrap gap-2">
                {slide.keyConcepts.map((c: any, i: number) => (
                  <Link key={i} href={`/concept-explainer?term=${encodeURIComponent(c.term)}`}>
                    <span className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[10px] font-bold hover:bg-violet-100 transition-colors cursor-pointer">
                      {c.term}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {slide.legalFrameworks?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Scale className="w-3 h-3" /> Jura
              </h4>
              <ul className="space-y-2.5">
                {slide.legalFrameworks.map((l: any, i: number) => (
                  <li key={i} className="text-xs">
                    <span className="font-bold text-slate-900">{l.law} {l.paragraphs?.join(', ')}</span>
                    <p className="text-slate-500 mt-0.5">{l.relevance}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {slide.practicalTools?.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
                <Wrench className="w-3 h-3" /> Metoder
              </h4>
              <ul className="space-y-2.5">
                {slide.practicalTools.map((t: any, i: number) => (
                  <li key={i} className="text-xs">
                    <span className="font-bold text-slate-900">{t.tool}</span>
                    <p className="text-slate-500 mt-0.5">{t.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              <FileText className="w-3 h-3" /> Egne Noter
            </h4>
            <Textarea
              placeholder="Notér vigtige pointer..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="bg-slate-50 border-slate-100 rounded-2xl text-xs min-h-[90px] focus:ring-indigo-500 focus:border-indigo-300 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Drop Zone Sub-component
// ---------------------------------------------------------------------------
const FileDropZone = ({ file, onFile, onClear }: { file: File | null; onFile: (f: File) => void; onClear: () => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFile(dropped);
  };

  const isPptx = file?.name.endsWith('.pptx');

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
    >
      {file ? (
        <div className="flex items-center justify-between p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isPptx ? 'bg-orange-100' : 'bg-red-100'}`}>
              <File className={`w-6 h-6 ${isPptx ? 'text-orange-500' : 'text-red-500'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 max-w-[220px] truncate">{file.name}</p>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-0.5">
                {isPptx ? 'PowerPoint' : 'PDF'} · Klar til analyse
              </p>
            </div>
          </div>
          <button onClick={onClear} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center gap-5 w-full border-2 border-dashed rounded-[2rem] p-12 sm:p-16 cursor-pointer transition-all
            ${isDragging ? 'border-orange-400 bg-orange-50/50' : 'border-slate-100 hover:border-orange-300 hover:bg-orange-50/30'}`}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all ${isDragging ? 'bg-orange-100' : 'bg-slate-50'}`}>
            <FileUp className={`w-10 h-10 transition-colors ${isDragging ? 'text-orange-500' : 'text-slate-300'}`} />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 mb-1">Vælg eller træk din PowerPoint-fil herover</p>
            <p className="text-xs text-slate-400">Understøtter <strong className="text-orange-500">PowerPoint (.pptx)</strong></p>
          </div>
          <input
            id="file-upload"
            ref={inputRef}
            type="file"
            className="sr-only"
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => e.target.files && onFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

function SeminarArchitectPageContent() {
  const { user, userProfile, refetchUserProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<SeminarAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slideNotes, setSlideNotes] = useState<Record<number, string>>({});
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [debouncedNotes] = useDebounce(slideNotes, 1500);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [activeTab, setActiveTab] = useState<'cards' | 'overview'>('cards');
  const isInitialMount = useRef(true);

  const isPremiumUser = useMemo(() =>
    !!userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership ?? ''),
    [userProfile]
  );

  const handleAnalyze = async () => {
    if (!file || !user || !firestore || !userProfile || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setError(null);
    setSlideNotes({});
    setSavedAnalysisId(null);

    // Weekly limit for free tier
    if (!isPremiumUser) {
      const getWeek = (d: Date) => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      };
      const lastUsage = userProfile.lastSeminarArchitectUsage?.toDate?.();
      const now = new Date();
      let weeklyCount = userProfile.weeklySeminarArchitectCount || 0;
      if (lastUsage && (getWeek(lastUsage) !== getWeek(now) || lastUsage.getFullYear() !== now.getFullYear())) weeklyCount = 0;
      if (weeklyCount >= 1) {
        setError('Du har brugt dit ugentlige forsøg. Opgrader til Kollega+ for ubegrænset brug.');
        setIsAnalyzing(false);
        return;
      }
    }

    try {
      const slideText = await extractText(file);
      const response = await seminarArchitectAction({ slideText, semester: userProfile.semester || '1. semester' });

      if (!response?.data) throw new Error('Ingen data returneret fra analysen.');

      setAnalysisResult(response.data);

      const batch = writeBatch(firestore!);
      const userRef = doc(firestore!, 'users', user.uid);
      const newSeminarRef = doc(collection(firestore!, 'users', user.uid, 'seminars'));
      batch.set(newSeminarRef, { ...response.data, fileName: file.name, createdAt: serverTimestamp() });
      setSavedAnalysisId(newSeminarRef.id);

      const activityRef = doc(collection(firestore!, 'userActivities'));
      batch.set(activityRef, {
        userId: user.uid,
        userName: userProfile.username || user.displayName || 'Anonym',
        actionText: 'analyserede et seminar med Seminar-Arkitekten.',
        createdAt: serverTimestamp(),
      });

      const userUpdates: Record<string, any> = { lastSeminarArchitectUsage: serverTimestamp() };
      if (!isPremiumUser) userUpdates.weeklySeminarArchitectCount = increment(1);
      if (response.usage) {
        const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
        const pts = Math.round(totalTokens * 0.05);
        if (pts > 0) userUpdates['cohéroPoints'] = increment(pts);
      }
      batch.update(userRef, userUpdates);
      await batch.commit();
      await refetchUserProfile();

      toast({ title: 'Videnskort Gemt!', description: `Analyserede ${response.data.slides.length} slides.` });
    } catch (err: any) {
      console.error('[SeminarArchitect]', err);
      setError(err.message || 'Der opstod en fejl under analysen. Prøv venligst igen.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoSaveNotes = useCallback(async () => {
    if (!user || !firestore || !savedAnalysisId || Object.keys(debouncedNotes).length === 0) return;
    setSaveStatus('saving');
    try {
      const ref = doc(firestore, 'users', user.uid, 'seminars', savedAnalysisId);
      const snap = await getDoc(ref);
      if (!snap.exists()) { setSaveStatus('idle'); return; }
      const updated = (snap.data().slides || []).map((s: any) => ({ ...s, notes: debouncedNotes[s.slideNumber] ?? s.notes ?? '' }));
      await updateDoc(ref, { slides: updated });
      setSaveStatus('saved');
    } catch { setSaveStatus('idle'); }
  }, [user, firestore, savedAnalysisId, debouncedNotes]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    if (savedAnalysisId) handleAutoSaveNotes();
  }, [debouncedNotes, savedAnalysisId, handleAutoSaveNotes]);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (saveStatus === 'saved') t = setTimeout(() => setSaveStatus('idle'), 2500);
    return () => clearTimeout(t);
  }, [saveStatus]);

  if (!isPremiumUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[36px] border border-slate-100 shadow-2xl shadow-slate-900/5 p-10 sm:p-14 flex flex-col items-center text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-500/20">
            <Presentation className="w-10 h-10" />
          </div>
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Kollega+ Funktion</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Seminar-Arkitekten</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-10">
            Upload dine slides (PDF eller PowerPoint) og lad AI omdanne dem til et struktureret videnskort med begreber, jura og metoder.
          </p>
          <Link href="/upgrade" className="w-full">
            <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
              <Sparkles className="w-4 h-4 mr-2" /> Opgrader til Kollega+
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Presentation className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-black text-slate-900">Seminar-Arkitekten</h1>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500">Fra slides til videnskort</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gemmer...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Gemt</span>
              </div>
            )}
            <Link href="/mine-seminarer">
              <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                <History className="w-4 h-4 mr-2" /> Arkiv
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="max-w-2xl mx-auto"
            >
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-600">AI-Vidensbehandling</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-none mb-4">
                  Fra slides til<br /><span className="text-indigo-600 italic">videnskort.</span>
                </h2>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                  Upload dine seminarslides og lad AI udtrække begreber, lovgivning og metoder til et struktureret studieoverblik.
                </p>
              </div>

              {/* Upload card */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sm:p-10 space-y-6">
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700 leading-relaxed">
                    Upload din <strong>PowerPoint-præsentation (.pptx)</strong> direkte. Vi udtrækker automatisk al tekst og analyserer hvert enkelt slide.
                  </p>
                </div>

                <FileDropZone file={file} onFile={(f) => {
                  if (!f.name.toLowerCase().endsWith('.pptx')) {
                    toast({ title: 'Forkert filtype', description: 'Kun PowerPoint-filer (.pptx) er understøttet.', variant: 'destructive' });
                    return;
                  }
                  setFile(f);
                }} onClear={() => setFile(null)} />

                {error && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                    <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-rose-700">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-95 transition-all"
                >
                  {isAnalyzing
                    ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyserer slides...</>
                    : <><Sparkles className="w-5 h-5 mr-2" /> Generér Videnskort</>
                  }
                </Button>

                {isAnalyzing && (
                  <div className="flex flex-col items-center gap-3 py-4 animate-pulse">
                    <div className="w-12 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full animate-[slide_1.5s_ease-in-out_infinite]" style={{ width: '60%' }} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Behandler dine slides...</p>
                  </div>
                )}
              </div>

              {/* Quick Guide */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                {[  
                  { icon: FileUp, label: 'Upload', desc: 'PowerPoint (.pptx)' },
                  { icon: Sparkles, label: 'Analyse', desc: 'AI behandler slides' },
                  { icon: BookOpen, label: 'Videnskort', desc: 'Struktureret overblik' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">{label}</p>
                    <p className="text-[10px] text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Analyse fuldført</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{analysisResult.overallTitle}</h2>
                  <p className="text-sm text-slate-400 mt-1">{analysisResult.slides.length} slides analyseret</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setAnalysisResult(null); setFile(null); }}
                    className="rounded-xl border-slate-200 text-slate-600"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Ny analyse
                  </Button>
                </div>
              </div>

              {/* Overview stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Slides', val: analysisResult.slides.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                  { label: 'Begreber', val: analysisResult.slides.reduce((a, s) => a + (s.keyConcepts?.length || 0), 0), color: 'bg-violet-50 text-violet-700 border-violet-100' },
                  { label: 'Love', val: analysisResult.slides.reduce((a, s) => a + (s.legalFrameworks?.length || 0), 0), color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Metoder', val: analysisResult.slides.reduce((a, s) => a + (s.practicalTools?.length || 0), 0), color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                ].map(({ label, val, color }) => (
                  <div key={label} className={`bg-white rounded-2xl border p-5 shadow-sm text-center flex flex-col items-center justify-center ${color}`}>
                    <p className="text-2xl font-black">{val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Slide cards */}
              <div className="space-y-5">
                {analysisResult.slides.map((slide) => (
                  <SlideCard
                    key={slide.slideNumber}
                    slide={slide}
                    notes={slideNotes[slide.slideNumber] || ''}
                    onNotesChange={(val) => setSlideNotes(prev => ({ ...prev, [slide.slideNumber]: val }))}
                  />
                ))}
              </div>

              <div className="flex justify-center pb-10">
                <div className="bg-white px-6 py-3 rounded-full border border-slate-100 shadow-sm flex items-center gap-3">
                  {saveStatus === 'saving'
                    ? <><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Autogemmer...</span></>
                    : <><CheckCircle className="w-4 h-4 text-emerald-500" /><span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Alle ændringer gemt</span></>
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const SeminarArchitectPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace(`/?callbackUrl=${encodeURIComponent(pathname ?? '/')}`);
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading || !user) return <AuthLoadingScreen />;
  return <SeminarArchitectPageContent />;
};

export default SeminarArchitectPage;
