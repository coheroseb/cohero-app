
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
  GraduationCap,
  Download,
  AlertCircle,
  TrendingUp,
  LineChart as LineChartIcon
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

// PREMIUM SVG CHART COMPONENT
const StarChart = ({ data, type = 'bar' }: { data: StarDataResult, type?: 'bar' | 'line' }) => {
    const variables = data.Variables || [];
    const rows = data.Data || [];
    
    // Find numeric column and label columns
    const periodIdx = variables.findIndex(v => (v.Name || v.name || '').toLowerCase() === 'period');
    const areaIdx = variables.findIndex(v => (v.Name || v.name || '').toLowerCase() === 'area');
    
    const measurementIdx = variables.findIndex(v => {
        const n = (v.Name || v.name || '').toLowerCase();
        return n.startsWith('meas') || n.startsWith('memb');
    });

    if (measurementIdx === -1 || rows.length === 0) return null;

    // Process data for the last 24 points
    const fullChartData = rows.map(row => ({
        label: row[areaIdx] || row[periodIdx] || '?',
        period: row[periodIdx] || '',
        area: row[areaIdx] || '',
        value: parseFloat(row[measurementIdx]) || 0,
        formattedValue: (parseFloat(row[measurementIdx]) || 0).toLocaleString('da-DK', { maximumFractionDigits: 1 })
    })).slice(-24);

    const maxValue = Math.max(...fullChartData.map(d => d.value), 1) * 1.1; // 10% headroom
    
    // SVG Dimensions
    const width = 1000;
    const height = 400;
    const padding = { top: 40, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Helper functions for scaling
    const getX = (index: number) => padding.left + (index * (chartWidth / (fullChartData.length - 1 || 1)));
    const getY = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;

    // Generate path for line chart
    const linePath = fullChartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`).join(' ');
    const areaPath = `${linePath} L ${getX(fullChartData.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

    return (
        <div className="w-full bg-white/50 rounded-[2rem] border border-amber-100 p-8 shadow-inner overflow-hidden">
            <div className="relative w-full h-[450px]">
                <svg 
                    viewBox={`0 0 ${width} ${height}`} 
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                >
                    {/* Definitions for Gradients */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>

                    {/* Y-Axis Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
                        const y = padding.top + chartHeight - tick * chartHeight;
                        const val = tick * maxValue;
                        return (
                            <g key={i} className="opacity-20">
                                <line 
                                    x1={padding.left} 
                                    y1={y} 
                                    x2={width - padding.right} 
                                    y2={y} 
                                    stroke="#cbd5e1" 
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                                <text 
                                    x={padding.left - 15} 
                                    y={y} 
                                    textAnchor="end" 
                                    alignmentBaseline="middle"
                                    className="fill-slate-400 text-[12px] font-bold font-sans"
                                >
                                    {Math.round(val).toLocaleString('da-DK')}
                                </text>
                            </g>
                        );
                    })}

                    {/* Chart Rendering */}
                    {type === 'line' ? (
                        <g>
                            <motion.path 
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                d={linePath}
                                fill="none"
                                stroke="#4f46e5"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <motion.path 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 1 }}
                                d={areaPath}
                                fill="url(#areaGradient)"
                            />
                            {fullChartData.map((d, i) => (
                                <g key={i} className="group/point">
                                    <circle 
                                        cx={getX(i)} 
                                        cy={getY(d.value)} 
                                        r="6" 
                                        fill="white" 
                                        stroke="#4f46e5" 
                                        strokeWidth="3"
                                        className="transition-all duration-300 group-hover/point:r-8 group-hover/point:stroke-amber-500 cursor-pointer"
                                    />
                                    {/* Tooltip Target */}
                                    <rect 
                                        x={getX(i) - 20}
                                        y={padding.top}
                                        width="40"
                                        height={chartHeight}
                                        fill="transparent"
                                        className="cursor-pointer"
                                    />
                                </g>
                            ))}
                        </g>
                    ) : (
                        <g>
                            {fullChartData.map((d, i) => {
                                const barWidth = (chartWidth / fullChartData.length) * 0.7;
                                const x = padding.left + (i * (chartWidth / fullChartData.length)) + (chartWidth / fullChartData.length - barWidth) / 2;
                                const barHeight = (d.value / maxValue) * chartHeight;
                                const y = padding.top + chartHeight - barHeight;
                                
                                return (
                                    <g key={i} className="group/bar cursor-pointer">
                                        <motion.rect 
                                            initial={{ height: 0, y: padding.top + chartHeight }}
                                            animate={{ height: barHeight, y }}
                                            transition={{ delay: i * 0.03, duration: 0.5 }}
                                            x={x}
                                            width={barWidth}
                                            rx="6"
                                            fill="url(#barGradient)"
                                            className="transition-all duration-300 group-hover/bar:fill-amber-500 group-hover/bar:opacity-90"
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    )}

                    {/* X-Axis Labels */}
                    {fullChartData.map((d, i) => {
                        const x = type === 'line' ? getX(i) : padding.left + (i * (chartWidth / fullChartData.length)) + (chartWidth / fullChartData.length) / 2;
                        // Only show every 2nd label if many points
                        if (fullChartData.length > 12 && i % 2 !== 0) return null;
                        
                        return (
                            <text 
                                key={i}
                                x={x}
                                y={padding.top + chartHeight + 25}
                                textAnchor="middle"
                                transform={`rotate(15, ${x}, ${padding.top + chartHeight + 25})`}
                                className="fill-slate-500 text-[10px] font-bold font-sans uppercase tracking-tight"
                            >
                                {d.label.length > 15 ? d.label.substring(0, 12) + '...' : d.label}
                            </text>
                        );
                    })}
                </svg>

                {/* DOM-based Tooltip for higher fidelity */}
                <div className="absolute inset-0 pointer-events-none">
                    {fullChartData.map((d, i) => {
                        const x = type === 'line' ? (i / (fullChartData.length - 1)) * 100 : (i / fullChartData.length) * 100 + (100 / fullChartData.length / 2);
                        return (
                            <div 
                                key={i}
                                className="absolute top-0 bottom-0 group"
                                style={{ 
                                    left: `${(i / fullChartData.length) * 100}%`, 
                                    width: `${100 / fullChartData.length}%`,
                                    pointerEvents: 'auto'
                                }}
                            >
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 pointer-events-none scale-90 group-hover:scale-100">
                                    <div className="bg-amber-950 text-white rounded-2xl p-4 shadow-2xl border border-white/10 min-w-[180px]">
                                        <div className="flex items-center gap-2 mb-2 text-amber-400">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{d.area || 'Omåde'}</span>
                                        </div>
                                        <div className="text-sm font-bold mb-1">{d.formattedValue}</div>
                                        <div className="text-[9px] text-slate-400 font-medium flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" /> {d.period}
                                        </div>
                                    </div>
                                    <div className="w-3 h-3 bg-amber-950 absolute left-1/2 -translate-x-1/2 -bottom-1.5 rotate-45 border-r border-b border-white/10"></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-12 flex items-center justify-between border-t border-amber-50 pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Måling</p>
                        <p className="text-xs font-bold text-amber-950">{variables[measurementIdx]?.Label || variables[measurementIdx]?.label}</p>
                    </div>
                </div>
                <div className="text-[10px] font-black text-indigo-600/50 uppercase tracking-[0.2em] bg-indigo-50/50 px-4 py-2 rounded-full border border-indigo-100/50">
                    Kilde: STAR Data / Jobindsats.dk
                </div>
            </div>
        </div>
    );
};

export default function StarTableDetailsPage() {
    const { user, isUserLoading, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const router = useRouter();
    const params = useParams();
    const tableId = (params?.tableId as string) || '';
    const { toast } = useToast();

    const [table, setTable] = useState<StarTableDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // View states
    const [viewMode, setViewMode] = useState<'table' | 'bar' | 'line'>('table');
    const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);

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
        return userProfile.role === 'admin' || (userProfile.membership && premiumPlans.includes(userProfile.membership));
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
                    // Default to latest period
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

    const handleDownloadCsv = async () => {
        if (!table || isDownloadingCsv) return;
        
        setIsDownloadingCsv(true);
        try {
            const filters: Record<string, string[]> = {
                area: selectedAreas,
                period: selectedPeriods,
            };
            Object.entries(dimensionFilters).forEach(([dimId, values]) => {
                filters[dimId] = values;
            });

            const csvContent = await fetchStarTableDataAction(tableId, filters, 'csv');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `star_data_${tableId}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: "CSV Downloadet", description: "Dine data er nu gemt som en CSV-fil." });
        } catch (err: any) {
            console.error("Error downloading CSV:", err);
            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke hente CSV-data." });
        } finally {
            setIsDownloadingCsv(false);
        }
    };

    const selectLatestPeriods = (count: number) => {
        if (!table?.Period) return;
        const latest = table.Period.slice(-count);
        setSelectedPeriods(latest);
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
        if (userProfile.membership && ['Kollega', 'Group Pro'].includes(userProfile.membership)) {
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
        <div className="bg-[#FDFCF8] min-h-screen selection:bg-indigo-100 pb-32">
            {/* COMPACT TOP BAR */}
            <header className="bg-white border-b border-amber-100 px-8 py-6 sticky top-0 z-30 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.back()} className="p-3 bg-slate-50 text-slate-400 rounded-[1.5rem] hover:bg-indigo-50 hover:text-indigo-900 transition-all group shadow-sm border border-slate-100">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100">
                                <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-900/40 font-sans">Tabel-analyse: {table?.TableID}</span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-black text-amber-950 serif leading-tight">{table?.TableName}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={handleDownloadCsv}
                        disabled={isDownloadingCsv || !hasData}
                        className="h-11 px-5 rounded-2xl border-amber-100 bg-white text-amber-950 shadow-sm hover:bg-amber-50 font-black uppercase text-[9px] tracking-widest gap-2 font-sans"
                    >
                        {isDownloadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-indigo-600" />}
                        Eksportér CSV
                    </Button>
                    <Link href={`/star-indsigt/subject/${params?.subjectId}`}>
                        <Button variant="outline" className="rounded-2xl border-amber-100 text-amber-950 px-5 h-11 hover:bg-amber-50 transition-all font-bold group text-[9px] uppercase tracking-widest font-sans">
                            <ChevronLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" /> Tilbage
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    
                    {/* LEFT SIDEBAR: FILTERS */}
                    <aside className="lg:col-span-4 space-y-8 sticky top-28">
                        <section className="bg-white p-8 rounded-[3rem] border border-amber-100 shadow-xl space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
                                <Filter className="w-40 h-40" />
                            </div>

                            <div className="flex items-center justify-between border-b border-amber-50 pb-6 relative z-10">
                                <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3">
                                    <Filter className="w-5 h-5 text-indigo-600" /> Filtre
                                </h3>
                                <Button 
                                    size="sm" 
                                    onClick={handleFetchData}
                                    disabled={isFetchingData || selectedAreas.length === 0 || selectedPeriods.length === 0}
                                    className="rounded-xl h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[9px] tracking-widest gap-2 shadow-lg shadow-indigo-600/20"
                                >
                                    {isFetchingData ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    Opdatér
                                </Button>
                            </div>

                            <div className="space-y-10 relative z-10">
                                {/* AREAS */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-600" /> Områder
                                    </label>
                                    <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-1.5 p-2 bg-slate-50/50 rounded-2xl border border-amber-50 shadow-inner">
                                        {table?.Area?.map(area => (
                                            <button 
                                                key={area}
                                                onClick={() => toggleArea(area)}
                                                className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between group ${selectedAreas.includes(area) ? 'bg-amber-950 text-white border-amber-950 shadow-md' : 'bg-white border-transparent text-slate-600 hover:border-amber-200'}`}
                                            >
                                                {area}
                                                <div className={`w-1.5 h-1.5 rounded-full ${selectedAreas.includes(area) ? 'bg-amber-400' : 'bg-slate-200 group-hover:bg-amber-200'}`}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* PERIODS */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-indigo-600" /> Perioder
                                        </label>
                                        <div className="flex gap-2">
                                            <button onClick={() => selectLatestPeriods(12)} className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors uppercase">Seneste 12</button>
                                            <button onClick={() => selectLatestPeriods(24)} className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-colors uppercase">Seneste 24</button>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar p-2 bg-slate-50/50 rounded-2xl border border-amber-50 shadow-inner">
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {table?.Period?.map(period => (
                                                <button 
                                                    key={period}
                                                    onClick={() => togglePeriod(period)}
                                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all border ${selectedPeriods.includes(period) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white border-transparent text-slate-500 hover:border-indigo-200'}`}
                                                >
                                                    {period}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* DYNAMIC DIMENSIONS */}
                                {table?.Dimensions?.map(dim => (
                                    <div key={dim.DimensionID} className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2">
                                            <Layers className="w-4 h-4 text-amber-600" /> {dim.DimensionName}
                                        </label>
                                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50/50 rounded-2xl border border-amber-50 shadow-inner">
                                            {dim.Values?.map(val => {
                                                const isSelected = dimensionFilters[dim.DimensionID]?.includes(val);
                                                return (
                                                    <button 
                                                        key={val}
                                                        onClick={() => toggleDimensionValue(dim.DimensionID, val)}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${isSelected ? 'bg-amber-950 text-white border-amber-950 shadow-sm' : 'bg-white border-amber-100 text-slate-500 hover:border-amber-400'}`}
                                                    >
                                                        {val}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </aside>

                    {/* RIGHT CONTENT: RESULTS */}
                    <div className="lg:col-span-8 space-y-12">
                        
                        {/* VIEW CONTROLS */}
                        <section className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white p-4 rounded-[2rem] border border-amber-100 shadow-sm">
                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <button 
                                    onClick={() => setViewMode('table')}
                                    className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'table' ? 'bg-white text-indigo-900 shadow-md border border-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <TableIcon className="w-3.5 h-3.5" /> Tabel
                                </button>
                                <button 
                                    onClick={() => setViewMode('bar')}
                                    className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'bar' ? 'bg-white text-indigo-900 shadow-md border border-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <BarChart className="w-3.5 h-3.5" /> Søjler
                                </button>
                                <button 
                                    onClick={() => setViewMode('line')}
                                    className={`px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${viewMode === 'line' ? 'bg-white text-indigo-900 shadow-md border border-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LineChartIcon className="w-3.5 h-3.5" /> Linjer
                                </button>
                            </div>

                            {hasData && (
                                <Button 
                                    onClick={handleAnalyzeData} 
                                    disabled={isAnalysing || !!limitError}
                                    className="bg-amber-950 text-white rounded-2xl shadow-xl shadow-amber-950/10 hover:bg-indigo-900 group h-12 px-8 font-black uppercase text-[10px] tracking-widest"
                                >
                                    {isAnalysing ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Sparkles className="w-4 h-4 mr-2 text-amber-400 group-hover:rotate-12 transition-transform" />}
                                    Faglig Fortolkning med AI
                                </Button>
                            )}
                        </section>

                        <section className="bg-white rounded-[3.5rem] border border-amber-100 shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative animate-ink">
                            {isFetchingData ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
                                    <div className="relative">
                                        <div className="w-20 h-20 bg-indigo-50 rounded-[2.5rem] animate-pulse absolute -inset-4"></div>
                                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 relative z-10" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-amber-950 serif">Henter rå data...</h3>
                                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-[0.3em] animate-pulse">Kommunikerer med STAR API v2</p>
                                    </div>
                                </div>
                            ) : dataError ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8 animate-ink">
                                    <div className="w-24 h-24 bg-rose-50 rounded-[3rem] flex items-center justify-center text-rose-600 shadow-inner">
                                        <AlertCircle className="w-12 h-12" />
                                    </div>
                                    <div className="max-w-md">
                                        <h3 className="text-2xl font-bold text-rose-950 serif">Data kunne ikke hentes</h3>
                                        <p className="text-slate-500 mt-2 italic text-sm">{dataError}</p>
                                    </div>
                                    <Button onClick={handleFetchData} variant="outline" className="rounded-2xl border-rose-100 text-rose-950 h-14 px-10">Prøv igen</Button>
                                </div>
                            ) : hasData ? (
                                <div className="flex-1 flex flex-col">
                                    <div className="p-10 border-b border-amber-50 flex flex-col sm:flex-row items-center justify-between bg-slate-50/50 gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-3">
                                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                                <span className="text-lg font-bold text-amber-950 serif">{fetchedData!.Data.length} observationer</span>
                                            </div>
                                            <div className="h-4 w-[1px] bg-amber-200"></div>
                                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Kilde: Jobindsats.dk</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Live Forbindelse</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 p-6 overflow-auto max-h-[800px] custom-scrollbar">
                                        {viewMode === 'table' ? (
                                            <table className="w-full text-sm text-left border-collapse">
                                                <thead className="bg-slate-50/80 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-slate-400 sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="px-8 py-6 rounded-tl-[2rem]">#</th>
                                                        {fetchedData!.Variables.map((variable, vIdx) => (
                                                            <th key={vIdx} className="px-8 py-6 whitespace-nowrap">
                                                                {variable.Label || variable.label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-50/50">
                                                    {fetchedData!.Data.map((row, i) => (
                                                        <tr key={i} className="hover:bg-indigo-50/30 transition-all group">
                                                            <td className="px-8 py-5 text-[10px] font-black text-slate-300">{i + 1}</td>
                                                            {row.map((val: any, j) => (
                                                                <td key={j} className="px-8 py-5 whitespace-nowrap text-amber-950 font-bold group-hover:text-indigo-900 transition-colors">
                                                                    {val}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-4 h-full flex flex-col items-center justify-center">
                                                <StarChart data={fetchedData!} type={viewMode === 'bar' ? 'bar' : 'line'} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-32 text-center space-y-8 opacity-30 group">
                                    <div className="relative">
                                        <div className="w-32 h-32 bg-slate-50 rounded-[4rem] group-hover:bg-indigo-50 transition-colors duration-1000"></div>
                                        <Database className="w-16 h-16 text-slate-300 absolute inset-0 m-auto group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-400 serif uppercase tracking-widest">Klar til data-udtræk</h3>
                                        <p className="text-sm italic text-slate-400 mt-2">Vælg dine filtre i menuen til venstre for at se tallene.</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* STATS SUMMARY BAR */}
                        <AnimatePresence>
                            {hasData && tableStats.length > 0 && (
                                <motion.section 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
                                >
                                    {tableStats.slice(0, 4).map((stat, i) => (
                                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm flex flex-col justify-between min-h-[160px] group transition-all hover:shadow-xl hover:-translate-y-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 block group-hover:text-indigo-400 transition-colors">{stat.label}</span>
                                            <div className="space-y-1">
                                                <p className="text-3xl font-black text-amber-950 serif">{stat.total.toLocaleString('da-DK')}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Gns: {stat.avg.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.section>
                            )}
                        </AnimatePresence>

                        {/* AI ANALYSIS SECTION */}
                        <AnimatePresence>
                            {(aiAnalysis || isAnalysing || limitError) && (
                                <motion.section
                                    initial={{ opacity: 0, y: 40 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[4rem] border border-amber-100 shadow-2xl relative overflow-hidden p-10 md:p-16 animate-ink"
                                >
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-64 h-64 -rotate-12" />
                                    </div>

                                    {limitError ? (
                                        <div className="text-center py-12 space-y-10 relative z-10">
                                            <div className="w-24 h-24 bg-amber-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner text-amber-600">
                                                <Lock className="w-12 h-12" />
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="text-3xl font-bold text-amber-950 serif">Daglige tolkninger opbrugt</h3>
                                                <p className="text-slate-500 max-w-sm mx-auto italic font-medium">{limitError}</p>
                                            </div>
                                            <Link href="/upgrade">
                                                <Button size="lg" className="h-16 px-12 rounded-3xl bg-amber-950 text-white hover:bg-indigo-950 shadow-2xl shadow-amber-950/20 active:scale-95 transition-all">Opgradér til Kollega+</Button>
                                            </Link>
                                        </div>
                                    ) : isAnalysing ? (
                                        <div className="py-24 flex flex-col items-center justify-center text-center space-y-10 relative z-10">
                                            <div className="relative">
                                                <div className="w-24 h-24 bg-indigo-50 rounded-[3rem] animate-ping absolute inset-0 opacity-40"></div>
                                                <Loader2 className="w-16 h-16 animate-spin text-indigo-600 relative z-10" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-amber-950 serif">AI Fortolker tendenser...</h3>
                                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-950/30 animate-pulse mt-3">Kobler statistiske data med fagligt perspektiv</p>
                                            </div>
                                        </div>
                                    ) : aiAnalysis && (
                                        <div className="space-y-14 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-4 mb-10">
                                                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 rotate-6 group-hover:rotate-12 transition-transform">
                                                        <Target className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-black text-amber-950 serif">Faglig Fortolkning</h3>
                                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Genereret af Cohero AI</p>
                                                    </div>
                                                </div>
                                                <div className="prose prose-sm max-w-none text-slate-700 leading-loose font-medium text-lg text-justify selection:bg-indigo-100" dangerouslySetInnerHTML={{ __html: aiAnalysis.analysis }} />
                                            </div>

                                            <div className="grid md:grid-cols-5 gap-12 pt-14 border-t border-amber-50">
                                                <div className="md:col-span-3 space-y-10">
                                                    <div>
                                                        <div className="flex items-center gap-4 mb-8">
                                                            <div className="p-2.5 bg-amber-100 rounded-xl shadow-sm">
                                                                <GraduationCap className="w-5 h-5 text-amber-700" />
                                                            </div>
                                                            <h3 className="text-xl font-bold text-amber-950 serif">Akademisk Anvendelse</h3>
                                                        </div>
                                                        <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed font-medium italic border-l-4 border-amber-200 pl-8 bg-amber-50/20 py-6 rounded-r-3xl" dangerouslySetInnerHTML={{ __html: aiAnalysis.academicUsage }} />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2 space-y-8">
                                                    <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-3">
                                                        <MessageSquare className="w-4 h-4" /> Refleksion & Dialog
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {aiAnalysis.socraticQuestions?.map((q: string, i: number) => (
                                                            <div key={i} className="flex gap-5 p-6 bg-slate-50/50 rounded-3xl border border-slate-100 group/q hover:bg-white hover:shadow-lg transition-all">
                                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover/q:bg-indigo-600 group-hover/q:text-white transition-all">
                                                                    <span className="text-xs font-black">{i + 1}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-600 group-hover/q:text-amber-950 font-medium leading-relaxed transition-colors">{q}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
