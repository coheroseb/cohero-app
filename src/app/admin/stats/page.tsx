
'use client';

import React, { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
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
  Sparkles,
  AlertTriangle,
  Mail,
  ArrowRight,
  CheckCircle2,
  X,
  History,
  Filter,
  Video,
  ClipboardCheck,
  Wand2,
  Newspaper,
  Search
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { generateAdminInsights, generateTikTokScripts, generateBlogPost } from './actions';
import { useState } from 'react';

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
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // TikTok Generator State
    const [tiktokScripts, setTiktokScripts] = useState<any[]>([]);
    const [isGeneratingScripts, setIsGeneratingScripts] = useState(false);
    const [tiktokTopic, setTiktokTopic] = useState("");
    
    // Blog Generator State
    const [blogPost, setBlogPost] = useState<any | null>(null);
    const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
    const [blogTopic, setBlogTopic] = useState("");
    const [blogKeywords, setBlogKeywords] = useState("");

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

    const mailLogsQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'mail_logs'), orderBy('sentAt', 'desc'), limit(50)) : null),
        [firestore]
    );
    const { data: mailLogs } = useCollection<any>(mailLogsQuery);

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

      // Retention Intelligence: Find subscribers (Kollega+) who have been inactive for > 14 days
      const d14 = getDateDaysAgo(14);
      const riskUsers = allUsers.filter(u => {
          const isSubscriber = u.membership === 'Kollega+' && u.stripeSubscriptionStatus === 'active';
          if (!isSubscriber) return false;
          
          const lastActivity = getLastActivity(u);
          return !lastActivity || lastActivity < d14;
      }).sort((a, b) => {
          const actA = getLastActivity(a)?.getTime() || 0;
          const actB = getLastActivity(b)?.getTime() || 0;
          return actA - actB;
      });

      const totalRiskMRR = riskUsers.length * 89; 

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
          totalTikTokClicks: referralStats?.totalTikTokClicks || 0,
          riskUsers,
          totalRiskMRR
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

    // Funnel Calculations
    const totalClicks = (stats.totalFbClicks || 0) + (stats.totalTikTokClicks || 0);
    const totalSubscribers = (users || []).filter((u: any) => u.membership === 'Kollega+' && u.stripeSubscriptionStatus === 'active').length;
    const clickToUserRate = totalClicks > 0 ? (((users || []).length / totalClicks) * 100).toFixed(1) : 0;
    const userToSubRate = (users || []).length > 0 ? ((totalSubscribers / (users || []).length) * 100).toFixed(1) : 0;
    const overallConvRate = totalClicks > 0 ? ((totalSubscribers / totalClicks) * 100).toFixed(1) : 0;

    // Marketing ROI Deep Dive Calculations
    const fbUsers = (users || []).filter((u: any) => u.conversionSource === 'facebook');
    const tiktokUsers = (users || []).filter((u: any) => u.conversionSource === 'tiktok');
    
    const calculateRetentionStats = (sourceUsers: any[]) => {
        if (sourceUsers.length === 0) return { churn: 0, avgLife: 0, cvr: 0 };
        const now = new Date();
        const churned = sourceUsers.filter(u => {
            const lastAct = u.lastActivityAt || u.lastLogin;
            const diff = lastAct ? (now.getTime() - (lastAct.toDate ? lastAct.toDate().getTime() : new Date(lastAct).getTime())) / (1000 * 60 * 60 * 24) : 999;
            return diff > 30;
        }).length;
        
        const avgLife = sourceUsers.reduce((acc, u) => {
            const createdAt = u.createdAt ? (u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt)) : now;
            return acc + (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / sourceUsers.length;

        return {
            churn: ((churned / sourceUsers.length) * 100).toFixed(1),
            avgLife: avgLife.toFixed(0)
        };
    };

    const fbROI = calculateRetentionStats(fbUsers);
    const tiktokROI = calculateRetentionStats(tiktokUsers);

    const fbCVR = stats.totalFbClicks > 0 ? ((fbUsers.length / stats.totalFbClicks) * 100).toFixed(1) : 0;
    const tiktokCVR = stats.totalTikTokClicks > 0 ? ((tiktokUsers.length / stats.totalTikTokClicks) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-20 animate-ink">
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between px-2 gap-6">
                    <div>
                        <div className="flex items-center gap-3 text-indigo-500 mb-2">
                             <div className="p-2 rounded-lg bg-indigo-50">
                                <Filter className="w-5 h-5" />
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Funnel</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 serif">Konverterings-Funnel</h2>
                        <p className="text-slate-500 font-medium text-sm">Hvor mange potentielle kunder taber vi på vejen?</p>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100/50 text-right">
                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1">Total Udnyttelse</p>
                        <p className="text-2xl font-black text-indigo-600 serif">{overallConvRate}% CR</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Stage 1: Clicks */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 p-10 flex flex-col justify-center items-center text-center relative group">
                        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <MousePointer2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">1. Kanal-Klik</h3>
                        <p className="text-5xl font-black text-slate-900 serif">{totalClicks}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-4">Top of Funnel</p>
                    </div>

                    {/* Stage 2: Users */}
                    <div className="bg-white rounded-[3rem] border border-indigo-100 p-10 flex flex-col justify-center items-center text-center relative group shadow-sm bg-gradient-to-b from-white to-indigo-50/20">
                         <div className="absolute -left-5 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center">
                             <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg transform translate-x-1/2">
                                <span className="text-[10px] font-black italic">{clickToUserRate}%</span>
                             </div>
                         </div>
                        <div className="w-20 h-20 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2 text-indigo-500">2. Oprettede Profiler</h3>
                        <p className="text-5xl font-black text-slate-900 serif">{(users || []).length}</p>
                        <p className="text-[9px] font-bold text-indigo-300 uppercase mt-4">Middle of Funnel</p>
                    </div>

                    {/* Stage 3: Subscribers */}
                    <div className="bg-indigo-900 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center relative group shadow-2xl">
                        <div className="absolute -left-5 top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center">
                             <div className="w-10 h-10 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center shadow-lg transform translate-x-1/2 border-2 border-indigo-900">
                                <span className="text-[10px] font-black italic">{userToSubRate}%</span>
                             </div>
                         </div>
                        <div className="w-20 h-20 bg-amber-400 text-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-amber-400/20 group-hover:scale-110 transition-transform">
                            <CreditCard className="w-8 h-8 fill-slate-900" />
                        </div>
                        <h3 className="text-[10px] font-black uppercase text-amber-400 tracking-widest mb-2">3. Kollega+ Abonnenter</h3>
                        <p className="text-5xl font-black text-white serif">{totalSubscribers}</p>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase mt-4">Bottom of Funnel (ROI)</p>
                    </div>
                </div>
            </section>
            <section className="space-y-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-[3.5rem] shadow-2xl relative overflow-hidden group"
                >
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 text-indigo-400 mb-4">
                                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 underline decoration-indigo-500/50 underline-offset-8">AI Insight Reporter</span>
                                </div>
                                <h2 className="text-4xl font-black text-white serif tracking-tight">Platform Sundhed & <br/>Strategisk Analyse</h2>
                                <p className="text-white/40 text-sm font-medium mt-4 max-w-lg">Få en AI-genereret ugerapport baseret på din nuværende data. Forslag til optimering, fastholdelse og vækststrategi.</p>
                            </div>
                            
                            <button 
                                onClick={async () => {
                                    setIsGenerating(true);
                                    const insight = await generateAdminInsights({
                                        ...stats,
                                        riskUsersCount: stats.riskUsers.length
                                    });
                                    setAiInsight(insight);
                                    setIsGenerating(false);
                                }}
                                disabled={isGenerating}
                                className="px-10 py-5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-800 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center gap-3 border border-indigo-400/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyserer...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 fill-white" />
                                        Generer Ugerapport
                                    </>
                                )}
                            </button>
                        </div>

                        {aiInsight ? (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 prose prose-invert prose-slate max-w-none backdrop-blur-2xl"
                            >
                                <div className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                    {aiInsight}
                                </div>
                            </motion.div>
                        ) : (
                            !isGenerating && (
                                <div className="border border-dashed border-white/10 rounded-[2.5rem] p-16 text-center">
                                    <BarChart3 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">Klar til analyse</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute -left-20 -top-20 w-60 h-60 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                </motion.div>
            </section>

            {sections.map((section) => (
                <section key={section.id} className="space-y-8">
                    <div className="px-2">
                        <h2 className="text-2xl font-black text-slate-900 serif mb-1">{section.title}</h2>
                        <p className="text-slate-500 font-medium text-sm">{section.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {section.items.map((item: any) => (
                            <PremiumStatCard key={item.title} {...item} />
                        ))}
                    </div>
                </section>
            ))}

            {/* TikTok Marketing Automation Section (Punkt 2 Update) */}
            <section className="space-y-12">
                <div className="px-2">
                    <div className="flex items-center gap-3 text-rose-500 mb-2">
                        <div className="p-2 rounded-lg bg-rose-50">
                            <Video className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Marketing & TikTok Automation</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 serif">Viral Content Generator</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">Lad AI brainstorme dine næste hooks og video-scripts baseret på dagens vigtigste emner.</p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <input 
                                type="text"
                                value={tiktokTopic}
                                onChange={(e) => setTiktokTopic(e.target.value)}
                                placeholder="Indtast et lov-emne eller tema..."
                                className="px-6 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-medium w-full md:w-72 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                            />
                            <button 
                                onClick={async () => {
                                    setIsGeneratingScripts(true);
                                    const res = await generateTikTokScripts(tiktokTopic);
                                    setTiktokScripts(res);
                                    setIsGeneratingScripts(false);
                                }}
                                disabled={isGeneratingScripts}
                                className="px-8 py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-rose-600/20 flex items-center gap-2"
                            >
                                {isGeneratingScripts ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 fill-white" />}
                                {isGeneratingScripts ? 'Brainstormer...' : 'Skriv Scripts'}
                            </button>
                        </div>
                    </div>
                </div>

                {tiktokScripts.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {tiktokScripts.map((script, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 flex flex-col group relative"
                            >
                                <div className="absolute top-10 right-10">
                                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center -rotate-6">
                                        <span className="text-sm font-black">#{idx + 1}</span>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="font-black text-rose-600 uppercase tracking-tighter text-sm mb-4 leading-tight">{script.title}</h3>
                                    <div className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest mb-6">
                                        Viral Formula Active
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-2">The Hook (Start)</p>
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-50 text-sm font-bold text-slate-900 italic">
                                            "{script.hook}"
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-2">The Bridge (Midten)</p>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {script.body}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] mb-2">The CTA (Slut)</p>
                                        <p className="text-sm text-indigo-600 font-black italic">{script.cta}</p>
                                    </div>
                                </div>

                                <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between gap-4">
                                     <button 
                                        onClick={() => {
                                            const txt = `Titel: ${script.title}\nHook: ${script.hook}\nScript: ${script.body}\nCTA: ${script.cta}\n\nCaption:\n${script.caption}`;
                                            navigator.clipboard.writeText(txt);
                                        }}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                     >
                                        <ClipboardCheck className="w-3.5 h-3.5" /> Kopiér alt
                                     </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            {/* Marketing ROI Deep Dive (Punkt 2 Update) */}
            <section className="space-y-8">
                <div className="px-2">
                    <div className="flex items-center gap-2 text-indigo-500 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Marketing ROI & Churn Analysis</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 serif">Facebook vs. TikTok</h2>
                    <p className="text-slate-500 font-medium text-sm">Hvilken kanal leverer de mest loyale og værdifulde studerende?</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Facebook ROI Card */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-200/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Facebook className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem] shadow-lg shadow-indigo-500/5">
                                    <Facebook className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Meta / Facebook</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{fbUsers.length} konverteringer i alt</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider mb-2">Conv. Rate</p>
                                    <p className="text-2xl font-black text-indigo-600 serif">{fbCVR}%</p>
                                </div>
                                <div className="border-x border-slate-50 px-8">
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider mb-2">Churn</p>
                                    <p className="text-2xl font-black text-rose-500 serif">{fbROI.churn}%</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider mb-2">Retention (Gns)</p>
                                    <p className="text-2xl font-black text-emerald-500 serif">{fbROI.avgLife} dg</p>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${100 - parseFloat(fbROI.churn as any)}%` }} 
                                        className="h-full bg-indigo-500" 
                                    />
                                </div>
                                <span className="ml-6 text-[10px] font-black text-indigo-500 uppercase whitespace-nowrap">{(100 - parseFloat(fbROI.churn as any)).toFixed(0)}% Lojalitet</span>
                            </div>
                        </div>
                    </div>

                    {/* TikTok ROI Card */}
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden group hover:shadow-xl hover:shadow-rose-200/20 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Music className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="p-4 bg-rose-50 text-rose-600 rounded-[1.5rem] shadow-lg shadow-rose-500/5">
                                    <Music className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">TikTok Ads</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{tiktokUsers.length} konverteringer i alt</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider mb-2">Conv. Rate</p>
                                    <p className="text-2xl font-black text-rose-600 serif">{tiktokCVR}%</p>
                                </div>
                                <div className="border-x border-slate-50 px-8">
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider mb-2">Churn</p>
                                    <p className="text-2xl font-black text-rose-500 serif">{tiktokROI.churn}%</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-slate-300 tracking-wider mb-2">Retention (Gns)</p>
                                    <p className="text-2xl font-black text-emerald-500 serif">{tiktokROI.avgLife} dg</p>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between">
                                <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${100 - parseFloat(tiktokROI.churn as any)}%` }} 
                                        className="h-full bg-rose-500" 
                                    />
                                </div>
                                <span className="ml-6 text-[10px] font-black text-rose-500 uppercase whitespace-nowrap">{(100 - parseFloat(tiktokROI.churn as any)).toFixed(0)}% Lojalitet</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Retention Intelligence: High Risk Users */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between px-2 gap-6">
                    <div>
                        <div className="flex items-center gap-3 text-rose-500 mb-2">
                            <div className="p-2 rounded-lg bg-rose-50">
                                <AlertTriangle className="w-5 h-5 fill-rose-500/10" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retention Intelligence</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 serif">Brugere i høj Churn-risiko</h2>
                        <p className="text-slate-500 font-medium text-sm">Aktive Kollega+ abonnenter som ikke har brugt platformen i over 14 dage.</p>
                    </div>
                    <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100/50 text-right">
                        <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider mb-1">Potentielt MRR tab</p>
                        <p className="text-2xl font-black text-rose-600 serif">-{stats.totalRiskMRR} DKK / mdr.</p>
                    </div>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Bruger</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Sidst Aktiv</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Periode</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Periode</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Værdi</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Handling</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.riskUsers.length > 0 ? (
                                    stats.riskUsers.map((u: any) => {
                                        const lastAct = u.lastActivityAt || u.lastLogin;
                                        const diff = lastAct ? Math.floor((new Date().getTime() - (lastAct?.toDate ? lastAct.toDate().getTime() : new Date(lastAct).getTime())) / (1000 * 60 * 60 * 24)) : '?';
                                        
                                        return (
                                            <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200 uppercase text-xs">
                                                            {u.username?.[0] || u.email?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 leading-tight">{u.username || 'Navneløs Kollega'}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                                                        <Calendar className="w-4 h-4 opacity-30" />
                                                        {lastAct ? (lastAct.toDate ? lastAct.toDate() : new Date(lastAct)).toLocaleDateString('da-DK') : 'Aldrig'}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${parseInt(diff as any) > 30 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {diff} dage inaktiv
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-black text-slate-900">
                                                    89 DKK
                                                </td>
                                                <td className="px-8 py-6">
                                                   {u.lastNudgeSentAt ? (
                                                       <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in slide-in-from-left-2 duration-700">
                                                           <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                                                               <CheckCircle2 className="w-4 h-4" />
                                                           </div>
                                                           <div className="flex flex-col">
                                                               <span className="text-[10px] font-bold uppercase tracking-tight">Afsendt</span>
                                                               <span className="text-[8px] opacity-70 font-medium">{(u.lastNudgeSentAt?.toDate ? u.lastNudgeSentAt.toDate() : new Date(u.lastNudgeSentAt)).toLocaleDateString('da-DK')}</span>
                                                           </div>
                                                       </div>
                                                   ) : (
                                                       <div className="flex items-center gap-2 text-slate-300">
                                                           <div className="p-1.5 rounded-lg border border-slate-100">
                                                               <X className="w-4 h-4" />
                                                           </div>
                                                           <span className="text-[10px] font-bold uppercase tracking-tight">Ikke nudget</span>
                                                       </div>
                                                   )}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <button 
                                                       onClick={async () => {
                                                            const subject = encodeURIComponent("Vi savner dig (og din AI-kollega) hos Cohéro! 👋");
                                                            const body = encodeURIComponent(`Hej ${u.username || 'Kollega'},\n\nJeg kan se, at det er over 2 uger siden, du sidst har brugt din AI-kollega hos Cohéro. Vi håber, at alt er vel med studiet!\n\nSom Kollega+ medlem vil vi gerne sikre os, at du får det maksimale ud af din digitale hverdag. Vi har netop lavet en række forbedringer på platformen, og vi står altid klar til at hjælpe, hvis der er noget, du er i tvivl om eller mangler i dit studieforløb.\n\nDu kan altid hoppe direkte ind i din portal her: https://cohero.dk/portal\n\nDe bedste hilsner,\nSebastian fra Cohéro`);
                                                            
                                                            // Update Firestore
                                                            if (firestore) {
                                                                try {
                                                                   await updateDoc(doc(firestore, 'users', u.uid), {
                                                                     lastNudgeSentAt: serverTimestamp()
                                                                   });
                                                                } catch (err) {
                                                                   console.error("Could not update lastNudgeSentAt:", err);
                                                                }
                                                            }
                                                            
                                                            window.location.href = `mailto:${u.email}?subject=${subject}&body=${body}`;
                                                       }}
                                                       className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-indigo-600 hover:border-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-95 group-hover:px-4"
                                                    >
                                                       <Mail className="w-3.5 h-3.5" /> 
                                                       <span className="">{u.lastNudgeSentAt ? 'Nudge igen' : 'Send Nudge'}</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Sparkles className="w-12 h-12 text-slate-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Ingen brugere i højrisiko-feltet lige nu!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SEO & Long-form Content Automation Section (Punkt 8 Update) */}
            <section className="space-y-12 mb-20">
                <div className="px-2">
                    <div className="flex items-center gap-3 text-emerald-500 mb-2">
                        <div className="p-2 rounded-lg bg-emerald-50">
                            <Newspaper className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">SEO & Blog Automation</span>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 serif">SEO Artikel Generator</h2>
                            <p className="text-slate-500 font-medium text-sm mt-1">Skab faglige blogindlæg og artikler der ranker på Google og skaber tillid.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">Hvad skal vi skrive om?</label>
                            <input 
                                type="text"
                                value={blogTopic}
                                onChange={(e) => setBlogTopic(e.target.value)}
                                placeholder="Eks. 'Retssikkerhedsloven i børnesager'..."
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-4">SEO Søgeord (valgfrit)</label>
                            <input 
                                type="text"
                                value={blogKeywords}
                                onChange={(e) => setBlogKeywords(e.target.value)}
                                placeholder="Eks. 'juridisk metode, socialrådgiver uddannelse'..."
                                className="w-full px-8 py-5 bg-slate-50 border-none rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={async () => {
                            setIsGeneratingBlog(true);
                            const res = await generateBlogPost(blogTopic, blogKeywords);
                            setBlogPost(res);
                            setIsGeneratingBlog(false);
                        }}
                        disabled={isGeneratingBlog || !blogTopic}
                        className="w-full py-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-[0.99]"
                    >
                        {isGeneratingBlog ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-emerald-400 text-emerald-400" />}
                        {isGeneratingBlog ? 'Genererer optimeret indhold...' : 'Generér SEO Artikel'}
                    </button>
                </div>

                {blogPost && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[3.5rem] border border-emerald-100 shadow-2xl shadow-emerald-500/5 overflow-hidden"
                    >
                        <div className="p-12 border-b border-slate-50 bg-emerald-50/20">
                            <h3 className="text-3xl font-black text-slate-900 serif mb-4">{blogPost.title}</h3>
                            <p className="text-slate-500 font-medium italic mb-8">"{blogPost.excerpt}"</p>
                            <div className="flex flex-wrap gap-2">
                                {blogPost.seoKeywords?.map((tag: string, i: number) => (
                                    <span key={i} className="px-3 py-1 bg-white border border-emerald-100 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Search className="w-3 h-3" /> {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-12 prose prose-slate max-w-none">
                             <div className="text-slate-700 leading-relaxed font-serif whitespace-pre-wrap text-lg">
                                 {blogPost.content}
                             </div>
                        </div>

                        <div className="p-8 bg-slate-50 flex items-center justify-center gap-6">
                             <button 
                                onClick={() => {
                                    const txt = `# ${blogPost.title}\n\n> ${blogPost.excerpt}\n\n${blogPost.content}\n\nKEYWORDS: ${blogPost.seoKeywords.join(', ')}`;
                                    navigator.clipboard.writeText(txt);
                                }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors"
                             >
                                <ClipboardCheck className="w-4 h-4" /> Kopiér til udklipsholder
                             </button>
                        </div>
                    </motion.div>
                )}
            </section>

            {/* System Kommunikation & Historik Section */}
            <section className="space-y-8">
                <div className="px-2">
                    <div className="flex items-center gap-3 text-indigo-500 mb-2">
                        <div className="p-2 rounded-lg bg-indigo-50">
                            <History className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Kommunikation & Historik</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 serif">Udsendelseslog</h2>
                    <p className="text-slate-500 font-medium text-sm">Oversigt over de seneste 50 automatiserede mails sendt til dine brugere.</p>
                </div>

                <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden text-left">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50">
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Modtager</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Emnefelt (AI-Genereret)</th>
                                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Tidspunkt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {mailLogs && mailLogs.length > 0 ? (
                                    mailLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${log.type === 'nudge_email' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    {log.automated ? <Zap className="w-3 h-3 fill-current" /> : <Mail className="w-3 h-3" />}
                                                    {log.type === 'nudge_email' ? 'Nudge-Mail' : 'Studie-Makker'}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-900 text-sm">
                                                {log.email}
                                            </td>
                                            <td className="px-8 py-6 text-sm italic font-medium text-slate-500">
                                                "{log.subject}"
                                            </td>
                                            <td className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-tighter">
                                                {log.sentAt ? (log.sentAt.toDate ? log.sentAt.toDate() : new Date(log.sentAt)).toLocaleString('da-DK', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : 'Afventer...'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <History className="w-12 h-12 text-slate-300" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Ingen logposter fundet endnu.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="p-12 bg-slate-900 rounded-[3.5rem] shadow-2xl relative overflow-hidden group mb-20"
            >
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
                    <div className="flex-1">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-widest mb-6 border border-white/5">
                            <Target className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Platform Insights v4.5
                        </span>
                        <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight serif">
                           Data-drevet <br className="hidden md:block"/>beslutningstagning.
                        </h2>
                        <p className="text-white/40 text-sm font-medium leading-relaxed max-w-sm mx-auto md:mx-0">
                           Her analyseres platform-adfærd i realtid. Hvert aha-øjeblik er med til at forme fremtiden for Cohero som din digitale kollega.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-12">
                        <div>
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-2">Health Index</p>
                            <p className="text-4xl font-black text-emerald-400 serif">Stable</p>
                        </div>
                        <div className="hidden md:block w-px h-16 bg-white/10" />
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
