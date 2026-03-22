import { promises as fs } from 'fs';
import path from 'path';
import { adminFirestore } from '@/firebase/server-init';
import { ai } from '@/ai/genkit';
import { getLawContent } from '@/ai/flows/get-law-content-flow';
import { LAW_METADATA } from './law-metadata';

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

/**
 * Main helper to get relevant law context for a query.
 */
export async function getRelevantLawContext(topicOrQuery: string): Promise<string> {
    console.log(`[LAW-CONTEXT] Question: "${topicOrQuery}"`);
    
    const snapshot = await adminFirestore.collection('laws').get();
    const allLaws = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    console.log(`[LAW-CONTEXT] Found ${allLaws.length} laws.`);

    if (allLaws.length === 0) return '';

    let detectedIds: string[] = [];
    
    try {
        const detectionResponse = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            system: "Du er en dansk juridisk bibliotekar. Din opgave er at identificere hvilke love der er mest relevante for en klients spørgsmål. Du svarer KUN med en komma-separeret liste af ID'er. Du SKAL vælge de 1-2 mest relevante love fra listen nedenfor. Svar kun 'none' hvis spørgsmålet overhovedet ikke omhandler jura eller socialt arbejde.",
            prompt: `Find de love der kan besvare dette spørgsmål: "${topicOrQuery}"
            
            Liste over tilgængelige love:
            ${allLaws.map(l => {
                const meta = LAW_METADATA[l.id];
                const desc = meta ? `Beskrivelse: ${meta.description} Nøgleord: ${meta.keywords.join(', ')}` : 'Søg efter relevante paragraffer i denne lov.';
                return `- ID: ${l.id}, Navn: ${l.name} (${l.abbreviation}). ${desc}`;
            }).join('\n')}
            
            Svar KUN med ID'erne på de 1-2 mest relevante love, separeret af komma.`
        });

        const rawIds = detectionResponse.text;
        console.log(`[LAW-CONTEXT] AI Raw Response: "${rawIds}"`);

        if (rawIds && rawIds.toLowerCase() !== 'none') {
            const potentialIds = rawIds.split(',').map(id => id.trim());
            potentialIds.forEach(p => {
                const found = allLaws.find(l => 
                    l.id.toLowerCase() === p.toLowerCase() || 
                    l.name.toLowerCase().includes(p.toLowerCase()) || 
                    l.abbreviation.toLowerCase() === p.toLowerCase()
                );
                if (found && !detectedIds.includes(found.id)) {
                    detectedIds.push(found.id);
                }
            });
        }
    } catch (error) {
        console.error('[LAW-CONTEXT] AI detection error:', error);
    }

    // --- FALLBACK: KEYWORD SEARCH ---
    if (detectedIds.length === 0) {
        console.log(`[LAW-CONTEXT] No AI matches. Using keyword fallback...`);
        const lowerQuery = topicOrQuery.toLowerCase();
        allLaws.forEach(l => {
            const meta = LAW_METADATA[l.id];
            const searchTerms = [
                l.name.toLowerCase(),
                l.abbreviation.toLowerCase(),
                ...(meta ? meta.keywords.map(k => k.toLowerCase()) : [])
            ];
            if (searchTerms.some(term => lowerQuery.includes(term))) {
                detectedIds.push(l.id);
            }
        });
    }

    console.log(`[LAW-CONTEXT] Final Detected Law IDs:`, detectedIds);

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
