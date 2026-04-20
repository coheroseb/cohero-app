'use client';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Presentation,
  ArrowLeft, 
  Sparkles, 
  File,
  X,
  Loader2,
  Scale,
  FileText,
  CheckCircle,
  History,
  Zap,
  BookOpen,
  FileUp,
  GraduationCap,
  Layout,
  Plus,
  Search,
  BookMarked,
  Clock,
  Target,
  Brain,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useApp } from '@/app/provider';
import { generateCourseAction } from '@/app/actions';
import type { CourseDesign, LawConfig } from '@/ai/flows/types';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from '@/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

interface SavedSeminar {
  id: string;
  overallTitle: string;
  slides: any[];
  createdAt: any;
}

interface SavedParagraph {
  id: string;
  title: string;
  lawTitle: string;
  content: string;
}

// --- FILE EXTRACTION UTILS (Copied for self-contained page) ---

async function extractDataFromPdf(file: File): Promise<{ text: string }> {
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
  return { text: slideTexts.join('\n\n') };
}

async function extractDataFromPptx(file: File): Promise<{ text: string }> {
  const PizZip = (await import('pizzip')).default;
  const buffer = await file.arrayBuffer();
  const zip = new PizZip(buffer);
  const slideTexts: string[] = [];
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
      return na - nb;
    });

  for (let si = 0; si < slideFiles.length; si++) {
    const fileName = slideFiles[si];
    try {
      const xml = zip.file(fileName)?.asText() || '';
      const paragraphs: string[] = [];
      const rawMatches = xml.match(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g) || [];
      rawMatches.forEach(m => {
        const txt = m.replace(/<[^>]+>/g, '').trim();
        if (txt) paragraphs.push(txt);
      });
      slideTexts.push(`--- SLIDE ${si+1} ---\n${paragraphs.join('\n').trim()}`);
    } catch (err) {
      slideTexts.push(`--- SLIDE ${si+1} ---\n(Fejl under udlæsning)`);
    }
  }
  return { text: slideTexts.join('\n\n') };
}

async function extractData(file: File): Promise<{ text: string }> {
  const isPptx = file?.name.toLowerCase().endsWith('.pptx');
  if (isPptx) return extractDataFromPptx(file);
  return extractDataFromPdf(file);
}

// --- MAIN PAGE ---

export default function CourseDesignerPage() {
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [laws, setLaws] = useState<LawConfig[]>([]);
  const [selectedLawIds, setSelectedLawIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [courseDesign, setCourseDesign] = useState<CourseDesign | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState(0);

  const loadingStages = [
    { label: "Analyserer materiale", icon: Search },
    { label: "Udvælger juridiske ankre", icon: Scale },
    { label: "Designer pædagogisk struktur", icon: Layout },
    { label: "Konstruerer interaktive quizzer", icon: Brain },
    { label: "Færdiggør dit arkitekt-design", icon: Sparkles }
  ];

  const [sourceType, setSourceType] = useState<'upload' | 'library'>('upload');
  const [seminars, setSeminars] = useState<SavedSeminar[]>([]);
  const [selectedSeminarIds, setSelectedSeminarIds] = useState<Set<string>>(new Set());
  const [savedParagraphs, setSavedParagraphs] = useState<SavedParagraph[]>([]);
  const [selectedParagraphIds, setSelectedParagraphIds] = useState<Set<string>>(new Set());
  const [userCourses, setUserCourses] = useState<any[]>([]);
  const recentSectionRef = useRef<HTMLDivElement>(null);

  // Fetch Laws
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'laws'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setLaws(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LawConfig)));
    });
    return () => unsubscribe();
  }, [firestore]);

  // Fetch Seminars
  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'users', user.uid, 'seminars'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSeminars(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSeminar)));
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Fetch Saved Paragraphs
  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'users', user.uid, 'savedParagraphs'), orderBy('savedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setSavedParagraphs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedParagraph)));
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Fetch User Courses
  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(collection(firestore, 'users', user.uid, 'courseDesigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUserCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [firestore, user]);

  const filteredLaws = useMemo(() => {
    if (!searchQuery) return laws;
    return laws.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [laws, searchQuery]);

  const handleToggleLaw = (id: string) => {
    setSelectedLawIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSeminar = (id: string) => {
    setSelectedSeminarIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleParagraph = (id: string) => {
    setSelectedParagraphIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    const hasSlides = files.length > 0 || selectedSeminarIds.size > 0;
    const hasLaws = selectedLawIds.size > 0 || selectedParagraphIds.size > 0;

    if ((!hasSlides && !hasLaws) || isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress(10);
    
    try {
      // 1. Extract Slide Text
      setGenerationProgress(20);
      setLoadingStage(0);
      let combinedText = "";
      
      // From Files
      for (const file of files) {
        const { text } = await extractData(file);
        combinedText += text + "\n\n";
      }

      // From Library Seminars
      if (selectedSeminarIds.size > 0) {
        const selectedSeminars = seminars.filter(s => selectedSeminarIds.has(s.id));
        selectedSeminars.forEach(s => {
          combinedText += `--- SEMINAR: ${s.overallTitle} ---\n`;
          s.slides.forEach(slide => {
            combinedText += `Slide ${slide.slideNumber}: ${slide.slideTitle}\nSummary: ${slide.summary}\n\n`;
          });
          combinedText += `\n`;
        });
      }

      // 2. Prepare Laws
      setGenerationProgress(40);
      setLoadingStage(1);
      const selectedLawData = laws
        .filter(l => selectedLawIds.has(l.id))
        .map(l => ({ id: l.id, name: l.name, abbreviation: l.abbreviation }));

      // Add Saved Paragraphs as context
      if (selectedParagraphIds.size > 0) {
        const selectedParas = savedParagraphs.filter(p => selectedParagraphIds.has(p.id));
        combinedText += `--- YDERLIGERE JURIDISK KONTEKST ---\n`;
        selectedParas.forEach(p => {
          combinedText += `Paragraph from ${p.lawTitle}: ${p.title}\nContent: ${p.content}\n\n`;
        });
      }

      // 3. Call AI
      setGenerationProgress(60);
      setLoadingStage(2);
      const response = await generateCourseAction({
        slideText: combinedText,
        selectedLaws: selectedLawData,
        semester: userProfile?.semester,
        profession: userProfile?.profession
      });

      setGenerationProgress(90);
      setLoadingStage(4);
      setCourseDesign(response.data);
      
      // Save to Firestore
      if (user && firestore) {
        const docRef = await addDoc(collection(firestore, 'users', user.uid, 'courseDesigns'), {
          ...response.data,
          createdAt: serverTimestamp(),
          sourceFiles: files.map(f => f.name),
          sourceSeminars: Array.from(selectedSeminarIds)
        });
        setCourseId(docRef.id);
      }

      setGenerationProgress(100);
      setTimeout(() => setStep(3), 500);
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: "Fejl", description: err.message || "Kunne ikke generere kursus." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-amber-50 sticky top-0 z-50 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all border border-amber-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-950 serif tracking-tight">Kursus-Arkitekten</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Fra materiale til forløb</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
            <Button 
                variant="outline" 
                className="rounded-xl border-amber-200 text-amber-900"
                onClick={() => recentSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
            >
                <History className="w-4 h-4 mr-2" /> Mine Designs
            </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Trin 1: Vælg dit materiale
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-amber-950 serif tracking-tighter">Hvad skal vi bygge på?</h2>
                <p className="text-slate-500 max-w-lg mx-auto italic">Vælg dine slides eller spring over for at designe udelukkende ud fra lovgivning.</p>
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button 
                    onClick={() => setSourceType('upload')}
                    className={`px-6 py-3 rounded-2xl font-bold transition-all ${sourceType === 'upload' ? 'bg-amber-950 text-amber-400 shadow-xl' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    Upload Filer
                  </button>
                  <button 
                    onClick={() => setSourceType('library')}
                    className={`px-6 py-3 rounded-2xl font-bold transition-all ${sourceType === 'library' ? 'bg-amber-950 text-amber-400 shadow-xl' : 'bg-white text-slate-400 border border-slate-100'}`}
                  >
                    Mit Bibliotek
                  </button>
                </div>
              </div>

              <div className="max-w-4xl mx-auto">
                {sourceType === 'upload' ? (
                  <>
                    <label className="flex flex-col items-center justify-center gap-6 w-full h-80 border-4 border-dashed border-amber-100 rounded-[3rem] bg-white hover:bg-amber-50/50 hover:border-amber-950/20 transition-all cursor-pointer group">
                      <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                        <FileUp className="w-12 h-12" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-950">Vælg eller træk slides herover</p>
                        <p className="text-sm text-slate-400 mt-2">Support for PDF (.pdf) & PowerPoint (.pptx)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept=".pdf,.pptx"
                        onChange={(e) => {
                          if (e.target.files) setFiles(Array.from(e.target.files));
                        }}
                      />
                    </label>

                    {files.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-3">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between p-5 bg-white border border-amber-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-4">
                              <File className="w-6 h-6 text-amber-600" />
                              <span className="font-bold text-amber-950">{f.name}</span>
                            </div>
                            <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><X className="w-5 h-5 text-slate-300 hover:text-amber-950" /></button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seminars.length === 0 ? (
                      <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                        <Presentation className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold">Du har ingen gemte seminarer endnu.</p>
                      </div>
                    ) : (
                      seminars.map(sem => (
                        <button 
                          key={sem.id}
                          onClick={() => handleToggleSeminar(sem.id)}
                          className={`p-6 rounded-3xl text-left border-2 transition-all flex items-center justify-between group ${
                            selectedSeminarIds.has(sem.id) 
                              ? 'border-amber-950 bg-amber-950 text-white shadow-xl' 
                              : 'border-white bg-white text-slate-600 hover:border-amber-100'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedSeminarIds.has(sem.id) ? 'bg-white/10' : 'bg-amber-50 text-amber-600'}`}>
                              <Presentation className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold leading-tight line-clamp-1">{sem.overallTitle}</h4>
                              <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${selectedSeminarIds.has(sem.id) ? 'text-amber-400' : 'text-slate-400'}`}>
                                {sem.slides.length} Slides
                              </p>
                            </div>
                          </div>
                          {selectedSeminarIds.has(sem.id) && <CheckCircle className="w-5 h-5 text-amber-400" />}
                        </button>
                      ))
                    )}
                  </div>
                )}
                
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full h-16 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest mt-8 shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {files.length === 0 && selectedSeminarIds.size === 0 ? "Spring over slides" : "Fortsæt til Lovgivning"} <Plus className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {isGenerating && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] bg-[#FDFCF8]/95 backdrop-blur-xl flex items-center justify-center p-8"
             >
                <div className="max-w-xl w-full space-y-12">
                   <div className="relative h-2 w-full bg-amber-100 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${generationProgress}%` }}
                        className="absolute h-full bg-amber-950 rounded-full shadow-[0_0_20px_rgba(69,39,16,0.3)]" 
                      />
                   </div>

                   <div className="flex flex-col items-center gap-8">
                       <div className="relative">
                          <AnimatePresence mode="wait">
                             <motion.div 
                                key={loadingStage}
                                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 1.2, rotate: 10 }}
                                className="w-32 h-32 bg-amber-950 rounded-[2.5rem] flex items-center justify-center text-amber-400 shadow-2xl"
                             >
                                {React.createElement(loadingStages[loadingStage].icon, { className: 'w-12 h-12' })}
                             </motion.div>
                          </AnimatePresence>
                          <div className="absolute -inset-4 border-2 border-dashed border-amber-950/10 rounded-[3rem] animate-[spin_20s_linear_infinite]" />
                       </div>

                       <div className="text-center space-y-4">
                          <h3 className="text-3xl font-black text-amber-950 serif tracking-tight italic">Arkitekten tegner...</h3>
                          <div className="space-y-2">
                             {loadingStages.map((s, i) => (
                                <motion.div 
                                  key={i} 
                                  animate={{ 
                                    opacity: i === loadingStage ? 1 : 0.2,
                                    scale: i === loadingStage ? 1.05 : 0.95
                                  }}
                                  className="flex items-center justify-center gap-3"
                                >
                                   <div className={`w-1.5 h-1.5 rounded-full ${i <= loadingStage ? 'bg-amber-600' : 'bg-slate-300'}`} />
                                   <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${i === loadingStage ? 'text-amber-950' : 'text-slate-400'}`}>
                                      {s.label}
                                   </span>
                                </motion.div>
                             ))}
                          </div>
                       </div>
                   </div>

                   <div className="bg-white/50 p-6 rounded-3xl border border-amber-100 text-center">
                       <p className="text-[10px] font-medium text-slate-400 italic">"Gode ting tager tid. Vi murer de juridiske sten sammen med din faglighed..."</p>
                   </div>
                </div>
             </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-900 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100">
                  <Scale className="w-4 h-4 text-amber-500" /> Trin 2: Vælg det juridiske fundament
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-amber-950 serif tracking-tighter">Hvilke love er i spil?</h2>
                <p className="text-slate-500 max-w-lg mx-auto italic">Vælg 1-5 love eller spring over for at designe udelukkende ud fra fagligt indhold.</p>
              </div>

              <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="relative flex-1">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                    <input 
                        type="text" 
                        placeholder="Søg i love..." 
                        className="w-full h-16 pl-16 pr-8 bg-white border-2 border-amber-50 rounded-2xl focus:border-amber-950 outline-none transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    </div>
                </div>

                {savedParagraphs.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40 px-4">Gemte Paragraffer fra dit arkiv</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savedParagraphs.map(para => (
                                <button 
                                    key={para.id}
                                    onClick={() => handleToggleParagraph(para.id)}
                                    className={`p-6 rounded-3xl text-left border-2 transition-all flex items-center justify-between group ${
                                        selectedParagraphIds.has(para.id) 
                                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-xl' 
                                        : 'border-white bg-white text-slate-600 hover:border-emerald-100'
                                    }`}
                                >
                                    <div>
                                        <p className="font-black text-[10px] uppercase tracking-widest opacity-60 mb-1">{para.lawTitle}</p>
                                        <h4 className="font-bold leading-tight line-clamp-1">{para.title}</h4>
                                    </div>
                                    {selectedParagraphIds.has(para.id) && <CheckCircle className="w-5 h-5 text-emerald-200" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-900/40 px-4">Alle Love (Lovportalen)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLaws.map(law => (
                        <button 
                        key={law.id}
                        onClick={() => handleToggleLaw(law.id)}
                        className={`p-6 rounded-2xl text-left border-2 transition-all flex items-center justify-between group ${
                            selectedLawIds.has(law.id) 
                            ? 'border-amber-950 bg-amber-950 text-white shadow-xl translate-y-[-2px]' 
                            : 'border-white bg-white text-slate-600 hover:border-amber-100'
                        }`}
                        >
                        <div>
                            <p className="font-black text-[10px] uppercase tracking-widest opacity-60 mb-1">{law.abbreviation}</p>
                            <h4 className="font-bold leading-tight uppercase">{law.name}</h4>
                        </div>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            selectedLawIds.has(law.id) ? 'bg-amber-400 border-amber-400 text-amber-950' : 'border-slate-100 bg-slate-50'
                        }`}>
                            {selectedLawIds.has(law.id) && <CheckCircle className="w-4 h-4" />}
                        </div>
                        </button>
                    ))}
                    </div>
                </div>

                <div className="sticky bottom-10 py-6 bg-gradient-to-t from-[#FDFCF8] via-[#FDFCF8] to-transparent">
                    <Button 
                        disabled={(files.length === 0 && selectedSeminarIds.size === 0 && selectedLawIds.size === 0 && selectedParagraphIds.size === 0) || isGenerating}
                        onClick={handleGenerate}
                        className="w-full h-20 rounded-[2rem] bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <div className="flex items-center gap-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span>Arkitekten tegner ({generationProgress}%)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Sparkles className="w-6 h-6" />
                                <span>{ (selectedLawIds.size === 0 && selectedParagraphIds.size === 0) ? "Generer uden lovgivning" : "Generer Kursusdesign" }</span>
                            </div>
                        )}
                    </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && courseDesign && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12 pb-40"
            >
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-amber-950 rounded-[2.5rem] flex items-center justify-center text-amber-400 shadow-2xl mx-auto">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-amber-950 serif tracking-tighter leading-none">{courseDesign.courseTitle}</h2>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-900">
                        <Target className="w-4 h-4 inline mr-2 text-amber-600" /> {courseDesign.targetAudience}
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-xs font-bold text-emerald-900">
                        <Clock className="w-4 h-4 inline mr-2 text-emerald-600" /> {courseDesign.modules.reduce((acc, m) => acc + m.lessons.reduce((lacc, l) => lacc + l.durationMinutes, 0), 0)} min total
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-8 space-y-12">
                      {courseDesign.modules.map((module, mIdx) => (
                          <section key={mIdx} className="bg-white rounded-[4rem] border border-amber-50 shadow-sm overflow-hidden">
                              <div className="p-10 md:p-14 bg-amber-950 text-white">
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-2 block text-center">Modul {mIdx + 1}</span>
                                  <h3 className="text-3xl font-black serif text-center">{module.title}</h3>
                                  <p className="mt-4 text-amber-50/70 text-center text-sm italic font-medium">{module.description}</p>
                              </div>
                              <div className="p-8 md:p-14 space-y-12">
                                  {module.lessons.map((lesson, lIdx) => (
                                      <div key={lIdx} className="relative pl-12 border-l-2 border-amber-50">
                                          <div className="absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-amber-950 border-4 border-white shadow-sm" />
                                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                              <h4 className="text-2xl font-bold text-amber-950">{lesson.title}</h4>
                                              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{lesson.durationMinutes} min</span>
                                          </div>
                                          
                                          <div className="space-y-6">
                                              <p className="text-slate-600 leading-relaxed font-medium">{lesson.contentSummary}</p>
                                              
                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                  <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-50">
                                                      <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-4 flex items-center gap-2">
                                                          <Layout className="w-3.5 h-3.5" /> Læringsmål
                                                      </h5>
                                                      <ul className="space-y-2">
                                                          {lesson.learningObjectives.map((obj, oIdx) => (
                                                              <li key={oIdx} className="text-xs text-amber-950/70 flex items-start gap-2">
                                                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                                                  {obj}
                                                              </li>
                                                          ))}
                                                      </ul>
                                                  </div>
                                                  <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm transition-all hover:shadow-md">
                                                       <h5 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-4 flex items-center gap-2">
                                                          <Scale className="w-3.5 h-3.5" /> Juridisk Kobling
                                                      </h5>
                                                      <div className="space-y-4">
                                                          {lesson.legalLinks.map((link, kIdx) => (
                                                              <div key={kIdx} className="space-y-1">
                                                                  <p className="text-xs font-black text-amber-950">{link.paragraf}</p>
                                                                  <p className="text-[10px] text-slate-500 italic leading-snug">{link.why}</p>
                                                              </div>
                                                          ))}
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </section>
                      ))}
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                      <aside className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm sticky top-32">
                          <div className="space-y-10">
                              <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-6 flex items-center gap-2">
                                      <Target className="w-4 h-4" /> Kursusudbytte
                                  </h4>
                                  <ul className="space-y-4">
                                      {courseDesign.overallLearningOutcomes.map((outcome, i) => (
                                          <li key={i} className="flex items-start gap-3">
                                              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                                  <CheckCircle className="w-4 h-4" />
                                              </div>
                                              <p className="text-sm font-medium text-slate-700">{outcome}</p>
                                          </li>
                                      ))}
                                  </ul>
                              </div>

                              <div className="pt-10 border-t border-amber-50">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 mb-6 flex items-center gap-2">
                                      <BookMarked className="w-4 h-4" /> Anbefalet Litteratur
                                  </h4>
                                  <div className="space-y-6">
                                      {courseDesign.suggestedReading.map((book, i) => (
                                          <div key={i} className="space-y-2">
                                              <p className="text-sm font-bold text-amber-950 leading-tight">{book.title}</p>
                                              <p className="text-xs text-slate-500 italic leading-relaxed">{book.relevance}</p>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              <Button 
                                onClick={() => router.push(`/kursus/${courseId}`)}
                                className="w-full h-14 rounded-2xl bg-amber-950 text-amber-400 font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                              >
                                  Start digitalt kursus <Sparkles className="w-4 h-4 ml-2" />
                              </Button>
                              <Button variant="outline" className="w-full h-14 rounded-2xl border-amber-100 text-amber-950 font-bold">
                                  Eksporter Kursusplan
                              </Button>
                          </div>
                      </aside>
                  </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step !== 3 && userCourses.length > 0 && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             ref={recentSectionRef}
             className="mt-32 pt-20 border-t border-amber-100"
           >
              <div className="flex items-center justify-between mb-10">
                 <div>
                    <h3 className="text-3xl font-black text-amber-950 serif tracking-tight">Mine gemte kurser</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1">Dine seneste arkitekt-tegninger</p>
                 </div>
                 <Button variant="ghost" onClick={() => router.push('/mine-kurser')} className="text-amber-600 font-black uppercase tracking-widest text-[10px] hover:bg-amber-50">
                    Se alle kurser <ChevronRight className="w-4 h-4 ml-2" />
                 </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {userCourses.slice(0, 3).map((course) => {
                    const totalLessons = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
                    const completedCount = course.completedLessons?.length || 0;
                    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                    return (
                        <div 
                        key={course.id}
                        onClick={() => router.push(`/kursus/${course.id}`)}
                        className="group bg-white p-8 rounded-[2.5rem] border border-amber-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full"
                        >
                        <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
                                    {course.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                                </span>
                        </div>
                        <h4 className="text-lg font-black text-amber-950 serif leading-tight line-clamp-2 mb-6 flex-grow">{course.courseTitle}</h4>
                        
                        <div className="space-y-4 mb-6">
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                               <span>Fremgang</span>
                               <span>{progress}%</span>
                           </div>
                           <div className="h-2 bg-amber-50 rounded-full overflow-hidden">
                               <div 
                                 className="h-full bg-amber-600 rounded-full transition-all duration-1000" 
                                 style={{ width: `${progress}%` }} 
                               />
                           </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-amber-600 group-hover:gap-6 transition-all">
                            {progress === 100 ? "Gennemfør igen" : "Fortsæt kursus"} <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        </div>
                    );
                 })}
              </div>
           </motion.div>
        )}
      </main>
    </div>
  );
}
