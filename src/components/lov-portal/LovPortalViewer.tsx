
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { 
    getLawContentAction, 
    analyzeParagraphAction,
    semanticLawSearchAction 
} from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

// New Modular Components
import { LawSidebar } from './LawSidebar';
import { LawSearchHeader } from './LawSearchHeader';
import { LawDashboard } from './LawDashboard';
import { LawContent } from './LawContent';
import { LawContextSidebar } from './LawContextSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import LawQuizModal from './LawQuizModal';
import ReadingGuideModal from './ReadingGuideModal';

// Types
import type { LawContentType, ParagraphAnalysisData, CollectionData, SavedParagraph, QuizResult, LawConfig } from '@/ai/flows/types';

export function LovPortalViewer() {
  const { user, userProfile } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const { toast } = useToast();
  const firestore = useFirestore();

  // --- CORE STATE ---
  const [lawsConfigs, setLawsConfigs] = useState<LawConfig[]>([]);
  const [lawsLoading, setLawsLoading] = useState(true);
  const [docsData, setDocsData] = useState<Record<string, LawContentType>>({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [viewMode, setViewMode] = useState<'laws' | 'decisions' | 'saved' | 'training' | 'reforms'>('laws');
  const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [semanticSearchQuery, setSemanticSearchQuery] = useState('');
  const [isSearchingSemantic, setIsSearchingSemantic] = useState(false);
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeParagraphNumber, setActiveParagraphNumber] = useState<string | null>(null);
  const [expandedParaKey, setExpandedParaKey] = useState<string | null>(null);
  const [selectedSubElement, setSelectedSubElement] = useState<string | null>(null);
  const [selectedParentStk, setSelectedParentStk] = useState<string | null>(null);
  const [selectedParentNr, setSelectedParentNr] = useState<string | null>(null);
  const [paraAnalysis, setParaAnalysis] = useState<Record<string, ParagraphAnalysisData>>({});
  const [isAnalysingPara, setIsAnalysingPara] = useState<Record<string, boolean>>({});
  const [semanticResult, setSemanticResult] = useState<any | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isReadingGuideOpen, setIsReadingGuideOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);

  const mainScrollRef = useRef<HTMLElement>(null);
  const activeLawId = useMemo(() => params?.lawId as string || searchParams?.get('lawId'), [params, searchParams]);
  const activeReferenceId = useMemo(() => searchParams?.get('refId')?.toString(), [searchParams]);
  const currentDocId = activeReferenceId || activeLawId;
  const currentDocData = currentDocId ? docsData[currentDocId] : null;
  const isPremium = useMemo(() => !!userProfile?.membership && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership), [userProfile]);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'laws'), orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
        setLawsConfigs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LawConfig[]);
        setLawsLoading(false);
    });
  }, [firestore]);

  const loadDocumentContent = useCallback(async (lawId: string, docIdentifier: string, forceXmlUrl?: string) => {
    if (docsData[docIdentifier]) return;
    const config = (lawsConfigs || []).find(l => l.id === lawId);
    const xmlUrl = forceXmlUrl || config?.xmlUrl;
    if (!xmlUrl) return;
    setIsLoadingDoc(true);
    try {
        const result = await getLawContentAction({ 
            documentId: docIdentifier, xmlUrl,
            name: config?.name || 'Dokument', abbreviation: config?.abbreviation || 'DOK', lbk: config?.lbk || ''
        });
        if (result?.data) setDocsData(prev => ({ ...prev, [docIdentifier]: result.data }));
    } finally { setIsSearchingSemantic(false); setIsLoadingDoc(false); }
  }, [lawsConfigs, docsData]);

  useEffect(() => {
    if (lawsLoading) return;
    if (activeReferenceId) {
        const forceXmlUrl = searchParams?.get('xmlUrl');
        if (forceXmlUrl) loadDocumentContent('reference', activeReferenceId, forceXmlUrl);
    } else if (activeLawId) {
        loadDocumentContent(activeLawId, activeLawId);
    }
  }, [activeLawId, activeReferenceId, lawsLoading, searchParams, loadDocumentContent]);

  // Firestore Collections & Saved Paras
  const quizResultsQuery = useMemoFirebase(() => (user && firestore ? query(collection(firestore, 'users', user.uid, 'quizResults'), orderBy('createdAt', 'desc')) : null), [user, firestore]);
  const { data: quizResults } = useCollection<QuizResult>(quizResultsQuery);
  const savedParagraphsQuery = useMemoFirebase(() => (user && firestore ? query(collection(firestore, 'users', user.uid, 'savedParagraphs'), orderBy('savedAt', 'desc')) : null), [user, firestore]);
  const { data: savedParagraphs = [] } = useCollection<SavedParagraph>(savedParagraphsQuery);

  const trainingStats = useMemo(() => {
      if (!quizResults || quizResults.length === 0) return null;
      const totalCorrect = quizResults.reduce((acc, r) => acc + (r.score || 0), 0);
      const totalQuestions = quizResults.reduce((acc, r) => acc + (r.totalQuestions || 5), 0);
      const mastery = Object.entries(quizResults.reduce((acc: any, r) => {
          const lId = r.lawId || 'unknown';
          if (!acc[lId]) acc[lId] = { score: 0, questions: 0 };
          acc[lId].score += (r.score || 0); acc[lId].questions += (r.totalQuestions || 5);
          return acc;
      }, {})).map(([id, stats]: any) => ({ id, accuracy: Math.round((stats.score / stats.questions) * 100) }));
      return { avgAccuracy: Math.round((totalCorrect / totalQuestions) * 100), mastery };
  }, [quizResults]);

  // --- HANDLERS ---
  const handleToggleSave = async (para: any) => {
    if (!user || !isPremium) return;
    const savedId = `${currentDocId}-${para.nummer.replace(/[§\s\.]/g, '-')}`;
    const docRef = doc(firestore!, 'users', user.uid, 'savedParagraphs', savedId);
    if (savedParagraphs.some(p => p.id === savedId)) {
        await deleteDoc(docRef); toast({ title: "Fjernet fra gemte" });
    } else {
         await setDoc(docRef, { 
             paragraphNumber: para.nummer, fullText: para.tekst, 
             lawId: currentDocId, lawTitle: currentDocData?.titel, lawAbbreviation: currentDocData?.forkortelse, 
             savedAt: serverTimestamp() 
         });
         toast({ title: "Gemt i bibliotek" });
    }
  };

  const handleAnalyzeParagraph = async (para: any, paraKey: string) => {
    if (!isPremium || !currentDocData) return;
    setIsAnalysingPara(prev => ({ ...prev, [paraKey]: true }));
    try {
        const response = await analyzeParagraphAction({ 
            lovTitel: currentDocData.titel, paragrafNummer: para.nummer, paragrafTekst: para.tekst, 
            fuldLovtekst: currentDocData.rawText || '', uniqueDocumentId: currentDocData.uniqueDocumentId || ''
        });
        setParaAnalysis(prev => ({ ...prev, [paraKey]: response.data }));
    } finally { setIsAnalysingPara(prev => ({ ...prev, [paraKey]: false })); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = isPremium ? semanticSearchQuery : searchQuery;
    if (!query.trim() || isSearchingSemantic || activeLawId) return;
    setIsSearchingSemantic(true); setSemanticResult(null); setViewMode('laws');
    try {
        const result = await semanticLawSearchAction(query);
        setSemanticResult(result.data);
    } finally { setIsSearchingSemantic(false); }
  };

  const scrollToChapter = (idx: number) => {
    const element = document.getElementById(`chapter-${idx}`);
    if (mainScrollRef.current && element) {
        const top = element.getBoundingClientRect().top + mainScrollRef.current.scrollTop - 100;
        mainScrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-900 font-sans selection:bg-amber-100 overflow-x-hidden">
      
      <LawSidebar 
        viewMode={viewMode} setViewMode={setViewMode} activeLawId={activeLawId} 
        lawsConfigs={lawsConfigs} isPremium={isPremium} user={user} userProfile={userProfile}
        onLawClick={(id) => { setViewMode('laws'); router.push(`/lov-portal/view/${id}`); }}
        onDashboardClick={() => { setViewMode('laws'); router.push('/lov-portal'); }}
      />

      <main ref={mainScrollRef} className="flex-1 min-w-0 h-screen overflow-y-auto relative pt-0 custom-scrollbar pb-32 lg:pb-0">
        <LawSearchHeader 
           handleSearch={handleSearch} isSemanticMode={true} activeLawId={activeLawId} activeReferenceId={activeReferenceId}
           currentDocData={currentDocData} lawsConfigs={lawsConfigs} searchQuery={searchQuery} setSearchQuery={setSearchQuery}
           semanticSearchQuery={semanticSearchQuery} setSemanticSearchQuery={setSemanticSearchQuery}
           isSearchingSemantic={isSearchingSemantic} isSearchFocused={isSearchFocused} setIsSearchFocused={setIsSearchFocused}
           filteredSuggestions={[]} onSuggestionClick={() => {}}
           setIsReadingGuideOpen={setIsReadingGuideOpen} isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode}
           setIsQuizModalOpen={setIsQuizModalOpen} isContextSidebarOpen={isContextSidebarOpen} setIsContextSidebarOpen={setIsContextSidebarOpen}
        />

        <div className={`p-4 md:p-12 mx-auto pt-8 md:pt-12 transition-all duration-700 ${isFocusMode ? 'max-w-4xl pt-24' : (activeLawId ? 'max-w-full' : 'max-w-7xl')}`}>
            <AnimatePresence mode="wait">
                {activeLawId && currentDocData ? (
                   <div className="flex gap-12">
                      <div className="flex-1 min-w-0">
                         <LawContent 
                            docData={currentDocData} lawId={activeLawId}
                            expandedParaKey={expandedParaKey} setExpandedParaKey={setExpandedParaKey}
                            activeParagraphNumber={activeParagraphNumber} setActiveParagraphNumber={setActiveParagraphNumber}
                            isAnalysingPara={isAnalysingPara} paraAnalysis={paraAnalysis}
                            onAnalyze={handleAnalyzeParagraph} onToggleSave={handleToggleSave}
                            isSaved={(id) => savedParagraphs.some(p => p.id === id)}
                            onCopy={(text, id) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }}
                            copiedId={copiedId} isPremium={isPremium}
                            onSubElementClick={(sub, stk, nr) => { setSelectedSubElement(sub); setSelectedParentStk(stk); setSelectedParentNr(nr); }}
                            selectedSubElement={selectedSubElement} onMouseUp={() => {}}
                         />
                      </div>
                      {isContextSidebarOpen && !isFocusMode && (
                         <LawContextSidebar 
                            docData={currentDocData} onChapterClick={scrollToChapter} 
                            activeParagraphNumber={activeParagraphNumber}
                         />
                      )}
                   </div>
                ) : (
                   <LawDashboard 
                      lawsConfigs={lawsConfigs} isPremium={isPremium} trainingStats={trainingStats}
                      lawsLoading={lawsLoading} onLawClick={(id) => router.push(`/lov-portal/view/${id}`)}
                   />
                )}
            </AnimatePresence>
        </div>
      </main>

      <LawQuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} lawId={activeLawId || ''} lawTitle={currentDocData?.titel || ''} />
      <ReadingGuideModal isOpen={isReadingGuideOpen} onClose={() => setIsReadingGuideOpen(false)} />
    </div>
  );
}
