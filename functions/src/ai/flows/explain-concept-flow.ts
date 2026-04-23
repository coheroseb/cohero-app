// @ts-nocheck

/**
 * @fileOverview An AI flow to explain social work concepts and answer questions.
 * - explainConcept - Generates a comprehensive, studerende-oriented explanation or answer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { 
    ExplanationSchema,
    ExplainConceptOutputSchema, 
    type ExplainConceptInput,
    type ExplainConceptOutput,
    UsageSchema,
} from './types';
import { getCachedBooks } from './book-cache';
import { getRelevantLawContext } from '../../lib/law-context-helper';


const BookSchemaForPrompt = z.object({
  title: z.string(),
  author: z.string(),
  year: z.string().optional(),  
  RAG: z.string().optional().describe('Relevant content excerpts, keywords, and topics from the book for retrieval-augmented generation.'),
});


export async function explainConcept(input: ExplainConceptInput): Promise<ExplainConceptOutput> {
  return explainConceptFlow(input);
}

const PromptInputSchema = z.object({
  concept: z.string().describe('The concept, question, or topic to be explained/answered.'),
  profession: z.string().optional().describe('The profession of the user.'),
  books: z.array(BookSchemaForPrompt).optional().describe('Relevant curriculum books for context.'),
  lawContext: z.string().optional().describe('Deep legal context from the Law Portal.'),
});


const prompt = ai.definePrompt({
  name: 'explainConceptPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: ExplanationSchema },
  prompt: `Du er en ekspert i dansk socialfaglig praksis med dybdegående viden om socialt arbejde, pædagogik, jura og akademisk teori. Du skal besvare følgende spørgsmål/emne fra en studerende:

**SPØRGSMÅL/EMNE:** "{{{concept}}}"

{{#if profession}}
Brugeren arbejder som/studerer til: **{{{profession}}}**. 
Tilpas hele dit svar til denne professions konkrete udfordringer, fagsprog og praksis.
{{/if}}

{{#if lawContext}}
**JURIDISK KONTEKST (Fra Lovportalen):**
---
{{{lawContext}}}
---
**VIGTIGT:** Brug KUN dette som kilde til juridiske fakta. Citér paragrafnumre præcist. Gæt ikke på jura.
{{/if}}

{{#if books}}
**PENSUMLITTERATUR (Brug som teoretisk fundament):**
---
{{#each books}}
- **{{{this.title}}}** af {{{this.author}}}{{#if this.year}} ({{{this.year}}}){{/if}}: {{{this.RAG}}}
{{/each}}
---
{{/if}}

---

**DIN OPGAVE:**

Uanset om input er et enkelt begreb, et sammensat emne (f.eks. "individualisering som samfundsdynamik") eller et direkte spørgsmål (f.eks. "hvad er forskellen på servicelov og barnets lov?"), skal du give et grundigt, pædagogisk og fagligt stærkt svar.

Returnér et JSON-objekt med ALLE nedenstående felter udfyldt på DANSK og med HØJ FAGLIG KVALITET:

1. **definition**: 
   - Hvis det er et *begreb*: Giv en dybtgående og nuanceret definition med underoverskrifter (<h3>) for centrale dimensioner.
   - Hvis det er et *spørgsmål*: BESVAR spørgsmålet direkte og udtømmende. Brug <h3> til at strukturere delsvaret. Vær konkret og handlingsorienteret.
   - Hvis det er et *sammensat emne*: Syntetisér alle facetter i en sammenhængende forklaring.
   - Minimum 4-6 afsnit. Brug <p>, <h3>, <ul>, <li>, <strong>, <em> til strukturering.
   - Inkludér altid: kernedefinition, centrale komponenter, nuancer og eventuelle kontroverser.

2. **etymology**: Begrebets eller fænomenets oprindelse og historiske kontekst (inkl. årstal og nøglebegivenheder). Skriv i fulde sætninger.

3. **relevance**: Hvorfor er dette emne/spørgsmål AFGØRENDE for en socialfaglig professionel? Brug <ul> og <li> med konkrete punkter. Minimum 4 punkter.

4. **practicalExample**: ET konkret praksiseksempel fra dansk socialfaglig kontekst. Strukturér med:
   - <strong>Situation</strong>: Beskriv casen (borger, kontekst, problemstilling)
   - <strong>Faglig handling</strong>: Hvad gør den professionelle og HVORFOR? 
   - <strong>Faglig refleksion</strong>: Kobl til teori, lovgivning og etiske overvejelser.
   Skriv som en mini-case med fuld HTML-formatering.

5. **legalAnchor**: Præcis juridisk forankring. Angiv lovens fulde navn + konkrete paragrafnumre fra lovkonteksten ovenfor. 
   - **VIGTIGT:** Udfyld KUN hvis emnet har en DIREKTE juridisk forankring (f.eks. en konkret paragraf i serviceloven). 
   - Hvis emnet er rent teoretisk, sociologisk eller pædagogisk uden direkte lovhjemmel, skal dette felt være TOMT. 
   - Du må ALDRIG "opfinde" en juridisk forankring eller bruge generelle paragraffer der ikke passer præcist.

6. **criticalReflection**: En akademisk og kritisk refleksion. Adressér: 
   - Etiske dilemmaer eller magtforhold
   - Kritik af begrebet/tilgangen fra forskning eller praksis
   - Hvad mangler der – hvad kan metoden/tilgangen IKKE? 
   Skriv mindst 3 afsnit med HTML-formatering.

7. **suggestedLiterature**: 1-3 bøger KUN fra den vedlagte pensumliste, der bedst belyser emnet. Angiv specifikt hvilke kapitler/sider der er mest relevante baseret på RAG-information.

8. **relevantTheorists**: 2-4 centrale teoretikere. For HVER: navn, tidsperiode, specifikt bidrag til dette emne, og reference til pensumliste hvis muligt.

9. **relatedConcepts**: 4-5 relaterede begreber eller emner som studerende bør kende til i sammenhæng.

10. **socraticQuestion**: ÉT skarpt refleksionsskabende spørgsmål som en eksaminator ville stille. Gør det udfordrende og specifikt – ikke generisk.

11. **isModel**: True KUN hvis emnet er en konkret model/ramme der kan visualiseres (f.eks. Maslows behovspyramide, LØFT-modellen, ART, Brofenbrenner).

12. **conceptModel**: KUN udfyld hvis isModel er true. Lav en komplet graph med nodes og edges der visualiserer modellen.

13. **legalContext**: KUN udfyld med ORDRET lovtekst fra konteksten ovenfor. Angiv lov, paragraf, og den nøjagtige tekst. Udelad hvis ikke relevant.

14. **disambiguation**: Udfyld KUN hvis forespørgslen er bred og kan belyses fra flere faglige vinkler (f.eks. sociologisk, juridisk, etisk, praksisrettet). Giv 3-4 vinkler med titel, beskrivelse og raffineret søgeforespørgsel. Lad dette være TOMT hvis spørgsmålet allerede er specifikt.

---

**KVALITETSKRAV:**
- Svar altid fyldestgørende – studerende bruger dette til eksamensforberedelse og praksis
- Brug ALTID "borger" (aldrig "klient")
- Undgå generiske svar – vær specifik, faglig og præcis
- Hvis spørgsmålet er tvetydigt, vælg den mest sandsynlige socialfaglige fortolkning og besvar den
- Citér teorier med forfatter og årstal når muligt, f.eks. (Jensen, 2019)
- Definition-feltet er det vigtigste – investér mest kvalitet her
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
  model: 'googleai/gemini-2.5-pro',
});

const explainConceptFlow = ai.defineFlow(
  {
    name: 'explainConceptFlow',
    inputSchema: z.object({ concept: z.string(), profession: z.string().optional(), lawContext: z.string().optional() }),
    outputSchema: ExplainConceptOutputSchema,
  },
  async (input, { sendChunk }) => {
    // 1. Fetch all books
    const allBooks = await getCachedBooks();
    
    // 2. Smarter book filtering: expand keywords with Danish morphology approximation
    const rawKeywords = input.concept.toLowerCase().split(/[\s,;.?!]+/).filter(w => w.length > 2);
    
    // Generate keyword variants to handle Danish word forms
    const expandedKeywords = new Set<string>(rawKeywords);
    rawKeywords.forEach(kw => {
      // Remove common suffixes to get root form
      if (kw.endsWith('ing')) expandedKeywords.add(kw.slice(0, -3));
      if (kw.endsWith('else')) expandedKeywords.add(kw.slice(0, -4));
      if (kw.endsWith('ninger')) expandedKeywords.add(kw.slice(0, -6));
      if (kw.endsWith('elser')) expandedKeywords.add(kw.slice(0, -5));
      if (kw.endsWith('erne')) expandedKeywords.add(kw.slice(0, -4));
      if (kw.endsWith('ene')) expandedKeywords.add(kw.slice(0, -3));
      if (kw.endsWith('er')) expandedKeywords.add(kw.slice(0, -2));
      if (kw.endsWith('lig')) expandedKeywords.add(kw.slice(0, -3));
      if (kw.endsWith('hed')) expandedKeywords.add(kw.slice(0, -3));
      if (kw.endsWith('igt')) expandedKeywords.add(kw.slice(0, -3));
      // Truncated root forms for compound word matching
      if (kw.length > 6) {
        expandedKeywords.add(kw.substring(0, kw.length - 1));
        expandedKeywords.add(kw.substring(0, kw.length - 2));
      }
    });

    const keywordArray = Array.from(expandedKeywords).filter(kw => kw.length > 2);

    // Score each book by number of keyword matches
    const scoredBooks = allBooks
      .map(book => {
        const bookText = `${book.title} ${book.author} ${book.RAG || ''}`.toLowerCase();
        const score = keywordArray.filter(kw => bookText.includes(kw)).length;
        return { book, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Top 10 most relevant books
      .map(({ book }) => book);
    
    // Fallback: If no matches, send top 5 general books
    const booksForPrompt = scoredBooks.length > 0 ? scoredBooks : allBooks.slice(0, 5);
    
    let lawContext = input.lawContext || '';
    
    // 3. Fetch law context if not provided
    if (!lawContext) {
      console.log(`[EXPLAIN-CONCEPT] Fetching law context for: "${input.concept}"...`);
      try {
        lawContext = await getRelevantLawContext(input.concept);
      } catch (e) {
        console.error('[EXPLAIN-CONCEPT] Law context fetch failed:', e);
        lawContext = '';
      }
    }

    const streamRes = await prompt.stream({ 
        concept: input.concept, 
        profession: input.profession, 
        books: booksForPrompt, 
        lawContext 
    });

    for await (const chunk of streamRes.stream) {
      if (chunk.output) {
        sendChunk(chunk.output);
      }
    }

    const finalRes = await streamRes.response;
    
    return {
      data: finalRes.output!,
      usage: {
        inputTokens: finalRes.usage.inputTokens,
        outputTokens: finalRes.usage.outputTokens,
      },
    };
  }
);
