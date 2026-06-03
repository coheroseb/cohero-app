'use client';

import React, { useMemo, useState } from 'react';
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
    TrendingUp, 
    Users, 
    Smartphone, 
    CheckCircle2, 
    Server, 
    Layers,
    FileText,
    BrainCircuit,
    Scale,
    Trash2
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';

// --- Type definition ---
interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    actionText: string;
    createdAt?: { toDate: () => Date };
}

export default function AdminActivityPage() {
    const { user: currentUser, userProfile } = useApp();
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

    // Filtered activities
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

    // Engagement statistics
    const stats = useMemo(() => {
        if (!activities) return { studentCount: 0, lovportalCount: 0, totalCount: 0 };
        
        const nonAdminActs = activities.filter(act => !adminIds.has(act.userId));
        let studentCount = 0;
        let lovportalCount = 0;

        nonAdminActs.forEach(act => {
            const details = getActivityDetails(act);
            if (details.platform === 'lovportal') {
                lovportalCount++;
            } else {
                studentCount++;
            }
        });

        return {
            studentCount,
            lovportalCount,
            totalCount: nonAdminActs.length
        };
    }, [activities, adminIds]);

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
                        <h1 className="text-3xl font-black text-slate-900 serif tracking-tight">Brugeraktivitet</h1>
                        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Overvågning & Analytics for Cohero Student & Lovportal
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
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live overvågning aktiv
                    </div>
                </div>
            </header>

            {/* Platform Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Aktivitet (Viser sidste {loadLimit})</p>
                        <p className="text-3xl font-black text-slate-900 serif mt-1">{stats.totalCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Cohero Student Aktivitet</p>
                        <p className="text-3xl font-black text-indigo-600 serif mt-1">{stats.studentCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Cohero Lovportal Aktivitet</p>
                        <p className="text-3xl font-black text-amber-600 serif mt-1">{stats.lovportalCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Scale className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Filter and Search Panel */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Søg efter studerende eller handling..." 
                        className="pl-11 pr-4 py-3.5 bg-slate-50 border border-transparent rounded-2xl text-xs font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-600/5 focus:border-slate-200 transition-all w-full"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Platform:</span>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-100">
                        <button
                            onClick={() => setPlatformFilter('all')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                platformFilter === 'all' 
                                ? 'bg-white text-slate-900 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Alle
                        </button>
                        <button
                            onClick={() => setPlatformFilter('student')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                platformFilter === 'student' 
                                ? 'bg-white text-indigo-700 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Student
                        </button>
                        <button
                            onClick={() => setPlatformFilter('lovportal')}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                                platformFilter === 'lovportal' 
                                ? 'bg-white text-amber-700 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            Lovportal
                        </button>
                    </div>

                    <select 
                        value={loadLimit}
                        onChange={(e) => setLoadLimit(parseInt(e.target.value))}
                        className="bg-white border border-slate-200 py-2.5 px-4 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
                    >
                        <option value={50}>Vis 50 hændelser</option>
                        <option value={100}>Vis 100 hændelser</option>
                        <option value={200}>Vis 200 hændelser</option>
                    </select>
                </div>
            </div>

            {/* Real-time Activity Logs List */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
                <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 serif flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-600" /> Hændelseslog
                    </h3>
                    <span className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> {filteredActivities.length} fundet
                    </span>
                </div>

                <div className="divide-y divide-slate-50 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {isActivitiesLoading ? (
                        <div className="p-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Henter hændelser...</p>
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <Activity className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-slate-500 font-bold">Ingen hændelser matchede dine filtre.</p>
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
                                        transition={{ duration: 0.3, delay: Math.min(8, idx) * 0.04 }}
                                        className="p-6 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all border-l-4 border-transparent hover:border-indigo-500"
                                    >
                                        <div className="flex items-start sm:items-center gap-5 min-w-0">
                                            {/* Initial Avatar */}
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                                                {act.userName?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            
                                            {/* Name & Action Details */}
                                            <div className="space-y-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 leading-snug">
                                                    {act.userName || 'Anonym bruger'}{' '}
                                                    <span className="font-semibold text-slate-500">{act.actionText}</span>
                                                </p>
                                                
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-black uppercase tracking-wider ${details.badgeColor}`}>
                                                        {details.platformName}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {act.createdAt?.toDate ? act.createdAt.toDate().toLocaleString('da-DK', { 
                                                            day: 'numeric', 
                                                            month: 'short', 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        }) : 'Lige nu'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Icon Indicator */}
                                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${details.iconColor} border border-slate-100 shadow-sm`}>
                                                <PlatformIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
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
