
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Gift, Loader2, Copy, Check, PlusCircle, TrendingUp, Users, Activity, Trash2, Search, Filter, Download, Zap, ChevronRight, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from 'framer-motion';

interface RedemptionCode {
    id: string;
    code: string;
    membershipLevel: string;
    durationInMonths: number;
    createdAt: { toDate: () => Date };
    redeemedBy?: string;
    redeemedAt?: { toDate: () => Date };
}

export default function AdminMarketingPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const codesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'redemptionCodes')) : null), [firestore]);
    const { data: codes, isLoading, error } = useCollection<RedemptionCode>(codesQuery);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used'>('all');

    const filteredCodes = useMemo(() => {
        if (!codes) return [];
        let result = [...codes].sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
        
        if (searchTerm) {
            result = result.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        
        if (filterStatus === 'active') {
            result = result.filter(c => !c.redeemedBy);
        } else if (filterStatus === 'used') {
            result = result.filter(c => !!c.redeemedBy);
        }
        
        return result;
    }, [codes, searchTerm, filterStatus]);

    const stats = useMemo(() => {
        if (!codes) return { total: 0, active: 0, used: 0 };
        return {
            total: codes.length,
            active: codes.filter(c => !c.redeemedBy).length,
            used: codes.filter(c => !!c.redeemedBy).length,
        };
    }, [codes]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [numCodes, setNumCodes] = useState(1);
    const [membershipLevel, setMembershipLevel] = useState('Kollega+');
    const [duration, setDuration] = useState(1);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleGenerateCodes = async () => {
        if (!firestore || isGenerating) return;
        setIsGenerating(true);

        const colRef = collection(firestore, 'redemptionCodes');
        
        try {
            const batchPromises: Promise<any>[] = [];
            for (let i = 0; i < numCodes; i++) {
                const newCode = nanoid(8).toUpperCase();
                batchPromises.push(addDoc(colRef, {
                    code: newCode,
                    membershipLevel: membershipLevel,
                    durationInMonths: duration,
                    createdAt: serverTimestamp(),
                    redeemedBy: null,
                    redeemedAt: null,
                }));
            }
            
            await Promise.all(batchPromises);
            toast({
                title: 'Oprettelse gennemført',
                description: `${numCodes} nye koder er nu klar til brug.`,
            });
        } catch (err) {
             console.error("Error generating codes:", err);
             toast({
                variant: 'destructive',
                title: 'Noget gik galt',
                description: 'Koderne kunne ikke oprettes.',
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDeleteCode = async (id: string) => {
        if (!firestore || !window.confirm('Er du sikker på, du vil slette denne kode?')) return;
        try {
            await deleteDoc(doc(firestore, 'redemptionCodes', id));
            toast({ title: 'Kode slettet' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Fejl ved sletning' });
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const exportToCSV = () => {
        if (!filteredCodes.length) return;
        const headers = ["Kode", "Type", "Varighed", "Status", "Oprettet", "Indløst"];
        const rows = filteredCodes.map(c => [
            c.code,
            c.membershipLevel,
            `${c.durationInMonths} mdr`,
            c.redeemedBy ? 'Brugt' : 'Aktiv',
            c.createdAt?.toDate() ? c.createdAt.toDate().toLocaleDateString('da-DK') : 'Afventer...',
            c.redeemedAt?.toDate() ? c.redeemedAt.toDate().toLocaleDateString('da-DK') : '-'
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `koder_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-12 animate-ink pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 serif mb-2">Værdikoder & Growth</h1>
                    <p className="text-slate-500 font-medium">Administrer platformens redemption flow og skab unikke kampagner.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-2xl h-11 px-6 border-slate-100 bg-white font-black text-[10px] uppercase tracking-widest transition-all hover:bg-slate-50">
                        <Download className="w-4 h-4 mr-2" /> Eksportér CSV
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Totale koder', value: stats.total, icon: Gift, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100/50' },
                    { label: 'Aktive koder', value: stats.active, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100/50' },
                    { label: 'Indløst total', value: stats.used, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100/50' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`bg-white p-8 rounded-[2.5rem] border ${stat.bg} shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700 min-h-[140px] flex flex-col justify-between`}
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color} bg-white shadow-sm group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="mt-4">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">{stat.label}</p>
                            <p className="text-4xl font-black text-slate-900 serif">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Generation Form */}
                <div className="xl:col-span-4 h-full">
                    <section className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group h-full flex flex-col justify-between">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
                                    <Sparkles className="w-6 h-6 fill-amber-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white serif">Udsting Koder</h3>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Volumne (antal)</label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={numCodes} 
                                            onChange={e => setNumCodes(Math.max(1, Number(e.target.value)))}
                                            className="rounded-2xl border-white/5 bg-white/5 text-white h-14 pl-6 text-lg font-bold focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                                        />
                                        <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Plan Tilknyttet</label>
                                    <select 
                                        value={membershipLevel} 
                                        onChange={e => setMembershipLevel(e.target.value)}
                                        className="w-full h-14 px-6 bg-white/5 border border-white/5 rounded-2xl text-white font-bold appearance-none outline-none focus:ring-4 focus:ring-amber-500/10 transition-all cursor-pointer"
                                    >
                                        <option className="bg-slate-900">Kollega+</option>
                                        <option className="bg-slate-900">Semesterpakken</option>
                                        <option className="bg-slate-900">Kollega++</option>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Varighed (måneder)</label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            value={duration} 
                                            onChange={e => setDuration(Math.max(1, Number(e.target.value)))}
                                            className="rounded-2xl border-white/5 bg-white/5 text-white h-14 pl-6 text-lg font-bold focus:ring-amber-500/20 focus:border-amber-500/50 transition-all"
                                        />
                                        <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10" />
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleGenerateCodes} 
                                    disabled={isGenerating}
                                    className="w-full h-16 rounded-[2rem] bg-white text-slate-900 hover:bg-slate-100 font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-white/5 active:scale-[0.98] mt-4"
                                >
                                    {isGenerating ? (
                                        <Loader2 className="w-5 h-5 animate-spin"/>
                                    ) : (
                                        <span className="flex items-center gap-3">Ekvipér platformen <ChevronRight className="w-4 h-4" /></span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
                    </section>
                </div>
                
                {/* Registry Section */}
                <div className="xl:col-span-8">
                    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/20 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 serif">Kode Arkiv</h3>
                                </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative group flex-1">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input 
                                        type="text"
                                        placeholder="Søg i koder..." 
                                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all outline-none"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                    <button 
                                        onClick={() => setFilterStatus('all')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Alle
                                    </button>
                                    <button 
                                        onClick={() => setFilterStatus('active')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Aktive
                                    </button>
                                    <button 
                                        onClick={() => setFilterStatus('used')}
                                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'used' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Indløst
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto overflow-y-auto max-h-[700px] flex-1">
                            {isLoading ? (
                                <div className="p-32 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-slate-100"/>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Indlæser database...</p>
                                </div>
                            ) : filteredCodes.length === 0 ? (
                                <div className="p-32 flex flex-col items-center justify-center gap-6 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-2">
                                        <Gift className="w-8 h-8 text-slate-200" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 serif">Ingen koder fundet</h3>
                                    <p className="text-slate-400 font-medium max-w-xs leading-relaxed">Prøv at rydde din søgning eller generér nogle nye koder til venstre.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100">
                                            <th className="px-10 py-6">Kampagne Kode</th>
                                            <th className="px-10 py-6">Konfiguration</th>
                                            <th className="px-10 py-6">Status</th>
                                            <th className="px-10 py-6">Tidsstempel</th>
                                            <th className="px-10 py-6 text-right pr-14">Handlinger</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence mode="popLayout">
                                            {filteredCodes.map((code, idx) => (
                                                <motion.tr 
                                                    key={code.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.01 }}
                                                    className="group hover:bg-slate-50/50 transition-all cursor-default"
                                                >
                                                    <td className="px-10 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="font-mono font-black text-slate-900 bg-white border border-slate-100 px-4 py-2 rounded-xl text-lg shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-all">{code.code}</div>
                                                            <button 
                                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                                                                onClick={() => copyToClipboard(code.code)}
                                                            >
                                                                {copiedCode === code.code ? (
                                                                    <Check className="w-4 h-4" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-800 text-base">{code.membershipLevel}</span>
                                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mt-0.5">{code.durationInMonths} måneders gratis adgang</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        {code.redeemedBy ? (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">
                                                                Indløst <Check className="w-3 h-3" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100/50 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit ring-4 ring-emerald-500/5">
                                                                Aktiv <Zap className="w-3 h-3 fill-emerald-600" />
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-10 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">{code.createdAt?.toDate?.().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) || '-'}</span>
                                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Op-dato</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-6 text-right pr-14">
                                                        <button 
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                                            onClick={() => handleDeleteCode(code.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

