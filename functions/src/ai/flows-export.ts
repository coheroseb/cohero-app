import { analyzeFtDocument } from './flows/analyze-ft-document-flow';
import { analyzeCasePdf } from './flows/analyze-case-pdf-flow';
import { analyzeLegalDecision } from './flows/analyze-legal-decision-flow';
import { analyzeParagraph } from './flows/analyze-paragraph-flow';
import { analyzeReformPdf } from './flows/analyze-reform-flow';
import { analyzeStarData } from './flows/analyze-star-data-flow';
import { analyzeTaskSchedule } from './flows/analyze-task-schedule-flow';
import { brainstormSpark } from './flows/brainstorm-spark-flow';
import { getCareerMatch } from './flows/career-match-flow';
import { getCaseConsequence } from './flows/case-consequence-flow';
import { getCaseFeedback } from './flows/case-feedback-flow';
import { getConsensusAnalysis } from './flows/consensus-analysis-flow';
import { recommendContent } from './flows/content-recommendations';
import { designSectionOutlineFlow } from './flows/design-section-outline-flow';
import { detectAiContentContent } from './flows/detect-ai-content-flow';
import { analyzeDilemma } from './flows/dilemma-analysis-flow';
import { draftEmail } from './flows/draft-email-flow';
import { chatWithEvidenceContent } from './flows/evidence-chat-flow';
import { generateExamBlueprint } from './flows/exam-architect-flow';
import { explainConceptWithAnalogy } from './flows/explain-concept-analogy-flow';
import { explainConcept } from './flows/explain-concept-flow';
import { explainFolketingetSag } from './flows/explain-ft-case-flow';
import { explainLawParagraph } from './flows/explain-law-paragraph-flow';
import { explainTechniqueWithAnalogy } from './flows/explain-technique-analogy-flow';
import { extractApaMetadata } from './flows/extract-apa-metadata-flow';
import { extractLawInfoFromUrl } from './flows/extract-law-info-flow';
import { extractTasksFromText } from './flows/extract-tasks-flow';
import { getFagligtMycelium } from './flows/fagligt-mycelium-flow';
import { generateFTSagMetadataFlow } from './flows/ft-case-metadata-flow';
import { generateCase } from './flows/generate-case-flow';
import { generateCaseUpdateEmail } from './flows/generate-case-update-email-flow';
import { generateCommentNotificationEmail } from './flows/generate-comment-notification-email-flow';
import { generateConceptVideoScript } from './flows/generate-concept-video-script-flow';
import { generateEvidenceTags } from './flows/generate-evidence-tags-flow';
import { generateFieldworkAgreement } from './flows/generate-fieldwork-agreement-flow';
import { generateGroupInvitationEmail } from './flows/generate-group-invitation-email-flow';
import { generateParagraphDiffFlow } from './flows/generate-paragraph-diff-flow';
import { generateRawCaseSources } from './flows/generate-raw-case-sources-flow';
import { generateReportQuestions } from './flows/generate-report-questions-flow';
import { generateStreakReminderEmail } from './flows/generate-streak-reminder-email-flow';
import { generateStudySchedule } from './flows/generate-study-schedule-flow';
import { generateSubscriptionConfirmationEmail } from './flows/generate-subscription-confirmation-email-flow';
import { generateVerificationEmail } from './flows/generate-verification-email-flow';
import { generateWelcomeEmail } from './flows/generate-welcome-email-flow';
import { getLawContent } from './flows/get-law-content-flow';
import { identifyReformFlow } from './flows/identify-reform-flow';
import { getIntroCaseConsequence } from './flows/intro-case-consequence-flow';
import { journalSynthesisFeedback } from './flows/journal-synthesis-feedback-flow';
import { getRelevantLawContextFlow } from './flows/law-context-wrapper-flow';
import { getLivePortfolioFeedback } from './flows/live-portfolio-feedback-flow';
import { getMythBusterResponse } from './flows/myth-buster-flow';
import { oralExamAnalysis } from './flows/oral-exam-analysis-flow';
import { organizeEvidenceIntoSeminarFlow } from './flows/organize-evidence-seminar';
import { processExamRegulations } from './flows/process-exam-regulations-flow';
import { processStudyRegulation } from './flows/process-study-regulation-flow';
import { generateQuiz } from './flows/quiz-generator-flow';
import { recommendTaskAssignee } from './flows/recommend-task-assignee-flow';
import { recommendTechnique } from './flows/recommend-technique-flow';
import { reviseCase } from './flows/revise-case-flow';
import { reviseJournalEntry } from './flows/revise-journal-entry-flow';
import { scanStudentCard } from './flows/scan-student-card-flow';
import { getSecondOpinion } from './flows/second-opinion-flow';
import { semanticLawSearch } from './flows/semantic-law-search-flow';
import { generateSemesterPlan } from './flows/semester-planner-flow';
import { seminarArchitect } from './flows/seminar-architect-flow';
import { seminarChat } from './flows/seminar-chat-flow';
import { simulateFeedbackFlow } from './flows/simulate-feedback-flow';
import { simulateNextDayFlow } from './flows/simulate-next-day-flow';
import { simulateStartFlow } from './flows/simulate-start-flow';
import { suggestConceptsForEvent } from './flows/suggest-concepts-for-event-flow';
import { textToSpeech } from './flows/text-to-speech-flow';
import { transcribeAudio } from './flows/transcribe-audio-flow';
import { translateSeminar } from './flows/translate-seminar-flow';
import { twistBlueprintFlow } from './flows/twist-blueprint-flow';
import { fetchVivePublications } from './flows/vive-indsigt-flow';
import { getViveReportQa } from './flows/vive-report-qa-flow';
import { getSocraticReflection } from './flows/sokratisk-refleksion/flow';

export const allFlows: Record<string, any> = {
  'analyzeFtDocumentFlow': analyzeFtDocument,
  'analyzeFtDocument': analyzeFtDocument,
  'analyzeCasePdfFlow': analyzeCasePdf,
  'analyzeCasePdf': analyzeCasePdf,
  'analyzeLegalDecisionFlow': analyzeLegalDecision,
  'analyzeLegalDecision': analyzeLegalDecision,
  'analyzeParagraphFlow': analyzeParagraph,
  'analyzeParagraph': analyzeParagraph,
  'analyzeReformPdfFlow': analyzeReformPdf,
  'analyzeReformPdf': analyzeReformPdf,
  'analyzeStarDataFlow': analyzeStarData,
  'analyzeStarData': analyzeStarData,
  'analyzeTaskScheduleFlow': analyzeTaskSchedule,
  'analyzeTaskSchedule': analyzeTaskSchedule,
  'brainstormSparkFlow': brainstormSpark,
  'brainstormSpark': brainstormSpark,
  'getCareerMatchFlow': getCareerMatch,
  'getCareerMatch': getCareerMatch,
  'getCaseConsequenceFlow': getCaseConsequence,
  'getCaseConsequence': getCaseConsequence,
  'getCaseFeedbackFlow': getCaseFeedback,
  'getCaseFeedback': getCaseFeedback,
  'getConsensusAnalysisFlow': getConsensusAnalysis,
  'getConsensusAnalysis': getConsensusAnalysis,
  'recommendContentFlow': recommendContent,
  'recommendContent': recommendContent,
  'designSectionOutlineFlowFlow': designSectionOutlineFlow,
  'designSectionOutlineFlow': designSectionOutlineFlow,
  'detectAiContentContentFlow': detectAiContentContent,
  'detectAiContentContent': detectAiContentContent,
  'analyzeDilemmaFlow': analyzeDilemma,
  'analyzeDilemma': analyzeDilemma,
  'draftEmailFlow': draftEmail,
  'draftEmail': draftEmail,
  'chatWithEvidenceContentFlow': chatWithEvidenceContent,
  'chatWithEvidenceContent': chatWithEvidenceContent,
  'generateExamBlueprintFlow': generateExamBlueprint,
  'generateExamBlueprint': generateExamBlueprint,
  'explainConceptWithAnalogyFlow': explainConceptWithAnalogy,
  'explainConceptWithAnalogy': explainConceptWithAnalogy,
  'explainConceptFlow': explainConcept,
  'explainConcept': explainConcept,
  'explainFolketingetSagFlow': explainFolketingetSag,
  'explainFolketingetSag': explainFolketingetSag,
  'explainLawParagraphFlow': explainLawParagraph,
  'explainLawParagraph': explainLawParagraph,
  'explainTechniqueWithAnalogyFlow': explainTechniqueWithAnalogy,
  'explainTechniqueWithAnalogy': explainTechniqueWithAnalogy,
  'extractApaMetadataFlow': extractApaMetadata,
  'extractApaMetadata': extractApaMetadata,
  'extractLawInfoFromUrlFlow': extractLawInfoFromUrl,
  'extractLawInfoFromUrl': extractLawInfoFromUrl,
  'extractTasksFromTextFlow': extractTasksFromText,
  'extractTasksFromText': extractTasksFromText,
  'getFagligtMyceliumFlow': getFagligtMycelium,
  'getFagligtMycelium': getFagligtMycelium,
  'generateFTSagMetadataFlowFlow': generateFTSagMetadataFlow,
  'generateFTSagMetadataFlow': generateFTSagMetadataFlow,
  'generateCaseFlow': generateCase,
  'generateCase': generateCase,
  'generateCaseUpdateEmailFlow': generateCaseUpdateEmail,
  'generateCaseUpdateEmail': generateCaseUpdateEmail,
  'generateCommentNotificationEmailFlow': generateCommentNotificationEmail,
  'generateCommentNotificationEmail': generateCommentNotificationEmail,
  'generateConceptVideoScriptFlow': generateConceptVideoScript,
  'generateConceptVideoScript': generateConceptVideoScript,
  'generateEvidenceTagsFlow': generateEvidenceTags,
  'generateEvidenceTags': generateEvidenceTags,
  'generateFieldworkAgreementFlow': generateFieldworkAgreement,
  'generateFieldworkAgreement': generateFieldworkAgreement,
  'generateGroupInvitationEmailFlow': generateGroupInvitationEmail,
  'generateGroupInvitationEmail': generateGroupInvitationEmail,
  'generateParagraphDiffFlowFlow': generateParagraphDiffFlow,
  'generateParagraphDiffFlow': generateParagraphDiffFlow,
  'generateRawCaseSourcesFlow': generateRawCaseSources,
  'generateRawCaseSources': generateRawCaseSources,
  'generateReportQuestionsFlow': generateReportQuestions,
  'generateReportQuestions': generateReportQuestions,
  'generateStreakReminderEmailFlow': generateStreakReminderEmail,
  'generateStreakReminderEmail': generateStreakReminderEmail,
  'generateStudyScheduleFlow': generateStudySchedule,
  'generateStudySchedule': generateStudySchedule,
  'generateSubscriptionConfirmationEmailFlow': generateSubscriptionConfirmationEmail,
  'generateSubscriptionConfirmationEmail': generateSubscriptionConfirmationEmail,
  'generateVerificationEmailFlow': generateVerificationEmail,
  'generateVerificationEmail': generateVerificationEmail,
  'generateWelcomeEmailFlow': generateWelcomeEmail,
  'generateWelcomeEmail': generateWelcomeEmail,
  'getLawContentFlow': getLawContent,
  'getLawContent': getLawContent,
  'identifyReformFlowFlow': identifyReformFlow,
  'identifyReformFlow': identifyReformFlow,
  'getIntroCaseConsequenceFlow': getIntroCaseConsequence,
  'getIntroCaseConsequence': getIntroCaseConsequence,
  'journalSynthesisFeedbackFlow': journalSynthesisFeedback,
  'journalSynthesisFeedback': journalSynthesisFeedback,
  'getRelevantLawContextFlowFlow': getRelevantLawContextFlow,
  'getRelevantLawContextFlow': getRelevantLawContextFlow,
  'getLivePortfolioFeedbackFlow': getLivePortfolioFeedback,
  'getLivePortfolioFeedback': getLivePortfolioFeedback,
  'getMythBusterResponseFlow': getMythBusterResponse,
  'getMythBusterResponse': getMythBusterResponse,
  'oralExamAnalysisFlow': oralExamAnalysis,
  'oralExamAnalysis': oralExamAnalysis,
  'organizeEvidenceIntoSeminarFlowFlow': organizeEvidenceIntoSeminarFlow,
  'organizeEvidenceIntoSeminarFlow': organizeEvidenceIntoSeminarFlow,
  'processExamRegulationsFlow': processExamRegulations,
  'processExamRegulations': processExamRegulations,
  'processStudyRegulationFlow': processStudyRegulation,
  'processStudyRegulation': processStudyRegulation,
  'generateQuizFlow': generateQuiz,
  'generateQuiz': generateQuiz,
  'recommendTaskAssigneeFlow': recommendTaskAssignee,
  'recommendTaskAssignee': recommendTaskAssignee,
  'recommendTechniqueFlow': recommendTechnique,
  'recommendTechnique': recommendTechnique,
  'reviseCaseFlow': reviseCase,
  'reviseCase': reviseCase,
  'reviseJournalEntryFlow': reviseJournalEntry,
  'reviseJournalEntry': reviseJournalEntry,
  'scanStudentCardFlow': scanStudentCard,
  'scanStudentCard': scanStudentCard,
  'getSecondOpinionFlow': getSecondOpinion,
  'getSecondOpinion': getSecondOpinion,
  'semanticLawSearchFlow': semanticLawSearch,
  'semanticLawSearch': semanticLawSearch,
  'generateSemesterPlanFlow': generateSemesterPlan,
  'generateSemesterPlan': generateSemesterPlan,
  'seminarArchitectFlow': seminarArchitect,
  'seminarArchitect': seminarArchitect,
  'seminarChatFlow': seminarChat,
  'seminarChat': seminarChat,
  'simulateFeedbackFlowFlow': simulateFeedbackFlow,
  'simulateFeedbackFlow': simulateFeedbackFlow,
  'simulateNextDayFlowFlow': simulateNextDayFlow,
  'simulateNextDayFlow': simulateNextDayFlow,
  'simulateStartFlowFlow': simulateStartFlow,
  'simulateStartFlow': simulateStartFlow,
  'suggestConceptsForEventFlow': suggestConceptsForEvent,
  'suggestConceptsForEvent': suggestConceptsForEvent,
  'textToSpeechFlow': textToSpeech,
  'textToSpeech': textToSpeech,
  'transcribeAudioFlow': transcribeAudio,
  'transcribeAudio': transcribeAudio,
  'translateSeminarFlow': translateSeminar,
  'translateSeminar': translateSeminar,
  'twistBlueprintFlowFlow': twistBlueprintFlow,
  'twistBlueprintFlow': twistBlueprintFlow,
  'fetchVivePublicationsFlow': fetchVivePublications,
  'fetchVivePublications': fetchVivePublications,
  'getViveReportQaFlow': getViveReportQa,
  'getViveReportQa': getViveReportQa,
  'getSocraticReflectionFlow': getSocraticReflection,
  'getSocraticReflection': getSocraticReflection,
};
