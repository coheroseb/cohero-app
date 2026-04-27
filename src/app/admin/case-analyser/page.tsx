'use client';

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  User, 
  ChevronRight, 
  Eye, 
  Loader2, 
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Filter,
  Brain,
  Scale,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, limit, getDoc, doc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { CaseAnalysis } from '@/ai/flows/types';

interface CaseAnalysisRecord {
  id: string;
  userId: string;
  userName?: string;
  fileName: string;
  pdfUrl?: string;
  createdAt: any;
  analysis: CaseAnalysis;
  rawText?: string;
}

export default function AdminCaseAnalyserOverviewPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<CaseAnalysisRecord | null>(null);
  const [userCache, setUserCache] = useState<Record<string, string>>({});

  // 1. Fetch all case analyses using collectionGroup
  // Note: This requires a Collection Group index in Firestore for 'caseAnalyses' ordered by 'createdAt'
  const analysesQuery = useMemoFirebase(() => (
    firestore ? query(collectionGroup(firestore, 'caseAnalyses'), orderBy('createdAt', 'desc'), limit(100)) : null
  ), [firestore]);

  const { data: rawAnalyses, isLoading, error } = useCollection<any>(analysesQuery);

  // 2. Process data and fetch usernames
  const analyses = useMemo(() => {
    if (!rawAnalyses) return [];
    
    return rawAnalyses.map(item => {
      const pathSegments = (item._path || '').split('/');
      const userId = pathSegments[1] || 'ukendt'; // users/{userId}/caseAnalyses/{id}
      
      return {
        ...item,
        userId,
      } as CaseAnalysisRecord;
    });
  }, [rawAnalyses]);

  // Fetch usernames for the visible analyses
  React.useEffect(() => {
    if (!analyses || !firestore) return;
    
    const fetchUsernames = async () => {
      const newCache = { ...userCache };
      let changed = false;
      
      for (const analysis of analyses) {
        if (!newCache[analysis.userId]) {
          try {
            const userDoc = await getDoc(doc(firestore, 'users', analysis.userId));
            if (userDoc.exists()) {
              newCache[analysis.userId] = userDoc.data()?.username || userDoc.data()?.email || 'Ukendt Bruger';
              changed = true;
            } else {
              newCache[analysis.userId] = 'Slettet Bruger';
              changed = true;
            }
          } catch (e) {
            console.error("Error fetching username:", e);
          }
        }
      }
      
      if (changed) {
        setUserCache(newCache);
      }
    };
    
    fetchUsernames();
  }, [analyses, firestore]);

  const filteredAnalyses = useMemo(() => {
    if (!analyses) return [];
    const term = searchTerm.toLowerCase();
    return analyses.filter(a => {
      const username = userCache[a.userId]?.toLowerCase() || '';
      const fileName = a.fileName.toLowerCase();
      const summary = a.analysis?.sammenfatning?.toLowerCase() || '';
      return username.includes(term) || fileName.includes(term) || summary.includes(term);
    });
  }, [analyses, searchTerm, userCache]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Kunne ikke hente data</h2>
        <p className="text-slate-500 max-w-md">
          Der opstod en fejl ved hentning af case-analyser. Dette kan skyldes manglende Firestore-indeksering (Collection Group Index).
        </p>
        <code className="text-[10px] bg-slate-100 p-2 rounded block max-w-full overflow-x-auto">
          {error.message}
        </code>
        <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-xl">
          Prøv igen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-ink pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 serif">Case Analyser</h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">Se alle AI-genererede case-analyser fra platformens brugere.</p>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Søg i filer, brugere eller indhold..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-6 bg-slate-50 border-slate-100 rounded-2xl text-sm focus:ring-indigo-600/10 w-64 md:w-80 transition-all"
            />
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* LIST COLUMN */}
        <div className={`lg:col-span-5 space-y-4 ${selectedAnalysis ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Seneste Analyser</h3>
              <span className="text-[10px] font-bold text-slate-300">{filteredAnalyses.length} analyser fundet</span>
            </div>
            
            <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Indlæser analyser...</p>
                </div>
              ) : filteredAnalyses.length === 0 ? (
                <div className="p-20 text-center text-slate-400 italic text-sm">
                  Ingen analyser fundet.
                </div>
              ) : (
                filteredAnalyses.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => setSelectedAnalysis(item)}
                    className={`w-full text-left p-6 flex items-start gap-4 hover:bg-slate-50 transition-all group ${selectedAnalysis?.id === item.id ? 'bg-indigo-50/50' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${selectedAnalysis?.id === item.id ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-100 text-slate-400'}`}>
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`font-bold truncate text-sm transition-colors ${selectedAnalysis?.id === item.id ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {item.fileName}
                        </p>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
                          {item.createdAt?.toDate().toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-3 h-3 text-slate-300" />
                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tight">
                          {userCache[item.userId] || 'Henter...'}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">
                        {item.analysis?.sammenfatning}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-200 mt-1 transition-transform ${selectedAnalysis?.id === item.id ? 'translate-x-1 text-indigo-300' : ''}`} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* DETAIL COLUMN */}
        <div className={`lg:col-span-7 ${selectedAnalysis ? 'block' : 'hidden lg:flex items-center justify-center min-h-[600px]'}`}>
          <AnimatePresence mode="wait">
            {selectedAnalysis ? (
              <motion.div 
                key={selectedAnalysis.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden h-fit"
              >
                {/* Detail Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedAnalysis(null)}
                      className="lg:hidden rounded-full hover:bg-slate-100"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{selectedAnalysis.fileName}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-1">
                        Analyse udført af {userCache[selectedAnalysis.userId] || '...'} den {selectedAnalysis.createdAt?.toDate().toLocaleString('da-DK')}
                      </p>
                    </div>
                  </div>
                  {selectedAnalysis.pdfUrl && (
                    <Button 
                      onClick={() => window.open(selectedAnalysis.pdfUrl, '_blank')}
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl border-slate-200 text-[10px] font-black uppercase tracking-widest gap-2 h-10 px-4"
                    >
                      <Eye className="w-4 h-4" /> Se PDF
                    </Button>
                  )}
                </div>

                <div className="p-10 space-y-12 overflow-y-auto max-h-[800px] custom-scrollbar">
                  
                  {/* Summary */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sammenfatning</h4>
                    </div>
                    <div className="p-8 bg-indigo-50/30 border border-indigo-100/50 rounded-[2rem] text-sm text-indigo-950 leading-relaxed font-medium italic">
                      {selectedAnalysis.analysis?.sammenfatning}
                    </div>
                  </section>

                  {/* People involved */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personer</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {selectedAnalysis.analysis?.personer?.map((p, i) => (
                        <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                          <p className="font-bold text-slate-900 mb-1">{p.navn}</p>
                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2">{p.rolle}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{p.beskrivelse}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Relevant Laws */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                        <Scale className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Relevante Paragraffer</h4>
                    </div>
                    <div className="space-y-3">
                      {selectedAnalysis.analysis?.relevanteParagraffer?.map((lp, i) => (
                        <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                            §
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 mb-1">{lp.lov} - {lp.paragraf}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{lp.relevans}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Timeline */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tidslinje</h4>
                    </div>
                    <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                      {selectedAnalysis.analysis?.tidslinje?.map((t, i) => (
                        <div key={i} className="relative pl-10">
                          <div className="absolute left-[13px] top-1.5 w-2 h-2 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{t.dato}</p>
                          <p className="text-sm font-semibold text-slate-700">{t.hændelse}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Social Problems */}
                  {selectedAnalysis.analysis?.socialeProblemer && selectedAnalysis.analysis.socialeProblemer.length > 0 && (
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Identificerede Problemstillinger</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.analysis.socialeProblemer.map((prob, i) => (
                          <span key={i} className="px-4 py-2 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-xl border border-rose-100">
                            {prob}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Raw Text Preview */}
                  {selectedAnalysis.rawText && (
                    <section className="space-y-4 pt-10 border-t border-slate-50">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Udtrukket Råtekst</h4>
                       <div className="p-6 bg-slate-900 rounded-2xl text-[10px] font-mono text-slate-400 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-wrap select-all">
                          {selectedAnalysis.rawText}
                       </div>
                    </section>
                  )}

                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-6 opacity-30 select-none grayscale">
                <div className="w-32 h-32 bg-slate-50 rounded-[3rem] border border-slate-100 flex items-center justify-center">
                   <Brain className="w-16 h-16 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400 max-w-[200px]">Vælg en analyse fra listen til venstre for at se detaljerne her</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
