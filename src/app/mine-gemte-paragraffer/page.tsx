
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bookmark, 
  Trash2, 
  Loader2, 
  Scale,
  FileText,
  Calendar,
  History,
  ChevronRight,
  Gavel,
  BookmarkCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink as ExternalLinkIcon,
  FolderPlus,
  Folders,
  MoreVertical,
  Plus,
  X,
  FileStack,
  Copy,
  ChevronDown,
  FolderKanban,
  Info
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc, onSnapshot, addDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LiveStatusBadge } from '@/components/lov-portal/LiveStatusBadge';

interface SavedParagraph {
  id: string;
  lawId: string;
  lawTitle: string;
  lawAbbreviation: string;
  paragraphNumber: string;
  fullText: string;
  savedAt: { toDate: () => Date };
  externalUrl?: string;
  collectionId?: string;
}

interface CollectionData {
    id: string;
    name: string;
    createdAt: { toDate: () => Date };
}

interface LawConfig {
  id: string;
  name: string;
  abbreviation: string;
  xmlUrl: string;
  lbk: string;
}

export default function MineGemteParagrafferPage() {
    const { user, isUserLoading, userProfile } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();

    const [activeCollectionId, setActiveCollectionId] = useState<string | 'all'>('all');
    const [isCreatingCollection, setIsCreatingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isMovingParaId, setIsMovingParaId] = useState<string | null>(null);
    const [showBibliography, setShowBibliography] = useState(false);
    const [copiedCitation, setCopiedCitation] = useState<string | null>(null);

    // Fetch laws configs to get base XML URLs for main laws
    const lawsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'laws')) : null, [firestore]);
    const { data: lawsConfigs } = useCollection<LawConfig>(lawsQuery);

    // Fetch collections
    const collectionsQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'collections'), orderBy('createdAt', 'desc')) : null
    ), [user, firestore]);
    const { data: collections } = useCollection<CollectionData>(collectionsQuery);

    // Fetch saved paragraphs & highlights
    const savedParagraphsQuery = useMemoFirebase(() => (
        user && firestore ? query(collection(firestore, 'users', user.uid, 'savedParagraphs'), orderBy('savedAt', 'desc')) : null
    ), [user, firestore]);
    const { data: paragraphs, isLoading } = useCollection<SavedParagraph>(savedParagraphsQuery);
    
    const filteredParagraphs = useMemo(() => {
        if (!paragraphs) return [];
        if (activeCollectionId === 'all') return paragraphs;
        return paragraphs.filter(p => p.collectionId === activeCollectionId);
    }, [paragraphs, activeCollectionId]);

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore || !newCollectionName.trim()) return;
        try {
            await addDoc(collection(firestore, 'users', user.uid, 'collections'), {
                name: newCollectionName.trim(),
                createdAt: serverTimestamp()
            });
            setNewCollectionName('');
            setIsCreatingCollection(false);
            toast({ title: "Samling oprettet" });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke oprette samling." });
        }
    };

    const handleDeleteCollection = async (id: string, name: string) => {
        if (!user || !firestore || !window.confirm(`Er du sikker på, du vil slette samlingen "${name}"?`)) return;
        
        try {
            const batch = writeBatch(firestore);
            const parasToReset = paragraphs?.filter(p => p.collectionId === id) || [];
            parasToReset.forEach(p => {
                batch.update(doc(firestore, 'users', user.uid, 'savedParagraphs', p.id), {
                    collectionId: null
                });
            });
            batch.delete(doc(firestore, 'users', user.uid, 'collections', id));
            await batch.commit();
            
            if (activeCollectionId === id) setActiveCollectionId('all');
            toast({ title: "Samling slettet" });
        } catch (e) {
            console.error(e);
        }
    };

    const handleMoveToCollection = async (paraId: string, colId: string | null) => {
        if (!user || !firestore) return;
        try {
            await updateDoc(doc(firestore, 'users', user.uid, 'savedParagraphs', paraId), {
                collectionId: colId
            });
            setIsMovingParaId(null);
            toast({ title: colId ? "Flyttet til samling" : "Fjernet fra samling" });
        } catch (e) {
            console.error(e);
        }
    };

    const handleUnsave = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !firestore) return;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'savedParagraphs', id));
            toast({ title: "Paragraf fjernet" });
        } catch (error) {
            console.error("Error unsaving paragraph:", error);
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke fjerne paragraffen." });
        }
    };

    const bibliographyText = useMemo(() => {
        if (!filteredParagraphs || filteredParagraphs.length === 0) return "";
        const lawGroups = new Map<string, SavedParagraph>();
        filteredParagraphs.forEach(p => {
            if (!lawGroups.has(p.lawTitle)) {
                lawGroups.set(p.lawTitle, p);
            }
        });
        const sortedEntries = Array.from(lawGroups.values()).sort((a, b) => a.lawTitle.localeCompare(b.lawTitle, 'da'));
        return sortedEntries.map(entry => `${entry.lawTitle}. (u.å.).`).join('\n\n');
    }, [filteredParagraphs]);

    if (isUserLoading || isLoading) {
        return <AuthLoadingScreen />;
    }

    return (
        <div className="bg-[#FDFCF8] min-h-screen">
            <header className="bg-white border-b border-amber-100 pt-20 pb-16 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <Link href="/portal" className="w-14 h-14 bg-white border border-amber-100 rounded-2xl flex items-center justify-center hover:bg-amber-50 transition-all group">
                            <ArrowLeft className="w-6 h-6 text-amber-950 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <History className="w-4 h-4 text-amber-700" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Juridisk Arkiv</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-amber-950 serif tracking-tighter">Mine Gemte Paragraffer</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {activeCollectionId !== 'all' && (
                            <Button onClick={() => setShowBibliography(true)} className="rounded-xl bg-amber-950 shadow-xl shadow-amber-950/20">
                                <FileStack className="w-4 h-4 mr-2" />
                                Generer Litteraturliste
                            </Button>
                        )}
                        <Link href="/lov-portal">
                            <Button variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50">
                                Find flere i Lovportalen
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12">
                
                {/* SIDEBAR: COLLECTIONS */}
                <aside className="w-full lg:w-72 shrink-0 space-y-8">
                    <section className="bg-white p-6 rounded-[2rem] border border-amber-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mine Samlinger</h3>
                            <button 
                                onClick={() => setIsCreatingCollection(true)} 
                                className="p-2 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-950 hover:text-white transition-all shadow-sm"
                                title="Opret ny samling"
                            >
                                <FolderPlus className="w-5 h-5" />
                            </button>
                        </div>

                        {isCreatingCollection && (
                            <form onSubmit={handleCreateCollection} className="mb-6 animate-ink">
                                <div className="space-y-3">
                                    <Input 
                                        autoFocus
                                        value={newCollectionName}
                                        onChange={e => setNewCollectionName(e.target.value)}
                                        placeholder="Navn på samling..."
                                        className="h-12 text-sm rounded-xl"
                                    />
                                    <div className="flex gap-2">
                                        <Button type="submit" size="sm" className="flex-1 rounded-lg">Opret</Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingCollection(false)} className="rounded-lg">Annuller</Button>
                                    </div>
                                </div>
                            </form>
                        )}

                        <nav className="space-y-1">
                            <button 
                                onClick={() => setActiveCollectionId('all')}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${activeCollectionId === 'all' ? 'bg-amber-950 text-white shadow-lg' : 'text-slate-500 hover:bg-amber-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <Folders className={`w-4 h-4 ${activeCollectionId === 'all' ? 'text-amber-400' : 'text-slate-300'}`} />
                                    Alle
                                </div>
                                <span className={`text-[10px] font-black ${activeCollectionId === 'all' ? 'text-amber-400/50' : 'text-slate-300'}`}>{paragraphs?.length || 0}</span>
                            </button>
                            
                            {collections?.map(col => {
                                const count = paragraphs?.filter(p => p.collectionId === col.id).length || 0;
                                return (
                                    <div key={col.id} className="relative group/col">
                                        <button 
                                            onClick={() => setActiveCollectionId(col.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between pr-10 ${activeCollectionId === col.id ? 'bg-amber-50 text-amber-950 border border-amber-200' : 'text-slate-500 hover:bg-amber-50'}`}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <div className={`w-2 h-2 rounded-full ${activeCollectionId === col.id ? 'bg-amber-600 animate-pulse' : 'bg-amber-200'}`}></div>
                                                <span className="truncate">{col.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300">{count}</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteCollection(col.id, col.name)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-rose-600 opacity-0 group-hover/col:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )
                            })}
                        </nav>
                    </section>
                    
                    <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-800 leading-relaxed italic">
                            Samlinger hjælper dig med at organisere kilder til forskellige moduler eller eksamensopgaver. Når du vælger en samling, kan du generere en færdig litteraturliste.
                        </p>
                    </div>
                </aside>

                {/* CONTENT: PARAGRAPHS */}
                <div className="flex-1 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-2xl font-bold text-amber-950 serif flex items-center gap-3">
                            <FolderKanban className="w-6 h-6 text-amber-700" />
                            {activeCollectionId === 'all' ? 'Hovedoversigt' : collections?.find(c => c.id === activeCollectionId)?.name}
                        </h2>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{filteredParagraphs.length} kilder</span>
                    </div>

                    {!paragraphs || paragraphs.length === 0 ? (
                        <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-amber-200 shadow-inner animate-ink">
                            <Bookmark className="w-12 h-12 text-amber-100 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold text-lg">Dit arkiv er tomt</p>
                            <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">Gå til <Link href="/lov-portal" className="underline font-semibold text-amber-700">Lovportalen</Link> for at gemme din første paragraf eller reference.</p>
                        </div>
                    ) : filteredParagraphs.length === 0 ? (
                        <div className="py-24 text-center bg-white/50 rounded-[3rem] border border-dashed border-amber-100 shadow-inner">
                            <p className="text-slate-400 italic">Ingen paragraffer i denne samling endnu.</p>
                            <Button variant="ghost" size="sm" onClick={() => setActiveCollectionId('all')} className="mt-4 text-amber-900 font-bold">Se alle gemte</Button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {filteredParagraphs.map(para => {
                                const lawId = para.lawId || 'reference';
                                const isReference = !!para.externalUrl;
                                const portalHref = isReference 
                                    ? `/lov-portal?lawId=${lawId}&refId=${para.id}&xmlUrl=${encodeURIComponent(para.externalUrl + '/xml')}&title=${encodeURIComponent(para.paragraphNumber + ' ' + para.lawTitle)}&para=${encodeURIComponent(para.paragraphNumber)}`
                                    : `/lov-portal/view/${lawId}?para=${encodeURIComponent(para.paragraphNumber)}`;

                                const targetXmlUrl = para.externalUrl ? para.externalUrl + '/xml' : lawsConfigs?.find(l => l.id === para.lawId)?.xmlUrl;

                                return (
                                    <div 
                                        key={para.id}
                                        className="group bg-white rounded-[2.5rem] border border-amber-100 shadow-sm hover:shadow-xl hover:border-amber-950 transition-all flex flex-col overflow-hidden animate-fade-in-up"
                                    >
                                        <div className="p-8">
                                            <div className="flex items-start justify-between mb-8">
                                                <Link href={portalHref} className="flex items-center gap-6 flex-1 min-w-0">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-amber-900 font-black serif text-2xl shadow-inner shrink-0 ${isReference ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50'}`}>
                                                        {isReference ? <ExternalLinkIcon className="w-7 h-7" /> : para.paragraphNumber.split(',')[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-3 mb-1.5">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 shrink-0">{para.lawAbbreviation}</p>
                                                            <div className="w-1 h-1 bg-slate-200 rounded-full shrink-0"></div>
                                                            <LiveStatusBadge xmlUrl={targetXmlUrl} />
                                                        </div>
                                                        <h3 className="text-base font-bold text-amber-950 truncate group-hover:text-amber-700 transition-colors">{para.lawTitle}</h3>
                                                    </div>
                                                </Link>
                                                
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <button 
                                                            onClick={() => setIsMovingParaId(isMovingParaId === para.id ? null : para.id)}
                                                            className={`p-3 rounded-xl transition-all shadow-sm ${isMovingParaId === para.id ? 'bg-amber-950 text-white' : 'bg-slate-50 text-slate-400 hover:bg-amber-100 hover:text-amber-900'}`}
                                                            title="Organisér i samling"
                                                        >
                                                            <Folders className="w-5 h-5" />
                                                        </button>
                                                        {isMovingParaId === para.id && (
                                                            <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-amber-100 rounded-2xl shadow-2xl z-20 py-3 animate-ink">
                                                                <p className="px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-amber-50 mb-2 text-left">Vælg Samling</p>
                                                                <button onClick={() => handleMoveToCollection(para.id, null)} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-rose-50 text-rose-600 flex items-center gap-3">
                                                                    <X className="w-4 h-4"/> Fjern fra samling
                                                                </button>
                                                                <div className="max-h-48 overflow-y-auto">
                                                                    {collections?.map(c => (
                                                                        <button key={c.id} onClick={() => handleMoveToCollection(para.id, c.id)} className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-amber-50 text-amber-950 truncate flex items-center gap-3 group/item">
                                                                            <div className={`w-1.5 h-1.5 rounded-full ${para.collectionId === c.id ? 'bg-amber-600' : 'bg-slate-200 group-hover/item:bg-amber-400'}`}></div>
                                                                            {c.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {(!collections || collections.length === 0) && (
                                                                    <p className="px-4 py-4 text-[10px] text-slate-400 italic text-center">Ingen samlinger endnu.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => handleUnsave(e, para.id)}
                                                        className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                        title="Slet permanent"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <Link href={portalHref} className="block group/text">
                                                <div className="prose prose-sm max-w-none text-slate-600 leading-[1.8] italic border-l-4 border-amber-100 pl-6 mb-8 line-clamp-4 group-hover/text:text-amber-950 transition-colors">
                                                    "{para.fullText}"
                                                </div>
                                            </Link>

                                            <div className="flex items-center justify-between pt-6 border-t border-amber-50">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {para.savedAt?.toDate().toLocaleDateString('da-DK')}
                                                    </div>
                                                    {para.collectionId && (
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-amber-700 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
                                                            <Folders className="w-3.5 h-3.5" />
                                                            {collections?.find(c => c.id === para.collectionId)?.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[10px] font-bold text-amber-900 serif">{para.paragraphNumber}</span>
                                                    <Link href={portalHref} className="text-[10px] font-black uppercase tracking-widest text-amber-950 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                                                        Læs i Lovportalen <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* BIBLIOGRAPHY MODAL */}
            {showBibliography && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-amber-950/70 backdrop-blur-md" onClick={() => setShowBibliography(false)}></div>
                    <div className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-8 border-b border-amber-100 bg-white flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
                                    <FileStack className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-amber-950 serif">Din Litteraturliste</h2>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Baseret på "{collections?.find(c => c.id === activeCollectionId)?.name}"</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBibliography(false)} className="p-2 text-slate-400 hover:text-amber-950 transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="p-8 bg-white border border-amber-100 rounded-3xl shadow-inner min-h-[250px] relative group">
                                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed italic select-all">
                                    {bibliographyText || "Ingen kilder tilgængelige for generering."}
                                </pre>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(bibliographyText);
                                        setCopiedCitation('list');
                                        toast({ title: "Kopieret!" });
                                        setTimeout(() => setCopiedCitation(null), 2000);
                                    }}
                                    className="absolute top-4 right-4 p-3 bg-amber-50 text-amber-900 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                >
                                    {copiedCitation === 'list' ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            <div className="bg-blue-50 text-blue-800 text-xs p-5 rounded-2xl border border-blue-100 flex items-start gap-4 italic leading-relaxed">
                                <Info className="w-6 h-6 shrink-0 mt-0.5 text-blue-600" />
                                <span>Denne liste er formateret efter APA 7 standarden. Husk altid at tjekke for korrekte årstal og LBK-numre i den endelige lovtekst, da denne liste er vejledende.</span>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Button variant="ghost" onClick={() => setShowBibliography(false)}>Luk</Button>
                                <Button onClick={() => {
                                    navigator.clipboard.writeText(bibliographyText);
                                    toast({ title: "Kopieret til udklipsholder" });
                                }} disabled={!bibliographyText} className="rounded-xl h-12 px-8">
                                    <Copy className="w-4 h-4 mr-2" /> Kopier Liste
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
