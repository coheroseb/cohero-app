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

export async function getRelevantLawContext(topicOrQuery: string): Promise<string> {
    console.log(`[LAW-CONTEXT] Question: "${topicOrQuery}"`);
    const lowerQuery = topicOrQuery.toLowerCase();
    
    // QUICK EXIT: If it's a theoretical model without legal indicators, skip deep law search
    const hasLegalIndicators = /§|lov|pgr|stk|kap|retssikkerhed|servicelov|barnets lov/i.test(lowerQuery);
    if (!hasLegalIndicators && lowerQuery.length > 3) {
        console.log(`[LAW-CONTEXT] No legal indicators found. Skipping deep law search.`);
        return '';
    }

    const snapshot = await adminFirestore.collection('laws').get();
    const allLaws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    if (allLaws.length === 0) return '';

    let detectedIds: string[] = [];

    // 1. FAST MATCH: Priority abbreviations (e.g., "SEL", "BL", "RSL")
    allLaws.forEach(l => {
        if (l.abbreviation && lowerQuery.includes(l.abbreviation.toLowerCase())) {
            detectedIds.push(l.id);
        }
    });

    // 2. AI DISAMBIGUATION (Only if no fast match or query is complex)
    if (detectedIds.length === 0) {
        try {
            const detectionResponse = await ai.generate({
                model: 'googleai/gemini-2.5-flash',
                system: "Du er en dansk juridisk bibliotekar. Identificer de 1-2 mest relevante love for spørgsmålet. Svar kun med en komma-separeret liste af ID'er eller 'none'.",
                prompt: `Find relevante love for: "${topicOrQuery}"
                
                Tilgængelige love:
                ${allLaws.map(l => `- ID: ${l.id}, Navn: ${l.name} (${l.abbreviation})`).join('\n')}
                
                Svar KUN med ID'erne.`
            });

            const rawIds = detectionResponse.text;
            if (rawIds && rawIds.toLowerCase() !== 'none') {
                rawIds.split(',').map(id => id.trim()).forEach(p => {
                    const found = allLaws.find(l => l.id.toLowerCase() === p.toLowerCase());
                    if (found && !detectedIds.includes(found.id)) detectedIds.push(found.id);
                });
            }
        } catch (error) {
            console.error('[LAW-CONTEXT] AI detection error:', error);
        }
    }

    // Filter and fetch context
    let legalContext = '';
    const targetLaws = allLaws.filter(l => detectedIds.includes(l.id)).slice(0, 2);

    if (targetLaws.length > 0) {
        const contexts = await Promise.all(targetLaws.map(l => getSpecificLawAndGuidelinesContext(l)));
        legalContext = contexts.filter(Boolean).join('\n\n---\n\n');
    }
    
    const ethicsContent = await getEthicsContext()
      .then(content => content ? `--- ETISK GRUNDLAG ---\n\n${content}` : '')
      .catch(() => '');

    return [legalContext, ethicsContent].filter(Boolean).join('\n\n---\n\n');
}
