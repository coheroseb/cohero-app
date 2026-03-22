import { ai } from '@/ai/genkit';
import { z } from 'zod';

const EvidenceTagsInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  type: z.string().optional(),
  fileName: z.string().optional(),
});

const EvidenceTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe("En række korte, relevante tags (max 3 ord pr tag). Generer 3-5 tags."),
});

export async function generateEvidenceTags(input: z.infer<typeof EvidenceTagsInputSchema>) {
  const { output } = await ai.generate({
    output: { schema: EvidenceTagsOutputSchema },
    system: "Du er en ekspert i akademisk arkivering og socialrådgiver-uddannelsen. Din opgave er at generere 3-5 relevante, præcise tags (nøgleord) baseret på titlen og beskrivelsen af et dokument/empiri. Tags skal være korte (1-2 ord) og på dansk. Tænk på emner som 'Metode', 'Målgruppe', 'Lovgivning', 'Teori' osv.",
    prompt: `Generer tags for dette dokument:\nTitel: ${input.title}\nBeskrivelse: ${input.description || 'Ingen beskrivelse'}\nType: ${input.type || 'Andet'}\nFilnavn: ${input.fileName || ''}`,
  });
  return output!;
}
