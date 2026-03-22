import { ai } from '../genkit';
import { z } from 'genkit';
import { getRelevantLawContext, getSpecificLawAndGuidelinesContext } from '../../lib/law-context-helper';

export const getRelevantLawContextFlow = ai.defineFlow(
  {
    name: 'getRelevantLawContextFlow',
    inputSchema: z.object({ topicOrQuery: z.string() }),
    outputSchema: z.string(),
  },
  async ({ topicOrQuery }) => {
    return await getRelevantLawContext(topicOrQuery);
  }
);

export const getSpecificLawContextFlow = ai.defineFlow(
  {
    name: 'getSpecificLawContextFlow',
    inputSchema: z.object({
      id: z.string(),
      name: z.string(),
      xmlUrl: z.string().optional(),
      guidelines: z.array(z.any()).optional()
    }),
    outputSchema: z.string(),
  },
  async (data) => {
    return await getSpecificLawAndGuidelinesContext(data);
  }
);
