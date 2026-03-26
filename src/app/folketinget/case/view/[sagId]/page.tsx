
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
  ArrowRight,
  Activity,
  History
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
            {/* Elegant Background Decor */}
            <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.02)_0,transparent_70%)] rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-0 left-0 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.01)_0,transparent_70%)] rounded-full blur-[120px] pointer-events-none z-0"></div>

            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-6 py-6 transition-all">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => router.back()} 
                            className="w-12 h-12 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm shrink-0 group"
                        >
                             <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="p-1 bg-slate-900 rounded-lg shadow-lg">
                                    <Activity className="w-3.5 h-3.5 text-white" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Legislativ Detailanalyse</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                {sag!.nummer}: {sag!.titel}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`px-5 h-12 flex items-center rounded-2xl text-[11px] font-black uppercase tracking-widest border shadow-sm ${
                            sag!.statusid === vedtagetStatusId 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                            {getSagStatusString(sag!.statusid)}
                        </div>
                        <div className="h-6 w-px bg-slate-200 mx-2 hidden lg:block"></div>
                        <a 
                            href={`https://www.ft.dk/samling/20231/lovforslag/${sag!.nummer}/index.htm`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                            Folketinget.dk
                            <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
                    
                    {/* LEFT COLUMN: PRIMARY WORKSPACE */}
                    <div className="lg:col-span-8 space-y-20">
                        
                        {/* CASE DOSSIER HEADER */}
                        <section className="space-y-10">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-[16px] font-black uppercase tracking-widest text-slate-900">Sagsmappe & Resume</h2>
                                </div>
                                <div className="h-px flex-1 bg-slate-100 mx-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Officiel data</span>
                            </div>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white p-10 sm:p-14 rounded-[40px] border border-slate-100 shadow-sm relative group overflow-hidden"
                            >
                                <div className="absolute -right-20 -top-20 w-80 h-80 bg-slate-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="relative z-10">
                                    {sag!.resume ? (
                                        <div 
                                            className="prose prose-slate prose-lg max-w-none text-slate-700 leading-[1.8] font-medium selection:bg-rose-100" 
                                            dangerouslySetInnerHTML={{ __html: sag!.resume || '' }} 
                                        />
                                    ) : (
                                        <div className="py-24 text-center space-y-6 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                                                <Info className="w-8 h-8 text-slate-200" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-slate-400 font-bold italic">Intet officielt resume tilgængeligt for denne sag.</p>
                                                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black">Datakilde: Oda FT (Folketingets Åbne Data)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </section>

                        {/* WORKFLOW TIMELINE */}
                        <section className="space-y-12">
                             <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-[16px] font-black uppercase tracking-widest text-slate-900">Behandlingsforløb</h2>
                                </div>
                                <div className="h-px flex-1 bg-slate-100 mx-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                <div className="px-4 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none shrink-0">
                                    {sag!.Sagstrin?.length || 0} trin
                                </div>
                            </div>

                            <div className="relative pl-10 sm:pl-12 space-y-10">
                                <div className="absolute left-[19px] sm:left-[23px] top-4 bottom-4 w-px bg-slate-200"></div>
                                
                                {(sag!.Sagstrin || []).sort((a: any, b: any) => new Date(b.dato).getTime() - new Date(a.dato).getTime()).map((sagstrin: any, idx) => (
                                    <motion.div 
                                        key={sagstrin.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="relative group/step"
                                    >
                                        <div className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-[#FDFCF8] shadow-sm z-10 transition-all ${
                                            idx === 0 ? 'bg-slate-900 ring-4 ring-slate-900/10 scale-125' : 'bg-slate-300'
                                        }`}></div>
                                        
                                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-900 transition-all duration-500">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {new Date(sagstrin.dato).toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                    {sagstrin.afstemningskonklusion && (
                                                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div>
                                                            {sagstrin.afstemningskonklusion}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <h4 className="text-xl font-black text-slate-900 tracking-tight leading-snug mb-6">
                                                {sagstrin.titel}
                                            </h4>
                                            
                                            {sagstrin.SagstrinAktør?.[0]?.Aktør && (
                                                <div className="flex gap-4 items-center pt-6 border-t border-slate-50">
                                                    <div className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-[11px] font-black text-slate-400 border border-slate-100 uppercase">
                                                       {sagstrin.SagstrinAktør[0].Aktør.navn.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Indstillet af</span>
                                                        <span className="text-[13px] font-bold text-slate-900">{sagstrin.SagstrinAktør[0].Aktør.navn}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: WORK TOOLS & METADATA */}
                    <aside className="lg:col-span-4 space-y-12">
                        
                        {/* AI ANALYSIS WORKSPACE */}
                        <motion.section 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-900 p-8 sm:p-10 rounded-[40px] shadow-2xl relative overflow-hidden group"
                        >
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-xl group-hover:rotate-6 transition-transform">
                                        <Sparkles className="w-6 h-6 fill-slate-900" />
                                    </div>
                                    <div>
                                        <h3 className="text-[14px] font-black uppercase tracking-widest text-white">AI Sparringspartner</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Eksklusiv analyse</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-6">
                                    {!aiAnalysis && !isAnalysing && (
                                        <>
                                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                                Få en dybdegående sparring om forslagets betydning for dit specifikke felt.
                                            </p>
                                            {isPremiumUser ? (
                                                <button 
                                                    onClick={handleAiAnalysis}
                                                    className="w-full h-16 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]"
                                                >
                                                    <Zap className="w-4 h-4" /> Begynd sparring
                                                </button>
                                            ) : (
                                                <Link href="/upgrade" className="block">
                                                    <button className="w-full h-16 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 active:scale-[0.98]">
                                                        <Lock className="w-4 h-4"/> Opgrader til Kollega+
                                                    </button>
                                                </Link>
                                            )}
                                        </>
                                    )}

                                    {isAnalysing && (
                                        <div className="py-12 flex flex-col items-center justify-center gap-6">
                                            <Loader2 className="w-10 h-10 text-white animate-spin opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">Analyserer...</p>
                                        </div>
                                    )}

                                    {aiAnalysis && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-6"
                                        >
                                            <div className="p-7 bg-white/5 border border-white/10 rounded-[32px] text-sm leading-relaxed text-slate-200 font-medium prose prose-invert prose-rose"
                                             dangerouslySetInnerHTML={{ __html: aiAnalysis || '' }} />
                                            <button 
                                                onClick={() => setAiAnalysis(null)}
                                                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                Nulstil sparring <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                            {/* Static Gradient Overlay */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32"></div>
                        </motion.section>

                        {/* CASE IMPACT SUMMARY (AI GENERATED METADATA) */}
                        {metadata && (
                            <section className="bg-amber-400 p-10 rounded-[40px] relative overflow-hidden group">
                                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-amber-500/30 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                                <div className="relative z-10 space-y-6">
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-950/60">Hurtig Oversigt</h4>
                                    <div className="space-y-4">
                                        <p className="text-xl font-black text-amber-950 tracking-tight leading-tight">
                                           {metadata?.impactSummary}
                                        </p>
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {(metadata?.legalFields || []).map((field, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-amber-950/10 text-amber-950 text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-950/10">
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* WORKSPACE DOCUMENTS */}
                        <section className="space-y-8">
                            <div className="flex items-center gap-4 px-2">
                                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <h3 className="text-[14px] font-black uppercase tracking-widest text-slate-900">Arbejdsdokumenter</h3>
                            </div>

                            <div className="space-y-3">
                                {dokumenter.map(docData => {
                                    const docId = docData.Dokument?.id;
                                    const isRead = docId ? readDocIds.has(docId.toString()) : false;
                                    const pdfFileUrl = (docData.Dokument?.Fil as any[])?.find(f => f.format === 'PDF')?.filurl || docData.Dokument?.Fil?.[0]?.filurl;
                                    
                                    return (
                                        <div 
                                            key={docData.id} 
                                            className={`group/doc flex items-center justify-between p-5 border rounded-[2rem] transition-all hover:border-slate-900 hover:shadow-xl hover:shadow-slate-900/5 ${
                                                isRead 
                                                ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                                                : 'bg-white border-slate-100'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0 pr-4 cursor-pointer" onClick={() => pdfFileUrl && window.open(pdfFileUrl, '_blank')}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isRead && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                                                    <p className="text-[13px] font-bold text-slate-900 truncate">
                                                        {docData.Dokument?.titel || 'Unavngivet Dokument'}
                                                    </p>
                                                </div>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                    {getDokumentTypeString(docData.Dokument?.typeid ?? 0)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => pdfFileUrl && window.open(pdfFileUrl, '_blank')}
                                                    className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white transition-all shadow-sm group-hover/doc:scale-110"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {dokumenter.length === 0 && (
                                    <div className="py-12 text-center bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Ingen dokumenter fundet</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* DISCLAIMER BOX */}
                        <div className="p-8 bg-slate-100/50 rounded-[32px] flex items-start gap-4">
                            <Info className="w-5 h-5 text-slate-400 shrink-0" />
                            <p className="text-[10px] text-slate-400 leading-relaxed font-bold italic">
                                Denne side monitoreres løbende. AI-analyser er sparringsforslag og bør altid efterprøves i en socialfaglig kontekst.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default SagViewPage;
