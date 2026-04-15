
'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { 
  Loader2, 
  GraduationCap, 
  MapPin, 
  CalendarDays,
  Layers,
  CheckCircle2,
  Users,
  Search,
  School,
  TrendingUp,
  Brain,
  ChevronRight,
  Zap,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700 min-h-[160px] flex flex-col justify-between"
  >
    <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-[0.2em]">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-slate-900 serif leading-none">{value}</h3>
                {subValue && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subValue}</span>}
            </div>
        </div>
    </div>
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass.split(' ')[0]} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000`} />
  </motion.div>
);

const DistributionBar = ({ label, count, total, color, delay = 0 }: { label: string, count: number, total: number, color: string, delay?: number }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
                <span className="text-xs font-black text-slate-700 truncate max-w-[70%] uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{count} units ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 p-0.5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1.5, ease: "circOut", delay }}
                    className={`h-full ${color} rounded-full shadow-sm`}
                />
            </div>
        </div>
    );
};

export default function EducationStatsPage() {
    const [selectedUser, setSelectedUser] = React.useState<any>(null);
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('role', '==', 'user')) : null),
        [firestore]
    );
    const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);

    const stats = useMemo(() => {
        if (!users) return null;

        const totalUsers = users.length;
        const qualifiedCount = users.filter(u => u.isQualified).length;
        const studentCount = totalUsers - qualifiedCount;

        const semesterMap: Record<string, number> = {};
        const graduationMonths: number[] = [];
        const instMap: Record<string, number> = {};
        const profMap: Record<string, number> = {};
        const cohortMap: Record<string, number> = {};
        const gradCohortMap: Record<string, number> = {};

        users.forEach(u => {
            const prof = u.profession || 'Ikke angivet';
            profMap[prof] = (profMap[prof] || 0) + 1;

            if (u.isQualified) return;

            let semStr = u.semester || '';
            let semNum = parseInt(semStr.replace(/\D/g, ''));
            
            if (!isNaN(semNum) && semNum > 0 && semNum <= 8) {
                semesterMap[semNum] = (semesterMap[semNum] || 0) + 1;
                const semLeft = 7 - semNum;
                if (semLeft >= 0) graduationMonths.push(semLeft * 6);
            } else {
                semesterMap['Andet/Uvist'] = (semesterMap['Andet/Uvist'] || 0) + 1;
            }

            const inst = u.institution || 'Ikke angivet';
            instMap[inst] = (instMap[inst] || 0) + 1;

            if (u.studyStarted) {
                const date = new Date(u.studyStarted);
                const year = date.getFullYear();
                const month = date.getMonth() >= 8 ? 'Efterår' : 'Forår';
                const cohort = `${month} ${year}`;
                cohortMap[cohort] = (cohortMap[cohort] || 0) + 1;

                const isSpring = date.getMonth() < 6;
                const gradYear = isSpring ? year + 3 : year + 4;
                const gradMonthName = isSpring ? 'Juni' : 'Januar';
                const gradKey = `${gradMonthName} ${gradYear}`;
                gradCohortMap[gradKey] = (gradCohortMap[gradKey] || 0) + 1;
            }
        });

        const semesterData = Object.entries(semesterMap)
            .sort((a,b) => {
                if (a[0] === 'Andet/Uvist') return 1;
                if (b[0] === 'Andet/Uvist') return -1;
                return parseInt(a[0]) - parseInt(b[0]);
            });

        const topInst = Object.entries(instMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        const avgMonths = graduationMonths.length > 0 
            ? Math.round(graduationMonths.reduce((a, b) => a + b, 0) / graduationMonths.length)
            : 0;

        return {
            totalUsers, studentCount, qualifiedCount, avgMonths,
            semesterData, topInst, profMap, cohortMap, gradCohortMap
        };
    }, [users]);

    if (isUsersLoading) {
        return <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-slate-100" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Indlæser kohorte-data...</p>
        </div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-12 pb-20 animate-ink">
            {/* Header section with education vibe */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 serif mb-2">Education Demographics</h1>
                   <p className="text-slate-500 font-medium">Deep-dive i platformens akademiske fundment og dimittend-forecasts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/education/studieordninger" className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all group">
                        Administrér Studieordninger <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <div className="px-5 py-2.5 bg-slate-900 rounded-xl text-white">
                        <p className="text-[10px] font-black tracking-widest leading-none mb-1">TOTAL USERS</p>
                        <p className="text-xl font-black leading-none">{stats.totalUsers}</p>
                    </div>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard 
                    delay={0.1}
                    title="Time-to-Grad" 
                    value={`${stats.avgMonths} mdr.`} 
                    subValue="EST. AVERAGE"
                    icon={CalendarDays} 
                    colorClass="bg-blue-50 text-blue-600 border-blue-100/50"
                />
                <StatCard 
                    delay={0.2}
                    title="Primary Cohort" 
                    value={Object.entries(stats.profMap).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A'} 
                    subValue="TOP PROFESSION"
                    icon={Users} 
                    colorClass="bg-orange-50 text-orange-600 border-orange-100/50"
                />
                <StatCard 
                    delay={0.3}
                    title="Alumni Rate" 
                    value={`${((stats.qualifiedCount / stats.totalUsers) * 100).toFixed(1)}%`} 
                    subValue="OF TOTAL BASE"
                    icon={CheckCircle2} 
                    colorClass="bg-emerald-50 text-emerald-600 border-emerald-100/50"
                />
                <StatCard 
                    delay={0.4}
                    title="Key Institute" 
                    value={stats.topInst[0]?.[0]?.split(' ')[0] || 'N/A'} 
                    subValue="TOP INSTITUTION"
                    icon={School} 
                    colorClass="bg-purple-50 text-purple-600 border-purple-100/50"
                />
            </div>

            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* Left: Distributions */}
                <div className="xl:col-span-8 flex flex-col gap-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Semester Distribution */}
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-700">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 serif">Semestre</h3>
                                </div>
                            </div>
                            
                            <div className="space-y-6 flex-grow">
                                {stats.semesterData.map(([sem, count], idx) => (
                                    <DistributionBar 
                                        key={sem} 
                                        delay={idx * 0.05}
                                        label={sem === 'Andet/Uvist' ? 'Uvist' : `${sem}. Semester`} 
                                        count={count} 
                                        total={stats.studentCount} 
                                        color={sem === 'Andet/Uvist' ? 'bg-slate-200' : 'bg-slate-900'}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Top Institutions */}
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-700">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 serif">Top Institutter</h3>
                                </div>
                            </div>
                            
                            <div className="space-y-6 flex-grow">
                                {stats.topInst.map(([inst, count], idx) => (
                                    <DistributionBar 
                                        key={inst} 
                                        delay={idx * 0.05}
                                        label={inst} 
                                        count={count} 
                                        total={stats.studentCount} 
                                        color="bg-blue-600 shadow-blue-500/10"
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Graduation Timeline */}
                    <section className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 serif">Dimissions-prognose</h3>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1 ml-0.5">Forecast over kommende færdiguddannede</p>
                                </div>
                            </div>
                            <div className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm flex items-center gap-2">
                                <Zap className="w-4 h-4 fill-amber-600" /> AI Prediction Active
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                             <div className="space-y-6">
                                {Object.entries(stats.gradCohortMap)
                                    .filter(([key]) => key !== 'Uvist')
                                    .sort((a, b) => {
                                        const yearA = parseInt(a[0].split(' ')[1]);
                                        const yearB = parseInt(b[0].split(' ')[1]);
                                        if (yearA !== yearB) return yearA - yearB;
                                        return a[0].includes('Januar') ? -1 : 1;
                                    })
                                    .map(([gradKey, count], idx) => (
                                        <DistributionBar 
                                            key={gradKey} 
                                            delay={idx * 0.1}
                                            label={gradKey} 
                                            count={count} 
                                            total={stats.studentCount} 
                                            color="bg-slate-900"
                                        />
                                    ))}
                             </div>
                             <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex flex-col justify-between shadow-inner">
                                 <div className="space-y-6">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strategisk Forecast</h4>
                                    <p className="text-sm text-slate-600 font-semibold leading-relaxed">
                                        Data indikerer en majoritet af færdiguddannede socialrådgivere i kommende cyklusser. Optimér karrieremoduler i disse perioder.
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            'Udrul "Job-klar" flow 6 mdr. før grad',
                                            'Målret rekrutterings-mails i januar/juni',
                                            'Forstærk AI-CV hjælp til disse kohorter'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                                 <div className="mt-12 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                     <div className="relative z-10 flex items-center justify-between">
                                         <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Næste Store Bølge</p>
                                            <h5 className="text-2xl font-black text-slate-900 serif mt-1">
                                                {Object.entries(stats.gradCohortMap)
                                                    .filter(([k]) => k !== 'Uvist')
                                                    .sort((a,b) => {
                                                        const ya = parseInt(a[0].split(' ')[1]);
                                                        const yb = parseInt(b[0].split(' ')[1]);
                                                        if (ya !== yb) return ya - yb;
                                                        return a[0].includes('Januar') ? -1 : 1;
                                                    })[0]?.[0] || 'Syncing...'}
                                            </h5>
                                         </div>
                                         <Star className="w-8 h-8 text-amber-400 fill-amber-400 animate-pulse" />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </section>
                </div>

                {/* Right: Detailed Table */}
                <div className="xl:col-span-4">
                    <section className="bg-slate-900 rounded-[3.5rem] shadow-2xl p-10 flex flex-col h-full sticky top-8">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                <Brain className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white serif">Brugere</h3>
                                <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Real-time sync</p>
                            </div>
                        </div>

                        <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[1000px]">
                            {users?.slice(0, 50).map((u:any, i:number) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group"
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-[10px] uppercase">{u.username?.charAt(0) || u.displayName?.charAt(0)}</div>
                                            <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{u.username || u.displayName}</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                                        <span>{u.profession || 'Soc.Rådg.'}</span>
                                        <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md">{u.semester || 'Hoved'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

