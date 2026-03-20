
'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  ChevronDown,
  ChevronRight,
  Loader2, 
  Calendar,
  Table as TableIcon,
  BarChart3,
  ChevronLeft,
  Layers,
  ArrowUpRight,
  Target,
  Clock,
  Info,
  CheckCircle2,
  Tag,
  MapPin,
  Filter,
  RefreshCw,
  Database,
  ArrowRight,
  Sparkles,
  BarChart,
  PieChart,
  Lock,
  MessageSquare,
  Scale,
  Trash2,
  Brain,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { fetchStarTableDetailsAction, fetchStarTableDataAction, analyzeStarDataAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, writeBatch, serverTimestamp, increment, collection } from 'firebase/firestore';

interface StarDimension {
    DimensionID: string;
    DimensionName: string;
    DefaultValue: string;
    Values: string[];
}

interface StarTableDetails {
    TableID: string;
    TableName: string;
    SubjectID: number;
    SubjectName: string;
    UpdateFrequency?: string;
    Period?: string[];
    Area?: string[];
    Dimensions?: StarDimension[];
    Measurements?: { ID: string; Name: string }[];
}

interface StarDataResult {
    Variables: { Name?: string; name?: string; Label?: string; label?: string }[];
    Data: any[][];
    TableInfo?: any[];
}

interface TableStats {
    label: string;
    total: number;
    avg: number;
    min: number;
    max: number;
}

export default function StarTableDetailsPage() {
    const { user, isUserLoading, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const tableId = params.tableId as string;
    const { toast } = useToast();

    const [table, setTable] = useState<StarTableDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedAreas, setSelectedAreas] = useState<string[]>(['Hele landet']);
    const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
    const [dimensionFilters, setDimensionFilters] = useState<Record<string, string[]>>({});

    // Result states
    const [fetchedData, setFetchedData] = useState<StarDataResult | null>(null);
    const [isFetchingData, setIsFetchingData] = useState(false);
    const [dataError, setDataError] = useState<string | null>(null);

    // Analysis states
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<any | null>(null);
    const [limitError, setLimitError] = useState<string | null>(null);

    const isPremium = useMemo(() => {
        if (!userProfile) return false;
        const premiumPlans = ['Kollega+', 'Semesterpakken', 'Kollega++'];
        return userProfile.role === 'admin' || premiumPlans.includes(userProfile.membership || '');
    }, [userProfile]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
            return;
        }

        const loadTableDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await fetchStarTableDetailsAction(tableId);
                const tableData = Array.isArray(data) ? data[0] : data;
                
                if (!tableData || typeof tableData !== 'object') {
                    throw new Error("Ugyldigt dataformat modtaget fra STAR.");
                }
                
                setTable(tableData);
                
                if (tableData.Period && tableData.Period.length > 0) {
                    setSelectedPeriods([tableData.Period[tableData.Period.length - 1]]);
                }
                
                if (tableData.Dimensions) {
                    const initialDims: Record<string, string[]> = {};
                    tableData.Dimensions.forEach((d: StarDimension) => {
                        initialDims[d.DimensionID] = [d.DefaultValue];
                    });
                    setDimensionFilters(initialDims);
                }

            } catch (err: any) {
                console.error("Error fetching table details:", err);
                setError("Kunne ikke hente detaljer for denne tabel. Tjek venligst din forbindelse.");
            } finally {
                setIsLoading(false);
            }
        };

        if (user && tableId) {
            loadTableDetails();
        }
    }, [user, isUserLoading, router, tableId]);

    const handleFetchData = async () => {
        if (!table || isFetchingData) return;
        
        setIsFetchingData(true);
        setDataError(null);
        setFetchedData(null);
        setAiAnalysis(null);

        const filters: Record<string, string[]> = {
            area: selectedAreas,
            period: selectedPeriods,
        };

        Object.entries(dimensionFilters).forEach(([dimId, values]) => {
            filters[dimId] = values;
        });

        try {
            const rawResponse = await fetchStarTableDataAction(tableId, filters);
            const data = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;

            const vars = data.Variables || data.variables || [];
            const rows = data.Data || data.data || [];

            if (vars.length > 0 && rows.length > 0) {
                setFetchedData({
                    Variables: vars,
                    Data: rows,
                    TableInfo: data.TableInfo || data.tableInfo
                });
            } else if (vars.length > 0 && rows.length === 0) {
                setDataError("Der blev ikke fundet nogen rækker for de valgte filtre. Prøv at vælge en bredere periode eller flere områder.");
            } else {
                setDataError("Kunne ikke finde gyldig data i svaret fra STAR.");
            }
        } catch (err: any) {
            console.error("Error fetching data:", err);
            setDataError("Der opstod en fejl under hentning af data. Prøv en anden kombination af filtre.");
        } finally {
            setIsFetchingData(false);
        }
    };

    const tableStats = useMemo(() => {
        const variables = fetchedData?.Variables || [];
        const dataRows = fetchedData?.Data || [];
        if (variables.length === 0 || dataRows.length === 0) return [];

        const stats: TableStats[] = [];
        variables.forEach((variable, index) => {
            const vName = (variable.Name || variable.name || '').toLowerCase();
            const vLabel = variable.Label || variable.label || 'Ukendt';

            const isMeasurement = vName.startsWith('meas') || 
                                vName.startsWith('memb') || 
                                (!['area', 'period'].includes(vName) && !vName.startsWith('_'));

            if (isMeasurement) {
                const values = dataRows.map(row => parseFloat(row[index])).filter(v => !isNaN(v));
                if (values.length > 0) {
                    const total = values.reduce((a, b) => a + b, 0);
                    stats.push({
                        label: vLabel,
                        total: total,
                        avg: total / values.length,
                        min: Math.min(...values),
                        max: Math.max(...values)
                    });
                }
            }
        });
        return stats;
    }, [fetchedData]);

    const handleAnalyzeData = async () => {
        if (!fetchedData || fetchedData.Data.length === 0) {
            toast({ 
                variant: 'destructive', 
                title: "Data mangler", 
                description: "Hent venligst data ind i tabellen først." 
            });
            return;
        }
        
        if (!user || !firestore || !userProfile) {
            toast({ variant: 'destructive', title: "Systemfejl", description: "Profil-forbindelse mangler. Prøv at genindlæse siden." });
            return;
        }

        // Limit check for free tier
        if (userProfile.membership === 'Kollega') {
            const lastUsage = userProfile.lastStarAnalysisUsage?.toDate();
            const now = new Date();
            const dailyCount = (lastUsage && lastUsage.toDateString() === now.toDateString()) ? (userProfile.dailyStarAnalysisCount || 0) : 0;

            if (dailyCount >= 3) {
                setLimitError('Du har brugt dine 3 daglige tolkninger i STAR Indsigt. Opgrader til Kollega+ for ubegrænset brug.');
                return;
            }
        }

        setIsAnalysing(true);
        setAiAnalysis(null);
        setLimitError(null);

        try {
            const statsSummary = tableStats.map(s => `${s.label}: Total=${s.total.toFixed(1)}, Gns=${s.avg.toFixed(1)}, Min=${s.min.toFixed(1)}, Max=${s.max.toFixed(1)}`).join('\n');
            const dataSample = fetchedData.Data.slice(0, 15).map(row => row.join(', ')).join('\n');

            const response = await analyzeStarDataAction({
                tableTitle: table?.TableName || 'STAR Tabel',
                variables: fetchedData.Variables.map(v => ({ 
                    name: v.Name || v.name || '', 
                    label: v.Label || v.label || '' 
                })),
                statsSummary,
                dataSample
            });

            setAiAnalysis(response.data);
            
            const batch = writeBatch(firestore);
            const userRef = doc(firestore, 'users', user.uid);
            
            const activityRef = doc(collection(firestore, 'userActivities'));
            batch.set(activityRef, {
                userId: user.uid,
                userName: userProfile.username || user.displayName || 'Anonym bruger',
                actionText: `analyserede data fra STAR-tabellen "${table?.TableName}".`,
                createdAt: serverTimestamp()
            });

            const userUpdates: {[key: string]: any} = {
                lastStarAnalysisUsage: serverTimestamp(),
                dailyStarAnalysisCount: increment(1)
            };

            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);
                if (pointsToAdd > 0) userUpdates.cohéroPoints = increment(pointsToAdd);
                
                const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                batch.set(tokenUsageRef, { 
                    flowName: 'analyzeStarDataFlow', 
                    tableId: table?.TableID || 'unknown',
                    ...response.usage, 
                    totalTokens, 
                    createdAt: serverTimestamp(), 
                    userId: user.uid, 
                    userName: userProfile.username || 'Anonym' 
                });
            }
            batch.update(userRef, userUpdates);
            await batch.commit();
            await refetchUserProfile();

            toast({ title: "Analyse færdig", description: "AI'en har tolket tendenserne i dine data." });
        } catch (err: any) {
            console.error("Analysis failed:", err);
            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke gennemføre den faglige tolkning." });
        } finally {
            setIsAnalysing(false);
        }
    };

    const toggleArea = (area: string) => {
        setSelectedAreas(prev => 
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    const togglePeriod = (period: string) => {
        setSelectedPeriods(prev => 
            prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
        );
    };

    const toggleDimensionValue = (dimId: string, value: string) => {
        setDimensionFilters(prev => {
            const current = prev[dimId] || [];
            const updated = current.includes(value) 
                ? current.filter(v => v !== value) 
                : [...current, value];
            return { ...prev, [dimId]: updated };
        });
    };

    if (isUserLoading || !userProfile) return <AuthLoadingScreen />;

    const hasData = fetchedData && fetchedData.Data.length > 0;

    return (
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100">
            <header className="bg-white border-b border-amber-100 px-6 py-10 sticky top-24 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-indigo-50 text-indigo-900 rounded-2xl hover:bg-indigo-100 transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-1.5 bg-indigo-50 rounded-lg">
                                <BarChart3 className="w-4 h-4 text-indigo-700" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900/50">Tabel: {table?.TableID}</span>
                        </div>
                        <h1 className="text-3xl font-bold text-amber-950 serif">{table?.TableName}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-32">
                
                {/* FILTER BUILDER */}
                <section className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-xl relative overflow-hidden animate-ink">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <Filter className="w-64 h-64 -rotate-12 text-indigo-950" />
                    </div>
                    
                    <div className="relative z-10 space-y-10">
                        <div className="flex flex-col md:flex-row items-center justify-between border-b border-amber-50 pb-8 gap-6">
                            <div>
                                <h2 className="text-2xl font-bold text-amber-950 serif">Byg dit dataudtræk</h2>
                                <p className="text-sm text-slate-500 mt-1 italic">Vælg områder, perioder og dimensioner for at se tallene bag.</p>
                            </div>
                            <Button 
                                size="lg" 
                                onClick={handleFetchData} 
                                disabled={isFetchingData || selectedAreas.length === 0 || selectedPeriods.length === 0}
                                className="h-14 px-10 rounded-2xl font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-indigo-950/20 active:scale-95 transition-all w-full md:w-auto"
                            >
                                {isFetchingData ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                {isFetchingData ? 'Henter data...' : 'Hent Data'}
                            </Button>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-10">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-600" /> Områder
                                </h4>
                                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-1.5 p-4 bg-slate-50/50 rounded-2xl border border-amber-50 shadow-inner">
                                    {table?.Area?.map(area => (
                                        <button 
                                            key={area}
                                            onClick={() => toggleArea(area)}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-between group ${selectedAreas.includes(area) ? 'bg-amber-950 text-white border-amber-950 shadow-md' : 'bg-white border-transparent text-slate-600 hover:border-amber-200'}`}
                                        >
                                            {area}
                                            <div className={`w-2 h-2 rounded-full ${selectedAreas.includes(area) ? 'bg-amber-400 animate-pulse' : 'bg-slate-200 group-hover:bg-amber-200'}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-600" /> Perioder
                                </h4>
                                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-1.5 p-4 bg-slate-50/50 rounded-2xl border border-amber-50 shadow-inner text-center">
                                    <div className="grid grid-cols-2 gap-2">
                                        {table?.Period?.map(period => (
                                            <button 
                                                key={period}
                                                onClick={() => togglePeriod(period)}
                                                className={`px-3 py-2 rounded-xl text-[10px] font-mono font-bold transition-all border ${selectedPeriods.includes(period) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-transparent text-slate-500 hover:border-indigo-200'}`}
                                            >
                                                {period}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-amber-600" /> Dimensioner
                                </h4>
                                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-4 bg-slate-50/50 rounded-2xl border border-amber-100 shadow-inner">
                                    {table?.Dimensions?.map(dim => (
                                        <div key={dim.DimensionID} className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-amber-900 ml-1 tracking-widest">{dim.DimensionName}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {dim.Values?.map(val => {
                                                    const isSelected = dimensionFilters[dim.DimensionID]?.includes(val);
                                                    return (
                                                        <button 
                                                            key={val}
                                                            onClick={() => toggleDimensionValue(dim.DimensionID, val)}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${isSelected ? 'bg-amber-950 text-white border-amber-950 shadow-sm' : 'bg-white border-amber-100 text-slate-500 hover:border-amber-400'}`}
                                                        >
                                                            {val}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* RESULTS DISPLAY */}
                <section className="animate-fade-in-up">
                    <div className="flex items-center justify-between mb-8 px-4">
                        <div className="flex items-center gap-3">
                            <Database className="w-6 h-6 text-indigo-700" />
                            <h2 className="text-xl font-bold text-amber-950 serif">Data-resultater</h2>
                        </div>
                        {hasData && (
                            <Button 
                                onClick={handleAnalyzeData} 
                                disabled={isAnalysing || !!limitError}
                                className="bg-amber-950 text-white rounded-xl shadow-lg shadow-amber-950/10 hover:bg-indigo-900 group h-12"
                            >
                                {isAnalysing ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Sparkles className="w-4 h-4 mr-2 text-amber-400 group-hover:rotate-12 transition-transform" />}
                                Faglig Fortolkning
                            </Button>
                        )}
                    </div>

                    <div className="bg-white rounded-[3rem] border border-amber-100 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
                        {isFetchingData ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                                <div className="relative">
                                    <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
                                    <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse"></div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-amber-950 serif">Henter data...</h3>
                                    <p className="text-sm text-slate-400 mt-2 uppercase tracking-widest animate-pulse">Henter rå data fra jobindsats.dk</p>
                                </div>
                            </div>
                        ) : dataError ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                                <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-600">
                                    <Info className="w-10 h-10" />
                                </div>
                                <div className="max-w-md">
                                    <h3 className="text-2xl font-bold text-rose-950 serif">Kunne ikke hente data</h3>
                                    <p className="text-sm text-rose-600/70 mt-2 italic">{dataError}</p>
                                </div>
                                <Button onClick={handleFetchData} variant="outline" className="rounded-xl border-rose-200 text-rose-900">Prøv igen</Button>
                            </div>
                        ) : hasData ? (
                            <div className="flex-1 flex flex-col">
                                <div className="p-8 border-b border-amber-50 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-4">
                                    <div className="flex items-center gap-4">
                                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-lg border border-emerald-200">Klar</span>
                                        <p className="text-sm font-bold text-amber-950">{fetchedData!.Data.length} rækker indlæst</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        const jsonStr = JSON.stringify(fetchedData, null, 2);
                                        const blob = new Blob([jsonStr], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `star_data_${tableId}.json`;
                                        a.click();
                                    }}>Download JSON</Button>
                                </div>
                                
                                <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 z-10 shadow-sm border-b border-amber-50">
                                            <tr>
                                                {fetchedData!.Variables.map((variable, vIdx) => (
                                                    <th key={vIdx} className="px-6 py-4 whitespace-nowrap">{variable.Label || variable.label}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-amber-50">
                                            {fetchedData!.Data.map((row, i) => (
                                                <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                                                    {row.map((val: any, j) => (
                                                        <td key={j} className="px-6 py-4 whitespace-nowrap text-amber-950 font-medium">
                                                            {val}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-20 group">
                                <BarChart3 className="w-20 h-20 text-slate-300 mb-6 group-hover:rotate-12 transition-transform duration-700" />
                                <p className="text-lg font-bold text-slate-400 serif uppercase tracking-[0.2em]">Indstil filtre for at hente tal</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ANALYSE PANEL */}
                <AnimatePresence>
                    {(aiAnalysis || tableStats.length > 0 || limitError) && (
                        <motion.section 
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid lg:grid-cols-12 gap-10"
                        >
                            <div className="lg:col-span-4">
                                <div className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm sticky top-32">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] mb-8 flex items-center gap-2">
                                        <BarChart className="w-4 h-4 text-emerald-600" /> Statistisk Overblik
                                    </h3>
                                    <div className="space-y-6">
                                        {tableStats.map((stat, i) => (
                                            <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group">
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{stat.label}</p>
                                                <div className="flex items-baseline justify-between gap-4">
                                                    <span className="text-2xl font-black text-amber-950 serif">{stat.total.toLocaleString('da-DK')}</span>
                                                    <div className="text-right">
                                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Gns: {stat.avg.toFixed(1)}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex justify-between gap-4">
                                                    <div className="text-center flex-1">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase">Min</p>
                                                        <p className="text-xs font-bold text-amber-900">{stat.min.toLocaleString('da-DK')}</p>
                                                    </div>
                                                    <div className="text-center flex-1 border-x border-slate-200">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase">Max</p>
                                                        <p className="text-xs font-bold text-amber-900">{stat.max.toLocaleString('da-DK')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8">
                                <div className="bg-white p-10 md:p-14 rounded-[4rem] border border-amber-100 shadow-xl relative overflow-hidden group min-h-[600px] flex flex-col justify-center">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-48 h-48 -rotate-12" />
                                    </div>
                                    <div className="relative z-10">
                                        {limitError ? (
                                            <div className="text-center space-y-8 animate-ink">
                                                <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner text-amber-600">
                                                    <Lock className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <h3 className="text-3xl font-bold text-amber-950 serif mb-2">Grænse nået for i dag</h3>
                                                    <p className="text-slate-500 max-w-sm mx-auto italic">{limitError}</p>
                                                </div>
                                                <Link href="/upgrade">
                                                    <Button size="lg" className="h-14 px-10 rounded-2xl bg-amber-950 text-white hover:bg-indigo-900 shadow-xl shadow-amber-950/20">Opgrader til Kollega+</Button>
                                                </Link>
                                            </div>
                                        ) : isAnalysing ? (
                                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                                                <div className="relative">
                                                    <Loader2 className="w-16 h-16 animate-spin text-indigo-600" />
                                                    <div className="absolute inset-0 blur-xl bg-indigo-400/20 animate-pulse"></div>
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-950/40">Fortolker data-tendenser...</p>
                                            </div>
                                        ) : aiAnalysis ? (
                                            <div className="space-y-12 animate-ink">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <div className="p-2 bg-indigo-50 rounded-xl">
                                                            <Target className="w-5 h-5 text-indigo-700" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-amber-950 serif">Faglig Fortolkning</h3>
                                                    </div>
                                                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiAnalysis.analysis }} />
                                                </div>

                                                <div className="space-y-8 pt-10 border-t border-amber-50">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="p-2 bg-amber-50 rounded-xl">
                                                                <GraduationCap className="w-5 h-5 text-amber-700" />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-amber-950 serif">Akademisk Anvendelse</h3>
                                                        </div>
                                                        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium italic border-l-4 border-amber-100 pl-6" dangerouslySetInnerHTML={{ __html: aiAnalysis.academicUsage }} />
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h4 className="text-xs font-black uppercase text-amber-600 tracking-big flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4" /> Refleksion
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {aiAnalysis.socraticQuestions?.map((q: string, i: number) => (
                                                                <div key={i} className="flex gap-4 p-4 bg-amber-50/30 rounded-2xl border border-amber-100 italic">
                                                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                                                                        <span className="text-[10px] font-black text-amber-700">{i + 1}</span>
                                                                    </div>
                                                                    <p className="text-xs text-amber-900/80 leading-relaxed">{q}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 space-y-8">
                                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                                                    <Brain className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold text-amber-950 serif mb-2">Analysér dine resultater</h3>
                                                    <p className="text-slate-500 max-w-sm mx-auto italic">Brug AI til at beskrive tendenser og koble tallene til din faglige viden.</p>
                                                </div>
                                                <Button onClick={handleAnalyzeData} className="h-16 px-12 rounded-[2rem] bg-amber-950 text-white hover:bg-indigo-950 shadow-2xl shadow-amber-950/20 group">
                                                    <Sparkles className="w-5 h-5 mr-3 text-amber-400 group-hover:rotate-12 transition-transform" />
                                                    Start Faglig Fortolkning
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
