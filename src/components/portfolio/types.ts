'use client';

export interface ApaReference {
    authors: string;
    year: string;
    title: string;
    source: string; 
    url?: string;
    doi?: string;
    fullAPA: string;
}

export interface Evidence {
    id: string;
    groupId: string;
    title: string;
    description: string;
    type: 'interview' | 'survey' | 'observation' | 'document' | 'other';
    url?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    storagePath?: string;
    addedById: string;
    addedByName: string;
    createdAt: any;
    tags?: string[];
    viewedBy?: { userId: string, userName: string, viewedAt: string }[];
    apaRef?: ApaReference;
    chatHistory?: { role: string; content: string }[];
}

export interface PortfolioEntry {
    id: string;
    title: string;
    content: string;
    status: 'draft' | 'review' | 'final';
    linkedEvidenceIds: string[];
    addedById: string;
    addedByName: string;
    createdAt: any;
    updatedAt: any;
    aiFeedback?: string;
    isPrivate: boolean;
    assignment?: string;
    characterLimit?: string;
    order: number;
}
