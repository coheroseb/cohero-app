
import { ai } from "../genkit";
import { z } from "zod";

const SectionOutlineInputSchema = z.object({
    sectionTitle: z.string(),
    assignmentContext: z.string().optional(),
    groupName: z.string().optional(),
    evidence: z.array(z.object({
        title: z.string(),
        description: z.string(),
        tags: z.array(z.string()).optional(),
        type: z.string()
    })).optional()
});

const SectionOutlineOutputSchema = z.object({
    outline: z.array(z.string()).describe("3-5 inspiring bullet points of what to cover in this section."),
    suggestedEvidence: z.array(z.string()).describe("Titles of the evidence that are highly relevant for this specific section."),
    startingSentence: z.string().describe("A catchy, academic first sentence to overcome writer's block."),
    encouragement: z.string().describe("A short empathetic phrase to motivate the student.")
});

export const designSectionOutlineFlow = ai.defineFlow({
    name: "designSectionOutline",
    inputSchema: SectionOutlineInputSchema,
    outputSchema: SectionOutlineOutputSchema
}, async (input) => {
    
    let evidenceContext = "Ingen empiri/dokumenter tilføjet til projektet endnu.";
    if (input.evidence && input.evidence.length > 0) {
        evidenceContext = input.evidence.map(e => `- ${e.title} (${e.type}): ${e.description} [Tags: ${e.tags?.join(', ')}]`).join('\n');
    }

    const sysPrompt = `Du er bygget ind i "Cohero", en studieplatform for studerende.
Din opgave er at tage den studerende i hånden, når de møder en tom side.
De er ved at skrive afsnittet: "${input.sectionTitle}".
Gruppen eller projektet hedder: "${input.groupName || 'Ukendt'}".
Eventuelle uddybende rammer/vejledninger for afsnittet: "${input.assignmentContext || 'Ingen'}".

Her er projektets samlede empiri/dokumenter:
${evidenceContext}

Baseret på afsnittets titel og den tilgængelige empiri, skal du:
1. Skabe et inspirerende outline (3-5 bullet points) der tænker empiri/datasættet ind i konteksten af afsnittet.
2. Vælge den empiri, der virker mest relevant at inddrage netop her.
3. Foreskå en akademisk indledende sætning, der bryder skriveblokeringen.
4. Gennemgående brug et motiverende, varmt og akademisk sprog på dansk.`;

    const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: sysPrompt,
        output: { schema: SectionOutlineOutputSchema },
        config: { temperature: 0.7 }
    });

    if (!output) {
        throw new Error("Unable to generate outline.");
    }

    return output;
});
