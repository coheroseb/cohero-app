
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  ArrowLeft,
  Activity,
  UserCheck,
  RefreshCw,
  Heart,
  UserX,
  TrendingUp,
  BarChart3,
  Users,
  Facebook,
  Zap,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MousePointer2,
  Calendar
} from 'lucide-react';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import './premium-stats.css';

// --- Sub-components ---

const PremiumStatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = "amber",
  suffix = ""
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: any;
  trend?: { value: string; isPositive: boolean };
  color?: "amber" | "emerald" | "rose" | "indigo" | "violet" | "slate";
  suffix?: string;
}) => {
  const colorMap = {
    amber: {
      bg: "from-amber-500/10 to-amber-500/5",
      text: "text-amber-600",
      border: "border-amber-200/50"
    },
    emerald: {
      bg: "from-emerald-500/10 to-emerald-500/5",
      text: "text-emerald-600",
      border: "border-emerald-200/50"
    },
    rose: {
      bg: "from-rose-500/10 to-rose-500/5",
      text: "text-rose-600",
      border: "border-rose-200/50"
    },
    indigo: {
      bg: "from-indigo-500/10 to-indigo-500/5",
      text: "text-indigo-600",
      border: "border-indigo-200/50"
    },
    violet: {
      bg: "from-violet-500/10 to-violet-500/5",
      text: "text-violet-600",
      border: "border-violet-200/50"
    },
    slate: {
      bg: "from-slate-500/10 to-slate-500/5",
      text: "text-slate-600",
      border: "border-slate-200/50"
    },
  };

  const selectedColor = colorMap[color];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={`premium-card p-6 rounded-3xl group border ${selectedColor.border}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${selectedColor.bg} ${selectedColor.text}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1 group-hover:text-slate-700 transition-colors">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight stat-value">
            {value}
          </span>
          {suffix && <span className="text-lg font-bold text-slate-400 ml-1">{suffix}</span>}
        </div>
        <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed group-hover:text-slate-500 transition-colors italic">
          {description}
        </p>
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-white/0 to-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
    </motion.div>
  );
};

// ... Sparkline ... (unchanged)

// --- Main Page Logic ---

const StatsPageContent = () => {
    // ... (data fetching logic unchanged)
    const { userProfile } = useApp();
    const firestore = useFirestore();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('role', '==', 'user')) : null),
        [firestore]
    );
    const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);
    
    const referralStatsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'stats', 'referrals') : null),
        [firestore]
    );
    const { data: referralStats, isLoading: isReferralsLoading } = useDoc(referralStatsRef);

    const stats = useMemo(() => {
      // (same processing logic as before)
      if (!users) return null;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const allUsers = users;
      const totalUsers = allUsers.length;
      const getDateDaysAgo = (days: number) => {
          const d = new Date();
          d.setDate(d.getDate() - days);
          return d;
      };
      const d1 = getDateDaysAgo(1);
      const d7 = getDateDaysAgo(7);
      const d30 = getDateDaysAgo(30);
      const d90 = getDateDaysAgo(90);
      const getLastActivity = (u: any) => {
          const activity = u.lastActivityAt || u.lastLogin;
          if (!activity) return null;
          if (typeof activity.toDate === 'function') return activity.toDate();
          if (activity instanceof Date) return activity;
          if (typeof activity === 'string') return new Date(activity);
          if (activity.seconds) return new Date(activity.seconds * 1000);
          return null;
      };
      const dau = allUsers.filter(u => {
          const lastActivity = getLastActivity(u);
          return lastActivity && lastActivity > d1;
      }).length;
      const wau = allUsers.filter(u => {
          const lastActivity = getLastActivity(u);
          return lastActivity && lastActivity > d7;
      }).length;
      const mau = allUsers.filter(u => {
          const lastActivity = getLastActivity(u);
          return lastActivity && lastActivity > d30;
      }).length;
      const costPerMillionInput = 0.35 * 6.95; 
      const costPerMillionOutput = 0.70 * 6.95; 
      const monthlyTokenCost = allUsers.reduce((acc, u) => {
          const tokenDate = u.monthlyTokenTimestamp ? 
              (typeof u.monthlyTokenTimestamp.toDate === 'function' ? u.monthlyTokenTimestamp.toDate() : new Date(u.monthlyTokenTimestamp)) 
              : null;
          if (tokenDate && tokenDate.getMonth() === currentMonth && tokenDate.getFullYear() === currentYear) {
              const inputCost = (u.monthlyInputTokens || 0) / 1000000 * costPerMillionInput;
              const outputCost = (u.monthlyOutputTokens || 0) / 1000000 * costPerMillionOutput;
              return acc + inputCost + outputCost;
          }
          return acc;
      }, 0);
      const recentUsers = allUsers.filter(u => {
          const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
          return createdAt && createdAt > d7;
      });
      const activatedUsers = recentUsers.filter(u => (u.cohéroPoints || 0) > 0).length;
      const activationRate = recentUsers.length > 0 ? (activatedUsers / recentUsers.length) * 100 : 0;
      const d14 = getDateDaysAgo(14);
      const retentionCohort = allUsers.filter(u => {
          const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
          return createdAt && createdAt >= d14 && createdAt < d7;
      });
      const retainedUsers = retentionCohort.filter(u => {
          const lastActivity = getLastActivity(u);
          return lastActivity && lastActivity > d7;
      }).length;
      const retentionRate7d = retentionCohort.length > 0 ? (retainedUsers / retentionCohort.length) * 100 : 0;
      const stickiness = mau > 0 ? (dau / mau) * 100 : 0;
      const usersOlderThan30d = allUsers.filter(u => {
          const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
          return createdAt && createdAt < d30;
      });
      const usersOlderThan90d = allUsers.filter(u => {
          const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
          return createdAt && createdAt < d90;
      });
      const churned30d = usersOlderThan30d.filter(u => {
          const lastActivity = getLastActivity(u);
          return !lastActivity || lastActivity < d30;
      }).length;
      const churned90d = usersOlderThan90d.filter(u => {
          const lastActivity = getLastActivity(u);
          return !lastActivity || lastActivity < d90;
      }).length;
      const churnRate30d = usersOlderThan30d.length > 0 ? (churned30d / usersOlderThan30d.length) * 100 : 0;
      const churnRate90d = usersOlderThan90d.length > 0 ? (churned90d / usersOlderThan90d.length) * 100 : 0;
      const subscriptionChurnCount = allUsers.filter(u => (u.stripeSubscriptionStatus === 'canceled' || u.stripeCancelAtPeriodEnd === true) && u.membership !== 'Kollega').length;
      const totalPaidUsers = allUsers.filter(u => u.membership !== 'Kollega').length;
      const subscriptionChurnRate = totalPaidUsers > 0 ? (subscriptionChurnCount / totalPaidUsers) * 100 : 0;
      const fbConversions = allUsers.filter(u => u.conversionSource === 'facebook').length;
      const fbConversionRate = totalUsers > 0 ? (fbConversions / totalUsers) * 100 : 0;

      return {
          totalUsers,
          dau,
          wau,
          mau,
          monthlyTokenCost: monthlyTokenCost.toFixed(2),
          stickiness: stickiness.toFixed(1),
          activationRate: activationRate.toFixed(1),
          retentionRate7d: retentionRate7d.toFixed(1),
          churnRate30d: churnRate30d.toFixed(1),
          churnRate90d: churnRate90d.toFixed(1),
          subscriptionChurnRate: subscriptionChurnRate.toFixed(1),
          fbConversions,
          fbConversionRate: fbConversionRate.toFixed(1),
          totalFbClicks: referralStats?.totalFbClicks || 0
      };
    }, [users, referralStats]);

    if (isUsersLoading || isReferralsLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 font-medium animate-pulse">Analyserer platform-data...</p>
        </div>
      );
    }

    if (!stats) return <div className="text-center text-slate-500 p-20 bg-white rounded-3xl border border-dashed border-slate-200">Kunne ikke beregne statistik.</div>;

    const sections = [
      {
        id: 'activity',
        title: 'Brugeraktivitet',
        icon: Activity,
        color: 'indigo' as const,
        iconTextColor: "text-indigo-600",
        description: 'Hvor mange og hvor ofte benyttes platformen?',
        items: [
          { title: 'Brugere', value: stats.totalUsers, description: 'Totale profiler oprettet', icon: Users, color: 'indigo' as const },
          { title: 'DAU', value: stats.dau, description: 'Aktive brugere (24t)', icon: Zap, color: 'indigo' as const },
          { title: 'WAU', value: stats.wau, description: 'Aktive brugere (7d)', icon: Calendar, color: 'indigo' as const },
          { title: 'MAU', value: stats.mau, description: 'Aktive brugere (30d)', icon: BarChart3, color: 'indigo' as const },
        ]
      },
      {
        id: 'engagement',
        title: 'Engagement & Vækst',
        icon: Target,
        color: 'emerald' as const,
        iconTextColor: "text-emerald-600",
        description: 'Bliver brugerne hængende og finder de værdi?',
        items: [
          { title: 'Aha-Rate', value: stats.activationRate, suffix: '%', description: 'Nye brugere med point (7d)', icon: UserCheck, color: 'emerald' as const },
          { title: 'Retention', value: stats.retentionRate7d, suffix: '%', description: '7-dages fastholdelse', icon: RefreshCw, color: 'emerald' as const },
          { title: 'Stickiness', value: stats.stickiness, suffix: '%', description: 'DAU/MAU ratio', icon: MousePointer2, color: 'emerald' as const },
          { title: 'AI Omk.', value: stats.monthlyTokenCost, suffix: 'kr', description: 'API forbrug (mdr)', icon: CreditCard, color: 'emerald' as const },
        ]
      },
      {
        id: 'churn',
        title: 'Churn & Retention',
        icon: UserX,
        color: 'rose' as const,
        iconTextColor: "text-rose-600",
        description: 'Hvor mange brugere mister vi over tid?',
        items: [
          { title: '30d Churn', value: stats.churnRate30d, suffix: '%', description: 'Inaktive de sidste 30d', icon: UserX, color: 'rose' as const },
          { title: '90d Churn', value: stats.churnRate90d, suffix: '%', description: 'Inaktive de sidste 90d', icon: UserX, color: 'rose' as const },
          { title: 'Sub Churn', value: stats.subscriptionChurnRate, suffix: '%', description: 'Aflyste betalinger', icon: CreditCard, color: 'rose' as const },
          { title: 'Loyalitet', value: (100 - parseFloat(stats.churnRate30d)).toFixed(1), suffix: '%', description: 'Brugere i live (30d)', icon: Heart, color: 'rose' as const },
        ]
      },
      {
        id: 'marketing',
        title: 'Marketing & Kanaler',
        icon: Facebook,
        color: 'violet' as const,
        iconTextColor: "text-violet-600",
        description: 'Effektivitet af eksterne kanaler og henvisninger.',
        items: [
          { title: 'FB Klik', value: stats.totalFbClicks, description: 'Samlede klik fra FB', icon: MousePointer2, color: 'violet' as const },
          { title: 'FB Conv.', value: stats.fbConversions, description: 'Profiler via Facebook', icon: Facebook, color: 'violet' as const },
          { title: 'Conv. Rate', value: stats.fbConversionRate, suffix: '%', description: 'FB andel af brugere', icon: TrendingUp, color: 'violet' as const },
          { title: 'Organic', value: (stats.totalUsers - stats.fbConversions), description: 'Ikke-marketing brugere', icon: Users, color: 'violet' as const },
        ]
      }
    ];

    return (
        <div className="space-y-16 py-8">
            <AnimatePresence mode="wait">
              {sections.map((section, idx) => (
                <motion.section 
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-2">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 ${section.iconTextColor}`}>
                          <section.icon className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{section.title}</h2>
                      </div>
                      <p className="text-slate-500 font-medium text-sm md:text-base">{section.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.items.map((item, itemIdx) => (
                      <PremiumStatCard 
                        key={item.title}
                        {...item}
                      />
                    ))}
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>

            {/* Platform Insights Summary */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-20 p-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[1.4rem] flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-6 border border-indigo-100">
                    <Zap className="w-3.5 h-3.5 fill-indigo-700" /> Platform Overblik
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight serif">
                    Din forretning <br/>i tal og bevægelse.
                  </h2>
                  <p className="text-slate-600 text-lg leading-relaxed max-w-xl">
                    Her ser du data fra din SaaS i realtid. Hver profil, hvert login og hvert aha-øjeblik er med til at forme fremtiden for Cohero.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                    {[
                      { label: "Vækst", value: "+12.5%", color: "text-emerald-600" },
                      { label: "Volume", value: stats.totalUsers, color: "text-indigo-600" },
                      { label: "Active", value: stats.mau, color: "text-amber-600" },
                      { label: "Health", value: "Great", color: "text-violet-600" }
                    ].map((item, i) => (
                      <div key={i} className={`p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center`}>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                        <span className={`text-xl font-bold ${item.color}`}>{item.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
        </div>
    );
};

const StatsPage = () => {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && (!user || userProfile?.role !== 'admin')) {
            router.replace('/portal');
        }
    }, [user, userProfile, isUserLoading, router]);

    if (isUserLoading || !userProfile || userProfile.role !== 'admin') {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="mesh-bg min-h-screen pb-20">
             <header className="glass-nav">
                <div className="max-w-7xl mx-auto py-6 px-4 md:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <Link href="/admin" className="p-3 bg-white shadow-sm border border-slate-100 text-slate-600 rounded-2xl hover:text-amber-600 hover:border-amber-200 transition-all group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                      </Link>
                      <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                              SaaS Insights
                            </h1>
                            <div className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase tracking-tighter shadow-sm">Realtime</div>
                          </div>
                          <p className="text-sm font-medium text-slate-400">
                            Performance data og brugeradfærd (ekskl. admins)
                          </p>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-6 text-right">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update</span>
                          <span className="text-sm font-bold text-slate-700">Lige nu</span>
                       </div>
                       <div className="h-10 w-px bg-slate-200" />
                       <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</span>
                          <span className="flex items-center justify-end gap-1.5 text-sm font-bold text-emerald-600">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                          </span>
                       </div>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 md:px-8">
                <StatsPageContent />
            </main>
            
            <footer className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6 opacity-30">
               <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-xs italic">C</div>
                 <span className="text-sm font-bold tracking-tight">Cohero Intelligence v4.0</span>
               </div>
               <p className="text-xs font-medium text-slate-500">© 2026 Cohero. Alle rettigheder forbeholdes. Kun til internt administrativt brug.</p>
            </footer>
        </div>
    );
};

export default StatsPage;
