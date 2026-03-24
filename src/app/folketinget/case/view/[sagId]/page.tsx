
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Loader2, 
  FileText, 
  Calendar, 
  Scale, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Gavel, 
  Download,
  Info,
  ChevronRight,
  BookOpen,
  Sparkles,
  Plus,
  Lock,
  ArrowUpRight,
  MessageSquare,
  Check,
  Zap,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { fetchFolketingetSagById, fetchSagDokumenter, fetchDagsordenspunkter, explainFolketingetSagAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// --- Type definitions ---
interface Sag {
  id: number;
  titel: string;
  nummer: string;
  typeid: number;
  statusid: number;
  opdateringsdato: string;
  resume: string | null;
  Sagstrin: any[];
}

interface SagDokument {
  id: number;
  Dokument?: {
    id: number;
    titel: string;
    procedurenummer: string;
    typeid: number;
    Fil?: { filurl: string }[];
  }
}

interface Dagsordenspunkt {
    id: number;
    titel: string;
    kommentar: string | null;
    mødeid: number;
    Møde?: {
        id: number;
        titel: string;
        dato: string;
    };
    Dokument?: any[];
}

interface DagsordenspunktSag {
    id: number;
    dagsordenspunktid: number;
    sagid: number;
    Dagsordenspunkt?: Dagsordenspunkt;
}

const SagViewPage = () => {
    const params = useParams();
    const sagIdParam = params?.sagId as string;
    const router = useRouter();
    const sagId = Number(sagIdParam);

    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const isPremiumUser = useMemo(() => {
        return userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership || '');
    }, [userProfile]);

    const [sag, setSag] = useState<Sag | null>(null);
    const [dokumenter, setDokumenter] = useState<SagDokument[]>([]);
    const [dagsordenspunkter, setDagsordenspunkter] = useState<DagsordenspunktSag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<{ legalFields: string[], impactSummary: string } | null>(null);



    // Helpers to get type/status strings
    const [typer, setTyper] = useState<{ id: number; type: string }[]>([]);
    const [statusser, setStatusser] = useState<{ id: number; status: string }[]>([]);
    const [dokumenttyper, setDokumenttyper] = useState<{ id: number; type: string }[]>([]);

    // Fetch read documents status
    const readDocsQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'readDocuments')) : null
    ), [user, firestore]);
    const { data: readDocs } = useCollection(readDocsQuery);
    const readDocIds = useMemo(() => new Set(readDocs?.map(d => d.id)), [readDocs]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [typerRes, statusserRes, dokumenttyperRes] = await Promise.all([
                    fetch('https://oda.ft.dk/api/Sagstype').then(res => res.json()),
                    fetch('https://oda.ft.dk/api/Sagsstatus').then(res => res.json()),
                    fetch('https://oda.ft.dk/api/Dokumenttype').then(res => res.json())
                ]);
                setTyper(typerRes.value || []);
                setStatusser(statusserRes.value || []);
                setDokumenttyper(dokumenttyperRes.value || []);
            } catch (err) {
                console.error("Could not fetch filter options:", err);
            }
        };
        fetchFilterOptions();
    }, []);

    const getSagTypeString = (typeid: number) => {
        const type = typer.find(t => t.id === typeid);
        return type ? type.type : `Type ${typeid}`;
    };

    const getSagStatusString = (statusid: number) => {
        const status = statusser.find(s => s.id === statusid);
        return status ? status.status : `Status ${statusid}`;
    };
    
    const vedtagetStatusId = useMemo(() => {
        const vedtagetStatus = statusser.find(s => s.status.toLowerCase() === 'vedtaget');
        return vedtagetStatus ? vedtagetStatus.id : null;
    }, [statusser]);

    const getDokumentTypeString = (typeid: number) => {
        const type = dokumenttyper.find(t => t.id === typeid);
        return type ? type.type : `Dokumenttype ${typeid}`;
    };

    useEffect(() => {
        if (isNaN(sagId)) {
            setError("Ugyldigt sags-ID.");
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [sagData, doksData, agendaData] = await Promise.all([
                    fetchFolketingetSagById(sagId),
                    fetchSagDokumenter(sagId),
                    fetchDagsordenspunkter(sagId)
                ]);

                if (!sagData) {
                    throw new Error('Sagen kunne ikke findes.');
                }
                setSag(sagData);
                setDokumenter(doksData);
                setDagsordenspunkter(agendaData);
                
                // Fetch AI metadata if premium
                if (isPremiumUser) {
                    const { getFTSagMetadataAction } = await import('@/app/actions');
                    const meta = await getFTSagMetadataAction({
                        sagId: sagId,
                        title: sagData.titel,
                        resume: sagData.resume || undefined
                    });
                    if (meta && meta.data) {
                        // @ts-ignore
                        setMetadata(meta.data);
                    }
                }
            } catch (err: any) {

                setError(err.message || "Kunne ikke hente sagsdetaljer.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [sagId]);

    const handleMarkAsRead = (docId: number) => {
        if (!user || !firestore) return;
        const readDocRef = doc(firestore, 'users', user.uid, 'readDocuments', docId.toString());
        setDoc(readDocRef, {
            documentId: docId,
            readAt: serverTimestamp()
        }, { merge: true })
        .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
                path: readDocRef.path,
                operation: 'write',
                requestResourceData: { documentId: docId, readAt: 'serverTimestamp()' },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    };

    const handleAiAnalysis = async () => {
        if (!sag || !isPremiumUser) return;
        setIsAnalysing(true);
        try {
            const result = await explainFolketingetSagAction({
                caseTitle: sag.titel,
                caseResume: sag.resume || undefined,
            });
            setAiAnalysis(result.data.explanation);
        } catch (e) {
            setAiAnalysis("Der skete en fejl i din kollega-sparring.");
            console.error("AI Analyse fejlede", e);
        } finally {
            setIsAnalysing(false);
        }
    };


    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-10">
                    <div className="relative">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-24 h-24 rounded-[2.5rem] border-4 border-slate-100 border-t-rose-500 shadow-xl"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Gavel className="w-8 h-8 text-slate-900" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Åbner Dossier...</p>
                        <p className="text-[10px] font-bold text-slate-400/60 lowercase italic">Henter data direkte fra Folketinget</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !sag) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md space-y-8"
                >
                    <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border border-rose-100/50">
                        <Info className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">{error || 'Ingen sag fundet'}</h2>
                        <p className="text-slate-400 font-medium italic">Den ønskede sag kunne ikke hentes fra Folketingets arkiv.</p>
                    </div>
                    <Link href="/folketinget" className="inline-flex items-center gap-4 px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest transition-all hover:bg-rose-900 hover:-translate-y-1 active:scale-95 shadow-2xl shadow-slate-900/20">
                        <ArrowLeft className="w-5 h-5" /> Gå tilbage
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-rose-100 flex flex-col relative overflow-hidden font-sans">
            {/* Background elements */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.03)_0,transparent_70%)] rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.02)_0,transparent_70%)] rounded-full blur-[120px] pointer-events-none z-0"></div>

            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100/80 px-4 sm:px-8 py-6 md:py-8 transition-all">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => router.back()} 
                            className="p-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all group active:scale-95 shrink-0 shadow-sm"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1.5 transition-transform" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-slate-900/10">
                                    {sag.nummer || 'ID:' + sag.id}
                                </span>
                                <span className="px-3 py-1 bg-white border border-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg">
                                    {getSagTypeString(sag.typeid)}
                                </span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight line-clamp-1">
                                {sag.titel}
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <a 
                            href={`https://www.ft.dk/samling/20231/lovforslag/${sag.nummer}/index.htm`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
                        >
                            Folketinget.dk <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                        </a>
                        <button className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-rose-900 transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                            <Download className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 md:p-12 relative z-10">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
                    
                    <div className="lg:col-span-8 space-y-12">
                        {/* CASE OVERVIEW CARD */}
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/60 backdrop-blur-xl p-8 sm:p-14 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity">
                                <FileText className="w-80 h-80 -rotate-12 translate-x-1/4 -translate-y-1/4" />
                            </div>
                            
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-400">Officielt Resume</h3>
                                            <p className="text-[10px] text-slate-400 font-medium italic">Status: {getSagStatusString(sag.statusid)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border ${
                                        sag.statusid === vedtagetStatusId 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-700/5' 
                                            : 'bg-rose-50 text-rose-700 border-rose-100 shadow-sm shadow-rose-700/5'
                                    }`}>
                                        {getSagStatusString(sag.statusid)}
                                    </div>
                                </div>

                                {sag.resume ? (
                                    <div 
                                        className="prose prose-slate prose-lg max-w-none text-slate-700 leading-[1.8] font-medium" 
                                        dangerouslySetInnerHTML={{ __html: sag.resume }} 
                                    />
                                ) : (
                                    <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold italic">Intet officielt resume tilgængeligt for denne sag.</p>
                                        <p className="text-[10px] text-slate-300 uppercase tracking-widest">Vi afventer dataopdatering fra Folketinget</p>
                                    </div>
                                )}
                            </div>
                        </motion.section>

                        {/* AI QUICK INSIGHT */}
                        {metadata && (
                            <motion.section 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-rose-50/30 border border-rose-100 p-8 sm:p-12 rounded-[3rem] relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
                                    <Sparkles className="w-40 h-40 text-rose-500" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        {(metadata.legalFields || []).map((field, i) => (
                                            <span key={i} className="px-3 py-1 bg-white text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-200 shadow-sm flex items-center gap-2">
                                                <Scale className="w-3.5 h-3.5" />
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-900/60">AI Impact Analyse</h4>
                                        <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-[1.3] tracking-tight">
                                            {metadata.impactSummary}
                                        </p>
                                    </div>
                                </div>
                            </motion.section>
                        )}


                        {/* SAGENS FORLØB (TIMELINE) */}
                        <section className="space-y-10">
                            <div className="flex items-center justify-between px-4">
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    Lovgivningsprocessen
                                </h3>
                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                                        {sag.Sagstrin?.length || 0} trin i alt
                                    </span>
                                </div>
                            </div>
                            
                            <div className="relative pl-12 sm:pl-16 space-y-8">
                                {/* Vertical Timeline Bar */}
                                <div className="absolute left-[23px] sm:left-[31px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-slate-200 via-slate-100 to-transparent"></div>
                                
                                {(sag.Sagstrin || []).sort((a: any, b: any) => new Date(b.dato).getTime() - new Date(a.dato).getTime()).map((sagstrin: any, idx) => (
                                    <motion.div 
                                        key={sagstrin.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="relative group"
                                    >
                                        {/* Timeline Descriptor Dot */}
                                        <div className={`absolute -left-[15px] sm:-left-[23px] md:-left-[31px] top-2 w-4 h-4 rounded-full border-4 border-[#FDFCF8] shadow-sm z-10 transition-all group-hover:scale-125 ${
                                            idx === 0 ? 'bg-rose-500 ring-4 ring-rose-500/20' : 'bg-slate-300 group-hover:bg-slate-900'
                                        }`}></div>
                                        
                                        <div className="bg-white/40 backdrop-blur-sm p-6 sm:p-8 rounded-[2rem] border border-slate-100/50 shadow-sm hover:shadow-xl hover:bg-white hover:border-slate-200 transition-all duration-300 group/item">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-slate-400 group-hover/item:text-rose-500 transition-colors">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                                                        {new Date(sagstrin.dato).toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                {sagstrin.afstemningskonklusion && (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-lg border border-emerald-100 flex items-center gap-2">
                                                        <CheckCircle className="w-3.5 h-3.5 shadow-sm" />
                                                        {sagstrin.afstemningskonklusion}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h4 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug mb-4 decoration-rose-500/20 group-hover/item:underline underline-offset-4">
                                                {sagstrin.titel}
                                            </h4>
                                            
                                            {sagstrin.SagstrinAktør?.[0]?.Aktør && (
                                                <div className="pt-4 border-t border-slate-50 flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200 uppercase overflow-hidden">
                                                        {sagstrin.SagstrinAktør[0].Aktør.navn.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Ansvarlig aktør</p>
                                                        <p className="text-xs text-slate-900 font-bold">
                                                            {sagstrin.SagstrinAktør[0].Aktør.navn}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: METADATA & SIDEBAR */}
                    <aside className="lg:col-span-4 space-y-10">
                        
                        {/* AI ANALYSIS CALLOUT */}
                        <motion.section 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-slate-900 text-white p-8 sm:p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-slate-800"
                        >
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg ring-4 ring-rose-500/20 group-hover:rotate-12 transition-transform duration-500">
                                        <Cpu className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-sm uppercase tracking-widest text-white">AI Perspektivering</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400/80">Eksklusiv analyse</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    {!aiAnalysis && !isAnalysing && (
                                        <>
                                            <p className="text-sm text-slate-300 leading-relaxed font-medium italic">
                                                Lad din AI-kollega analysere betydningen af dette forslag for det socialfaglige område.
                                            </p>
                                            {isPremiumUser ? (
                                                <Button 
                                                    onClick={handleAiAnalysis}
                                                    className="w-full h-16 bg-white text-slate-900 hover:bg-rose-500 hover:text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-[0.98]"
                                                >
                                                    <Zap className="w-4 h-4 mr-2" /> Start Analyse
                                                </Button>
                                            ) : (
                                                <Link href="/upgrade" className="block">
                                                    <Button className="w-full h-16 bg-rose-600 text-white hover:bg-rose-500 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl">
                                                        <Lock className="w-4 h-4 mr-2"/>
                                                        Lås op med Kollega+
                                                    </Button>
                                                </Link>
                                            )}
                                        </>
                                    )}

                                    {isAnalysing && (
                                        <div className="py-12 flex flex-col items-center justify-center space-y-6">
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                className="w-12 h-12 rounded-xl border-2 border-white/10 border-t-rose-500"
                                            />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">Læser lovtekst og referater...</p>
                                        </div>
                                    )}

                                    {aiAnalysis && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-sm leading-relaxed text-slate-100 font-medium prose prose-invert prose-rose"
                                             dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                                            <button 
                                                onClick={() => setAiAnalysis(null)}
                                                className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                Nulstil analyse <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Animated Background Mesh */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-rose-500/15 transition-colors duration-1000"></div>
                        </motion.section>

                        {/* SAGSDOKUMENTER */}
                        <section className="bg-white/60 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-slate-100 shadow-sm group">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                    <Scale className="w-4 h-4" />
                                </div>
                                Dokumenter ({dokumenter.length})
                            </h4>
                            <div className="space-y-4">
                                {dokumenter.map(docData => {
                                    const docId = docData.Dokument?.id;
                                    const isRead = docId ? readDocIds.has(docId.toString()) : false;
                                    const pdfFileUrl = (docData.Dokument?.Fil as any[])?.find(f => f.format === 'PDF')?.filurl || docData.Dokument?.Fil?.[0]?.filurl;
                                    const htmFileUrl = (docData.Dokument?.Fil as any[])?.find(f => f.format === 'HTML' || f.format === 'HTM')?.filurl;
                                    
                                    return (
                                        <div 
                                            key={docData.id} 
                                            className={`flex items-center justify-between p-5 border rounded-[1.5rem] group/doc transition-all hover:-translate-y-1 ${
                                                isRead 
                                                ? 'bg-slate-50/50 border-slate-100 italic' 
                                                : 'bg-white border-slate-100 hover:border-slate-900 shadow-sm hover:shadow-xl'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0 pr-4 space-y-1.5 cursor-pointer" onClick={() => pdfFileUrl && window.open(pdfFileUrl, '_blank')}>
                                                <div className="flex items-center gap-2">
                                                    {isRead && <Check className="w-3 h-3 text-emerald-500" />}
                                                    <p className={`text-[12px] font-black truncate ${isRead ? 'text-slate-400' : 'text-slate-900'}`}>
                                                        {docData.Dokument?.titel || 'Unavngivet Dokument'}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">
                                                    {getDokumentTypeString(docData.Dokument?.typeid ?? 0)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div onClick={() => pdfFileUrl && window.open(pdfFileUrl, '_blank')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/doc:bg-slate-900 group-hover/doc:text-white transition-all cursor-pointer">
                                                    <Download className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {dokumenter.length === 0 && (
                                    <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-400 font-bold italic">Ingen dokumenter fundet.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* DAGSORDENSPUNKTER */}
                        <section className="bg-white/60 backdrop-blur-xl p-8 sm:p-10 rounded-[3rem] border border-slate-100 shadow-sm group">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                                <div className="w-8 h-8 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-center text-rose-500">
                                    <Gavel className="w-4 h-4" />
                                </div>
                                Dagsordenspunkter
                            </h4>
                            <div className="space-y-6">
                                {dagsordenspunkter.map(dpSag => {
                                    if (!dpSag.Dagsordenspunkt) return null;
                                    return (
                                        <div key={dpSag.id} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 hover:bg-white hover:border-rose-200 transition-all group/pun">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Calendar className="w-3.5 h-3.5 text-slate-300 group-hover/pun:text-rose-500 transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {new Date(dpSag.Dagsordenspunkt.Møde?.dato || '').toLocaleDateString('da-DK')}
                                                </span>
                                            </div>
                                            <p className="text-[13px] font-bold text-slate-900 mb-6 leading-relaxed">
                                                {dpSag.Dagsordenspunkt.titel}
                                            </p>
                                            
                                            {dpSag.Dagsordenspunkt.Dokument && dpSag.Dagsordenspunkt.Dokument.length > 0 && (
                                                <div className="space-y-3 pt-6 border-t border-dashed border-slate-200">
                                                    {dpSag.Dagsordenspunkt.Dokument.slice(0, 3).map((dpd: any) => {
                                                        const pdfFileUrl = dpd.Fil?.[0]?.filurl;
                                                        const docId = dpd.id;
                                                        const isRead = docId ? readDocIds.has(docId.toString()) : false;

                                                        return (
                                                            <a 
                                                                key={dpd.id} 
                                                                href={pdfFileUrl} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                onClick={() => docId && handleMarkAsRead(docId)}
                                                                className={`flex items-center gap-3 text-[10px] font-bold truncate transition-colors ${
                                                                    isRead ? 'text-slate-400 italic' : 'text-slate-600 hover:text-rose-600'
                                                                }`}
                                                            >
                                                                <FileText className={`w-3.5 h-3.5 shrink-0 ${isRead ? 'text-slate-200' : 'text-slate-400'}`} />
                                                                <span className="truncate">{dpd.titel}</span>
                                                            </a>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {dagsordenspunkter.length === 0 && (
                                    <p className="text-xs text-slate-400 font-bold italic py-4">Ingen dagsordenspunkter fundet.</p>
                                )}
                            </div>
                        </section>

                        {/* DISCLAIMER */}
                        <div className="p-8 bg-rose-50/50 border border-rose-100 rounded-[2.5rem] flex items-start gap-4">
                            <div className="p-2 bg-white rounded-xl shadow-sm border border-rose-100">
                                <Info className="w-5 h-5 text-rose-500 shrink-0" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-900">Ansvarsfraskrivelse</p>
                                <p className="text-[10px] text-rose-800/60 leading-relaxed font-medium italic">
                                    Data opdateres automatisk via ODA API. AI-perspektivering er maskinskabt sparring og bør altid efterprøves fagligt.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* STICKY BOTTOM ACTION (Only on small screens) */}
            <div className="md:hidden fixed bottom-10 right-8 z-50">
                <button className="w-16 h-16 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:bg-rose-600 hover:scale-110 active:scale-90 transition-all shadow-slate-900/40">
                    <Sparkles className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default SagViewPage;
