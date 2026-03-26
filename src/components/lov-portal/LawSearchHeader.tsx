
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  Map, 
  Bookmark, 
  Brain,
  History,
  Command,
  HelpCircle,
  TrendingUp,
  Scale
} from 'lucide-react';

interface LawSearchHeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  searchResults: any[];
  onSearchOpen: () => void;
  isSearchVisible: boolean;
  setIsSearchVisible: (v: boolean) => void;
  onResultClick: (res: any) => void;
  isPremium: boolean;
}

export const LawSearchHeader = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  searchResults,
  onSearchOpen,
  isSearchVisible,
  setIsSearchVisible,
  onResultClick,
  isPremium
}: LawSearchHeaderProps) => {

  return (
    <div className="sticky top-0 z-50 p-12 pointer-events-none">
       <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
          {/* Floating Search Hub */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex-1 max-w-2xl bg-white/80 backdrop-blur-3xl border border-slate-100/50 rounded-full h-20 shadow-2xl flex items-center px-10 gap-8 focus-within:border-amber-950 focus-within:ring-4 focus-within:ring-amber-950/5 transition-all duration-700"
          >
             <Search className="w-5 h-5 text-slate-300" />
             <input 
               type="text" 
               placeholder="Søg i alle danske love & paragraffer..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="flex-1 bg-transparent border-none outline-none text-base font-black serif text-slate-950 placeholder:text-slate-300 transition-all"
             />
             <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 select-none">
                 <Command className="w-3.5 h-3.5" />
                 <span>K</span>
             </div>
             {isSearching && (
                 <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
             )}
          </motion.div>

          {/* Contextual Tools Hub */}
          <div className="hidden xl:flex items-center gap-6 ml-8">
             <ToolIcon icon={<HelpCircle className="w-5 h-5" />} label="AI Hjælp" />
             <ToolIcon icon={<History className="w-5 h-5" />} label="Seneste" />
             <ToolIcon icon={<TrendingUp className="w-5 h-5" />} label="Stats" />
             
             {isPremium && (
                <div className="px-6 py-3 bg-amber-950 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border border-amber-400/20 flex items-center gap-3">
                   <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                   Premium
                </div>
             )}
          </div>
       </div>

       {/* Floating Search Results Sanctuary */}
       <AnimatePresence>
          {searchQuery.length > 2 && (
             <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="max-w-4xl mx-auto mt-6 bg-white/95 backdrop-blur-3xl rounded-[3rem] border border-slate-100 shadow-[0_50px_100px_rgba(0,0,0,0.15)] overflow-hidden pointer-events-auto"
             >
                <div className="p-12 space-y-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <header className="flex items-center justify-between border-b border-slate-50 pb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-950 shadow-inner border border-amber-100/50 rotate-3"><Search className="w-6 h-6" /></div>
                            <div>
                                <h4 className="text-xl font-black text-slate-950 serif tracking-tight">Søgeresultater</h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mt-1 italic">Hurtig scanning gennem {searchResults.length} kilder</p>
                            </div>
                        </div>
                    </header>
                    
                    {searchResults.length === 0 ? (
                        <div className="py-20 text-center space-y-4">
                            <p className="text-xl font-black text-slate-950 serif italic">Intet fundet på "{searchQuery}"</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Prøv med et mere generelt begreb eller paragraf-nummer.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {searchResults.map((res, i) => (
                                <button 
                                    key={i}
                                    onClick={() => onResultClick(res)}
                                    className="w-full text-left p-10 bg-slate-50/50 border border-transparent rounded-[2.5rem] hover:bg-white hover:border-amber-950 hover:shadow-2xl hover:shadow-amber-900/5 transition-all duration-700 group/item flex items-center gap-10"
                                >
                                    <div className="w-16 h-16 shrink-0 bg-white border border-slate-100 rounded-[1.5rem] flex flex-col items-center justify-center text-slate-900 shadow-sm group-hover/item:bg-amber-950 group-hover/item:text-amber-400 transition-all duration-700">
                                        <span className="text-xs font-black serif uppercase">{res.abbreviation || 'LOV'}</span>
                                        <Scale className="w-4 h-4 mt-1 opacity-20 group-hover/item:opacity-100" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xl font-black text-slate-950 serif italic tracking-tight mb-2 truncate group-hover/item:text-amber-950">{res.title}</h5>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/item:text-slate-950 transition-colors uppercase italic">{res.context || 'Generelt opslag'}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-all duration-700 shadow-xl scale-90 group-hover/item:scale-100">
                                        <Command className="w-5 h-5 text-amber-950" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-8 bg-slate-50/50 border-t border-slate-50 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Tip: Du kan bruge 'cmd' + 'f' til at søge i selve dokumentet</p>
                </div>
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

const ToolIcon = ({ icon, label }: any) => (
    <button className="flex flex-col items-center gap-3 text-slate-300 hover:text-slate-950 transition-all duration-700 group/tool">
        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover/tool:shadow-xl group-hover/tool:scale-110 transition-all duration-700">{icon}</div>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-0 group-hover/tool:opacity-100 transition-all duration-700">{label}</span>
    </button>
);
