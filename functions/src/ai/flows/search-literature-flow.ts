// @ts-nocheck
/**
 * @fileOverview Semantic literature search flow.
 * Searches tocChunks via vector similarity and returns ranked book/chapter results.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDb } from './helpers';
import { FieldValue } from 'firebase-admin/firestore';

const SearchLiteratureInputSchema = z.object({
  query: z.string().describe('The search query — a concept, topic, research question, or keyword.'),
  limit: z.number().optional().default(20).describe('Max number of chunks to retrieve.'),
});

const ChapterMatchSchema = z.object({
  title: z.string(),
  pageNumber: z.string().optional(),
});

const BookResultSchema = z.object({
  bookId: z.string(),
  bookTitle: z.string(),
  bookAuthor: z.string(),
  bookYear: z.string().optional(),
  bookPublisher: z.string().optional(),
  bookEdition: z.string().optional(),
  apaCitation: z.string().optional(),
  matchingChapters: z.array(ChapterMatchSchema),
  chunkCount: z.number().describe('Number of matching chunks — used as relevance proxy.'),
});

const SearchLiteratureOutputSchema = z.object({
  query: z.string(),
  results: z.array(BookResultSchema),
  totalChunksFound: z.number(),
});

export const searchLiteratureFlow = ai.defineFlow(
  {
    name: 'searchLiteratureFlow',
    inputSchema: SearchLiteratureInputSchema,
    outputSchema: SearchLiteratureOutputSchema,
  },
  async (input) => {
    const { query, limit = 20 } = input;
    console.log(`[SEARCH-LITERATURE-FLOW] Query: "${query}"`);

    // 1. Generate embedding
    const queryEmbeddingRes = await ai.embed({
      embedder: 'googleai/gemini-embedding-2',
      content: query,
    });
    const queryVector = queryEmbeddingRes[0].embedding.slice(0, 768);

    // 2. Vector search
    const db = getDb();
    console.log(`[SEARCH-LITERATURE-FLOW] Running collectionGroup vector search...`);
    const snapshot = await db.collectionGroup('tocChunks')
      .findNearest('embedding', FieldValue.vector(queryVector), {
        limit,
        distanceMeasure: 'COSINE',
      })
      .get();

    console.log(`[SEARCH-LITERATURE-FLOW] Found ${snapshot.size} chunks.`);

    if (snapshot.empty) {
      return { query, results: [], totalChunksFound: 0 };
    }

    // 3. Group by bookId and collect matching chapters
    const grouped: Record<string, {
      bookTitle: string;
      bookAuthor: string;
      bookYear?: string;
      bookPublisher?: string;
      bookEdition?: string;
      apaCitation?: string;
      chapters: { title: string; pageNumber?: string }[];
    }> = {};

    snapshot.docs.forEach((doc: any) => {
      const d = doc.data();
      const bid = d.bookId || doc.ref.parent?.parent?.id || 'unknown';
      if (!grouped[bid]) {
        grouped[bid] = {
          bookTitle: d.bookTitle || 'Ukendt bog',
          bookAuthor: d.bookAuthor || '',
          bookYear: d.bookYear || '',
          bookPublisher: d.bookPublisher || '',
          bookEdition: d.bookEdition || '',
          apaCitation: d.bookApaCitation || '',
          chapters: [],
        };
      }
      // Avoid duplicate chapter titles
      const exists = grouped[bid].chapters.some(c => c.title === d.title);
      if (!exists) {
        grouped[bid].chapters.push({
          title: d.title || 'Ukendt kapitel',
          pageNumber: d.pageNumber || '',
        });
      }
    });

    // 4. Sort books by number of matching chunks (descending = most relevant first)
    const results = Object.entries(grouped)
      .map(([bookId, book]) => ({
        bookId,
        bookTitle: book.bookTitle,
        bookAuthor: book.bookAuthor,
        bookYear: book.bookYear || '',
        bookPublisher: book.bookPublisher || '',
        bookEdition: book.bookEdition || '',
        apaCitation: book.apaCitation || '',
        matchingChapters: book.chapters,
        chunkCount: book.chapters.length,
      }))
      .sort((a, b) => b.chunkCount - a.chunkCount);

    return {
      query,
      results,
      totalChunksFound: snapshot.size,
    };
  }
);
