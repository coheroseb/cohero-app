
export type LawCategory = 'børn-unge' | 'voksne' | 'forvaltning' | 'arbejdsmarked' | 'økonomi' | 'sundhed' | 'generel';

export interface LawReference {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  category: LawCategory;
  xmlUrl?: string; // Retsinformation
  lbk?: string; // LBK nr
  keywords: string[];
  importance: number; // 1-10
}

export interface LawSituation {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string;
  relevantLawIds: string[];
}

export interface SearchResult {
  lawId: string;
  relevance: number;
  reason?: string;
}
