// @ts-nocheck
import { ai } from '@/ai/genkit';
import {
  FTSagMetadataInputSchema,
  FTSagMetadataDataSchema,
  FTSagMetadataOutputSchema,
  type FTSagMetadataInput,
  type FTSagMetadataOutput,
} from './types';

export async function explainFTSagMetadata(input: FTSagMetadataInput): Promise<FTSagMetadataOutput> {
  return generateFTSagMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFTSagMetadataPrompt',
  input: { schema: FTSagMetadataInputSchema },
  output: { schema: FTSagMetadataDataSchema },
  prompt: `Du er en ekspert i dansk socialret og politisk analyse.
Din opgave er at kategorisere et lovforslag fra Folketinget for socialrådgiverstuderende.

Sagen er:
**Titel:** "{{{caseTitle}}}"
{{#if caseResume}}
**Officielt Resumé:** "{{{caseResume}}}"
{{/if}}

Analysér sagen og returnér:
1. **legalFields**: En liste over relevante retsområder (fx "Socialret", "Beskæftigelsesret", "Børneret", "Forvaltningsret", "Sundhedsret", "Handicapret"). Vælg de 1-3 mest relevante.
2. **impactSummary**: En ultra-kort (én sætning) opsummering af hvad ændringen betyder for praksis eller borgeren.

Returnér resultatet som et JSON objekt med nøglerne "legalFields" og "impactSummary".`,
});

export const generateFTSagMetadataFlow = ai.defineFlow(
  {
    name: 'generateFTSagMetadataFlow',
    inputSchema: FTSagMetadataInputSchema,
    outputSchema: FTSagMetadataOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      data: output!,
      usage: {
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      },
    };
  }
);
