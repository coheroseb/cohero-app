'use client';

import React, { useState } from 'react';
import { 
  Upload, 
  Book, 
  Loader2, 
  Check, 
  X, 
  Plus, 
  ArrowLeft,
  FileText,
  Save,
  Zap,
  Image as ImageIcon,
  Trash2,
  ChevronRight,
  Search,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { processBookTocAction, saveBookAction, fetchBookMetadataAction, listBooksAction, deleteBookAction } from '@/app/actions';

function parseAuthors(rawAuthors: string) {
    const majorParts = rawAuthors.split(/\s+(?:og|and|&)\s+/i).map(p => p.trim()).filter(Boolean);
    const allAuthors: string[] = [];
    for (const part of majorParts) {
        const commaParts = part.split(',').map(s => s.trim()).filter(Boolean);
        const merged: string[] = [];
        for (let i = 0; i < commaParts.length; i++) {
            const current = commaParts[i];
            const isInitials = /^[A-Z]\.?\s*([A-Z]\.?\s*)*$/i.test(current) && current.length <= 4;
            if (isInitials && merged.length > 0) {
                const prevIdx = merged.length - 1;
                merged[prevIdx] = `${merged[prevIdx]}, ${current}`;
            } else {
                merged.push(current);
            }
        }
        allAuthors.push(...merged);
    }
    return allAuthors;
}

function formatAuthorName(author: string) {
    const authors = parseAuthors(author);
    const formattedParts = authors.map(part => {
        if (part.includes(',')) {
            const [last, first] = part.split(',').map(s => s.trim());
            const isInitials = /^[A-Z]\.?\s*([A-Z]\.?\s*)*$/i.test(first);
            if (isInitials) {
                return part;
            } else {
                const initials = first.split(/\s+/).map(n => `${n.charAt(0).toUpperCase()}.`).join(' ');
                return `${last}, ${initials}`;
            }
        }
        const nameWords = part.split(/\s+/);
        if (nameWords.length > 1) {
            const lastName = nameWords[nameWords.length - 1];
            const firstNames = nameWords.slice(0, nameWords.length - 1);
            const initials = firstNames.map(f => `${f.charAt(0).toUpperCase()}.`).join(' ');
            return `${lastName}, ${initials}`;
        }
        return part;
    });
    if (formattedParts.length > 1) {
        const lastAuthor = formattedParts.pop();
        return `${formattedParts.join(', ')} & ${lastAuthor}`;
    }
    return formattedParts[0] || '';
}

function formatApaCitation(author: string, year: string, title: string, edition: string, publisher: string) {
    const formattedAuthor = formatAuthorName(author) || 'Ukendt forfatter';
    const formattedYear = year.trim() ? `(${year.trim()})` : '(n.d.)';
    const formattedTitle = title.trim() ? `*${title.trim()}*` : 'Ukendt titel';

    let formattedEdition = '';
    if (edition && edition.trim()) {
        const ed = edition.trim();
        if (/\d/.test(ed) && !/[a-zA-Z]/.test(ed)) {
            formattedEdition = ` (${ed}. udg.)`;
        } else {
            formattedEdition = ` (${ed})`;
        }
    }

    const formattedPublisher = publisher && publisher.trim() ? `${publisher.trim()}.` : '';

    let citation = `${formattedAuthor} ${formattedYear}. ${formattedTitle}${formattedEdition}.`;
    if (formattedPublisher) {
        citation += ` ${formattedPublisher}`;
    }
    return citation;
}

interface TocItem {
    title: string;
    pageNumber: string;
}

export default function AdminBooksPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // Form state
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [year, setYear] = useState('');
    const [publisher, setPublisher] = useState('');
    const [edition, setEdition] = useState('');
    const [apaCitation, setApaCitation] = useState('');
    const [isApaEdited, setIsApaEdited] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isIsbnLoading, setIsIsbnLoading] = useState(false);
    const [extractedToc, setExtractedToc] = useState<TocItem[]>([]);

    // List state
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
    const [books, setBooks] = useState<any[]>([]);
    const [isLoadingBooks, setIsLoadingBooks] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    React.useEffect(() => {
        if (!isApaEdited) {
            setApaCitation(formatApaCitation(author, year, title, edition, publisher));
        }
    }, [author, year, title, edition, publisher, isApaEdited]);

    const fetchBooks = async () => {
        setIsLoadingBooks(true);
        try {
            const res = await listBooksAction();
            if (res.success && res.books) {
                setBooks(res.books);
            } else {
                throw new Error(res.error || "Kunne ikke hente bøger.");
            }
        } catch (error: any) {
            toast({
                title: "Fejl ved hentning af bøger",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoadingBooks(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'list') {
            fetchBooks();
        }
    }, [activeTab]);

    const copyToClipboard = (text: string, id: string) => {
        // Strip markdown stars for clipboard copy
        const cleanText = text.replace(/\*/g, '');
        navigator.clipboard.writeText(cleanText);
        setCopiedId(id);
        toast({
            title: "Reference kopieret",
            description: "APA-referencen er nu kopieret til udklipsholderen.",
        });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteBook = async (bookId: string, bookTitle: string) => {
        if (!confirm(`Er du sikker på, at du vil slette "${bookTitle}" og alle tilhørende vector-chunks? Dette kan ikke fortrydes.`)) {
            return;
        }

        try {
            const res = await deleteBookAction(bookId);
            if (res.success) {
                toast({
                    title: "Bog slettet",
                    description: `"${bookTitle}" er slettet succesfuldt.`,
                });
                setBooks(prev => prev.filter(b => b.id !== bookId));
            } else {
                throw new Error(res.error || "Kunne ikke slette bogen.");
            }
        } catch (error: any) {
            toast({
                title: "Fejl under sletning",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    const handleIsbnLookup = async () => {
        if (!isbn || isbn.length < 10) {
            toast({
                title: "Ugyldigt ISBN",
                description: "Indtast venligst et gyldigt ISBN-nummer.",
                variant: "destructive"
            });
            return;
        }

        setIsIsbnLoading(true);
        try {
            const res = await fetchBookMetadataAction(isbn);
            if (res.success && res.metadata) {
                if (res.metadata.title) setTitle(res.metadata.title);
                if (res.metadata.author) setAuthor(res.metadata.author);
                if (res.metadata.year) setYear(res.metadata.year);
                if (res.metadata.publisher) setPublisher(res.metadata.publisher);
                if (res.metadata.edition) setEdition(res.metadata.edition);
                setIsApaEdited(false);
                toast({
                    title: "Bog fundet!",
                    description: `Hentede info for: ${res.metadata.title}`,
                });
            } else {
                throw new Error(res.error || "Kunne ikke finde bogen.");
            }
        } catch (error: any) {
            toast({
                title: "ISBN Opslag fejlede",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsIsbnLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...files]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleProcess = async () => {
        if (selectedImages.length === 0) return;
        
        setIsProcessing(true);
        try {
            const base64Images = await Promise.all(selectedImages.map(file => {
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }));

            const res = await processBookTocAction({ images: base64Images });
            
            if (res.success && res.toc) {
                setExtractedToc(res.toc);
                toast({
                    title: "Analyse færdig",
                    description: `Fandt ${res.toc.length} punkter i indholdsfortegnelsen.`,
                });
            } else {
                throw new Error(res.error || "Kunne ikke analysere billederne.");
            }
        } catch (error: any) {
            toast({
                title: "Fejl ved analyse",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (!title || extractedToc.length === 0) {
            toast({
                title: "Mangler data",
                description: "Indtast venligst en titel og sørg for at indholdsfortegnelsen er udtrukket.",
                variant: "destructive"
            });
            return;
        }

        setIsSaving(true);
        try {
            const res = await saveBookAction({
                title,
                author,
                year,
                publisher,
                edition,
                apaCitation,
                toc: extractedToc
            });

            if (res.success) {
                toast({
                    title: "Bog gemt",
                    description: `${title} er nu oprettet med ${extractedToc.length} afsnit.`,
                });
                
                // Clear state and switch back to list view
                setTitle('');
                setAuthor('');
                setIsbn('');
                setYear('');
                setPublisher('');
                setEdition('');
                setExtractedToc([]);
                setSelectedImages([]);
                setIsApaEdited(false);
                setActiveTab('list');
            } else {
                throw new Error(res.error || "Kunne ikke gemme bogen.");
            }
        } catch (error: any) {
            toast({
                title: "Fejl ved lagring",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredBooks = books.filter(b => 
        (b.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.author || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.publisher || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.apaCitation || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => {
                                if (activeTab === 'add') {
                                    setActiveTab('list');
                                } else {
                                    router.push('/admin');
                                }
                            }}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-[950] text-slate-950 tracking-tight">
                                {activeTab === 'list' ? 'Bogdatabase' : 'Digitaliser Bog'}
                            </h1>
                            <p className="text-sm font-bold text-slate-500">
                                {activeTab === 'list' 
                                    ? 'Oversigt over digitaliserede og vector-mappede bøger' 
                                    : 'Upload indholdsfortegnelse og opret Vector-mapping'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {activeTab === 'list' ? (
                            <Button 
                                onClick={() => setActiveTab('add')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Digitaliser Ny Bog
                            </Button>
                        ) : (
                            <>
                                <Button 
                                    variant="outline"
                                    onClick={() => {
                                        setActiveTab('list');
                                        setTitle('');
                                        setAuthor('');
                                        setIsbn('');
                                        setYear('');
                                        setPublisher('');
                                        setEdition('');
                                        setExtractedToc([]);
                                        setSelectedImages([]);
                                        setIsApaEdited(false);
                                    }}
                                    className="rounded-xl h-12 px-6 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Annuller
                                </Button>
                                <Button 
                                    onClick={handleSave}
                                    disabled={isSaving || extractedToc.length === 0}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Gem Bog
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {activeTab === 'list' ? (
                <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
                    {/* Search and Stats bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Søg efter titel, forfatter, forlag..."
                                className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                            <div>Total: <span className="text-slate-900 font-black">{books.length}</span></div>
                            <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                            <div>Vektoriseret: <span className="text-emerald-600 font-black">{books.filter(b => b.status === 'vectorized').length}</span></div>
                        </div>
                    </div>

                    {/* Books Grid */}
                    {isLoadingBooks ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Henter bøger...</span>
                        </div>
                    ) : filteredBooks.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                                <Book className="w-8 h-8" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Ingen bøger fundet</h3>
                            <p className="text-xs text-slate-400 max-w-sm mt-1">
                                {searchQuery ? 'Prøv at søge efter noget andet eller nulstil søgefeltet.' : 'Der er ikke tilføjet nogen bøger til databasen endnu. Klik på "Digitaliser Ny Bog" for at starte.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredBooks.map((book) => (
                                <motion.div 
                                    key={book.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
                                >
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                            <Book className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <h3 className="text-base font-[950] text-slate-950 truncate leading-snug">
                                                {book.title}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 font-bold">
                                                <span>{book.author}</span>
                                                {book.year && (
                                                    <>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{book.year}</span>
                                                    </>
                                                )}
                                                {book.publisher && (
                                                    <>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{book.publisher}</span>
                                                    </>
                                                )}
                                                {book.edition && (
                                                    <>
                                                        <span className="text-slate-300">•</span>
                                                        <span>{book.edition}. udg.</span>
                                                    </>
                                                )}
                                            </div>
                                            
                                            {/* APA citation block */}
                                            {book.apaCitation && (
                                                <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl relative group/cite flex items-start justify-between gap-4 max-w-2xl">
                                                    <div className="text-[11px] text-slate-600 font-serif italic pr-8 leading-relaxed">
                                                        {book.apaCitation.split('*').map((part: string, i: number) => 
                                                            i % 2 === 1 ? <em key={i} className="font-bold not-italic">{part}</em> : part
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => copyToClipboard(book.apaCitation, book.id)}
                                                        className="p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 absolute right-2 top-2 transition-all"
                                                        title="Kopier reference"
                                                    >
                                                        {copiedId === book.id ? (
                                                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                                                        ) : (
                                                            <Copy className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                                        <div className="flex items-center gap-2">
                                            {book.status === 'vectorized' ? (
                                                <span className="h-8 px-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                                    <Zap className="w-3 h-3 text-amber-500" />
                                                    {book.tocLength} afsnit
                                                </span>
                                            ) : (
                                                <span className="h-8 px-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">
                                                    {book.status}
                                                </span>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteBook(book.id, book.title)}
                                            className="p-3 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl text-slate-400 hover:text-rose-600 transition-all flex items-center justify-center"
                                            title="Slet bog"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* Left Column: Upload & Info */
                <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-[950] text-slate-950 mb-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
                                        <Book className="w-4 h-4" />
                                    </div>
                                    Bog Information
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={isbn}
                                            onChange={(e) => setIsbn(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleIsbnLookup()}
                                            placeholder="ISBN"
                                            className="h-8 w-32 px-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleIsbnLookup}
                                        disabled={isIsbnLoading || !isbn}
                                        variant="ghost"
                                        className="h-8 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        {isIsbnLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                                        Hent info
                                    </Button>
                                </div>
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Titel</label>
                                    <input 
                                        type="text" 
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="F.eks. Introduktion til Bourdieu"
                                        className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Forfatter</label>
                                    <input 
                                        type="text" 
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        placeholder="F.eks. Staf Callewaert"
                                        className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Årstal</label>
                                        <input 
                                            type="text" 
                                            value={year}
                                            onChange={(e) => setYear(e.target.value)}
                                            placeholder="2019"
                                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Udgave</label>
                                        <input 
                                            type="text" 
                                            value={edition}
                                            onChange={(e) => setEdition(e.target.value)}
                                            placeholder="2"
                                            className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Forlag</label>
                                        <input 
                                            type="text" 
                                            value={publisher}
                                            onChange={(e) => setPublisher(e.target.value)}
                                            placeholder="Akademisk Forlag"
                                            className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">APA 7 Reference</label>
                                        {isApaEdited && (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setIsApaEdited(false);
                                                    setApaCitation(formatApaCitation(author, year, title, edition, publisher));
                                                }}
                                                className="text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 outline-none"
                                            >
                                                Gendan automatisk
                                            </button>
                                        )}
                                    </div>
                                    <textarea 
                                        value={apaCitation}
                                        onChange={(e) => {
                                            setApaCitation(e.target.value);
                                            setIsApaEdited(true);
                                        }}
                                        placeholder="Gemmes som APA-reference"
                                        className="w-full min-h-[80px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-600 outline-none transition-all resize-y"
                                    />
                                    <div className="mt-2 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Live APA Preview</span>
                                        <div className="text-xs text-slate-700 font-serif italic">
                                            {apaCitation.split('*').map((part, i) => i % 2 === 1 ? <em key={i} className="font-bold not-italic">{part}</em> : part)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h2 className="text-lg font-[950] text-slate-950 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-600">
                                    <ImageIcon className="w-4 h-4" />
                                </div>
                                Indholdsfortegnelse (Billeder)
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {selectedImages.map((file, idx) => (
                                    <div key={idx} className="relative aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 group">
                                        <img 
                                            src={URL.createObjectURL(file)} 
                                            alt={`TOC ${idx}`} 
                                            className="w-full h-full object-cover"
                                        />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-2 right-2 w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer transition-all group">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tilføj Billede</span>
                                    <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                                </label>
                            </div>

                            <Button 
                                onClick={handleProcess}
                                disabled={isProcessing || selectedImages.length === 0}
                                className="w-full h-16 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Analyserer med AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-5 h-5 text-amber-400" />
                                        <span>Udlæs Struktur</span>
                                    </>
                                )}
                            </Button>
                        </section>
                    </div>

                    {/* Right Column: AI Result */}
                    <div className="space-y-8">
                        <section className="bg-slate-950 rounded-[2.5rem] p-8 shadow-2xl min-h-[400px] flex flex-col">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-[950] text-white flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    Udtrukket Struktur
                                </h2>
                                {extractedToc.length > 0 && (
                                    <div className="px-3 py-1 bg-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                        {extractedToc.length} Punkter
                                    </div>
                                )}
                            </div>

                            {extractedToc.length > 0 ? (
                                <div className="space-y-3 flex-1 overflow-auto max-h-[600px] pr-4 custom-scrollbar">
                                    {extractedToc.map((item, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={idx} 
                                            className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <span className="text-[10px] font-black text-white/30">{idx + 1}</span>
                                                <input 
                                                    type="text" 
                                                    value={item.title}
                                                    onChange={(e) => {
                                                        const newToc = [...extractedToc];
                                                        newToc[idx].title = e.target.value;
                                                        setExtractedToc(newToc);
                                                    }}
                                                    className="bg-transparent text-sm font-bold text-white outline-none focus:text-emerald-400 transition-colors w-full"
                                                />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="text" 
                                                    value={item.pageNumber}
                                                    onChange={(e) => {
                                                        const newToc = [...extractedToc];
                                                        newToc[idx].pageNumber = e.target.value;
                                                        setExtractedToc(newToc);
                                                    }}
                                                    placeholder="Side"
                                                    className="w-12 bg-white/10 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-black text-white text-center outline-none"
                                                />
                                                <button 
                                                    onClick={() => setExtractedToc(prev => prev.filter((_, i) => i !== idx))}
                                                    className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    <Button 
                                        onClick={() => setExtractedToc(prev => [...prev, { title: 'Nyt afsnit', pageNumber: '' }])}
                                        className="w-full py-4 border-2 border-dashed border-white/10 bg-transparent text-white/50 hover:bg-white/5 hover:border-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Tilføj punkt manuelt
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20 mb-6">
                                        <Zap className="w-10 h-10" />
                                    </div>
                                    <p className="text-white font-bold text-sm">Ingen struktur udtrukket endnu</p>
                                    <p className="text-white/40 text-[11px] mt-2 max-w-[200px]">Upload billeder af indholdsfortegnelsen og tryk på "Udlæs Struktur" for at starte AI'en.</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
