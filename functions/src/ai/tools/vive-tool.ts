import { ai } from '../genkit';
import { fetchVivePublications } from '../flows/vive-indsigt-flow';
import { FetchVivePublicationsInputSchema, FetchVivePublicationsOutputSchema } from '../flows/types';

export const viveSearchTool = ai.defineTool(
  {
    name: 'viveSearchTool',
    description: 'Søg efter videnskabelige publikationer og rapporter fra VIVE (Det Nationale Forsknings- og Analysecenter for Velfærd) inden for socialt arbejde, velfærd, børn, unge, ældre og handicap.',
    inputSchema: FetchVivePublicationsInputSchema,
    outputSchema: FetchVivePublicationsOutputSchema,
  },
  async (input) => {
    return await fetchVivePublications(input);
  }
);
