

/**
 * @fileOverview An AI flow to generate a recommended study schedule based on a semester plan.
 * - generateStudySchedule - Creates a weekly study plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { 
    GenerateStudyScheduleInputSchema, 
    StudyScheduleSchema, 
    GenerateStudyScheduleOutputSchema, 
    type GenerateStudyScheduleInput, 
    type GenerateStudyScheduleOutput 
} from './types';

// Schemas for the prompt's input structure
const DailyScheduleSchema = z.object({
    dayName: z.string(),
    totalScheduledHours: z.number(),
    scheduledTimeSlots: z.array(z.string()).describe("A list of occupied time slots, e.g., ['09:00-12:00', '14:00-16:00']."),
});

const WeeklySummarySchemaForPrompt = z.object({
  weekNumber: z.number(),
  dailySchedules: z.array(DailyScheduleSchema),
  keyEvents: z.array(z.string()).describe("A list of summaries for important events this week, like exams or deadlines.")
});


const AvailabilityConstraintSchema = z.object({
  unavailable: z.boolean().default(false),
  after: z.string().optional(),
});

const PromptInputSchema = z.object({
  title: z.string(),
  semesterInfo: z.string(),
  mainSubjects: z.array(z.string()),
  studyTips: z.string(),
  weeklySummaries: z.array(WeeklySummarySchemaForPrompt),
  keyDatesString: z.string(),
  totalWeeklyStudyHours: z.number(),
  availability: z.record(z.string(), AvailabilityConstraintSchema).optional(),
});


const prompt = ai.definePrompt({
  name: 'generateStudySchedulePrompt',
  input: { schema: PromptInputSchema },
  output: { schema: StudyScheduleSchema },
  prompt: `You are an expert academic planner for Danish social work students. Your task is to create a detailed, realistic, and balanced weekly study schedule based on a student's existing calendar and a target of {{{totalWeeklyStudyHours}}} study hours per week.

**Student's Semester Plan:**
- Title: {{{title}}}
- Semester Info: {{{semesterInfo}}}
- Main Subjects: {{{mainSubjects}}}
- Study Tips: {{{studyTips}}}
- Key Deadlines (Overall): {{{keyDatesString}}}

**Weekly Summaries (Scheduled Hours & Key Events):**
{{#each weeklySummaries}}
- **Uge {{{this.weekNumber}}}**:
  {{#each this.dailySchedules}}
    - **{{{this.dayName}}}**:
        - Planlagte timer: {{this.totalScheduledHours}}
        {{#if this.scheduledTimeSlots.length}}
        - Blokerede tidsrum: {{#each this.scheduledTimeSlots}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
        {{/if}}
  {{/each}}
  {{#if this.keyEvents.length}}
  - Vigtige begivenheder denne uge: {{#each this.keyEvents}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/if}}
{{/each}}

{{#if availability}}
**User's Availability Constraints:**
{{#each availability}}
- **{{@key}}**: {{#if this.unavailable}}Utilgængelig{{else}}{{#if this.after}}Kun tilgængelig efter kl. {{this.after}}{{else}}Hele dagen{{/if}}{{/if}}
{{/each}}
---
{{/if}}

**Instructions:**
For each week in the 'weeklySummaries':
1.  **Calculate Self-Study Hours**: For each day, calculate the time needed for self-study to reach a weekly total of {{{totalWeeklyStudyHours}}} hours, considering the already scheduled hours.
2.  **Identify Focus Areas**: Based on the week's events and upcoming deadlines, determine the most important subjects to focus on.
3.  **Create Study Blocks**: Distribute the self-study hours into concrete, actionable study blocks.
    - **CRITICAL:** The study blocks you create for self-study **MUST NOT** overlap with the existing 'Blokerede tidsrum' for each day. Furthermore, you MUST respect the user's availability constraints. Do not schedule anything on days marked 'Utilgængelig' or before the specified time on other days.
    - **IMPORTANT:** Only create blocks for self-study activities like 'preparation', 'reading', 'assignment', 'reflection', and 'break'. DO NOT include blocks for the already scheduled sessions from the user's calendar (e.g., "Forelæsning", "Gruppevejledning").
    - Each block must have a start and end time.
    - Each block needs a generic task related to a subject (e.g., "Forberedelse til Socialret", "Læsning til Psykologi", "Opgaveskrivning"). **Do NOT suggest specific chapters, page numbers, or book titles.** The activity should be a high-level task.
    - Categorize each block ('preparation', 'reading', 'assignment', 'break', 'reflection').
    - **Crucially, include blocks for 'break' (pauser) and buffer time.** A realistic schedule is not packed from 8-16.
4.  **Output Structure**: For each week, create an object containing the week number, total scheduled hours, calculated self-study hours, focus areas, and the array of recommended study blocks.

The final output MUST be a single JSON object containing a title for the schedule and an array of these weekly schedule objects. All output must be in Danish.
`,
   config: {
    temperature: 0.5,
  },
});

export async function generateStudySchedule(input: GenerateStudyScheduleInput): Promise<GenerateStudyScheduleOutput> {
    return generateStudyScheduleFlow(input);
}


const generateStudyScheduleFlow = ai.defineFlow(
  {
    name: 'generateStudyScheduleFlow',
    inputSchema: GenerateStudyScheduleInputSchema,
    outputSchema: GenerateStudyScheduleOutputSchema,
  },
  async (input) => {
    
    const fullWeeklyBreakdown = input.plan.weeklyBreakdown || [];

    const dayNames = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

    const weeklySummaries = fullWeeklyBreakdown.map(week => {
        const dailySchedulesMap: Map<string, { totalScheduledHours: number; scheduledTimeSlots: string[] }> = new Map([
            ['Mandag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
            ['Tirsdag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
            ['Onsdag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
            ['Torsdag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
            ['Fredag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
            ['Lørdag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
            ['Søndag', { totalScheduledHours: 0, scheduledTimeSlots: [] }],
        ]);
        const keyEvents: string[] = [];

        week.events.forEach((event: any) => {
            try {
                const start = new Date(event.startDate);
                const end = new Date(event.endDate);
                const durationHours = !event.isMultiDay ? (end.getTime() - start.getTime()) / (1000 * 60 * 60) : 0;
                const dayName = dayNames[start.getUTCDay()];

                const daySchedule = dailySchedulesMap.get(dayName);
                if (daySchedule) {
                    daySchedule.totalScheduledHours += durationHours;
                    if (event.startTime && event.endTime) {
                        daySchedule.scheduledTimeSlots.push(`${event.startTime}-${event.endTime}`);
                    }
                }

                const summaryLower = event.summary.toLowerCase();
                if (summaryLower.includes('eksamen') || summaryLower.includes('prøve') || summaryLower.includes('aflevering') || summaryLower.includes('deadline')) {
                    keyEvents.push(event.summary);
                }
            } catch {}
        });

        const formattedDailySchedules = Array.from(dailySchedulesMap.entries()).map(([dayName, schedule]) => ({
            dayName,
            ...schedule,
        }));

        return {
            weekNumber: week.weekNumber,
            dailySchedules: formattedDailySchedules,
            keyEvents,
        };
    });

    const formatKeyDate = (event: any) => `${event.summary} (${new Date(event.startDate).toLocaleDateString('da-DK')})`;
    
    const keyDatesForPrompt = {
        examPeriods: (input.plan.keyDates.examPeriods || []).map(formatKeyDate),
        projectDeadlines: (input.plan.keyDates.projectDeadlines || []).map(formatKeyDate),
        holidays: (input.plan.keyDates.holidays || []).map(formatKeyDate),
    };

    const keyDatesString = JSON.stringify(keyDatesForPrompt, null, 2);

    const { output, usage } = await prompt({
      title: input.plan.title,
      semesterInfo: input.plan.semesterInfo,
      mainSubjects: input.plan.mainSubjects,
      studyTips: input.plan.studyTips,
      weeklySummaries,
      keyDatesString,
      totalWeeklyStudyHours: input.totalWeeklyStudyHours,
      availability: input.availability,
    });
    
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens
      }
    };
  }
);
