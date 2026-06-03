'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
    Activity, 
    ArrowLeft, 
    Clock, 
    Search, 
    Loader2, 
    BookOpen, 
    GraduationCap, 
    Filter, 
    RefreshCw, 
    Users, 
    Smartphone, 
    CheckCircle2, 
    Scale,
    FileText,
    BrainCircuit,
    Layers,
    AlertCircle,
    UserCheck,
    Globe,
    Zap,
    Circle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';

// --- Type definitions ---
interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    actionText: string;
    createdAt?: { toDate: () => Date };
}

export default function AdminActivityPage() {
    const { userProfile } = useApp();
    const firestore = useFirestore();
    const isAdmin = userProfile?.role === 'admin';

    // Page state
    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState<'all' | 'student' | 'lovportal'>('all');
    const [loadLimit, setLoadLimit] = useState(50);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Queries
    const activitiesQuery = useMemoFirebase(() => (
        firestore && isAdmin 
            ? query(collection(firestore, 'userActivities'), orderBy('createdAt', 'desc'), limit(loadLimit)) 
            : null
    ), [firestore, isAdmin, loadLimit]);

    const { data: activities, isLoading: isActivitiesLoading } = useCollection<ActivityItem>(activitiesQuery);

    const usersQuery = useMemoFirebase(() => (
        firestore && isAdmin ? query(collection(firestore, 'users')) : null
    ), [firestore, isAdmin]);

    const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);

    const adminIds = useMemo(() => {
        if (!users) return new Set<string>();
        return new Set<string>(users.filter(u => u.role === 'admin').map(u => u.id || u.uid));
    }, [users]);

    // Live User Presence & Login Analytics (Optimized & Symmetrical)
    const activeStats = useMemo(() => {
        if (!users) {
            return {
                activeTodayStudent: 0,
                activeTodayLovportal: 0,
                loggedInTodayStudent: 0,
                loggedInTodayLovportal: 0,
                onlineNowStudent: 0,
                onlineNowLovportal: 0,
                onlineNowUsers: [] as any[]
            };
        }

        const nonAdmins = users.filter(u => u.role !== 'admin');
        const now = new Date();
        
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        let activeTodayStudent = 0;
        let activeTodayLovportal = 0;
        let loggedInTodayStudent = 0;
        let loggedInTodayLovportal = 0;
        let onlineNowStudent = 0;
        let onlineNowLovportal = 0;
        const onlineNowUsers: any[] = [];

        nonAdmins.forEach(u => {
            // Student dates
            const lastActivityStudent = u.lastActivity?.toDate ? u.lastActivity.toDate() : (u.lastActivity ? new Date(u.lastActivity) : null);
            const lastLoginStudent = u.lastLogin?.toDate ? u.lastLogin.toDate() : (u.lastLogin ? new Date(u.lastLogin) : null);

            // Lovportal dates
            const lastActivityLovportal = u.lastActivityLovportal?.toDate ? u.lastActivityLovportal.toDate() : (u.lastActivityLovportal ? new Date(u.lastActivityLovportal) : null);
            const lastLoginLovportal = u.lastLoginLovportal?.toDate ? u.lastLoginLovportal.toDate() : (u.lastLoginLovportal ? new Date(u.lastLoginLovportal) : null);

            let isOnlineStudent = false;
            let isOnlineLovportal = false;

            // Student metrics
            if (lastActivityStudent && lastActivityStudent > twentyFourHoursAgo) activeTodayStudent++;
            if (lastLoginStudent && lastLoginStudent > twentyFourHoursAgo) loggedInTodayStudent++;
            if (lastActivityStudent && lastActivityStudent > fiveMinutesAgo) {
                onlineNowStudent++;
                isOnlineStudent = true;
            }

            // Lovportal metrics
            if (lastActivityLovportal && lastActivityLovportal > twentyFourHoursAgo) activeTodayLovportal++;
            if (lastLoginLovportal && lastLoginLovportal > twentyFourHoursAgo) loggedInTodayLovportal++;
            if (lastActivityLovportal && lastActivityLovportal > fiveMinutesAgo) {
                onlineNowLovportal++;
                isOnlineLovportal = true;
            }

            // Group online now users
            if (isOnlineStudent || isOnlineLovportal) {
                onlineNowUsers.push({
                    id: u.id || u.uid,
                    userName: u.username || u.email || 'Anonym',
                    isOnlineStudent,
                    isOnlineLovportal,
                    lastActivityStudent,
                    lastActivityLovportal
                });
            }
        });

        return {
            activeTodayStudent,
            activeTodayLovportal,
            loggedInTodayStudent,
            loggedInTodayLovportal,
            onlineNowStudent,
            onlineNowLovportal,
            onlineNowUsers
        };
    }, [users]);

    // Classify activity by platform (Cohero Student vs Cohero Lovportal)
    const getActivityDetails = (act: ActivityItem) => {
        const text = (act.actionText || '').toLowerCase();
        
        // Lovportal markers
        if (
            text.includes('paragraf') || 
            text.includes('lovportal') || 
            text.includes('slog') || 
            text.includes('lov-stien') || 
            text.includes('lovstien') || 
            text.includes('lov')
        ) {
            return {
                platform: 'lovportal' as const,
                platformName: 'Cohero Lovportal',
                badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/50',
                icon: Scale,
                iconColor: 'text-amber-600 bg-amber-50'
            };
        }

        // Student markers (Default)
        let icon = GraduationCap;
        let iconColor = 'text-indigo-600 bg-indigo-50';
        
        if (text.includes('begreb') || text.includes('begrebsguide')) {
            icon = BrainCircuit;
            iconColor = 'text-emerald-600 bg-emerald-50';
        } else if (text.includes('seminar') || text.includes('slide')) {
            icon = Layers;
            iconColor = 'text-purple-600 bg-purple-50';
        } else if (text.includes('kilde') || text.includes('henvisning')) {
            icon = FileText;
            iconColor = 'text-blue-600 bg-blue-50';
        }

        return {
            platform: 'student' as const,
            platformName: 'Cohero Student',
            badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/50',
            icon,
            iconColor
        };
    };

    // Filtered activities (Clickstream logs)
    const filteredActivities = useMemo(() => {
        if (!activities) return [];
        
        // Filter out admins to see only genuine student actions
        let result = activities.filter(act => !adminIds.has(act.userId));

        // Filter by platform
        if (platformFilter !== 'all') {
            result = result.filter(act => {
                const details = getActivityDetails(act);
                return details.platform === platformFilter;
            });
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase().trim();
            result = result.filter(act => 
                (act.userName || '').toLowerCase().includes(lowerQuery) ||
                (act.actionText || '').toLowerCase().includes(lowerQuery)
            );
        }

        return result;
    }, [activities, adminIds, platformFilter, searchQuery]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 800);
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="max-w-md w-full bg-white p-10 rounded-[3rem] border border-slate-200 text-center space-y-6">
                    <AlertCircleIcon className="w-12 h-12 text-rose-500 mx-auto" />
                    <h2 className="text-2xl font-black text-slate-900">Adgang Nægtet</h2>
                    <p className="text-slate-500 text-sm">Du skal være administrator for at se denne side.</p>
                    <Link href="/portal" className="inline-block px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider">Gå til Portalen</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-ink pb-32 pt-6">
            
            {/* Navigation Header */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="w-12 h-12 bg-white border border-slate-100 hover:bg-slate-50 rounded-2xl flex items-center justify-center text-slate-500 transition-all shadow-sm active:scale-95">
                        <ArrowLeft className="w-5 h-5 text-slate-900" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Brugeraktivitet & Presence</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Realtidsovervågning for Cohero Student & Cohero Lovportal
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all hover:shadow-sm active:scale-95 disabled:opacity-50"
                        title="Opdater aktivitet"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                    </button>
                    <div className="px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-indigo-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live radar aktiv
                    </div>
                </div>
            </header>

            {/* PLATFORM COMPARISON GRID (Student vs Lovportal) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                
                {/* 1. Cohero Student Analytics */}
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-40" />
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Cohero Student</span>
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-slate-400 text-xs font-semibold">Aktive i dag (24t):</span>
                                <span className="text-3xl font-black text-slate-900 serif">{isUsersLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-200" /> : activeStats.activeTodayStudent}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-slate-400 text-xs font-semibold">Logget ind i dag (24t):</span>
                                <span className="text-xl font-bold text-slate-800">{isUsersLoading ? '...' : activeStats.loggedInTodayStudent}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        {activeStats.onlineNowStudent} online lige nu
                    </div>
                </div>

                {/* 2. Cohero Lovportal Analytics */}
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col justify-between group hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-40" />
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Cohero Lovportal</span>
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Scale className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-slate-400 text-xs font-semibold">Aktive i dag (24t):</span>
                                <span className="text-3xl font-black text-slate-900 serif">{isUsersLoading ? <Loader2 className="w-4 h-4 animate-spin text-slate-200" /> : activeStats.activeTodayLovportal}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-slate-400 text-xs font-semibold">Logget ind i dag (24t):</span>
                                <span className="text-xl font-bold text-slate-800">{isUsersLoading ? '...' : activeStats.loggedInTodayLovportal}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-emerald-600 text-xs font-bold">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        {activeStats.onlineNowLovportal} online lige nu
                    </div>
                </div>

                {/* 3. Combined Pulse Radar */}
                <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black -z-10" />
                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Platform Puls</span>
                            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                                <Globe className="w-5 h-5 animate-spin duration-1000" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Online i alt nu (5 min)</p>
                            <p className="text-5xl font-black text-white serif mt-2 flex items-baseline gap-2">
                                {activeStats.onlineNowStudent + activeStats.onlineNowLovportal}
                                <span className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 font-sans">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Aktiv
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        Overvåger alle non-admin sessioner
                    </div>
                </div>
            </div>

            {/* LIVE PRESENCE AND ACTIVE USERS (WHO IS ONLINE RIGHT NOW) */}
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Online Users List */}
                <div className="lg:col-span-4 flex flex-col">
                    <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-900 serif flex items-center gap-3">
                                <UserCheck className="w-5 h-5 text-indigo-600" /> Online Nu ({activeStats.onlineNowUsers.length})
                            </h3>
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar space-y-4">
                            {isUsersLoading ? (
                                <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
                            ) : activeStats.onlineNowUsers.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                                    <p className="text-xs font-bold text-slate-400">Ingen aktive brugere i øjeblikket.</p>
                                </div>
                            ) : (
                                activeStats.onlineNowUsers.map((u) => (
                                    <div key={u.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate">{u.userName}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {u.isOnlineStudent ? 'Student' : ''} {u.isOnlineStudent && u.isOnlineLovportal ? '&' : ''} {u.isOnlineLovportal ? 'Lovportal' : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-1.5 shrink-0">
                                            {u.isOnlineStudent && <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" title="Aktiv på Cohero Student" />}
                                            {u.isOnlineLovportal && <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" title="Aktiv på Cohero Lovportal" />}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Live Activity Clickstream Log */}
                <div className="lg:col-span-8 flex flex-col">
                    <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full group">
                        
                        {/* Summary and Filters Bar */}
                        <div className="p-8 pb-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="text-xl font-black text-slate-900 serif flex items-center gap-3">
                                <Activity className="w-5 h-5 text-indigo-600" /> Realtids Hændelseslog
                            </h3>
                            
                            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setPlatformFilter('all')}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                        platformFilter === 'all' 
                                        ? 'bg-white text-slate-900 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Alle
                                </button>
                                <button
                                    onClick={() => setPlatformFilter('student')}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                        platformFilter === 'student' 
                                        ? 'bg-white text-indigo-700 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Student
                                </button>
                                <button
                                    onClick={() => setPlatformFilter('lovportal')}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                        platformFilter === 'lovportal' 
                                        ? 'bg-white text-amber-700 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    Lovportal
                                </button>
                            </div>
                        </div>

                        {/* Search and limit console */}
                        <div className="px-8 py-4 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Søg i hændelser..." 
                                    className="pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-slate-200 transition-all w-full"
                                />
                            </div>

                            <select 
                                value={loadLimit}
                                onChange={(e) => setLoadLimit(parseInt(e.target.value))}
                                className="bg-white border border-slate-200 py-2 px-3 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer"
                            >
                                <option value={50}>Vis 50 hændelser</option>
                                <option value={100}>Vis 100 hændelser</option>
                                <option value={200}>Vis 200 hændelser</option>
                            </select>
                        </div>

                        {/* Event list */}
                        <div className="divide-y divide-slate-50 overflow-y-auto max-h-[50vh] custom-scrollbar">
                            {isActivitiesLoading ? (
                                <div className="p-16 flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Henter logs...</p>
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div className="p-16 text-center space-y-2">
                                    <Activity className="w-10 h-10 text-slate-300 mx-auto" />
                                    <p className="text-xs font-bold text-slate-400">Ingen matchende hændelser i loggen.</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredActivities.map((act, idx) => {
                                        const details = getActivityDetails(act);
                                        const PlatformIcon = details.icon;
                                        
                                        return (
                                            <motion.div
                                                key={act.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ duration: 0.25, delay: Math.min(8, idx) * 0.03 }}
                                                className="p-5 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                                                        {act.userName?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    
                                                    <div className="space-y-1 min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 leading-snug">
                                                            {act.userName || 'Anonym'}{' '}
                                                            <span className="font-semibold text-slate-500">{act.actionText}</span>
                                                        </p>
                                                        
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider ${details.badgeColor}`}>
                                                                {details.platformName}
                                                            </span>
                                                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : 'Lige nu'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${details.iconColor} border border-slate-100/50 shadow-sm self-end sm:self-center`}>
                                                    <PlatformIcon className="w-4.5 h-4.5" />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </section>
                </div>

            </div>

        </div>
    );
}

// Fallback AlertCircle component
function AlertCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
    );
}
