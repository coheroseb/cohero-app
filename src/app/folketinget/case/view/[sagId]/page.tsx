
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
  Check
} from 'lucide-react';
import { fetchFolketingetSagById, fetchSagDokumenter, fetchDagsordenspunkter, explainFolketingetSagAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
    const sagIdParam = params.sagId as string;
    const router = useRouter();
    const sagId = Number(sagIdParam);

    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const isPremiumUser = useMemo(() => userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership), [userProfile]);

    const [sag, setSag] = useState<Sag | null>(null);
    const [dokumenter, setDokumenter] = useState<SagDokument[]>([]);
    const [dagsordenspunkter, setDagsordenspunkter] = useState<DagsordenspunktSag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // AI Analysis state
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

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
                caseResume: sag.resume,
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
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 animate-spin text-amber-900/20" />
                        <Gavel className="absolute inset-0 m-auto w-6 h-6 text-amber-900 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-900/40">Henter sag fra ODA...</p>
                </div>
            </div>
        );
    }

    if (error || !sag) {
        return (
            <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                        <Info className="w-10 h-10 text-rose-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-950 serif">{error || 'Ingen sag fundet'}</h2>
                    <Link href="/folketinget" className="inline-flex items-center gap-2 px-8 py-4 bg-amber-950 text-white rounded-2xl font-bold transition-transform hover:scale-105">
                        <ArrowLeft className="w-4 h-4" /> Tilbage til oversigten
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-amber-100">
            
            {/* 1. OFFICIAL DOSSIER HEADER - Mobile Optimized */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-amber-100 px-4 sm:px-6 py-6 sm:py-12 sticky top-24 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8">
                        <div className="flex items-start gap-4 sm:gap-6">
                            <button onClick={() => router.back()} className="mt-1 p-2 sm:p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all group active:scale-95 shrink-0">
                                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </button>
                            <div className="space-y-3 sm:space-y-4">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                    <span className="px-2.5 py-1 bg-amber-950 text-amber-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-white/10">
                                        {sag.nummer || 'ID:' + sag.id}
                                    </span>
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg border border-amber-100">
                                        {getSagTypeString(sag.typeid)}
                                    </span>
                                    <span className={`px-2.5 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                                        sag.statusid === vedtagetStatusId 
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                                    }`}>
                                        {sag.statusid === vedtagetStatusId && <CheckCircle className="w-3 h-3" />}
                                        {getSagStatusString(sag.statusid)}
                                    </span>
                                </div>
                                <h1 className="text-lg sm:text-2xl font-bold text-amber-950 serif leading-tight max-w-4xl animate-ink line-clamp-3 sm:line-clamp-none">
                                    {sag.titel}
                                </h1>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                            <button className="flex-1 md:flex-none p-4 bg-white border border-amber-100 rounded-2xl text-amber-950 hover:bg-amber-50 transition-all shadow-sm flex items-center justify-center">
                                <Download className="w-5 h-5" />
                            </button>
                            <a href={`https://www.ft.dk/samling/20231/lovforslag/${sag.nummer}/index.htm`} target="_blank" rel="noreferrer" className="flex-[3] md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-amber-950 text-white rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:bg-amber-900 transition-all shadow-xl shadow-amber-950/20">
                                FT.dk <ExternalLink className="w-4 h-4 text-amber-400" />
                            </a>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-12">
                <div className="grid lg:grid-cols-12 gap-8 md:gap-12">
                    
                    {/* LEFT COLUMN: THE SUBSTANCE */}
                    <div className="lg:col-span-8 space-y-10 md:space-y-12">
                        
                        {/* CASE RESUME */}
                        <section className="bg-white p-6 sm:p-10 md:p-16 rounded-[2.5rem] sm:rounded-[4rem] border border-amber-100 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                                <FileText className="w-96 h-96 -rotate-12" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6 sm:mb-10 text-amber-900/40">
                                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Officielt Resume</span>
                                </div>
                                {sag.resume ? (
                                    <div 
                                        className="prose prose-amber prose-sm sm:prose-lg max-w-none text-slate-700 leading-[1.8] serif italic" 
                                        dangerouslySetInnerHTML={{ __html: sag.resume }} 
                                    />
                                ) : (
                                    <p className="text-slate-400 italic text-sm">Inget officielt resume tilgængeligt for denne sag.</p>
                                )}
                            </div>
                        </section>

                        {/* SAGENS FORLØB (TIMELINE) */}
                        <section className="space-y-8 sm:space-y-10">
                            <div className="flex items-center justify-between px-2 sm:px-4">
                                <h3 className="text-lg sm:text-xl font-bold text-amber-950 serif flex items-center gap-3">
                                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
                                    Lovgivningsprocessen
                                </h3>
                                <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {sag.Sagstrin?.length || 0} trin
                                </span>
                            </div>
                            
                            <div className="relative pl-8 sm:pl-12 md:pl-20 space-y-6 sm:space-y-8">
                                {/* Timeline line */}
                                <div className="absolute left-[15px] sm:left-[23px] md:left-[31px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-amber-200 via-amber-100 to-transparent"></div>
                                
                                {(sag.Sagstrin || []).sort((a: any, b: any) => new Date(b.dato).getTime() - new Date(a.dato).getTime()).map((sagstrin: any, idx) => (
                                    <div key={sagstrin.id} className="relative group">
                                        {/* Dot */}
                                        <div className={`absolute -left-[15px] sm:-left-[23px] md:-left-[31px] top-1.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-[3px] sm:border-4 border-[#FDFCF8] shadow-md z-10 transition-transform group-hover:scale-125 ${
                                            idx === 0 ? 'bg-amber-950 animate-pulse' : 'bg-amber-200'
                                        }`}></div>
                                        
                                        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-amber-50 shadow-sm group-hover:shadow-md group-hover:border-amber-950 transition-all">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                                                <p className="text-[8px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                    {new Date(sagstrin.dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                                {sagstrin.afstemningskonklusion && (
                                                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-emerald-50 text-emerald-700 text-[8px] sm:text-[10px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-1 sm:gap-1.5 self-start sm:self-center">
                                                        <CheckCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                                        {sagstrin.afstemningskonklusion}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-base sm:text-lg text-amber-950 serif group-hover:text-amber-800 transition-colors leading-snug">
                                                {sagstrin.titel}
                                            </h4>
                                            {sagstrin.SagstrinAktør?.[0]?.Aktør && (
                                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-50 flex items-center gap-2">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 flex items-center justify-center text-[7px] sm:text-[8px] font-black text-slate-400 uppercase">
                                                        {sagstrin.SagstrinAktør[0].Aktør.navn.charAt(0)}
                                                    </div>
                                                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium">
                                                        Fremført af: <span className="text-amber-900 font-bold">{sagstrin.SagstrinAktør[0].Aktør.navn}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: METADATA & SIDEBAR - Stacks after main content on mobile */}
                    <aside className="lg:col-span-4 space-y-8 md:space-y-10">
                        
                        {/* AI ANALYSIS CALLOUT */}
                        <section className="bg-amber-950 text-white p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-400 rounded-xl flex items-center justify-center text-amber-950 shadow-inner group-hover:rotate-6 transition-transform">
                                        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold serif text-sm sm:text-base">Faglig Perspektivering</h3>
                                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-400">Eksklusivt for Cohéro</p>
                                    </div>
                                </div>
                                
                                {!aiAnalysis && !isAnalysing && (
                                    <div className="space-y-5 sm:space-y-6">
                                        <p className="text-xs sm:text-sm text-amber-100/60 leading-relaxed italic">
                                            Lad din AI-kollega analysere betydningen af dette forslag for socialrådgiverens professionelle skøn.
                                        </p>
                                        {isPremiumUser ? (
                                            <Button 
                                                onClick={handleAiAnalysis}
                                                className="w-full bg-amber-400 text-amber-950 hover:bg-white text-[10px] sm:text-xs"
                                            >
                                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" /> Start AI-Analyse
                                            </Button>
                                        ) : (
                                            <Link href="/upgrade" className="block">
                                                <Button className="w-full bg-amber-400 text-amber-900 hover:bg-amber-300 text-[10px] sm:text-xs">
                                                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2"/>
                                                    Opgrader for at analysere
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}

                                {isAnalysing && (
                                    <div className="py-10 sm:py-12 flex flex-col items-center justify-center space-y-4">
                                        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-amber-400" />
                                        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-amber-100/40 animate-pulse">Læser lovtekst...</p>
                                    </div>
                                )}

                                {aiAnalysis && (
                                    <div className="space-y-5 sm:space-y-6 animate-ink">
                                        <div className="p-5 sm:p-6 bg-white/5 border border-white/10 rounded-2xl text-xs sm:text-sm leading-relaxed text-amber-50 font-medium prose prose-sm prose-invert"
                                         dangerouslySetInnerHTML={{ __html: aiAnalysis }} />
                                        <button 
                                            onClick={() => setAiAnalysis(null)}
                                            className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-amber-400 underline underline-offset-4"
                                        >
                                            Nulstil
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                        </section>

                        {/* SAGSDOKUMENTER */}
                        <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-amber-100 shadow-sm group">
                            <h4 className="text-xs sm:text-sm font-black uppercase text-slate-400 mb-6 sm:mb-8 tracking-widest flex items-center gap-2">
                                <Scale className="w-4 h-4 text-amber-700" /> Dokumenter ({dokumenter.length})
                            </h4>
                            <div className="space-y-3">
                                {dokumenter.map(docData => {
                                    const docId = docData.Dokument?.id;
                                    const isRead = docId ? readDocIds.has(docId.toString()) : false;
                                    const pdfFileUrl = docData.Dokument?.Fil?.[0]?.filurl;
                                    
                                    return (
                                        <a 
                                            key={docData.id} 
                                            href={pdfFileUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            onClick={() => docId && handleMarkAsRead(docId)}
                                            className={`flex items-center justify-between p-4 border rounded-2xl group/doc transition-all hover:bg-white cursor-pointer ${
                                                isRead 
                                                ? 'bg-slate-50 border-slate-100 opacity-70 grayscale-[0.5]' 
                                                : 'bg-amber-50/30 border-amber-50 hover:border-amber-950'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {isRead && (
                                                        <span className="flex items-center gap-1 text-[7px] sm:text-[8px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                                                            <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Læst
                                                        </span>
                                                    )}
                                                    <p className={`text-[11px] sm:text-xs font-bold truncate transition-colors ${isRead ? 'text-slate-500' : 'text-amber-950 group-hover/doc:text-amber-700'}`}>
                                                        {docData.Dokument?.titel || 'Unavngivet Dokument'}
                                                    </p>
                                                </div>
                                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                                                    {getDokumentTypeString(docData.Dokument?.typeid ?? 0)}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 group-hover/doc:translate-x-1 group-hover/doc:text-amber-950 transition-all" />
                                        </a>
                                    );
                                })}
                                {dokumenter.length === 0 && (
                                    <p className="text-xs text-slate-400 italic py-4">Ingen dokumenter fundet.</p>
                                )}
                            </div>
                        </section>

                        {/* DAGSORDENSPUNKTER */}
                        <section className="bg-white p-8 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] border border-amber-100 shadow-sm group">
                            <h4 className="text-xs sm:text-sm font-black uppercase text-slate-400 mb-6 sm:mb-8 tracking-widest flex items-center gap-2">
                                <Gavel className="w-4 h-4 text-rose-600" /> Dagsordenspunkter
                            </h4>
                            <div className="space-y-4">
                                {dagsordenspunkter.map(dpSag => {
                                    if (!dpSag.Dagsordenspunkt) return null;
                                    return (
                                        <div key={dpSag.id} className="p-5 sm:p-6 bg-slate-50/50 rounded-2xl sm:rounded-[2rem] border border-slate-100 hover:border-rose-200 transition-all">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300" />
                                                <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">
                                                    {new Date(dpSag.Dagsordenspunkt.Møde?.dato || '').toLocaleDateString('da-DK')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] sm:text-xs font-bold text-amber-950 mb-4 leading-relaxed">
                                                {dpSag.Dagsordenspunkt.titel}
                                            </p>
                                            
                                            {dpSag.Dagsordenspunkt.Dokument && dpSag.Dagsordenspunkt.Dokument.length > 0 && (
                                                <div className="space-y-2 pt-4 border-t border-dashed border-slate-200">
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
                                                                className={`flex items-center gap-2 text-[8px] sm:text-[9px] font-bold truncate transition-colors ${
                                                                    isRead ? 'text-slate-400 italic' : 'text-rose-600 hover:text-rose-900'
                                                                }`}
                                                            >
                                                                <FileText className={`w-3 h-3 shrink-0 ${isRead ? 'text-slate-300' : 'text-rose-600'}`} />
                                                                {isRead && <Check className="w-2.5 h-2.5" />}
                                                                {dpd.titel}
                                                            </a>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                                {dagsordenspunkter.length === 0 && (
                                    <p className="text-xs text-slate-400 italic py-4">Ingen dagsordenspunkter fundet.</p>
                                )}
                            </div>
                        </section>

                        {/* DISCLAIMER */}
                        <div className="p-6 sm:p-8 bg-rose-50 border border-rose-100 rounded-[2rem] sm:rounded-[2.5rem] flex items-start gap-4">
                            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-rose-700 shrink-0 mt-1" />
                            <div>
                                <p className="text-[9px] sm:text-[10px] font-black uppercase text-rose-950 mb-2">Ansvarsfraskrivelse</p>
                                <p className="text-[9px] sm:text-[10px] text-rose-800 leading-relaxed italic">
                                    Data hentes automatisk fra Folketingets ODA API. Vi tager forbehold for forsinkelser og fejl i kildedata. AI-analysen er vejledende sparring.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* STICKY BOTTOM ACTION (Only on small screens) */}
            <div className="md:hidden fixed bottom-6 right-6 z-50">
                <button className="w-14 h-14 bg-amber-950 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
                    <MessageSquare className="w-5 h-5 group-hover:animate-bounce" />
                </button>
            </div>
        </div>
    );
};

export default SagViewPage;
