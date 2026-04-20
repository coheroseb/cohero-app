import { analyzeAdminDocumentFlow } from './flows/analyze-admin-document-flow';
import { adminInsightFlow } from './flows/admin-insight-flow';
import { analyzeCasePdf } from './flows/analyze-case-pdf-flow';
import { analyzeFtDocument } from './flows/analyze-ft-document-flow';
import { analyzeLegalDecision } from './flows/analyze-legal-decision-flow';
import { analyzeParagraph } from './flows/analyze-paragraph-flow';
import { analyzeReformPdf } from './flows/analyze-reform-flow';
import { analyzeStarData } from './flows/analyze-star-data-flow';
import { analyzeTaskSchedule } from './flows/analyze-task-schedule-flow';
import { blogPostFlow } from './flows/blog-post-flow';
import { brainstormSpark } from './flows/brainstorm-spark-flow';
import { getCareerMatch } from './flows/career-match-flow';
import { getCaseConsequence } from './flows/case-consequence-flow';
import { getCaseFeedback } from './flows/case-feedback-flow';
import { complaintDraftFlow } from './flows/complaint-draft-flow';
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
import { generateCategoryStudyPlanFlow } from './flows/generate-category-study-plan-flow';
import { generateCommentNotificationEmail } from './flows/generate-comment-notification-email-flow';
import { generateConceptVideoScript } from './flows/generate-concept-video-script-flow';
import { generateEvidenceTags } from './flows/generate-evidence-tags-flow';
import { generateFieldworkAgreement } from './flows/generate-fieldwork-agreement-flow';
import { generateGroupInvitationEmail } from './flows/generate-group-invitation-email-flow';
import { generateModuleExamPrep } from './flows/generate-module-exam-prep-flow';
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
import { nudgeEmailFlow } from './flows/nudge-email-flow';
import { newUserActivationEmailFlow } from './flows/new-user-activation-email-flow';
import { oralExamAnalysis } from './flows/oral-exam-analysis-flow';
import { organizeEvidenceIntoSeminarFlow } from './flows/organize-evidence-seminar';
import { processExamRegulations } from './flows/process-exam-regulations-flow';
import { processStudyRegulationFlow } from './flows/process-study-regulation-flow';
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
import { studyCompanionFlow } from './flows/study-companion-flow';
import { suggestConceptsForEvent } from './flows/suggest-concepts-for-event-flow';
import { suggestExamTopic } from './flows/suggest-exam-topic-flow';
import { textToSpeech } from './flows/text-to-speech-flow';
import { tiktokScriptFlow } from './flows/tiktok-script-flow';
import { transcribeAudio } from './flows/transcribe-audio-flow';
import { translateSeminar } from './flows/translate-seminar-flow';
import { twistBlueprintFlow } from './flows/twist-blueprint-flow';
import { fetchVivePublications } from './flows/vive-indsigt-flow';
import { getViveReportQa } from './flows/vive-report-qa-flow';
import { getSocraticReflection } from './flows/sokratisk-refleksion/flow';
import { optimizeSeoFlow } from './flows/optimize-seo-flow';
import { generateLawFlowchart } from './flows/generate-law-flowchart-flow';
import { researchDiscovery } from './flows/research-discovery-flow';
import { analyzeLegalDecisionPdfFlow } from './flows/analyze-legal-decision-pdf-flow';
import { marketAnalysisFlow } from './flows/market-analysis-flow';
import { searchDiagnoseFlow } from './flows/search-diagnose-flow';
import { translateDiagnoseFlow } from './flows/translate-diagnose-flow';
import { getDiagnoseDetailsFlow } from './flows/get-diagnose-details-flow';
import { analyzeScientificParadigmFlow } from './flows/analyze-scientific-paradigm-flow';
import { chatWithGuidelineContent } from './flows/guideline-chat-flow';
import { unifiedChatFlow } from './flows/unified-chat-flow';
import { generateCourse } from './flows/generate-course-flow';


import { generateSimulationScenarioFlow, runSimulationTurnFlow, generateSimulationReportFlow } from './flows/simulation-flows';

export const allFlows: Record<string, any> = {
  'generateSimulationScenarioFlow': generateSimulationScenarioFlow,
  'runSimulationTurnFlow': runSimulationTurnFlow,
  'generateSimulationReportFlow': generateSimulationReportFlow,
  'analyzeAdminDocumentFlow': analyzeAdminDocumentFlow,

  'researchDiscoveryFlow': researchDiscovery,
  'researchDiscovery': researchDiscovery,
  'adminInsightFlowFlow': adminInsightFlow,
  'adminInsightFlow': adminInsightFlow,
  'analyzeCasePdfFlow': analyzeCasePdf,
  'analyzeCasePdf': analyzeCasePdf,
  'analyzeFtDocumentFlow': analyzeFtDocument,
  'analyzeFtDocument': analyzeFtDocument,
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
  'blogPostFlowFlow': blogPostFlow,
  'blogPostFlow': blogPostFlow,
  'brainstormSparkFlow': brainstormSpark,
  'brainstormSpark': brainstormSpark,
  'getCareerMatchFlow': getCareerMatch,
  'getCareerMatch': getCareerMatch,
  'getCaseConsequenceFlow': getCaseConsequence,
  'getCaseConsequence': getCaseConsequence,
  'getCaseFeedbackFlow': getCaseFeedback,
  'getCaseFeedback': getCaseFeedback,
  'complaintDraftFlowFlow': complaintDraftFlow,
  'complaintDraftFlow': complaintDraftFlow,
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
  'generateCategoryStudyPlanFlowFlow': generateCategoryStudyPlanFlow,
  'generateCategoryStudyPlanFlow': generateCategoryStudyPlanFlow,
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
  'generateModuleExamPrepFlow': generateModuleExamPrep,
  'generateModuleExamPrep': generateModuleExamPrep,
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
  'nudgeEmailFlowFlow': nudgeEmailFlow,
  'nudgeEmailFlow': nudgeEmailFlow,
  'newUserActivationEmailFlowFlow': newUserActivationEmailFlow,
  'newUserActivationEmailFlow': newUserActivationEmailFlow,
  'oralExamAnalysisFlow': oralExamAnalysis,
  'oralExamAnalysis': oralExamAnalysis,
  'organizeEvidenceIntoSeminarFlowFlow': organizeEvidenceIntoSeminarFlow,
  'organizeEvidenceIntoSeminarFlow': organizeEvidenceIntoSeminarFlow,
  'processExamRegulationsFlow': processExamRegulations,
  'processExamRegulations': processExamRegulations,
  'processStudyRegulationFlowFlow': processStudyRegulationFlow,
  'processStudyRegulationFlow': processStudyRegulationFlow,
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
  'studyCompanionFlowFlow': studyCompanionFlow,
  'studyCompanionFlow': studyCompanionFlow,
  'suggestConceptsForEventFlow': suggestConceptsForEvent,
  'suggestConceptsForEvent': suggestConceptsForEvent,
  'suggestExamTopicFlow': suggestExamTopic,
  'suggestExamTopic': suggestExamTopic,
  'textToSpeechFlow': textToSpeech,
  'textToSpeech': textToSpeech,
  'tiktokScriptFlowFlow': tiktokScriptFlow,
  'tiktokScriptFlow': tiktokScriptFlow,
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
  'optimizeSeoFlow': optimizeSeoFlow,
  'optimizeSeo': optimizeSeoFlow,
  'generateLawFlowchartFlow': generateLawFlowchart,
  'generateLawFlowchart': generateLawFlowchart,
  'analyzeLegalDecisionPdfFlow': analyzeLegalDecisionPdfFlow,
  'marketAnalysisFlow': marketAnalysisFlow,
  'searchDiagnoseFlow': searchDiagnoseFlow,
  'translateDiagnoseFlow': translateDiagnoseFlow,
  'getDiagnoseDetailsFlow': getDiagnoseDetailsFlow,
  'analyzeScientificParadigmFlow': analyzeScientificParadigmFlow,
  'chatWithGuidelineContentFlow': chatWithGuidelineContent,
  'chatWithGuidelineContent': chatWithGuidelineContent,
  'unifiedChatFlow': unifiedChatFlow,
  'unifiedChat': unifiedChatFlow,
  'generateCourseFlow': generateCourse,
  'generateCourse': generateCourse,
};

