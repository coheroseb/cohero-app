import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';



export const materialVectorChatFlow = ai.defineFlow(
    {
        name: 'materialVectorChatFlow',
        inputSchema: z.object({
            userId: z.string(),
            message: z.string(),
            materialId: z.string().optional(),
            chatHistory: z.array(z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string()
            })).optional()
        }),
        outputSchema: z.object({
            answer: z.string()
        })
    },
    async (input) => {
        const { userId, message, materialId, chatHistory } = input;
        
        // 1. Embed brugerens spørgsmål
        const queryEmbedding = await ai.embed({
            embedder: 'googleai/gemini-embedding-2',
            content: message
        });
        
        // 2. Søg i Firestore Vector Database
        const db = getFirestore('cohero-database');
        
        // NOTE: Dette kræver at der er oprettet et Vector Index i Firestore for collection 'materialChunks'
        let contextText = '';
        try {
            let query = db.collection(`users/${userId}/materialChunks`) as any;
            
            if (materialId) {
                query = query.where('materialId', '==', materialId);
            }

            const snapshot = await query
                .findNearest('embedding', FieldValue.vector(queryEmbedding[0].embedding.slice(0, 768)), {
                    limit: 10,
                    distanceMeasure: 'COSINE'
                })
                .get();
                
            const relevantChunks = snapshot.docs.map((doc: any) => doc.data().text);
            console.log(`[materialVectorChatFlow] Found ${relevantChunks.length} relevant chunks for user ${userId}`);
            
            if (relevantChunks.length === 0) {
                // DEBUG: Tjek om der findes NOGLE chunks overhovedet
                const anyChunks = await db.collection(`users/${userId}/materialChunks`).limit(1).get();
                if (anyChunks.empty) {
                    console.warn(`[materialVectorChatFlow] WARNING: No chunks found at all for user ${userId} in materialChunks collection.`);
                } else {
                    console.log(`[materialVectorChatFlow] Chunks exist, but vector search returned nothing.`);
                }
            }
            
            contextText = relevantChunks.join('\n\n[Næste uddrag]\n\n');
        } catch (error) {
            console.error("Vector Search failed (mangler index?):", error);
            contextText = "Kunne ikke hente kontekst via Vector Search. Enten mangler indexet, eller også er der ingen data.";
        }
        
        const historyStr = (chatHistory && chatHistory.length > 0)
            ? chatHistory.map(h => `- ${h.role}: ${h.content.replace(/\-\-\-/g, '[del]')}`).join('\n')
            : 'Ingen tidligere historik.';
            
        console.log(`[materialVectorChatFlow] History length: ${historyStr.length}, Context length: ${contextText.length}`);
            
        // 3. Generér svar direkte med ai.generate (undgår Dotprompt parsing fejl)
        const res = await ai.generate({
            model: 'googleai/gemini-2.5-flash',
            system: `Du er en hjælpsom akademisk assistent. Du har adgang til relevante uddrag fra ${materialId ? 'et specifikt dokument' : 'brugerens personlige vidensarkiv'}.
            
DIN OPGAVE:
Besvar brugerens spørgsmål baseret på den givne kontekst. 
- Hvis svaret findes i uddragene, så giv et præcist og hjælpsomt svar.
- Hvis svaret IKKE findes i uddragene, så svar ud fra din generelle viden, men gør opmærksom på at informationen ikke findes i ${materialId ? 'det valgte dokument' : 'arkivet'}.
- Skriv i et naturligt, pædagogisk og menneskeligt sprog.
- VIGTIGT: Hvis informationen findes i uddragene, SKAL du inkludere sidetal som reference i parentes til sidst i sætningen, f.eks. (S. 12).
- Brug KUN HTML-tags (<b>, <ul>, <li>) til formatering. BRUG ALDRIG markdown.
- Start dit svar direkte uden hilsen.`,
            prompt: `
DOKUMENT-UDDRAG FRA ARKIVET:
${contextText}

SAMTALEHISTORIK:
${historyStr}

SPØRGSMÅL FRA BRUGEREN: 
${message}
            `,
            output: { schema: z.object({ answer: z.string() }) }
        });
        
        return {
            answer: res.output?.answer || "Kunne ikke generere et svar."
        };
    }
);
