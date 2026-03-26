
'use client';

import React from 'react';
import { 
  Search, 
  Sparkles, 
  Wand2, 
  Zap, 
  Loader2, 
  HelpCircle, 
  Maximize, 
  Minimize, 
  Trophy, 
  PanelRight 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LawSearchHeaderProps {
  handleSearch: (e: React.FormEvent) => void;
  isSemanticMode: boolean;
  activeLawId: string | null;
  activeReferenceId: string | null;
  currentDocData: any;
  lawsConfigs: any[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  semanticSearchQuery: string;
  setSemanticSearchQuery: (val: string) => void;
  isSearchingSemantic: boolean;
  isSearchFocused: boolean;
  setIsSearchFocused: (val: boolean) => void;
  filteredSuggestions: any[];
  onSuggestionClick: (suggestion: any) => void;
  setIsReadingGuideOpen: (val: boolean) => void;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  setIsQuizModalOpen: (val: boolean) => void;
  isContextSidebarOpen: boolean;
  setIsContextSidebarOpen: (val: boolean) => void;
}

export const LawSearchHeader = ({
  handleSearch,
  isSemanticMode,
  activeLawId,
  activeReferenceId,
  currentDocData,
  lawsConfigs,
  searchQuery,
  setSearchQuery,
  semanticSearchQuery,
  setSemanticSearchQuery,
  isSearchingSemantic,
  isSearchFocused,
  setIsSearchFocused,
  filteredSuggestions,
  onSuggestionClick,
  setIsReadingGuideOpen,
  isFocusMode,
  setIsFocusMode,
  setIsQuizModalOpen,
  isContextSidebarOpen,
  setIsContextSidebarOpen
}: LawSearchHeaderProps) => {

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-amber-100 px-8 hidden lg:flex items-center justify-between sticky top-0 z-20">
        <form onSubmit={handleSearch} className="flex items-center gap-6 flex-1 max-w-2xl">
            {!(activeLawId || activeReferenceId) && (
                <div className="flex bg-amber-950 rounded-2xl p-1 shadow-lg border border-amber-800 shrink-0">
                    <div className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                        <Wand2 className="w-3 h-3" /> AI Søgning Aktiveret
                    </div>
                </div>
            )}
            <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-amber-950 transition-colors" />
                <input 
                    type="text" 
                    placeholder={(activeLawId || activeReferenceId) ? `Søg i ${currentDocData?.forkortelse || (lawsConfigs || []).find((l: any) => l.id === activeLawId)?.abbreviation || 'denne lov'}...` : (isSemanticMode ? "Spørg AI'en om jura (f.eks. 'Hvad er reglerne for...') " : "Søg i lovportalen...")}
                    value={(activeLawId || activeReferenceId) ? searchQuery : (isSemanticMode ? semanticSearchQuery : searchQuery)} 
                    onChange={(e) => {
                        const val = e.target.value;
                        if (activeLawId || activeReferenceId) {
                            setSearchQuery(val);
                            setSemanticSearchQuery(val);
                        } else {
                            if (isSemanticMode) setSemanticSearchQuery(val);
                            else setSearchQuery(val);
                        }
                    }} 
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-950 focus:bg-white transition-all font-medium" 
                />
                
                {isSemanticMode && !(activeLawId || activeReferenceId) && (
                    <button 
                        type="submit"
                        disabled={isSearchingSemantic || !semanticSearchQuery.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-amber-950 text-amber-400 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {isSearchingSemantic ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Søg AI
                    </button>
                )}
                
                <AnimatePresence>
                    {isSearchFocused && filteredSuggestions.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-amber-100 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden"
                        >
                            {filteredSuggestions.map((suggestion, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => onSuggestionClick(suggestion)}
                                    className="w-full text-left px-4 py-3 hover:bg-amber-50 rounded-xl transition-colors flex items-center gap-3 group/item"
                                >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-200 group-hover/item:text-amber-500 transition-colors" />
                                    <span className="text-xs sm:text-sm font-medium text-slate-600 group-hover/item:text-amber-950">
                                        {typeof suggestion === 'object' ? suggestion.display : suggestion}
                                    </span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </form>
        <div className="flex items-center gap-4 ml-8">
            <button 
                onClick={() => setIsReadingGuideOpen(true)}
                className="p-3 bg-amber-50 text-amber-900 rounded-xl hover:bg-amber-100 transition-all border border-amber-100 flex items-center gap-2 font-bold text-xs shadow-sm active:scale-95"
            >
                <HelpCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Læseguide</span>
            </button>
            <button 
                onClick={() => setIsFocusMode(!isFocusMode)}
                className={`p-3 rounded-xl transition-all border shadow-sm active:scale-95 group/focus ${isFocusMode ? 'bg-amber-950 text-white border-amber-950 scale-110 shadow-2xl' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}
                title={isFocusMode ? "Afslut fokustilstand" : "Aktiver fokustilstand"}
            >
                {isFocusMode ? <Minimize className="w-5 h-5 group-hover/focus:rotate-90 transition-transform" /> : <Maximize className="w-5 h-5 group-hover/focus:rotate-90 transition-transform" />}
            </button>
            {(activeLawId || activeReferenceId) && (
                <button 
                    onClick={() => setIsQuizModalOpen(true)}
                    className="p-3 bg-amber-950 text-amber-400 rounded-xl hover:scale-105 transition-all border border-amber-800 flex items-center gap-2 font-black text-[9px] uppercase tracking-[0.2em] shadow-xl active:scale-95 shrink-0"
                >
                    <Trophy className="w-4 h-4" />
                    <span className="hidden lg:inline">Lov-Quiz</span>
                </button>
            )}
            {!isFocusMode && (activeLawId || activeReferenceId) && (
                <button onClick={() => setIsContextSidebarOpen(!isContextSidebarOpen)} className={`p-3 rounded-xl transition-all border shadow-sm active:scale-95 ${isContextSidebarOpen ? 'bg-amber-950 text-white border-amber-950' : 'bg-white text-slate-400 border-amber-100 hover:bg-amber-50'}`}>
                    <PanelRight className="w-5 h-5" />
                </button>
            )}
        </div>
    </header>
  );
};
