import { ai } from '../genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// 3. Prompt definition (skal ligge på top-level i Genkit)
const materialVectorChatPrompt = ai.definePrompt({
    name: 'materialVectorChatPrompt',
    input: { schema: z.object({ message: z.string(), context: z.string(), history: z.any() }) },
    output: { schema: z.object({ answer: z.string() }) },
    model: 'googleai/gemini-2.5-flash',
    prompt: `
Du har adgang til følgende relevante uddrag fra brugerens vidensarkiv (fremsøgt via Vector Search):

<kontekst>
{{context}}
</kontekst>

Historik:
{{history}}

Besvar brugerens spørgsmål baseret på ovenstående dokumenter. Skriv i et naturligt, menneskeligt og dialogbaseret sprog frem for at lyde som en robot. Vær gerne uformel, men faglig. Hvis svaret ikke findes heri, så brug din generelle faglige viden, men gør opmærksom på det.
BRUG KUN HTML-tags (<b>, <ul>, <li>) til formatering, BRUG ALDRIG markdown asterisker (**). Start dit svar direkte uden nogen form for hilsen (ingen "Kære studerende", "Hej" eller lignende).

Spørgsmål: {{message}}`
});

export const materialVectorChatFlow = ai.defineFlow(
    {
        name: 'materialVectorChatFlow',
        inputSchema: z.object({
            userId: z.string(),
            message: z.string(),
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
        const { userId, message, chatHistory } = input;
        
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
            const snapshot = await db.collection(`users/${userId}/materialChunks`)
                .findNearest('embedding', admin.firestore.FieldValue.vector(queryEmbedding[0].embedding.slice(0, 768)), {
                    limit: 10,
                    distanceMeasure: 'COSINE'
                })
                .get();
                
            const relevantChunks = snapshot.docs.map((doc: any) => doc.data().text);
            contextText = relevantChunks.join('\n\n---\n\n');
        } catch (error) {
            console.error("Vector Search failed (mangler index?):", error);
            contextText = "Kunne ikke hente kontekst via Vector Search. Enten mangler indexet, eller også er der ingen data.";
        }
        
        const historyStr = (chatHistory && chatHistory.length > 0)
            ? chatHistory.map(h => `- ${h.role}: ${h.content}`).join('\n')
            : 'Ingen tidligere historik.';
            
        const res = await materialVectorChatPrompt({
            message,
            context: contextText,
            history: historyStr
        });
        
        return {
            answer: res.output?.answer || "Kunne ikke generere et svar."
        };
    }
);
