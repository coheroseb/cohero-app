import { z } from 'genkit';

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
// LAW CONTENT & PARAGRAPH SCHEMAS
// ==========================================

export const ParagraphSchema = z.object({
  nummer: z.string().describe('The paragraph or point number, e.g., "§ 1" or "1."'),
  tekst: z.string().describe('The full text of the paragraph or point.'),
});

export const ChapterSchema = z.object({
  nummer: z.string().describe('The chapter number or title, e.g., "Kapitel 1" or "Indledning".'),
  titel: z.string().describe('The title of the chapter.'),
  paragraffer: z.array(ParagraphSchema).describe('An array of paragraphs within the chapter.'),
});

export const LawContentSchema = z.object({
  titel: z.string().describe('The full official title of the law.'),
  popularTitle: z.string().optional().describe('The common name or popular title of the law.'),
  uniqueDocumentId: z.string().optional().describe('The unique document ID for timeline and other API calls.'),
  kortTitel: z.string().describe('The common short name of the law.'),
  forkortelse: z.string().describe('The abbreviation for the law.'),
  lbk: z.string().describe('The law consolidation act number and date string.'),
  mainLawNumber: z.string().optional().describe('The L-number associated with the main law.'),
  mainLawDate: z.string().optional().describe('The date associated with the main law.'),
  rawText: z.string().optional().describe('The full raw text of the law.'),
  status: z.string().describe('The validity status of the document, e.g., "Valid".'),
  number: z.string().optional().describe('The official number of the document (from Number element).'),
  date: z.string().optional().describe('The signature date of the document (from DiesSigni element).'),
  kapitler: z.array(ChapterSchema).describe('An array of chapters in the law.'),
});

export interface SavedParagraph {
  id: string;
  lawId: string;
  lawTitle: string;
  lawAbbreviation: string;
  paragraphNumber: string;
  fullText: string;
  savedAt: { toDate: () => Date };
  externalUrl?: string;
  collectionId?: string;
}

export interface CollectionData {
    id: string;
    name: string;
    createdAt: { toDate: () => Date };
}

export interface LawConfig {
  id: string;
  name: string;
  abbreviation: string;
  xmlUrl: string;
  lbk: string;
}

export interface QuizResult {
    id: string;
    lawId: string;
    lawTitle: string;
    topic: string;
    score: number;
    totalQuestions: number;
    results: any[];
    createdAt: { toDate: () => Date };
}

export const PersonaFeedbackSchema = z.object({
  name: z.string(),
  feedback: z.string(),
  score: z.number().min(1).max(10),
});

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  username?: string;
  studyStarted?: string;
  institution?: string;
  isQualified?: boolean;
  profession?: string;
  semester?: string;
  membership?: string;
  stripePriceId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCurrentPeriodEnd?: string | Date;
  stripeSubscriptionStatus?: string;
  stripeCancelAtPeriodEnd?: boolean;
  badges?: string[];
  cohéroPoints?: number;
  role?: 'user' | 'admin';
  lastDailyChallengeDate?: any; // Using any or Timestamp if imported
  dailyChallengeStreak?: number;
  lastCaseTrainerUsage?: any;
  weeklyCaseTrainerCount?: number;
  dailyCaseTrainerCount?: number;
  platformRating?: number;
  lastSocraticReflectionUsage?: any;
  weeklySocraticReflectionCount?: number;
  lastJournalTrainerUsage?: any;
  dailyJournalTrainerCount?: number;
  monthlySecondOpinionCount?: number;
  lastSecondOpinionUsage?: any;
  monthlyExamArchitectCount?: number;
  lastExamArchitectUsage?: any;
  weeklySeminarArchitectCount?: number;
  lastSeminarArchitectUsage?: any;
  dailyLawPortalCount?: number;
  lastLawPortalUsage?: any;
  monthlyMyceliumCount?: number;
  lastMyceliumUsage?: any;
  weeklyQuizCreatorCount?: number;
  lastQuizCreatorUsage?: any;
  dailyConceptExplainerCount?: number;
  lastConceptExplainerUsage?: any;
  dailyStarAnalysisCount?: number;
  lastStarAnalysisUsage?: any;
  dailyOralExamCount?: number;
  lastOralExamUsage?: any;
  dailyTokenCount?: number;
  lastTokenUsage?: any;
  monthlyInputTokens?: number;
  monthlyOutputTokens?: number;
  monthlyTokenTimestamp?: any;
  isHighUsage?: boolean;
  streakReminderSentAt?: any;
  mementoLevels?: {
    theorist?: number;
    paragraph?: number;
    method?: number;
  };
  profilePicture?: string;
  fcmTokens?: string[];
  followedViveAreas?: string[];
  recentConcepts?: string[];
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorEmail: string;
  authorName: string;
  authorProfilePicture?: string;
  membership?: string;
  createdAt: any;
  likeCount: number;
  commentCount: number;
  isAnonymous: boolean;
  bookId?: string;
  bookTitle?: string;
  bookAuthor?: string;
  chapter?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  createdAt: any;
}

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
    researchStrategy: z.string().optional(),
});

export const ExamArchitectOutputSchema = z.object({
    data: ExamBlueprintSchema,
    usage: UsageSchema,
});

export const TwistBlueprintInputSchema = z.object({
  blueprintTitle: z.string(),
  currentProblemStatement: z.string(),
  twist: z.string(),
});

export const TwistBlueprintOutputSchema = z.object({
  newProblemStatement: z.string(),
  newTip: z.string(),
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

export const AvailabilityConstraintSchema = z.object({
  unavailable: z.boolean().default(false),
  after: z.string().optional(),
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

export const IdentifyReformInputSchema = z.object({
  query: z.string().describe('Brugerens spørgsmål om en reform, f.eks. "Hvad betyder kontanthjælpsreformen?"'),
});

export const ReformCandidateSchema = z.object({
  title: z.string().describe('Titlen på lovforslaget eller loven.'),
  documentId: z.string().describe('Det unikke ID hos Retsinformation (f.eks. AC000123).'),
  type: z.enum(['LF', 'LBK']).describe('LF for Lovforlag, LBK for Lovbekendtgørelse.'),
  summary: z.string().describe('En ultrakort beskrivelse af kandidatens relevans.'),
  xmlUrl: z.string().url().describe('Direkte XML-link fra Retsinformation.'),
});

export const IdentifyReformDataSchema = z.object({
  candidates: z.array(ReformCandidateSchema),
  rationale: z.string().describe('AIens begrundelse for hvorfor disse dokumenter er valgt.'),
});

export const IdentifyReformOutputSchema = z.object({
  data: IdentifyReformDataSchema,
  usage: UsageSchema,
});

export const ParagraphDiffSchema = z.object({
  headline: z.string().describe('En kort, fangende overskrift for denne ændring (f.eks. "Højere satser for unge").'),
  paragraph: z.string().describe('Paragrafnummer, f.eks. "§ 23"'),
  oldText: z.string().describe('Teksten i den nugældende lov.'),
  newText: z.string().describe('Den foreslåede tekst i reformen.'),
  changeDescription: z.string().describe('Kort forklaring af hvad ændringen rent faktisk betyder.'),
  reasoning: z.string().describe('Uddrag af bemærkningerne (henstigten bag ændringen).'),
});

export const GenerateParagraphDiffInputSchema = z.object({
  targetLawTitle: z.string().describe('Titlen på loven der ændres.'),
  oldLawXmlUrl: z.string().url().describe('URL til den gældende lov Xml.'),
  newBillXmlUrl: z.string().url().describe('URL til selve lovforslaget Xml.'),
});

export const GenerateParagraphDiffDataSchema = z.object({
  reformTitle: z.string(),
  diffs: z.array(ParagraphDiffSchema),
  overallImpact: z.string().describe('Overordnet opsummering af ændringernes betydning for praksis.'),
});

export const GenerateParagraphDiffOutputSchema = z.object({
  data: GenerateParagraphDiffDataSchema,
  usage: UsageSchema,
});

export type IdentifyReformOutput = z.infer<typeof IdentifyReformOutputSchema>;
export type IdentifyReformData = z.infer<typeof IdentifyReformDataSchema>;
export type ReformCandidate = z.infer<typeof ReformCandidateSchema>;
export type GenerateParagraphDiffOutput = z.infer<typeof GenerateParagraphDiffOutputSchema>;
export type GenerateParagraphDiffData = z.infer<typeof GenerateParagraphDiffDataSchema>;

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
  legalContext: z.object({
    lawTitle: z.string(),
    paragraphNumber: z.string(),
    exactText: z.string(),
    relevance: z.string(),
    url: z.string().optional(),
  }).optional(),
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
    intensity: z.number().optional(), // 1-10 intensity score
  })),
  deadlineClusters: z.array(z.object({
    title: z.string(),
    weeks: z.array(z.number()),
    description: z.string(),
  })).optional(),
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

export const GenerateStudyScheduleInputSchema = z.object({
    plan: SemesterPlanSchema,
    totalWeeklyStudyHours: z.number(),
    availability: z.record(z.string(), AvailabilityConstraintSchema).optional(),
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

export const ExplainLawParagraphInputSchema = z.object({
  lovTitel: z.string(),
  paragrafNummer: z.string(),
  paragrafTekst: z.string(),
  lovtekst: z.string(),
});

export const ExplainLawParagraphOutputSchema = z.object({
  data: z.object({
    kerneindhold: z.string(),
    betydningForPraksis: z.string(),
    forholdTilAndreParagraffer: z.string(),
  }),
  usage: UsageSchema,
});

export const VerificationEmailInputSchema = z.object({
  userName: z.string(),
  verificationLink: z.string().url(),
  userEmail: z.string(),
});

export const VerificationEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const CaseUpdateEmailInputSchema = z.object({
  userName: z.string(),
  caseTitle: z.string(),
  caseUrl: z.string().url(),
  userEmail: z.string(),
});

export const CaseUpdateEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const GenerateJournalScenarioInputSchema = z.object({
  topic: z.string(),
  lawContext: z.string(),
});

export const JournalScenarioDataSchema = z.object({
  title: z.string(),
  scenario: z.string(),
  initialObservation: z.string(),
});

export const GenerateJournalScenarioOutputSchema = z.object({
  data: JournalScenarioDataSchema,
  usage: UsageSchema,
});

export const ExtractApaMetadataInputSchema = z.object({
  fileName: z.string(),
  fileContent: z.string().describe("The text content extracted from the document or the first few pages."),
});

export const ApaMetadataSchema = z.object({
  authors: z.string().describe("APA formatted authors, e.g. Jensen, A., & Nielsen, B."),
  year: z.string().describe("Publication year, e.g. 2024"),
  title: z.string().describe("Title of the document"),
  source: z.string().describe("Source or publisher, e.g. Danmarks Statistik"),
  url: z.string().optional().describe("URL if found in the document"),
  doi: z.string().optional().describe("DOI if found in the document"),
  fullAPA: z.string().describe("The complete APA 7 reference string"),
});

export const ExtractApaMetadataOutputSchema = z.object({
  data: ApaMetadataSchema,
  usage: UsageSchema,
});

// ==========================================
// EXPORT TYPES
// ==========================================

export type ExamBlueprint = z.infer<typeof ExamBlueprintSchema>;
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

export const LivePortfolioFeedbackInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  assignmentGuidelines: z.string(),
  linkedEvidenceTitles: z.string()
});

export const LivePortfolioFeedbackOutputSchema = z.object({
  feedback: z.object({
    strength: z.string().describe("What they are currently doing well in this text"),
    improvement: z.string().describe("One short actionable tip to improve the text"),
    score: z.number().describe("1-10 rating of the current text quality based on assignment guidelines")
  }),
  usage: z.object({
    inputTokens: z.number(),
    outputTokens: z.number(),
  }),
});

export type LivePortfolioFeedbackInput = z.infer<typeof LivePortfolioFeedbackInputSchema>;
export type LivePortfolioFeedbackOutput = z.infer<typeof LivePortfolioFeedbackOutputSchema>;
export type ReviseJournalEntryInput = z.infer<typeof ReviseJournalEntryInputSchema>;
export type ReviseJournalEntryOutput = z.infer<typeof ReviseJournalEntryOutputSchema>;
export type SeminarArchitectInput = z.infer<typeof SeminarArchitectInputSchema>;
export type SeminarAnalysis = z.infer<typeof SeminarAnalysisSchema>;
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
export type SemesterPlan = z.infer<typeof SemesterPlanSchema>;
export type StudySchedule = z.infer<typeof StudyScheduleSchema>;
export type SemanticLawSearchInput = z.infer<typeof SemanticLawSearchInputSchema>;
export type SemanticLawSearchOutput = z.infer<typeof SemanticLawSearchOutputSchema>;

export type ExplainLawParagraphInput = z.infer<typeof ExplainLawParagraphInputSchema>;
export type ExplainLawParagraphOutput = z.infer<typeof ExplainLawParagraphOutputSchema>;
export type VerificationEmailInput = z.infer<typeof VerificationEmailInputSchema>;
export type VerificationEmailOutput = z.infer<typeof VerificationEmailOutputSchema>;
export type GenerateJournalScenarioInput = z.infer<typeof GenerateJournalScenarioInputSchema>;
export type GenerateJournalScenarioOutput = z.infer<typeof GenerateJournalScenarioOutputSchema>;
export type JournalScenarioData = z.infer<typeof JournalScenarioDataSchema>;
export type CaseUpdateEmailInput = z.infer<typeof CaseUpdateEmailInputSchema>;
export type CaseUpdateEmailOutput = z.infer<typeof CaseUpdateEmailOutputSchema>;

export const WelcomeEmailInputSchema = z.object({
  userName: z.string(),
  userEmail: z.string(),
});
export const WelcomeEmailDataSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export const WelcomeEmailOutputSchema = z.object({
  data: WelcomeEmailDataSchema,
  usage: UsageSchema,
});

export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;
export type WelcomeEmailData = z.infer<typeof WelcomeEmailDataSchema>;
export type WelcomeEmailOutput = z.infer<typeof WelcomeEmailOutputSchema>;

export type LawContentType = z.infer<typeof LawContentSchema>;
export type ParagraphAnalysisData = z.infer<typeof ParagraphAnalysisDataSchema>;
export type QuizData = z.infer<typeof QuizDataSchema>;
export type Explanation = z.infer<typeof ExplanationSchema>;
export type VivePublication = z.infer<typeof VivePublicationSchema>;
export type ViveReportQaData = z.infer<typeof ViveReportQaDataSchema>;

export type ExtractApaMetadataInput = z.infer<typeof ExtractApaMetadataInputSchema>;
export type ExtractApaMetadataOutput = z.infer<typeof ExtractApaMetadataOutputSchema>;
export type ApaMetadata = z.infer<typeof ApaMetadataSchema>;

// ==========================================
// EVIDENCE CHAT SCHEMA
// ==========================================
export const EvidenceChatInputSchema = z.object({
  documents: z.array(z.object({
    title: z.string(),
    content: z.string()
  })),
  question: z.string(),
  chatHistory: z.array(z.object({
    role: z.string(),
    content: z.string()
  })).optional(),
});

export const EvidenceChatDataSchema = z.object({
  answer: z.string(),
  suggestedFollowUpQuestions: z.array(z.string()).optional(),
});

export const EvidenceChatOutputSchema = z.object({
  data: EvidenceChatDataSchema,
  usage: UsageSchema,
});

export type EvidenceChatInput = z.infer<typeof EvidenceChatInputSchema>;
export type EvidenceChatData = z.infer<typeof EvidenceChatDataSchema>;
export type EvidenceChatOutput = z.infer<typeof EvidenceChatOutputSchema>;

// ==========================================
// VIDEO & MULTIMEDIA SCHEMAS
// ==========================================

export const ConceptVideoScriptSchema = z.object({
  title: z.string(),
  concept: z.string(),
  scenes: z.array(z.object({
    sceneNumber: z.number(),
    title: z.string(),
    script: z.string().describe('The oral script for the AI narrator to read.'),
    audioDataUri: z.string().optional().describe('Base64 audio data for high-quality TTS.'),
    imageUrl: z.string().optional().describe('URL to the generated image for this scene.'),
    videoUrl: z.string().optional().describe('URL to the generated video for this scene.'),
    visualPrompt: z.string().describe('A prompt for generating a background image or video for this scene.'),

    keywords: z.array(z.string()).describe('3-5 key focus words for this scene to display on screen.'),
    visualCue: z.string().describe('Instructions for the visual representation (e.g., "Show a brain icon", "Animate the word Justice").'),
    durationSeconds: z.number(),
  })),
  summary: z.string(),
});

export type ConceptVideoScript = z.infer<typeof ConceptVideoScriptSchema>;

export const GenerateConceptVideoScriptInputSchema = z.object({
  concept: z.string(),
  explanation: ExplanationSchema,
});

export type GenerateConceptVideoScriptInput = z.infer<typeof GenerateConceptVideoScriptInputSchema>;

export const GenerateConceptVideoScriptOutputSchema = z.object({
  data: ConceptVideoScriptSchema,
  usage: UsageSchema,
});

export type GenerateConceptVideoScriptOutput = z.infer<typeof GenerateConceptVideoScriptOutputSchema>;

// ==========================================
// TEXT TO SPEECH SCHEMAS
// ==========================================

export const TextToSpeechInputSchema = z.object({
  text: z.string(),
  voiceId: z.string().optional(),
});

export const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string(),
});

export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

// ==========================================
// EMAIL DRAFTER SCHEMAS
// ==========================================

export const DraftEmailInputSchema = z.object({
  topic: z.string().describe("The topic or description of what the email should be about."),
});

export const DraftEmailDataSchema = z.object({
  subject: z.string().describe("A catchy, professional subject line for the email."),
  htmlBody: z.string().describe("The generated HTML body of the email, without html/head/body tags."),
});

export const DraftEmailOutputSchema = z.object({
  data: DraftEmailDataSchema,
  usage: UsageSchema,
});

export type DraftEmailInput = z.infer<typeof DraftEmailInputSchema>;
export type DraftEmailData = z.infer<typeof DraftEmailDataSchema>;
export type DraftEmailOutput = z.infer<typeof DraftEmailOutputSchema>;

// ==========================================
// ADDITIONAL SCHEMAS AND TYPES TO FIX BUILD ERRORS
// ==========================================

export const BrainstormSparkInputSchema = z.object({
  topic: z.string(),
  existingIdeas: z.array(z.string()),
  context: z.string().optional()
});
export const BrainstormSparkDataSchema = z.object({
  sparks: z.array(z.object({
    title: z.string(),
    description: z.string(),
    theoreticalLink: z.string().optional()
  })),
  summary: z.string()
});
export const BrainstormSparkOutputSchema = z.object({
  data: BrainstormSparkDataSchema,
  usage: UsageSchema
});
export type BrainstormSparkInput = z.infer<typeof BrainstormSparkInputSchema>;
export type BrainstormSparkOutput = z.infer<typeof BrainstormSparkOutputSchema>;

export const DilemmaAnalysisInputSchema = z.object({
  question: z.string(),
  options: z.array(z.object({ id: z.string(), text: z.string() })),
  votes: z.array(z.object({ choiceId: z.string(), justification: z.string() }))
});
export const DilemmaAnalysisDataSchema = z.object({
  analysis: z.string()
});
export const DilemmaAnalysisOutputSchema = z.object({
  data: DilemmaAnalysisDataSchema,
  usage: UsageSchema
});
export type DilemmaAnalysisInput = z.infer<typeof DilemmaAnalysisInputSchema>;
export type DilemmaAnalysisOutput = z.infer<typeof DilemmaAnalysisOutputSchema>;

export const TranscribeAudioInputSchema = z.object({
  audio: z.string()
});
export const TranscribeAudioOutputSchema = z.object({
  data: z.object({ text: z.string() }),
  usage: UsageSchema
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export const CommentNotificationEmailInputSchema = z.object({
  postAuthorName: z.string(),
  commenterName: z.string(),
  postTitle: z.string(),
  postUrl: z.string().url(),
});
export const CommentNotificationEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type CommentNotificationEmailInput = z.infer<typeof CommentNotificationEmailInputSchema>;
export type CommentNotificationEmailOutput = z.infer<typeof CommentNotificationEmailOutputSchema>;

export const StreakReminderEmailInputSchema = z.object({
  userName: z.string(),
  streakCount: z.number(),
});
export const StreakReminderEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type StreakReminderEmailInput = z.infer<typeof StreakReminderEmailInputSchema>;
export type StreakReminderEmailOutput = z.infer<typeof StreakReminderEmailOutputSchema>;

export const SubscriptionConfirmationEmailInputSchema = z.object({
  userName: z.string(),
  membershipLevel: z.string(),
});
export const SubscriptionConfirmationEmailOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type SubscriptionConfirmationEmailInput = z.infer<typeof SubscriptionConfirmationEmailInputSchema>;
export type SubscriptionConfirmationEmailOutput = z.infer<typeof SubscriptionConfirmationEmailOutputSchema>;

export type PracticeGuide = z.infer<typeof PracticeGuideSchema>;
export type ReformAnalysis = z.infer<typeof ReformAnalysisSchema>;
export type SocraticInput = z.infer<typeof SocraticInputSchema>;
export type SocraticOutput = z.infer<typeof SocraticOutputSchema>;
