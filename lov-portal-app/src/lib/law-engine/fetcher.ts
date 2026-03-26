
import { parseRetsinformationXml, ParsedLaw, Paragraph } from './xml-parser';
import { getLawContentAction } from '@/app/actions';

class LawFetcher {
    private static instance: LawFetcher;
    private cache: Map<string, ParsedLaw> = new Map();

    private constructor() {}

    public static getInstance() {
        if (!LawFetcher.instance) {
            LawFetcher.instance = new LawFetcher();
        }
        return LawFetcher.instance;
    }

    /**
     * Fetches a law by its ID. Uses server-side action to bypass CORS and handle complex XML.
     */
    public async fetchLaw(id: string, xmlUrl?: string): Promise<ParsedLaw | null> {
        if (this.cache.has(id)) {
            return this.cache.get(id)!;
        }

        try {
            // Using the existing server action which is already optimized with its own cache and AI processing capability
            const result = await getLawContentAction({ 
                documentId: id, 
                xmlUrl: xmlUrl || "" // If no URL provided, the server action will try to resolve it
            });

            if (result?.data) {
                this.cache.set(id, result.data);
                return result.data;
            }
        } catch (e) {
            console.error(`LawFetcher: Failed to fetch law ${id}`, e);
        }

        return null;
    }

    /**
     * Finds a specific paragraph in a law.
     */
    public async getParagraph(lawId: string, paragraphNumber: string, xmlUrl?: string): Promise<Paragraph | null> {
        const law = await this.fetchLaw(lawId, xmlUrl);
        if (!law) return null;

        for (const chapter of law.kapitler) {
            const para = chapter.paragraffer.find(p => p.nummer === paragraphNumber);
            if (para) return para;
        }

        return null;
    }

    /**
     * Clear cache if needed (e.g. on logout)
     */
    public clearCache() {
        this.cache.clear();
    }
}

export const lawFetcher = LawFetcher.getInstance();
