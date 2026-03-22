import { Timestamp } from 'firebase/firestore';
import { UserProfile } from './types';

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