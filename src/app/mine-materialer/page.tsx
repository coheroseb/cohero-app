'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Upload, 
  File, 
  X, 
  Check, 
  Loader2, 
  Trash2, 
  Plus, 
  Calendar, 
  BookOpen, 
  ArrowLeft,
  Search,
  ChevronRight,
  FileText,
  FileBox,
  Layout,
  Clock,
  ExternalLink,
  ShieldCheck,
  Zap,
  Filter,
  GraduationCap,
  Building,
  Crown,
  Lock,
  Info,
  CheckCircle2,
  Brain,
  Quote,
  AlertTriangle,
  Library,
  History,
  MessageSquarePlus
} from 'lucide-react';
import { analyzeCasePdfAction, unifiedChatAction, analyzeSyllabusAction, saveMaterialTextAction, generateMaterialAIOverviewAction, materialVectorChatAction } from '@/app/actions';
import { extractText } from 'unpdf';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { useFirestore, useStorage, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

// --- TYPES ---
interface Material {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  semester: string;
  institution: string;
  profession: string;
  createdAt: any;
  isIndexed?: boolean | 'error' | 'pending' | 'success' | 'generating' | 'true';
  rawText?: string;
  aiOverviewData?: string;
  overviewGeneratedAt?: any;
}

interface SemesterPlan {
  id: string;
  title: string;
  semesterInfo: string;
  weeklyBreakdown: { weekNumber: number; events: any[] }[];
}

export default function MineMaterialerPage() {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currentSemesterId = userProfile?.semester || '1';
  const currentInstitution = userProfile?.institution || 'Ikke angivet';
  const currentProfession = userProfile?.profession || 'Studerende';

  // --- Curriculum & Module Name Lookup ---
  const curriculumsQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.profession) return null;
    return query(
      collection(firestore, 'curriculums'),
      where('profession', '==', userProfile.profession)
    );
  }, [firestore, userProfile?.profession]);

  const { data: curriculumsRaw } = useCollection<any>(curriculumsQuery);

  const curriculum = useMemo(() => {
    if (userProfile?.customCurriculum) return userProfile.customCurriculum;
    if (!curriculumsRaw || curriculumsRaw.length === 0) return null;
    
    const userInst = (userProfile?.institution || '').toLowerCase().trim();
    const normalize = (s: string) => s.toLowerCase().replace(/professionshøjskolen\s+/gs, '').replace(/university college\s+/gs, '').trim();
    const normalizedUserInst = normalize(userInst);
    
    const instMatch = curriculumsRaw.find((c: any) => normalize(c.institution || '').includes(normalizedUserInst) || normalizedUserInst.includes(normalize(c.institution || '')));
    return instMatch || curriculumsRaw[0];
  }, [curriculumsRaw, userProfile?.institution, userProfile?.customCurriculum]);

  const activeModule = useMemo(() => {
    if (!curriculum) return null;
    const semNum = parseInt(currentSemesterId.match(/\d+/)?.[0] ?? '1');
    return curriculum.modules.find((m: any) => 
      (m.semester === semNum) || 
      m.id === currentSemesterId ||
      m.name?.toLowerCase().includes(currentSemesterId.toLowerCase())
    );
  }, [curriculum, currentSemesterId]);

  const currentDisplayName = activeModule?.name || (isNaN(parseInt(currentSemesterId)) ? currentSemesterId : `${currentSemesterId}. semester`);
  const isKollegaPlus = userProfile?.membership === 'Kollega+';
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  const [localOverview, setLocalOverview] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [chatState, setChatState] = useState<{ goal: string, text: string, loading: boolean } | null>(null);
  
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalChatMessages, setGlobalChatMessages] = useState<{ id: string, role: 'user' | 'assistant', text: string }[]>([]);
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);
  
  const [chatThreads, setChatThreads] = useState<{ id: string, title: string, messages: any[], updatedAt: number }[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);

  useEffect(() => {
      const saved = localStorage.getItem('cohero-material-chats');
      if (saved) {
          try { setChatThreads(JSON.parse(saved)); } catch(e) {}
      }
  }, []);

  const handleGlobalChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalChatInput.trim() || isGlobalChatLoading) return;
    
    const userMessage = globalChatInput;
    setGlobalChatInput('');
    
    let currentThreadId = activeThreadId;
    let isNewThread = false;
    if (!currentThreadId) {
        currentThreadId = Date.now().toString();
        setActiveThreadId(currentThreadId);
        isNewThread = true;
    }
    
    const newMsg = { id: Date.now().toString(), role: 'user' as const, text: userMessage };
    setGlobalChatMessages(prev => [...prev, newMsg]);
    setIsGlobalChatLoading(true);

    try {
        const hasVectorIndexed = filteredMaterials.some(m => m.vectorIndexed || m.isIndexed === true);
        
        let answer = "Kunne ikke generere et svar.";
        
        if (hasVectorIndexed && user) {
            // Brug den nye Vector Database RAG søgning
            const response = await materialVectorChatAction({
                userId: user.uid,
                message: userMessage,
                chatHistory: globalChatMessages.map(m => ({ role: m.role, content: m.text }))
            });
            answer = response?.answer || "Kunne ikke generere et svar.";
        } else {
            // Fallback til legacy RAG (sender hele teksten med op til token limit)
            const contextText = filteredMaterials
                .filter(m => m.rawText)
                .map(m => `--- DOKUMENT: ${m.name} ---\n${m.rawText?.substring(0, 8000)}`) // Limit slightly to avoid huge payloads
                .join('\n\n');

            const prompt = `Du har adgang til følgende dokumenter fra brugerens vidensarkiv:\n\n${contextText}\n\nBesvar brugerens spørgsmål baseret på ovenstående dokumenter. Skriv i et naturligt, menneskeligt og dialogbaseret sprog frem for at lyde som en robot. Vær gerne uformel, men faglig. Hvis svaret ikke findes heri, så brug din generelle faglige viden, men gør opmærksom på det. BRUG KUN HTML-tags (<b>, <ul>, <li>) til formatering, BRUG ALDRIG markdown asterisker (**). Start dit svar direkte uden nogen form for hilsen (ingen "Kære studerende", "Hej" eller lignende).`;

            const response = await unifiedChatAction({
                message: userMessage,
                chatHistory: globalChatMessages.map(m => ({ role: m.role, content: m.text })),
                persona: 'academic',
                context: { relevantDocumentIds: [], lawContext: prompt }
            });
            answer = response?.data?.answer || response?.answer || "Kunne ikke generere et svar.";
        }
        const botMsg = { id: Date.now().toString(), role: 'assistant' as const, text: answer };
        
        setGlobalChatMessages(prev => {
            const newMsgs = [...prev, botMsg];
            
            setChatThreads(threads => {
                let newThreads = [...threads];
                if (isNewThread) {
                    newThreads.unshift({
                        id: currentThreadId!,
                        title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
                        messages: [newMsg, botMsg],
                        updatedAt: Date.now()
                    });
                } else {
                    const idx = newThreads.findIndex(t => t.id === currentThreadId);
                    if (idx >= 0) {
                        newThreads[idx].messages = newMsgs;
                        newThreads[idx].updatedAt = Date.now();
                        const [t] = newThreads.splice(idx, 1);
                        newThreads.unshift(t);
                    }
                }
                localStorage.setItem('cohero-material-chats', JSON.stringify(newThreads));
                return newThreads;
            });
            return newMsgs;
        });
    } catch (error) {
        console.error("Global chat error:", error);
        toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke kontakte AI.' });
    } finally {
        setIsGlobalChatLoading(false);
    }
  };

  const handleAskAboutGoal = async (goal: string, rawText?: string) => {
    if (!user) return;
    try {
        const textToAnalyze = rawText ? rawText.substring(0, 15000) : "Ingen tekst fundet i dokumentet.";
        const prompt = `Du er en akademisk mentor. Forklar præcist, pædagogisk og i et naturligt, menneskeligt sprog, hvordan dokumentet bidrager til at opfylde følgende læringsmål: "${goal}".\nBrug konkrete eksempler fra teksten. Sørg for ikke at lyde maskinel. BRUG KUN HTML-tags (<b>, <ul>, <li>) til formatering, BRUG ALDRIG markdown asterisker (**). Start dit svar direkte uden nogen form for indledende hilsen (ingen "Kære studerende", "Hej" eller lignende).\n\nMateriale-uddrag:\n${textToAnalyze}`;
        
        const response = await unifiedChatAction({
            message: prompt,
            chatHistory: [],
            persona: 'academic',
            context: { relevantDocumentIds: [], lawContext: '' }
        });
        
        const answer = response?.data?.answer || response?.answer || "Kunne ikke generere et svar.";
        setChatState(prev => prev?.goal === goal ? { goal, text: answer, loading: false } : prev);
    } catch (e) {
        console.error("Chat error:", e);
        setChatState(prev => prev?.goal === goal ? { goal, text: "Der opstod en fejl under analysen. Prøv igen.", loading: false } : prev);
        toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke kontakte AI.' });
    }
  };
  
  const activeMaterial = useMemo(() => {
    if (!selectedMaterial) return null;
    const fromList = materials.find(m => m.id === selectedMaterial.id);
    const material = fromList || selectedMaterial;
    
    // Merge in local overview if we just generated it
    if (localOverview[material.id]) {
      return { ...material, aiOverviewData: localOverview[material.id] };
    }
    return material;
  }, [materials, selectedMaterial, localOverview]);

  // Fetch Materials for current semester
  useEffect(() => {
    if (!user || !firestore || !userProfile) return;
    
    const q = query(
      collection(firestore, 'users', user.uid, 'materials'),
      where('semester', '==', currentSemesterId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
      setMaterials(docs);
      setIsLoading(false);
    }, (err) => {
      console.error("[MineMaterialer] Firestore listener error:", err);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Fejl ved hentning af materialer",
        description: "Du har muligvis ikke adgang, eller der er en netværksfejl. Prøv at genopfriske siden."
      });
    });
    return () => unsub();
  }, [user, firestore, userProfile, currentSemesterId]);

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [materials, searchQuery]);

  // 3. Handle File Upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || !user || !storage || !firestore || !userProfile || !isKollegaPlus) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const fileId = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `users/${user.uid}/materials/${currentSemesterId}/${fileId}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        },
        (error) => {
          console.error("Upload error:", error);
          toast({ variant: 'destructive', title: 'Upload fejlede', description: `Kunne ikke uploade ${file.name}` });
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 1. Save initial record
          const materialRef = await addDoc(collection(firestore, 'users', user.uid, 'materials'), {
            name: file.name,
            type: file.type,
            size: file.size,
            url: downloadURL,
            semester: currentSemesterId,
            semesterName: currentDisplayName,
            institution: currentInstitution,
            profession: currentProfession,
            storagePath: storageRef.fullPath,
            isIndexed: false,
            createdAt: serverTimestamp()
          });

          // 2. Trigger Client-side PDF Indexing
          try {
            console.log(`[MineMaterialer] Extracting text from ${file.name}...`);
            
            // Mark as processing in Firestore via update (it exists now)
            const refDoc = doc(firestore, 'users', user.uid, 'materials', materialRef.id);
            await updateDoc(refDoc, { isIndexed: 'processing' });

            const arrayBuffer = await file.arrayBuffer();
            const result = await extractText(new Uint8Array(arrayBuffer));
            
            let rawText = '';
            if (typeof result.text === 'string') rawText = result.text;
            else if (Array.isArray(result.text)) rawText = result.text.join('\n\n');
            
            if (!rawText.trim()) {
                console.warn("[MineMaterialer] No text found in PDF. This might be a scanned document.");
                rawText = "Dette dokument ser ud til at være scannet (billedbaseret), da ingen tekst kunne udtrækkes automatisk.";
            }

            console.log(`[MineMaterialer] Saving extracted text (${rawText.length} chars)...`);
            await saveMaterialTextAction({
              userId: user.uid,
              materialId: materialRef.id,
              rawText: rawText.trim()
            });
            
            // 2.5 Trigger AI Overview generation (BACKGROUND - don't await fully)
            console.log(`[MineMaterialer] Starting AI overview generation in background for ${file.name}...`);
            generateMaterialAIOverviewAction({
              userId: user.uid,
              materialId: materialRef.id,
              rawText: rawText.trim(),
              candidateLearningGoals: activeModule?.learningGoals || [] 
            }).catch(e => console.error("Auto-AI generation failed:", e));

            // 3. Final update on client to ensure UI reflects success immediately
            await updateDoc(refDoc, { 
                isIndexed: true,
                rawText: rawText.trim() // Also update rawText locally
            });
            
            console.log(`[MineMaterialer] Indexing complete for ${file.name}!`);
          } catch (indexErr) {
            console.error("Indexing failed:", indexErr);
            const refDoc = doc(firestore, 'users', user.uid, 'materials', materialRef.id);
            await updateDoc(refDoc, { isIndexed: 'error' }).catch(console.error);
          }
          
          setUploadProgress(prev => {
            const next = { ...prev };
            delete next[file.name];
            return next;
          });
          
          if (Object.keys(uploadProgress).length <= 1) {
            setIsUploading(false);
          }
        }
      );
    }
  };

  const handleDeleteMaterial = async (material: Material) => {
    if (!user || !firestore || !storage || !window.confirm('Er du sikker på, at du vil slette dette materiale?')) return;
    
    try {
      await deleteDoc(doc(firestore, 'users', user.uid, 'materials', material.id));
      const materialDoc = materials.find(m => m.id === material.id) as any;
      if (materialDoc?.storagePath) {
        const storageRef = ref(storage, materialDoc.storagePath);
        await deleteObject(storageRef).catch(() => {});
      }
      if (selectedMaterial?.id === material.id) setSelectedMaterial(null);
      toast({ title: 'Slettet', description: 'Materialet er blevet fjernet.' });
    } catch (e) {
      console.error("Delete error:", e);
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke slette materialet.' });
    }
  };

  if (isUserLoading || userProfile === undefined || (userProfile && isLoading)) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col selection:bg-indigo-100 font-sans">
      {/* Decorative Background */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03)_0%,transparent_70%)] rounded-full blur-[120px] pointer-events-none z-0"></div>
      
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal" className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <FileBox className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vidensarkiv</span>
              </div>
              <h1 className="text-xl font-[900] text-slate-900 tracking-tight">Mine Materialer</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sikkert Arkiv</span>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        <div className="grid lg:grid-cols-[380px,1fr] gap-12 items-start">
          
          {/* SIDEBAR */}
          <aside className="space-y-8">
            <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <div className="space-y-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-4">Aktuel Kontekst</label>
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
                         <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Profession</p>
                         <p className="text-sm font-bold text-slate-900 leading-tight">{currentProfession}</p>
                      </div>
                   </div>

                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                         <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Semester / Modul</p>
                         <p className="text-sm font-bold text-slate-900 leading-tight">{currentDisplayName}</p>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-125 transition-transform duration-1000">
                  <Zap className="w-32 h-32" />
               </div>
               <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                    <FileText className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">Dokumentlæsning</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Når du uploader dine materialer, udtrækker Cohéro automatisk teksten. Det gør det muligt at søge i dit pensum og bruge indholdet som reference i dine fremtidige chats.
                  </p>
               </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="space-y-10">
            {/* UPLOAD AREA */}
            <section className="bg-white p-12 rounded-[3.5rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 transition-all group relative overflow-hidden shadow-sm">
               {!isKollegaPlus ? (
                 <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center">
                    <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-amber-100/50">
                       <Crown className="w-10 h-10" />
                    </div>
                    <div className="space-y-4 max-w-sm">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kollega+ påkrævet</h3>
                       <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Få adgang til dit eget personlige vidensarkiv og AI-analyse af dit pensum med Kollega+.
                       </p>
                    </div>
                    <Link href="/upgrade">
                       <Button className="bg-slate-950 text-white hover:bg-indigo-600 font-black uppercase tracking-widest text-[11px] px-12 h-14 rounded-2xl shadow-xl transition-all active:scale-95">
                          Opgrader nu
                       </Button>
                    </Link>
                 </div>
               ) : (
                 <>
                   <AnimatePresence>
                    {isUploading && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center"
                        >
                          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-8" />
                          <h3 className="text-2xl font-[900] text-slate-900 mb-2 tracking-tight">Læser dokumenter...</h3>
                          <p className="text-slate-500 text-sm mb-10 font-medium italic">Cohéro udtrækker tekst fra dit pensum nu</p>
                          <div className="w-full max-w-md space-y-5">
                              {Object.entries(uploadProgress).map(([name, progress]) => (
                                <div key={name} className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span className="truncate max-w-[250px]">{name}</span>
                                    <span>{Math.round(progress)}%</span>
                                  </div>
                                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-indigo-600"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                          </div>
                        </motion.div>
                    )}
                   </AnimatePresence>

                   <label className="cursor-pointer flex flex-col items-center justify-center py-10 space-y-6">
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={(e) => handleUpload(e.target.files)}
                        disabled={isUploading}
                      />
                      <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-[2.5rem] flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner border border-slate-100">
                         <Upload className="w-10 h-10" />
                      </div>
                      <div className="text-center space-y-2">
                        <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">Upload dit pensum</h3>
                        <p className="text-sm text-slate-400 font-medium">
                          Træk PDF, Word eller Slides hertil. <br />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-4 inline-block">
                             Automatisk tilknytning: {currentDisplayName}
                          </span>
                        </p>
                      </div>
                   </label>
                 </>
               )}
            </section>

            {/* MATERIAL LIST */}
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shadow-xl">
                        <Library className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-[900] text-slate-950 tracking-tight">Dit Vidensarkiv</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{filteredMaterials.length} dokumenter</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-grow max-w-xl">
                    <div className="relative group flex-grow">
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Søg i dine materialer..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                      />
                    </div>
                    
                    <Button 
                        onClick={() => setIsGlobalChatOpen(true)}
                        className="h-14 px-6 sm:px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 flex items-center gap-2 shrink-0 transition-all hover:scale-105 active:scale-95"
                    >
                        <Brain className="w-4 h-4" />
                        <span className="hidden sm:inline">Chat med arkiv</span>
                    </Button>
                  </div>
              </div>

              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredMaterials.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-32 text-center bg-white rounded-[3.5rem] border border-slate-100 shadow-sm"
                    >
                      <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-8">
                        <FileBox className="w-10 h-10" />
                      </div>
                      <h4 className="text-slate-400 font-bold italic">Du har endnu ikke uploadet materialer til dette semester.</h4>
                    </motion.div>
                  ) : (
                    filteredMaterials.map((material, idx) => (
                      <motion.div
                        key={material.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedMaterial(material)}
                        className={`bg-white p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group cursor-pointer ${
                          selectedMaterial?.id === material.id ? 'border-indigo-600 ring-4 ring-indigo-500/5 shadow-xl' : 'border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100'
                        }`}
                      >
                        <div className="flex items-center gap-6 min-w-0">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                            material.type.includes('pdf') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            material.type.includes('word') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            <FileText className="w-7 h-7" />
                          </div>
                          <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="text-base font-black text-slate-950 truncate tracking-tight">{material.name}</h4>
                                {material.isIndexed === false ? (
                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 animate-pulse">
                                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Læser indhold...</span>
                                    </div>
                                ) : material.isIndexed === 'error' ? (
                                    <div className="flex items-center gap-2 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                                        <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">Fejl i læsning</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Indhold Klar</span>
                                    </div>
                                )}
                              </div>
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-1.5 text-slate-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                       {material.createdAt?.toDate?.().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) || 'Lige nu'}
                                    </span>
                                 </div>
                                 <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(material.size / 1024 / 1024).toFixed(1)} MB</span>
                              </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                           <a 
                             href={material.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             onClick={(e) => e.stopPropagation()}
                             className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-2xl transition-all shadow-sm"
                           >
                              <ExternalLink className="w-5 h-5" />
                           </a>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material); }}
                             className="p-4 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-white border border-transparent hover:border-rose-100 rounded-2xl transition-all shadow-sm"
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* DETAIL MODAL / DRAWER */}
      <AnimatePresence>
        {activeMaterial && (
            <>
                {console.log("[MineMaterialer] Modal active material status:", activeMaterial.isIndexed)}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedMaterial(null)}
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90]"
                />
                <motion.div 
                    key={activeMaterial.id + (activeMaterial.overviewGeneratedAt?.seconds || '')}
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] overflow-y-auto"
                >
                    <div className="p-8 sm:p-12 space-y-10">
                        <div className="flex items-center justify-between">
                            <button 
                                onClick={() => setSelectedMaterial(null)}
                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex items-center gap-3">
                                <a href={activeMaterial.url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" className="rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] h-12 px-8">Åbn original</Button>
                                </a>
                                <Button onClick={() => handleDeleteMaterial(activeMaterial)} variant="ghost" className="rounded-2xl text-rose-500 hover:bg-rose-50 font-black uppercase tracking-widest text-[10px] h-12 px-8">Slet</Button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-indigo-100">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-[900] text-slate-950 tracking-tight leading-tight">{activeMaterial.name}</h2>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">{currentDisplayName}</p>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 w-full" />

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest flex items-center gap-3 mb-6">
                                        <BookOpen className="w-4 h-4 text-indigo-500" />
                                        Dokument Indhold
                                    </h3>
                                    { (activeMaterial.aiOverviewData || activeMaterial.isIndexed === true || activeMaterial.isIndexed === 'true' || activeMaterial.isIndexed === 'success') ? (
                                        <div className="space-y-6">
                                            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600">
                                                    <CheckCircle2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-emerald-900 font-black text-xs uppercase tracking-widest">Indhold klar</p>
                                                    <p className="text-emerald-700/70 text-[10px] font-bold uppercase tracking-tight">AI har analyseret dit materiale</p>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Brain className="w-3 h-3 text-indigo-400" />
                                                        AI Overblik & Pointer
                                                    </h4>
                                                    {activeMaterial.isIndexed === 'generating' && (
                                                        <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold animate-pulse">
                                                            <Loader2 className="w-2 h-2 animate-spin" />
                                                            AI tænker...
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-10 pb-12">
                                                    {(() => {
                                                        try {
                                                            const data = activeMaterial.aiOverviewData ? JSON.parse(activeMaterial.aiOverviewData) : null;
                                                            
                                                            if (isGenerating === activeMaterial.id) {
                                                                return (
                                                                    <div className="space-y-12 py-4">
                                                                        <div className="flex flex-col items-center justify-center space-y-4">
                                                                            <div className="relative">
                                                                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                                                                                <div className="relative bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-xl shadow-indigo-50">
                                                                                    <Brain className="w-10 h-10 text-indigo-500 animate-bounce" />
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-center space-y-1">
                                                                                <p className="text-indigo-600 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                                                                                    AI skaber overblik...
                                                                                </p>
                                                                                <p className="text-slate-400 text-[10px] font-medium">Analyserer ud fra dine læringsmål</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-8">
                                                                            <div className="space-y-3">
                                                                                <div className="h-2 bg-slate-100 rounded-full w-24" />
                                                                                <div className="h-4 bg-slate-50 rounded-2xl w-full" />
                                                                                <div className="h-4 bg-slate-50 rounded-2xl w-[90%]" />
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div className="h-32 bg-slate-50 rounded-[2rem] animate-pulse" />
                                                                                <div className="h-32 bg-slate-50 rounded-[2rem] animate-pulse delay-75" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            if (!data) return (
                                                                <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
                                                                    <p className="text-slate-400 text-sm font-medium italic text-center max-w-xs">
                                                                        Der er ikke dannet et instrumentelt overblik endnu. Tryk på knappen for at analysere.
                                                                    </p>
                                                                    <Button 
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            setIsGenerating(activeMaterial.id);
                                                                            console.log("[MineMaterialer] Clicked button for ID:", activeMaterial.id, "Name:", activeMaterial.name, "Semester:", activeMaterial.semester);
                                                                            if (!user) {
                                                                                console.error("[MineMaterialer] No user found");
                                                                                setIsGenerating(null);
                                                                                return;
                                                                            }
                                                                            try {
                                                                                let textToUse = activeMaterial.rawText;
                                                                                console.log("[MineMaterialer] Current text length:", textToUse?.length || 0);
                                                                                
                                                                                // If text is missing, extract it now
                                                                                if (!textToUse) {
                                                                                    toast({ title: "Uddrager tekst...", description: "Henter indholdet fra din PDF først." });
                                                                                    const response = await fetch(activeMaterial.url);
                                                                                    const arrayBuffer = await response.arrayBuffer();
                                                                                    const pdfjs = await import('pdfjs-dist');
                                                                                    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
                                                                                    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                                                                                    let extracted = "";
                                                                                    for (let i = 1; i <= pdf.numPages; i++) {
                                                                                        const page = await pdf.getPage(i);
                                                                                        const content = await page.getTextContent();
                                                                                        extracted += content.items.map((item: any) => item.str).join(" ") + " ";
                                                                                    }
                                                                                    textToUse = extracted;
                                                                                    await saveMaterialTextAction({ userId: user.uid, materialId: activeMaterial.id, text: extracted });
                                                                                }

                                                                                const result = await generateMaterialAIOverviewAction({
                                                                                    userId: user.uid,
                                                                                    materialId: activeMaterial.id,
                                                                                    rawText: textToUse || "",
                                                                                    candidateLearningGoals: activeModule?.learningGoals || []
                                                                                });
                                                                                
                                                                                if (result.success && result.overview) {
                                                                                    setLocalOverview(prev => ({ ...prev, [activeMaterial.id]: result.overview }));
                                                                                }
                                                                                toast({ title: "Overblik genereret", description: "AI har nu analyseret dit materiale." });
                                                                            } catch (err) {
                                                                                console.error("[MineMaterialer] CRITICAL ERROR:", err);
                                                                                toast({ title: "Fejl", description: "Kunne ikke danne overblik. Prøv igen.", variant: "destructive" });
                                                                            } finally {
                                                                                setIsGenerating(null);
                                                                            }
                                                                        }}
                                                                        className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-xl shadow-indigo-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                                                                    >
                                                                        <Brain className="w-4 h-4" />
                                                                        Danne AI Overblik
                                                                    </Button>
                                                                </div>
                                                            );

                                                            return (
                                                                <div className="space-y-12">
                                                                    {/* Summary Section */}
                                                                    <div className="relative group">
                                                                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        <div className="relative space-y-4">
                                                                            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                                <Quote className="w-3 h-3" />
                                                                                Kort Resumé
                                                                            </h4>
                                                                            <p className="text-slate-600 text-base font-medium leading-relaxed italic">
                                                                                "{data.summary}"
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Key Points Cards */}
                                                                    <div className="space-y-6">
                                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                            <Target className="w-3 h-3 text-rose-400" />
                                                                            Centrale Pointer
                                                                        </h4>
                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                            {data.keyPoints?.map((point: any, idx: number) => (
                                                                                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                                                                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                                                        <span className="text-xs font-black">{idx + 1}</span>
                                                                                    </div>
                                                                                    <h5 className="text-sm font-bold text-slate-950 mb-2">{point.title}</h5>
                                                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{point.description}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Learning Goals */}
                                                                    <div className="space-y-6">
                                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                            <GraduationCap className="w-3 h-3 text-emerald-400" />
                                                                            Relevante Læringsmål
                                                                        </h4>
                                                                        <div className="grid grid-cols-1 gap-3">
                                                                            {data.learningGoals?.map((item: any, idx: number) => {
                                                                                const goalText = typeof item === 'string' ? item : item.goal;
                                                                                const isChatting = chatState?.goal === goalText;
                                                                                return (
                                                                                    <div key={idx} className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100/50 space-y-4">
                                                                                        <div className="flex items-start justify-between gap-4">
                                                                                            <div className="space-y-2 flex-1">
                                                                                                <div className="flex items-center gap-2">
                                                                                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                                                                                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight">
                                                                                                        {goalText}
                                                                                                    </span>
                                                                                                </div>
                                                                                                {item.explanation && (
                                                                                                    <p className="text-[11px] text-emerald-700/70 font-medium leading-relaxed pl-3.5 border-l border-emerald-200 ml-0.5">
                                                                                                        {item.explanation}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                            <Button 
                                                                                                variant="ghost"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation();
                                                                                                    if (isChatting) {
                                                                                                        setChatState(null);
                                                                                                    } else {
                                                                                                        setChatState({ goal: goalText, text: '', loading: true });
                                                                                                        handleAskAboutGoal(goalText, activeMaterial.rawText);
                                                                                                    }
                                                                                                }}
                                                                                                className={`shrink-0 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${isChatting ? 'bg-emerald-200 text-emerald-800 hover:bg-emerald-300' : 'bg-white text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-100'}`}
                                                                                            >
                                                                                                <Brain className="w-3 h-3 mr-2" />
                                                                                                {isChatting ? 'Luk Svar' : 'Spørg AI'}
                                                                                            </Button>
                                                                                        </div>
                                                                                        <AnimatePresence>
                                                                                            {isChatting && (
                                                                                                <motion.div 
                                                                                                    initial={{ height: 0, opacity: 0 }}
                                                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                                                    exit={{ height: 0, opacity: 0 }}
                                                                                                    className="overflow-hidden"
                                                                                                >
                                                                                                    <div className="pt-4 mt-2 border-t border-emerald-200/50">
                                                                                                        {chatState.loading ? (
                                                                                                            <div className="flex items-center gap-3 text-emerald-600 text-xs font-bold animate-pulse">
                                                                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                                                                Analyserer materialet ift. læringsmålet...
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <div className="prose prose-sm max-w-none text-emerald-900/80 font-medium leading-relaxed" 
                                                                                                                dangerouslySetInnerHTML={{ __html: chatState.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} 
                                                                                                            />
                                                                                                        )}
                                                                                                    </div>
                                                                                                </motion.div>
                                                                                            )}
                                                                                        </AnimatePresence>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        } catch (e) {
                                                            return <p className="text-rose-500 text-xs italic">Fejl i visning af AI overblik. Prøv at danne det igen.</p>;
                                                        }
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (activeMaterial.isIndexed === 'error' || activeMaterial.isIndexed === 'failed') ? (
                                        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex flex-col items-center text-center space-y-4">
                                            <AlertTriangle className="w-10 h-10 text-rose-400" />
                                            <p className="text-rose-700 font-bold text-sm">Der skete en fejl under læsning af dokumentet.</p>
                                            <Button onClick={() => setSelectedMaterial(null)} variant="outline" className="rounded-xl border-rose-200 text-rose-500 hover:bg-rose-100">Prøv igen senere</Button>
                                        </div>
                                    ) : (activeMaterial.isIndexed === 'processing' || activeMaterial.isIndexed === 'loading' || activeMaterial.isIndexed === 'generating') ? (
                                        <div className="bg-amber-50/50 p-12 rounded-[2.5rem] border border-dashed border-amber-200 flex flex-col items-center text-center space-y-6">
                                            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                                            <div className="space-y-1">
                                                <p className="text-amber-900 font-black text-sm uppercase tracking-widest">
                                                    {activeMaterial.isIndexed === 'generating' ? 'AI analyserer dokumentet...' : 'Læser indhold...'}
                                                </p>
                                                <p className="text-amber-700/60 text-xs font-medium italic">
                                                    {activeMaterial.isIndexed === 'generating' ? 'Cohéro danner overblik og pointer' : 'Cohéro udtrækker tekst fra PDF\'en (Dette kan tage op til 30 sek.)'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 p-12 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center text-center space-y-6">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
                                            </div>
                                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Venter på start... ({String(activeMaterial.isIndexed)})</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

      {/* GLOBAL CHAT MODAL */}
      <AnimatePresence>
        {isGlobalChatOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsGlobalChatOpen(false)}
                    className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[90]"
                />
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] flex"
                >
                    {/* Sidebar / History */}
                    <AnimatePresence>
                        {showChatHistory && (
                            <motion.div 
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 280, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                className="border-r border-slate-100 bg-slate-50 flex flex-col shrink-0 overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 bg-white">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <History className="w-4 h-4 text-indigo-500" />
                                        Tidligere chats
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {chatThreads.map(t => (
                                        <button 
                                            key={t.id} 
                                            onClick={() => {
                                                setActiveThreadId(t.id);
                                                setGlobalChatMessages(t.messages);
                                                if (window.innerWidth < 768) setShowChatHistory(false);
                                            }}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                                activeThreadId === t.id 
                                                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-sm' 
                                                : 'bg-white border-transparent text-slate-600 hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                        >
                                            <p className="text-sm font-bold truncate mb-1">{t.title}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">
                                                {new Date(t.updatedAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </button>
                                    ))}
                                    {chatThreads.length === 0 && (
                                        <p className="text-xs font-medium text-slate-400 text-center py-10">Ingen tidligere chats endnu.</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col h-full bg-[#F8F9FA] relative">
                        <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white z-10 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 text-white shrink-0">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Vidensarkiv Chat</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">Søg på tværs af {filteredMaterials.length} dokumenter</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowChatHistory(!showChatHistory)}
                                    className={`p-3 border rounded-xl transition-all shadow-sm flex items-center gap-2 ${showChatHistory ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50'}`}
                                    title="Vis historik"
                                >
                                    <History className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => {
                                        setActiveThreadId(null);
                                        setGlobalChatMessages([]);
                                        if (window.innerWidth < 768) setShowChatHistory(false);
                                    }}
                                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                                    title="Ny chat"
                                >
                                    <MessageSquarePlus className="w-5 h-5" />
                                </button>
                                <div className="w-px h-8 bg-slate-200 mx-1" />
                                <button 
                                    onClick={() => setIsGlobalChatOpen(false)}
                                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 rounded-xl transition-all shadow-sm"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                        {globalChatMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                <div className="w-20 h-20 bg-indigo-100 text-indigo-300 rounded-[2rem] flex items-center justify-center">
                                    <Brain className="w-10 h-10" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">Stil et spørgsmål til dit samlede arkiv.</p>
                            </div>
                        )}
                        {globalChatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-5 rounded-[1.5rem] shadow-sm ${
                                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                                }`}>
                                    <div className={msg.role === 'user' ? 'text-white font-bold text-sm leading-relaxed [&_*]:text-white' : 'prose prose-sm max-w-none prose-p:leading-relaxed font-medium'}
                                         dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                </div>
                            </div>
                        ))}
                        {isGlobalChatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-5 rounded-[1.5rem] rounded-tl-sm text-slate-500 flex items-center gap-3 shadow-sm">
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                    <span className="text-xs font-black uppercase tracking-widest">Gennemsøger arkivet...</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-6 border-t border-slate-100 bg-white">
                        <form onSubmit={handleGlobalChatSubmit} className="flex gap-3">
                            <input 
                                type="text"
                                value={globalChatInput}
                                onChange={e => setGlobalChatInput(e.target.value)}
                                placeholder="Stil et spørgsmål om dit pensum..."
                                className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all"
                            />
                            <Button 
                                type="submit" 
                                disabled={isGlobalChatLoading || !globalChatInput.trim()}
                                className="h-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 active:scale-95 transition-all"
                            >
                                Send
                            </Button>
                        </form>
                    </div>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
