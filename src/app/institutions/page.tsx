'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  ChevronRight,
  Filter,
  Users,
  Briefcase,
  Layers,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

const InstitutionCard = ({ inst }: { inst: any }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-white p-6 rounded-[2rem] border border-amber-100/50 shadow-xl shadow-amber-900/5 hover:-translate-y-1 transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700">
      <Building2 className="w-24 h-24 -rotate-12" />
    </div>

    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
             <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-100">
                {inst.EJER_KODE_TEKST || 'Institution'}
             </span>
             {inst.min_KODE_TEKST && (
                <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-sky-100">
                  {inst.min_KODE_TEKST}
                </span>
             )}
             {inst.inst_type_2_tekst && (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                  {inst.inst_type_2_tekst}
                </span>
             )}
          </div>
          <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-amber-700 transition-colors">
            {inst.INST_NAVN}
          </h3>
        </div>
      </div>

      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">
            <MapPin className="w-4 h-4" />
          </div>
          <p className="text-xs font-medium truncate">
            {inst.INST_ADR}, {inst.POSTNR} {inst.POSTDISTRIKT}
          </p>
        </div>

        {inst.TLF_NR && (
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium">{inst.TLF_NR}</p>
          </div>
        )}

        {inst.E_MAIL && (
          <div className="flex items-center gap-3 text-slate-500">
            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <p className="text-xs font-medium truncate">{inst.E_MAIL}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
        {inst.WEB_ADR && (
          <a 
            href={inst.WEB_ADR.startsWith('http') ? inst.WEB_ADR : `https://${inst.WEB_ADR}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all border border-amber-200/50"
          >
            <Globe className="w-3 h-3" />
            Hjemmeside
          </a>
        )}
        <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-950 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
          Detaljer
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  </motion.div>
);

const InstitutionsPage = () => {
  const { user, isUserLoading } = useApp();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const [regionFilter, setRegionFilter] = useState('Alle');
  const [ejerFilter, setEjerFilter] = useState('Alle');
  const [typeFilter, setTypeFilter] = useState('Alle');
  const [isLocating, setIsLocating] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/portal');
    }
  }, [user, isUserLoading, router]);

  // Automatisk lokation tæt på brugeren
  useEffect(() => {
    if ("geolocation" in navigator && regionFilter === 'Alle' && !searchTerm) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.dataforsyningen.dk/adgangsadresser/reverse?x=${longitude}&y=${latitude}&format=json`);
          const data = await response.json();
          if (data && data.region && data.region.navn) {
            setRegionFilter(data.region.navn);
          }
        } catch (error) {
          console.error("Kunne ikke finde lokation:", error);
        } finally {
          setIsLocating(false);
        }
      }, (error) => {
        setIsLocating(false);
      });
    }
  }, []);

  const regions = ['Alle', 'Region Hovedstaden', 'Region Sjælland', 'Region Syddanmark', 'Region Midtjylland', 'Region Nordjylland'];
  const ejerformer = ['Alle', 'Kommunale', 'Selvejende', 'Statslige', 'Private'];

  const institutionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    let q = collection(firestore, 'institutions');
    let constraints: any[] = [];

    // Prioriter søgning hvis den findes (prefix søgning kan ikke kombineres med filter uden index)
    if (debouncedSearch && debouncedSearch.length >= 2) {
      const searchStr = debouncedSearch.toLowerCase();
      const endStr = searchStr.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
      return query(q, where('search_name', '>=', searchStr), where('search_name', '<', endStr), limit(40));
    }

    if (regionFilter !== 'Alle') {
      constraints.push(where('BEL_REGION_TEKST', '==', regionFilter));
    }
    if (ejerFilter !== 'Alle') {
        constraints.push(where('EJER_KODE_TEKST', '==', ejerFilter));
    }

    // Default sorting
    return query(q, ...constraints, orderBy('search_name'), limit(40));
  }, [firestore, user, debouncedSearch, regionFilter, ejerFilter, typeFilter]);

  const { data: institutions, isLoading: isQueryLoading, error } = useCollection<any>(institutionsQuery);

  if (isUserLoading || !user) {
    return <AuthLoadingScreen />;
  }

  const isLoading = isQueryLoading || isUserLoading;

  return (
    <div className="bg-[#FDFCF8] min-h-screen text-slate-900 overflow-x-hidden">
      {/* Header & Hero Section */}
      <header className="relative pt-24 pb-44 overflow-hidden">
        <div className="absolute inset-0 bg-amber-950">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/50 to-amber-950" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-6 relative z-10 text-center"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <Sparkles className="w-4 h-4" />
            Søg i institutionsregistret
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white serif tracking-tight mb-6">
            Find <span className="text-amber-500">Institutionen</span>
          </h1>
          <p className="max-w-2xl mx-auto text-amber-100/60 text-lg md:text-xl font-medium leading-relaxed">
            Søg på tværs af tusindvis af offentlige og private institutioner i Danmark.
          </p>
        </motion.div>
      </header>

      {/* Search Bar Overlay - Moved outside header to prevent clipping */}
      <div className="relative z-30 -mt-12 md:-mt-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-4 md:p-6 rounded-[3rem] shadow-2xl flex flex-col lg:flex-row gap-4 border border-amber-100/50">
            <div className="flex-1 relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text"
                placeholder="Søg på navn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 flex pl-16 pr-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 transition-all outline-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="sm:w-56 relative group">
                <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                <select 
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 flex pl-16 pr-6 text-[11px] font-black uppercase tracking-wider text-slate-900 focus:ring-2 focus:ring-amber-500 appearance-none transition-all outline-none"
                >
                  {regions.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="sm:w-56 relative group">
                <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                <select 
                  value={ejerFilter}
                  onChange={(e) => setEjerFilter(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 flex pl-16 pr-6 text-[11px] font-black uppercase tracking-wider text-slate-900 focus:ring-2 focus:ring-amber-500 appearance-none transition-all outline-none"
                >
                  {ejerformer.map(e => (
                    <option key={e} value={e}>{e === 'Alle' ? 'Ejerform: Alle' : e}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-24">
        {error && (
            <div className="mb-12 p-6 bg-rose-50 border border-rose-200 rounded-[2rem] text-rose-700">
                <p className="font-black uppercase tracking-widest text-[10px] mb-1">System Fejl</p>
                <p className="text-sm font-bold">Der opstod en fejl ved hentning af institutioner: {error.message}</p>
                <p className="text-xs mt-2 opacity-70">Dette skyldes typisk manglende databaseindekser eller rettigheder.</p>
            </div>
        )}
        <div className="flex items-center justify-between mb-12">
           <div>
              <p className="text-[10px] font-black uppercase text-amber-600 tracking-[0.2em] mb-1">Resultater</p>
              <h2 className="text-3xl font-black text-slate-900 serif flex items-center gap-3">
                {isLoading ? 'Henter...' : `${institutions?.length || 0} institutioner fundet`}
                {isLocating && (
                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase rounded-full animate-pulse border border-amber-100">
                      <MapPin className="w-3 h-3" />
                      Finder din lokation...
                   </span>
                )}
              </h2>
           </div>

           <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500">
                 <Layers className="w-3 h-3" />
                 Alle typer
              </div>
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
             </div>
             <p className="text-sm font-black uppercase tracking-widest text-slate-400">Opdaterer dashboard...</p>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {institutions?.map((inst) => (
                <InstitutionCard key={inst.id} inst={inst} />
              ))}
            </AnimatePresence>

            {institutions?.length === 0 && (
                <div className="col-span-full py-32 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 serif">Ingen match fundet</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                        Vi kunne ikke finde nogen institutioner der matcher din søgning eller filtre.
                    </p>
                    <button 
                        onClick={() => {
                            setSearchTerm('');
                            setRegionFilter('Alle');
                        }}
                        className="py-3 px-8 bg-amber-950 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-950 transition-all shadow-xl shadow-amber-950/20"
                    >
                        Nulstil filtre
                    </button>
                </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default InstitutionsPage;
