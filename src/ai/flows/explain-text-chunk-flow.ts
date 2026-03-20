import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
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
  lastDailyChallengeDate?: Timestamp;
  dailyChallengeStreak?: number;
  lastCaseTrainerUsage?: Timestamp;
  weeklyCaseTrainerCount?: number;
  dailyCaseTrainerCount?: number;
  platformRating?: number;
  lastSocraticReflectionUsage?: Timestamp;
  weeklySocraticReflectionCount?: number;
  lastJournalTrainerUsage?: Timestamp;
  dailyJournalTrainerCount?: number;
  monthlySecondOpinionCount?: number;
  lastSecondOpinionUsage?: Timestamp;
  monthlyExamArchitectCount?: number;
  lastExamArchitectUsage?: Timestamp;
  weeklySeminarArchitectCount?: number;
  lastSeminarArchitectUsage?: Timestamp;
  dailyLawPortalCount?: number;
  lastLawPortalUsage?: Timestamp;
  monthlyMyceliumCount?: number;
  lastMyceliumUsage?: Timestamp;
  weeklyQuizCreatorCount?: number;
  lastQuizCreatorUsage?: Timestamp;
  dailyConceptExplainerCount?: number;
  lastConceptExplainerUsage?: Timestamp;
  dailyTokenCount?: number;
  lastTokenUsage?: Timestamp;
  monthlyInputTokens?: number;
  monthlyOutputTokens?: number;
  monthlyTokenTimestamp?: Timestamp;
  isHighUsage?: boolean;
  streakReminderSentAt?: Timestamp;
  mementoLevels?: {
    theorist?: number;
    paragraph?: number;
    method?: number;
  };
}

export interface ComparisonItem {
  role: string;
  action: string;
  color: string;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    category: string;
    authorId: string;
    authorName: string;
    authorEmail: string;
    authorProfilePicture?: string;
    membership: string;
    createdAt: Timestamp;
    likeCount?: number;
    commentCount?: number;
    bookId?: string;
    bookTitle?: string;
    bookAuthor?: string;
    chapter?: string;
    isAnonymous?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  createdAt: Timestamp;
}