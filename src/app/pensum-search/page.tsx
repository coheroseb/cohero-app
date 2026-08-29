'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { SkeletonGrid } from '@/components/Skeleton';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Copy, 
  Check, 
  Loader2, 
  BrainCircuit, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  Filter,
  FileText,
  Volume2,
  Heart,
  Book,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query as firestoreQuery, orderBy } from 'firebase/firestore';
import { searchLiteratureAction, toggleLikeBookAction, toggleLikeChapterAction } from '@/app/actions';

// --- Types ---
interface ChapterMatch {
  title: string;
  pageNumber?: string;
  likesCount?: number;
  likedBy?: string[];
}

interface BookResult {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookYear?: string;
  bookPublisher?: string;
  bookEdition?: string;
  apaCitation?: string;
  matchingChapters: ChapterMatch[];
  chunkCount: number;
  likesCount?: number;
  likedBy?: string[];
}

interface SearchLiteratureOutput {
  query: string;
  results: BookResult[];
  totalChunksFound: number;
}

// Deterministic gradients for book cards
const getGradient = (title: string) => {
  const gradients = [
    'from-rose-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-blue-600 to-indigo-600',
    'from-violet-600 to-purple-600',
    'from-amber-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
  ];
  let sum = 0;
  for (let i = 0; i < title.length; i++) {
    sum += title.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
};

// Simple Danish stop-words check for Danish language filter
const isDanishBook = (title: string) => {
  const danishWords = ['og', 'i', 'af', 'en', 'et', 'eller', 'på', 'til', 'med', 'om', 'som', 'den', 'det', 'de', 'fra', 'for', 'socialt', 'pædagogik', 'metode', 'socialrådgivning', 'ret', 'lov', 'børn', 'unge', 'arbejde'];
  const words = title.toLowerCase().split(/[\s,.:;!?]+/);
  const hasDanishLetters = /[æøåÆØÅ]/.test(title);
  const hasDanishWords = words.some(w => danishWords.includes(w));
  return hasDanishLetters || hasDanishWords;
};

// APA Citation Copy Button Component
function CopyCitationButton({ citation }: { citation: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const cleanText = citation.replace(/\*/g, '');
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      toast({
        title: "Reference kopieret!",
        description: "APA-referencen er kopieret til din udklipsholder.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 active:scale-95 transition-all text-indigo-800 shrink-0 flex items-center justify-center gap-1.5 font-sans text-xs font-bold"
      title="Kopier APA-reference"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-600 animate-in fade-in zoom-in duration-200" />
          <span className="text-green-600">Kopieret!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-indigo-600" />
          <span>Kopiér APA</span>
        </>
      )}
    </button>
  );
}

// Main page content that uses SearchParams
function PensumSearchContent() {
  const { user, openAuthPage, userProfile } = useApp();
  const firestore = useFirestore();
  
  const booksQuery = useMemoFirebase(() => (firestore ? firestoreQuery(collection(firestore, 'books'), orderBy('title', 'asc')) : null), [firestore]);
  const { data: books, isLoading: booksLoading } = useCollection<any>(booksQuery);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const initialQuery = searchParams?.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BookResult[]>([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [relevanceFilter, setRelevanceFilter] = useState<'all' | 'high'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'da'>('all');

  const hasProAccess = userProfile?.membership === 'Kollega+' || userProfile?.membership === 'Semesterpakken' || userProfile?.role === 'admin';

  const handleLikeBook = async (bookId: string) => {
    if (!user) {
      toast({
        title: "Log venligst ind",
        description: "Du skal være logget ind for at kunne like bøger.",
        variant: "destructive"
      });
      openAuthPage('signin');
      return;
    }

    // Optimistic UI update
    setResults(prevResults => prevResults.map(book => {
      if (book.bookId === bookId) {
        const likedBy = book.likedBy || [];
        const index = likedBy.indexOf(user.uid);
        let newLikedBy = [...likedBy];
        let newLikesCount = book.likesCount || 0;
        if (index > -1) {
          newLikedBy.splice(index, 1);
          newLikesCount = Math.max(0, newLikesCount - 1);
        } else {
          newLikedBy.push(user.uid);
          newLikesCount += 1;
        }
        return {
          ...book,
          likedBy: newLikedBy,
          likesCount: newLikesCount
        };
      }
      return book;
    }));

    try {
      const res = await toggleLikeBookAction(bookId, user.uid);
      if (!res.success) {
        toast({
          title: "Fejl",
          description: res.error || "Kunne ikke gemme dit like. Prøv igen.",
          variant: "destructive"
        });
        // Rollback state by re-toggling
        setResults(prevResults => prevResults.map(book => {
          if (book.bookId === bookId) {
            const likedBy = book.likedBy || [];
            const index = likedBy.indexOf(user.uid);
            let newLikedBy = [...likedBy];
            let newLikesCount = book.likesCount || 0;
            if (index > -1) {
              newLikedBy.splice(index, 1);
              newLikesCount = Math.max(0, newLikesCount - 1);
            } else {
              newLikedBy.push(user.uid);
              newLikesCount += 1;
            }
            return {
              ...book,
              likedBy: newLikedBy,
              likesCount: newLikesCount
            };
          }
          return book;
        }));
      } else {
        toast({
          title: res.liked ? "Synes godt om" : "Fjernet synes godt om",
          description: res.liked ? "Du har nu liket denne bog." : "Du har fjernet dit like fra denne bog.",
        });
      }
    } catch (err) {
      console.error("Failed to toggle like on book:", err);
      // Rollback state by re-toggling
      setResults(prevResults => prevResults.map(book => {
        if (book.bookId === bookId) {
          const likedBy = book.likedBy || [];
          const index = likedBy.indexOf(user.uid);
          let newLikedBy = [...likedBy];
          let newLikesCount = book.likesCount || 0;
          if (index > -1) {
            newLikedBy.splice(index, 1);
            newLikesCount = Math.max(0, newLikesCount - 1);
          } else {
            newLikedBy.push(user.uid);
            newLikesCount += 1;
          }
          return {
            ...book,
            likedBy: newLikedBy,
            likesCount: newLikesCount
          };
        }
        return book;
      }));
    }
  };

  const handleLikeChapter = async (bookId: string, chapterTitle: string) => {
    if (!user) {
      toast({
        title: "Log venligst ind",
        description: "Du skal være logget ind for at kunne like kapitler.",
        variant: "destructive"
      });
      openAuthPage('signin');
      return;
    }

    // Optimistic UI update
    setResults(prevResults => prevResults.map(book => {
      if (book.bookId === bookId) {
        return {
          ...book,
          matchingChapters: book.matchingChapters.map(chap => {
            if (chap.title === chapterTitle) {
              const likedBy = chap.likedBy || [];
              const index = likedBy.indexOf(user.uid);
              let newLikedBy = [...likedBy];
              let newLikesCount = chap.likesCount || 0;
              if (index > -1) {
                newLikedBy.splice(index, 1);
                newLikesCount = Math.max(0, newLikesCount - 1);
              } else {
                newLikedBy.push(user.uid);
                newLikesCount += 1;
              }
              return {
                ...chap,
                likedBy: newLikedBy,
                likesCount: newLikesCount
              };
            }
            return chap;
          })
        };
      }
      return book;
    }));

    try {
      const res = await toggleLikeChapterAction(bookId, chapterTitle, user.uid);
      if (!res.success) {
        toast({
          title: "Fejl",
          description: res.error || "Kunne ikke gemme dit like. Prøv igen.",
          variant: "destructive"
        });
        // Rollback state by re-toggling
        setResults(prevResults => prevResults.map(book => {
          if (book.bookId === bookId) {
            return {
              ...book,
              matchingChapters: book.matchingChapters.map(chap => {
                if (chap.title === chapterTitle) {
                  const likedBy = chap.likedBy || [];
                  const index = likedBy.indexOf(user.uid);
                  let newLikedBy = [...likedBy];
                  let newLikesCount = chap.likesCount || 0;
                  if (index > -1) {
                    newLikedBy.splice(index, 1);
                    newLikesCount = Math.max(0, newLikesCount - 1);
                  } else {
                    newLikedBy.push(user.uid);
                    newLikesCount += 1;
                  }
                  return {
                    ...chap,
                    likedBy: newLikedBy,
                    likesCount: newLikesCount
                  };
                }
                return chap;
              })
            };
          }
          return book;
        }));
      } else {
        toast({
          title: res.liked ? "Synes godt om" : "Fjernet synes godt om",
          description: res.liked ? "Du har nu liket dette kapitel." : "Du har fjernet dit like fra dette kapitel.",
        });
      }
    } catch (err) {
      console.error("Failed to toggle like on chapter:", err);
      // Rollback state by re-toggling
      setResults(prevResults => prevResults.map(book => {
        if (book.bookId === bookId) {
          return {
            ...book,
            matchingChapters: book.matchingChapters.map(chap => {
              if (chap.title === chapterTitle) {
                const likedBy = chap.likedBy || [];
                const index = likedBy.indexOf(user.uid);
                let newLikedBy = [...likedBy];
                let newLikesCount = chap.likesCount || 0;
                if (index > -1) {
                  newLikedBy.splice(index, 1);
                  newLikesCount = Math.max(0, newLikesCount - 1);
                } else {
                  newLikedBy.push(user.uid);
                  newLikesCount += 1;
                }
                return {
                  ...chap,
                  likedBy: newLikedBy,
                  likesCount: newLikesCount
                };
              }
              return chap;
            })
          };
        }
        return book;
      }));
    }
  };

  // Search input placeholder rotation list
  const placeholders = [
    'Anerkendelse i pædagogik og socialt arbejde...',
    'Bourdieu habitus felt kapital...',
    'Handleplan og borgerinddragelse...',
    'Magtrelationer i socialrådgivning...',
    'Kvalitative metoder i socialt arbejde...'
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Trigger search on mount if query in URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    setQuery(trimmed);

    // Update URL search parameter
    const params = new URLSearchParams(window.location.search);
    params.set('q', trimmed);
    router.replace(`${window.location.pathname}?${params.toString()}`);

    try {
      const response = await searchLiteratureAction(trimmed, 25);
      if (response && response.results) {
        setResults(response.results);
        setTotalChunks(response.totalChunksFound || 0);
      } else {
        setResults([]);
        setTotalChunks(0);
      }
    } catch (err: any) {
      console.error("[PensumSearch] Search failed:", err);
      setError("Der skete en fejl under søgningen. Prøv venligst igen.");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (term: string) => {
    handleSearch(term);
  };

  // Filtered results
  const filteredResults = results.filter(book => {
    // 1. Relevance filter
    if (relevanceFilter === 'high' && book.chunkCount < 3) {
      return false;
    }
    // 2. Language filter
    if (languageFilter === 'da' && !isDanishBook(book.bookTitle)) {
      return false;
    }
      if (!hasProAccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-32">
        {/* ── Sticky Top Header ───────────────────────────── */}
        <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 sticky top-0 z-30">
          <PageHeader
            title="Pensumsøgning"
            subtitle="Søg semantisk på tværs af din uddannelse."
            icon={<Search className="w-5 h-5" />}
            iconColor="bg-indigo-50 text-indigo-600"
            className="mb-0"
            backHref="/portal"
          />
        </div>

        <main className="grow max-w-5xl mx-auto w-full px-4 sm:px-6 pt-8 space-y-12">
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/90 shadow-sm relative overflow-hidden space-y-6">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <BrainCircuit className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Lås op for Pensumsøgning</h2>
              <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed">
                Pensumsøgning og konkrete litteraturhenvisninger til kapitler og sidetal er eksklusivt for Kollega+ og Semesterpakken. Vi vejleder dig præcist til, hvor i dit eget pensum du finder stoffet.
              </p>
            </div>
            <Link href="/upgrade" className="inline-block pt-2">
              <button className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-sm">
                Opgrader til Kollega+
              </button>
            </Link>
          </div>

          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-700">
                <Crown className="w-3.5 h-3.5 fill-current text-indigo-600" /> Bogbase
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Søg semantisk i hele din uddannelse</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto font-medium">
                Med Kollega+ kan du søge efter præcise kapitler og sidetal på tværs af alle disse lærebøger:
              </p>
            </div>

            {booksLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Indlæser pensumbøger...</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 pb-12">
                {books?.map((book: any) => (
                  <div key={book.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                    <div className="w-12 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 text-indigo-400">
                      <Book className="w-6 h-6" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-sm font-black text-slate-900 leading-snug truncate">{book.title}</h4>
                      <p className="text-xs font-semibold text-slate-400 truncate">{book.author}</p>
                      {book.year && <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{book.year} • {book.publisher || 'Pensum'}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Tab State
  const [activeTab, setActiveTab] = useState<'results' | 'library'>('results');

  // Automatically switch tab on search
  useEffect(() => {
    if (searched) {
      setActiveTab('results');
    }
  }, [searched]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-32">
      
      {/* ── Sticky Top Header ───────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200/80 px-6 sm:px-8 py-4 sticky top-0 z-30">
        <PageHeader
          title="Pensumsøgning"
          icon={<Search className="w-5 h-5" />}
          iconColor="bg-indigo-50 text-indigo-600"
          className="mb-0"
          backHref="/portal"
          actions={
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-2xl shadow-sm">
              <Crown className="w-4 h-4 text-indigo-600 fill-current" />
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">Kollega+</span>
            </div>
          }
        />
      </div>

      <main className="grow max-w-5xl mx-auto w-full px-4 sm:px-6 pt-8 space-y-8">
        
        {/* ── Search Bar Console ──────────────────────────── */}
        <div className="space-y-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
            className="bg-white p-3 sm:p-4 rounded-3xl shadow-sm border border-slate-200/90 relative group transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-all shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholders[placeholderIndex]}
                disabled={loading}
                className="grow bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-bold text-base sm:text-lg px-2 h-12 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-slate-600 p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm shrink-0 ${
                  loading || !query.trim() 
                  ? 'bg-slate-100 text-slate-300' 
                  : 'bg-slate-900 hover:bg-indigo-600 text-white active:scale-95'
                }`}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </form>

          {/* Copyright Safe Indicator */}
          <div className="text-center">
            <p className="text-[11px] sm:text-xs font-medium text-slate-400 leading-relaxed max-w-2xl mx-auto">
              <strong>Bemærk:</strong> Du søger semantisk efter <span className="text-indigo-600 font-bold">kapitler, sidetal og kildehenvisninger</span> i pensumlitteraturen.
            </p>
          </div>

          {/* Quick-Search Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-1">Hurtige emner:</span>
            {[
              'Bourdieu kapital',
              'Anerkendende pædagogik',
              'Barnets lov',
              'Socialt arbejde',
              'Magtrelationer'
            ].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleChipClick(term)}
                className="px-3.5 py-1.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200/80 active:scale-95 rounded-2xl text-xs font-bold text-slate-600 transition-all shadow-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200/80 pb-px">
            <button
              onClick={() => setActiveTab('results')}
              className={`pb-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'results' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>Søgeresultater</span>
              {searched && filteredResults.length > 0 && (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-full border border-indigo-100">
                  {filteredResults.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('library')}
              className={`pb-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'library' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>Kendte pensumbøger</span>
              {books && books.length > 0 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full">
                  {books.length}
                </span>
              )}
            </button>
          </div>

          {/* ── TAB 1: SEARCH RESULTS ─────────────────────── */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              
              {/* Skeletons Loading State */}
              {loading && (
                <div className="pt-4">
                  <SkeletonGrid count={2} columns="grid-cols-1" variant="book" />
                </div>
              )}

              {/* Error Message */}
              {!loading && error && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-2 shadow-sm">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-sm font-bold text-rose-950">{error}</p>
                </div>
              )}

              {/* Search Result Output */}
              {!loading && searched && !error && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Summary and Filters Bar */}
                  <div className="bg-white border border-slate-200/90 shadow-sm rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Søgestatus</p>
                      <p className="text-slate-900 font-bold mt-0.5 text-xs sm:text-sm">
                        Fandt <span className="text-indigo-600 font-black">{filteredResults.length}</span> {filteredResults.length === 1 ? 'bog' : 'bøger'} der matcher din søgning.
                      </p>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                          onClick={() => setRelevanceFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            relevanceFilter === 'all' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Alle
                        </button>
                        <button
                          onClick={() => setRelevanceFilter('high')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            relevanceFilter === 'high' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                          }`}
                          title="Vis kun bøger med 3+ matchende afsnit"
                        >
                          Høj relevans
                        </button>
                      </div>

                      <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                          onClick={() => setLanguageFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            languageFilter === 'all' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Alle sprog
                        </button>
                        <button
                          onClick={() => setLanguageFilter('da')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            languageFilter === 'da' 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Dansk
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Empty Results Screen */}
                  {filteredResults.length === 0 && (
                    <EmptyState
                      title="Ingen resultater fundet"
                      description="Søgeordet gav ingen resultater i pensumdatabasen. Prøv at søge på et andet begreb eller sociologisk teori."
                      icon={<BookOpen className="w-6 h-6 text-slate-300" />}
                    />
                  )}

                  {/* Book Cards List */}
                  {filteredResults.length > 0 && (
                    <div className="space-y-6">
                      <AnimatePresence mode="popLayout">
                        {filteredResults.map((book, index) => {
                          const relevanceScore = book.chunkCount;
                          const badgeText = relevanceScore >= 4 ? 'Højeste relevans' : relevanceScore >= 2 ? 'Relevant' : 'Relateret';
                          const badgeColor = relevanceScore >= 4 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : relevanceScore >= 2 
                            ? 'bg-sky-50 text-sky-700 border-sky-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200';

                          const matchStrength = Math.min(100, Math.max(50, 50 + (relevanceScore * 10)));
                          
                          return (
                            <motion.div
                              key={book.bookId}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.3, delay: index * 0.04 }}
                              className="bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 rounded-3xl p-6 sm:p-8 transition-all group overflow-hidden"
                            >
                              <div className="flex flex-col md:flex-row items-start gap-6 sm:gap-8">
                                
                                {/* Book Spine Cover */}
                                <div className="shrink-0 mx-auto md:mx-0">
                                  <div className={`w-28 h-40 bg-gradient-to-br ${getGradient(book.bookTitle)} rounded-2xl shadow-md flex flex-col justify-between p-4 text-white relative overflow-hidden group-hover:scale-105 transition-all duration-300`}>
                                    <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                                    <div className="w-1.5 h-full bg-white/20 absolute top-0 left-2.5 blur-[0.5px]" />
                                    
                                    <div className="space-y-1 relative z-10">
                                      <BookOpen className="w-5 h-5 opacity-80" />
                                      <p className="text-[8px] font-black uppercase tracking-widest leading-tight text-white/90 truncate max-w-[80px]">
                                        {book.bookAuthor}
                                      </p>
                                    </div>
                                    <div className="relative z-10">
                                      <p className="text-[10px] font-black leading-tight tracking-tight line-clamp-3 uppercase">
                                        {book.bookTitle}
                                      </p>
                                      {book.bookYear && (
                                        <p className="text-[8px] font-bold text-white/70 mt-1">({book.bookYear})</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Book Meta and Details */}
                                <div className="flex-1 space-y-5 w-full">
                                  
                                  {/* Title block */}
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1.5 flex-grow">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-2.5 py-0.5 border text-[10px] font-black uppercase tracking-wider rounded-md ${badgeColor}`}>
                                          {badgeText}
                                        </span>
                                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-md tracking-wider">
                                          {matchStrength}% Match
                                        </span>
                                      </div>
                                      <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                                        {book.bookTitle}
                                      </h3>
                                      <p className="text-xs sm:text-sm font-bold text-slate-500">
                                        af {book.bookAuthor} {book.bookYear ? `(${book.bookYear})` : ''} 
                                        {book.bookEdition ? ` • ${book.bookEdition}` : ''}
                                      </p>
                                    </div>

                                    {/* Book Like Button */}
                                    <button
                                      onClick={() => handleLikeBook(book.bookId)}
                                      className={`p-2.5 rounded-2xl border transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 ${
                                        user && book.likedBy?.includes(user.uid)
                                        ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                                        : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                                      }`}
                                      title={user && book.likedBy?.includes(user.uid) ? "Fjern synes godt om" : "Synes godt om denne bog"}
                                    >
                                      <Heart 
                                        className={`w-4 h-4 transition-transform ${
                                          user && book.likedBy?.includes(user.uid) 
                                          ? 'fill-rose-500 text-rose-500' 
                                          : ''
                                        }`} 
                                      />
                                      <span className="text-xs font-bold">
                                        {book.likesCount || 0}
                                      </span>
                                    </button>
                                  </div>

                                  {/* Matching chunks list */}
                                  <div className="space-y-2.5 pt-1">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                      Relevante kapitler og afsnit ({book.chunkCount})
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {book.matchingChapters.map((chapter, cIdx) => (
                                        <div 
                                          key={cIdx} 
                                          className="flex items-center justify-between gap-4 p-3.5 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all"
                                        >
                                          <div className="min-w-0 flex-grow">
                                            <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">
                                              {chapter.title}
                                            </h4>
                                            {chapter.pageNumber && (
                                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                Side {chapter.pageNumber}
                                              </p>
                                            )}
                                          </div>

                                          {/* Chapter Heart Button */}
                                          <button
                                            onClick={() => handleLikeChapter(book.bookId, chapter.title)}
                                            className={`px-2.5 py-1 rounded-xl border transition-all active:scale-95 flex items-center gap-1 shrink-0 ${
                                              user && chapter.likedBy?.includes(user.uid)
                                              ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                                              : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                                            }`}
                                            title={user && chapter.likedBy?.includes(user.uid) ? "Fjern synes godt om" : "Synes godt om dette kapitel"}
                                          >
                                            <Heart 
                                              className={`w-3.5 h-3.5 ${
                                                user && chapter.likedBy?.includes(user.uid) 
                                                ? 'fill-rose-500 text-rose-500' 
                                                : ''
                                              }`} 
                                            />
                                            <span className="text-[10px] font-bold">
                                              {chapter.likesCount || 0}
                                            </span>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* APA Citation copy panel */}
                                  {book.apaCitation && (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                                      <div className="text-xs text-slate-700 leading-relaxed min-w-0">
                                        <span className="font-black text-[9px] text-indigo-600 uppercase tracking-wider block mb-0.5">
                                          APA 7. udgave reference
                                        </span>
                                        <span className="font-bold italic block truncate sm:max-w-md md:max-w-lg" title={book.apaCitation}>
                                          {book.apaCitation}
                                        </span>
                                      </div>
                                      <CopyCitationButton citation={book.apaCitation} />
                                    </div>
                                  )}

                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  )}

                </div>
              )}

              {/* Empty Search Prompt */}
              {!loading && !searched && (
                <EmptyState
                  title="Klar til din litteratursøgning"
                  description="Indtast et teoretisk emne, en sociolog, et begreb eller en problemstilling ovenfor, så gennemsøger vi alt relevant studielitteratur med det samme."
                  icon={<BookOpen className="w-6 h-6 text-slate-300" />}
                />
              )}
            </div>
          )}

          {/* ── TAB 2: FULL BOOK DATABASE ─────────────────── */}
          {activeTab === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white border border-slate-200/90 shadow-sm rounded-3xl p-6 sm:p-7 space-y-2">
                <h4 className="text-base font-black text-slate-900 tracking-tight">Pensumsamling – hvad kan du søge i?</h4>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  Vores semantiske søgemotor kender metadata og indholdsfortegnelser for de mest populære lærebøger på socialrådgiver-studiet. Herunder kan du se listen over de faglitterære værker, der er indekseret i systemet:
                </p>
              </div>

              {booksLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Henter pensumbøger...</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4 pb-12">
                  {books?.map((book: any) => (
                    <div key={book.id} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
                      <div className="w-12 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 text-indigo-400">
                        <Book className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 leading-snug truncate">{book.title}</h4>
                        <p className="text-xs font-semibold text-slate-400 truncate">{book.author}</p>
                        {book.year && <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{book.year} • {book.publisher || 'Pensum'}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}

// Main page component wrapped in Suspense
export default function PensumSearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    }>
      <PensumSearchContent />
    </Suspense>
  );
}
