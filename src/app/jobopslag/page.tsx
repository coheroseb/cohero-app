'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  Search, 
  MapPin, 
  Clock, 
  Briefcase, 
  ArrowUpRight, 
  Filter, 
  Loader2, 
  Zap, 
  CheckCircle2, 
  Building,
  Star
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobopslagPage() {
  const { user, userProfile, isUserLoading } = useApp();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLawFilter, setActiveLawFilter] = useState('Alle retsområder');

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'jobPostings'),
      where('status', 'in', ['Aktiv', 'Lukker snart']),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: jobs, isLoading: jobsLoading } = useCollection<any>(jobsQuery);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter(job => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (job.title?.toLowerCase() || '').includes(searchLower) || 
        (job.employerName?.toLowerCase() || '').includes(searchLower) ||
        (job.targetLaw?.toLowerCase() || '').includes(searchLower);
      
      if (activeLawFilter !== 'Alle retsområder' && job.targetLaw !== activeLawFilter && job.targetLaw !== 'Alle retsområder') {
          return false;
      }
      return matchesSearch;
    });
  }, [jobs, searchQuery, activeLawFilter]);

  const laws = ['Alle retsområder', 'Barnets Lov', 'Serviceloven', 'Forvaltningsloven', 'Straffeloven'];

  const handleApplyClick = async (job: any) => {
    if (!firestore || !job.id) return;
    try {
        await updateDoc(doc(firestore, 'jobPostings', job.id), {
            views: increment(1)
        });
    } catch (e) {
        console.error("Gik galt ved opdatering af views", e);
    }
    window.open(job.jobUrl, '_blank');
  };

  if (isUserLoading || !user) return <AuthLoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col selection:bg-emerald-100">
      <nav className="bg-white/80 backdrop-blur-2xl border-b border-emerald-50 sticky top-0 z-50 px-4 sm:px-8 py-4 sm:py-6 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center gap-6 md:justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={() => router.back()} 
              className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-emerald-950 hover:text-white transition-all shadow-sm active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-10 w-[1px] bg-slate-100 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/60 leading-none">Offentlige og Private</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 serif tracking-tight flex items-center gap-3">
                Jobopslag <span className="text-slate-200 font-light italic">/</span> <span className="text-slate-400 text-lg sm:text-2xl">Ledige Stillinger</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 max-w-xl">
             <div className="relative flex-1 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="text" 
                  placeholder="Søg stilling, kommune eller område..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-200 focus:outline-none transition-all shadow-inner text-sm font-semibold text-slate-900 placeholder:text-slate-300"
                />
             </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 py-8 sm:py-16 grid lg:grid-cols-12 gap-8 sm:gap-12">
        <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-36 h-fit order-2 lg:order-1">
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-emerald-100/50 shadow-2xl shadow-emerald-950/5 space-y-8">
             <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Fokusområde / Lov
                </h4>
                <div className="flex flex-col gap-2">
                    {laws.map((law) => (
                        <button 
                            key={law}
                            onClick={() => setActiveLawFilter(law)}
                            className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                activeLawFilter === law 
                                ? 'bg-emerald-950 text-white shadow-xl shadow-emerald-950/20' 
                                : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-950'
                            }`}
                        >
                            {law}
                        </button>
                    ))}
                </div>
             </div>
          </div>

          <div className="group p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-transform hover:-translate-y-1">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <Building className="w-32 h-32 -rotate-12 outline-none" />
             </div>
             <div className="relative z-10 space-y-4">
                <div className="w-10 h-10 bg-emerald-400/20 text-emerald-400 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-black serif">Verificerede arbejdsgivere</h4>
                <p className="text-[12px] font-medium text-slate-400 leading-relaxed">
                  Alle opslag her er oprettet direkte af verificerede arbejdsgivere som søger kandidater med lige præcis din fagprofil.
                </p>
             </div>
          </div>
        </aside>

        <main className="lg:col-span-9 space-y-6 sm:space-y-8 order-1 lg:order-2">
           {jobsLoading ? (
             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-950" />
                <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Henter jobopslag...</p>
             </div>
           ) : (
             <div className="grid gap-6 sm:gap-10">
              <AnimatePresence>
                {filteredJobs.map(job => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={job.id}
                    className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-emerald-100/50 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-950/5 transition-all duration-500 group relative"
                  >
                    <div className="absolute top-8 right-8 flex flex-col items-end gap-3 z-10">
                        {job.status === 'Lukker snart' && (
                            <div className="bg-amber-100 text-amber-700 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse shadow-sm border border-amber-200/50">
                                <Clock className="w-3 h-3" /> Lukker Snart
                            </div>
                        )}
                    </div>

                    <div className="p-8 sm:p-14 flex flex-col md:flex-row gap-8 sm:gap-12 items-start md:items-center">
                      
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center text-slate-300 shadow-inner shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-transform">
                          <Building2 className="w-10 h-10" />
                      </div>

                      <div className="flex-1 space-y-5 w-full">
                        <div className="space-y-3 mt-2 sm:mt-0">
                          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 serif tracking-tight leading-[1] max-w-2xl group-hover:text-emerald-900 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3">
                              <span className="text-base font-bold text-slate-600 flex items-center gap-1.5">
                                  {job.employerName}
                              </span>
                              <div className="w-1 h-1 bg-slate-200 rounded-full" />
                              <span className="text-[11px] font-black uppercase text-emerald-600 tracking-widest px-2.5 py-1 bg-emerald-50 rounded-lg">{job.type}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-slate-50">
                          <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Erfaringsniveau</p>
                              <div className="flex items-center gap-2 text-slate-700">
                                  <Briefcase className="w-3.5 h-3.5" />
                                  <span className="text-sm font-bold">{job.experienceLevel || 'Ikke oplyst'}</span>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Primært Område</p>
                              <div className="flex items-center gap-2 text-slate-700">
                                  <Star className="w-3.5 h-3.5 text-amber-500" />
                                  <span className="text-sm font-bold">{job.targetLaw || 'Alle retsområder'}</span>
                              </div>
                          </div>
                          <div className="space-y-1 md:col-span-1 col-span-2">
                              {job.createdAt && (
                                  <>
                                  <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Oprettet</p>
                                  <div className="flex items-center gap-2 text-slate-500">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span className="text-sm font-medium">{job.createdAt.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}</span>
                                  </div>
                                  </>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-auto pt-6 md:pt-0 border-t border-slate-50 md:border-none flex items-center justify-end">
                          <button 
                            onClick={() => handleApplyClick(job)}
                            className="w-full md:w-auto px-8 py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group/btn hover:shadow-emerald-600/20 border border-slate-900 hover:border-emerald-600"
                          >
                             Læs & Ansøg <ArrowUpRight className="w-4 h-4 group-hover/btn:rotate-45 transition-transform" />
                          </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredJobs.length === 0 && (
                <div className="py-24 sm:py-32 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200/50">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
                        <Zap className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 serif mb-2">Ingen opslag lige nu</h3>
                    <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm">Vi har ingen aktuelle jobopslag der matcher din søgning. Tjek igen senere!</p>
                </div>
              )}
             </div>
           )}
        </main>
      </div>
    </div>
  );
}
