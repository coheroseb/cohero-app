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
import { recommendContent } from '@/ai/flows/content-recommendations';
import { generateCase } from '@/ai/flows/generate-case-flow';
import { getSecondOpinion } from '@/ai/flows/second-opinion-flow';
import { getJournalFeedback } from '@/ai/flows/journal-feedback-flow';
import { getCaseFeedback } from '@/ai/flows/case-feedback-flow';
import { generateWelcomeEmail } from '@/ai/flows/generate-welcome-email-flow';
import { extractLawInfoFromUrl } from '@/ai/flows/extract-law-info-flow';
import { getLawContent } from '@/ai/flows/get-law-content-flow';
import { explainLawParagraph } from '@/ai/flows/explain-law-paragraph-flow';
import { recommendTechnique } from '@/ai/flows/recommend-technique-flow';
import { explainTechniqueWithAnalogy } from '@/ai/flows/explain-technique-analogy-flow';
import { generateExamBlueprint } from '@/ai/flows/exam-architect-flow';
import { getIntroCaseConsequence } from '@/ai/flows/intro-case-consequence-flow';
import { getMythBusterResponse } from '@/ai/flows/myth-buster-flow';
import { getCareerMatch } from '@/ai/flows/career-match-flow';
import { reviseJournalEntry } from '@/ai/flows/revise-journal-entry-flow';
import { reviseCase } from '@/ai/flows/revise-case-flow';
import { generateVerificationEmail } from '@/ai/flows/generate-verification-email-flow';
import { getConsensusAnalysis } from '@/ai/flows/consensus-analysis-flow';
import { getSocraticReflection } from '@/ai/flows/sokratisk-refleksion/flow';
import { explainConcept } from '@/ai/flows/explain-concept-flow';
import { explainConceptWithAnalogy } from '@/ai/flows/explain-concept-analogy-flow';
import { getCaseConsequence } from '@/ai/flows/case-consequence-flow';
import { generateQuiz } from '@/ai/flows/quiz-generator-flow';
import { getFagligtMycelium } from '@/ai/flows/fagligt-mycelium-flow';
import { generateCommentNotificationEmail } from '@/ai/flows/generate-comment-notification-email-flow';
import { analyzeReformPdf } from '@/ai/flows/analyze-reform-flow';
import { seminarArchitect } from '@/ai/flows/seminar-architect-flow';
import { generateSubscriptionConfirmationEmail } from '@/ai/flows/generate-subscription-confirmation-email-flow';
import { generateStreakReminderEmail } from '@/ai/flows/generate-streak-reminder-email-flow';
import { generateSemesterPlan } from '@/ai/flows/semester-planner-flow';
import { suggestConceptsForEvent } from '@/ai/flows/suggest-concepts-for-event-flow';
import { generateStudySchedule } from '@/ai/flows/generate-study-schedule-flow';
import { explainFolketingetSag } from '@/ai/flows/explain-ft-case-flow';
import { oralExamAnalysis } from '@/ai/flows/oral-exam-analysis-flow';
import { generateJournalScenario } from '@/ai/flows/generate-journal-scenario-flow';
import { generateCaseUpdateEmail } from '@/ai/flows/generate-case-update-email-flow';
import { analyzeFtDocument } from '@/ai/flows/analyze-ft-document-flow';
import { fetchVivePublications as fetchVivePublicationsFlow } from '@/ai/flows/vive-indsigt-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { getViveReportQa } from '@/ai/flows/vive-report-qa-flow';
import { generateReportQuestions } from '@/ai/flows/generate-report-questions-flow';
import { analyzeStarData } from '@/ai/flows/analyze-star-data-flow';
import { analyzeParagraph } from '@/ai/flows/analyze-paragraph-flow';
import { analyzeLegalDecision } from '@/ai/flows/analyze-legal-decision-flow';
import { processStudyRegulation } from '@/ai/flows/process-study-regulation-flow';
import { extractTasksFromText } from '@/ai/flows/extract-tasks-flow';
import { analyzeTaskSchedule } from '@/ai/flows/analyze-task-schedule-flow';
import { generateGroupInvitationEmail } from '@/ai/flows/generate-group-invitation-email-flow';
import { recommendTaskAssignee } from '@/ai/flows/recommend-task-assignee-flow';

// Type Imports
import type * as Types from '@/ai/flows/types';
import type Stripe from 'stripe';


// Third-party and utility imports
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { Resend } from 'resend';
import { adminFirestore } from '@/firebase/server-init';
import { getRelevantLawContext, getSpecificLawAndGuidelinesContext } from '@/lib/law-context-helper';
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
): Promise<Record<string, 'physical' | 'online' | 'unavailable' | null>> {
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

        // Only process events within range
        if (endDate < startRange || startDate > endRange) continue;

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
    const result: Record<string, 'physical' | 'online' | 'unavailable' | null> = {};

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
                result[key] = 'unavailable';
            } 
            // ONLY mark as physical if 100% free across the whole month on weekdays
            else if (busyRatio === 0 && dIdx !== 0 && dIdx !== 6) {
                result[key] = 'physical';
            } 
            // For everything else, default to null so the user has to make a conscious choice
            else {
                result[key] = null;
            }
        }
    }

    return result;
}

// AI Actions (wrapping flows)
export const recommendContentAction = recommendContent;

export async function generateNewCase(input: { topic: string }): Promise<any> {
  const lawContext = await getRelevantLawContext(input.topic);
  return generateCase({ topic: input.topic, lawContext });
}

export const generateCaseAction = generateNewCase;

export const getSecondOpinionAction = getSecondOpinion;

export async function getJournalFeedbackAction(input: { topic: string, scenario: string, initialObservation: string, journalEntry: string }): Promise<Types.JournalFeedbackOutput> {
  const lawContext = await getRelevantLawContext(input.topic);
  return getJournalFeedback({ ...input, lawContext });
}

export async function getCaseFeedbackAction(input: { topic: string, scenario: string, initialObservation: string, assessment: string, goals: string, actionPlan: string }): Promise<Types.CaseFeedbackOutput> {
  const lawContext = await getRelevantLawContext(input.topic);
  return getCaseFeedback({ ...input, lawContext });
}

export async function generateWelcomeEmailAction(input: { userName: string, userEmail: string }): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { subject, body } } = await generateWelcomeEmail({ userName: input.userName });
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Cohéro <velkommen@cohero.dk>',
      to: input.userEmail,
      subject: subject,
      html: body,
    });
    return { success: true, message: 'Welcome email sent.' };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, message: 'Failed to send welcome email.' };
  }
}

export const extractLawInfoAction = extractLawInfoFromUrl;
export const getLawContentAction = getLawContent;

export async function explainLawParagraphAction(input: { lawId: string, lovTitel: string, paragrafNummer: string, paragrafTekst: string }): Promise<Types.ExplainLawParagraphOutput> {
    const lawContext = await getSpecificLawAndGuidelinesContext(input.lawId);
    return explainLawParagraph({ 
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
    
    return analyzeParagraph({ ...input, urlContext });
}

export const recommendTechniqueAction = recommendTechnique;
export const explainTechniqueWithAnalogyAction = explainTechniqueWithAnalogy;
export const generateExamBlueprintAction = generateExamBlueprint;
export const getIntroCaseConsequenceAction = getIntroCaseConsequence;
export const getMythBusterResponseAction = getMythBusterResponse;
export const getCareerMatchAction = getCareerMatch;
export const reviseJournalEntryAction = reviseJournalEntry;
export const reviseCaseAction = reviseCase;

export async function generateVerificationEmailAction(input: Types.VerificationEmailInput): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await generateVerificationEmail(input);
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Cohéro <velkommen@cohero.dk>',
          // @ts-ignore
          to: input.userEmail, // Assuming userEmail is part of VerificationEmailInput
          subject: subject,
          html: body,
        });
        return { success: true, message: 'Verification email sent.' };
      } catch (error) {
        console.error('Failed to send verification email:', error);
        return { success: false, message: 'Failed to send verification email.' };
      }
}

export const getConsensusAnalysisAction = getConsensusAnalysis;
export const getSocraticReflectionAction = getSocraticReflection;

export async function explainConceptAction(input: { concept: string }): Promise<Types.ExplainConceptOutput> {
    // Concept explainer now focuses only on non-legal social work concepts.
    return explainConcept({ ...input });
}

export const explainConceptWithAnalogyAction = explainConceptWithAnalogy;
export const getCaseConsequenceAction = getCaseConsequence;

export async function generateQuizAction(input: { topic: string, numQuestions: number, lawId?: string, contextText?: string }): Promise<Types.QuizGeneratorOutput> {
    let lawContext = '';
    if (input.lawId) {
        // This helper fetches both the main law and all its associated guidelines
        // including their XML URLs as text in the prompt.
        lawContext = await getSpecificLawAndGuidelinesContext(input.lawId);
    }
    
    return generateQuiz({ 
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

export const getFagligtMyceliumAction = getFagligtMycelium;
export const analyzeReformPdfAction = analyzeReformPdf;
export const seminarArchitectAction = seminarArchitect;
export const generateSemesterPlanAction = generateSemesterPlan;
export const suggestConceptsForEventAction = suggestConceptsForEvent;
export const generateStudyScheduleAction = generateStudySchedule;
export const explainFolketingetSagAction = explainFolketingetSag;
export const oralExamAnalysisAction = oralExamAnalysis;

export async function generateJournalScenarioAction(input: { topic: string }): Promise<Types.GenerateJournalScenarioOutput> {
  const lawContext = await getRelevantLawContext(input.topic);
  return generateJournalScenario({ topic: input.topic, lawContext });
}

export const analyzeFtDocumentAction = analyzeFtDocument;
export const fetchVivePublicationsAction = fetchVivePublicationsFlow;
export const textToSpeechAction = textToSpeech;
export const getViveReportQaAction = getViveReportQa;
export const generateReportQuestionsAction = generateReportQuestions;

export async function analyzeStarDataAction(input: Types.AnalyzeStarDataInput): Promise<Types.AnalyzeStarDataOutput> {
    return analyzeStarData(input);
}

export const analyzeLegalDecisionAction = analyzeLegalDecision;

export async function generateCaseUpdateEmailAction(input: Types.CaseUpdateEmailInput): Promise<{ success: boolean; message: string; }> {
  try {
      const {subject, body} = await generateCaseUpdateEmail(input);
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
          from: 'Cohéro Notifikationer <info@cohero.dk>',
          to: input.userEmail,
          subject: subject,
          html: body,
      });
      return { success: true, message: "Update email sent." };
  } catch (error) {
      console.error('Failed to send case update email:', error);
      return { success: false, message: "Failed to update email." };
  }
}

export async function sendCommentNotificationEmailAction(input: {postAuthorEmail: string, postAuthorName: string, commenterName: string, postTitle: string, postId: string}): Promise<{ success: boolean; message: string; }> {
    try {
        const {subject, body} = await generateCommentNotificationEmail({ ...input, postUrl: `https://cohero.dk/opslagstavle#${input.postId}` });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@cohero.dk>',
            to: input.postAuthorEmail,
            subject: subject,
            html: body,
        });
        return { success: true, message: "Notification sent." };
    } catch (error) {
        console.error('Failed to send comment notification:', error);
        return { success: false, message: "Failed to notification." };
    }
}

export async function sendStreakReminderEmailAction(input: {userEmail: string, userName: string, streakCount: number}): Promise<{ success: boolean; message: string; }> {
    try {
        const {subject, body} = await generateStreakReminderEmail({ ...input });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Notifikationer <info@cohero.dk>',
            to: input.userEmail,
            subject: 'Hold din streak i live!',
            html: body,
        });
        return { success: true, message: "Streak reminder sent." };
    } catch (error) {
        console.error('Failed to send streak reminder:', error);
        return { success: false, message: "Failed to send streak reminder." };
    }
}

export async function sendGroupInvitationEmailAction(input: { recipientEmail: string, inviteeName: string, inviterName: string, groupName: string, groupUrl: string }): Promise<{ success: boolean; message: string; }> {
    try {
        const { subject, body } = await generateGroupInvitationEmail({
            inviteeName: input.inviteeName,
            inviterName: input.inviterName,
            groupName: input.groupName,
            groupUrl: input.groupUrl
        });
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'Cohéro Studiegrupper <info@cohero.dk>',
            to: input.recipientEmail,
            subject: subject,
            html: body,
        });
        return { success: true, message: "Invitation sent." };
    } catch (error) {
        console.error('Failed to send group invitation email:', error);
        return { success: false, message: "Failed to send invitation." };
    }
}

export async function sendBulkEmailAction(input: { recipientEmails: string[], subject: string, htmlBody: string }): Promise<{ success: boolean; message: string; sentCount: number }> {
    const { recipientEmails, subject, htmlBody } = input;
    
    if (!recipientEmails || recipientEmails.length === 0) {
        return { success: false, message: 'Ingen modtagere angivet.', sentCount: 0 };
    }

    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const { data, error } = await resend.batch.send(
             recipientEmails.map(email => ({
                from: 'Cohéro Platform <info@platform.cohero.dk>',
                to: email,
                subject: subject,
                html: htmlBody,
            }))
        );

        if (error) {
            console.error('Resend batch error:', error);
            throw new Error(error.message);
        }

        const successfulSends = data?.filter(d => d.id !== null) || [];

        return { success: true, message: `E-mails sendt.`, sentCount: successfulSends.length };

    } catch (error: any) {
        console.error('Failed to send bulk email:', error);
        return { success: false, message: error.message || 'Ukendt fejl ved afsendelse.', sentCount: 0 };
    }
}

export const processStudyRegulationAction = processStudyRegulation;

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

        return processStudyRegulation({
            pdfBase64: base64,
            pdfText: pdfText,
            institution: 'Indlæst fra Arkiv'
        });
    } catch (e) {
        console.error("Failed to process internal doc:", e);
        throw e;
    }
}

export const extractTasksFromTextAction = extractTasksFromText;
export const analyzeTaskScheduleAction = analyzeTaskSchedule;

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

export async function fetchStarTableDataAction(tableId: string, filters: Record<string, string[]>): Promise<any> {
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
    const url = `${STAR_BASE_URL}/data/${tableId}/json?${queryString}`;
    
    // Log the constructed URL for debugging as requested by user
    console.log("STAR Data Fetch URL (Server):", url);

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
export async function createCheckoutSession(params: { priceId: string, userId: string, userEmail?: string, userName?: string, stripeCustomerId?: string | null, originPath?: string }): Promise<{ sessionId: string, stripeCustomerId: string }> {
    if (!isStripeConfigured) {
        throw new Error('Betalingssystemet er ikke konfigureret korrekt på serveren (mangler API-nøgle).');
    }

    const { priceId, userId, userEmail, userName, stripeCustomerId, originPath } = params;
    
    const headersList = headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    
    const success_url = `${origin}/portal?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${origin}${originPath || '/upgrade'}`;

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
                trial_period_days: 7,
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
        const membershipLevel = price.nickname || 'Kollega+';
        
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
              const { subject, body } = await generateSubscriptionConfirmationEmail({
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
    const membershipLevel = price.nickname || 'Kollega+';

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

export async function sendEmailToConsultant(subject: string, message: string, userName: string, userEmail: string): Promise<{ success: boolean; message: string; }> {
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Cohéro Spørgsmål <info@cohero.dk>',
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

export async function fetchFolketingetSager(params: {searchTerm?: string, typeId?: number | null, statusId?: number | null, followedIds?: number[] | null, skip?: number, top?: number}): Promise<any[]> {
    const { searchTerm, typeId, statusId, followedIds, skip = 0, top = 10 } = params;
    
    if (params.followedIds && (!followedIds || followedIds.length === 0)) {
        return [];
    }
    
    let filters = [];
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

export const recommendTaskAssigneeAction = recommendTaskAssignee;

export async function queueNotificationAction(input: { title: string, body: string, recipientUids: string[], sentBy: string, targetGroup: string }) {
    try {
        await adminFirestore.collection('notifications_queue').add({
            ...input,
            createdAt: FieldValue.serverTimestamp(),
            status: 'pending'
        });
        return { success: true };
    } catch (error: any) {
        console.error("Failed to queue notification:", error);
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
