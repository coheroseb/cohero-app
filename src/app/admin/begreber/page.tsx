
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, deleteDoc } from 'firebase/firestore';
import { 
  Search, 
  BrainCircuit, 
  Trash2, 
  Eye, 
  Clock, 
  Layout, 
  Filter, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Brain,
  History,
  Zap,
  ArrowRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import ConceptModelMap from '@/components/concept/ConceptModelMap';

interface ConceptExplanation {
  id: string;
  conceptName: string;
  profession: string;
  createdAt: any;
  explanation: any;
}

export default function AdminConceptsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Queries
  const conceptsQuery = useMemoFirebase(() => (
    firestore ? query(collection(firestore, 'conceptExplanations-v2'), orderBy('createdAt', 'desc'), limit(500)) : null
  ), [firestore]);
  
  const { data: rawConcepts, isLoading } = useCollection<ConceptExplanation>(conceptsQuery);
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [professionFilter, setProfessionFilter] = useState('all');
  const [selectedConcept, setSelectedConcept] = useState<ConceptExplanation | null>(null);
  const [showModelOnly, setShowModelOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter & Search
  const filteredConcepts = useMemo(() => {
    if (!rawConcepts) return [];
    let result = [...rawConcepts];
    
    if (searchTerm) {
      result = result.filter(c => c.conceptName.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    if (professionFilter !== 'all') {
      result = result.filter(c => c.profession === professionFilter);
    }
    
    if (showModelOnly) {
       result = result.filter(c => c.explanation?.isModel);
    }
    
    return result;
  }, [rawConcepts, searchTerm, professionFilter, showModelOnly]);

  // Stats
  const stats = useMemo(() => {
    if (!rawConcepts) return { total: 0, models: 0, latest: null };
    return {
      total: rawConcepts.length,
      models: rawConcepts.filter(c => c.explanation?.isModel).length,
      latest: rawConcepts[0]?.conceptName
    };
  }, [rawConcepts]);

  // Pagination
  const totalPages = Math.ceil(filteredConcepts.length / itemsPerPage);
  const paginatedConcepts = filteredConcepts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id: string, name: string) => {
    if (!firestore || !window.confirm(`Er du sikker på du vil slette forklaringen til "${name}"? Dette kan ikke fortrydes.`)) return;
    
    try {
      await deleteDoc(doc(firestore, 'conceptExplanations-v2', id));
      toast({ title: 'Slettet', description: `Begrebet "${name}" er fjernet fra databasen.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Fejl', description: 'Kunne ikke slette begrebet.' });
    }
  };

  return (
    <div className="space-y-10 animate-ink pb-20">
      
      {/* 1. Header & Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-400 flex items-center justify-center shadow-xl shadow-amber-950/20">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 serif">Vidensbase: Begreber</h1>
                    <p className="text-slate-500 font-medium">Overblik over alle AI-genererede forklaringer og visuelle modeller.</p>
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-tight">Totale Opslag</p>
                  <div className="text-3xl font-black text-slate-900 serif mt-2">{stats.total}</div>
              </div>
              <div className="bg-amber-950 p-6 rounded-[2rem] border border-amber-900/10 flex flex-col justify-between shadow-xl">
                  <p className="text-[10px] font-black uppercase text-amber-400/60 tracking-widest leading-tight">Aktive Modeller</p>
                  <div className="text-3xl font-black text-amber-400 serif mt-2">{stats.models}</div>
              </div>
          </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Find specifikt begreb..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-amber-950/5 outline-none transition-all text-sm font-bold"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
              <select 
                value={professionFilter}
                onChange={(e) => setProfessionFilter(e.target.value)}
                className="h-14 px-6 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-amber-950/5 cursor-pointer shadow-sm"
              >
                  <option value="all">Alle Professioner</option>
                  <option value="Socialrådgiver">Socialrådgiver</option>
                  <option value="Pædagog">Pædagog</option>
                  <option value="Generel">Generel</option>
              </select>

              <button 
                onClick={() => setShowModelOnly(!showModelOnly)}
                className={`h-14 px-6 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                  showModelOnly ? 'bg-amber-950 text-amber-400 shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'
                }`}
              >
                <Layout className="w-4 h-4" />
                {showModelOnly ? 'Kun Modeller' : 'Alle'}
              </button>
          </div>
      </div>

      {/* 3. Data Table */}
      <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-32">
              <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Indlæser vidensbase...</p>
            </div>
          ) : filteredConcepts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-6">
                <BrainCircuit className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900 serif">Ingen begreber fundet</h3>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Vi kunne ikke finde nogen AI-forklaringer der matcher dine søgekriterier.</p>
              <Button 
                variant="outline" 
                className="mt-8 rounded-xl border-slate-100"
                onClick={() => { setSearchTerm(''); setProfessionFilter('all'); setShowModelOnly(false); }}
              >
                Ryd Filtre
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Begreb & Status</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Profession</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Model</th>
                      <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Dato</th>
                      <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Handling</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedConcepts.map((concept, idx) => (
                      <motion.tr 
                        key={concept.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedConcept(concept)}
                      >
                        <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-amber-950 transition-colors">
                                    <Brain className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 group-hover:text-amber-950 transition-colors serif text-lg">{concept.conceptName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate max-w-[200px]">ID: {concept.id.split('--')[0]}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-10 py-6">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              concept.profession === 'Pædagog' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                              concept.profession === 'Socialrådgiver' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>
                                {concept.profession}
                            </span>
                        </td>
                        <td className="px-10 py-6">
                            {concept.explanation?.isModel ? (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <Layout className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Model Aktiv</span>
                                </div>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Kun Tekst</span>
                            )}
                        </td>
                        <td className="px-10 py-6">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">
                                    {concept.createdAt?.toDate ? concept.createdAt.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Ej sat'}
                                </span>
                            </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-amber-950 hover:shadow-sm transition-all">
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(concept.id, concept.conceptName); }}
                                  className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all font-bold"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-10 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Viser {Math.min(filteredConcepts.length, (currentPage-1)*itemsPerPage + 1)}-{Math.min(filteredConcepts.length, currentPage*itemsPerPage)} af {filteredConcepts.length} begreber
                  </p>
                  <div className="flex items-center gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-black px-4 text-slate-600">{currentPage} / {totalPages}</span>
                      <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                  </div>
              </div>
            </>
          )}
      </section>

      {/* 4. Detail Modal */}
      <AnimatePresence>
        {selectedConcept && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md overflow-hidden">
             <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-6xl max-h-[90vh] bg-white rounded-[4rem] shadow-2xl flex flex-col relative overflow-hidden"
             >
                <button 
                  onClick={() => setSelectedConcept(null)}
                  className="absolute top-10 right-10 p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all z-20"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex-1 overflow-y-auto p-12 md:p-20 custom-scrollbar">
                   <div className="grid lg:grid-cols-12 gap-16">
                      
                      {/* Left: Metadata & Map */}
                      <div className="lg:col-span-12 xl:col-span-7 space-y-12">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center text-amber-400 shadow-lg"><BrainCircuit className="w-5 h-5" /></div>
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Begrebs-Analyse</span>
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 serif tracking-tighter">{selectedConcept.conceptName}</h2>
                            <div className="flex flex-wrap gap-3">
                                <span className="px-4 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">{selectedConcept.profession}</span>
                                {selectedConcept.explanation?.isModel && <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Visuel Model Inkluderet</span>}
                            </div>
                          </div>

                          {/* 
                          {selectedConcept.explanation?.isModel && selectedConcept.explanation?.conceptModel && (
                             <div className="aspect-video bg-[#FDFCF8] rounded-[3rem] border border-amber-50 shadow-inner relative overflow-hidden flex flex-col group">
                                <div className="p-6 border-b border-amber-100/30 flex items-center justify-between relative z-10 bg-white/5 backdrop-blur-sm">
                                   <div className="flex items-center gap-2">
                                      <Layout className="w-4 h-4 text-amber-950" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">Mental Map Preview</span>
                                   </div>
                                </div>
                                <div className="flex-1 p-4 relative">
                                   <ConceptModelMap model={selectedConcept.explanation.conceptModel} />
                                </div>
                             </div>
                          )}
                          */}

                          <div className="space-y-8">
                             <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><History className="w-4 h-4" /></div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Definition</h3>
                             </div>
                             <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-serif italic" dangerouslySetInnerHTML={{ __html: selectedConcept.explanation?.definition }} />
                          </div>
                      </div>

                      {/* Right: Insights */}
                      <div className="lg:col-span-12 xl:col-span-5 space-y-10">
                          <div className="bg-slate-900 p-12 rounded-[3rem] text-white space-y-8 relative overflow-hidden group">
                             <Zap className="absolute top-0 right-0 w-40 h-40 text-white/5 -translate-y-6 translate-x-6 group-hover:rotate-12 transition-transform" />
                             <div className="relative z-10 space-y-8">
                                <div>
                                   <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-6">Praksis-Relevans</h4>
                                   <div className="text-sm text-slate-300 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: selectedConcept.explanation?.relevance }} />
                                </div>
                                {selectedConcept.explanation?.practicalExample && (
                                  <div className="pt-8 border-t border-white/10">
                                     <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-6">Case Eksempel</h4>
                                     <div className="text-sm italic text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: selectedConcept.explanation?.practicalExample }} />
                                  </div>
                                )}
                             </div>
                          </div>

                          {selectedConcept.explanation?.legalContext && (
                             <div className="p-12 bg-indigo-50/50 border border-indigo-100 rounded-[3rem] space-y-8">
                                <div className="flex items-center justify-between border-b border-indigo-100 pb-6">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Zap className="w-4 h-4" /></div>
                                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Juridisk Forbindelse</h4>
                                   </div>
                                   <span className="text-2xl font-black serif text-indigo-900">§ {selectedConcept.explanation.legalContext.paragraphNumber}</span>
                                </div>
                                <p className="text-xs font-bold text-indigo-900/60 uppercase tracking-widest">{selectedConcept.explanation.legalContext.lawTitle}</p>
                                <div className="text-sm text-slate-600 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: `"${selectedConcept.explanation.legalContext.exactText}"` }} />
                             </div>
                          )}

                          <div className="p-10 border-2 border-dashed border-slate-100 rounded-[3rem] text-center">
                             <ShieldAlert className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-6">System Handlinger</p>
                             <div className="flex flex-col gap-3">
                                <Button 
                                  variant="outline" 
                                  className="w-full rounded-2xl h-12 border-slate-100"
                                  onClick={() => {
                                     window.open(`/concept-explainer?term=${encodeURIComponent(selectedConcept.conceptName)}`, '_blank');
                                  }}
                                >
                                   Se på Live Site
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  className="w-full rounded-2xl h-12 shadow-xl shadow-rose-600/10"
                                  onClick={() => {
                                     handleDelete(selectedConcept.id, selectedConcept.conceptName);
                                     setSelectedConcept(null);
                                  }}
                                >
                                   Slet permanent
                                </Button>
                             </div>
                          </div>
                      </div>

                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

