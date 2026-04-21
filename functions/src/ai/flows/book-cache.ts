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


// STATIC TOOLS & METHODS (Official Social Work Tools)
const STATIC_SOCIAL_TOOLS: BookForPrompt[] = [
  {
    title: "De tre Huse",
    author: "Socialstyrelsen / Signs of Safety",
    RAG: "Redskab til samtaler med børn. Består af tre huse: 1. Huset med bekymringer (hvad bekymrer?), 2. Huset med de gode ting (hvad fungerer?), 3. Drømmehuset (hvad skal der ske?). Bruges til at få barnets perspektiv i en sag."
  },
  {
    title: "Dialoglinealen",
    author: "Socialstyrelsen",
    RAG: "Redskab med børnelineal på den ene side og smileys på den anden. Bruges til dialog med børn (både verbalt begrænsede og større børn) og forældre for at vurdere trivsel og perspektiv."
  },
  {
    title: "Dialogredskab – Kerneelementer",
    author: "Socialstyrelsen",
    RAG: "Hjælper med at skabe overblik over arbejdet med kerneelementer som 'Én familie – én indgang' og 'Sammen om familien'. Bruges til prioritering af fokusområder."
  },
  {
    title: "Implementeringsplan",
    author: "Socialstyrelsen",
    RAG: "Redskab til at skabe klarhed over opgaver, tidsplan og ansvar i implementeringen af en valgt model eller indsats."
  },
  {
    title: "Katalog over prøvehandlinger",
    author: "Socialstyrelsen",
    RAG: "Dokumenterer arbejdet med prøvehandlinger og skaber overblik over hvad der er afprøvet i praksis."
  },
  {
    title: "Netværkskortet",
    author: "Socialstyrelsen",
    RAG: "Værktøj hvor barnet/den unge udpeger relevante personer fra det private og professionelle netværk, som bør inddrages i sagen."
  },
  {
    title: "Procesfacilitering – Prøvehandlinger",
    author: "Socialstyrelsen",
    RAG: "Understøtter teamet i at udvikle prøvehandlinger gennem spørgsmål og procesforslag."
  },
  {
    title: "Tragtmodellen",
    author: "Socialstyrelsen",
    RAG: "Systematiserer sagsbehandlerens løbende faglige udredning. Hjælper med at prioritere oplysninger og foretage balancerede risikovurderinger ved at vægte både problemer og ressourcer."
  },
  {
    title: "Troldmanden og Feen",
    author: "Socialstyrelsen",
    RAG: "Svarende til De tre Huse, men målrettet børn i førskolealderen og indskolingen. Bruger visuelle figurer (Troldmand/Fe) til at tale om bekymringer og drømme."
  },
  {
    title: "Ægget",
    author: "Socialstyrelsen",
    RAG: "Illustrerer det faglige værktøj til at afdække barnets og familiens behov. Fokusområder: Familie og netværk samt Barnets udvikling."
  }
];

export async function getCachedBooks(): Promise<BookForPrompt[]> {
  const now = Date.now();
  if (cachedBooks && (now - lastFetchTime < CACHE_DURATION)) {
    return cachedBooks;
  }

  const firestore = getDb();
  let booksData: any[] = [];
  try {
    const booksSnapshot = await firestore.collection('books').get();
    booksData = booksSnapshot.docs.map(doc => doc.data());
  } catch (err) {
    console.error("Failed to fetch books from Firestore:", err);
  }

  const firestoreBooks = booksData.map(b => {
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

  cachedBooks = [...firestoreBooks, ...STATIC_SOCIAL_TOOLS];
  lastFetchTime = now;
  return cachedBooks;
}
