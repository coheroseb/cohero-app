import { promises as fs } from 'fs';
import path from 'path';
import { adminFirestore } from '@/firebase/server-init';
import { ai } from '@/ai/genkit';
import { getLawContent } from '@/ai/flows/get-law-content-flow';

async function getEthicsContext(): Promise<string> {
    try {
        const ethicsFilePath = path.join(process.cwd(), 'docs', 'professionsetik.txt');
        return await fs.readFile(ethicsFilePath, 'utf-8');
    } catch (error) {
        console.warn('Could not read professionsetik.txt:', error);
        return '';
    }
}

/**
 * Specifically fetches a law and ALL its associated guidelines by ID to provide deep context.
 */
export async function getSpecificLawAndGuidelinesContext(data: { id: string, name: string, xmlUrl?: string, guidelines?: any[] }): Promise<string> {
    const lawId = data.id;
    let combinedContext = `--- JURIDISK KONTEKST FOR: ${data.name} ---\n\n`;

    try {
        // 1. Fetch main law text if XML is available
        if (data.xmlUrl) {
            try {
                const res = await getLawContent({
                    documentId: lawId,
                    xmlUrl: data.xmlUrl,
                    name: data.name
                });
                if (res?.data?.rawText) {
                    combinedContext += `[HOVEDLOVTEKST: ${data.name}]\n${res.data.rawText}\n\n`;
                }
            } catch (e) {
                console.error(`[LAW-CONTEXT] Failed to fetch main law text for ${data.name}`, e);
            }
        }

        // 2. Fetch max 2 guideline texts if XML is available (to save tokens)
        if (data.guidelines && Array.isArray(data.guidelines)) {
            const prioritizedGuides = data.guidelines.slice(0, 2);
            for (let i = 0; i < prioritizedGuides.length; i++) {
                const g = prioritizedGuides[i];
                if (g.xmlUrl) {
                    try {
                        const guideRes = await getLawContent({
                            documentId: g.id || `${lawId}-guide-${i}`,
                            xmlUrl: g.xmlUrl,
                            name: g.name || `Vejledning til ${data.name}`
                        });
                        if (guideRes?.data?.rawText) {
                            combinedContext += `[VEJLEDNINGS-INDHOLD: ${g.name}]\n${guideRes.data.rawText}\n\n`;
                        }
                    } catch (e) {
                        console.error(`[LAW-CONTEXT] Failed to fetch guideline text for ${g.name}`, e);
                    }
                }
            }
        }

        return combinedContext + `\n--- SLUT PÅ KONTEKST FOR ${data.name} ---\n\n`;

    } catch (error) {
        console.error(`[LAW-CONTEXT] Error building context for ${lawId}:`, error);
        return combinedContext;
    }
}

let cachedLaws: any[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getRelevantLawContext(topicOrQuery: string): Promise<string> {
    console.log(`[LAW-CONTEXT] Question: "${topicOrQuery}"`);
    const lowerQuery = topicOrQuery.toLowerCase().trim();
    
    // 0. Use cached laws if available
    let allLaws: any[] = [];
    const now = Date.now();
    if (cachedLaws && (now - lastCacheUpdate < CACHE_TTL)) {
        allLaws = cachedLaws;
    } else {
        const snapshot = await adminFirestore.collection('laws').get();
        allLaws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        cachedLaws = allLaws;
        lastCacheUpdate = now;
    }
    
    if (allLaws.length === 0) return '';

    let detectedIds: string[] = [];

    // 1. Keyword Extraction (for better matching)
    // Filter out common Danish stop words and short words
    const stopWords = ['når', 'en', 'et', 'den', 'det', 'de', 'der', 'om', 'på', 'i', 'til', 'fra', 'ved', 'og', 'eller', 'skal', 'kan', 'er', 'var', 'bliver', 'med', 'hvis', 'efter', 'hvilke', 'hvem', 'hvor', 'hvorfor', 'hvordan', 'mikkel', 'dreng', 'pige', 'barn', 'dreng', 'mistrivsel', 'kommune', 'modtager', 'underretning'];
    const keywords = lowerQuery
        .split(/[ \.\?\!,;]+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));

    // 2. FAST MATCH: Priority abbreviations and exact name matches
    allLaws.forEach(l => {
        const nameLower = l.name?.toLowerCase() || '';
        const abbrLower = l.abbreviation?.toLowerCase() || '';
        
        if (abbrLower && (lowerQuery.includes(abbrLower))) {
            detectedIds.push(l.id);
        }
        
        // Also match if law name is mentioned
        if (nameLower && lowerQuery.includes(nameLower)) {
            detectedIds.push(l.id);
        }
    });

    // 3. CORE LAWS INJECTION: If the query is a situation/case context, we almost always want these
    const coreLawKeywords = ['kommune', 'underretning', 'mistrivsel', 'barn', 'familie', 'støtte', 'hjælp', 'afgørelse', 'forvaltning', 'sagsbehandler'];
    if (coreLawKeywords.some(kw => lowerQuery.includes(kw))) {
        // IDs for Serviceloven, Barnets Lov, Forvaltningsloven, Retssikkerhedsloven
        const coreIds = ['barnetslov', 'barnets-lov', 'serviceloven', 'forvaltningsloven', 'retssikkerhedsloven'];
        coreIds.forEach(cid => {
            const found = allLaws.find(l => l.id.toLowerCase() === cid || (l.abbreviation && l.abbreviation.toLowerCase() === cid));
            if (found && !detectedIds.includes(found.id)) detectedIds.push(found.id);
        });
    }

    // 4. AI DISAMBIGUATION (Broader selection)
    try {
        const detectionResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            system: "Du er en dansk juridisk bibliotekar. Din opgave er at identificere ALL relevante love for en given problemstilling eller et spørgsmål. Identificer op til 5-6 mest relevante love. Svar kun med en komma-separeret liste af ID'er.",
            prompt: `Find relevante love for dette spørgsmål/begreb: "${topicOrQuery}"
            
            LOV-SAMLING (Lovportalen):
            ${allLaws.map(l => `- ID: ${l.id}, Navn: ${l.name} (${l.abbreviation})`).join('\n')}
            
            Svar KUN med ID'erne (f.eks. barnetslov, forvaltningsloven) eller 'none' hvis intet er relevant.`
        });

        const rawIds = detectionResponse.text;
        if (rawIds && rawIds.toLowerCase() !== 'none') {
            rawIds.split(',').map(id => id.trim()).forEach(p => {
                const found = allLaws.find(l => l.id.toLowerCase() === p.toLowerCase() || (l.abbreviation && l.abbreviation.toLowerCase() === p.toLowerCase()));
                if (found && !detectedIds.includes(found.id)) detectedIds.push(found.id);
            });
        }
    } catch (error) {
        console.error('[LAW-CONTEXT] AI detection error:', error);
    }

    // 5. Build Context
    let legalContext = '';
    
    // Safety check for note-taking/journals
    if (lowerQuery.includes('notat') || lowerQuery.includes('journal')) {
        const offFound = allLaws.find(l => l.name?.toLowerCase().includes('offentlighed') || l.abbreviation === 'OFL');
        if (offFound && !detectedIds.includes(offFound.id)) {
            detectedIds.push(offFound.id);
        }
    }

    // Use a larger slice if searching "all laws"
    const targetLaws = allLaws.filter(l => detectedIds.includes(l.id)).slice(0, 6);

    if (targetLaws.length > 0) {
        const contexts = await Promise.all(targetLaws.map(async (l) => {
            const fullLawContext = await getSpecificLawAndGuidelinesContext(l);
            
            // KEYWORD SEARCH: Force the AI to see the most relevant paragraphs first
            const paragraphs = fullLawContext.split(/\n\n|(?=§\s?\d+)/);
            
            // Filter paragraphs that contain ANY of our extracted keywords
            const matches = paragraphs.filter(p => {
                const pLower = p.toLowerCase();
                return keywords.length > 0 ? keywords.some(kw => pLower.includes(kw)) : pLower.includes(lowerQuery);
            });
            
            if (matches.length > 0) {
                // Prioritize matches at the top but keep the full context below for nuances
                return `--- RELEVANTE UDDRAG FRA ${l.name} ---\n${matches.slice(0, 10).join('\n\n')}\n\n${fullLawContext}`;
            }
            return fullLawContext;
        }));
        legalContext = contexts.filter(Boolean).sort((a, b) => b.includes('RELEVANTE UDDRAG') ? 1 : -1).join('\n\n---\n\n');
    }
    
    // If we still found NOTHING, let's at least include summaries of all laws
    if (!legalContext) {
        legalContext = "OVERORDNET LOV-OVERSIGT (Da der ikke blev fundet direkte match på din søgning):\n" + 
            allLaws.map(l => `- ${l.name} (${l.abbreviation}): ${l.description || 'Juridisk regelsæt i lovportalen.'}`).join('\n');
    }
    
    const ethicsContent = await getEthicsContext()
      .then(content => content ? `--- ETISK GRUNDLAG ---\n\n${content}` : '')
      .catch(() => '');

    return [legalContext, ethicsContent].filter(Boolean).join('\n\n---\n\n');
}
