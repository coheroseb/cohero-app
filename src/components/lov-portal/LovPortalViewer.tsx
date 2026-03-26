
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp,
  Scale
} from 'lucide-react';
import { getLawContentAction, analyzeParagraphAction, semanticLawSearchAction } from '@/app/actions';
import { LawConfig, LawContentType, SavedParagraph, QuizResult, ParagraphAnalysisData } from '@/ai/flows/types';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Modular Components
import { LawSidebar } from './LawSidebar';
import { LawDashboard } from './LawDashboard';
import { LawContent } from './LawContent';
import { LawContextSidebar } from './LawContextSidebar';
import { LawSearchHeader } from './LawSearchHeader';
import LawQuizModal from './LawQuizModal';
import ReadingGuideModal from './ReadingGuideModal';
import { MobileBottomNav } from './MobileBottomNav';

interface LovPortalViewerProps {
  lawsConfigs: LawConfig[];
  activeLawId?: string;
  activeReferenceId?: string;
  isPremium: boolean;
  lawsLoading: boolean;
}

export default function LovPortalViewer({
  lawsConfigs,
  activeLawId,
  activeReferenceId,
  isPremium,
  lawsLoading
}: LovPortalViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  const { toast } = useToast();
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [viewMode, setViewMode] = useState<'laws' | 'decisions' | 'saved' | 'training' | 'reforms'>('laws');
  const [docsData, setDocsData] = useState<Record<string, LawContentType>>({});
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [activeParagraphNumber, setActiveParagraphNumber] = useState<string | null>(null);
  const [expandedParaKey, setExpandedParaKey] = useState<string | null>(null);
  
  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Analyses
  const [isAnalysingPara, setIsAnalysingPara] = useState<Record<string, boolean>>({});
  const [paraAnalysis, setParaAnalysis] = useState<Record<string, ParagraphAnalysisData>>({});
  
  // UI States
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isReadingGuideOpen, setIsReadingGuideOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isContextSidebarOpen, setIsContextSidebarOpen] = useState(true);
  const [selectedSubElement, setSelectedSubElement] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // --- DERIVED ---
  const currentDocId = activeReferenceId || activeLawId || '';
  const currentDocData = docsData[currentDocId];

  // --- DATA LOADING ---
  const loadDocumentContent = useCallback(async (id: string, docIdentifier: string, forceUrl?: string) => {
    if (docsData[docIdentifier] || isLoadingDoc) return;
    setIsLoadingDoc(true);
    const config = lawsConfigs.find(l => l.id === id);
    const xmlUrl = forceUrl || config?.xmlUrl;
    if (!xmlUrl) { setIsLoadingDoc(false); return; }

    try {
        const result = await getLawContentAction({ 
            documentId: docIdentifier, xmlUrl,
            name: config?.name || 'Dokument', abbreviation: config?.abbreviation || 'DOK', lbk: config?.lbk || ''
        });
        if (result?.data) setDocsData(prev => ({ ...prev, [docIdentifier]: result.data }));
    } finally { setIsLoadingDoc(false); }
  }, [lawsConfigs, docsData, isLoadingDoc]);

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
  const safeSavedParagraphs = savedParagraphs || [];

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
    if (safeSavedParagraphs.some(p => p.id === savedId)) {
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

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    try {
        // Enkel søgning i titler for demo, kunne være semantisk
        const results = lawsConfigs.filter(l => 
          l.name.toLowerCase().includes(query.toLowerCase()) || 
          l.abbreviation.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results.map(r => ({ ...r, title: r.name })));
    } finally { setIsSearching(false); }
  }, [lawsConfigs, isSearching]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 2) handleSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const scrollToChapter = (idx: number) => {
    const element = document.getElementById(`chapter-${idx}`);
    if (mainScrollRef.current && element) {
        const top = element.getBoundingClientRect().top + mainScrollRef.current.scrollTop - 100;
        mainScrollRef.current.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleSearchResultClick = (res: any) => {
    setSearchQuery('');
    router.push(`/lov-portal/view/${res.id}`);
  };

  // Scroll detection
  useEffect(() => {
    const scrollArea = mainScrollRef.current;
    if (!scrollArea) return;
    const handleScroll = () => setShowScrollTop(scrollArea.scrollTop > 500);
    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col lg:flex-row text-slate-950 font-sans selection:bg-amber-200 overflow-x-hidden">
      
      <LawSidebar 
        viewMode={viewMode} setViewMode={setViewMode} activeLawId={activeLawId || null} 
        lawsConfigs={lawsConfigs} isPremium={isPremium} user={user} userProfile={userProfile}
        onLawClick={(id) => { setViewMode('laws'); router.push(`/lov-portal/view/${id}`); }}
        onDashboardClick={() => { setViewMode('laws'); router.push('/lov-portal'); }}
      />

      <main ref={mainScrollRef} className="flex-1 min-w-0 h-screen overflow-y-auto relative pt-0 custom-scrollbar pb-32 lg:pb-0 scroll-smooth">
        <LawSearchHeader 
           searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
           isSearching={isSearching} searchResults={searchResults}
           onSearchOpen={() => {}} isSearchVisible={false} setIsSearchVisible={() => {}}
           onResultClick={handleSearchResultClick} isPremium={isPremium}
        />

        <div className={`mx-auto transition-all duration-1000 ${isFocusMode ? 'max-w-4xl p-12 pt-24' : (activeLawId ? 'max-w-full' : 'max-w-full')}`}>
            <AnimatePresence mode="wait">
                {activeLawId && currentDocData ? (
                   <div className="flex flex-col lg:flex-row gap-12 xl:gap-24 px-8 md:px-16">
                      <div className="flex-1 min-w-0">
                         <LawContent 
                            docData={currentDocData} lawId={activeLawId}
                            expandedParaKey={expandedParaKey} setExpandedParaKey={setExpandedParaKey}
                            activeParagraphNumber={activeParagraphNumber} setActiveParagraphNumber={setActiveParagraphNumber}
                            isAnalysingPara={isAnalysingPara} paraAnalysis={paraAnalysis}
                            onAnalyze={handleAnalyzeParagraph} onToggleSave={handleToggleSave}
                            isSaved={(id) => safeSavedParagraphs.some(p => p.id === id)}
                            onCopy={(text, id) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); }}
                            copiedId={copiedId} isPremium={isPremium}
                            onSubElementClick={(sub) => { setSelectedSubElement(sub); }}
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

        {/* Floating Utility Hub */}
        <AnimatePresence>
            {showScrollTop && (
                <motion.button 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={() => mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-12 right-12 w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-950 shadow-2xl hover:scale-110 active:scale-95 z-50 transition-all group"
                >
                    <ChevronUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                </motion.button>
            )}
        </AnimatePresence>
      </main>

      <LawQuizModal isOpen={isQuizModalOpen} onClose={() => setIsQuizModalOpen(false)} lawId={activeLawId || ''} lawTitle={currentDocData?.titel || ''} />
      <ReadingGuideModal isOpen={isReadingGuideOpen} onClose={() => setIsReadingGuideOpen(false)} />
            <MobileBottomNav 
           viewMode={viewMode}
           onTabChange={(mode) => setViewMode(mode)}
           activeLawId={activeLawId}
           activeReferenceId={activeReferenceId}
        />
    </div>
  );
}
