'use server';

// Polyfill for Promise.withResolvers to support older Node.js versions
if (!Promise.withResolvers) {
    Promise.withResolvers = function withResolvers<T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: any) => void;
        const promise = new Promise<T>((res, rej) => {
            resolve = res;
            reject = rej;
        });
        // @ts-ignore
        return { promise, resolve, reject };
    };
}

// AI Flow Imports



























































import { adminFirestore } from '@/firebase/server-init';
import { uploadMediaToStorage } from '@/lib/storage-utils';





// Type Imports
import type * as Types from '@/ai/flows/types';

async function callFirebaseFlow(flowName, data) {
  const adminSecret = process.env.CRON_SECRET || "dev-secret-123";
  const projectId = 'studio-7870211338-fe921';
  
  // 2nd Gen functions have a unique hash in the URL. 
  // We prioritize the environment variable if available.
  const prodUrl = `https://runaiflow-7pguetq4hq-uc.a.run.app`; 
  
  const fallbackUrl = process.env.NODE_ENV === 'production'
    ? prodUrl
    : `http://127.0.0.1:5001/${projectId}/us-central1/runAiFlow`;

  const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL 
    ? (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL + "/runAiFlow")
    : fallbackUrl;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + adminSecret
      },
      body: JSON.stringify({ flowName, data })
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errorJson = await response.json();
            errorMsg = errorJson.error || errorJson.message || errorMsg;
        } catch (e) {
            // Fallback to text if JSON fails
            const text = await response.text().catch(() => "");
            if (text) errorMsg = text;
        }
        
        console.error(`Firebase Flow [${flowName}] call failed:`, errorMsg);
        throw new Error(`AI Scan Fejl (${response.status}): ${errorMsg}`);
    }

    return response.json();
  } catch (error: any) {
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
        throw new Error(`Firebase Flow Error: Could not connect to emulator at ${url}. Ensure the emulator is running.`);
    }
    console.error("Firebase Flow client error:", error);
    throw error;
  }
}


import type Stripe from 'stripe';


// Third-party and utility imports
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { Resend } from 'resend';

import { headers } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import { FieldValue } from 'firebase-admin/firestore';

// --- UPDATED ACTION: Sync Calendar Availability (Month-based statistical plan) ---

/**
 * Fetches an iCal URL, analyzes the current month (or a custom range), and returns a 
 * template ugeplan based on statistical availability.
 */
export async function syncCalendarAvailability(
    icalUrl: string,
    customRange?: { start: string, end: string }
): Promise<{ 
    slots: Record<string, 'physical' | 'online' | 'unavailable' | null>, 
    busyEvents: { start: string, end: string, title: string }[] 
}> {
    const url = icalUrl.replace(/^webcal:\/\//i, 'https://');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Kunne ikke hente kalenderdata.');
    const icalText = await response.text();

    const dayNames = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    const timeSlots = ['morning', 'afternoon', 'evening'];

    // Determine range
    const now = new Date();
    const startRange = customRange ? new Date(customRange.start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endRange = customRange ? new Date(customRange.end) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Trackers
    const busyCounts: Record<string, number> = {}; // key: 'dayIndex-slot'
    const dayOccurrences: Record<number, number> = {}; // key: dayIndex (0-6)
    const busyEvents: { start: string, end: string, title: string }[] = [];

    // 1. Calculate how many of each weekday exist in the range
    for (let d = new Date(startRange); d <= endRange; d.setDate(d.getDate() + 1)) {
        const dayIdx = d.getDay();
        dayOccurrences[dayIdx] = (dayOccurrences[dayIdx] || 0) + 1;
    }

    // 2. Parse iCal events
    const events = icalText.split('BEGIN:VEVENT').slice(1);

    // We need to track busy days to avoid counting multiple events in one slot on same day twice
    const trackedBusySlots = new Set<string>(); // key: 'dateISO-slot'

    for (const eventBlock of events) {
        const startMatch = eventBlock.match(/DTSTART[:;](?:VALUE=DATE:)?(\d{8}(?:T\d{6}Z?)?)/);
        const endMatch = eventBlock.match(/DTEND[:;](?:VALUE=DATE:)?(\d{8}(?:T\d{6}Z?)?)/);
        const summaryMatch = eventBlock.match(/SUMMARY:(.*)/);

        if (!startMatch || !endMatch) continue;

        const parseDate = (str: string) => {
            const y = parseInt(str.substring(0, 4));
            const m = parseInt(str.substring(4, 6)) - 1;
            const d = parseInt(str.substring(6, 8));
            if (str.includes('T')) {
                const h = parseInt(str.substring(9, 11));
                const min = parseInt(str.substring(11, 13));
                return new Date(Date.UTC(y, m, d, h, min));
            }
            return new Date(Date.UTC(y, m, d));
        };

        const startDate = parseDate(startMatch[1]);
        const endDate = parseDate(endMatch[1]);
        const title = summaryMatch ? summaryMatch[1].trim() : 'Optaget';

        // Only process events within range
        if (endDate < startRange || startDate > endRange) continue;

        // Add to busyEvents for timeline
        busyEvents.push({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            title: title
        });

        const dayIdx = startDate.getDay();
        const startHour = startDate.getUTCHours();
        const endHour = endDate.getUTCHours();
        const dateKey = startDate.toISOString().split('T')[0];

        const markBusy = (slotId: string) => {
            const uniqueKey = `${dateKey}-${slotId}`;
            if (!trackedBusySlots.has(uniqueKey)) {
                trackedBusySlots.add(uniqueKey);
                const countKey = `${dayIdx}-${slotId}`;
                busyCounts[countKey] = (busyCounts[countKey] || 0) + 1;
            }
        };

        // Morning: 8-12
        if (startHour < 12 && endHour > 8) markBusy('morning');
        // Afternoon: 12-17
        if (startHour < 17 && endHour > 12) markBusy('afternoon');
        // Evening: 17-22
        if (startHour < 22 && endHour > 17) markBusy('evening');
    }

    // 3. Calculate statistical availability
    const slots: Record<string, 'physical' | 'online' | 'unavailable' | null> = {};

    for (let dIdx = 0; dIdx < 7; dIdx++) {
        const dayId = dayNames[dIdx];
        const occurrences = dayOccurrences[dIdx] || 1;

        for (const slotId of timeSlots) {
            const busyCount = busyCounts[`${dIdx}-${slotId}`] || 0;
            const busyRatio = busyCount / occurrences;
            const key = `${dayId}-${slotId}`;

            // SHARPER LOGIC:
            // If you are busy in > 30% of the days, don't promise availability
            if (busyRatio > 0.3) {
                slots[key] = 'unavailable';
            }
            // ONLY mark as physical if 100% free across the whole month on weekdays
            else if (busyRatio === 0 && dIdx !== 0 && dIdx !== 6) {
                slots[key] = 'physical';
            }
            // For everything else, default to null so the user has to make a conscious choice
            else {
                slots[key] = null;
            }
        }
    }

    return { slots, busyEvents };
}

// AI Actions (wrapping flows)
export async function recommendContentAction(input: any) { return callFirebaseFlow('recommendContentFlow', input); }

export async function generateNewCase(input: { topic: string }): Promise<any> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.topic });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('generateCaseFlow', { topic: input.topic, lawContext });
}

export const generateCaseAction = generateNewCase;

export async function getSecondOpinionAction(input: any) { return callFirebaseFlow('getSecondOpinionFlow', input); }

export async function journalSynthesisFeedbackAction(input: { topic: string, sources: any[], journalEntry: string }): Promise<any> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.topic });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('journalSynthesisFeedbackFlow', { ...input, lawContext });
}

export async function getCaseFeedbackAction(input: { topic: string, scenario: string, initialObservation: string, assessment: string, goals: string, actionPlan: string }): Promise<Types.CaseFeedbackOutput> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.topic });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('getCaseFeedbackFlow', { ...input, lawContext });
}

const wrapEmailHtml = (inner: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="background-color: #f8fafc; padding: 40px 20px; width: 100%; box-sizing: border-box;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
            
            <div style="background-color: #451a03; padding: 32px 40px; text-align: center;">
                <img src="https://cohero.dk/main_logo.png" alt="Cohéro Logo" style="height: 40px; width: auto; max-width: 100%; display: block; margin: 0 auto;" />
            </div>
            
            <div style="padding: 40px; font-size: 16px; line-height: 1.6; color: #334155;">
                ${inner}
            </div>
            
            <div style="background-color: #f1f5f9; padding: 32px 40px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
                <p style="margin-bottom: 8px;">Du har modtaget denne besked som en del af platformens funktionalitet.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cohéro I/S. Alle rettigheder forbeholdes.</p>
            </div>
            
        </div>
    </div>
</body>
</html>
`;

export async function generateWelcomeEmailAction(input: { userName: string, userEmail: string }): Promise<{ success: boolean; message: string }> {
    try {
        const { data: { subject, body } } = await callFirebaseFlow('generateWelcomeEmailFlow', { userName: input.userName, userEmail: input.userEmail });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro <velkommen@cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: 'Welcome email sent.' };
    } catch (error) {
        console.error('Failed to send welcome email:', error);
        return { success: false, message: 'Failed to send welcome email.' };
    }
}

export async function extractLawInfoAction(input: any) { return callFirebaseFlow('extractLawInfoFromUrlFlow', input); }
export async function getLawContentAction(input: any) { return callFirebaseFlow('getLawContentFlow', input); }

export async function explainLawParagraphAction(input: { lawId: string, lovTitel: string, paragrafNummer: string, paragrafTekst: string }): Promise<Types.ExplainLawParagraphOutput> {
    const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { id: input.lawId, name: input.lovTitel });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('explainLawParagraphFlow', {
        lovTitel: input.lovTitel,
        paragrafNummer: input.paragrafNummer,
        paragrafTekst: input.paragrafTekst,
        lovtekst: lawContext
    });
}

export async function analyzeParagraphAction(input: { lovTitel: string, paragrafNummer: string, paragrafTekst: string, fuldLovtekst: string, uniqueDocumentId?: string }): Promise<Types.AnalyzeParagraphOutput> {
    let urlContext = '';
    if (input.uniqueDocumentId) {
        try {
            // Fetch related guidelines (Type 3) and decisions (Type 6) with resilient error handling
            const [guidelinesRes, decisionsRes] = await Promise.all([
                fetch(`https://www.retsinformation.dk/api/document/documentLinks/3/${input.uniqueDocumentId}`).then(r => r.ok ? r.json() : []),
                fetch(`https://www.retsinformation.dk/api/document/documentLinks/6/${input.uniqueDocumentId}`).then(r => r.ok ? r.json() : [])
            ]);

            const guidelines = (guidelinesRes || []).filter((g: any) => g.shortName?.startsWith('VEJ'));
            // All decisions from the link are relevant
            const decisions = (decisionsRes || []).filter((d: any) => !d.isHistoryFlag && !d.isHistorical);

            const urls = [...guidelines, ...decisions].map((item: any) => {
                const path = item.eliPath || item.href || '';
                if (!path) return null;
                const base = path.startsWith('http') ? path : `https://www.retsinformation.dk${path}`;
                return `${base}/xml`;
            }).filter(Boolean);

            if (urls.length > 0) {
                urlContext = "AUTORITATIV URL KONTEKST (GEMINI: Hent og inddrag disse XML-kilder i din målgruppevurdering for at sikre praksis-validitet):\n" + urls.join('\n');
            }
        } catch (e) {
            console.error("Failed to fetch related context links:", e);
        }
    }

    return callFirebaseFlow('analyzeParagraphFlow', { ...input, urlContext });
}

export async function recommendTechniqueAction(input: any) { return callFirebaseFlow('recommendTechniqueFlow', input); }
export async function explainTechniqueWithAnalogyAction(input: any) { return callFirebaseFlow('explainTechniqueWithAnalogyFlow', input); }
export async function generateExamBlueprintAction(input: any) { return callFirebaseFlow('generateExamBlueprintFlow', input); }
export async function getIntroCaseConsequenceAction(input: any) { return callFirebaseFlow('getIntroCaseConsequenceFlow', input); }
export async function getMythBusterResponseAction(input: any) { return callFirebaseFlow('getMythBusterResponseFlow', input); }
export async function getCareerMatchAction(input: any) { return callFirebaseFlow('getCareerMatchFlow', input); }
export async function reviseJournalEntryAction(input: any) { return callFirebaseFlow('reviseJournalEntryFlow', input); }
export async function reviseCaseAction(input: any) { return callFirebaseFlow('reviseCaseFlow', input); }

export async function generateVerificationEmailAction(input: Types.VerificationEmailInput): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateVerificationEmailFlow', input);
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro <velkommen@cohero.dk>',
            // @ts-ignore
            to: input.userEmail, // Assuming userEmail is part of VerificationEmailInput
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: 'Verification email sent.' };
    } catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, message: 'Failed to send verification email.' };
    }
}

export async function getConsensusAnalysisAction(input: any) { return callFirebaseFlow('getConsensusAnalysisFlow', input); }
export async function getSocraticReflectionAction(input: any) { return callFirebaseFlow('getSocraticReflectionFlow', input); }

export async function explainConceptAction(input: { concept: string }): Promise<Types.ExplainConceptOutput> {
    // Concept explainer now focuses only on non-legal social work concepts.
    return callFirebaseFlow('explainConceptFlow', { ...input });
}

export async function explainConceptWithAnalogyAction(input: any) { return callFirebaseFlow('explainConceptWithAnalogyFlow', input); }
export async function getCaseConsequenceAction(input: any) { return callFirebaseFlow('getCaseConsequenceFlow', input); }

export async function generateQuizAction(input: { topic: string, numQuestions: number, lawId?: string, contextText?: string }): Promise<Types.QuizGeneratorOutput> {
    let lawContext = '';
    if (input.lawId) {
        // This helper fetches both the main law and all its associated guidelines
        // including their XML URLs as text in the prompt.
        const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { id: input.lawId, name: input.topic });
        lawContext = fetchRes.data;
    }

    return callFirebaseFlow('generateQuizFlow', {
        topic: input.topic,
        numQuestions: input.numQuestions,
        lawContext: lawContext || undefined,
        contextText: input.contextText
    });
}

export async function saveQuizResultAction(params: { userId: string, result: Omit<Types.QuizResult, 'createdAt'> }): Promise<{ success: boolean }> {
    const resultRef = adminFirestore.collection('users').doc(params.userId).collection('quizResults').doc();

    try {
        await resultRef.set({
            ...params.result,
            createdAt: FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to save quiz result:", e);
        return { success: false };
    }
}

export async function getFagligtMyceliumAction(input: any) { return callFirebaseFlow('getFagligtMyceliumFlow', input); }
export async function analyzeReformPdfAction(input: any) { return callFirebaseFlow('analyzeReformPdfFlow', input); }
export async function seminarArchitectAction(input: any) { return callFirebaseFlow('seminarArchitectFlow', input); }
export async function generateSemesterPlanAction(input: any) { return callFirebaseFlow('generateSemesterPlanFlow', input); }
export async function suggestConceptsForEventAction(input: any) { return callFirebaseFlow('suggestConceptsForEventFlow', input); }
export async function generateStudyScheduleAction(input: any) { return callFirebaseFlow('generateStudyScheduleFlow', input); }
export async function explainFolketingetSagAction(input: any) { return callFirebaseFlow('explainFolketingetSagFlow', input); }

export async function getFTSagMetadataAction(input: { sagId: number, title: string, resume?: string }) {
    try {
        const docRef = adminFirestore.collection('ftCaseMetadata').doc(input.sagId.toString());
        const snap = await docRef.get();
        
        if (snap.exists) {
            return { data: snap.data(), usage: { inputTokens: 0, outputTokens: 0 } };
        }
        
        // If it doesn't exist, try to generate it
        const result = await callFirebaseFlow('generateFTSagMetadataFlow', { 
            caseTitle: input.title, 
            caseResume: input.resume 
        });
        
        if (result && result.data) {
            await docRef.set({
                ...result.data,
                lastGenerated: FieldValue.serverTimestamp()
            });
        }
        
        return result;
    } catch (error) {
        console.error("Failed to get/generate FT sag metadata:", error);
        // Return null data instead of throwing to prevent 500 errors in the UI
        return { data: null, error: true };
    }
}


export async function oralExamAnalysisAction(input: any) { return callFirebaseFlow('oralExamAnalysisFlow', input); }



/**
 * identifyReformAction
 * Step 1: Identifies the documents for a reform.
 */
export async function identifyReformAction(query: string): Promise<Types.IdentifyReformOutput> {
    return callFirebaseFlow('identifyReformFlow', { query });
}

/**
 * generateReformAnalysisAction
 * Step 2: Generates the detailed diff between a bill and a law.
 * Includes caching in Firestore.
 */
export async function generateReformAnalysisAction(bill: Types.ReformCandidate, law: Types.ReformCandidate, query: string): Promise<Types.GenerateParagraphDiffOutput> {
    // Normalizing query for cache key
    const cacheKey = `analysis_${query.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`;
    
    // Check cache
    const { adminFirestore } = await import('@/firebase/server-init');
    const cacheDoc = await adminFirestore.collection('reformAnalyses').doc(cacheKey).get();
    
    if (cacheDoc.exists) {
        return { data: cacheDoc.data() as Types.GenerateParagraphDiffData, usage: { inputTokens: 0, outputTokens: 0 } };
    }

    const result = await callFirebaseFlow('generateParagraphDiffFlow', {
        targetLawTitle: law.title,
        oldLawXmlUrl: law.xmlUrl,
        newBillXmlUrl: bill.xmlUrl,
    });

    // Save to cache
    await adminFirestore.collection('reformAnalyses').doc(cacheKey).set({
        ...result.data,
        cachedAt: new Date().toISOString(),
    });

    return result;
}

export async function generateRawCaseSourcesAction(input: { topic: string }): Promise<any> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.topic });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('generateRawCaseSourcesFlow', { topic: input.topic, lawContext });
}

export async function simulateStartAction(input: { theme: string, userName: string, currentDateStr: string }): Promise<any> {
    const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: input.theme });
    const lawContext = fetchRes.data;
    return callFirebaseFlow('simulateStartFlowFlow', { theme: input.theme, lawContext, userName: input.userName, currentDateStr: input.currentDateStr });
}

export async function simulateNextDayAction(input: { cases: any[], previousInbox: any[], userJournals: Record<string, string>, currentDay: number, daysPassed: number, userName: string, newDateStr: string }): Promise<any> {
    return callFirebaseFlow('simulateNextDayFlowFlow', input);
}

export async function simulateFeedbackAction(input: { cases: any[], inbox: any[], userJournals: Record<string, string>, totalDays: number, userName: string }): Promise<any> {
    return callFirebaseFlow('simulateFeedbackFlowFlow', input);
}

export async function analyzeFtDocumentAction(input: any) { return callFirebaseFlow('analyzeFtDocumentFlow', input); }
export async function fetchVivePublicationsAction(input: any) { return callFirebaseFlow('fetchVivePublicationsFlow', input); }
export async function textToSpeechAction(input: any) { return callFirebaseFlow('textToSpeechFlow', input); }
export async function getViveReportQaAction(input: any) { return callFirebaseFlow('getViveReportQaFlow', input); }
export async function generateReportQuestionsAction(input: any) { return callFirebaseFlow('generateReportQuestionsFlow', input); }

export async function analyzeStarDataAction(input: Types.AnalyzeStarDataInput): Promise<Types.AnalyzeStarDataOutput> {
    return callFirebaseFlow('analyzeStarDataFlow', input);
}

export async function analyzeLegalDecisionAction(input: any) { return callFirebaseFlow('analyzeLegalDecisionFlow', input); }

export async function semanticLawSearchAction(query: string, lawId?: string, documentData?: any): Promise<Types.SemanticLawSearchOutput> {
    let context = '';
    
    if (lawId && lawId !== 'reference') {
        // Scope to specific law
        const snapshot = await adminFirestore.collection('laws').doc(lawId).get();
        if (snapshot.exists) {
            const fetchRes = await callFirebaseFlow('getSpecificLawContextFlow', { id: lawId, ...snapshot.data() } as any);
            context = fetchRes.data;
        }
    } else if (lawId === 'reference' && documentData) {
        // Scope to reference document (which we already have data for)
        context = `[REFERENCE-DOKUMENT: ${documentData.titel}]\n${documentData.rawText}\n\n`;
    }

    // Fallback or global search if no specific context built
    if (!context) {
        const fetchRes = await callFirebaseFlow('getRelevantLawContextFlow', { topicOrQuery: query });
        context = fetchRes.data;
    }
    
    return callFirebaseFlow('semanticLawSearchFlow', { query, legalContext: context });
}

export async function generateCaseUpdateEmailAction(input: Types.CaseUpdateEmailInput): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateCaseUpdateEmailFlow', input);
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@platform.cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: "Update email sent." };
    } catch (error) {
        console.error('Failed to send case update email:', error);
        return { success: false, message: "Failed to update email." };
    }
}

export async function sendCommentNotificationEmailAction(input: { postAuthorEmail: string, postAuthorName: string, commenterName: string, postTitle: string, postId: string, authorId: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateCommentNotificationEmailFlow', { ...input, postUrl: `https://cohero.dk/opslagstavle#${input.postId}` });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@platform.cohero.dk>',
            to: input.postAuthorEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });

        // Add in-app notification
        await sendInAppNotificationAction({
            uid: input.authorId,
            title: "Ny kommentar! 💬",
            body: `${input.commenterName} svarede på dit opslag: "${input.postTitle}"`,
            type: 'info',
            link: `/opslagstavle#${input.postId}`
        });

        return { success: true, message: "Notification sent." };
    } catch (error) {
        console.error('Failed to send comment notification:', error);
        return { success: false, message: "Failed to notification." };
    }
}

export async function sendStreakReminderEmailAction(input: { userEmail: string, userName: string, streakCount: number, userId: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateStreakReminderEmailFlow', { ...input });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@platform.cohero.dk>',
            to: input.userEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });

        // Add in-app notification
        await sendInAppNotificationAction({
            uid: input.userId,
            title: "Hold din streak i live! 🔥",
            body: `Du har en streak på ${input.streakCount} dage. Log ind i dag for at holde den kørende!`,
            type: 'warning',
            link: '/portal'
        });

        return { success: true, message: "Streak reminder sent." };
    } catch (error) {
        console.error('Failed to send streak reminder:', error);
        return { success: false, message: "Failed to send streak reminder." };
    }
}

export async function sendGroupInvitationEmailAction(input: { recipientEmail: string, inviteeName: string, inviterName: string, groupName: string, groupUrl: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await callFirebaseFlow('generateGroupInvitationEmailFlow', {
            inviteeName: input.inviteeName,
            inviterName: input.inviterName,
            groupName: input.groupName,
            groupUrl: input.groupUrl
        });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Studiegrupper <info@platform.cohero.dk>',
            to: input.recipientEmail,
            subject: subject,
            html: wrapEmailHtml(body),
        });
        return { success: true, message: "Invitation sent." };
    } catch (error) {
        console.error('Failed to send group invitation email:', error);
        return { success: false, message: "Failed to send invitation." };
    }
}

export async function sendBulkEmailAction(input: { recipients: { email: string, name: string }[], subject: string, htmlBody: string }): Promise<{ success: boolean; message: string; sentCount: number }> {
    const { recipients, subject, htmlBody } = input;

    if (!recipients || recipients.length === 0) {
        return { success: false, message: 'Ingen modtagere angivet.', sentCount: 0 };
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        let totalSentCount = 0;

        // Resend batch has a limit of 100 emails per request
        const CHUNK_SIZE = 100;
        for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
            const chunk = recipients.slice(i, i + CHUNK_SIZE);

            const { data, error } = await resend.batch.send(
                chunk.map(recipient => ({
                    from: 'Cohéro Platform <info@platform.cohero.dk>',
                    to: recipient.email,
                    subject: subject,
                    html: htmlBody.replace(/\[Navn\]/gi, recipient.name).replace(/\{\{navn\}\}/gi, recipient.name),
                }))
            );

            if (error) {
                console.error(`Resend batch error for chunk ${i}:`, error);
                throw new Error(error.message);
            }

            totalSentCount += chunk.length;
        }

        return { success: true, message: `E-mails sendt.`, sentCount: totalSentCount };

    } catch (error: any) {
        console.error('Failed to send bulk email:', error);
        return { success: false, message: error.message || 'Ukendt fejl ved afsendelse.', sentCount: 0 };
    }
}

export async function processStudyRegulationAction(input: any) { return callFirebaseFlow('processStudyRegulationFlow', input); }

export async function listInternalDocsAction(): Promise<string[]> {
    const docsDir = path.join(process.cwd(), 'docs');
    try {
        const files = await fs.readdir(docsDir);
        return files.filter(f => f.endsWith('.txt') || f.endsWith('.pdf'));
    } catch (e) {
        console.error("Failed to list docs:", e);
        return [];
    }
}

export async function processInternalDocAction(fileName: string): Promise<any> {
    const filePath = path.join(process.cwd(), 'docs', fileName);
    try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) throw new Error("Ikke en fil.");

        const content = await fs.readFile(filePath);
        const base64 = content.toString('base64');

        // For .txt files, we use the text content directly
        // For .pdf files, we'd normally use a PDF parser, but for this prototype 
        // we'll assume the txt content is the primary source if it's not a PDF.
        const pdfText = fileName.endsWith('.txt') ? content.toString('utf-8') : 'PDF content...';

        return callFirebaseFlow('processStudyRegulationFlow', {
            pdfBase64: base64,
            pdfText: pdfText,
            institution: 'Indlæst fra Arkiv'
        });
    } catch (e) {
        console.error("Failed to process internal doc:", e);
        throw e;
    }
}

export async function extractTasksFromTextAction(input: any) { return callFirebaseFlow('extractTasksFromTextFlow', input); }
export async function analyzeTaskScheduleAction(input: any) { return callFirebaseFlow('analyzeTaskScheduleFlow', input); }
export async function extractApaMetadataAction(input: any) { return callFirebaseFlow('extractApaMetadataFlow', input); }
export async function processExamRegulationsAction(input: any) { return callFirebaseFlow('processExamRegulationsFlow', input); }
export async function getLivePortfolioFeedbackAction(input: any) { return callFirebaseFlow('getLivePortfolioFeedbackFlow', input); }
export async function designSectionOutlineAction(input: any) { return callFirebaseFlow('designSectionOutlineFlowFlow', input); }
export async function generateConceptVideoScriptAction(input: Types.GenerateConceptVideoScriptInput) {
    console.log(">>> ACTION TRIGGERED: generateConceptVideoScriptAction", input.concept);

    const normalizedTerm = input.concept.toLowerCase().trim().replace(/\s+/g, '-');
    const docRef = adminFirestore.collection('conceptVideos').doc(normalizedTerm);

    try {
        // 1. Tjek om videoen findes i cachen
        const snap = await docRef.get();
        if (snap.exists) {
            console.log(">>> ACTION: Fundet eksisterende video i Firestore.");
            return {
                data: snap.data() as Types.GenerateConceptVideoScriptOutput['data'],
                usage: { inputTokens: 0, outputTokens: 0 }
            };
        }

        // 2. Generer ny video hvis ikke i cache
        const res = await callFirebaseFlow('generateConceptVideoScriptFlow', input);
        const script = res.data;

        // 3. Upload medier til Storage for at undgå enorme payloads og hit document limit
        console.log(">>> ACTION: Uploader medier til Storage for persistens...");
        const scenesWithUrls = await Promise.all(script.scenes.map(async (scene) => {
            const updatedScene = { ...scene };

            // Upload audio
            if (scene.audioDataUri && scene.audioDataUri.startsWith('data:')) {
                const path = `concept-explainer/${normalizedTerm}/scene-${scene.sceneNumber}-audio.mp3`;
                updatedScene.audioDataUri = await uploadMediaToStorage(scene.audioDataUri, path);
            }

            // Upload video (fra Veo)
            if (scene.videoUrl && scene.videoUrl.startsWith('data:')) {
                const path = `concept-explainer/${normalizedTerm}/scene-${scene.sceneNumber}-video.mp4`;
                updatedScene.videoUrl = await uploadMediaToStorage(scene.videoUrl, path);
            }

            // Upload image (fra Banana)
            if (scene.imageUrl && scene.imageUrl.startsWith('data:')) {
                const path = `concept-explainer/${normalizedTerm}/scene-${scene.sceneNumber}-image.png`;
                updatedScene.imageUrl = await uploadMediaToStorage(scene.imageUrl, path);
            }

            return updatedScene;
        }));

        const finalScript = { ...script, scenes: scenesWithUrls };

        // 4. Gem i Firestore
        await docRef.set(finalScript);
        console.log(">>> ACTION: Video gemt i Firestore.");

        return { data: finalScript, usage: res.usage };
    } catch (e: any) {
        console.error(">>> ACTION ERROR in generateConceptVideoScriptAction:", e.message);
        throw new Error(`Fejl under videogenerering: ${e.message}`);
    }
}



// --- STAR API Actions ---

const STAR_BASE_URL = 'https://api.jobindsats.dk/v2';

export async function fetchStarSubjectsAction(): Promise<any[]> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler. Kontakt venligst administratoren.");
    }

    try {
        const response = await fetch(`${STAR_BASE_URL}/subjects/json`, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Kald til STAR fejlede: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("STAR Subjects Fetch Error:", error);
        throw error;
    }
}

export async function fetchStarTablesAction(subjectId: string | number): Promise<any[]> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler.");
    }

    try {
        const response = await fetch(`${STAR_BASE_URL}/tables?subjectid=${subjectId}`, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Kald til STAR fejlede: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("STAR Tables Fetch Error:", error);
        throw error;
    }
}

export async function fetchStarTableDetailsAction(tableId: string): Promise<any> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler.");
    }

    const url = `${STAR_BASE_URL}/tables/${tableId}/json`;
    console.log("STAR Table Details Fetch URL (Server):", url);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Kald til STAR Tabel-detaljer fejlede: ${response.statusText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error("STAR Table Details Fetch Error:", error);
        throw error;
    }
}

export async function fetchStarTableDataAction(tableId: string, filters: Record<string, string[]>, format: 'json' | 'csv' = 'json'): Promise<any> {
    const token = process.env.STAR_API_TOKEN;
    if (!token) {
        throw new Error("STAR API token mangler.");
    }

    // Construct query string
    const params = new URLSearchParams();
    for (const key in filters) {
        if (filters[key] && filters[key].length > 0) {
            // Join array values with commas as per STAR API pattern
            params.append(key, filters[key].join(','));
        }
    }

    const queryString = params.toString();
    const url = `${STAR_BASE_URL}/data/${tableId}/${format}?${queryString}`;

    // Log the constructed URL for debugging as requested by user
    console.log(`STAR Data Fetch URL (${format}) (Server):`, url);

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': token,
                'Accept': 'application/json'
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`STAR Data Fetch Error (${response.status}):`, errorText);
            throw new Error(`Kald til STAR Data fejlede: ${response.statusText}`);
        }

        if (format === 'csv') {
            return await response.text();
        }
        return await response.json();
    } catch (error: any) {
        console.error("STAR Table Data Fetch Error:", error);
        throw error;
    }
}

// --- Retsinformation API Actions ---

export async function fetchLawTimeline(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/${String(uniqueDocumentId)}/timeline`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch law timeline for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        // Typically returns an array of events
        return data || [];
    } catch (error) {
        console.error("Failed to fetch law timeline:", error);
        return [];
    }
}

/**
 * Fetches associated documents (cirkulærer, bekendtgørelser, etc.) for a law.
 * API Endpoint: https://www.retsinformation.dk/api/document/documentLinks/3/(UniqueDocumentId)
 */
export async function fetchRelatedDocumentLinks(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/documentLinks/3/${String(uniqueDocumentId)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch related document links for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        // Returns an array of related document objects
        return data || [];
    } catch (error) {
        console.error("Failed to fetch related document links:", error);
        return [];
    }
}

/**
 * Fetches related decisions (principmeddelelser) for a law.
 * API Endpoint: https://www.retsinformation.dk/api/document/documentLinks/6/(UniqueDocumentId)
 */
export async function fetchRelatedDecisions(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/documentLinks/6/${String(uniqueDocumentId)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch related decisions for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Failed to fetch related decisions:", error);
        return [];
    }
}

/**
 * Fetches Ombudsmand reports related to a law.
 * API Endpoint: https://www.retsinformation.dk/api/document/documentLinks/5/(UniqueDocumentId)
 */
export async function fetchOmbudsmandReports(uniqueDocumentId: string): Promise<any[]> {
    const url = `https://www.retsinformation.dk/api/document/documentLinks/5/${String(uniqueDocumentId)}`;
    try {
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });
        if (!response.ok) {
            console.error(`Failed to fetch Ombudsmand reports for ${uniqueDocumentId}. Status: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Failed to fetch Ombudsmand reports:", error);
        return [];
    }
}

// --- Folketinget ODA Actions ---

export async function fetchFolketingetSagByLovnummer(lovnummer: string, dato: string): Promise<any> {
    // dato is expected in dd.mm.yyyy
    const parts = dato.split('.');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;

    // Construct filter for ODA API
    const filter = `lovnummer eq '${lovnummer}' and year(lovnummerdato) eq ${year} and month(lovnummerdato) eq ${parseInt(month)} and day(lovnummerdato) eq ${parseInt(day)}`;
    const url = `https://oda.ft.dk/api/Sag?$filter=${encodeURIComponent(filter)}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) return null;
        const data = await response.json();
        // Return the first matching case (Sag)
        return data.value?.[0] || null;
    } catch (error) {
        console.error("Failed to fetch sag by lovnummer from Folketinget ODA:", error);
        return null;
    }
}

// Stripe and other Server Actions
export async function createCheckoutSession(params: { priceId: string, userId: string, userEmail?: string, userName?: string, stripeCustomerId?: string | null, originPath?: string, trialDays?: number }): Promise<{ sessionId: string, stripeCustomerId: string }> {
    if (!isStripeConfigured) {
        throw new Error('Betalingssystemet er ikke konfigureret korrekt på serveren (mangler API-nøgle).');
    }

    const { priceId, userId, userEmail, userName, stripeCustomerId, originPath, trialDays } = params;

    const headersList = headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const basePath = originPath || '/portal';
    const separator = basePath.includes('?') ? '&' : '?';
    const success_url = `${origin}${basePath}${separator}success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}${basePath}`;

    let customerId = stripeCustomerId;

    if (!customerId) {
        try {
            const customer = await stripe.customers.create({
                email: userEmail,
                name: userName,
                metadata: {
                    firebaseUID: userId,
                },
            });
            customerId = customer.id;
        } catch (e: any) {
            console.error('Error creating Stripe customer:', e);
            throw new Error('Kunne ikke oprette kunde i betalingssystemet.');
        }
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer: customerId,
            client_reference_id: userId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            subscription_data: {
                trial_period_days: trialDays !== undefined ? trialDays : 7,
            },
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: success_url,
            cancel_url: cancel_url,
        });

        if (!session.id) {
            throw new Error('Stripe session ID is missing');
        }

        return { sessionId: session.id, stripeCustomerId: customerId };
    } catch (error: any) {
        console.error('Stripe error:', error);
        throw new Error(`Fejl ved oprettelse af betalingslink: ${error.message}`);
    }
}

export async function processStripeSession(sessionId: string): Promise<{ success: boolean; message: string; updateData?: any }> {
    if (!isStripeConfigured) {
        return { success: false, message: 'Betalingssystemet er ikke konfigureret.' };
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['subscription'],
        });

        if (session.status !== 'complete') {
            return { success: false, message: 'Betaling ikke fuldført.' };
        }

        const subscription = session.subscription as Stripe.Subscription;
        if (!subscription) {
            throw new Error('Subscription not found on session.');
        }

        const price = subscription.items.data[0].price;
        let membershipLevel = price.nickname || 'Kollega+';

        // Explicit mapping for specific price IDs to ensure reliability
        if (price.id === process.env.STRIPE_GROUP_PRO_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID) {
            membershipLevel = 'Group Pro';
        } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID) {
            membershipLevel = 'Kollega+';
        } else if (price.id === process.env.STRIPE_SEMESTERPAKKEN_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID) {
            membershipLevel = 'Semesterpakken';
        } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID) {
            membershipLevel = 'Kollega++';
        }

        const updateData = {
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            stripePriceId: price.id,
            stripeSubscriptionStatus: subscription.status,
            stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            membership: membershipLevel,
            stripeCancelAtPeriodEnd: false,
        };

        if (session.customer_details?.email) {
            try {
                const { subject, body } = await callFirebaseFlow('generateSubscriptionConfirmationEmailFlow', {
                    userName: session.customer_details.name || 'Kollega',
                    membershipLevel: membershipLevel,
                });
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: 'Cohéro <velkommen@cohero.dk>',
                    to: session.customer_details.email,
                    subject: subject,
                    html: body,
                });
            } catch (emailError) {
                console.error("Confirmation email failed to send:", emailError);
            }
        }

        return { success: true, message: 'Subscription data retrieved.', updateData };

    } catch (error: any) {
        console.error('Error processing Stripe session:', error);
        return { success: false, message: error.message };
    }
}

export async function createPortalSession(stripeCustomerId: string): Promise<{ url: string }> {
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${origin}/settings`,
        });
        return { url: portalSession.url };
    } catch (e: any) {
        console.error(e);
        throw new Error('Failed to create portal session');
    }
}

export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean; message: string; }> {
    try {
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });
        return { success: true, message: "Dit abonnement er blevet opsagt og vil ikke blive fornyet." };
    } catch (error: any) {
        console.error(error);
        return { success: false, message: error.message };
    }
}

export async function syncSubscriptionStatusAction(stripeCustomerId: string): Promise<{
    stripeSubscriptionStatus: string;
    stripeCurrentPeriodEnd: string;
    membership: string;
    stripeCancelAtPeriodEnd: boolean;
    stripePriceId: string;
    stripeSubscriptionId: string;
} | null> {
    if (!isStripeConfigured) return null;

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            limit: 1,
            status: 'all',
        });

        if (subscriptions.data.length === 0) return null;

        const sub = subscriptions.data[0];
        const price = sub.items.data[0].price;
        let membershipLevel = price.nickname || 'Kollega+';

        if (price.id === process.env.STRIPE_GROUP_PRO_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_GROUP_PRO_PRICE_ID) {
            membershipLevel = 'Group Pro';
        } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PRICE_ID) {
            membershipLevel = 'Kollega+';
        } else if (price.id === process.env.STRIPE_SEMESTERPAKKEN_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_SEMESTERPAKKEN_PRICE_ID) {
            membershipLevel = 'Semesterpakken';
        } else if (price.id === process.env.STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID || price.id === process.env.NEXT_PUBLIC_STRIPE_KOLLEGA_PLUS_PLUS_PRICE_ID) {
            membershipLevel = 'Kollega++';
        }

        // We only grant premium membership if the status is active or trialing
        const isActive = sub.status === 'active' || sub.status === 'trialing';

        return {
            stripeSubscriptionStatus: sub.status,
            stripeCurrentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            membership: isActive ? membershipLevel : 'Kollega',
            stripeCancelAtPeriodEnd: sub.cancel_at_period_end,
            stripePriceId: price.id,
            stripeSubscriptionId: sub.id,
        };
    } catch (e) {
        // Only log errors if customer was provided.
        if (stripeCustomerId) {
            console.error('Error syncing Stripe subscription:', e);
        }
        return null;
    }
}

// Other Server Actions
export async function sendBugReport(reportText: string, pathname: string, username: string, email: string): Promise<{ success: boolean; message: string; }> {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Bug Rapport <bug@cohero.dk>',
            to: 'kontakt@cohero.dk',
            subject: `Ny Fejlrapport fra: ${username}`,
            html: `
        <p><strong>Bruger:</strong> ${username} (${email})</p>
        <p><strong>Side:</strong> ${pathname}</p>
        <hr>
        <p><strong>Rapport:</strong></p>
        <p>${reportText}</p>
      `,
        });
        return { success: true, message: 'Din fejlrapport er blevet sendt. Tak for hjælpen!' };
    } catch (error) {
        console.error('Failed to send bug report:', error);
        return { success: false, message: 'Kunne ikke sende rapport. Prøv igen senere.' };
    }
}

export async function sendTaskResetEmailAction(recipientEmail: string, taskTitle: string) {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Markedsplads <info@platform.cohero.dk>',
            to: recipientEmail,
            subject: `Opdatering: Din opgave '${taskTitle}' er åben igen`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f3f4f6; border-radius: 20px;">
                    <h2 style="color: #451a03; font-family: serif;">Din opgave er lagt op på markedspladsen igen</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Hej!<br><br>
                        Vi skriver til dig for at informere om, at din opgave <strong>"${taskTitle}"</strong> er blevet nulstillet af en administrator og nu er synlig for alle kvalificerede studerende på markedspladsen igen.
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Dette sker typisk hvis den tidligere hjælper ikke længere kan løse opgaven, eller hvis vi vurderer at en anden studerende vil være et bedre match.
                    </p>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Du vil modtage en ny mail, så snart en anden studerende tager opgaven.
                    </p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
                        Med venlig hilsen<br>
                        <strong>Cohéro Teamet</strong>
                    </div>
                </div>
            `
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to send task reset email:", error);
        return { success: false, error: "Failed to send email" };
    }
}

export async function sendEmailToConsultant(subject: string, message: string, userName: string, userEmail: string): Promise<{ success: boolean; message: string; }> {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Spørgsmål <info@platform.cohero.dk>',
            to: 'julie@cohero.dk',
            reply_to: userEmail,
            subject: `Spørgsmål fra ${userName}: ${subject}`,
            html: `<p>Fra: ${userName} (${userEmail})</p><p>${message}</p>`,
        });
        return { success: true, message: 'Din besked er sendt!' };
    } catch (error) {
        console.error('Failed to send consultant email:', error);
        return { success: false, message: 'Kunne ikke sende besked.' };
    }
}

export async function fetchPoliticalNews(): Promise<any[]> {
    try {
        const response = await fetch('https://www.dr.dk/nyheder/service/feeds/politik', { next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const text = await response.text();
        const items = [...text.matchAll(/<item>(.*?)<\/item>/gs)];
        return items.map(item => {
            const title = item[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1] || '';
            const link = item[1].match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/s)?.[1] || '';
            const pubDate = item[1].match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';
            return { title, link, pubDate };
        });
    } catch (error) {
        console.error("Failed to fetch DR news:", error);
        return [];
    }
}

export async function fetchSocialMinistryNews(): Promise<any[]> {
    try {
        const response = await fetch('https://www.sm.dk/handlers/DynamicRss.ashx?id=d66aadb0-8d96-4027-9a8f-7a3176ad49f9', { next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const text = await response.text();
        const items = [...text.matchAll(/<item>(.*?)<\/item>/gs)];
        return items.map(item => {
            const title = item[1].match(/<title>(.*?)<\/title>/s)?.[1] || '';
            const link = item[1].match(/<link>(.*?)<\/link>/s)?.[1] || '';
            const pubDate = item[1].match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || '';
            return { title, link, pubDate };
        });
    } catch (error) {
        console.error("Failed to fetch SM news:", error);
        return [];
    }
}

export async function fetchFolketingetSager(params: { searchTerm?: string, typeId?: number | null, statusId?: number | null, followedIds?: number[] | null, skip?: number, top?: number }): Promise<any[]> {
    const { searchTerm, typeId, statusId, followedIds, skip = 0, top = 10 } = params;

    if (params.followedIds && (!followedIds || followedIds.length === 0)) {
        return [];
    }

    let filters: string[] = [];
    if (searchTerm) {
        const escapedSearchTerm = searchTerm.replace(/'/g, "''");
        filters.push(`substringof('${escapedSearchTerm}', titel) eq true`);
        const fiveYearsAgo = new Date();
        fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
        filters.push(`opdateringsdato gt datetime'${fiveYearsAgo.toISOString().split('.')[0]}'`);
    }

    if (typeId) filters.push(`typeid eq ${typeId}`);
    if (statusId) filters.push(`statusid eq ${statusId}`);

    if (followedIds) {
        filters.push(`(${followedIds.map(id => `id eq ${id}`).join(' or ')})`);
    }

    const filterString = filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
    const url = `https://oda.ft.dk/api/Sag?$inlinecount=allpages&${filterString}&$orderby=opdateringsdato desc&$skip=${skip}&$top=${top}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
            console.error(`Failed to fetch Folketinget sager. Status: ${response.status}, URL: ${url}`);
            return [];
        }
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Failed to fetch Folketinget sager:", error);
        return [];
    }
}

export async function fetchFolketingetSagById(id: number): Promise<any> {
    const url = `https://oda.ft.dk/api/Sag(${id})?$expand=Sagstrin`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch sag by ID:", error);
        return [];
    }
}

export async function fetchSagDokumenter(sagId: number): Promise<any[]> {
    const sagDokUrl = `https://oda.ft.dk/api/SagDokument?$filter=sagid eq ${sagId}`;
    try {
        const sagDokResponse = await fetch(sagDokUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 3600 }
        });

        if (!sagDokResponse.ok) {
            console.error(`Failed to fetch SagDokument list for sagId ${sagId}: ${sagDokResponse.statusText}`);
            return [];
        }

        const sagDokData = await sagDokResponse.json();
        const sagDokumenterRefs = sagDokData.value || [];

        if (sagDokumenterRefs.length === 0) {
            return [];
        }

        const dokumentPromises = sagDokumenterRefs.map(async (sagDokRef: any) => {
            if (!sagDokRef.dokumentid) {
                return null;
            }
            const dokUrl = `https://oda.ft.dk/api/Dokument(${sagDokRef.dokumentid})?$expand=Fil`;

            try {
                const dokResponse = await fetch(dokUrl, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } });
                if (!dokResponse.ok) {
                    console.warn(`Could not fetch details for dokumentid ${sagDokRef.dokumentid}. Status: ${dokResponse.statusText}`);
                    return null;
                }
                const dokDetails = await dokResponse.json();

                return {
                    ...sagDokRef,
                    Dokument: dokDetails
                };
            } catch (e) {
                console.error(`Error fetching details for dokumentid ${sagDokRef.dokumentid}:`, e);
                return null;
            }
        });

        const fullDokumenter = await Promise.all(dokumentPromises);

        return fullDokumenter.filter((d): d is any => d !== null);

    } catch (error) {
        console.error("General error in fetchSagDokumenter:", error);
        return [];
    }
}


export async function fetchDagsordenspunkter(sagId: number): Promise<any[]> {
    const url = `https://oda.ft.dk/api/DagsordenspunktSag?&$filter=sagid eq ${sagId}&$expand=Dagsordenspunkt($expand=Møde,Dokument($expand=Fil))&$orderby=Dagsordenspunkt/Møde/dato desc`;
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) return [];
        const data = await response.json();
        return data.value || [];
    } catch (error) {
        console.error("Failed to fetch dagsordenspunkter:", error);
        return [];
    }
}

export async function fetchLatestDecisions(): Promise<any[]> {
    const url = "https://www.retsinformation.dk/api/documentsearch?dt=230&dt=240&dt=250&dt=260&dt=980&o=80&ps=100&r=188";
    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const data = await response.json();
        return data.documents || data.items || data || [];
    } catch (error) {
        console.error("Failed to fetch latest decisions:", error);
        return [];
    }
}

export async function checkFollowedSagerUpdatesAction(userId: string, userEmail: string) {
    try {
        const followedSagerCol = adminFirestore.collection('followedSager');
        const snapshot = await followedSagerCol.where('userId', '==', userId).get();

        
        if (snapshot.empty) return { updatedCount: 0 };
        
        let updatedCount = 0;
        const updates: { sagId: number, title: string, oldStatusId: number, newStatusId: number }[] = [];

        for (const docRef of snapshot.docs) {
            const data = docRef.data();

            const sagId = data.sagId;
            const currentStatusId = data.statusId;
            
            // Fetch latest from ODA
            const latestSag = await fetchFolketingetSagById(sagId);
            if (latestSag && latestSag.statusid !== currentStatusId) {
                // Status changed!
                updatedCount++;
                
                // Update Firestore
                await docRef.ref.update({
                    statusId: latestSag.statusid,
                    lastUpdatedAt: FieldValue.serverTimestamp()
                });
                
                updates.push({
                    sagId: sagId,
                    title: latestSag.titel,
                    oldStatusId: currentStatusId,
                    newStatusId: latestSag.statusid
                });

                
                // Send In-App Notification
                await sendInAppNotificationAction({
                    uid: userId,
                    title: "Statusændring på fulgt sag! 🏛️",
                    body: `Sagen "${latestSag.titel}" har skiftet status.`,
                    type: 'success',
                    link: `/folketinget/case/view/${sagId}`
                });
            }
        }
        
        if (updatedCount > 0 && userEmail) {
            // Optionally send a single summary email
            await generateCaseUpdateEmailAction({
                userEmail,
                userName: "Bruger",
                caseTitle: updates.length === 1 ? updates[0].title : `${updatedCount} sager`,
                caseUrl: `https://cohero.dk/folketinget`
            });
        }

        return { updatedCount };
    } catch (error) {
        console.error("Failed to check followed sager updates:", error);
        return { updatedCount: 0, error: true };
    }
}


export async function fetchPrincipmeddelelserAction(lawName: string): Promise<any[]> {
    const cleanName = lawName.replace(/bekendtgørelse af\s+/i, '').trim();
    const encodedLaw = encodeURIComponent(cleanName);
    const url = `https://www.retsinformation.dk/api/documentsearch?dt=230&dt=240&dt=250&dt=260&dt=980&ps=20&r=188&t=Ankestyrelsens%20principmeddelelse&t=${encodedLaw}`;

    try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 3600 } });
        if (!response.ok) return [];
        const data = await response.json();
        const items = data.documents || data.items || data || [];

        return items.map((item: any) => ({
            id: item.id?.toString() || Math.random().toString(),
            title: item.title || item.name || 'Uden titel',
            publicationDate: item.offentliggoerelsesDato || item.publicationDate || 'Ukendt dato',
            retsinfoLink: item.retsinfoLink ? `https://www.retsinformation.dk${item.retsinfoLink}` : '',
            abbreviation: item.documentTypeEliCode || 'Afg.'
        }));
    } catch (error) {
        console.error("Failed to fetch principmeddelelser:", error);
        return [];
    }
}

export async function recommendTaskAssigneeAction(input: any) { return callFirebaseFlow('recommendTaskAssigneeFlow', input); }

export async function queueNotificationAction(input: { title: string, body: string, recipientUids: string[], sentBy: string, targetGroup: string }) {
    try {
        let targets: string[] = input.recipientUids;

        // If 'all', fetch all user UIDs
        if (input.targetGroup === 'all') {
            const usersSnapshot = await adminFirestore.collection('users').select().get();
            targets = usersSnapshot.docs.map(doc => doc.id);
        }

        // 1. Push notification queue (for the background function to pick up)
        await adminFirestore.collection('notifications_queue').add({
            ...input,
            recipientUids: targets,
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });

        // 2. Add to each recipient's in-app notification list
        const chunks: string[][] = [];
        for (let i = 0; i < targets.length; i += 500) {
            chunks.push(targets.slice(i, i + 500));
        }

        for (const chunk of chunks) {
            const batch = adminFirestore.batch();
            for (const uid of chunk) {
                const notifRef = adminFirestore.collection('users').doc(uid).collection('notifications').doc();
                batch.set(notifRef, {
                    title: input.title,
                    body: input.body,
                    type: 'info',
                    read: false,
                    createdAt: FieldValue.serverTimestamp(),
                    sentBy: input.sentBy,
                    sourceGroup: input.targetGroup
                });
            }
            await batch.commit();
        }

        return { success: true };
    } catch (error: any) {
        console.error("Failed to queue notification:", error);
        return { success: false, message: error.message };
    }
}

export async function sendInAppNotificationAction(input: { uid: string, title: string, body: string, type: string, link?: string }) {
    try {
        // 1. In-App Notification (Firestore subcollection)
        await adminFirestore.collection('users').doc(input.uid).collection('notifications').add({
            title: input.title,
            body: input.body,
            type: input.type,
            link: input.link || '',
            read: false,
            createdAt: FieldValue.serverTimestamp()
        });

        // 2. Queue Push Notification (for Devices)
        await adminFirestore.collection('notifications_queue').add({
            title: input.title,
            body: input.body,
            recipientUids: [input.uid],
            sentBy: 'system',
            targetGroup: 'private',
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to send notification:", error);
        return { success: false, message: error.message };
    }
}

export async function addGroupMemberByEmailAction(input: { groupId: string, email: string, inviterId: string, inviterName: string }) {
    const { groupId, email, inviterId, inviterName } = input;

    try {
        // 1. Find user by email
        const userSnap = await adminFirestore.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();

        if (userSnap.empty) {
            return { success: false, message: 'Bruger ikke fundet.' };
        }

        const targetUser = userSnap.docs[0];
        const targetUserId = targetUser.id;
        const targetUserName = targetUser.data().username || 'Kollega';

        // 2. Check if already member
        const groupRef = adminFirestore.collection('groups').doc(groupId);
        const groupDoc = await groupRef.get();
        if (!groupDoc.exists) return { success: false, message: 'Gruppe ikke fundet.' };

        const groupData = groupDoc.data();
        const memberIds = groupData?.memberIds || [];

        if (memberIds.includes(targetUserId)) {
            return { success: false, message: 'Brugeren er allerede medlem af denne gruppe.' };
        }

        // 3. Perform batch update
        const batch = adminFirestore.batch();

        const memberDocRef = groupRef.collection('members').doc(targetUserId);
        batch.set(memberDocRef, {
            id: targetUserId,
            email: email.toLowerCase(),
            role: 'member',
            joinedAt: FieldValue.serverTimestamp()
        });

        batch.update(groupRef, {
            memberIds: FieldValue.arrayUnion(targetUserId),
            membersCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return {
            success: true,
            targetUserId,
            targetUserName,
            groupName: groupData?.name
        };
    } catch (error: any) {
        console.error("Add member action error:", error);
        return { success: false, message: error.message };
    }
}
export async function twistBlueprintAction(input: { blueprintTitle: string; currentProblemStatement: string; twist: string }) {
    const result = await callFirebaseFlow('twistBlueprintFlowFlow', input);
    return {
        data: result.data,
        usage: result.usage
    };
}

export async function toggleViveAreaFollowAction(userId: string, areaId: string) {
    try {
        const userRef = adminFirestore.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) throw new Error('User not found');

        const data = userDoc.data();
        const followed = data?.followedViveAreas || [];

        if (followed.includes(areaId)) {
            await userRef.update({
                followedViveAreas: FieldValue.arrayRemove(areaId)
            });
            return { success: true, followed: false };
        } else {
            await userRef.update({
                followedViveAreas: FieldValue.arrayUnion(areaId)
            });
            return { success: true, followed: true };
        }
    } catch (error: any) {
        console.error(`[toggleViveAreaFollowAction] Error for user ${userId}, area ${areaId}:`, error);
        return { success: false, message: error.message };
    }
}
export async function generateEvidenceTagsAction(input: any) {
    try {
        return await callFirebaseFlow('generateEvidenceTagsFlow', input);
    } catch (e) {
        console.error("AI Tags error:", e);
        return { tags: [] };
    }
}

export async function organizeEvidenceIntoSeminarAction(input: any) {
    try {
        return await callFirebaseFlow('organizeEvidenceIntoSeminarFlow', input);
    } catch (e: any) {
        console.error("Organize evidence error:", e);
        throw new Error(`Fejl ved organisering af evidens: ${e.message}`);
    }
}

export async function chatWithEvidenceContentAction(input: any) {
    return callFirebaseFlow('chatWithEvidenceContentFlow', input);
}


export async function detectAiContentAction(input: { text: string }) {
    return await callFirebaseFlow('detectAiContentContentFlow', input);
}


export async function draftEmailAction(topic: string) {
    try {
        const result = await callFirebaseFlow('draftEmailFlow', { topic });
        return { success: true, data: result.data };
    } catch (e: any) {
        console.error("Draft Email Error:", e);
        return { success: false, message: e.message };
    }
}



export async function getUserUidByEmailAction(email: string): Promise<{ success: boolean; uid?: string; name?: string; message?: string }> {
    try {
        const snap = await adminFirestore.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
        if (snap.empty) return { success: false, message: 'Bruger ikke fundet.' };
        const userDoc = snap.docs[0];
        return { 
            success: true, 
            uid: userDoc.id, 
            name: userDoc.data().username || userDoc.data().displayName || 'En kollega' 
        };
    } catch (e) {
        console.error("Failed to lookup user:", e);
        return { success: false, message: 'Der skete en fejl ved opslag.' };
    }
}

export async function scanStudentCardAction(input: Types.ScanStudentCardInput): Promise<any> {
    try {
        const result = await callFirebaseFlow('scanStudentCardFlow', input);
        return { success: true, ...result };
    } catch (e: any) {
        console.error("scanStudentCardAction failed:", e);
        return { 
            success: false, 
            error: e.message || "Scanning fejlede.", 
            details: process.env.NODE_ENV === 'development' ? e.stack : undefined 
        };
    }
}

export async function updateStudentCardVerificationAction(userId: string, verification: any) {
    try {
        await adminFirestore.collection('users').doc(userId).update({
            studentCardVerification: {
                ...verification,
                scannedAt: FieldValue.serverTimestamp()
            }
        });
        return { success: true };
    } catch (e) {
        console.error("Failed to update student card verification:", e);
        return { success: false, error: "Failed to update" };
    }
}
