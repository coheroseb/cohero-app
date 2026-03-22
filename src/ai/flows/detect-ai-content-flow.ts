import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DetectAiInputSchema = z.object({
  text: z.string().describe("The text content to analyze for AI generation."),
});

const DetectAiOutputSchema = z.object({
  aiProbabilityScore: z.number().describe("A score from 0 to 100 representing the probability that the text is AI-generated (100 = definitely AI, 0 = definitely human)."),
  explanation: z.string().describe("A brief explanation (2-4 sentences) in Danish of why this text appears to be AI-generated or human-written, looking at burstiness, perplexity, and typical AI phrasing."),
});

export type DetectAiOutput = z.infer<typeof DetectAiOutputSchema>;

export async function detectAiContentContent(input: z.infer<typeof DetectAiInputSchema>): Promise<DetectAiOutput> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    output: { schema: DetectAiOutputSchema },
    system: "Du er en ekspert i AI-detektion. Din opgave er at analysere den givne tekst og vurdere, hvor sandsynligt det er, at den er genereret af en AI (som ChatGPT, Claude, Gemini osv.).\n\nDu kigger efter:\n1. Lav 'burstiness' (ensartet sætningslængde og struktur).\n2. Lav perplexitet (forudsigelige ordvalg og overgange).\n3. Typiske AI-fraser (f.eks. 'Det er vigtigt at bemærke', 'I konklusion', udpræget passiv form, robotagtig høflighed, meget 'korrekt' og balanceret fremstilling).\n4. Mangel på egentlig personlig stemme, nuancer eller kreative/skæve sproglige spring.\n\nGiv en score fra 0 til 100, hvor 100 betyder 100% sikkert AI-genereret, og 0 betyder 100% sikkert menneskeskrevet. Giv også en kort forklaring på dansk af dit ræsonnement.",
    prompt: `Analyser følgende tekst og vurder AI-sandsynligheden:\n\n${input.text.substring(0, 10000)}`,
  });

  return output!;
}
