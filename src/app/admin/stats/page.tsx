
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Activity,
  UserCheck,
  RefreshCw,
  Heart,
  UserX,
  TrendingUp,
  BarChart3,
  Users,
  Facebook,
  Music,
  Zap,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  MousePointer2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- Sub-components ---

const PremiumStatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = "indigo",
  suffix = ""
}: any) => {
  const colorMap: any = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[200px]`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className={`p-4 rounded-2xl ${colorMap[color]} shadow-lg shadow-current/5`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${parseFloat(trend) >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {parseFloat(trend) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(parseFloat(trend))}%
          </div>
        )}
      </div>
      
      <div className="relative z-10 mt-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black tracking-tight text-slate-900 serif">
            {value}
          </span>
          {suffix && <span className="text-lg font-bold text-slate-300 ml-1">{suffix}</span>}
        </div>
        <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight italic opacity-60">
          {description}
        </p>
      </div>

      <div className="absolute right-0 bottom-0 left-0 h-16 opacity-5 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{v:10}, {v:15}, {v:12}, {v:18}, {v:16}, {v:22}]}>
                  <Area type="monotone" dataKey="v" stroke="currentColor" fill="currentColor" strokeWidth={0} />
              </AreaChart>
          </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// --- Main Page ---

export default function StatsPage() {
    const firestore = useFirestore();

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

    const aiUsageRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'stats', 'ai_usage') : null),
        [firestore]
    );
    const { data: aiUsage } = useDoc(aiUsageRef);

    const stats = useMemo(() => {
      if (!users) return null;
      const now = new Date();
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

      const costPerMillionInput = 0.30 * 6.95; 
      const costPerMillionOutput = 2.50 * 6.95; 
      const realAiCost = (
        ((aiUsage?.totalInputTokens || 0) / 1000000 * costPerMillionInput) + 
        ((aiUsage?.totalOutputTokens || 0) / 1000000 * costPerMillionOutput)
      );

      const stickiness = mau > 0 ? (dau / mau) * 100 : 0;
      const usersOlderThan30d = allUsers.filter(u => {
          const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
          return createdAt && createdAt < d30;
      });
      
      const churned30d = usersOlderThan30d.filter(u => {
          const lastActivity = getLastActivity(u);
          return !lastActivity || lastActivity < d30;
      }).length;
      
      const churnRate30d = usersOlderThan30d.length > 0 ? (churned30d / usersOlderThan30d.length) * 100 : 0;
      const growth30d = usersOlderThan30d.length > 0 ? ((totalUsers - usersOlderThan30d.length) / usersOlderThan30d.length) * 100 : 100;

      return {
          totalUsers,
          dau,
          mau,
          growth: growth30d.toFixed(1),
          monthlyTokenCost: realAiCost.toFixed(2),
          stickiness: stickiness.toFixed(1),
          churnRate30d: churnRate30d.toFixed(1),
          fbConversions: allUsers.filter(u => u.conversionSource === 'facebook').length,
          tiktokConversions: allUsers.filter(u => u.conversionSource === 'tiktok').length,
          totalFbClicks: referralStats?.totalFbClicks || 0,
          totalTikTokClicks: referralStats?.totalTikTokClicks || 0
      };
    }, [users, referralStats, aiUsage]);

    if (isUsersLoading || isReferralsLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-[50vh] gap-6">
            <Loader2 className="w-12 h-12 animate-spin text-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Analyserer platform-data...</p>
        </div>
      );
    }

    if (!stats) return <div className="p-20 text-center text-slate-400">Kunne ikke beregne data.</div>;

    const sections = [
      {
        id: 'activity',
        title: 'Brugeraktivitet',
        description: 'Hvor mange og hvor ofte benyttes platformen?',
        items: [
          { title: 'Total Brugere', value: stats.totalUsers, description: 'Totale profiler oprettet', icon: Users, color: 'indigo', trend: stats.growth },
          { title: 'Aktive (24t)', value: stats.dau, description: 'Kolleger online i dag', icon: Zap, color: 'emerald' },
          { title: 'Aktive (30d)', value: stats.mau, description: 'Unikke brugere denne mdr.', icon: Calendar, color: 'violet' },
          { title: 'Stickiness', value: stats.stickiness, suffix: '%', description: 'DAU/MAU Ratio (Engagement)', icon: MousePointer2, color: 'amber' },
        ]
      },
      {
        id: 'performance',
        title: 'Platform Performance',
        description: 'Fastholdelse, loyalitet og driftomkostninger.',
        items: [
          { title: 'Mdr. Churn', value: stats.churnRate30d, suffix: '%', description: 'Inaktive de sidste 30 dage', icon: UserX, color: 'rose' },
          { title: 'Retention', value: (100 - parseFloat(stats.churnRate30d)).toFixed(1), suffix: '%', description: 'Aktive og loyale brugere', icon: Heart, color: 'emerald' },
          { title: 'AI Drift', value: stats.monthlyTokenCost, suffix: 'kr.', description: 'Token forbrug (G. 2.0)', icon: CreditCard, color: 'indigo' },
          { title: 'Vækst', value: stats.growth, suffix: '%', description: 'Nye brugere vs sidste mdr.', icon: TrendingUp, color: 'amber' },
        ]
      },
      {
        id: 'marketing',
        title: 'Marketing & Kanaler',
        description: 'Effektivitet af eksterne kampagner.',
        items: [
          { title: 'FB Klik', value: stats.totalFbClicks, description: 'Samlede klik fra Meta', icon: Facebook, color: 'indigo' },
          { title: 'FB Conv.', value: stats.fbConversions, description: 'Oprettelser via Facebook', icon: UserCheck, color: 'emerald' },
          { title: 'TikTok Klik', value: stats.totalTikTokClicks, description: 'Samlede klik fra TikTok', icon: Music, color: 'rose' },
          { title: 'TikTok Conv.', value: stats.tiktokConversions, description: 'Oprettelser via TikTok', icon: Sparkles, color: 'amber' },
        ]
      }
    ];

    return (
        <div className="space-y-20 animate-ink">
            {sections.map((section, idx) => (
                <section key={section.id} className="space-y-8">
                    <div className="px-2">
                        <h2 className="text-2xl font-black text-slate-900 serif mb-1">{section.title}</h2>
                        <p className="text-slate-500 font-medium text-sm">{section.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {section.items.map((item) => (
                            <PremiumStatCard key={item.title} {...item} />
                        ))}
                    </div>
                </section>
            ))}

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="p-12 bg-slate-900 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-1">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-6 border border-white/5">
                            <Target className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Platform Insights v4.5
                        </span>
                        <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight serif">
                           Data-drevet <br/>beslutningstagning.
                        </h2>
                        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-sm">
                           Her analyseres platform-adfærd i realtid. Hvert aha-øjeblik er med til at forme fremtiden for Cohero som din digitale kollega.
                        </p>
                    </div>
                    
                    <div className="flex gap-12 text-center">
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-2">Health Index</p>
                            <p className="text-4xl font-black text-emerald-400 serif">Stable</p>
                        </div>
                        <div className="w-px h-16 bg-white/10" />
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-2">Vækstrate</p>
                            <p className="text-4xl font-black text-amber-400 serif">+{stats.growth}%</p>
                        </div>
                    </div>
                </div>
                
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl -ml-32 -mb-32 transition-transform duration-1000 group-hover:scale-125"></div>
            </motion.div>
        </div>
    );
}

