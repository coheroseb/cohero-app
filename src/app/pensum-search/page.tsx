'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/app/provider';
import { useToast } from '@/hooks/use-toast';
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
  const { user, openAuthPage } = useApp();
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
    return true;
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-24 font-sans selection:bg-indigo-100">
      
      {/* Top Banner Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <Link href="/portal" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-wider bg-white px-5 py-3 rounded-full border border-slate-100 shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          Tilbage til portalen
        </Link>
      </div>

      <main className="max-w-5xl mx-auto px-6 pt-12 space-y-12">
        
        {/* Header Title Section */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-xl mx-auto mb-6">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tighter serif leading-tight">
            Semantisk Pensumsøgning
          </h1>
          <p className="text-slate-500 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            Søg efter emner, teorier eller begreber på tværs af hele din uddannelses pensumliste. 
            Vores AI finder de mest relevante bøger og præcise kapitler.
          </p>
        </div>

        {/* Search Form Area */}
        <div className="max-w-3xl mx-auto w-full">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
            className="bg-white/80 backdrop-blur-3xl p-3.5 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.06)] border border-slate-100 relative group transition-all duration-500 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-all duration-500">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholders[placeholderIndex]}
                disabled={loading}
                className="grow bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-bold text-lg px-2 h-14"
              />
              <button 
                type="submit"
                disabled={loading || !query.trim()}
                className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-lg ${
                  loading || !query.trim() 
                  ? 'bg-slate-100 text-slate-300' 
                  : 'bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-slate-900/20'
                }`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
              </button>
            </div>
          </form>

          {/* Quick-Search Chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2">Prøv at søge:</span>
            {[
              'Bourdieu kapital',
              'Anerkendende pædagogik',
              'Barnets lov',
              'Socialt arbejde',
              'Magtrelationer'
            ].map((term) => (
              <button
                key={term}
                onClick={() => handleChipClick(term)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 active:scale-95 rounded-full text-xs font-bold text-slate-600 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        {/* Results Area */}
        <div className="space-y-6">
          
          {/* Skeletons Loading State */}
          {loading && (
            <div className="space-y-6 max-w-3xl mx-auto pt-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="h-5 bg-slate-100 rounded-full w-48 animate-pulse" />
                <div className="h-5 bg-slate-100 rounded-full w-24 animate-pulse" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 space-y-4 animate-pulse">
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-24 bg-slate-100 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-grow">
                      <div className="h-6 bg-slate-100 rounded-full w-2/3" />
                      <div className="h-4 bg-slate-100 rounded-full w-1/3" />
                    </div>
                  </div>
                  <div className="h-[1px] bg-slate-50 w-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-100 rounded-full w-5/6" />
                    <div className="h-4 bg-slate-100 rounded-full w-4/6" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {!loading && error && (
            <div className="max-w-md mx-auto bg-rose-50 border border-rose-100 rounded-[2rem] p-6 text-center space-y-4 shadow-sm">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
              <p className="text-sm font-bold text-rose-950">{error}</p>
            </div>
          )}

          {/* Search Result Output */}
          {!loading && searched && !error && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {/* Summary and Filters Bar */}
              <div className="bg-white border border-slate-100/60 shadow-[0_15px_40px_rgba(0,0,0,0.02)] rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-4xl mx-auto">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Søgestatus</h3>
                  <p className="text-slate-900 font-bold mt-1 text-sm">
                    Fandt <span className="text-indigo-600">{filteredResults.length}</span> {filteredResults.length === 1 ? 'bog' : 'bøger'} ud af {results.length} oprindelige fund.
                  </p>
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Filtre:</span>
                  </div>
                  
                  {/* Relevance filter */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setRelevanceFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        relevanceFilter === 'all' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      onClick={() => setRelevanceFilter('high')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        relevanceFilter === 'high' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title="Vis kun bøger med 3+ matchende afsnit"
                    >
                      Høj Relevans
                    </button>
                  </div>

                  {/* Language filter */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setLanguageFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        languageFilter === 'all' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Alle sprog
                    </button>
                    <button
                      onClick={() => setLanguageFilter('da')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        languageFilter === 'da' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Kun Dansk
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty Results Screen */}
              {filteredResults.length === 0 && (
                <div className="max-w-md mx-auto text-center py-16 space-y-6">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">Ingen resultater fundet</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Søgeordet gav ingen resultater i databasen, der matcher dine valgte filtre. Prøv at søge bredere eller juster filtrene.
                    </p>
                  </div>
                </div>
              )}

              {/* Book Cards Grid */}
              {filteredResults.length > 0 && (
                <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                  <AnimatePresence mode="popLayout">
                    {filteredResults.map((book, index) => {
                      const relevanceScore = book.chunkCount;
                      const badgeText = relevanceScore >= 4 ? 'Meget relevant' : relevanceScore >= 2 ? 'Relevant' : 'Relateret';
                      const badgeColor = relevanceScore >= 4 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : relevanceScore >= 2 
                        ? 'bg-sky-50 text-sky-700 border-sky-100' 
                        : 'bg-slate-100 text-slate-600 border-transparent';
                      
                      return (
                        <motion.div
                          key={book.bookId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="bg-white border border-slate-100/80 shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-8 transition-all group overflow-hidden relative"
                        >
                          {/* Inner cover graphic decorations */}
                          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${getGradient(book.bookTitle)} opacity-[0.02] rounded-full blur-xl group-hover:scale-150 transition-all duration-700 pointer-events-none`} />

                          <div className="flex flex-col md:flex-row items-start gap-8">
                            
                            {/* Book Spine Cover Element */}
                            <div className="shrink-0 mx-auto md:mx-0">
                              <div className={`w-28 h-40 bg-gradient-to-br ${getGradient(book.bookTitle)} rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.15)] flex flex-col justify-between p-4 text-white relative overflow-hidden group-hover:rotate-1 transition-all duration-500`}>
                                <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                                <div className="w-1.5 h-full bg-white/20 absolute top-0 left-2.5 blur-[0.5px]" />
                                
                                <div className="space-y-1 relative z-10">
                                  <BookOpen className="w-5 h-5 opacity-80" />
                                  <p className="text-[7px] font-black uppercase tracking-widest leading-tight text-white/90 truncate max-w-[80px]">
                                    {book.bookAuthor}
                                  </p>
                                </div>
                                <div className="relative z-10">
                                  <p className="text-[10px] font-black leading-tight tracking-tight line-clamp-3 uppercase serif">
                                    {book.bookTitle}
                                  </p>
                                  {book.bookYear && (
                                    <p className="text-[8px] font-bold text-white/70 mt-1">({book.bookYear})</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Book Meta and Details */}
                            <div className="flex-1 space-y-6 w-full">
                              
                              {/* Title block */}
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-grow">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2.5 py-0.5 border text-[9px] font-black uppercase tracking-widest rounded-full ${badgeColor}`}>
                                      {badgeText}
                                    </span>
                                    {book.bookPublisher && (
                                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-bold uppercase rounded-md">
                                        {book.bookPublisher}
                                      </span>
                                    )}
                                  </div>
                                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight serif group-hover:text-indigo-600 transition-colors">
                                    {book.bookTitle}
                                  </h2>
                                  <p className="text-sm font-bold text-slate-500 leading-none">
                                    af {book.bookAuthor} {book.bookYear ? `(${book.bookYear})` : ''} 
                                    {book.bookEdition ? ` · ${book.bookEdition}` : ''}
                                  </p>
                                </div>

                                {/* Book Like Button */}
                                <button
                                  onClick={() => handleLikeBook(book.bookId)}
                                  className={`p-2.5 rounded-2xl border transition-all duration-300 active:scale-90 flex items-center justify-center gap-2 shrink-0 ${
                                    user && book.likedBy?.includes(user.uid)
                                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm shadow-rose-500/5'
                                    : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                                  }`}
                                  title={user && book.likedBy?.includes(user.uid) ? "Fjern synes godt om" : "Synes godt om denne bog"}
                                >
                                  <Heart 
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                      user && book.likedBy?.includes(user.uid) 
                                      ? 'fill-rose-500 text-rose-500 scale-110' 
                                      : ''
                                    }`} 
                                  />
                                  <span className="text-xs font-bold font-sans">
                                    {book.likesCount || 0}
                                  </span>
                                </button>
                              </div>

                              {/* Matching chunks list */}
                              <div className="space-y-3">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                  Relevante kapitler og afsnit ({book.chunkCount})
                                </p>
                                <div className="grid grid-cols-1 gap-2.5">
                                  {book.matchingChapters.map((chapter, cIdx) => (
                                    <div 
                                      key={cIdx} 
                                      className="flex items-center justify-between gap-4 p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-200"
                                    >
                                      <div className="min-w-0 flex-grow">
                                        <h4 className="text-xs font-bold text-slate-800 leading-snug truncate">
                                          {chapter.title}
                                        </h4>
                                        {chapter.pageNumber && (
                                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                                            Side {chapter.pageNumber}
                                          </p>
                                        )}
                                      </div>

                                      {/* Chapter Heart Button */}
                                      <button
                                        onClick={() => handleLikeChapter(book.bookId, chapter.title)}
                                        className={`px-3 py-1.5 rounded-xl border transition-all duration-300 active:scale-95 flex items-center gap-1.5 shrink-0 ${
                                          user && chapter.likedBy?.includes(user.uid)
                                          ? 'bg-rose-50/70 border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5'
                                          : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                                        }`}
                                        title={user && chapter.likedBy?.includes(user.uid) ? "Fjern synes godt om" : "Synes godt om dette kapitel"}
                                      >
                                        <Heart 
                                          className={`w-3.5 h-3.5 transition-transform duration-300 ${
                                            user && chapter.likedBy?.includes(user.uid) 
                                            ? 'fill-rose-500 text-rose-500 scale-110' 
                                            : ''
                                          }`} 
                                        />
                                        <span className="text-[10px] font-bold font-sans">
                                          {chapter.likesCount || 0}
                                        </span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* APA Citation copy panel */}
                              {book.apaCitation && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-indigo-950/[0.02] border border-indigo-950/[0.06] rounded-2xl">
                                  <div className="text-xs text-slate-700 leading-relaxed font-sans min-w-0">
                                    <span className="font-black text-[9px] text-indigo-950/40 uppercase tracking-widest block mb-1 leading-none">
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
            <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 mx-auto shadow-sm">
                <BookOpen className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight serif">Klar til din litteratursøgning</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
                  Indtast et teoretisk emne, en sociolog, et begreb eller en problemstilling ovenfor, så gennemsøger vi alt relevant studielitteratur med det samme.
                </p>
              </div>
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
