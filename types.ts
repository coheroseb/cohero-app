
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  studyStarted?: string;
  institution?: string;
  role?: 'user' | 'admin';
  membership?: string;
}

export interface ComparisonItem {
  role: string;
  action: string;
  color: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  memberIds: string[];
  finalDeadline?: string;
  createdAt: any;
  membersCount: number;
}
