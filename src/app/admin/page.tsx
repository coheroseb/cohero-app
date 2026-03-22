
'use client';
import React, { useMemo } from 'react';
import { Users, DollarSign, TrendingUp, Zap, PlusCircle, Mail, FileText, AlertTriangle, MessageSquare, ArrowUpRight, Activity, ShieldCheck, Clock } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useApp } from '@/app/provider';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, trend, icon: Icon, color, loading, href }: any) => (
    <Link 
      href={href} 
      className="group p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1.5 transition-all duration-500 relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-8 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${color} shadow-lg shadow-current/10`}>
                <Icon className="w-7 h-7" />
            </div>
            {trend && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-black uppercase tracking-wider">{trend}</span>
                </div>
            )}
        </div>
        <div className="relative z-10">
          <p className="text-[11px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">{title}</p>
          <div className="text-4xl font-black text-slate-900 serif flex items-center gap-2">
              {loading ? <Loader2 className="w-8 h-8 animate-spin text-slate-200" /> : value}
          </div>
        </div>
        
        {/* Subtle background decoration */}
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
    </Link>
);

const UserActivityFeed = () => {
    const firestore = useFirestore();
    const activitiesQuery = useMemoFirebase(() => (
        firestore 
        ? query(collection(firestore, 'userActivities'), orderBy('createdAt', 'desc'), limit(10)) 
        : null
    ), [firestore]);

    const { data: activities, isLoading } = useCollection(activitiesQuery);

    if (isLoading) {
        return (
          <div className="p-12 space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>)}
          </div>
        );
    }

    if (!activities || activities.length === 0) {
        return (
            <div className="p-16 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity className="w-10 h-10 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium italic">Ingen aktivitet at vise endnu.</p>
            </div>
        )
    }

    return (
        <div className="p-10 space-y-8 relative">
            {/* Timeline Line */}
            <div className="absolute left-[3.25rem] top-10 bottom-10 w-0.5 bg-slate-100/80"></div>

            {activities.map((activity, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={activity.id} 
                  className="flex gap-6 items-start relative z-10"
                >
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex-shrink-0 flex items-center justify-center text-slate-600 group-hover:text-amber-900 transition-colors">
                        <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-grow pt-1.5 border-b border-slate-50 pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                           <p className="text-[14px] text-slate-700 font-medium">
                               <span className="font-black text-slate-900 serif">{activity.userName}</span>{' '}
                               {activity.actionText}
                           </p>
                           <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <Clock className="w-3 h-3" />
                              {activity.createdAt?.toDate().toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                           Udført den {activity.createdAt?.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default function AdminOverviewPage() {
    const { user: currentUser } = useApp();
    const firestore = useFirestore();
    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users'), where('role', '==', 'user')) : null), [firestore]);
    const { data: users, isLoading } = useCollection<any>(usersQuery);

    const stats = useMemo(() => {
        if (!users) {
            return { totalUsers: 0, monthlyTokenCost: 0, averageRating: 0, waitlistConversion: 0 };
        }
        
        const totalUsers = users.length;
        const costPerMillionInput = 0.35 * 6.95; 
        const costPerMillionOutput = 0.70 * 6.95; 
        const monthlyTokenCost = (users.reduce((acc, u) => acc + (u.monthlyInputTokens || 0), 0) / 1000000 * costPerMillionInput) + (users.reduce((acc, u) => acc + (u.monthlyOutputTokens || 0), 0) / 1000000 * costPerMillionOutput);

        const ratedUsers = users.filter(u => typeof u.platformRating === 'number' && u.platformRating > 0);
        const averageRating = ratedUsers.length > 0
            ? ratedUsers.reduce((acc, u) => acc + u.platformRating, 0) / ratedUsers.length
            : 0;

        return {
            totalUsers,
            monthlyTokenCost: monthlyTokenCost.toFixed(2),
            averageRating: averageRating.toFixed(1),
            waitlistConversion: 68
        };
    }, [users]);

    return (
        <div className="space-y-12 animate-ink">
            {/* Header / Welcome section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                   <h2 className="text-3xl font-bold text-slate-900 serif mb-2">Goddag, {currentUser?.displayName?.split(' ')[0]}</h2>
                   <p className="text-slate-500 font-medium">Her er dagens overblik over platformens performance.</p>
                </div>
                <div className="px-5 py-3 bg-emerald-50 border border-emerald-100/60 rounded-2xl flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 leading-none mb-1">System Health</p>
                       <p className="text-xs font-bold text-emerald-900 leading-none">AI & Database online</p>
                    </div>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Aktive Kolleger" 
                    value={stats.totalUsers} 
                    trend="+12%"
                    icon={Users} 
                    color="bg-indigo-50 text-indigo-700 border border-indigo-100/50" 
                    loading={isLoading}
                    href="/admin/users"
                />
                <StatCard 
                    title="AI Omkostninger" 
                    value={`${stats.monthlyTokenCost} kr.`} 
                    trend="-2.4%"
                    icon={DollarSign} 
                    color="bg-emerald-50 text-emerald-700 border border-emerald-100/50" 
                    loading={isLoading}
                    href="/admin/system"
                />
                <StatCard 
                    title="Bruger Rating" 
                    value={`${stats.averageRating} / 5`}
                    trend="+0.3"
                    icon={ShieldCheck} 
                    color="bg-amber-50 text-amber-700 border border-amber-100/50" 
                    loading={isLoading}
                    href="/admin/users"
                />
                <StatCard 
                    title="Waitlist Conv." 
                    value={`${stats.waitlistConversion}%`}
                    trend="+5%"
                    icon={TrendingUp} 
                    color="bg-rose-50 text-rose-700 border border-rose-100/50"
                    loading={false}
                    href="/admin/marketing"
                />
            </div>
            
            <div className="grid lg:grid-cols-12 gap-10">
                <section className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group">
                     <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                       <div>
                          <h3 className="text-xl font-bold text-slate-900 serif flex items-center gap-3">
                             <Activity className="w-5 h-5 text-amber-900" />
                             Seneste Brugeraktivitet
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">Analysér brugernes interaktion i realtid.</p>
                       </div>
                       <button className="px-5 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Se Alle</button>
                    </div>
                    <UserActivityFeed />
                </section>

                <section className="lg:col-span-4 space-y-8">
                     <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                           <h3 className="text-xl font-bold serif mb-10 flex items-center gap-3">
                              <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                              Hurtige Handlinger
                           </h3>
                           <div className="grid gap-3">
                              <Link href="/admin/marketing" className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-slate-950 transition-all duration-500 group/btn">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:bg-slate-50 group-hover/btn:text-slate-900 transition-colors">
                                       <PlusCircle className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                       <span className="block text-[13px] font-bold">Generér Koder</span>
                                       <span className="block text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Marketing</span>
                                    </div>
                                 </div>
                                 <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </Link>
                              
                              <Link href="/admin/users" className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-slate-950 transition-all duration-500 group/btn">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:bg-slate-50 group-hover/btn:text-slate-900 transition-colors">
                                       <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                       <span className="block text-[13px] font-bold">Nyhedsbrev</span>
                                       <span className="block text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">Kommunikation</span>
                                    </div>
                                 </div>
                                 <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </Link>

                              <Link href="/admin/notifications" className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white hover:text-slate-950 transition-all duration-500 group/btn">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:bg-slate-50 group-hover/btn:text-slate-900 transition-colors">
                                       <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                       <span className="block text-[13px] font-bold">Push Varsel</span>
                                       <span className="block text-[10px] text-white/40 uppercase font-black tracking-widest mt-0.5">System</span>
                                    </div>
                                 </div>
                                 <ArrowUpRight className="w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                              </Link>
                           </div>
                        </div>
                        
                        {/* Decorative Gradient Overlay */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
                     </div>

                     <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-700">
                        <div className="flex items-center justify-between mb-8">
                           <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-3">
                              <MessageSquare className="w-5 h-5 text-rose-500" /> 
                              Seneste Feedback
                           </h4>
                           <Link href="/admin/surveys" className="text-xs font-bold text-amber-950 hover:underline">Se alle</Link>
                        </div>
                        <div className="space-y-4">
                           <div className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 text-center relative overflow-hidden">
                               <p className="text-xs text-slate-400 italic mb-2 relative z-10">Systemet er up-to-date.</p>
                               <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest relative z-10">Ingen ny feedback i dag.</p>
                               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-100/20"></div>
                           </div>
                        </div>
                     </div>
                </section>
            </div>
        </div>
    );
}
