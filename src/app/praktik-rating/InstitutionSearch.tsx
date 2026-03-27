'use client';

import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Check, Loader2, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import { searchInstitutionsAction } from './actions';
import { motion, AnimatePresence } from 'framer-motion';

interface InstitutionSearchProps {
  onSelect: (inst: any) => void;
  selectedId?: string;
}

export default function InstitutionSearch({ onSelect, selectedId }: InstitutionSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<any>(null);

  useEffect(() => {
    async function search() {
      if (debouncedSearch.length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      const res = await searchInstitutionsAction(debouncedSearch);
      setResults(res);
      setIsLoading(false);
      setIsOpen(true);
    }
    search();
  }, [debouncedSearch]);

  const handleSelect = (inst: any) => {
    setSelectedInst(inst);
    onSelect(inst);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full max-w-xl mx-auto z-50">
      {selectedInst ? (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-amber-50 border border-amber-200 rounded-[2rem] flex items-center justify-between shadow-xl shadow-amber-900/5 group"
        >
            <div className="flex items-center gap-3 sm:gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 group-hover:rotate-6 transition-transform">
                    <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                   <p className="text-[9px] sm:text-[10px] font-black uppercase text-amber-500 tracking-widest mb-0.5 sm:mb-1">Valgt institution</p>
                   <h3 className="text-base sm:text-lg font-black text-slate-900 serif leading-tight line-clamp-1">{selectedInst.INST_NAVN}</h3>
                   <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {selectedInst.POSTDISTRIKT}
                   </div>
                </div>
            </div>
            <button 
                onClick={() => { setSelectedInst(null); onSelect(null); }}
                className="w-10 h-10 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-full flex items-center justify-center text-slate-400 transition-all border border-amber-100"
            >
                <X className="w-5 h-5" />
            </button>
        </motion.div>
      ) : (
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center text-slate-400 group-focus-within:text-amber-500 transition-colors">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </div>
          <input 
            type="text"
            placeholder="Søg på institutionens navn..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-white border-2 border-slate-100 rounded-full py-6 pl-16 pr-8 text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all shadow-xl shadow-slate-900/5"
          />
        </div>
      )}

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl overflow-hidden z-50 p-2"
          >
            {results.map((inst) => (
              <button
                key={inst.id}
                onClick={() => handleSelect(inst)}
                className="w-full p-4 flex items-center gap-4 hover:bg-amber-50 rounded-2xl transition-all text-left group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 group-hover:bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors shadow-sm shrink-0">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1">
                   <p className="text-[13px] sm:text-sm font-black text-slate-900 leading-tight mb-0.5 line-clamp-1">{inst.INST_NAVN}</p>
                   <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="w-3 h-3" />
                      {inst.POSTDISTRIKT}
                   </p>
                </div>
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center text-slate-200 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all">
                    <Check className="w-4 h-4" />
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
