
import { LAW_REGISTRY, SITUATIONS_REGISTRY } from './registry';
import { LawReference, LawSituation, LawCategory } from './types';

export class LawEngine {
    private static instance: LawEngine;
    private laws: LawReference[] = LAW_REGISTRY;
    private situations: LawSituation[] = SITUATIONS_REGISTRY;

    private constructor() {}

    public static getInstance() {
        if (!LawEngine.instance) {
            LawEngine.instance = new LawEngine();
        }
        return LawEngine.instance;
    }

    public getLawById(id: string): LawReference | undefined {
        return this.laws.find(l => l.id === id);
    }

    public getLawsByCategory(category: LawCategory): LawReference[] {
        return this.laws.filter(l => l.category === category);
    }

    public searchLaws(query: string): LawReference[] {
        const q = query.toLowerCase().trim();
        if (!q) return this.laws;

        return this.laws
            .map(law => {
                let score = 0;
                if (law.name.toLowerCase().includes(q)) score += 10;
                if (law.abbreviation.toLowerCase().includes(q)) score += 15;
                if (law.description.toLowerCase().includes(q)) score += 5;
                if (law.keywords.some(k => k.toLowerCase().includes(q))) score += 8;
                return { law, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.law);
    }

    public getSuggestedLawsForSituation(situationId: string): LawReference[] {
        const situation = this.situations.find(s => s.id === situationId);
        if (!situation) return [];
        return situation.relevantLawIds
            .map(id => this.getLawById(id))
            .filter((l): l is LawReference => !!l);
    }

    public recommendLawsForInstitution(instName: string, instType: string): LawReference[] {
        const text = `${instName} ${instType}`.toLowerCase();
        const results = this.laws.map(law => {
            let score = 0;
            law.keywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) score += 5;
            });
            if (law.category === 'børn-unge' && (text.includes('barn') || text.includes('børne') || text.includes('skole'))) score += 10;
            if (law.category === 'voksne' && (text.includes('voksen') || text.includes('botilbud') || text.includes('handicap'))) score += 10;
            return { law, score };
        });

        return results
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(r => r.law);
    }
}

export const lawEngine = LawEngine.getInstance();
