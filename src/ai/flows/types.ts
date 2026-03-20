import { z } from 'zod';

// ==========================================
// SHARED & BASE SCHEMAS
// ==========================================

// Schema for book data used in prompts
export const BookSchemaForPrompt = z.object({
  title: z.string(),
  author: z.string(),
  year: z.string().optional(),
  RAG: z.string().optional().describe('Relevant content excerpts, keywords, and topics from the book for retrieval-augmented generation.'),
});

// Shared usage stats
export const UsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
});

// ==========================================
// FEEDBACK & REVISION SCHEMAS
// ==========================================

export const PersonaFeedbackSchema = z.object({
  name: z.string(),
  feedback: z.string(),
  score: z.number().min(1).max(10),
});

export const FeedbackDataSchema = z.object({
  juridisk: PersonaFeedbackSchema,
  erfaren: PersonaFeedbackSchema,
  travl: PersonaFeedbackSchema,
});

export const CaseFeedbackInputSchema = z.object({
  topic: z.string(),
  scenario: z.string(),
  initialObservation: z.string(),
  assessment: z.string(),
  goals: z.string(),
  actionPlan: z.string(),
  lawContext: z.string(),
});

export const CaseFeedbackOutputSchema = z.object({
  data: FeedbackDataSchema,
  usage: UsageSchema,
});

export const JournalFeedbackInputSchema = z.object({
  topic: z.string(),
  scenario: z.string(),
  initialObservation: z.string(),
  journalEntry: z.string(),
  lawContext: z.string(),
});

export const JournalFeedbackOutputSchema = z.object({
  data: FeedbackDataSchema,
  usage: UsageSchema,
});

export const RevisedJournalEntryDataSchema = z.object({
  revisedJournalEntry: z.string(),
});

export const ReviseJournalEntryInputSchema = z.object({
  journalEntry: z.string(),
  feedback: FeedbackDataSchema,
});

export const ReviseJournalEntryOutputSchema = z.object({
  data: RevisedJournalEntryDataSchema,
  usage: UsageSchema,
});

export const RevisedCaseDataSchema = z.object({
  revisedCaseText: z.string(),
});

export const ReviseCaseInputSchema = z.object({
  scenario: z.string(),
  assessment: z.string(),
  goals: z.string(),
  actionPlan: z.string(),
  feedback: FeedbackDataSchema,
});

export const ReviseCaseOutputSchema = z.object({
  data: RevisedCaseDataSchema,
  usage: UsageSchema,
});

// ==========================================
// EXAM & STUDY SCHEMAS
// ==========================================

export const ExamArchitectInputSchema = z.object({
    assignmentType: z.string(),
    semester: z.string(),
    topic: z.string(),
    problemStatement: z.string(),
    lawContext: z.string().optional(),
    seminarContext: z.string().optional(),
});

export const PromptInputSchema = z.object({
    assignmentType: z.string(),
    semester: z.string(),
    topic: z.string(),
    problemStatement: z.string(),
    lawContext: z.string().optional(),
    seminarContext: z.string().optional(),
    books: z.array(BookSchemaForPrompt).optional(),
});

export const ExamBlueprintSchema = z.object({
    title: z.string(),
    draftProblemStatement: z.string(),
    problemStatementTip: z.string(),
    redThreadAdvice: z.string(),
    sections: z.array(z.object({
        title: z.string(),
        weight: z.string(),
        focus: z.string(),
        theoryLink: z.string().optional(),
    })),
    suggestedTheories: z.array(z.object({
        name: z.string(),
        why: z.string(),
        bookReference: z.string().optional(),
    })),
});

export const ExamArchitectOutputSchema = z.object({
    data: ExamBlueprintSchema,
    usage: UsageSchema,
});

export const TaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedToName: z.string().optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
});

export const AvailabilitySlotSchema = z.object({
  mode: z.enum(['physical', 'online', 'unavailable']).nullable(),
  timeframe: z.string().optional(),
});

export const MemberAvailabilitySchema = z.object({
  id: z.string(),
  username: z.string(),
  slots: z.record(z.string(), AvailabilitySlotSchema),
});

export const RecommendTaskAssigneeInputSchema = z.object({
  taskTitle: z.string(),
  taskDescription: z.string().optional(),
  members: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
  })),
  existingTasks: z.array(TaskSchema),
  availabilities: z.array(MemberAvailabilitySchema).optional(),
});

export const RecommendTaskAssigneeOutputSchema = z.object({
  recommendedMemberId: z.string().nullable(),
  rationale: z.string(),
});

export const AnalyzeTaskScheduleInputSchema = z.object({
  tasks: z.array(TaskSchema).describe("The list of tasks for the project."),
  availabilities: z.array(MemberAvailabilitySchema).optional().describe("The availability of group members."),
});

export const SuggestionSchema = z.object({
  suggestion: z.string().describe("A specific, actionable suggestion for optimizing the schedule."),
  rationale: z.string().describe("A brief explanation of why this suggestion is being made."),
  tasksInvolved: z.array(z.string()).describe("The titles of the tasks that this suggestion pertains to."),
});

export const AnalyzeTaskScheduleOutputSchema = z.object({
  suggestions: z.array(SuggestionSchema),
});

// ==========================================
// LEGAL & REFORM SCHEMAS
// ==========================================

export const AnalyzeFtDocumentInputSchema = z.object({
  documentUrl: z.string(),
  documentTitle: z.string(),
});

export const AnalyzeFtDocumentDataSchema = z.object({
  explanation: z.string(),
});

export const AnalyzeFtDocumentOutputSchema = z.object({
  data: AnalyzeFtDocumentDataSchema,
  usage: UsageSchema,
});

export const AnalyzeLegalDecisionInputSchema = z.object({
  title: z.string(),
  fullText: z.string(),
});

export const LegalDecisionAnalysisDataSchema = z.object({
  hvadErAfgørelsen: z.string(),
  påBaggrundAfHvad: z.string(),
});

export const AnalyzeLegalDecisionOutputSchema = z.object({
  data: LegalDecisionAnalysisDataSchema,
  usage: UsageSchema,
});

export const AnalyzeParagraphInputSchema = z.object({
  lovTitel: z.string(),
  paragrafNummer: z.string(),
  paragrafTekst: z.string(),
  fuldLovtekst: z.string(),
  urlContext: z.string().optional(),
});

export const ParagraphAnalysisDataSchema = z.object({
  subjekt: z.string(),
  handling: z.string(),
  betingelser: z.string(),
});

export const AnalyzeParagraphOutputSchema = z.object({
  data: ParagraphAnalysisDataSchema,
  usage: UsageSchema,
});

export const AnalyzeReformInputSchema = z.object({
  reformText: z.string(),
  agreementText: z.string().optional(),
});

export const ReformAnalysisSchema = z.object({
  title: z.string(),
  law: z.string(),
  effectiveDate: z.string(),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  practiceImpact: z.string(),
  category: z.enum(['Børn & Unge', 'Beskæftigelse', 'Voksne & Handicap']),
});

export const AnalyzeReformOutputSchema = z.object({
  data: ReformAnalysisSchema,
  usage: UsageSchema,
});

export const SemanticLawSearchInputSchema = z.object({
  query: z.string(),
  legalContext: z.string(),
});

export const SemanticLawSearchDataSchema = z.object({
  summary: z.string(),
  relevantLaws: z.array(z.object({
    id: z.string(),
    title: z.string(),
    relevance: z.string(),
    paragraphs: z.array(z.string()),
  })),
});

export const SemanticLawSearchOutputSchema = z.object({
  data: SemanticLawSearchDataSchema,
  usage: UsageSchema,
});

export const ExplainFTSagInputSchema = z.object({
  caseTitle: z.string(),
  caseResume: z.string().optional(),
});

export const ExplainFTSagDataSchema = z.object({
  explanation: z.string(),
});

export const ExplainFTSagOutputSchema = z.object({
  data: ExplainFTSagDataSchema,
  usage: UsageSchema,
});

// ==========================================
// EMAIL SCHEMAS
// ==========================================

export const GroupInvitationEmailInputSchema = z.object({
  inviteeName: z.string().describe("The name of the user being invited."),
  inviterName: z.string().describe("The name of the user who is sending the invitation."),
  groupName: z.string().describe("The name of the study group."),
  groupUrl: z.string().url().describe("The URL to the study group's page."),
});

export const GroupInvitationEmailOutputSchema = z.object({
  subject: z.string().describe("The subject line of the invitation email."),
  body: z.string().describe("The body of the invitation email in HTML format."),
});

// ==========================================
// RESEARCH & DATA SCHEMAS
// ==========================================

export const VivePublicationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  url: z.string(),
  publicationDate: z.string(),
  apa: z.string().optional(),
});

export const FetchVivePublicationsInputSchema = z.object({
  searchTerm: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  areaId: z.string().optional(),
});

export const FetchVivePublicationsOutputSchema = z.object({
  publications: z.array(VivePublicationSchema),
});

export const ViveReportQaInputSchema = z.object({
  reportText: z.string(),
  question: z.string(),
});

export const ViveReportQaDataSchema = z.object({
  answer: z.string(),
  pageReferences: z.array(z.string()).optional(),
});

export const ViveReportQaOutputSchema = z.object({
  data: ViveReportQaDataSchema,
  usage: UsageSchema,
});

export const GenerateReportQuestionsInputSchema = z.object({
  reportText: z.string(),
});

export const ReportQuestionsDataSchema = z.object({
  suggestions: z.array(z.string()),
});

export const GenerateReportQuestionsOutputSchema = z.object({
  data: ReportQuestionsDataSchema,
  usage: UsageSchema,
});

export const AnalyzeStarDataInputSchema = z.object({
  tableTitle: z.string(),
  variables: z.array(z.object({ name: z.string(), label: z.string() })),
  statsSummary: z.string(),
  dataSample: z.string(),
});

export const AnalyzeStarDataDataSchema = z.object({
  analysis: z.string(),
  academicUsage: z.string(),
  socraticQuestions: z.array(z.string()),
});

export const AnalyzeStarDataOutputSchema = z.object({
  data: AnalyzeStarDataDataSchema,
  usage: UsageSchema,
});

// ==========================================
// OTHER FLOW SCHEMAS
// ==========================================

export const ExplanationSchema = z.object({
  definition: z.string(),
  relevance: z.string(),
  example: z.string(),
  suggestedLiterature: z.array(z.object({
    title: z.string(),
    author: z.string(),
    relevance: z.string().optional(),
    chapters: z.array(z.string()).optional(),
  })).optional(),
  relevantTheorists: z.array(z.object({
    name: z.string(),
    era: z.string().optional(),
    contribution: z.string(),
    source: z.object({
      bookTitle: z.string(),
      chapter: z.string().optional(),
    }).optional(),
  })).optional(),
});

export const ExplainConceptInputSchema = z.object({
  concept: z.string(),
});

export const ExplainConceptOutputSchema = z.object({
  data: ExplanationSchema,
  usage: UsageSchema,
});

export const SocraticInputSchema = z.object({
  history: z.array(z.object({ role: z.enum(['user', 'model']), content: z.string() })),
  books: z.array(z.any()).optional(),
  ethicsContext: z.string().optional(),
});

export const SocraticDataSchema = z.object({
  questions: z.array(z.string()),
  terminology: z.array(z.object({
    term: z.string(),
    description: z.string(),
    source: z.object({
      bookTitle: z.string(),
      chapter: z.string().optional(),
    }).optional(),
  })),
});

export const SocraticOutputSchema = z.object({
  data: SocraticDataSchema,
  usage: UsageSchema,
});

export const PracticeGuideSchema = z.object({
  title: z.string(),
  connections: z.array(z.object({
    sourceText: z.string(),
    concept: z.string(),
    explanation: z.string(),
    bookReference: z.string().optional(),
  })),
  reflectionQuestions: z.array(z.string()),
});

export const FagligtMyceliumInputSchema = z.object({
  userText: z.string(),
  books: z.array(z.any()).optional(),
  lawContext: z.string().optional(),
  ethicsContext: z.string().optional(),
});

export const FagligtMyceliumOutputSchema = z.object({
  data: PracticeGuideSchema,
  usage: UsageSchema,
});

export const QuizGeneratorInputSchema = z.object({
  topic: z.string(),
  numQuestions: z.number(),
  lawContext: z.string().optional(),
  contextText: z.string().optional(),
});

export const QuizDataSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctOptionIndex: z.number().min(0).max(3),
    explanation: z.string(),
  })),
});

export const QuizGeneratorOutputSchema = z.object({
  data: QuizDataSchema,
  usage: UsageSchema,
});

export const RecommendTechniqueInputSchema = z.object({
  challenge: z.string(),
  techniques: z.array(z.object({ id: z.string(), title: z.string(), content: z.string() })),
});

export const RecommendTechniqueDataSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    quote: z.string(),
  })),
});

export const RecommendTechniqueOutputSchema = z.object({
  data: RecommendTechniqueDataSchema,
  usage: UsageSchema,
});

export const SeminarAnalysisSchema = z.object({
  overallTitle: z.string(),
  semester: z.string(),
  slides: z.array(z.object({
    slideNumber: z.number(),
    slideTitle: z.string(),
    summary: z.string(),
    keyConcepts: z.array(z.object({
      term: z.string(),
      context: z.string().optional(),
      source: z.string().optional(),
    })).optional().default([]),
    legalFrameworks: z.array(z.object({
      law: z.string(),
      paragraphs: z.array(z.string()),
      relevance: z.string(),
    })).optional().default([]),
    practicalTools: z.array(z.object({
      tool: z.string(),
      description: z.string(),
    })).optional().default([]),
  })),
});

export const SeminarArchitectInputSchema = z.object({
  slideText: z.string(),
  semester: z.string(),
});

export const SeminarArchitectOutputSchema = z.object({
  data: SeminarAnalysisSchema,
  usage: UsageSchema,
});

export const SemesterPlanSchema = z.object({
  title: z.string(),
  semesterInfo: z.string(),
  mainSubjects: z.array(z.string()),
  studyTips: z.string(),
  keyDates: z.object({
    examPeriods: z.array(z.any()),
    projectDeadlines: z.array(z.any()),
    holidays: z.array(z.any()),
  }),
  weeklyBreakdown: z.array(z.object({
    weekNumber: z.number(),
    events: z.array(z.any()),
  })),
});

export const SemesterPlannerInputSchema = z.object({
  icalUrl: z.string(),
});

export const SemesterPlannerOutputSchema = z.object({
  data: SemesterPlanSchema,
  usage: UsageSchema,
});

export const StudyScheduleSchema = z.object({
  title: z.string(),
  schedule: z.array(z.object({
    weekNumber: z.number(),
    totalScheduledHours: z.number(),
    selfStudyHours: z.number(),
    focusAreas: z.array(z.string()),
    recommendedBlocks: z.array(z.object({
      day: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      activity: z.string(),
      description: z.string(),
      category: z.enum(['preparation', 'reading', 'assignment', 'break', 'reflection']),
    })),
  })),
});

export const GenerateStudyScheduleOutputSchema = z.object({
  data: StudyScheduleSchema,
  usage: UsageSchema,
});

export const SuggestConceptsForEventInputSchema = z.object({
  summary: z.string(),
  description: z.string(),
});

export const SuggestConceptsForEventDataSchema = z.object({
  concepts: z.array(z.string()),
});

export const SuggestConceptsForEventOutputSchema = z.object({
  data: SuggestConceptsForEventDataSchema,
  usage: UsageSchema,
});

export const OralExamAnalysisInputSchema = z.object({
  examType: z.string(),
  presentationText: z.string(),
  ethicsContext: z.string().optional(),
  lawContext: z.string().optional(),
});

export const OralExamAnalysisDataSchema = z.object({
  terminologyAnalysis: z.array(z.object({
    term: z.string(),
    feedback: z.string(),
    suggestion: z.string(),
  })),
  logicalBridgeAnalysis: z.array(z.object({
    point: z.string(),
    connectionToNext: z.string(),
    status: z.enum(['strong', 'weak']),
  })),
  tempoAnalysis: z.array(z.object({
    observation: z.string(),
    suggestion: z.string(),
  })),
  socraticQuestions: z.array(z.string()),
});

export const OralExamAnalysisOutputSchema = z.object({
  data: OralExamAnalysisDataSchema,
  usage: UsageSchema,
});

// ==========================================
// EXPORT TYPES
// ==========================================

export type ExamArchitectInput = z.infer<typeof ExamArchitectInputSchema>;
export type ExamArchitectOutput = z.infer<typeof ExamArchitectOutputSchema>;
export type AnalyzeTaskScheduleInput = z.infer<typeof AnalyzeTaskScheduleInputSchema>;
export type AnalyzeTaskScheduleOutput = z.infer<typeof AnalyzeTaskScheduleOutputSchema>;
export type CaseFeedbackInput = z.infer<typeof CaseFeedbackInputSchema>;
export type CaseFeedbackOutput = z.infer<typeof CaseFeedbackOutputSchema>;
export type JournalFeedbackInput = z.infer<typeof JournalFeedbackInputSchema>;
export type JournalFeedbackOutput = z.infer<typeof JournalFeedbackOutputSchema>;
export type AnalyzeFtDocumentInput = z.infer<typeof AnalyzeFtDocumentInputSchema>;
export type AnalyzeFtDocumentOutput = z.infer<typeof AnalyzeFtDocumentOutputSchema>;
export type AnalyzeLegalDecisionInput = z.infer<typeof AnalyzeLegalDecisionInputSchema>;
export type AnalyzeLegalDecisionOutput = z.infer<typeof AnalyzeLegalDecisionOutputSchema>;
export type AnalyzeParagraphInput = z.infer<typeof AnalyzeParagraphInputSchema>;
export type AnalyzeParagraphOutput = z.infer<typeof AnalyzeParagraphOutputSchema>;
export type AnalyzeReformInput = z.infer<typeof AnalyzeReformInputSchema>;
export type AnalyzeReformOutput = z.infer<typeof AnalyzeReformOutputSchema>;
export type AnalyzeStarDataInput = z.infer<typeof AnalyzeStarDataInputSchema>;
export type AnalyzeStarDataOutput = z.infer<typeof AnalyzeStarDataOutputSchema>;
export type ExplainConceptInput = z.infer<typeof ExplainConceptInputSchema>;
export type ExplainConceptOutput = z.infer<typeof ExplainConceptOutputSchema>;
export type ExplainFTSagInput = z.infer<typeof ExplainFTSagInputSchema>;
export type ExplainFTSagOutput = z.infer<typeof ExplainFTSagOutputSchema>;
export type FagligtMyceliumInput = z.infer<typeof FagligtMyceliumInputSchema>;
export type FagligtMyceliumOutput = z.infer<typeof FagligtMyceliumOutputSchema>;
export type QuizGeneratorInput = z.infer<typeof QuizGeneratorInputSchema>;
export type QuizGeneratorOutput = z.infer<typeof QuizGeneratorOutputSchema>;
export type RecommendTechniqueInput = z.infer<typeof RecommendTechniqueInputSchema>;
export type RecommendTechniqueOutput = z.infer<typeof RecommendTechniqueOutputSchema>;
export type ReviseCaseInput = z.infer<typeof ReviseCaseInputSchema>;
export type ReviseCaseOutput = z.infer<typeof ReviseCaseOutputSchema>;
export type ReviseJournalEntryInput = z.infer<typeof ReviseJournalEntryInputSchema>;
export type ReviseJournalEntryOutput = z.infer<typeof ReviseJournalEntryOutputSchema>;
export type SeminarArchitectInput = z.infer<typeof SeminarArchitectInputSchema>;
export type SeminarArchitectOutput = z.infer<typeof SeminarArchitectOutputSchema>;
export type SemesterPlannerInput = z.infer<typeof SemesterPlannerInputSchema>;
export type SemesterPlannerOutput = z.infer<typeof SemesterPlannerOutputSchema>;
export type SuggestConceptsForEventInput = z.infer<typeof SuggestConceptsForEventInputSchema>;
export type SuggestConceptsForEventOutput = z.infer<typeof SuggestConceptsForEventOutputSchema>;
export type FetchVivePublicationsInput = z.infer<typeof FetchVivePublicationsInputSchema>;
export type FetchVivePublicationsOutput = z.infer<typeof FetchVivePublicationsOutputSchema>;
export type ViveReportQaInput = z.infer<typeof ViveReportQaInputSchema>;
export type ViveReportQaOutput = z.infer<typeof ViveReportQaOutputSchema>;
export type GenerateReportQuestionsInput = z.infer<typeof GenerateReportQuestionsInputSchema>;
export type GenerateReportQuestionsOutput = z.infer<typeof GenerateReportQuestionsOutputSchema>;
export type GenerateStudyScheduleInput = z.infer<typeof GenerateStudyScheduleInputSchema>;
export type GenerateStudyScheduleOutput = z.infer<typeof GenerateStudyScheduleOutputSchema>;
export type OralExamAnalysisInput = z.infer<typeof OralExamAnalysisInputSchema>;
export type OralExamAnalysisOutput = z.infer<typeof OralExamAnalysisOutputSchema>;
export type GroupInvitationEmailInput = z.infer<typeof GroupInvitationEmailInputSchema>;
export type GroupInvitationEmailOutput = z.infer<typeof GroupInvitationEmailOutputSchema>;
export type RecommendTaskAssigneeInput = z.infer<typeof RecommendTaskAssigneeInputSchema>;
export type RecommendTaskAssigneeOutput = z.infer<typeof RecommendTaskAssigneeOutputSchema>;
