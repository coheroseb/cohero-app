'use client';

/**
 * @fileOverview An AI flow to generate SEO-optimized blog posts for Cohéro.
 */

import { ai } from '@/ai/genkit';
import { 
    BlogPostInputSchema,
    BlogPostOutputSchema,
} from './types';

const prompt = ai.definePrompt({
  name: 'blogPostPrompt',
  input: { schema: BlogPostInputSchema },
  prompt: `Du er en ekspert i SEO og socialrådgiver-fagligt indhold for Cohéro.
Din opgave er at skrive et knivskarpt, SEO-optimeret blogindlæg eller en LinkedIn-artikel om emnet: {{topic}}.

**Målgruppe:** {{targetAudience}}
**Søgeord:** {{keywords}}

**Din indholds-strategi:**
1. Skriv en overskrift, der både er faglig og fængende.
2. Skriv en kort teaser/meta-beskrivelse.
3. Indholdet skal være opdelt i logiske afsnit med gode overskrifter (H2, H3).
4. Sørg for at inkludere juridisk præcision (henvis gerne til Serviceloven eller relevant teori).
5. Afslut med en stærk Call To Action (CTA), der leder dem til Cohéro-platformen.

**Tone:**
Professionel, inspirerende, men i øjenhøjde med studerende. Skriv på dansk.

Returner et JSON objekt med 'title', 'excerpt', 'content' (Markdown) og en liste af 'seoKeywords'.
`,
});

export const blogPostFlow = ai.defineFlow(
  {
    name: 'blogPostFlow',
    inputSchema: BlogPostInputSchema,
    outputSchema: BlogPostOutputSchema,
  },
  async (input) => {
    const { output, usage } = await prompt(input);
    return {
      title: output!.title,
      excerpt: output!.excerpt,
      content: output!.content,
      seoKeywords: output!.seoKeywords,
      usage: {
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0
      }
    };
  }
);
