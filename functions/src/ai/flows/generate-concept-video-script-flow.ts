// @ts-nocheck

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    ConceptVideoScriptSchema,
    GenerateConceptVideoScriptInputSchema, 
    type GenerateConceptVideoScriptInput,
    type GenerateConceptVideoScriptOutput,
} from './types';

import { generateElevenLabsTTS } from '@/lib/eleven-labs';
import { generateBananaImage } from '@/lib/banana-image';
import { generateVeoVideo } from '@/lib/veo-video';






const prompt = ai.definePrompt({
  name: 'generateConceptVideoScriptPrompt',
  input: { schema: GenerateConceptVideoScriptInputSchema },
  output: { schema: ConceptVideoScriptSchema },
  prompt: `Du er en kreativ instruktør og manuskriptforfatter til faglige AI-videoer.
Målet er at gøre begrebet "{{{concept}}}" LEVENDE, ENGAGERENDE og LETFORSTÅELIGT.

Her er den faglige forklaring som fundament:
---
DEFINITION: {{{explanation.definition}}}
RELEVANS: {{{explanation.relevance}}}
EKSEMPEL: {{{explanation.example}}}
---

Dine instruktioner for manuskriptet:
1. Skab 4-6 scener. Sproget skal være energisk, medrivende og fyldt med pædagogisk nærvær.
2. **KORT OG PRÆCIST**: Hver scene må MAX have 2-3 korte sætninger (ca. 20-30 ord). Undgå lange forklaringer i en enkelt scene.
3. For hver scene:
   - **script**: Skriv hvad den energiske AI-stemme skal sige. Det skal føles som en personlig mentor.
   - **visualPrompt**: Beskriv et enkelt, stilrent og moderne illustrations-stil billede der passer til scenen. Brug en konsistent stil som "Flat design illustration" eller "Minimalist illustration" med klare farver og enkel baggrund (f.eks. "A simple flat design illustration of a balanced scale representing justice, soft pastel background, professional and clean style").
   - **keywords**: Vælg 3-5 vigtige nøglebegreber der skal poppe op på skærmen i løbet af scenen.
   - **visualCue**: Vælg en specifik animation eller et element der skal dominere (f.eks. "Hjerte der slår", "Vægt der balancerer", "En dør der åbner").
   - **durationSeconds**: Beregn tid ud fra at stemmen taler i et moderat tempo (ca. 140 ord/minut for ElevenLabs).

Formatet skal være JSON efter skemaet. Sørg for at den røde tråd gennem videoen er stærk og afslut med en inspirerende opsamling.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
});

export async function generateConceptVideoScript(input: GenerateConceptVideoScriptInput): Promise<GenerateConceptVideoScriptOutput> {
  const { output, usage } = await prompt(input);
  
  if (!output) throw new Error("Kunne ikke generere manuskript.");

  console.log(">>> GEN-VIDEO-FLOW: STARTING MEDIA GENERATION (ElevenLabs + Banana)");

  const scenesWithMedia: any[] = [];
  
  // Sequential processing with artificial delay to avoid ElevenLabs concurrency limits (max 3)
  for (const scene of output.scenes) {
    try {
        console.log(`>>> GEN-VIDEO-FLOW: Generating for scene ${scene.sceneNumber}: "${scene.title}"`);
        
        // Add a small 1-second sleep to ensure the previous ElevenLabs session is fully closed
        if (scenesWithMedia.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // We generate audio and video in parallel for THIS scene
        const [audioDataUri, videoUrl] = await Promise.all([
            generateElevenLabsTTS(scene.script),
            // Try Veo! Fallback to Banana if it fails
            generateVeoVideo(scene.visualPrompt).catch((e) => {
                console.warn("Veo failed, falling back to Banana Image:", e.message);
                return undefined;
            })
        ]);

        // If Veo failed, try to get at least an image
        let imageUrl: string | undefined = undefined;
        if (!videoUrl) {
            imageUrl = await generateBananaImage(scene.visualPrompt).catch(() => undefined);
        }

        console.log(`>>> GEN-VIDEO-FLOW: COMPLETED scene ${scene.sceneNumber}`);
        scenesWithMedia.push({ ...scene, audioDataUri, videoUrl, imageUrl });

    } catch (e: any) {
        console.error(`>>> GEN-VIDEO-FLOW ERROR in scene ${scene.sceneNumber}:`, e.message);
        scenesWithMedia.push({ ...scene }); // fallback
    }
  }

  console.log(">>> GEN-VIDEO-FLOW: ALL MEDIA GENERATED.");




  const finalData = { ...output, scenes: scenesWithMedia };

  
  return {
    data: finalData,
    usage: {
      inputTokens: usage.inputTokens ?? 0,
      outputTokens: usage.outputTokens ?? 0,
    },
  };
}
