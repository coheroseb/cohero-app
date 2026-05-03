'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  ExternalLink, 
  Download,
  Info,
  BookOpen,
  Activity,
  History,
  Check
} from 'lucide-react';
import { 
  fetchFolketingetSagById, 
  fetchSagDokumenter
} from '@/app/actions';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, query } from 'firebase/firestore';

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
    Fil?: { filurl: string, format?: string }[];
  }
}

const SagViewPage = () => {
    const params = useParams();
    const sagIdParam = params?.sagId as string;
    const router = useRouter();
    const sagId = Number(sagIdParam);

    const { user } = useApp();
    const firestore = useFirestore();
    
    const [sag, setSag] = useState<Sag | null>(null);
    const [dokumenter, setDokumenter] = useState<SagDokument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [statusser, setStatusser] = useState<{ id: number; status: string }[]>([]);
    const [dokumenttyper, setDokumenttyper] = useState<{ id: number; type: string }[]>([]);

    const readDocsQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'readDocuments')) : null
    ), [user, firestore]);
    const { data: readDocs } = useCollection(readDocsQuery);
    const readDocIds = useMemo(() => new Set(readDocs?.map(d => d.id)), [readDocs]);

    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const [statusserRes, dokumenttyperRes] = await Promise.all([
                    fetch('https://oda.ft.dk/api/Sagsstatus').then(res => res.json()),
                    fetch('https://oda.ft.dk/api/Dokumenttype').then(res => res.json())
                ]);
                setStatusser(statusserRes.value || []);
                setDokumenttyper(dokumenttyperRes.value || []);
            } catch (err) {
                console.error("Could not fetch filter options:", err);
            }
        };
        fetchFilterOptions();
    }, []);

    const getSagStatusString = (statusid: number) => {
        const status = statusser.find(s => s.id === statusid);
        return status ? status.status : `Status ${statusid}`;
    };
    
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
                const [sagData, doksData] = await Promise.all([
                    fetchFolketingetSagById(sagId),
                    fetchSagDokumenter(sagId)
                ]);

                if (!sagData) throw new Error('Sagen kunne ikke findes.');
                setSag(sagData);
                setDokumenter(doksData);
            } catch (err: any) {
                setError(err.message || "Kunne ikke hente sagsdetaljer.");
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [sagId]);

    if (isLoading) return <AuthLoadingScreen />;

    if (error || !sag) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-8">
                    <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto">
                        <Info className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 serif">{error || 'Sag ikke fundet'}</h2>
                    <Link href="/folketinget" className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">
                        <ArrowLeft className="w-4 h-4" /> Gå tilbage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="p-3 hover:bg-slate-100 rounded-2xl transition-all">
                             <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </button>
                        <div className="h-8 w-px bg-slate-200" />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <Activity className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Politisk Puls • {sag.nummer}</span>
                            </div>
                            <h1 className="text-xl font-black text-slate-900 serif line-clamp-1">{sag.titel}</h1>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-emerald-100">
                            {getSagStatusString(sag.statusid)}
                        </div>
                        <a href={`https://www.ft.dk/samling/20231/lovforslag/${sag.nummer}/index.htm`} target="_blank" rel="noreferrer" className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-900/10">
                            <ExternalLink className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-12 gap-12">
                    {/* Left: Content & Timeline */}
                    <div className="lg:col-span-8 space-y-12">
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 serif">Resume & Baggrund</h2>
                            </div>
                            {sag.resume ? (
                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: sag.resume }} />
                            ) : (
                                <p className="text-sm text-slate-400 italic">Intet resume tilgængeligt fra Folketinget.</p>
                            )}
                        </section>

                        <section className="space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900">
                                    <History className="w-5 h-5" />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 serif">Behandlingsforløb</h2>
                            </div>
                            <div className="relative pl-10 space-y-8">
                                <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200" />
                                {sag.Sagstrin?.sort((a: any, b: any) => new Date(b.dato).getTime() - new Date(a.dato).getTime()).map((trin: any, idx) => (
                                    <div key={trin.id} className="relative group">
                                        <div className={`absolute -left-7 top-1 w-4 h-4 rounded-full border-4 border-[#fafafa] z-10 transition-all ${idx === 0 ? 'bg-slate-900 scale-125' : 'bg-slate-300'}`} />
                                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                            <span className="text-[10px] font-black uppercase text-slate-400 mb-2 block">{new Date(trin.dato).toLocaleDateString('da-DK')}</span>
                                            <h4 className="text-lg font-black text-slate-900 serif mb-4">{trin.titel}</h4>
                                            {trin.afstemningskonklusion && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    {trin.afstemningskonklusion}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right: Documents */}
                    <aside className="lg:col-span-4 space-y-8">
                        <section className="space-y-6">
                            <div className="flex items-center gap-2 px-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dokumenter</h3>
                            </div>
                            <div className="space-y-3">
                                {dokumenter.map(docData => {
                                    const pdf = docData.Dokument?.Fil?.find(f => f.format === 'PDF')?.filurl || docData.Dokument?.Fil?.[0]?.filurl;
                                    const isRead = docData.Dokument?.id ? readDocIds.has(docData.Dokument.id.toString()) : false;
                                    return (
                                        <div key={docData.id} className={`group p-5 bg-white rounded-2xl border border-slate-100 flex items-center justify-between hover:border-slate-900 transition-all ${isRead ? 'opacity-60' : ''}`}>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <p className="text-[13px] font-bold text-slate-900 truncate flex items-center gap-2">
                                                    {isRead && <Check className="w-3 h-3 text-emerald-500" />}
                                                    {docData.Dokument?.titel}
                                                </p>
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">{getDokumentTypeString(docData.Dokument?.typeid ?? 0)}</p>
                                            </div>
                                            <button onClick={() => pdf && window.open(pdf, '_blank')} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </aside>
                </div>
            </main>
        </div>
    );
};

export default SagViewPage;
