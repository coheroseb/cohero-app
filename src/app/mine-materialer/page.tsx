'use client';

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
  Crown,
  Lock,
  Info,
  CheckCircle2,
  Brain,
  Quote,
  AlertTriangle,
  Library,
  History,
  MessageSquarePlus,
  Hash,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Edit2,
  Maximize,
  Heart,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  analyzeCasePdfAction, 
  unifiedChatAction, 
  analyzeSyllabusAction, 
  saveMaterialTextAction, 
  generateMaterialAIOverviewAction, 
  materialVectorChatAction, 
  indexMaterialAction, 
  migrateMaterialsAction, 
  generateMaterialMindmapAction,
  searchLiteratureAction
} from '@/app/actions';
import { extractText } from 'unpdf';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
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
  isIndexed?: boolean | 'error' | 'pending' | 'success' | 'generating' | 'true' | 'processing' | 'loading' | 'indexing' | 'failed';
  rawText?: string;
  aiOverviewData?: any; // Changed from string to any
  overviewGeneratedAt?: any;
  tags?: string[];
  suggestedQuestions?: string[];
  vectorIndexed?: boolean;
}

interface SemesterPlan {
  id: string;
  title: string;
  semesterInfo: string;
  weeklyBreakdown: { weekNumber: number; events: any[] }[];
}

export default function MineMaterialerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /></div>}>
        <MineMaterialerContent />
    </Suspense>
  );
}

// Deterministic gradients for book cards
const getGradient = (title: string) => {
  const gradients = [
    'from-rose-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-blue-600 to-indigo-600',
    'from-violet-600 to-purple-600',
    'from-amber-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
};

function MineMaterialerContent() {
  const { user, userProfile, isUserLoading } = useApp();
  const hasProAccess = userProfile?.membership === 'Kollega+' || userProfile?.membership === 'Semesterpakken' || userProfile?.role === 'admin';
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [materials, setMaterials] = useState<Material[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [studyMode, setStudyMode] = useState<{ active: boolean, materialId: string | null, page: number }>({ active: false, materialId: null, page: 1 });
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(userProfile?.semester || '1');
  
  useEffect(() => {
    if (userProfile?.semester && !isUserLoading) {
        setSelectedSemesterId(userProfile.semester);
    }
  }, [userProfile?.semester, isUserLoading]);

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
    
    const semester = searchParams?.get('semesterId') || userProfile?.semester;
    const userInst = (userProfile?.institution || '').toLowerCase().trim();
    const normalize = (s: string) => s.toLowerCase().replace(/professionshøjskolen\s+/gs, '').replace(/university college\s+/gs, '').trim();
    const normalizedUserInst = normalize(userInst);
    
    const instMatch = curriculumsRaw.find((c: any) => normalize(c.institution || '').includes(normalizedUserInst) || normalizedUserInst.includes(normalize(c.institution || '')));
    return instMatch || curriculumsRaw[0];
  }, [curriculumsRaw, userProfile?.institution, userProfile?.customCurriculum]);

  const activeModule = useMemo(() => {
    if (!curriculum) return null;
    const semNum = parseInt(selectedSemesterId.match(/\d+/)?.[0] ?? '1');
    return curriculum.modules.find((m: any) => 
      (m.semester === semNum) || 
      m.id === selectedSemesterId ||
      m.name?.toLowerCase().includes(selectedSemesterId.toLowerCase())
    );
  }, [curriculum, selectedSemesterId]);

  const currentDisplayName = activeModule?.name || (isNaN(parseInt(selectedSemesterId)) ? selectedSemesterId : `${selectedSemesterId}. semester`);
  const isKollegaPlus = hasProAccess;
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  
  const [localOverview, setLocalOverview] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [chatState, setChatState] = useState<{ goal: string, text: string, loading: boolean } | null>(null);
  
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalChatMessages, setGlobalChatMessages] = useState<{ id: string, role: 'user' | 'assistant', text: string }[]>([]);
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  
  const [chatThreads, setChatThreads] = useState<{ id: string, title: string, messages: any[], updatedAt: number }[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  
  const [suggestedAnswers, setSuggestedAnswers] = useState<Record<string, string>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  const [showSyllabus, setShowSyllabus] = useState(false);
  
  const [selectedGoalInsight, setSelectedGoalInsight] = useState<{ goal: string, insight: string } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [selectedGoalLiterature, setSelectedGoalLiterature] = useState<any[] | null>(null);
  const [isGoalLiteratureLoading, setIsGoalLiteratureLoading] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const { setIsNavbarHidden } = useApp();

  useEffect(() => {
    if (selectedGoalInsight) {
      setIsNavbarHidden(true);
    } else {
      setIsNavbarHidden(false);
    }
    return () => setIsNavbarHidden(false);
  }, [selectedGoalInsight, setIsNavbarHidden]);

  const learningGoalMapping = useMemo(() => {
    if (!activeModule?.learningGoals || materials.length === 0) return [];
    
    return activeModule.learningGoals.map((goal: string) => {
        const coveringMaterials = materials.filter(m => {
            if (!m.aiOverviewData) return false;
            try {
                const data = JSON.parse(m.aiOverviewData);
                return data.learningGoals?.some((lg: any) => 
                    lg.goal.toLowerCase().includes(goal.toLowerCase()) || 
                    goal.toLowerCase().includes(lg.goal.toLowerCase())
                );
            } catch (e) { return false; }
        });
        
        return {
            goal,
            coveredBy: coveringMaterials,
            status: coveringMaterials.length > 0 ? 'Dækket' : 'Mangler',
            count: coveringMaterials.length
        };
    });
  }, [activeModule?.learningGoals, materials]);

  const totalCoverage = useMemo(() => {
    if (learningGoalMapping.length === 0) return 0;
    const covered = learningGoalMapping.filter(m => m.count > 0).length;
    return Math.round((covered / learningGoalMapping.length) * 100);
  }, [learningGoalMapping]);

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
            const response = await materialVectorChatAction({
                userId: user.uid,
                message: userMessage,
                chatHistory: globalChatMessages.map(m => ({ role: m.role, content: m.text }))
            });
            answer = response?.answer || "Kunne ikke generere et svar.";
        } else {
            const contextText = filteredMaterials
                .filter(m => m.rawText)
                .map(m => `--- DOKUMENT: ${m.name} ---\n${m.rawText?.substring(0, 8000)}`)
                .join('\n\n');

            const prompt = `Du har adgang til følgende dokumenter fra brugerens vidensarkiv:\n\n${contextText}\n\nBesvar brugerens spørgsmål baseret på ovenstående dokumenter. Skriv i et naturligt, menneskeligt og dialogbaseret sprog frem for at lyde som en robot. Vær gerne uformel, men faglig. Hvis svaret ikke findes heri, så brug din generelle faglige viden, men gør opmærksom på det. BRUG KUN HTML-tags (<b>, <ul>, <li>) til formatering, BRUG ALDRIG markdown asterisker (**). Start dit svar direkte uden nogen form for hilsen (ingen "Kære studerende", "Hej" eller lignende).`;

            const response = await unifiedChatAction({
                message: userMessage,
                chatHistory: globalChatMessages.map(m => ({ role: m.role, content: m.text })),
                persona: 'kollega', // Changed from 'academic' to 'kollega'
                context: { relevantDocumentIds: [], lawContext: prompt }
            });
            answer = response?.data?.answer || "Kunne ikke generere et svar.";
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

  const parseCitations = (html: string, materialId?: string) => {
    if (!html) return html;
    return html.replace(/(\(S\.\s*(\d+)\)|\[S\.\s*(\d+)\])/gi, (match, full, p1, p2) => {
        const page = p1 || p2;
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md font-bold text-[10px] ml-1 border border-slate-100">
            S. ${page}
        </span>`;
    });
  };

  useEffect(() => {
    (window as any).openAtPage = (materialId: string, page: number) => {
        setStudyMode({ active: true, materialId: materialId || selectedMaterial?.id || null, page });
    };
  }, [selectedMaterial]);

  const handleGenerateGoalInsight = async (goal: string, count: number) => {
    if (!user) return;
    
    setSelectedGoalInsight({ goal, insight: '' });
    setSelectedGoalLiterature(null);
    setCopiedCitation(null);
    setIsGoalLiteratureLoading(true);

    const literaturePromise = searchLiteratureAction(goal, 3)
      .then(res => {
        setSelectedGoalLiterature(res?.results || []);
      })
      .catch(error => {
        console.error("Failed to fetch literature for goal:", error);
        setSelectedGoalLiterature([]);
      })
      .finally(() => {
        setIsGoalLiteratureLoading(false);
      });

    if (count > 0) {
      setIsInsightLoading(true);
      try {
          const prompt = `Du er en ekspert-vejleder. Brugeren ønsker en dybdegående analyse af deres pensum ift. læringsmålet: "${goal}".
          
  DIN OPGAVE:
  1. OVERBLIK: Forklar kort og præcist hvad dette mål kræver af den studerende.
  2. NØGLEPUNKTER: Opsummér de 3 vigtigste koncepter fundet i kilderne.
  3. BEVISER & CITATER: Find 2-3 direkte citater eller specifikke referencer fra deres dokumenter, der forklarer dette mål bedst.
  4. TJEK DIN VIDEN (ACTIVE RECALL): Opstil 2 udfordrende spørgsmål, som den studerende bør kunne besvare for at have mestret dette mål.
  
  FORMATERING:
  - Brug <h4> til overskrifter.
  - Brug <b> til vigtige begreber.
  - Brug <blockquote> til citater (hvis muligt, ellers bare kursiv/indrykning med margin).
  - Brug <ul> og <li> til lister.
  - Brug KUN HTML-tags. Ingen markdown asterisker.
  
  Sørg for at svaret føles akademisk tungt men pædagogisk let tilgængeligt.`;
  
          const res = await materialVectorChatAction({
              userId: user.uid,
              message: prompt,
          });
          
          if (res.answer) {
              setSelectedGoalInsight({ goal, insight: res.answer });
          }
      } catch (e) {
          console.error("Goal insight failed:", e);
          toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke generere indsigt for dette mål." });
          setSelectedGoalInsight(null);
      } finally {
          setIsInsightLoading(false);
      }
    } else {
      setIsInsightLoading(false);
      await literaturePromise;
    }
  };

  const handleCopyCitation = (citation: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(citation);
    setCopiedCitation(citation);
    setTimeout(() => {
        setCopiedCitation(null);
    }, 2000);
  };

  const handleAskAboutGoal = async (goal: string, rawText?: string) => {
    if (!user) return;
    try {
        const textToAnalyze = rawText ? rawText.substring(0, 15000) : "Ingen tekst fundet i dokumentet.";
        const prompt = `Du er en akademisk mentor. Forklar præcist, pædagogisk og i et naturligt, menneskeligt sprog, hvordan dokumentet bidrager til at opfylde følgende læringsmål: "${goal}".\nBrug konkrete eksempler fra teksten. Sørg for ikke at lyde maskinel. BRUG KUN HTML-tags (<b>, <ul>, <li>) til formatering, BRUG ALDRIG markdown asterisker (**). Start dit svar direkte uden nogen form for indledende hilsen (ingen "Kære studerende", "Hej" eller lignende).\n\nMateriale-uddrag:\n${textToAnalyze}`;
        
        const response = await unifiedChatAction({
            message: prompt,
            chatHistory: [],
            persona: 'kollega', // Changed from 'academic' to 'kollega'
            context: { relevantDocumentIds: [], lawContext: '' }
        });
        
        const answer = response?.data?.answer || "Kunne ikke generere et svar.";
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
    
    if (localOverview[material.id]) {
      const parsed = typeof localOverview[material.id] === 'string' ? JSON.parse(localOverview[material.id]) : localOverview[material.id];
      return { ...material, aiOverviewData: parsed };
    }
    
    // Ensure aiOverviewData is parsed if it's a string
    if (typeof material.aiOverviewData === 'string') {
        try {
            return { ...material, aiOverviewData: JSON.parse(material.aiOverviewData) };
        } catch (e) {
            console.error("Failed to parse aiOverviewData", e);
        }
    }

    return material;
  }, [materials, selectedMaterial, localOverview]);

  useEffect(() => {
    if (!user || !firestore || !userProfile) return;
    
    const q = query(
      collection(firestore, 'users', user.uid, 'materials'),
      where('semester', '==', selectedSemesterId)
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
  }, [user, firestore, userProfile, selectedSemesterId]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    materials.forEach(m => m.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(m => !selectedTag || m.tags?.includes(selectedTag))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [materials, searchQuery, selectedTag]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user || !storage || !firestore || !userProfile || !isKollegaPlus) return;
    
    setIsUploading(true);
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const fileId = Math.random().toString(36).substring(7);
      const storageRef = ref(storage, `users/${user.uid}/materials/${selectedSemesterId}/${fileId}_${file.name}`);
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
          
          const materialRef = await addDoc(collection(firestore, 'users', user.uid, 'materials'), {
            name: file.name,
            type: file.type,
            size: file.size,
            url: downloadURL,
            semester: selectedSemesterId,
            semesterName: currentDisplayName,
            institution: currentInstitution,
            profession: currentProfession,
            storagePath: storageRef.fullPath,
            isIndexed: false,
            createdAt: serverTimestamp()
          });

          try {
            console.log(`[MineMaterialer] Extracting text from ${file.name}...`);
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
            
            console.log(`[MineMaterialer] Starting AI overview generation in background for ${file.name}...`);
            generateMaterialAIOverviewAction({
              userId: user.uid,
              materialId: materialRef.id,
              rawText: rawText.trim(),
              candidateLearningGoals: activeModule?.learningGoals || [] 
            }).catch(e => console.error("Auto-AI generation failed:", e));

            await updateDoc(refDoc, { 
                isIndexed: true,
                rawText: rawText.trim()
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

  const handleMigrateArchive = async () => {
    if (!user || isMigrating) return;
    
    const shouldForce = window.confirm("Vil du køre en fuld optimering af alle dokumenter? (Dette opdaterer også dine tags og smarte spørgsmål)");
    
    setIsMigrating(true);
    toast({ title: "Opdaterer arkiv...", description: "AI'en gennemgår nu dine dokumenter for at optimere søgning og indsigt." });
    
    try {
        const res = await migrateMaterialsAction({ userId: user.uid, force: shouldForce });
        if (res.processed !== undefined) {
            toast({ title: "Arkiv opdateret!", description: `Færdig med at optimere ${res.processed} dokumenter.` });
        }
    } catch (e) {
        console.error("Migration fejlede:", e);
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke opdatere arkivet." });
    } finally {
        setIsMigrating(false);
    }
  };

  const handleRescanMaterial = async (e: React.MouseEvent, material: Material) => {
    e.stopPropagation();
    if (!user || !material.rawText) return;
    
    toast({ title: "Gen-indlæser...", description: `AI'en gen-analyserer ${material.name}.` });
    try {
        await indexMaterialAction({
            userId: user.uid,
            materialId: material.id,
            rawText: material.rawText
        });
        toast({ title: "Fuldført", description: "Tags og søgning er nu opdateret." });
    } catch (e) {
        console.error("Rescan failed:", e);
    }
  };

  const handleRenameMaterial = async (e: React.MouseEvent, materialId: string, newName: string) => {
    e.stopPropagation();
    if (!newName.trim() || !user) return;
    
    try {
        await updateDoc(doc(firestore!, 'users', user.uid, 'materials', materialId), {
            name: newName.trim()
        });
        setRenamingId(null);
        toast({ title: "Omdøbt", description: "Materialet har nu fået nyt navn." });
    } catch (e) {
        console.error("Rename failed:", e);
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke omdøbe materialet." });
    }
  };

  const handleSuggestedQuestionClick = async (question: string, material: Material) => {
    if (!user || loadingQuestion) return;
    
    if (suggestedAnswers[`${material.id}_${question}`]) return;

    setLoadingQuestion(`${material.id}_${question}`);
    try {
        const res = await materialVectorChatAction({
            userId: user.uid,
            message: question,
            materialId: material.id,
            chatHistory: []
        });
        
        if (res.answer) {
            setSuggestedAnswers(prev => ({
                ...prev,
                [`${material.id}_${question}`]: res.answer
            }));
        }
    } catch (e) {
        console.error("Suggested question failed:", e);
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke hente svar på spørgsmålet." });
    } finally {
        setLoadingQuestion(null);
    }
  };

  const handleOpenMindmap = (materialId?: string) => {
    console.log("Opening mindmap for:", materialId || 'all');
    if (materialId) {
        router.push(`/mine-materialer/mindmap?materialId=${materialId}`);
    } else {
        router.push('/mine-materialer/mindmap');
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

  const currentGoalMapping = selectedGoalInsight 
    ? learningGoalMapping.find(m => m.goal === selectedGoalInsight.goal)
    : null;
  const hasMaterialsForGoal = currentGoalMapping ? currentGoalMapping.count > 0 : false;

  if (isUserLoading || userProfile === undefined || (userProfile && isLoading)) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col selection:bg-indigo-100 font-sans">
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

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 relative z-10">
        <div className="grid lg:grid-cols-[380px,1fr] gap-8 sm:gap-12 items-start">
          
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
                      <div className="flex flex-col gap-1">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Semester / Modul</p>
                       <select 
                        value={selectedSemesterId}
                        onChange={(e) => setSelectedSemesterId(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer hover:text-indigo-600 transition-colors max-w-full"
                       >
                          {curriculum?.modules?.map((m: any) => (
                            <option key={m.id || m.semester} value={m.id || m.semester.toString()}>
                                {m.name || `${m.semester}. semester`}
                            </option>
                          ))}
                          {/* Fallback if current semester is not in list */}
                          {!curriculum?.modules?.some((m: any) => (m.id || m.semester.toString()) === selectedSemesterId) && (
                            <option value={selectedSemesterId}>{currentDisplayName}</option>
                          )}
                       </select>
                      </div>
                   </div>
                </div>
              </div>
            </section>

            {activeModule?.learningGoals && activeModule.learningGoals.length > 0 && (
                <section className="bg-slate-950 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                        <GraduationCap className="w-48 h-48" />
                    </div>
                    
                    <div className="relative z-10 space-y-6 mb-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Brain className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="text-sm font-black tracking-tight">Pensum-mapping</h3>
                            </div>
                            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-center gap-4 shadow-inner">
                                <div className="relative w-12 h-12">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                                        <circle 
                                            cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="6" fill="transparent" 
                                            strokeDasharray={125.6} 
                                            strokeDashoffset={125.6 - (125.6 * totalCoverage / 100)}
                                            className="text-indigo-500 transition-all duration-1000 ease-out"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-[10px] font-black">{totalCoverage}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Dækning</p>
                                    <p className="text-[10px] font-bold text-white">
                                        {learningGoalMapping.filter(m => m.count > 0).length}/{learningGoalMapping.length} mål
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                        {learningGoalMapping.map((m, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => handleGenerateGoalInsight(m.goal, m.count)}
                                className="w-full p-4 rounded-2xl transition-all group/goal border text-left flex items-start gap-3 bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 cursor-pointer"
                            >
                                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black shadow-sm ${
                                    m.count > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800/80 text-slate-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-bold leading-tight line-clamp-2 transition-all ${
                                        m.count > 0 ? 'text-slate-100 group-hover/goal:text-white' : 'text-slate-400 group-hover/goal:text-slate-200'
                                    }`}>
                                        {m.goal}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${
                                            m.count > 0 ? 'text-emerald-400' : 'text-slate-500'
                                        }`}>
                                            {m.count > 0 ? `${m.count} kilder` : 'mangler kilder'}
                                        </span>
                                        <ArrowRight className="w-2.5 h-2.5 text-indigo-400 opacity-0 group-hover/goal:opacity-100 translate-x-[-4px] group-hover/goal:translate-x-0 transition-all" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}
          </aside>

          <div className="space-y-10">
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
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-4 inline-block max-w-2xl break-words px-4">
                             Automatisk tilknytning: {currentDisplayName}
                          </span>
                        </p>
                      </div>
                   </label>
                 </>
               )}
            </section>

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
                  
                  <Button 
                    onClick={handleMigrateArchive}
                    disabled={isMigrating || materials.length === 0}
                    variant="outline"
                    className="h-10 px-4 rounded-xl border-indigo-100 text-indigo-600 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-2"
                  >
                    {isMigrating ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Optimerer...</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-3 h-3" />
                            <span>Optimer Arkiv</span>
                        </>
                    )}
                  </Button>

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
                      
                      <div className="flex items-center gap-3">
                        <Link href={`/mine-materialer/mindmap?semesterId=${selectedSemesterId}`}>
                            <Button 
                                className="h-14 px-6 bg-white border border-indigo-100 text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100/20 flex items-center gap-2 shrink-0 transition-all hover:scale-105 active:scale-95"
                            >
                                <Layout className="w-4 h-4" />
                                <span className="hidden sm:inline">Vis Mindmap</span>
                            </Button>
                        </Link>

                        <Button 
                            onClick={() => setIsGlobalChatOpen(true)}
                            className="h-14 px-6 sm:px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 flex items-center gap-2 shrink-0 transition-all hover:scale-105 active:scale-95"
                        >
                            <Brain className="w-4 h-4" />
                            <span className="hidden sm:inline">Chat med arkiv</span>
                        </Button>
                      </div>
                    </div>
              </div>

              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-slate-50">
                            <button 
                                onClick={() => setSelectedTag(null)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                                    !selectedTag ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-100 hover:text-indigo-600'
                                }`}
                            >
                                Alle Materialer
                            </button>
                            {(isTagsExpanded ? allTags : allTags.slice(0, 10)).map(tag => (
                                <button 
                                    key={tag}
                                    onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${
                                        selectedTag === tag ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100 hover:border-indigo-100 hover:text-indigo-600'
                                    }`}
                                >
                                    <Hash className="w-3 h-3" />
                                    {tag}
                                </button>
                            ))}
                            {allTags.length > 10 && (
                                <button 
                                    onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                                    className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600 flex items-center gap-2"
                                >
                                    {isTagsExpanded ? 'Vis færre' : `Se flere (+${allTags.length - 10})`}
                                </button>
                            )}
                        </div>
                    )}

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
                                {renamingId === material.id ? (
                                    <div className="flex items-center gap-2 flex-grow" onClick={e => e.stopPropagation()}>
                                        <input 
                                            autoFocus
                                            type="text"
                                            value={renamingValue}
                                            onChange={e => setRenamingValue(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') handleRenameMaterial(e as any, material.id, renamingValue);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            className="px-3 py-1 bg-slate-50 border border-indigo-200 rounded-lg text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 flex-grow"
                                        />
                                        <Button 
                                            size="sm" 
                                            className="h-8 w-8 p-0 bg-indigo-600 rounded-lg"
                                            onClick={(e) => handleRenameMaterial(e, material.id, renamingValue)}
                                        >
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-slate-400 rounded-lg"
                                            onClick={() => setRenamingId(null)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <h4 className="text-base font-black text-slate-950 break-all leading-snug">{material.name}</h4>
                                )}
                                {material.isIndexed === false ? (
                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 animate-pulse">
                                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Læser indhold...</span>
                                    </div>
                                ) : (material.isIndexed === 'generating' || material.isIndexed === 'processing' || material.isIndexed === 'loading' || material.isIndexed === 'indexing') ? (
                                    <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 animate-pulse shadow-sm shadow-indigo-100/50">
                                        <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Analyserer...</span>
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
                              
                              {material.tags && material.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-4">
                                      {material.tags.slice(0, 3).map((tag, idx) => (
                                          <span key={idx} className="px-3 py-1 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] rounded-lg border border-slate-100/50">
                                              {tag}
                                          </span>
                                      ))}
                                      {material.tags.length > 3 && (
                                          <span className="px-2 py-1 bg-slate-50 text-[9px] font-black text-slate-300 uppercase rounded-lg border border-dashed border-slate-100">
                                              +{material.tags.length - 3}
                                          </span>
                                      )}
                                  </div>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                           <button 
                             onClick={(e) => {
                                 e.stopPropagation();
                                 setRenamingId(material.id);
                                 setRenamingValue(material.name);
                             }}
                             className="p-4 bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-2xl transition-all shadow-sm"
                             title="Omdøb"
                           >
                              <Edit2 className="w-5 h-5" />
                           </button>
                           {(!material.tags || material.tags.length === 0) && material.isIndexed === true && (
                               <button 
                                 onClick={(e) => handleRescanMaterial(e, material)}
                                 className="p-4 bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-2xl transition-all shadow-sm"
                                 title="Gen-analyser for tags"
                               >
                                  <Sparkles className="w-5 h-5" />
                               </button>
                           )}
                           <a 
                             href={material.url} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             onClick={(e) => e.stopPropagation()}
                             className="p-4 bg-white text-slate-400 hover:text-indigo-600 border border-slate-100 hover:border-indigo-100 rounded-2xl transition-all shadow-sm"
                           >
                              <ExternalLink className="w-5 h-5" />
                           </a>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material); }}
                             className="p-4 bg-white text-slate-400 hover:text-rose-600 border border-slate-100 hover:border-rose-100 rounded-2xl transition-all shadow-sm"
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

      <AnimatePresence>
        {activeMaterial && (
            <>
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
                                <Link href={`/mine-materialer/mindmap?materialId=${activeMaterial.id}`}>
                                    <Button 
                                        variant="outline" 
                                        className="rounded-2xl border-indigo-100 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 font-black uppercase tracking-widest text-[10px] h-12 px-8 flex items-center gap-2"
                                    >
                                        <Layout className="w-4 h-4" />
                                        <span>Mindmap</span>
                                    </Button>
                                </Link>
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
                                                    <div className="space-y-12">
                                                        {activeMaterial.tags && activeMaterial.tags.length > 0 && (
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <Hash className="w-3 h-3 text-amber-500" />
                                                                    Emner & Tags
                                                                </h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {activeMaterial.tags.map((tag: string, idx: number) => (
                                                                        <span key={idx} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-bold text-slate-600 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all cursor-default">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-6">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                    <Sparkles className="w-3 h-3 text-indigo-500" />
                                                                    Smarte spørgsmål
                                                                </h4>
                                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">Vector Powered</span>
                                                            </div>
                                                            
                                                            {/* Entities (Concepts, Theories, etc.) - NEW */}
                                                            {activeMaterial.aiOverviewData?.entities && activeMaterial.aiOverviewData.entities.length > 0 && (
                                                                <div className="flex flex-wrap gap-3 mb-8">
                                                                    {activeMaterial.aiOverviewData.entities.map((entity: any, idx: number) => (
                                                                        <button 
                                                                            key={idx}
                                                                            onClick={() => entity.pageNumber && setStudyMode({ active: true, materialId: activeMaterial.id, page: entity.pageNumber })}
                                                                            className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all group/entity"
                                                                        >
                                                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                                                                entity.type === 'theory' ? 'bg-amber-50 text-amber-600' :
                                                                                entity.type === 'concept' ? 'bg-indigo-50 text-indigo-600' :
                                                                                'bg-slate-50 text-slate-600'
                                                                            }`}>
                                                                                {entity.type === 'theory' ? <BookOpen className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <p className="text-[11px] font-black text-slate-900 group-hover/entity:text-indigo-600 transition-colors">{entity.name}</p>
                                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                                                    {entity.type} {entity.pageNumber ? `• Side ${entity.pageNumber}` : ''}
                                                                                </p>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                             )}

                                                            <div className="grid grid-cols-1 gap-4">
                                                                {(activeMaterial.suggestedQuestions || [
                                                                    "Hvad er de vigtigste pointer i dette dokument?",
                                                                    "Er der specifik lovgivning nævnt her?",
                                                                    "Hvordan kan jeg bruge dette i min eksamen?"
                                                                ]).map((q: string, idx: number) => {
                                                                    const answer = suggestedAnswers[`${activeMaterial.id}_${q}`];
                                                                    const isLoading = loadingQuestion === `${activeMaterial.id}_${q}`;
                                                                    
                                                                    return (
                                                                        <div key={idx} className="space-y-3">
                                                                            <button 
                                                                                disabled={isLoading}
                                                                                onClick={() => handleSuggestedQuestionClick(q, activeMaterial)}
                                                                                className={`w-full group text-left p-5 bg-white border rounded-[2rem] transition-all relative overflow-hidden active:scale-[0.98] ${
                                                                                    isLoading ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-100 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/20'
                                                                                }`}
                                                                            >
                                                                                <div className="absolute right-0 top-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                                                                                    <MessageSquare className="w-12 h-12" />
                                                                                </div>
                                                                                <div className="flex items-center gap-4 relative z-10">
                                                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-colors ${
                                                                                        isLoading ? 'bg-indigo-600 text-white' : 'bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white'
                                                                                    }`}>
                                                                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : idx + 1}
                                                                                    </div>
                                                                                    <p className="text-sm font-bold text-slate-700 group-hover:text-slate-950 transition-colors flex-1">
                                                                                        {q}
                                                                                    </p>
                                                                                    {!answer && <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />}
                                                                                </div>
                                                                            </button>
                                                                            
                                                                            <AnimatePresence>
                                                                                {answer && (
                                                                                    <motion.div 
                                                                                        initial={{ opacity: 0, y: -10, height: 0 }}
                                                                                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                                                                                        className="overflow-hidden"
                                                                                    >
                                                                                        <div className="p-6 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/50 text-sm text-slate-700 leading-relaxed space-y-3">
                                                                                            <div className="flex items-center gap-2 mb-2">
                                                                                                <Brain className="w-3.5 h-3.5 text-indigo-500" />
                                                                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Svar</span>
                                                                                            </div>
                                                                                            <div 
                                                                                                dangerouslySetInnerHTML={{ __html: parseCitations(answer, activeMaterial.id) }}
                                                                                                className="prose prose-slate prose-sm max-w-none"
                                                                                            />
                                                                                        </div>
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="p-8 bg-indigo-50/50 border border-indigo-100/50 rounded-[2.5rem] flex items-start gap-4">
                                                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                                <Zap className="w-5 h-5 text-indigo-600" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">Klar til Vector Chat</h5>
                                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                                                    Dette dokument er fuldt indekseret. Du kan nu stille komplekse spørgsmål til det i chatten nedenfor.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
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
                                                    {activeMaterial.isIndexed === 'generating' ? 'Cohéro analyserer og skaber indsigt...' : 'Cohéro udtrækker tekst fra PDF\'en (Dette kan tage op til 30 sek.)'}
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
                                         dangerouslySetInnerHTML={{ __html: parseCitations(msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')) }} />
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
                                id="vector-chat-input"
                                value={globalChatInput}
                                onChange={(e) => setGlobalChatInput(e.target.value)}
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

      {/* GOAL INSIGHT OVERLAY */}
      <AnimatePresence>
          {selectedGoalInsight && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-start justify-center p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto pt-16 pb-20"
                  onClick={() => setSelectedGoalInsight(null)}
              >
                  <motion.div 
                      initial={{ scale: 0.95, y: 40 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 40 }}
                      onClick={e => e.stopPropagation()}
                      className="bg-white rounded-[3.5rem] w-full max-w-6xl shadow-2xl relative overflow-hidden my-10"
                  >
                      <div className="p-10 md:p-16 space-y-12">
                          <div className="flex items-start justify-between gap-10">
                              <div className="space-y-6 flex-1">
                                  <div className="flex items-center gap-4">
                                      <span className="px-5 py-2 bg-indigo-50 text-[11px] font-black text-indigo-600 uppercase tracking-[0.25em] rounded-full">Læringsmål Indsigt</span>
                                      <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                          <Brain className="w-5 h-5 text-indigo-600" />
                                      </div>
                                  </div>
                                  <h3 className="text-3xl md:text-5xl font-[900] text-slate-950 tracking-tighter leading-[1.05]">
                                      {selectedGoalInsight.goal}
                                  </h3>
                              </div>
                              <button 
                                  onClick={() => setSelectedGoalInsight(null)}
                                  className="w-14 h-14 bg-slate-100 text-slate-400 hover:text-slate-900 rounded-[1.5rem] flex items-center justify-center transition-all hover:rotate-90 shrink-0 shadow-sm"
                              >
                                  <X className="w-8 h-8" />
                              </button>
                          </div>

                          {!hasMaterialsForGoal && (
                              <div className="p-8 md:p-10 rounded-[2.5rem] bg-indigo-50/50 border border-indigo-100/80 flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm">
                                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shrink-0 shadow-md">
                                      <Upload className="w-8 h-8 text-indigo-600 animate-bounce" />
                                  </div>
                                  <div className="space-y-2 text-center md:text-left flex-1">
                                      <h4 className="text-lg font-black text-slate-900">Ingen studiematerialer fundet</h4>
                                      <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                          Du har endnu ikke uploadet egne noter eller slides om dette mål. Upload filer til dit semester for at få en personlig AI-analyse af dit materiale.
                                      </p>
                                  </div>
                              </div>
                          )}

                          {hasMaterialsForGoal && (
                              <div className="bg-slate-50/50 p-10 md:p-14 rounded-[3.5rem] border border-slate-100 relative shadow-inner">
                                  {isInsightLoading ? (
                                      <div className="py-32 text-center space-y-8">
                                          <div className="relative">
                                              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto" />
                                              <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full scale-150" />
                                          </div>
                                          <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">AI genererer din personlige analyse...</p>
                                      </div>
                                  ) : (
                                      <div 
                                          dangerouslySetInnerHTML={{ __html: parseCitations(selectedGoalInsight.insight) }}
                                          className="prose prose-slate prose-xl max-w-none w-full text-slate-600 leading-[1.6] font-medium space-y-10 
                                                     prose-b:text-slate-950 prose-b:font-black
                                                     prose-ul:space-y-4 prose-li:pl-2
                                                     prose-h4:text-2xl prose-h4:font-black prose-h4:text-slate-950 prose-h4:tracking-tight
                                                     prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/50 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic"
                                      />
                                  )}
                              </div>
                          )}

                          {/* Foreslået Litteratur fra Bogbasen */}
                          <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                      <Library className="w-4 h-4" />
                                      Foreslået Litteratur fra Bogbasen
                                  </h4>
                                  <Link 
                                      href={`/pensum-search?q=${encodeURIComponent(selectedGoalInsight.goal)}`}
                                      className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 transition-all hover:translate-x-1"
                                  >
                                      Søg mere i bogbasen <ArrowRight className="w-3 h-3" />
                                  </Link>
                              </div>

                              {!hasProAccess ? (
                                  <div className="p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-center relative overflow-hidden flex flex-col items-center justify-center">
                                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <Crown className="w-8 h-8 text-indigo-600" />
                                      </div>
                                      <h4 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Eksklusivt for Kollega+</h4>
                                      <p className="text-sm text-slate-500 mb-6 font-medium max-w-sm">Få serveret konkrete litteraturforslag til dine læringsmål med sidetal og APA-referencer.</p>
                                      <Link href="/upgrade">
                                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-black uppercase tracking-widest text-[11px] h-12 shadow-lg shadow-indigo-100 transition-all hover:scale-105 active:scale-95">
                                              Opgrader Nu <ArrowRight className="w-3.5 h-3.5 ml-2" />
                                          </Button>
                                      </Link>
                                  </div>
                              ) : isGoalLiteratureLoading ? (
                                  <div className="py-12 text-center space-y-4">
                                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Finder relevante bøger og kapitler...</p>
                                  </div>
                              ) : (
                                  <div className="grid md:grid-cols-3 gap-6">
                                      {!selectedGoalLiterature || selectedGoalLiterature.length === 0 ? (
                                          <p className="col-span-3 text-sm text-slate-400 italic text-center py-6">
                                              Ingen matchende litteratur fundet i bogbasen.
                                          </p>
                                      ) : (
                                          selectedGoalLiterature.slice(0, 3).map((book: any, bIdx: number) => (
                                              <div 
                                                  key={bIdx} 
                                                  className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6 hover:-translate-y-0.5 group relative"
                                              >
                                                  <div className="space-y-4">
                                                      <div className="flex gap-4 items-start">
                                                          {/* Miniature Spine Cover */}
                                                          <div className={`w-12 h-16 bg-gradient-to-br ${getGradient(book.bookTitle)} rounded-xl shadow-md shrink-0 flex items-end p-2 transition-transform group-hover:scale-105`}>
                                                              <BookOpen className="w-4 h-4 text-white/50" />
                                                          </div>
                                                          <div className="min-w-0 space-y-1">
                                                              <h5 className="text-sm font-black text-slate-950 leading-snug line-clamp-2" title={book.bookTitle}>
                                                                  {book.bookTitle}
                                                              </h5>
                                                              <p className="text-[11px] text-slate-400 font-bold truncate">
                                                                  {book.bookAuthor} {book.bookYear ? `(${book.bookYear})` : ''}
                                                              </p>
                                                          </div>
                                                      </div>

                                                      {/* Matching Chapters */}
                                                      {book.matchingChapters && book.matchingChapters.length > 0 && (
                                                          <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Relevante kapitler</p>
                                                              <div className="space-y-1.5">
                                                                  {book.matchingChapters.map((chap: any, cIdx: number) => (
                                                                      <div key={cIdx} className="flex justify-between text-[11px] text-slate-600 font-semibold gap-2 leading-tight">
                                                                          <span className="line-clamp-1">· {chap.title}</span>
                                                                          {chap.pageNumber && <span className="shrink-0 text-slate-400 text-[10px]">S. {chap.pageNumber}</span>}
                                                                      </div>
                                                                  ))}
                                                              </div>
                                                          </div>
                                                      )}
                                                  </div>

                                                  {/* Copy Reference */}
                                                  {book.apaCitation && (
                                                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                                                          <span 
                                                              className="text-[10px] text-slate-400 font-medium italic truncate flex-1" 
                                                              title={book.apaCitation}
                                                          >
                                                              {book.apaCitation}
                                                          </span>
                                                          <button
                                                              onClick={(e) => handleCopyCitation(book.apaCitation, e)}
                                                              className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm shrink-0 flex items-center justify-center active:scale-95"
                                                              title="Kopier reference"
                                                          >
                                                              {copiedCitation === book.apaCitation ? (
                                                                  <Check className="w-4 h-4 text-emerald-600" />
                                                              ) : (
                                                                  <Copy className="w-4 h-4" />
                                                              )}
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                          ))
                                      )}
                                  </div>
                              )}
                          </div>

                          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pt-6 border-t border-slate-100">
                              <div className="flex items-center gap-4">
                                  {hasMaterialsForGoal ? (
                                      <>
                                          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                                              <Sparkles className="w-6 h-6 text-amber-500" />
                                          </div>
                                          <div>
                                              <p className="text-slate-950 font-black text-sm">Udnytter Vector-kontekst</p>
                                              <p className="text-slate-400 text-xs font-bold italic">Analyse baseret på dine egne kilder.</p>
                                          </div>
                                      </>
                                  ) : (
                                      <>
                                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                              <Library className="w-6 h-6 text-indigo-500" />
                                          </div>
                                          <div>
                                              <p className="text-slate-950 font-black text-sm">Viser Bogbase-forslag</p>
                                              <p className="text-slate-400 text-xs font-bold italic">Litteraturforslag baseret på dit holds pensum.</p>
                                          </div>
                                      </>
                                  )}
                              </div>
                              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                                  <Button 
                                      onClick={() => setSelectedGoalInsight(null)}
                                      variant="ghost"
                                      className="flex-1 lg:flex-none rounded-2xl px-10 h-16 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-950"
                                  >
                                      Luk
                                  </Button>
                                  {hasMaterialsForGoal && (
                                      <>
                                          <Button 
                                              onClick={() => {
                                                  setGlobalChatInput(`Lav en hurtig quiz til mig om dette mål baseret på mit pensum: ${selectedGoalInsight.goal}. Stil mig 3 spørgsmål ét af gangen.`);
                                                  setIsGlobalChatOpen(true);
                                                  setSelectedGoalInsight(null);
                                              }}
                                              className="flex-1 lg:flex-none bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-[1.5rem] px-10 h-16 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                                          >
                                              <CheckCircle2 className="w-5 h-5" />
                                              <span>Tjek min viden</span>
                                          </Button>
                                          <Button 
                                              onClick={() => {
                                                  setGlobalChatInput(`Jeg vil gerne gå i dybden med dette mål: ${selectedGoalInsight.goal}. Forklar de sværeste dele ud fra mit materiale.`);
                                                  setIsGlobalChatOpen(true);
                                                  setSelectedGoalInsight(null);
                                              }}
                                              className="flex-1 lg:flex-none bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] px-10 h-16 font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-4"
                                          >
                                              <MessageSquare className="w-5 h-5" />
                                              <span>Uddyb i chatten</span>
                                          </Button>
                                      </>
                                  )}
                              </div>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      {/* STUDY MODE MODAL (PDF VIEWER) */}
      <AnimatePresence>
        {studyMode.active && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200]"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="fixed inset-4 sm:inset-10 bg-white rounded-[3rem] shadow-2xl z-[201] overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 tracking-tight">Studie-flow: {materials.find(m => m.id === studyMode.materialId)?.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Side {studyMode.page}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button 
                                onClick={() => setStudyMode(prev => ({ ...prev, active: false }))}
                                className="h-10 px-6 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Luk Studie-flow
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-100 relative">
                        <iframe 
                            src={`${materials.find(m => m.id === studyMode.materialId)?.url}#page=${studyMode.page}`}
                            className="w-full h-full border-none"
                            title="PDF Viewer"
                        />
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
      
    </div>
  );
}
