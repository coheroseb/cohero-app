
'use server';
/**
 * @fileOverview An AI-augmented flow to parse an iCal feed and create a structured semester overview.
 * - generateSemesterPlan - The main function that orchestrates the process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  SemesterPlannerInputSchema,
  SemesterPlanSchema,
  SemesterPlannerOutputSchema,
  type SemesterPlannerInput,
  type SemesterPlannerOutput,
  type SemesterPlan
} from './types';

// Helper to get week number
function getWeekNumber(d: Date): number {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

// Function to parse iCal date-time string
function parseIcalDateTime(dateTimeStr: string): Date {
    const isUtc = dateTimeStr.endsWith('Z');
    const isoStr = dateTimeStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2}).*/, '$1-$2-$3T$4:$5:$6');
    return new Date(isUtc ? `${isoStr}Z` : isoStr);
}

function parseIcalDate(dateStr: string): Date {
    const isoStr = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const [year, month, day] = isoStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Set to midday UTC to avoid timezone shifts
}

function parseDescription(description: string): { [key: string]: string } {
    const lines = description.replace(/\\n/g, '\n').split('\n');
    const details: { [key: string]: string } = {};
    const keyMapping: { [key: string]: string } = {
        'Sted:': 'location',
        'Aktivitetstype:': 'activityType',
        'Underviser:': 'teacher',
        'Reservationstekst:': 'reservationText',
        'Seneste ændring Timeedit:': 'lastTimeEdit',
        'Seneste ændring Study:': 'lastStudyEdit'
    };
    lines.forEach(line => {
        for (const key in keyMapping) {
            if (line.startsWith(key)) {
                details[keyMapping[key]] = line.substring(key.length).trim();
            }
        }
    });
    return details;
}


// Main parsing function (deterministic)
function parseIcal(icalContent: string): Omit<SemesterPlan, 'title' | 'mainSubjects' | 'studyTips' | 'semesterInfo'> & { allSummaries: string[] } {
    const events = [];
    const eventBlocks = icalContent.split('BEGIN:VEVENT');
    eventBlocks.shift(); // Remove the part before the first event

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const block of eventBlocks) {
        const lines = block.split('\n');
        const event: any = {};
        let currentField = '';
        let currentValue = '';

        lines.forEach(line => {
            if (line.includes(':')) {
                if (currentField) {
                    event[currentField] = currentValue.trim();
                }
                const [field, ...valueParts] = line.split(':');
                currentField = field.split(';')[0].trim(); // Handle params like DTSTART;VALUE=DATE
                currentValue = valueParts.join(':');
            } else {
                currentValue += line.trim();
            }
        });
        if (currentField) {
            event[currentField] = currentValue.trim();
        }
        
        if (event.DTSTART) {
            const isDateOnly = event.DTSTART.includes('VALUE=DATE');
            const startDate = isDateOnly ? parseIcalDate(event.DTSTART.split(':')[1]) : parseIcalDateTime(event.DTSTART);
            const endDate = event.DTEND ? (isDateOnly ? parseIcalDate(event.DTEND.split(':')[1]) : parseIcalDateTime(event.DTEND)) : startDate;

            if (!minDate || startDate < minDate) {
                minDate = startDate;
            }
            if (!maxDate || endDate > maxDate) {
                maxDate = endDate;
            }
            
            const descriptionDetails = event.DESCRIPTION ? parseDescription(event.DESCRIPTION) : {};
            
            events.push({
                summary: event.SUMMARY || '',
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                isMultiDay: startDate.toDateString() !== endDate.toDateString(),
                startTime: isDateOnly ? undefined : startDate.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }),
                endTime: isDateOnly ? undefined : endDate.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Copenhagen' }),
                location: event.LOCATION || descriptionDetails.location || '',
                description: event.DESCRIPTION?.replace(/\\n/g, '\n') || '',
                ...descriptionDetails,
            });
        }
    }

    const weeklyBreakdown: SemesterPlan['weeklyBreakdown'] = [];
    const keyDates: SemesterPlan['keyDates'] = { examPeriods: [], projectDeadlines: [], holidays: [] };
    const allSummaries: string[] = [];

    if (minDate && maxDate) {
        const startWeek = getWeekNumber(minDate);
        const endWeek = getWeekNumber(maxDate);

        // Group events by week first for efficiency
        const weekMap: { [week: number]: any[] } = {};
        events.forEach(event => {
            const week = getWeekNumber(new Date(event.startDate));
            if (!weekMap[week]) weekMap[week] = [];
            weekMap[week].push(event);

            // Also populate allSummaries and keyDates here
            if(!allSummaries.includes(event.summary)){
                 allSummaries.push(event.summary);
            }
            const summaryLower = event.summary.toLowerCase();
            const eventExists = (arr: any[], ev: any) => arr.some(e => e.summary === ev.summary && e.startDate === ev.startDate);

            if (summaryLower.includes('eksamen') || summaryLower.includes('prøve') || summaryLower.includes('re-eksamen')) {
                if (!eventExists(keyDates.examPeriods, event)) keyDates.examPeriods.push(event);
            } else if (summaryLower.includes('aflevering') || summaryLower.includes('deadline') || summaryLower.includes('opgave')) {
                if (!eventExists(keyDates.projectDeadlines, event)) keyDates.projectDeadlines.push(event);
            } else if (summaryLower.includes('ferie') || summaryLower.includes('helligdag') || summaryLower.includes('påske') || summaryLower.includes('pinse') || summaryLower.includes('fridag')) {
                if (!eventExists(keyDates.holidays, event)) keyDates.holidays.push(event);
            }
        });

        // Now build the full weekly breakdown from start to end week
        for (let weekNum = startWeek; weekNum <= endWeek; weekNum++) {
            const weekEvents = weekMap[weekNum] || [];
            weeklyBreakdown.push({
                weekNumber: weekNum,
                events: weekEvents.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            });
        }
    }
    
    // Sort key dates
    keyDates.examPeriods.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    keyDates.projectDeadlines.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    keyDates.holidays.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return { weeklyBreakdown, keyDates, allSummaries };
}


// Simplified AI Prompt for analysis only
const AnalysisInputSchema = z.object({
  summaries: z.array(z.string()).describe("A list of all event titles for the semester."),
});

const AnalysisOutputSchema = z.object({
  title: z.string().describe("A descriptive title for the semester plan, e.g., 'Semesterplan for Forårssemester 2025'."),
  semesterInfo: z.string().describe("Information about the current semester extracted from the calendar, e.g., 'Forårssemester 2025'"),
  mainSubjects: z.array(z.string()).describe("A list of the main subjects or themes identified from the calendar events."),
  studyTips: z.string().describe("A short paragraph with 2-3 concrete study tips based on the calendar's structure, like busy periods or overlapping deadlines."),
});

const analysisPrompt = ai.definePrompt({
  name: 'semesterAnalysisPrompt',
  input: { schema: AnalysisInputSchema },
  output: { schema: AnalysisOutputSchema },
  prompt: `You are an expert academic advisor for Danish university students. I will provide a list of all calendar event titles for a semester.

Your tasks, based *only* on this list of titles, are to:
1.  **Determine Semester Info**: Analyze the titles to determine the semester (e.g., "3. Semester", "Efterår 2024").
2.  **Create Title**: Create a clear title like "Semesterplan for [The Semester Info you extracted]". If you can't find semester info, use a generic title like "Dit Semesteroverblik".
3.  **Identify Main Subjects**: Identify and list 3-5 recurring main subjects or themes (e.g., "Socialret", "Psykologi", "Videnskabsteori").
4.  **Generate Study Tips**: Based on the distribution of events (especially those with "eksamen", "aflevering", "deadline"), write a short paragraph with 2-3 concrete study tips. Point out busy periods or suggest when to start preparing.

Your entire response must be a single JSON object. All text must be in Danish.

**Event Titles:**
---
{{#each summaries}}
- {{{this}}}
{{/each}}
---
`,
   config: {
    temperature: 0.2, // Be more deterministic
  },
});


export async function generateSemesterPlan(input: SemesterPlannerInput): Promise<SemesterPlannerOutput> {
  return semesterPlannerFlow(input);
}


const semesterPlannerFlow = ai.defineFlow(
  {
    name: 'semesterPlannerFlow',
    inputSchema: SemesterPlannerInputSchema,
    outputSchema: SemesterPlannerOutputSchema,
  },
  async (input) => {
    const urlToFetch = input.icalUrl.replace(/^webcal:\/\//i, 'https://');
    const response = await fetch(urlToFetch);
    if (!response.ok) {
        throw new Error('Kunne ikke hente kalenderdata fra den angivne URL.');
    }
    const icalContent = await response.text();

    // 1. Deterministic parsing in code
    const { weeklyBreakdown, keyDates, allSummaries } = parseIcal(icalContent);

    // 2. Focused AI analysis
    const { output: analysis, usage } = await analysisPrompt({ summaries: allSummaries });
    
    // 3. Combine results
    const finalPlan: SemesterPlan = {
      title: analysis!.title,
      semesterInfo: analysis!.semesterInfo,
      mainSubjects: analysis!.mainSubjects,
      studyTips: analysis!.studyTips,
      keyDates,
      weeklyBreakdown,
    };

    return {
      data: finalPlan,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);

    