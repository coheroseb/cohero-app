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
  Copy,
  FolderOpen,
  Eye,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { 
  unifiedChatAction, 
  saveMaterialTextAction, 
  generateMaterialAIOverviewAction, 
  materialVectorChatAction, 
  migrateMaterialsAction
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
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
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
  aiOverviewData?: any;
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
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><Loader2 className="w-12 h-12 text-indigo-600 animate-spin" /></div>}>
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
  const hasProAccess = userProfile?.membership === 'Cohéro Student' || 
                       userProfile?.membership === 'Semesterpakken' || 
                       userProfile?.membership === 'Kollega+' || 
                       userProfile?.role === 'admin';
  const isKollegaPlus = hasProAccess;

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
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'pdf' | 'notes'>('all');
  const [studyMode, setStudyMode] = useState<{ active: boolean, materialId: string | null, page: number }>({ active: false, materialId: null, page: 1 });
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(userProfile?.semester || '1');
  
  useEffect(() => {
    if (userProfile?.semester && !isUserLoading) {
        setSelectedSemesterId(userProfile.semester);
    }
  }, [userProfile?.semester, isUserLoading]);

  const currentInstitution = userProfile?.institution || 'Ikke angivet';
  const currentProfession = userProfile?.profession || 'Socialrådgiver';

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
    const semNum = parseInt(selectedSemesterId.match(/\d+/)?.[0] ?? '1');
    return curriculum.modules?.find((m: any) => 
      (m.semester === semNum) || 
      m.id === selectedSemesterId ||
      m.name?.toLowerCase().includes(selectedSemesterId.toLowerCase())
    );
  }, [curriculum, selectedSemesterId]);

  const currentDisplayName = activeModule?.name || (isNaN(parseInt(selectedSemesterId)) ? selectedSemesterId : `${selectedSemesterId}. semester`);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [localOverview, setLocalOverview] = useState<Record<string, string>>({});
  
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [globalChatMessages, setGlobalChatMessages] = useState<{ id: string, role: 'user' | 'assistant', text: string }[]>([]);
  const [globalChatInput, setGlobalChatInput] = useState('');
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  
  const [suggestedAnswers, setSuggestedAnswers] = useState<Record<string, string>>({});
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);
  
  const [selectedGoalInsight, setSelectedGoalInsight] = useState<{ goal: string, insight: string } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [selectedGoalLiterature, setSelectedGoalLiterature] = useState<any[] | null>(null);
  const [isGoalLiteratureLoading, setIsGoalLiteratureLoading] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

  const learningGoalMapping = useMemo(() => {
    if (!activeModule?.learningGoals || materials.length === 0) return [];
    
    return activeModule.learningGoals.map((goal: string) => {
        const coveringMaterials = materials.filter(m => {
            if (!m.aiOverviewData) return false;
            try {
                const data = typeof m.aiOverviewData === 'string' ? JSON.parse(m.aiOverviewData) : m.aiOverviewData;
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

  const handleGlobalChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalChatInput.trim() || isGlobalChatLoading) return;
    
    const userMessage = globalChatInput;
    setGlobalChatInput('');
    
    const newMsg = { id: Date.now().toString(), role: 'user' as const, text: userMessage };
    setGlobalChatMessages(prev => [...prev, newMsg]);
    setIsGlobalChatLoading(true);

    try {
        const hasVectorIndexed = materials.some(m => m.vectorIndexed || m.isIndexed === true);
        
        let answer = "Kunne ikke generere et svar.";
        
        if (hasVectorIndexed && user) {
            const response = await materialVectorChatAction({
                userId: user.uid,
                message: userMessage,
                chatHistory: globalChatMessages.map(m => ({ role: m.role, content: m.text }))
            });
            answer = response?.answer || "Kunne ikke generere et svar.";
        } else {
            const contextText = materials
                .filter(m => m.rawText)
                .map(m => `--- DOKUMENT: ${m.name} ---\n${m.rawText?.substring(0, 8000)}`)
                .join('\n\n');

            const prompt = `Du har adgang til følgende dokumenter fra brugerens vidensarkiv:\n\n${contextText}\n\nBesvar brugerens spørgsmål baseret på ovenstående dokumenter. Skriv i et naturligt, menneskeligt og dialogbaseret sprog. Vær fagligt præcis og pædagogisk. Hvis svaret ikke findes heri, så brug din faglige viden forankret i gældende pensum.`;

            const response = await unifiedChatAction({
                message: userMessage,
                chatHistory: globalChatMessages.map(m => ({ role: m.role, content: m.text })),
                persona: 'kollega',
                context: { relevantDocumentIds: [], lawContext: prompt }
            });
            answer = response?.data?.answer || (response as any)?.answer || "Kunne ikke generere et svar.";
        }
        const botMsg = { id: Date.now().toString(), role: 'assistant' as const, text: answer };
        
        setGlobalChatMessages(prev => {
            const newMsgs = [...prev, botMsg];
            return newMsgs;
        });
    } catch (error) {
        console.error("Global chat error:", error);
        toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke kontakte AI serveren.' });
    } finally {
        setIsGlobalChatLoading(false);
    }
  };

  const parseCitations = (html: string, materialId?: string) => {
    if (!html) return html;
    return html.replace(/(\(S\.\s*(\d+)\)|\[S\.\s*(\d+)\])/gi, (match, full, p1, p2) => {
        const page = p1 || p2;
        return `<span class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold text-[10px] ml-1 border border-indigo-100">
            S. ${page}
        </span>`;
    });
  };

  const handleGenerateGoalInsight = async (goal: string, count: number) => {
    if (!user) return;
    
    setSelectedGoalInsight({ goal, insight: '' });
    setSelectedGoalLiterature(null);
    setIsGoalLiteratureLoading(true);

    if (count > 0) {
      setIsInsightLoading(true);
      try {
          const prompt = `Du er en erfaren akademisk vejleder for Cohéro Student.
Den studerende ønsker en dybdegående analyse af deres pensum ift. læringsmålet: "${goal}".
          
DIN OPGAVE:
1. OVERBLIK: Forklar kort og præcist hvad dette læringsmål kræver.
2. NØGLEPUNKTER: Opsummér de 3 vigtigste koncepter fundet i kilderne.
3. PRAKSISRELEVANS: Giv konkrete eksempler og referencer til socialt arbejde / pensum.
4. TJEK DIN VIDEN (ACTIVE RECALL): Opstil 2 gode eksamensrelevante spørgsmål til målet.`;
  
          const res = await materialVectorChatAction({
              userId: user.uid,
              message: prompt,
          });
          
          if (res.answer) {
              setSelectedGoalInsight({ goal, insight: res.answer });
          }
      } catch (e) {
          toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke generere indsigt." });
      } finally {
          setIsInsightLoading(false);
          setIsGoalLiteratureLoading(false);
      }
    } else {
        setIsGoalLiteratureLoading(false);
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
      .filter(m => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.tags?.some(t => t.toLowerCase().includes(q));
      })
      .filter(m => {
        if (selectedTypeFilter === 'pdf') return m.type.includes('pdf');
        if (selectedTypeFilter === 'notes') return !m.type.includes('pdf');
        return true;
      })
      .filter(m => !selectedTag || m.tags?.includes(selectedTag))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
  }, [materials, searchQuery, selectedTypeFilter, selectedTag]);

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
          toast({ variant: 'destructive', title: 'Upload fejlede', description: `Kunne ikke uploade ${file.name}` });
          setIsUploading(false);
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
            const refDoc = doc(firestore, 'users', user.uid, 'materials', materialRef.id);
            await updateDoc(refDoc, { isIndexed: 'processing' });

            const arrayBuffer = await file.arrayBuffer();
            const result = await extractText(new Uint8Array(arrayBuffer));
            
            let rawText = '';
            if (typeof result.text === 'string') rawText = result.text;
            else if (Array.isArray(result.text)) rawText = result.text.join('\n\n');
            
            if (!rawText.trim()) {
                rawText = "Dette dokument ser ud til at være scannet (billedbaseret), da ingen tekst kunne udtrækkes automatisk.";
            }

            await saveMaterialTextAction({
              userId: user.uid,
              materialId: materialRef.id,
              rawText: rawText.trim()
            });
            
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
          if (Object.keys(uploadProgress).length <= 1) setIsUploading(false);
        }
      );
    }
  };

  const handleMigrateArchive = async () => {
    if (!user || isMigrating) return;
    setIsMigrating(true);
    toast({ title: "Opdaterer arkiv...", description: "AI'en gennemgår nu dine dokumenter for at optimere søgning og indsigt." });
    
    try {
        const res = await migrateMaterialsAction({ userId: user.uid, force: true });
        if (res.processed !== undefined) {
            toast({ title: "Arkiv opdateret!", description: `Færdig med at optimere ${res.processed} dokumenter.` });
        }
    } catch (e) {
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke opdatere arkivet." });
    } finally {
        setIsMigrating(false);
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
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke omdøbe materialet." });
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
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke slette materialet.' });
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
        toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke hente svar på spørgsmålet." });
    } finally {
        setLoadingQuestion(null);
    }
  };

  if (isUserLoading || userProfile === undefined || (userProfile && isLoading)) {
    return <AuthLoadingScreen />;
  }

  const pdfCount = materials.filter(m => m.type.includes('pdf')).length;
  const notesCount = materials.length - pdfCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-32">
      
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 sticky top-0 z-30">
        <PageHeader
          title="Mit Pensum & Noter"
          subtitle="Dit personlige vidensarkiv. Upload pensum, artikler og noter, og lad AI strukturere og søge i din viden."
          icon={<FileBox className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-1.5 shadow-sm">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <select 
                    value={selectedSemesterId}
                    onChange={(e) => setSelectedSemesterId(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                  >
                    {curriculum?.modules?.map((m: any) => (
                      <option key={m.id || m.semester} value={m.id || m.semester.toString()}>
                          {m.name || `${m.semester}. semester`}
                      </option>
                    ))}
                    {!curriculum?.modules?.some((m: any) => (m.id || m.semester.toString()) === selectedSemesterId) && (
                      <option value={selectedSemesterId}>{currentDisplayName}</option>
                    )}
                  </select>
               </div>

               <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sikkert Arkiv</span>
               </div>
            </div>
          }
        />
      </div>

      <main className="grow max-w-7xl mx-auto w-full px-4 sm:px-6 pt-8 relative z-10">
        
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden group">
              {!isKollegaPlus ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Crown className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900">Ubegrænset Vidensarkiv med Cohéro Student</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Upload dit pensum, søg på tværs af dokumenter med AI, og få fuld pensum-mapping til dit semester.
                    </p>
                  </div>
                  <Link href="/upgrade">
                    <Button className="h-11 px-6 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md">
                      Opgrader til Semesterpakken
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
                        className="absolute inset-0 bg-white/95 backdrop-blur-md z-40 flex flex-col items-center justify-center p-8 text-center"
                      >
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <h3 className="text-lg font-black text-slate-900 mb-1">Læser og indekserer pensum...</h3>
                        <p className="text-slate-500 text-xs mb-6 font-medium">Cohéro analyserer dit materiale med AI</p>
                        <div className="w-full max-w-md space-y-3">
                          {Object.entries(uploadProgress).map(([name, progress]) => (
                            <div key={name} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <span className="truncate max-w-[220px]">{name}</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-indigo-600 to-blue-600"
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

                  <label className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 group/drop">
                    <input 
                      type="file" 
                      multiple 
                      className="hidden" 
                      onChange={(e) => handleUpload(e.target.files)}
                      disabled={isUploading}
                    />
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover/drop:scale-110 group-hover/drop:bg-indigo-600 group-hover/drop:text-white transition-all shadow-sm">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900">
                      Træk filer hertil, eller <span className="text-indigo-600 underline">klik for at vælge</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Understøtter PDF, Word, PowerPoint og Noter
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>Automatisk tilknyttet: <b>{currentDisplayName}</b></span>
                    </div>
                  </label>
                </>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-sm">
                    <Library className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-950">Dit Vidensarkiv</h3>
                    <p className="text-xs font-bold text-slate-400">
                      {filteredMaterials.length} {filteredMaterials.length === 1 ? 'dokument' : 'dokumenter'} tilknyttet
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
                  <button
                    onClick={() => setSelectedTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Alle ({materials.length})
                  </button>
                  <button
                    onClick={() => setSelectedTypeFilter('pdf')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedTypeFilter === 'pdf' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    PDF ({pdfCount})
                  </button>
                  <button
                    onClick={() => setSelectedTypeFilter('notes')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedTypeFilter === 'notes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Noter ({notesCount})
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Søg efter titel, forfatter, emne eller indhold..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button 
                      onClick={() => setSelectedTag(null)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all ${
                        !selectedTag ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Alle emner
                    </button>
                    {(isTagsExpanded ? allTags : allTags.slice(0, 8)).map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 ${
                          selectedTag === tag ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Hash className="w-2.5 h-2.5 opacity-60" />
                        {tag}
                      </button>
                    ))}
                    {allTags.length > 8 && (
                      <button 
                        onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        {isTagsExpanded ? 'Vis færre' : `+${allTags.length - 8} flere`}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <AnimatePresence mode="popLayout">
                  {filteredMaterials.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <FileBox className="w-10 h-10 text-slate-300 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-700">Ingen materialer fundet</p>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {searchQuery ? 'Ingen dokumenter matchede din søgning.' : 'Du har endnu ikke uploadet filer til dette semester. Træk filer op i feltet ovenfor.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredMaterials.map((material, idx) => (
                      <motion.div
                        key={material.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSelectedMaterial(material)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer ${
                          selectedMaterial?.id === material.id 
                            ? 'bg-indigo-50/40 border-indigo-400 shadow-md ring-2 ring-indigo-500/10' 
                            : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                            material.type.includes('pdf') ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            material.type.includes('word') ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
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
                                    className="px-2.5 py-1 bg-white border border-indigo-400 rounded-lg text-xs font-bold text-slate-900 outline-none"
                                  />
                                  <button onClick={(e) => handleRenameMaterial(e, material.id, renamingValue)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setRenamingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                  {material.name}
                                </h4>
                              )}

                              {material.isIndexed === true || material.isIndexed === 'success' || material.isIndexed === 'true' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black uppercase tracking-wider">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Indhold klar
                                </span>
                              ) : material.isIndexed === 'processing' || material.isIndexed === 'generating' || material.isIndexed === 'loading' || material.isIndexed === 'indexing' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  AI analyserer
                                </span>
                              ) : material.isIndexed === 'error' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-black uppercase tracking-wider">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                                  Fejl
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black uppercase tracking-wider">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-500" />
                                  Læser
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                              <span>{(material.size / 1024 / 1024).toFixed(1)} MB</span>
                              <span>&bull;</span>
                              <span>{material.createdAt?.toDate?.().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) || 'Nyligt tilføjet'}</span>
                            </div>

                            {material.tags && material.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {material.tags.slice(0, 3).map((tag, tIdx) => (
                                  <span key={tIdx} className="px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded-md text-[9px] font-bold text-slate-600">
                                    {tag}
                                  </span>
                                ))}
                                {material.tags.length > 3 && (
                                  <span className="px-1.5 py-0.5 bg-slate-50 text-[9px] font-bold text-slate-400 rounded-md">
                                    +{material.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMaterial(material);
                            }}
                            className="h-9 px-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                            title="Se AI-overblik & Noter"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">AI Overblik</span>
                          </button>

                          <Link
                            href={`/mine-materialer/mindmap?materialId=${material.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 w-9 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all border border-slate-200/80 shadow-sm"
                            title="Vis Mindmap"
                          >
                            <Layout className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingId(material.id);
                              setRenamingValue(material.name);
                            }}
                            className="h-9 w-9 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center transition-all border border-slate-200/80 shadow-sm"
                            title="Omdøb fil"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMaterial(material);
                            }}
                            className="h-9 w-9 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all border border-slate-200/80 shadow-sm"
                            title="Slet materiale"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-indigo-950/10 border border-slate-800 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-2xl flex items-center justify-center border border-indigo-400/20">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Søjle 3: Organisering</span>
                  <h3 className="text-lg font-black text-white">AI Vidensværktøjer</h3>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => setIsGlobalChatOpen(true)}
                  disabled={materials.length === 0}
                  className="w-full p-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-left flex items-center justify-between transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-xs font-black text-white">Chat med dit arkiv</p>
                      <p className="text-[10px] text-slate-300">Stil spørgsmål på tværs af alt dit pensum</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <Link
                  href={`/mine-materialer/mindmap?semesterId=${selectedSemesterId}`}
                  className={`block w-full p-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-left transition-all group ${
                    materials.length === 0 ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layout className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-xs font-black text-white">Interaktivt Mindmap</p>
                        <p className="text-[10px] text-slate-300">Visualiser emner og pensum-relationer</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                <button
                  onClick={handleMigrateArchive}
                  disabled={isMigrating || materials.length === 0}
                  className="w-full p-3.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-left flex items-center justify-between transition-all text-xs font-bold text-slate-300 hover:text-white disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    {isMigrating ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                    <span>{isMigrating ? 'Optimerer arkiv...' : 'Optimer AI-tags & søgning'}</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400">Re-scan</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Pensum-mapping</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Læringsmål for semestret</p>
                  </div>
                </div>

                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                  {totalCoverage}% Dækket
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 transition-all duration-500 rounded-full"
                    style={{ width: `${totalCoverage}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400 text-right">
                  {learningGoalMapping.filter(m => m.count > 0).length} af {learningGoalMapping.length} mål dækket
                </p>
              </div>

              {learningGoalMapping.length > 0 ? (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {learningGoalMapping.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleGenerateGoalInsight(m.goal, m.count)}
                      className="w-full p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 rounded-2xl text-left transition-all group flex items-start gap-2.5"
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5 ${
                        m.count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 leading-snug line-clamp-2">
                          {m.goal}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${
                            m.count > 0 ? 'text-emerald-600' : 'text-slate-400'
                          }`}>
                            {m.count > 0 ? `${m.count} kilder fundet` : 'Mangler litteratur'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-center space-y-1">
                  <p className="text-xs font-bold text-slate-600">Ingen læringsmål indlæst</p>
                  <p className="text-[10px] text-slate-400">Vælg dit semester foroven for at se pensum-mapping.</p>
                </div>
              )}
            </div>
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[100] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-slate-900 truncate">{activeMaterial.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{currentDisplayName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={activeMaterial.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-9 px-3 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Original</span>
                  </a>
                  <button 
                    onClick={() => setSelectedMaterial(null)}
                    className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">AI-Indekseret & Søgebart</p>
                    <p className="text-[11px] text-emerald-700 font-medium">Teksten er udtrukket og klar til analyse og chat.</p>
                  </div>
                </div>

                {activeMaterial.tags && activeMaterial.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Hash className="w-3 h-3 text-indigo-500" />
                      Emner & Nøgleord
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeMaterial.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Smarte Spørgsmål til Dokumentet
                    </h4>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">AI Vector</span>
                  </div>

                  <div className="space-y-2.5">
                    {(activeMaterial.suggestedQuestions || [
                      "Hvad er de vigtigste faglige pointer i dette dokument?",
                      "Er der specifik lovgivning eller paragraffer nævnt her?",
                      "Hvordan kan jeg anvende denne tekst til min eksamen?"
                    ]).map((q: string, qIdx: number) => {
                      const answer = suggestedAnswers[`${activeMaterial.id}_${q}`];
                      const isLoading = loadingQuestion === `${activeMaterial.id}_${q}`;
                      
                      return (
                        <div key={qIdx} className="space-y-2">
                          <button 
                            disabled={isLoading}
                            onClick={() => handleSuggestedQuestionClick(q, activeMaterial)}
                            className="w-full p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 rounded-2xl text-left transition-all group flex items-center justify-between gap-3 text-xs font-bold text-slate-800"
                          >
                            <span className="flex-1">{q}</span>
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
                            )}
                          </button>

                          <AnimatePresence>
                            {answer && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-sm text-xs text-slate-700 leading-relaxed"
                              >
                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-2">
                                  <Brain className="w-3.5 h-3.5" /> Svar fra dokumentet
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: parseCitations(answer, activeMaterial.id) }} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Layout className="w-6 h-6 text-indigo-600 shrink-0" />
                    <div>
                      <h5 className="text-xs font-black text-slate-900">Se Dokument Mindmap</h5>
                      <p className="text-[11px] text-slate-500 font-medium">Udforsk sammenhænge og teoretiske begreber visuelt</p>
                    </div>
                  </div>
                  <Link href={`/mine-materialer/mindmap?materialId=${activeMaterial.id}`}>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">
                      Åbn
                    </Button>
                  </Link>
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
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[100] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Chat med Vidensarkivet</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Søger på tværs af {materials.length} uploadede dokumenter
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsGlobalChatOpen(false)}
                  className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {globalChatMessages.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                      <Brain className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-800">Hvad vil du vide om dit pensum?</p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Stil spørgsmål til begreber, lovhjemmel eller cases på tværs af alle dine uploadede tekster.
                      </p>
                    </div>
                  </div>
                ) : (
                  globalChatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-slate-900 text-white font-bold rounded-tr-sm shadow-md' 
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-sm font-medium'
                      }`}>
                        <div dangerouslySetInnerHTML={{ __html: parseCitations(msg.text.replace(/\n/g, '<br/>')) }} />
                      </div>
                    </div>
                  ))
                )}

                {isGlobalChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2.5 text-xs font-bold text-slate-500 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Gennemsøger arkivet...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleGlobalChatSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    value={globalChatInput}
                    onChange={(e) => setGlobalChatInput(e.target.value)}
                    placeholder="Stil et spørgsmål til dit pensum..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                  <Button 
                    type="submit" 
                    disabled={isGlobalChatLoading || !globalChatInput.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 text-xs font-black uppercase tracking-wider"
                  >
                    Send
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGoalInsight && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedGoalInsight(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto"
            >
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50 shrink-0">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase tracking-wider">
                    Læringsmål Indsigt
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                    {selectedGoalInsight.goal}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedGoalInsight(null)}
                  className="w-9 h-9 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-colors shadow-sm shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                {isInsightLoading ? (
                  <div className="py-20 text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      AI analyserer pensum ift. læringsmålet...
                    </p>
                  </div>
                ) : selectedGoalInsight.insight ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: parseCitations(selectedGoalInsight.insight) }}
                    className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed space-y-4"
                  />
                ) : (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-700">Ingen egne noter fundet for dette mål</p>
                    <p className="text-xs text-slate-500">Upload relevante kapitler eller noter for at få en dybdegående AI-analyse.</p>
                  </div>
                )}

                {/* Suggested Literature */}
                {selectedGoalLiterature && selectedGoalLiterature.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Library className="w-4 h-4 text-indigo-600" />
                      Foreslået Litteratur fra Bogbasen
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {selectedGoalLiterature.slice(0, 3).map((book: any, bIdx: number) => (
                        <div key={bIdx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                          <p className="text-xs font-bold text-slate-900 line-clamp-2">{book.bookTitle || book.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{book.bookAuthor || book.author}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

