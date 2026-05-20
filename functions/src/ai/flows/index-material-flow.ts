import { ai } from '../genkit';
import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const indexMaterialFlow = ai.defineFlow(
    {
        name: 'indexMaterialFlow',
        inputSchema: z.object({
            userId: z.string(),
            materialId: z.string(),
            rawText: z.string()
        }),
        outputSchema: z.object({
            success: z.boolean(),
            chunksIndexed: z.number()
        })
    },
    async (input) => {
        const { userId, materialId, rawText } = input;
        
        // Simpel tekst-opdeling (chunking) for at passe ind i vector-dimensioner
        const maxChunkLength = 1500;
        const chunks: string[] = [];
        
        let currentPos = 0;
        while (currentPos < rawText.length) {
            let nextPos = currentPos + maxChunkLength;
            if (nextPos < rawText.length) {
                let breakPos = rawText.lastIndexOf('\n\n', nextPos);
                if (breakPos <= currentPos) {
                    breakPos = rawText.lastIndexOf('. ', nextPos);
                }
                if (breakPos > currentPos) {
                    nextPos = breakPos + 2;
                }
            }
            chunks.push(rawText.substring(currentPos, nextPos).trim());
            currentPos = nextPos;
        }
        
        const validChunks = chunks.filter(c => c.length > 50);
        
        const db = getFirestore('cohero-database');
        const batch = db.batch();
        let count = 0;
        
        // Processér i små batches for at undgå rate-limiting på embeddings API'et
        for (let i = 0; i < validChunks.length; i += 5) {
            const batchChunks = validChunks.slice(i, i + 5);
            
            // Generér embeddings (768 dimensioner for text-embedding-004)
            const embeddings = await Promise.all(
                batchChunks.map(chunk => 
                    ai.embed({
                        embedder: 'googleai/gemini-embedding-2',
                        content: chunk
                    })
                )
            );
            
            for (let j = 0; j < batchChunks.length; j++) {
                const chunkRef = db.collection(`users/${userId}/materialChunks`).doc(`${materialId}_${count}`);
                batch.set(chunkRef, {
                    materialId,
                    text: batchChunks[j],
                    // Truncér til 768 dimensioner (Firestore tillader max 2048, og vores index er 768)
                    embedding: FieldValue.vector(embeddings[j][0].embedding.slice(0, 768)),
                    chunkIndex: count,
                    createdAt: FieldValue.serverTimestamp()
                });
                count++;
            }
        }
        
        if (count > 0) {
            await batch.commit();
        }
        
        // 4. Generér automatiske tags og smarte spørgsmål (Option 4)
        let tags: string[] = [];
        let suggestedQuestions: string[] = [];
        try {
            const insightRes = await ai.generate({
                model: 'googleai/gemini-3.5-flash',
                system: `Du er en ekspert i akademisk analyse. Din opgave er at analysere teksten og generere:
                1. 3-5 korte, præcise tags (emner).
                2. 3 "Smarte Spørgsmål", som er DYBT SPECIFIKKE for dette dokument. 
                
                REGLER FOR SPØRGSMÅL:
                - De skal KUN kunne besvares ved at læse dette specifikke dokument.
                - Undgå generiske spørgsmål som "Hvad handler dokumentet om?".
                - Stil spørgsmål til specifikke teorier, data, konklusioner eller eksempler nævnt i teksten.
                - De skal fungere som "teaser" til det vigtigste indhold.
                
                Svar KUN med et JSON objekt: { "tags": ["tag1", "tag2"], "questions": ["spørgsmål 1", "spørgsmål 2", "spørgsmål 3"] }`,
                prompt: `Her er teksten fra dokumentet:\n${rawText.substring(0, 10000)}`,
                output: { schema: z.object({ tags: z.array(z.string()), questions: z.array(z.string()) }) }
            });
            tags = insightRes.output?.tags || [];
            suggestedQuestions = insightRes.output?.questions || [];
        } catch (e) {
            console.error("Auto-insights fejlede:", e);
        }
        
        // 5. Opdater materialet med at vector indekseringen er fuldført og tilføj tags + spørgsmål
        await db.collection(`users/${userId}/materials`).doc(materialId).set({
            isIndexed: true,
            vectorIndexed: true,
            chunksCount: count,
            tags: tags,
            suggestedQuestions: suggestedQuestions,
            contentIndexedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        
        return { success: true, chunksIndexed: count };
    }
);
