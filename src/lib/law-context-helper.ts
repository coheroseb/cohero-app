
import { promises as fs } from 'fs';
import path from 'path';
import { getLawContent } from '@/ai/flows/get-law-content-flow';
import { adminFirestore } from '@/firebase/server-init';
import { ai } from '@/ai/genkit';

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
 * Collects all xmlUrl fields into a clear text block for the AI.
 */
export async function getSpecificLawAndGuidelinesContext(lawId: string): Promise<string> {
    try {
        const lawDocRef = adminFirestore.collection('laws').doc(lawId);
        const lawSnap = await lawDocRef.get();

        if (!lawSnap.exists) {
            console.warn(`[LAW-CONTEXT] Law with ID ${lawId} not found in database.`);
            return '';
        }

        const data = lawSnap.data();
        if (!data) return '';
        
        const xmlUrls: string[] = [];
        if (data.xmlUrl) {
            xmlUrls.push(data.xmlUrl);
        }
        if (data.guidelines && Array.isArray(data.guidelines)) {
            data.guidelines.forEach((g: any) => {
                if (g.xmlUrl) {
                    xmlUrls.push(g.xmlUrl);
                }
            });
        }

        // 1. FORMAT THE URL ARRAY AS EXPLICIT TEXT CONTEXT
        let context = `EXTERNAL URL CONTEXT (GEMINI: USE THESE LINKS AS YOUR PRIMARY AUTHORITATIVE SOURCE MATERIAL):\n`;
        xmlUrls.forEach(url => {
            context += `- ${url}\n`;
        });
        context += `\n--- END OF URL CONTEXT ---\n\n`;

        // 2. Fetch main law text content for immediate reference
        try {
            const mainContent = await getLawContent({
                documentId: lawId,
                xmlUrl: data.xmlUrl,
                name: data.name,
                abbreviation: data.abbreviation,
                lbk: data.lbk
            });
            context += `--- HOVEDLOVTEKST (Refereret fra ${data.xmlUrl}): ---\n\n${mainContent.data.rawText}\n\n`;
        } catch (e) {
            console.error(`[LAW-CONTEXT] Failed to fetch main law text for ${data.name}`, e);
        }

        // 3. Fetch all guideline texts if XML is available
        if (data.guidelines && Array.isArray(data.guidelines)) {
            for (let i = 0; i < data.guidelines.length; i++) {
                const g = data.guidelines[i];
                if (g.xmlUrl) {
                    try {
                        const guideContent = await getLawContent({
                            documentId: `${lawId}-guide-${i}`,
                            xmlUrl: g.xmlUrl,
                            name: g.title,
                            abbreviation: 'Vejl.',
                            lbk: ''
                        });
                        context += `--- VEJLEDNINGS-INDHOLD (Refereret fra ${g.xmlUrl}): ${g.title} ---\n\n${guideContent.data.rawText}\n\n`;
                    } catch (e) {
                        console.error(`[LAW-CONTEXT] Failed to fetch guideline text for ${g.title}`, e);
                    }
                }
            }
        }

        return context;
    } catch (error) {
        console.error("[LAW-CONTEXT] Error in getSpecificLawAndGuidelinesContext:", error);
        return '';
    }
}

/**
 * Optimized semantic retrieval:
 * 1. Identify relevant laws using a lightweight prompt.
 * 2. Fetch full context ONLY for those laws.
 */
export async function getRelevantLawContext(topicOrQuery: string): Promise<string> {
    const lawsSnap = await adminFirestore.collection('laws').get();
    const allLaws = lawsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // --- STEP 1: AI-BASED RELEVANCE DETECTION ---
    let detectedIds: string[] = [];
    try {
        const detectionResponse = await ai.generate({
            model: 'googleai/gemini-1.5-flash',
            system: "Du er en kritisk juridisk assistent der filtrerer retsakter. Du svarer KUN med en komma-separeret liste af ID'er (f.eks. 'barnets-lov, serviceloven') for de love der er STRENGT nødvendige for at svare på spørgsmålet. Svar 'none' hvis ingen af de angivne love er relevante.",
            prompt: `Vurder kritisk hvilke af følgende love der indeholder regler direkte relateret til dette spørgsmål: "${topicOrQuery}"
            
            Tilgængelige Love:
            ${allLaws.map(l => `- ID: ${l.id}, Navn: ${l.name} (${l.abbreviation})`).join('\n')}`
        });

        const rawIds = detectionResponse.text;
        if (!rawIds.toLowerCase().includes('none')) {
            detectedIds = rawIds.split(',').map(s => s.trim().replace(/['"\[\]]/g, ''));
        }
    } catch (e) {
        console.error("[LAW-CONTEXT] Relevance detection failed, falling back to all laws.", e);
        detectedIds = allLaws.map(l => l.id);
    }

    // --- STEP 2: KEYWORD FALLBACK ---
    if (detectedIds.length === 0) {
        const explicitMatches = allLaws.filter(l => {
            const search = topicOrQuery.toLowerCase();
            return search.includes(l.name.toLowerCase()) || search.includes(l.abbreviation.toLowerCase());
        });
        if (explicitMatches.length > 0) {
            detectedIds = explicitMatches.map(l => l.id);
        }
    }

    // --- STEP 3: FETCH FILTERED CONTEXT ---
    let legalContext = '';
    const targetLaws = detectedIds.length > 0 
        ? allLaws.filter(l => detectedIds.includes(l.id))
        : [];

    if (targetLaws.length > 0) {
        const contextPromises = targetLaws.map(l => getSpecificLawAndGuidelinesContext(l.id));
        const contexts = await Promise.all(contextPromises);
        legalContext = contexts.filter(Boolean).join('\n\n---\n\n');
    }
    
    // Get the ethics context
    const ethicsContent = await getEthicsContext()
      .then(content => `--- ETISK GRUNDLAG (Dansk Socialrådgiverforening) ---\n\n${content}`)
      .catch(() => '');

    const allContext = [legalContext, ethicsContent];

    return allContext.filter(Boolean).join('\n\n---\n\n');
}
