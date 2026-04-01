'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, DocumentData, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Database, Loader2, AlertCircle, Trash2, CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, Sparkles, Palette, Layout, Gift, Bird, Ghost, Snowflake } from 'lucide-react';
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

    // Usage Limits States
    const [limitsSettings, setLimitsSettings] = useState<any>(null);
    const [isSavingLimits, setIsSavingLimits] = useState(false);
    
    // Theme States
    const [activeTheme, setActiveTheme] = useState<string>('default');
    const [isSavingTheme, setIsSavingTheme] = useState(false);

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

    useEffect(() => {
        const fetchLimits = async () => {
            if (!firestore) return;
            const docRef = doc(firestore, 'systemSettings', 'usageLimits');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setLimitsSettings(docSnap.data());
            } else {
                // Default hardcoded limits if none exist in DB
                setLimitsSettings({
                    Kollega: {
                        concepts: 1,
                        cases: 1,
                        journal: 0,
                        architect: 1,
                        oralExam: 1,
                        opinion: 0,
                        star: 1,
                        caseAnalyser: 0
                    },
                    'Kollega+': {
                        concepts: -1,
                        cases: -1,
                        journal: -1,
                        architect: -1,
                        oralExam: -1,
                        opinion: 10,
                        star: -1,
                        caseAnalyser: -1
                    }
                });
            }

            // Fetch Theme
            const themeRef = doc(firestore, 'systemSettings', 'activeTheme');
            const themeSnap = await getDoc(themeRef);
            if (themeSnap.exists()) {
                setActiveTheme(themeSnap.data().theme || 'default');
            }
        };
        fetchLimits();
    }, [firestore]);

    const handleSaveLimits = async () => {
        if (!firestore) return;
        setIsSavingLimits(true);
        try {
            await setDoc(doc(firestore, 'systemSettings', 'usageLimits'), limitsSettings);
            alert('Grænser opdateret korrekt!');
        } catch (error) {
            console.error("Error saving limits:", error);
            alert('Fejl ved gemning af grænser.');
        } finally {
            setIsSavingLimits(false);
        }
    };

    const handleSaveTheme = async (theme: string) => {
        if (!firestore) return;
        setIsSavingTheme(true);
        try {
            await setDoc(doc(firestore, 'systemSettings', 'activeTheme'), { theme });
            setActiveTheme(theme);
            alert('Tema opdateret! Platformens udseende ændrer sig for alle brugere nu.');
        } catch (error) {
            console.error("Error saving theme:", error);
            alert('Fejl ved gemning af tema.');
        } finally {
            setIsSavingTheme(false);
        }
    };

    const updateLimitValue = (tier: string, feature: string, value: string) => {
        const numValue = parseInt(value);
        setLimitsSettings((prev: any) => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                [feature]: isNaN(numValue) ? 0 : numValue
            }
        }));
    };

    const isLoading = pageViewsLoading || usersLoading || errorsLoading;

    const handleDeleteError = async (id: string) => {
        if (!firestore) return;
        if (confirm('Er du sikker på du vil slette denne fejl-log?')) {
            await deleteDoc(doc(firestore, 'systemErrors', id));
        }
    };

    return (
        <div className="space-y-8 animate-ink">
            {/* NEW: USAGE LIMITS SECTION */}
            <section className="bg-white rounded-[3rem] border border-blue-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-blue-50">
                    <h3 className="text-xl font-bold text-slate-900 serif flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600"/> Administrer Brugsgrænser
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Styr hvor mange gange brugere kan anvende forskellige værktøjer afhængig af deres medlemstype. (-1 betyder uendeligt)</p>
                </div>
                
                <div className="p-10">
                    {!limitsSettings ? (
                        <div className="flex justify-center p-10">
                            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {['Kollega', 'Kollega+'].map(tier => (
                                <div key={tier} className="space-y-4">
                                    <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${tier === 'Kollega' ? 'bg-slate-400' : 'bg-amber-500 animate-pulse'}`} />
                                        Grænser for <span className="text-slate-900">{tier}</span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            { id: 'concepts', label: 'Begrebsguide' },
                                            { id: 'cases', label: 'Case-træner' },
                                            { id: 'journal', label: 'Journal-træner' },
                                            { id: 'architect', label: 'Eksamens-Arkitekt' },
                                            { id: 'oralExam', label: 'Mundtlig Eksamen' },
                                            { id: 'opinion', label: 'Second Opinion' },
                                            { id: 'star', label: 'STAR Indsigt' },
                                            { id: 'caseAnalyser', label: 'Case-Analytiker' }
                                        ].map(feature => (
                                            <div key={feature.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">{feature.label}</label>
                                                <input 
                                                    type="number"
                                                    value={limitsSettings[tier][feature.id]}
                                                    onChange={(e) => updateLimitValue(tier, feature.id, e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-xl font-bold text-slate-900 focus:ring-0"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            
                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={handleSaveLimits}
                                    disabled={isSavingLimits}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {isSavingLimits ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    Gem Ændringer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* NEW: THEME MANAGEMENT SECTION */}
            <section className="bg-white rounded-[3rem] border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-amber-50">
                    <h3 className="text-xl font-bold text-slate-900 serif flex items-center gap-3">
                        <Palette className="w-5 h-5 text-amber-500"/> Platformens Tema
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Skift platformens visuelle udtryk til særlige begivenheder. (Jul, Påske osv.)</p>
                </div>
                
                <div className="p-10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { id: 'default', label: 'Standard', description: 'Rent & Moderne', icon: <Layout className="w-6 h-6 text-slate-400" />, color: 'bg-slate-100' },
                            { id: 'christmas', label: 'Jul', description: 'Sne & Hygge', icon: <Gift className="w-6 h-6 text-rose-500" />, color: 'bg-rose-50 border-rose-100' },
                            { id: 'easter', label: 'Påske', description: 'Forår & Æg', icon: <Bird className="w-6 h-6 text-yellow-500" />, color: 'bg-yellow-50 border-yellow-100' },
                            { id: 'halloween', label: 'Halloween', description: 'Gys & Græskar', icon: <Ghost className="w-6 h-6 text-orange-500" />, color: 'bg-orange-50 border-orange-100' }
                        ].map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => handleSaveTheme(theme.id)}
                                disabled={isSavingTheme}
                                className={`p-8 rounded-[2.5rem] border-2 transition-all text-left flex flex-col gap-4 relative group ${activeTheme === theme.id ? 'border-amber-950 bg-white ring-8 ring-amber-950/5' : 'border-transparent bg-slate-50 lg:hover:border-amber-200 lg:hover:bg-white lg:hover:scale-[1.02]'}`}
                            >
                                {activeTheme === theme.id && (
                                    <div className="absolute top-6 right-6">
                                        <div className="w-8 h-8 rounded-full bg-amber-950 flex items-center justify-center shadow-lg">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${theme.color}`}>
                                    {theme.id === 'christmas' && activeTheme === 'christmas' ? <Snowflake className="w-8 h-8 animate-spin" /> : theme.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">{theme.label}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{theme.description}</p>
                                </div>
                                {isSavingTheme && activeTheme !== theme.id && (
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] rounded-[2.5rem] flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-amber-950" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

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