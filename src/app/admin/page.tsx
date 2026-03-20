
'use client';
import React, { useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Zap, PlusCircle, Mail, FileText, AlertTriangle, MessageSquare } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, subValue, icon: Icon, color, loading, href }: any) => (
    <Link href={href} className="block bg-white p-6 rounded-[2rem] border border-amber-100/60 shadow-sm group hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
            {subValue && (
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {subValue}
                </span>
            )}
        </div>
        <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">{title}</p>
        <div className="text-3xl font-black text-amber-950 serif flex items-center gap-2">
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-amber-200" /> : value}
        </div>
    </Link>
);

const UserActivityFeed = () => {
    const firestore = useFirestore();
    const activitiesQuery = useMemoFirebase(() => (
        firestore 
        ? query(collection(firestore, 'userActivities'), orderBy('createdAt', 'desc'), limit(5)) 
        : null
    ), [firestore]);

    const { data: activities, isLoading } = useCollection(activitiesQuery);

    if (isLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>;
    }

    if (!activities || activities.length === 0) {
        return <div className="p-12 text-center text-slate-400 italic">Ingen aktivitet at vise endnu.</div>
    }

    return (
        <div className="p-10 space-y-6">
            {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-600">
                            <span className="font-bold text-amber-950">{activity.userName}</span>{' '}
                            {activity.actionText}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            {activity.createdAt?.toDate().toLocaleString('da-DK')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

export default function AdminOverviewPage() {
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users'), where('role', '==', 'user')) : null), [firestore]);
    const { data: users, isLoading } = useCollection<any>(usersQuery);

    const stats = useMemo(() => {
        if (!users) {
            return { totalUsers: 0, monthlyTokenCost: 0, averageRating: 0, waitlistConversion: 0 };
        }
        
        const totalUsers = users.length;

        const totalMonthlyTokens = users.reduce((acc, user) => {
            const now = new Date();
            const lastUpdate = user.monthlyTokenTimestamp?.toDate();
            if (lastUpdate && lastUpdate.getMonth() === now.getMonth() && lastUpdate.getFullYear() === now.getFullYear()) {
                return acc + (user.monthlyInputTokens || 0) + (user.monthlyOutputTokens || 0);
            }
            return acc;
        }, 0);

        const costPerMillionInput = 0.35 * 6.95; // Fictional USD to DKK
        const costPerMillionOutput = 0.70 * 6.95; // Fictional USD to DKK
        const monthlyTokenCost = (users.reduce((acc, u) => acc + (u.monthlyInputTokens || 0), 0) / 1000000 * costPerMillionInput) + (users.reduce((acc, u) => acc + (u.monthlyOutputTokens || 0), 0) / 1000000 * costPerMillionOutput);

        const ratedUsers = users.filter(u => typeof u.platformRating === 'number' && u.platformRating > 0);
        const averageRating = ratedUsers.length > 0
            ? ratedUsers.reduce((acc, u) => acc + u.platformRating, 0) / ratedUsers.length
            : 0;

        return {
            totalUsers,
            monthlyTokenCost: monthlyTokenCost.toFixed(2),
            averageRating: averageRating.toFixed(1),
            waitlistConversion: 68 // Placeholder
        };
    }, [users]);

    return (
        <div className="space-y-12 animate-ink">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Aktive Kolleger" 
                    value={stats.totalUsers} 
                    icon={Users} 
                    color="bg-indigo-50 text-indigo-700" 
                    loading={isLoading}
                    href="/admin/users"
                />
                <StatCard 
                    title="AI Forbrug (mdr)" 
                    value={`${stats.monthlyTokenCost} kr.`} 
                    icon={DollarSign} 
                    color="bg-emerald-50 text-emerald-700" 
                    loading={isLoading}
                    href="/admin/system"
                />
                <StatCard 
                    title="Gns. Vurdering" 
                    value={`${stats.averageRating} / 5`}
                    icon={StarIcon} 
                    color="bg-amber-50 text-amber-700" 
                    loading={isLoading}
                    href="/admin/users"
                />
                <StatCard 
                    title="Venteliste Konvertering" 
                    value={`${stats.waitlistConversion}%`}
                    icon={TrendingUp} 
                    color="bg-rose-50 text-rose-700"
                    loading={false}
                    href="/admin/marketing"
                />
            </div>
            
            <div className="grid lg:grid-cols-12 gap-10">
                <section className="lg:col-span-8 bg-white rounded-[3rem] border border-amber-100 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-10 border-b border-amber-50 flex items-center justify-between">
                       <div>
                          <h3 className="text-xl font-bold text-amber-950 serif">Seneste Brugeraktivitet</h3>
                          <p className="text-xs text-slate-400 mt-1">Et realtidsoverblik over, hvad der sker på platformen.</p>
                       </div>
                    </div>
                    <UserActivityFeed />
                </section>

                <section className="lg:col-span-4 space-y-8">
                     <div className="bg-amber-950 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                           <h3 className="text-lg font-bold serif mb-8 flex items-center gap-3">
                              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                              Hurtige Handlinger
                           </h3>
                           <div className="grid gap-3">
                              <Link href="/admin/marketing" className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-amber-950 transition-all group/btn">
                                 <div className="flex items-center gap-3">
                                    <PlusCircle className="w-4 h-4" />
                                    <span className="text-xs font-bold">Generér Koder</span>
                                 </div>
                              </Link>
                              <Link href="/admin/users" className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-amber-950 transition-all group/btn">
                                 <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-xs font-bold">Brugerkommunikation</span>
                                 </div>
                              </Link>
                           </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] border border-amber-100 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-rose-500" /> Seneste Feedback
                        </h4>
                        <div className="space-y-4">
                           <p className="text-xs text-slate-400 italic text-center py-4">Ingen ny feedback.</p>
                        </div>
                     </div>
                </section>
            </div>
        </div>
    );
}
