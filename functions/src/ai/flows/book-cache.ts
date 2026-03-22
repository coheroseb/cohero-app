// @ts-nocheck
import { getDb } from './helpers';

interface BookForPrompt {
  title: string;
  author: string;
  year?: string;
  RAG?: string;
}

let cachedBooks: BookForPrompt[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

export async function getCachedBooks(): Promise<BookForPrompt[]> {
  const now = Date.now();
  if (cachedBooks && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedBooks;
  }

  const firestore = getDb();
  const booksSnapshot = await firestore.collection('books').get();
  const booksData = booksSnapshot.docs.map(doc => doc.data());

  cachedBooks = booksData.map(b => {
    let ragText = b.RAG || '';
    try {
      const ragJson = JSON.parse(ragText);
      if (Array.isArray(ragJson)) {
        ragText = ragJson.map(item => `- ${item}`).join('\n');
      } else if (typeof ragJson === 'object') {
        ragText = JSON.stringify(ragJson, null, 2);
      }
    } catch (e) {
      /* ignore, it's just a string */
    }

    return {
      title: b.title || '',
      author: b.author || '',
      year: b.year || '',
      RAG: ragText,
    };
  });

  lastFetchTime = now;
  return cachedBooks;
}
