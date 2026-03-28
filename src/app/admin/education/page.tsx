
'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { 
  Loader2, 
  GraduationCap, 
  MapPin, 
  Calendar,
  Layers,
  CheckCircle2,
  Users,
  Search,
  School
} from 'lucide-react';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';

const StatCard = ({ title, value, subValue, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${colorClass} flex items-center justify-center mb-4 shadow-inner`}>
            <Icon className="w-6 h-6" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-slate-900 serif">{value}</h3>
            {subValue && <span className="text-xs font-bold text-slate-400">{subValue}</span>}
        </div>
    </div>
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700`} />
  </div>
);

const DistributionBar = ({ label, count, total, color }: { label: string, count: number, total: number, color: string }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end px-1">
                <span className="text-[11px] font-bold text-slate-600 truncate max-w-[70%]">{label}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">{count} ({percentage.toFixed(0)}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color} rounded-full`}
                />
            </div>
        </div>
    );
};

export default function EducationStatsPage() {
    const { user, userProfile, isUserLoading } = useApp();
    const [selectedUser, setSelectedUser] = React.useState<any>(null);
    const router = useRouter();
    const firestore = useFirestore();

    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('role', '==', 'user')) : null),
        [firestore]
    );
    const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);

    useEffect(() => {
        if (!isUserLoading && (!user || userProfile?.role !== 'admin')) {
            router.replace('/portal');
        }
    }, [user, userProfile, isUserLoading, router]);

    const stats = useMemo(() => {
        if (!users) return null;

        const totalUsers = users.length;
        const qualifiedCount = users.filter(u => u.isQualified).length;
        const studentCount = totalUsers - qualifiedCount;

        // Semester distribution
        const semesterMap: Record<string, number> = {};
        const graduationMonths: number[] = [];
        
        // Institution distribution
        const instMap: Record<string, number> = {};
        
        // Profession distribution
        const profMap: Record<string, number> = {};
        
        // Study start distribution
        const cohortMap: Record<string, number> = {};
        
        // Graduation distribution
        const gradCohortMap: Record<string, number> = {};

        users.forEach(u => {
            // Profession
            const prof = u.profession || 'Ikke angivet';
            profMap[prof] = (profMap[prof] || 0) + 1;

            if (u.isQualified) return;

            // Semester parsing
            let semStr = u.semester || '';
            let semNum = parseInt(semStr.replace(/\D/g, ''));
            
            if (!isNaN(semNum) && semNum > 0 && semNum <= 8) {
                semesterMap[semNum] = (semesterMap[semNum] || 0) + 1;
                
                // Average study time left (approx 6 months per semester)
                // Goal is semester 7 completion
                const semLeft = 7 - semNum;
                if (semLeft >= 0) {
                    graduationMonths.push(semLeft * 6);
                }
            } else {
                semesterMap['Andet/Uvist'] = (semesterMap['Andet/Uvist'] || 0) + 1;
            }

            // Institution
            const inst = u.institution || 'Ikke angivet';
            instMap[inst] = (instMap[inst] || 0) + 1;

            // Study start cohorts
            if (u.studyStarted) {
                const date = new Date(u.studyStarted);
                const year = date.getFullYear();
                const month = date.getMonth() >= 8 ? 'Efterår' : 'Forår';
                const cohort = `${month} ${year}`;
                cohortMap[cohort] = (cohortMap[cohort] || 0) + 1;

                // Graduation forecast (Approx 3.5 years / 7 semesters later)
                // If started in Sept (Efterår), graduation is typically Feb (month 1) of year + 4
                // If started in Feb (Forår), graduation is typically July (month 6) of year + 3
                const isSpring = date.getMonth() < 6;
                const gradYear = isSpring ? year + 3 : year + 4;
                const gradMonthName = isSpring ? 'Juni' : 'Januar';
                const gradKey = `${gradMonthName} ${gradYear}`;
                gradCohortMap[gradKey] = (gradCohortMap[gradKey] || 0) + 1;
            } else if (!u.isQualified) {
                cohortMap['Uvist'] = (cohortMap['Uvist'] || 0) + 1;
                gradCohortMap['Uvist'] = (gradCohortMap['Uvist'] || 0) + 1;
            }
        });

        // Sorted semester data
        const semesterData = Object.entries(semesterMap)
            .sort((a,b) => {
                if (a[0] === 'Andet/Uvist') return 1;
                if (b[0] === 'Andet/Uvist') return -1;
                return parseInt(a[0]) - parseInt(b[0]);
            });

        // Top Institutions
        const topInst = Object.entries(instMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        // Average months to graduation
        const avgMonths = graduationMonths.length > 0 
            ? Math.round(graduationMonths.reduce((a, b) => a + b, 0) / graduationMonths.length)
            : 0;

        return {
            totalUsers,
            studentCount,
            qualifiedCount,
            avgMonths,
            semesterData,
            topInst,
            profMap,
            cohortMap,
            gradCohortMap
        };
    }, [users]);

    if (isUserLoading || isUsersLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-10 pb-20">
            {/* Header section with education vibe */}
            <div className="relative p-10 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -ml-48 -mb-48" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                            <Layers className="w-3 h-3" /> Demografi & Populasjon
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3 serif">Uddannelses-Indsigt</h1>
                        <p className="text-slate-400 text-lg max-w-xl font-medium">Deep-dive i brugernes uddannelsesstatus, semester-fordeling og institutioner.</p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-3xl text-center min-w-[140px]">
                            <p className="text-4xl font-black text-white">{stats.studentCount}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Studerende</p>
                        </div>
                        <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 p-6 rounded-3xl text-center min-w-[140px]">
                            <p className="text-4xl font-black text-amber-400">{stats.qualifiedCount}</p>
                            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">Færdiguddannede</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Gennemsnitlig tid tilbage" 
                    value={`${stats.avgMonths} mdr.`} 
                    subValue="til endt uddannelse"
                    icon={Calendar} 
                    colorClass="bg-blue-50 text-blue-600"
                />
                <StatCard 
                    title="Mest udbredte profession" 
                    value={Object.entries(stats.profMap).sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A'} 
                    subValue="Primær målgruppe"
                    icon={Users} 
                    colorClass="bg-orange-50 text-orange-600"
                />
                <StatCard 
                    title="Dimittend Rate" 
                    value={`${((stats.qualifiedCount / stats.totalUsers) * 100).toFixed(1)}%`} 
                    subValue="af den samlede base"
                    icon={CheckCircle2} 
                    colorClass="bg-emerald-50 text-emerald-600"
                />
                <StatCard 
                    title="Top Institution" 
                    value={stats.topInst[0]?.[0]?.split(' ')[0] || 'N/A'} 
                    subValue={stats.topInst[0]?.[0] || ''}
                    icon={School} 
                    colorClass="bg-purple-50 text-purple-600"
                />
            </div>

            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Semester Distribution */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 serif">Semester Fordeling</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Hvor langt er de studerende?</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    
                    <div className="space-y-6 flex-grow">
                        {stats.semesterData.map(([sem, count]) => (
                            <DistributionBar 
                                key={sem} 
                                label={sem === 'Andet/Uvist' ? 'Uvist' : `${sem}. Semester`} 
                                count={count} 
                                total={stats.studentCount} 
                                color={sem === 'Andet/Uvist' ? 'bg-slate-300' : 'bg-amber-500'}
                            />
                        ))}
                    </div>
                </div>

                {/* Institution Distribution */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 serif">Top Institutioner</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Hvor kommer de studerende fra?</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                            <MapPin className="w-5 h-5" />
                        </div>
                    </div>
                    
                    <div className="space-y-6 flex-grow">
                        {stats.topInst.map(([inst, count]) => (
                            <DistributionBar 
                                key={inst} 
                                label={inst} 
                                count={count} 
                                total={stats.studentCount} 
                                color="bg-blue-600"
                            />
                        ))}
                    </div>
                </div>

                {/* Study Start Distribution */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 serif">Optagelses-fordeling</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">Hvornår startede de studerende?</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>
                    
                    <div className="space-y-6 flex-grow">
                        {Object.entries(stats.cohortMap)
                            .sort((a, b) => {
                                if (a[0] === 'Uvist') return 1;
                                if (b[0] === 'Uvist') return -1;
                                // Sort by year desc, then month
                                const partsA = a[0].split(' ');
                                const partsB = b[0].split(' ');
                                const yearA = parseInt(partsA[1]);
                                const yearB = parseInt(partsB[1]);
                                if (yearA !== yearB) return yearB - yearA;
                                return a[0].includes('Efterår') ? -1 : 1;
                            })
                            .slice(0, 5)
                            .map(([cohort, count]) => (
                                <DistributionBar 
                                    key={cohort} 
                                    label={cohort} 
                                    count={count} 
                                    total={stats.studentCount} 
                                    color="bg-emerald-500"
                                />
                            ))}
                    </div>
                </div>

            </div>

            {/* Graduation Timeline Forecast Charts */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 serif tracking-tight">Dimissions-prognose</h3>
                        <p className="text-sm font-medium text-slate-500 mt-1">Hvornår forventer vi et boom af færdiguddannede socialrådgivere?</p>
                    </div>
                    <div className="px-5 py-2.5 bg-amber-50 rounded-2xl text-amber-700 text-xs font-black uppercase tracking-widest border border-amber-100 shadow-sm flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Prognose-værktøj
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-6">
                        {Object.entries(stats.gradCohortMap)
                            .filter(([key]) => key !== 'Uvist')
                            .sort((a, b) => {
                                const yearA = parseInt(a[0].split(' ')[1]);
                                const yearB = parseInt(b[0].split(' ')[1]);
                                if (yearA !== yearB) return yearA - yearB;
                                return a[0].includes('Januar') ? -1 : 1;
                            })
                            .map(([gradKey, count]) => (
                                <DistributionBar 
                                    key={gradKey} 
                                    label={gradKey} 
                                    count={count} 
                                    total={stats.studentCount} 
                                    color="bg-slate-900"
                                />
                            ))}
                     </div>
                     <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-between">
                         <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Strategisk Indsigt</h4>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                Ved at kortlægge hvornår de studerende afslutter, kan vi:
                            </p>
                            <ul className="mt-4 space-y-3">
                                {[
                                    'Planlægge jobsøgningsmøder',
                                    'Prioritere studieordnings-match',
                                    'Lave målrettet annoncering overfor arbejdsgivere',
                                    'Sende automatiske "tillykke" flows'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                         </div>
                         <div className="mt-10 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                             <div className="relative z-10 flex items-center justify-between">
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Næste Bølge</p>
                                    <h5 className="text-xl font-black text-slate-900 serif mt-1">
                                        {Object.entries(stats.gradCohortMap)
                                            .filter(([k]) => k !== 'Uvist')
                                            .sort((a,b) => {
                                                const ya = parseInt(a[0].split(' ')[1]);
                                                const yb = parseInt(b[0].split(' ')[1]);
                                                if (ya !== yb) return ya - yb;
                                                return a[0].includes('Januar') ? -1 : 1;
                                            })[0]?.[0] || 'Ingen data'}
                                    </h5>
                                 </div>
                                 <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }} 
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white"
                                 >
                                    <Calendar className="w-5 h-5" />
                                 </motion.div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>

            {/* Graduation Timeline Forecast */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-10 rounded-[2.5rem] border border-amber-100/50">
                 <div className="flex flex-col md:flex-row items-center gap-10">
                    <div className="w-24 h-24 rounded-3xl bg-white shadow-xl shadow-amber-500/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-12 h-12 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-amber-950 serif mb-2">Dimission og Rekrutterings-potentiale</h3>
                        <p className="text-amber-900/60 font-medium leading-relaxed max-w-2xl">
                            Ved at analysere semester-data kan vi forudsige flowet af færdiguddannede socialrådgivere. 
                            I gennemsnit har basen <span className="text-amber-700 font-bold">{stats.avgMonths} måneder</span> tilbage til deres "Aha-moment" som jobsøgende. 
                            Dette giver os mulighed for at målrette karriere-moduler og rekrutterings-samarbejder 6-12 måneder før graduation.
                        </p>
                    </div>
                 </div>
            </div>

            {/* Detailed Table (Optional) */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Seneste aktive studerende</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Søg..." className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 outline-none w-48 transition-all focus:w-64" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-8 py-4">Navn</th>
                                <th className="px-8 py-4">Uddannelse</th>
                                <th className="px-8 py-4">Semester</th>
                                <th className="px-8 py-4">Forventet Afsluttet</th>
                                <th className="px-8 py-4 text-right">Potentiale</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users?.slice(0, 20).map((u, i) => (
                                <tr 
                                    key={i} 
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedUser(u)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">{u.username?.charAt(0) || u.displayName?.charAt(0)}</div>
                                            <span className="font-bold text-slate-700">{u.username || u.displayName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{u.profession || 'Socialrådgiver'}</td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${u.isQualified ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.isQualified ? 'Færdig' : u.semester || 'Hovedmenu'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-slate-700">
                                        {u.studyStarted ? (
                                            (() => {
                                                const d = new Date(u.studyStarted);
                                                const isSpring = d.getMonth() < 6;
                                                const gradYear = isSpring ? d.getFullYear() + 3 : d.getFullYear() + 4;
                                                const gradMonth = isSpring ? 'Juni' : 'Januar';
                                                return `${gradMonth} ${gradYear}`;
                                            })()
                                        ) : 'Uvist'}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1 text-amber-600 font-black text-xs">
                                            {u.cohéroPoints || 0} <Layers className="w-3 h-3" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Details Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <UserDetailModal 
                        user={selectedUser} 
                        onClose={() => setSelectedUser(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

const UserDetailModal = ({ user, onClose }: { user: any, onClose: () => void }) => {
    const firestore = useFirestore();
    
    const curriculumsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.institution || !user?.profession) return null;
        return query(
            collection(firestore, 'curriculums'), 
            where('institution', '==', user.institution),
            where('profession', '==', user.profession)
        );
    }, [firestore, user?.institution, user?.profession]);
    
    const { data: curriculums, isLoading } = useCollection<any>(curriculumsQuery);
    
    const activeModule = useMemo(() => {
        if (!curriculums || curriculums.length === 0 || !user?.semester || !user?.studyStarted) return null;
        
        // Match version based on studyStarted
        const curr = curriculums.find((c: any) => {
            const start = c.validFrom;
            const end = c.validTo;
            if (!start) return false;
            if (user.studyStarted < start) return false;
            if (end && user.studyStarted >= end) return false;
            return true;
        });

        if (!curr) return null;
        
        const semNum = user.semester.replace(/\D/g, '');
        return curr.modules?.find((m: any) => 
            m.id?.includes(semNum) || 
            (m.name && m.name.toLowerCase().includes(semNum))
        );
    }, [curriculums, user?.semester, user?.studyStarted]);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 font-black text-xl">
                            {user.username?.charAt(0) || user.displayName?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{user.username || user.displayName}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{user.profession || 'Socialrådgiver'} • {user.semester || 'Uvist'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors font-bold text-slate-400">Luk</button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Academic Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Institution</p>
                           <div className="flex items-center gap-2 text-slate-900 font-bold truncate">
                               <School className="w-4 h-4 text-amber-500 shrink-0" />
                               {user.institution || 'Ikke angivet'}
                           </div>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Studie-start (Beregnet)</p>
                           <div className="flex items-center gap-2 text-slate-900 font-bold">
                               <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                               {user.studyStarted ? new Date(user.studyStarted).toLocaleDateString('da-DK', { year: 'numeric', month: 'long' }) : 'Uvist'}
                           </div>
                        </div>
                    </div>

                    {/* Curriculum Insight */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900 serif">Studieordnings-Indsigt</h3>
                            {!isLoading && !activeModule && user.institution && (
                                <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-full uppercase tracking-widest border border-rose-100/50">Kunne ikke matches</span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
                        ) : activeModule ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-amber-50/50 border border-amber-100 p-8 rounded-[2rem] space-y-4 shadow-sm shadow-amber-900/5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0">
                                        <Layers className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest mb-1">Gældende for {user.semester}</p>
                                        <h4 className="text-xl font-black text-amber-950 tracking-tight">{activeModule.name}</h4>
                                    </div>
                                </div>
                                
                                <div className="h-[1px] w-full bg-amber-200/50" />
                                
                                <div className="prose prose-amber max-w-none">
                                    <p className="text-amber-900/80 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                        {activeModule.about || activeModule.description || 'Ingen yderligere beskrivelse fundet i studieordningen for dette semester.'}
                                    </p>
                                </div>
                                
                                <div className="pt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                                    {activeModule.ects && <span className="px-3 py-1 bg-white border border-amber-200 rounded-full text-amber-800">{activeModule.ects} ECTS</span>}
                                    <span className="px-3 py-1 bg-white border border-amber-200 rounded-full text-amber-800">Studieordnings-match</span>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-bold text-slate-500">Intet studieordnings-match fundet</p>
                                <p className="text-xs font-medium text-slate-400 mt-1 max-w-xs">
                                    Der er ikke uploadet en studieordning for {user.institution || 'institutionen'}, der dækker brugerens start-tidspunkt.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

