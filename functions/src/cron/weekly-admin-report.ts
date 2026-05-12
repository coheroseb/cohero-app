
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { Resend } from 'resend';

export const weeklyAdminReport = functions.pubsub
  .schedule('every sunday 09:00')
  .timeZone('Europe/Copenhagen')
  .onRun(async (context) => {
    const db = (admin.firestore as any)(undefined, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)");
    
    // 1. Fetch data
    const usersSnap = await db.collection('users').where('role', '==', 'user').get();
    const aiUsageDoc = await db.collection('stats').doc('ai_usage').get();
    
    const allUsers = usersSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));
    const totalUsers = allUsers.length;
    
    const now = new Date();
    const getDateDaysAgo = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d;
    };
    
    const d1 = getDateDaysAgo(1);
    const d30 = getDateDaysAgo(30);
    const d14 = getDateDaysAgo(14);
    
    const getLastActivity = (u: any) => {
        const activity = u.lastActivityAt || u.lastLogin;
        if (!activity) return null;
        if (typeof activity.toDate === 'function') return activity.toDate();
        if (activity instanceof Date) return activity;
        return null;
    };

    const dau = allUsers.filter((u: any) => {
        const lastActivity = getLastActivity(u);
        return lastActivity && lastActivity > d1;
    }).length;
    
    const mau = allUsers.filter((u: any) => {
        const lastActivity = getLastActivity(u);
        return lastActivity && lastActivity > d30;
    }).length;

    const aiUsage = aiUsageDoc.data() || {};
    const costPerMillionInput = 0.30 * 6.95; 
    const costPerMillionOutput = 2.50 * 6.95; 
    const monthlyAiCost = (
      ((aiUsage.totalInputTokens || 0) / 1000000 * costPerMillionInput) + 
      ((aiUsage.totalOutputTokens || 0) / 1000000 * costPerMillionOutput)
    );

    const stickiness = mau > 0 ? (dau / mau) * 100 : 0;
    
    const usersOlderThan30d = allUsers.filter((u: any) => {
        const createdAt = u.createdAt ? (typeof u.createdAt.toDate === 'function' ? u.createdAt.toDate() : new Date(u.createdAt)) : null;
        return createdAt && createdAt < d30;
    });
    
    const churned30d = usersOlderThan30d.filter((u: any) => {
        const lastActivity = getLastActivity(u);
        return !lastActivity || lastActivity < d30;
    }).length;
    
    const churnRate30d = usersOlderThan30d.length > 0 ? (churned30d / usersOlderThan30d.length) * 100 : 0;
    const growth30d = usersOlderThan30d.length > 0 ? ((totalUsers - usersOlderThan30d.length) / usersOlderThan30d.length) * 100 : 100;

    const riskUsersCount = allUsers.filter((u: any) => {
        const isSubscriber = u.membership === 'Kollega+' && u.stripeSubscriptionStatus === 'active';
        if (!isSubscriber) return false;
        const lastActivity = getLastActivity(u);
        return !lastActivity || lastActivity < d14;
    }).length;

    const totalRiskMRR = riskUsersCount * 89;
    
    // 2. Call AI Flow
    try {
        const { allFlows } = await import("../ai/flows-export.js");
        if (!allFlows["adminInsightFlow"]) {
            console.error("adminInsightFlow not found");
            return null;
        }

        const insightResult = await allFlows["adminInsightFlow"]({
            totalUsers,
            growth: growth30d.toFixed(1),
            dau,
            mau,
            stickiness: stickiness.toFixed(1),
            churnRate30d: churnRate30d.toFixed(1),
            monthlyTokenCost: monthlyAiCost.toFixed(2),
            riskUsersCount: riskUsersCount,
            totalRiskMRR: totalRiskMRR,
            fbConversions: allUsers.filter((u: any) => u.conversionSource === 'facebook').length,
            tiktokConversions: allUsers.filter((u: any) => u.conversionSource === 'tiktok').length,
        });

        const { subject, report } = insightResult.data;

        // 3. Send Email
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Analytics <analytics@platform.cohero.dk>',
            to: 'kontakt@cohero.dk',
            subject: subject,
            html: `
                <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; padding: 40px; background: #fff; color: #0f172a;">
                    <div style="text-align: center; margin-bottom: 30px;">
                         <img src="https://student.cohero.dk/Lovportal.png" width="60" height="60" style="margin-bottom: 10px;" />
                         <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 10px; font-weight: 800; color: #94a3b8; margin: 0;">Weekly AI Insight Report</p>
                    </div>
                    
                    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                        <h2 style="margin-top: 0; font-size: 18px; color: #1e293b;">Data Opsummering</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Total Brugere</td>
                                <td style="padding: 8px 0; font-weight: 800; text-align: right;">${totalUsers} (${growth30d.toFixed(1)}%)</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">DAU / MAU</td>
                                <td style="padding: 8px 0; font-weight: 800; text-align: right;">${dau} / ${mau} (${stickiness.toFixed(1)}%)</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b;">Churn Risiko (MRR)</td>
                                <td style="padding: 8px 0; font-weight: 800; text-align: right; color: #e11d48;">-${totalRiskMRR} DKK</td>
                            </tr>
                        </table>
                    </div>

                    <div style="line-height: 1.6; font-size: 15px; color: #334155;">
                        ${report.replace(/\n/g, '<br/>')}
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;"/>
                    
                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                        Denne rapport er automatisk genereret af Cohéro Intelligence.<br/>
                        Analysedato: ${now.toLocaleDateString('da-DK')}
                    </p>
                    
                    <div style="text-align: center; margin-top: 20px;">
                        <a href="https://student.cohero.dk/admin/stats" style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 13px;">GÅ TIL DASHBOARD</a>
                    </div>
                </div>
            `
        });

        console.log("Weekly admin report sent successfully to kontakt@cohero.dk");

    } catch (e) {
        console.error("Failed to generate or send weekly admin report:", e);
    }

    return null;
  });
