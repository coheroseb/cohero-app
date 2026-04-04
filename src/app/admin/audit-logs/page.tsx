
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Loader2, Shield, User, Clock, Info, Search, Filter, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

const AuditLogPage = () => {
    const firestore = useFirestore();
    
    const logsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'auditLogs'), orderBy('timestamp', 'desc'), limit(100)) : null,
        [firestore]
    );
    const { data: logs, isLoading } = useCollection<any>(logsQuery);

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-rose-600 bg-rose-50 border-rose-100';
        if (action.includes('CREATE')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (action.includes('UPDATE')) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
        return 'text-slate-600 bg-slate-50 border-slate-100';
    };

    return (
        <div className="space-y-12 animate-ink pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 serif mb-2">Audit Logs</h1>
                    <p className="text-slate-500 font-medium">Sporing af alle administrative handlinger og platform-ændringer.</p>
                </div>
            </header>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-10 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 serif">Platform Activity Registry</h3>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Real-time oversight & accountability</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Søg i hændelser..."
                                className="h-14 pl-14 pr-8 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/30 transition-all w-72"
                            />
                         </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[500px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Synchronizing registry data...</p>
                        </div>
                    ) : logs?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6 text-slate-300">
                             <Shield className="w-16 h-16 opacity-20" />
                             <p className="font-black uppercase text-[10px] tracking-widest">Ingen hændelser logget endnu.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6">Handling / Type</th>
                                    <th className="px-10 py-6">Operatør</th>
                                    <th className="px-10 py-6">Mål (Target)</th>
                                    <th className="px-10 py-6">Tidspunkt</th>
                                    <th className="px-10 py-6 text-right">Detaljer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs?.map((log: any, idx: number) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        key={log.id} 
                                        className="hover:bg-slate-50/30 transition-colors group"
                                    >
                                        <td className="px-10 py-6">
                                            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border inline-block ${getActionColor(log.action)}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900 tracking-tight">{log.adminName}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Admin</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            {log.targetName ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-600">{log.targetName}</span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">ID: {log.targetId?.slice(0, 8)}...</span>
                                                </div>
                                            ) : <span className="text-slate-300 italic text-xs">-</span>}
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">{log.timestamp?.toDate().toLocaleString('da-DK', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                                <Info className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogPage;
