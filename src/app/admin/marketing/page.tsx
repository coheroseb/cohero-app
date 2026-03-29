'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { Gift, Loader2, Copy, Check, PlusCircle, TrendingUp, Users, Activity, Trash2, Search, Filter, Download } from 'lucide-react';
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

const AdminMarketingPage = () => {
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
            c.createdAt.toDate().toLocaleDateString('da-DK'),
            c.redeemedAt ? c.redeemedAt.toDate().toLocaleDateString('da-DK') : '-'
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight serif mb-2">Marketing & Kampagner</h1>
                    <p className="text-slate-500 max-w-2xl">Administrer værdikoder og kampagner. Generer unikke koder til influencers, partnere eller kampagner.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV} className="rounded-xl border-slate-200 bg-white hover:bg-slate-50">
                        <Download className="w-4 h-4 mr-2" /> Eksportér CSV
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total koder', value: stats.total, icon: Gift, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Aktive koder', value: stats.active, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Indløst totalt', value: stats.used, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Generation Form */}
                <div className="lg:col-span-1">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm sticky top-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-slate-900 rounded-lg">
                                <PlusCircle className="w-5 h-5 text-white"/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 serif">Generér Koder</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Antal koder</label>
                                <Input 
                                    type="number" 
                                    value={numCodes} 
                                    onChange={e => setNumCodes(Math.max(1, Number(e.target.value)))}
                                    className="rounded-xl border-slate-200 h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Medlemskabstype</label>
                                <select 
                                    value={membershipLevel} 
                                    onChange={e => setMembershipLevel(e.target.value)}
                                    className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 outline-none transition-all"
                                >
                                    <option>Kollega+</option>
                                    <option>Semesterpakken</option>
                                    <option>Kollega++</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Varighed (måneder)</label>
                                <Input 
                                    type="number" 
                                    value={duration} 
                                    onChange={e => setDuration(Math.max(1, Number(e.target.value)))}
                                    className="rounded-xl border-slate-200 h-11"
                                />
                            </div>

                            <Button 
                                onClick={handleGenerateCodes} 
                                disabled={isGenerating}
                                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-all shadow-md active:scale-[0.98]"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2"/>
                                        Genererer...
                                    </>
                                ) : (
                                    <>Generér unikke koder</>
                                )}
                            </Button>
                        </div>
                    </section>
                </div>
                
                {/* Registry Section */}
                <div className="lg:col-span-2">
                    <section className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full">
                        <div className="p-8 border-b border-slate-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <Activity className="w-5 h-5 text-indigo-600"/>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 serif">Kode Oversigt</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Alt i alt {filteredCodes.length} koder</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Søg på kode..." 
                                        className="pl-9 rounded-xl border-slate-200"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant={filterStatus === 'all' ? 'default' : 'outline'} 
                                        size="sm"
                                        onClick={() => setFilterStatus('all')}
                                        className="rounded-xl h-10 px-4"
                                    >
                                        Alle
                                    </Button>
                                    <Button 
                                        variant={filterStatus === 'active' ? 'default' : 'outline'} 
                                        size="sm"
                                        onClick={() => setFilterStatus('active')}
                                        className="rounded-xl h-10 px-4"
                                    >
                                        Aktive
                                    </Button>
                                    <Button 
                                        variant={filterStatus === 'used' ? 'default' : 'outline'} 
                                        size="sm"
                                        onClick={() => setFilterStatus('used')}
                                        className="rounded-xl h-10 px-4"
                                    >
                                        Brugte
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-x-auto">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-200"/>
                                    <p className="text-sm text-slate-400 font-medium">Henter koder...</p>
                                </div>
                            ) : error ? (
                                <div className="p-10 text-center">
                                    <p className="text-red-500 font-medium">Kunne ikke hente koder</p>
                                    <p className="text-sm text-slate-400 mt-1">{error.message}</p>
                                </div>
                            ) : filteredCodes.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-2">
                                    <Gift className="w-10 h-10 text-slate-100" />
                                    <p className="text-slate-400 font-medium">Ingen koder fundet</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50/50 border-b border-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                        <tr>
                                            <th className="px-8 py-4 text-left">Kode</th>
                                            <th className="px-4 py-4 text-left">Konfiguration</th>
                                            <th className="px-4 py-4 text-left">Status</th>
                                            <th className="px-4 py-4 text-left">Historik</th>
                                            <th className="px-8 py-4 text-right">Handlinger</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        <AnimatePresence mode="popLayout">
                                            {filteredCodes.map(code => (
                                                <motion.tr 
                                                    key={code.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="group hover:bg-slate-50/30 transition-colors"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded text-base">{code.code}</span>
                                                            <Button 
                                                                size="icon" 
                                                                variant="ghost" 
                                                                className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => copyToClipboard(code.code)}
                                                            >
                                                                {copiedCode === code.code ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5 text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-700">{code.membershipLevel}</span>
                                                            <span className="text-slate-400 text-xs">{code.durationInMonths} måneders adgang</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-5">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                            code.redeemedBy 
                                                                ? 'bg-slate-100 text-slate-500' 
                                                                : 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100/50'
                                                        }`}>
                                                            {code.redeemedBy ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Check className="w-3 h-3" /> Brugt
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <Activity className="w-3 h-3" /> Aktiv
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-5 text-[11px] text-slate-500">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                <span>Op: {code.createdAt?.toDate?.().toLocaleDateString('da-DK') || '-'}</span>
                                                            </div>
                                                            {code.redeemedBy && (
                                                                <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                                                                    <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                                                    <span>Br: {code.redeemedAt?.toDate?.().toLocaleDateString('da-DK') || '-'}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                            onClick={() => handleDeleteCode(code.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
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
        </motion.div>
    );
};

export default AdminMarketingPage;

