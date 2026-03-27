'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, deleteDoc, doc } from 'firebase/firestore';
import { Database, Loader2, AlertCircle, Trash2, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageView extends DocumentData {
  id: string;
  userId: string;
  path: string;
  timestamp: { toDate: () => Date };
}

interface UserData {
  id: string;
  username: string;
}

interface EnrichedPageView extends PageView {
  username?: string;
}

interface SystemError extends DocumentData {
    id: string;
    title: string;
    description: string;
    path: string;
    userName: string;
    userEmail: string;
    timestamp: { toDate: () => Date };
    status: 'new' | 'resolved';
}

const AdminSystemPage = () => {
    const firestore = useFirestore();

    const pageViewsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'pageViews'), orderBy('timestamp', 'desc'), limit(200)) : null,
        [firestore]
    );
    const { data: pageViews, isLoading: pageViewsLoading } = useCollection<PageView>(pageViewsQuery);

    const usersQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'users')) : null,
        [firestore]
    );
    const { data: users, isLoading: usersLoading } = useCollection<UserData>(usersQuery);

    const errorsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'systemErrors'), orderBy('timestamp', 'desc'), limit(100)) : null,
        [firestore]
    );
    const { data: systemErrors, isLoading: errorsLoading } = useCollection<SystemError>(errorsQuery);

    const [enrichedPageViews, setEnrichedPageViews] = useState<EnrichedPageView[]>([]);
    const [showActivityLog, setShowActivityLog] = useState(true);

    useEffect(() => {
        if (pageViews && users) {
            const userMap = new Map(users.map(u => [u.id, u.username]));
            const enriched = pageViews.map(view => ({
                ...view,
                username: userMap.get(view.userId) || 'Ukendt Bruger'
            }));
            setEnrichedPageViews(enriched);
        }
    }, [pageViews, users]);

    const isLoading = pageViewsLoading || usersLoading || errorsLoading;

    const handleDeleteError = async (id: string) => {
        if (!firestore) return;
        if (confirm('Er du sikker på du vil slette denne fejl-log?')) {
            await deleteDoc(doc(firestore, 'systemErrors', id));
        }
    };

    return (
        <div className="space-y-8 animate-ink">
            <section className="bg-white rounded-[3rem] border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-amber-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><Database className="w-5 h-5"/>Aktivitetslog</h3>
                        <p className="text-sm text-slate-500 mt-1">De seneste 200 sidevisninger på tværs af platformen.</p>
                    </div>
                    <button 
                        onClick={() => setShowActivityLog(!showActivityLog)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${showActivityLog ? 'bg-amber-50 text-amber-900 hover:bg-amber-100' : 'bg-slate-900 text-white shadow-lg'}`}
                    >
                        {showActivityLog ? <><EyeOff className="w-4 h-4" />Skjul log</> : <><Eye className="w-4 h-4" />Vis log</>}
                    </button>
                </div>
                <AnimatePresence>
                {showActivityLog && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="h-96 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-300"/>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                        <tr>
                                            <th className="px-6 py-3">Tidspunkt</th>
                                            <th className="px-6 py-3">Bruger</th>
                                            <th className="px-6 py-3">Side</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-50">
                                        {enrichedPageViews.map(view => (
                                            <tr key={view.id}>
                                                <td className="px-6 py-3 text-xs text-slate-500 font-mono">
                                                    {view.timestamp?.toDate().toLocaleString('da-DK', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-6 py-3 font-semibold text-amber-900">{view.username}</td>
                                                <td className="px-6 py-3 font-mono text-xs text-blue-700">{view.path}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {enrichedPageViews.length === 0 && (
                                    <p className="p-12 text-center text-slate-400 italic">Ingen sidevisninger er registreret endnu.</p>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
                </AnimatePresence>
            </section>

            <section className="bg-white rounded-[3rem] border border-rose-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-rose-50 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-rose-950 serif flex items-center gap-3"><AlertCircle className="w-5 h-5 text-rose-500"/>Systemfejl & Nedbrud</h3>
                        <p className="text-sm text-slate-500 mt-1">Fejlbeskeder vist for brugere (toasts) opsamlet automatisk.</p>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 text-left">Tidspunkt</th>
                                <th className="px-6 py-3 text-left">Fejl</th>
                                <th className="px-6 py-3 text-left">Sti / Bruger</th>
                                <th className="px-6 py-3 text-right">Handlinger</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50">
                            {(systemErrors || []).map(err => (
                                <tr key={err.id} className="group hover:bg-rose-50/30 transition-colors">
                                    <td className="px-6 py-6 text-xs text-slate-500 font-mono align-top">
                                        {err.timestamp?.toDate().toLocaleString('da-DK', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-6 align-top">
                                        <div className="font-bold text-rose-900 mb-1">{err.title}</div>
                                        <div className="text-xs text-slate-500 max-w-md italic">{err.description}</div>
                                    </td>
                                    <td className="px-6 py-6 align-top">
                                        <div className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-2">{err.path}</div>
                                        <div className="text-xs font-semibold text-slate-700">{err.userName}</div>
                                        <div className="text-[10px] text-slate-400">{err.userEmail}</div>
                                    </td>
                                    <td className="px-6 py-6 text-right align-top">
                                        <button 
                                            onClick={() => handleDeleteError(err.id)}
                                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(systemErrors || []).length === 0 && !errorsLoading && (
                        <div className="p-20 text-center">
                            <CheckCircle2 className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
                            <p className="text-slate-400 italic">Ingen systemfejl registreret. Browseren er ren!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AdminSystemPage;