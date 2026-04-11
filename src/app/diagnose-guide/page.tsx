'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ArrowLeft, 
  Shield, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  Info,
  Scale,
  Activity,
  User,
  Zap,
  Bookmark,
  History,
  Scale as ScaleIcon,
  BookOpen,
  List,
  Languages
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { searchDiagnoseAction, translateDiagnoseAction, getDiagnoseDetailsAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function DiagnoseGuidePage() {
  const { user, isUserLoading, userProfile } = useApp();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<Record<string, boolean>>({});

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('diagnose_search_history');
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const searchTerm = overrideQuery || query;
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await searchDiagnoseAction({ 
        query: searchTerm, 
        profession: userProfile?.track || 'socialrådgiver' 
      });

      if (res.success) {
        setResults(res.diagnoses);
        // Update history
        const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 5);
        setSearchHistory(newHistory);
        localStorage.setItem('diagnose_search_history', JSON.stringify(newHistory));
      } else {
        setError(res.error || 'Der skete en fejl under søgningen.');
      }
    } catch (err: any) {
      setError('Kunne ikke forbinde til serveren.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDrillDown = async (id: string) => {
    setIsSearching(true);
    setError(null);
    try {
      const res = await getDiagnoseDetailsAction({ id });
      if (res.success && res.diagnosis) {
        setResults([res.diagnosis]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(res.error || 'Kunne ikke hente detaljer for denne kategori.');
      }
    } catch (err: any) {
      setError('Der skete en fejl ved overgangen til denne kategori.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleTranslate = async (id: string, text: string) => {
    if (translations[id]) {
        // Clear translation to toggle back to English
        const newTrans = { ...translations };
        delete newTrans[id];
        setTranslations(newTrans);
        return;
    }

    setIsTranslating(prev => ({ ...prev, [id]: true }));
    try {
        const res = await translateDiagnoseAction({ text });
        if (res.data?.translatedText) {
            setTranslations(prev => ({ ...prev, [id]: res.data.translatedText }));
        }
    } catch (err) {
        console.error("Translation failed:", err);
    } finally {
        setIsTranslating(prev => ({ ...prev, [id]: false }));
    }
  };

  if (isUserLoading) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8] selection:bg-rose-100 flex flex-col items-center">
      
      {/* HEADER */}
      <header className="w-full h-20 bg-white/80 backdrop-blur-md border-b border-rose-50 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/portal" className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Diagnose-Guiden</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">ICD-11 Vidensbase</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full">
            <Shield className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-rose-900 uppercase tracking-widest">Professionel Rygdækning</span>
        </div>
      </header>

      <main className="max-w-4xl w-full px-6 py-12 sm:py-20">
        
        {/* HERO SECTION */}
        <div className="text-center mb-12 sm:mb-16">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-full mb-6"
            >
                <Activity className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-900">Forståelse skaber tryghed</span>
            </motion.div>
            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
                Lær om diagnoserne i <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400 italic">socialfaglig kontekst.</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Slå op i WHO's officielle ICD-11 register og få lynhurtig, intelligent oversættelse og forklaring på, hvad diagnosen betyder for din borger og dit arbejde.
            </p>
        </div>

        {/* SEARCH BOX */}
        <div className="relative max-w-2xl mx-auto mb-16">
            <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-amber-500/10 rounded-[32px] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center bg-white border border-slate-200 p-2 sm:p-3 rounded-[28px] shadow-sm hover:shadow-xl hover:border-rose-200 transition-all duration-300">
                    <div className="w-12 h-12 flex items-center justify-center text-slate-400 group-focus-within:text-rose-500 transition-colors">
                        <Search className="w-6 h-6" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Søg på ADHD, Autisme, Skizofreni..."
                        className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300 px-2"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button 
                        type="submit"
                        disabled={isSearching || !query.trim()}
                        className="h-12 px-8 bg-slate-900 text-white rounded-[20px] font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                    >
                        {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Søg'}
                    </button>
                </div>
            </form>

            <AnimatePresence>
                {searchHistory.length > 0 && !results.length && !isSearching && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center justify-center gap-3 mt-8"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seneste:</span>
                        {searchHistory.map((item, i) => (
                            <button 
                                key={i}
                                onClick={() => {
                                    setQuery(item);
                                    handleSearch(undefined, item);
                                }}
                                className="px-4 py-2 bg-white border border-slate-100 rounded-full text-xs font-bold text-slate-600 hover:border-rose-200 hover:text-rose-600 transition-all active:scale-95 shadow-sm"
                            >
                                {item}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* RESULTS AREA */}
        <div className="space-y-8">
            {isSearching && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <div className="relative">
                        <Loader2 className="w-12 h-12 text-rose-500 animate-spin" />
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                    <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 animate-pulse">Analyserer ICD-11 registeret...</p>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[24px] text-center">
                    <p className="font-bold text-rose-600">{error}</p>
                </div>
            )}

            {!isSearching && results.map((diag, idx) => (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={diag.id}
                    className="bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden hover:shadow-2xl hover:border-rose-200 transition-all duration-500"
                >
                    {/* Diagnosis Header */}
                    <div className="p-8 sm:p-12 border-b border-slate-50">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 mb-8">
                            <div>
                                                                {diag.breadcrumbs && diag.breadcrumbs.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mb-6 opacity-60 overflow-hidden">
                                        {diag.breadcrumbs.map((bc, i) => (
                                            <React.Fragment key={i}>
                                                <button 
                                                    onClick={() => handleDrillDown(bc.id)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 transition-colors whitespace-nowrap"
                                                >
                                                    {bc.title}
                                                </button>
                                                {i < diag.breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                                            </React.Fragment>
                                        ))}
                                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                                    </div>
                                )}
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-full text-[12px] font-black uppercase tracking-[0.15em] mb-6">
                                    ICD-11 Kode: {diag.code}
                                </div>
                                <h3 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2">
                                    {diag.titleDa}
                                </h3>
                                <p className="text-slate-400 text-sm font-medium italic mt-2">{diag.titleEn}</p>
                            </div>
                        </div>

                        {/* Description & Detail */}
                        <div className="space-y-8">
                            <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 relative group overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {translations[`desc_${diag.id}`] ? 'Dansk Oversættelse' : 'Klinisk Definition (Engelsk)'}
                                    </span>
                                    <button 
                                        onClick={() => handleTranslate(`desc_${diag.id}`, diag.longDefinition || diag.descriptionDa)}
                                        disabled={isTranslating[`desc_${diag.id}`]}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {isTranslating[`desc_${diag.id}`] ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Languages className="w-3 h-3" />
                                        )}
                                        {translations[`desc_${diag.id}`] ? 'Vis Engelsk' : 'Oversæt til Dansk'}
                                    </button>
                                </div>
                                
                                <div className="prose prose-slate max-w-none">
                                    <p className="text-slate-700 font-medium leading-relaxed" 
                                       dangerouslySetInnerHTML={{ __html: translations[`desc_${diag.id}`] || diag.longDefinition || diag.descriptionDa }} />
                                </div>
                            </div>

                            {diag.symptomsDa && diag.symptomsDa.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4 ml-1">Nøgleord & Synonymer</span>
                                    <div className="flex flex-wrap gap-2">
                                        {diag.symptomsDa.map((s, i) => (
                                            <div key={i} className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                                                {s}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {diag.diagnosticCriteria && (
                                <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-900/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <List className="w-5 h-5 text-rose-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnostiske Krav</span>
                                    </div>
                                    <div className="prose prose-invert max-w-none text-sm font-medium leading-relaxed opacity-90"
                                         dangerouslySetInnerHTML={{ __html: diag.diagnosticCriteria }} />
                                </div>
                            )}

                            {diag.narrowerTerms && diag.narrowerTerms.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4 ml-1">Underkategorier (Narrower Terms)</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {diag.narrowerTerms.map((term, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => handleDrillDown(term.id)}
                                                className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-rose-400 group transition-all active:scale-95 shadow-sm"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700 group-hover:text-rose-900">{term.title}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {diag.relevantLegalParagraphs && diag.relevantLegalParagraphs.length > 0 && (
                                <div className="p-8 bg-slate-900 rounded-[32px] text-white shadow-2xl relative overflow-hidden group mb-8">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Scale className="w-24 h-24" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 bg-rose-500 rounded-lg">
                                                <Shield className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block">Socialfaglig Lov-kobling</span>
                                                <h4 className="text-lg font-black tracking-tight text-white">Relevante Paragraffer & Kilder</h4>
                                            </div>
                                        </div>
                                        
                                        <div className="grid gap-4">
                                            {diag.relevantLegalParagraphs.map((law, i) => (
                                                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                        <span className="text-sm font-black text-rose-300">{law.paragraph}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                        {law.description}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Inclusions & Exclusions */}
                            <div className="grid md:grid-cols-2 gap-8">
                                {diag.inclusions && diag.inclusions.length > 0 && (
                                    <div className="p-8 bg-emerald-50/30 border border-emerald-100/50 rounded-[32px]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-4">Indbefattet</span>
                                        <ul className="space-y-3">
                                            {diag.inclusions.map((inc, i) => (
                                                <li key={i} className="text-xs font-bold text-emerald-900 flex gap-3">
                                                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">+</div>
                                                    {inc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {diag.exclusions && diag.exclusions.length > 0 && (
                                    <div className="p-8 bg-rose-50/30 border border-rose-100/50 rounded-[32px]">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block mb-4">Ekskluderet</span>
                                        <ul className="space-y-3">
                                            {diag.exclusions.map((exc, i) => (
                                                <li key={i} className="text-xs font-bold text-rose-900 flex gap-3">
                                                    <div className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[8px] font-black shrink-0">-</div>
                                                    {exc}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="p-8 sm:p-12 bg-slate-50/20">
                        <div className="flex items-center gap-2 text-slate-400">
                             <Activity className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">Officiel WHO Data Opslag</span>
                        </div>
                    </div>
                </motion.div>
            ))}

            {!isSearching && !results.length && query && (
                <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-[40px]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">Ingen præcise matches fundet i WHO registeret.</p>
                    <p className="text-xs text-slate-300 mt-2 uppercase tracking-widest">Prøv med mere generelle termer</p>
                </div>
            )}
        </div>
      </main>

      {/* FOOTER / TIP */}
      <footer className="w-full py-12 px-8 bg-slate-50 border-t border-slate-100 mt-auto">
         <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 opacity-60">
            <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-slate-400" />
                <p className="text-xs font-medium text-slate-500 max-w-[300px]">
                    Data leveres af WHO ICD-11 API. Den socialfaglige fortolkning er vejledende og bør altid holdes op mod gældende dansk lovgivning.
                </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <History className="w-4 h-4" />
                <span>Opdateret April 2026</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
