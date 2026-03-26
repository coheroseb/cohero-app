
'use client';

import React, { useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { 
  Loader2, 
  ArrowLeft,
  Activity,
  UserCheck,
  RefreshCw,
  Heart,
  UserX,
  TrendingUp,
  BarChart,
  Users,
  Facebook,
  Link2
} from 'lucide-react';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

// A generic card for displaying stats
const StatCard = ({ title, value, description }: { title: string; value: string; description: string; }) => (
  <div className="bg-white p-6 rounded-2xl border border-amber-100/60 shadow-sm">
    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</p>
    <div className="flex items-baseline gap-2 mt-2">
      <p className="text-4xl font-bold text-amber-950 serif">{value}</p>
    </div>
    <p className="text-xs text-slate-500 mt-1">{description}</p>
  </div>
);

// Main component logic
const StatsPageContent = () => {
    const { userProfile } = useApp();
    const firestore = useFirestore();

    // Only fetch users with role 'user' to exclude admins from stats
    const usersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('role', '==', 'user')) : null),
        [firestore]
    );
    const { data: users, isLoading: isUsersLoading } = useCollection<any>(usersQuery);
    
    // Fetch aggregate referral stats
    const referralStatsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'stats', 'referrals') : null),
        [firestore]
    );
    const { data: referralStats, isLoading: isReferralsLoading } = useDoc(referralStatsRef);

    const stats = useMemo(() => {
        if (!users) {
            return null;
        }

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
            // Handle Firestore Timestamps
            if (typeof activity.toDate === 'function') return activity.toDate();
            // Handle raw JS Dates
            if (activity instanceof Date) return activity;
            // Handle ISO strings
            if (typeof activity === 'string') return new Date(activity);
            // Handle raw timestamp objects {seconds, nanoseconds}
            if (activity.seconds) return new Date(activity.seconds * 1000);
            return null;
        };

        // DAU/WAU/MAU (Now only for role 'user')
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

        // AI Cost calculation (Current month only, excluding admins)
        const costPerMillionInput = 0.35 * 6.95; // Fictional USD to DKK
        const costPerMillionOutput = 0.70 * 6.95; // Fictional USD to DKK
        
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

        // Activation (New users last 7 days who have earned points)
        const recentUsers = allUsers.filter(u => {
            const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
            return createdAt && createdAt > d7;
        });
        const activatedUsers = recentUsers.filter(u => (u.cohéroPoints || 0) > 0).length;
        const activationRate = recentUsers.length > 0 ? (activatedUsers / recentUsers.length) * 100 : 0;
        
        // Retention (Cohort: users created 8-14 days ago who were active in last 7 days)
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

        // Stickiness
        const stickiness = mau > 0 ? (dau / mau) * 100 : 0;

        // Churn
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

        // Facebook Stats
        const fbConversions = allUsers.filter(u => u.conversionSource === 'facebook').length;
        const fbConversionRate = totalUsers > 0 ? (fbConversions / totalUsers) * 100 : 0;


        return {
            totalUsers,
            dau,
            wau,
            mau,
            monthlyTokenCost: monthlyTokenCost.toFixed(2),
            stickiness: stickiness.toFixed(1) + '%',
            activationRate: activationRate.toFixed(1) + '%',
            retentionRate7d: retentionRate7d.toFixed(1) + '%',
            churnRate30d: churnRate30d.toFixed(1) + '%',
            churnRate90d: churnRate90d.toFixed(1) + '%',
            subscriptionChurnRate: subscriptionChurnRate.toFixed(1) + '%',
            fbConversions,
            fbConversionRate: fbConversionRate.toFixed(1) + '%',
            totalFbClicks: referralStats?.totalFbClicks || 0
        };
    }, [users, referralStats]);
    
    if (isUsersLoading || isReferralsLoading) {
        return <div className="flex justify-center items-center h-[calc(100vh-10rem)]"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>;
    }

    if (!stats) {
        return <div className="text-center text-slate-500">Kunne ikke beregne statistik.</div>;
    }

    return (
        <div className="space-y-12 animate-ink">
            
            <section>
                <h2 className="text-xl font-bold text-amber-950 serif mb-6 flex items-center gap-3"><Activity className="w-6 h-6 text-amber-600"/>Generel Aktivitet</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Totalt Antal Brugere" value={stats.totalUsers.toString()} description="Antal oprettede profiler (ekskl. admin)." />
                    <StatCard title="Daglige Aktive Brugere (DAU)" value={stats.dau.toString()} description="Unikke brugere de sidste 24 timer." />
                    <StatCard title="Ugentlige Aktive Brugere (WAU)" value={stats.wau.toString()} description="Unikke brugere de sidste 7 dage." />
                    <StatCard title="Månedlige Aktive Brugere (MAU)" value={stats.mau.toString()} description="Unikke brugere de sidste 30 dage." />
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-amber-950 serif mb-6 flex items-center gap-3"><UserCheck className="w-6 h-6 text-amber-600"/>Aktivering & Forbrug</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <StatCard title="Aha-Moment" value={stats.activationRate} description="% af nye brugere (sidste 7 dage) der har optjent point." />
                     <StatCard title="AI Omkostninger (mdr)" value={`${stats.monthlyTokenCost} kr.`} description="Estimeret API-forbrug for den nuværende måned." />
                </div>
            </section>
            
            <section>
                <h2 className="text-xl font-bold text-amber-950 serif mb-6 flex items-center gap-3"><RefreshCw className="w-6 h-6 text-amber-600"/>Fastholdelse & Engagement</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="7-dages fastholdelse" value={stats.retentionRate7d} description="Brugere fra 8-14 dage siden, der var aktive i sidste uge." />
                    <StatCard title="Stickiness (DAU/MAU)" value={stats.stickiness} description="Hvor stor en andel af månedlige brugere, der kommer dagligt." />
                    <StatCard title="Login-frekvens" value="N/A" description="Gennemsnitligt antal logins pr. bruger pr. uge." />
                </div>
            </section>

             <section>
                <h2 className="text-xl font-bold text-amber-950 serif mb-6 flex items-center gap-3"><UserX className="w-6 h-6 text-amber-600"/>Churn (Frafald)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="30-dages churn" value={stats.churnRate30d} description="% af brugere (ældre end 30d) der ikke har logget ind i 30 dage." />
                    <StatCard title="90-dages churn" value={stats.churnRate90d} description="% af brugere (ældre end 90d) der ikke har logget ind i 90 dage." />
                    <StatCard title="Abonnements-churn" value={stats.subscriptionChurnRate} description="% af betalende brugere der har opsagt." />
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-amber-950 serif mb-6 flex items-center gap-3"><Facebook className="w-6 h-6 text-amber-600"/>Marketing & Referrals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard 
                        title="Facebook Klik (Totalt)" 
                        value={stats.totalFbClicks.toLocaleString()} 
                        description="Samlet antal klik fra Facebook (med fbclid)." 
                    />
                    <StatCard 
                        title="Facebook Konverteringer" 
                        value={stats.fbConversions.toString()} 
                        description="Brugere der er logget ind via et Facebook-link." 
                    />
                    <StatCard 
                        title="Conversion Rate (FB)" 
                        value={stats.fbConversionRate} 
                        description="% af de samlede brugere der stammer fra FB." 
                    />
                </div>
            </section>

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
        <div className="bg-[#FDFCF8] min-h-screen">
             <header className="bg-white border-b border-amber-100/50">
                <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex items-center gap-4">
                    <Link href="/admin" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                      <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                        SaaS Statistik
                        </h1>
                        <p className="text-base text-slate-500">
                        Overblik over platformens performance og brugeradfærd (ekskl. admins).
                        </p>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                <StatsPageContent />
            </main>
        </div>
    );
};

export default StatsPage;
