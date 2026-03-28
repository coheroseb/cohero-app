'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Gavel, Plus, Copy, Trash2, Link as LinkIcon, Loader2, BookCopy, AlertTriangle, Book, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractLawInfoAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { writeBatch, doc, serverTimestamp, increment, collection } from 'firebase/firestore';

type SourceType = 'lov' | 'bekendtgørelse' | 'vejledning' | 'principmeddelelse' | 'databeskyttelsesforordning' | 'bog' | 'kapitel-i-bog' | 'hjemmeside' | 'rapport' | 'tidsskrift' | 'video-podcast';

interface SourceEntry {
    id: string;
    type: SourceType;
    formatted: string;
    inText: string;
    sortKey: string;
    createdAt: number;
}

interface SourceData {
    // Common fields
    titel: string;
    nummer?: string;
    dato?: string;
    url?: string;
    // Amendment fields
    senestÆndretNummer?: string;
    senestÆndretDato?: string;
    // Special field for 'lov'
    lovbekendtgørelseNummer?: string;
    lovbekendtgørelseDato?: string;
    forkortelse?: string;
    // Academic fields
    author?: string;
    year?: string;
    publisher?: string;
    organization?: string;
    // Chapter / Journal fields
    chapterTitle?: string;
    bookEditor?: string;
    pageRange?: string;
    journalTitle?: string;
    volume?: string;
    issue?: string;
    doi?: string;
}

const formatDateForCitation = (dateString?: string): string => {
    if (!dateString) return '';
    const parts = dateString.split(/[\.\/]/);
    if (parts.length !== 3) return dateString;
    const [day, month, year] = parts;
    const monthNames = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
    const monthIndex = parseInt(month, 10) - 1;
    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateString;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${parseInt(day, 10)}. ${monthNames[monthIndex]} ${fullYear}`;
};

const formatBibliographyAuthors = (authorsInput: string = ''): string => {
    if (!authorsInput) return '';
    const authors = authorsInput.split(';').map(a => a.trim()).filter(Boolean);
    if (authors.length === 0) return '';
    if (authors.length === 1) return authors[0];
    const last = authors.pop();
    return `${authors.join(', ')} & ${last}`;
};

const formatInTextAuthors = (authorsInput: string = ''): string => {
    if (!authorsInput) return 'Forfatter';
    const authors = authorsInput.split(';').map(a => a.trim().split(',')[0]);
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
    return `${authors[0]} et al.`;
};

const formatEditorNamesForCitation = (namesInput: string = ''): string => {
    if (!namesInput) return '';
    const names = namesInput.split(';').map(n => n.trim()).filter(Boolean);
    const reorderedNames = names.map(name => {
        const parts = name.split(',').map(p => p.trim());
        if (parts.length === 2) {
            const [lastName, initials] = parts;
            return `${initials} ${lastName}`;
        }
        return name;
    });
    if (reorderedNames.length === 0) return '';
    if (reorderedNames.length === 1) return reorderedNames[0];
    const last = reorderedNames.pop();
    return `${reorderedNames.join(', ')} & ${last}`;
};

function KildeGeneratorPageContent() {
    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const [sourceType, setSourceType] = useState<SourceType>('lov');
    const [currentSource, setCurrentSource] = useState<Partial<SourceData>>({titel: '', forkortelse: ''});
    const [sourceList, setSourceList] = useState<SourceEntry[]>([]);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Persist list to local storage
    useEffect(() => {
        const saved = localStorage.getItem('cohero-citation-list');
        if (saved) {
            try {
                setSourceList(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load source list", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('cohero-citation-list', JSON.stringify(sourceList));
    }, [sourceList]);

    const copyToClipboard = (text: string, field: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatSource = () => {
        const { 
            titel, nummer, dato, senestÆndretNummer, senestÆndretDato, 
            lovbekendtgørelseNummer, lovbekendtgørelseDato, author, 
            year, publisher, chapterTitle, bookEditor, pageRange,
            url, organization, journalTitle, volume, issue, doi
        } = currentSource;
        
        let base = '';
        
        switch (sourceType) {
            case 'lov':
                if (!titel) return '';
                base = `<em>${titel}</em>`;
                if (lovbekendtgørelseNummer && lovbekendtgørelseDato) {
                    base = `<em>${titel}</em>, jf. lovbekendtgørelse nr. ${lovbekendtgørelseNummer} af ${formatDateForCitation(lovbekendtgørelseDato)}`;
                } else if (nummer && dato) {
                    base = `<em>${titel}</em>, jf. lov nr. ${nummer} af ${formatDateForCitation(dato)}`;
                }
                if (senestÆndretNummer && senestÆndretDato) {
                    base += `, som senest ændret ved lov nr. ${senestÆndretNummer} af ${formatDateForCitation(senestÆndretDato)}`;
                }
                base += '.';
                break;
            case 'bekendtgørelse':
                if (!titel || !nummer || !dato) return '';
                base = `<em>${titel}</em>, jf. bkg. nr. ${nummer} af ${formatDateForCitation(dato)}.`;
                break;
            case 'vejledning':
                if (!titel || !nummer || !dato) return '';
                base = `<em>${titel}</em>, jf. vejl. nr. ${nummer} af ${formatDateForCitation(dato)}.`;
                break;
            case 'principmeddelelse':
                if (!titel) return '';
                base = `Ankestyrelsens principmeddelelse ${titel}.`;
                break;
            case 'databeskyttelsesforordning':
                base = `Databeskyttelsesforordningen, Europa-Parlamentets og Rådets forordning (EU) 2016/679 af 27. april 2016 om beskyttelse af fysiske personer i forbindelse med behandling af personoplysninger og om fri udveksling af sådanne oplysninger og om ophævelse af direktiv 95/46/EF.`;
                break;
            case 'bog':
                if (!author || !year || !titel || !publisher) return '';
                base = `${formatBibliographyAuthors(author)}. (${year}). <em>${titel}</em>. ${publisher}.`;
                break;
            case 'kapitel-i-bog':
                if (!author || !year || !chapterTitle || !bookEditor || !titel || !pageRange || !publisher) return '';
                base = `${formatBibliographyAuthors(author)}. (${year}). ${chapterTitle}. I ${formatEditorNamesForCitation(bookEditor)} (Red.), <em>${titel}</em> (s. ${pageRange}). ${publisher}.`;
                break;
            case 'hjemmeside':
                if (!author || !year || !titel || !url) return '';
                base = `${formatBibliographyAuthors(author)}. (${year}). <em>${titel}</em>. Hentet fra ${url}`;
                break;
            case 'rapport':
                if (!author || !year || !titel || !organization) return '';
                base = `${formatBibliographyAuthors(author)}. (${year}). <em>${titel}</em>. ${organization}.${url ? ` Hentet fra ${url}` : ''}`;
                break;
            case 'tidsskrift':
                if (!author || !year || !titel || !journalTitle || !volume) return '';
                base = `${formatBibliographyAuthors(author)}. (${year}). ${titel}. <em>${journalTitle}</em>, <em>${volume}</em>${issue ? `(${issue})` : ''}${pageRange ? `, ${pageRange}` : ''}.${doi ? ` https://doi.org/${doi}` : ''}`;
                break;
            case 'video-podcast':
                if (!author || !year || !titel || !url) return '';
                base = `${formatBibliographyAuthors(author)}. (${year}). <em>${titel}</em> [Video/Podcast]. Hentet fra ${url}`;
                break;
        }
        return base;
    }
    
    const generateInTextCitation = () => {
        const { titel, nummer, dato, author, year, forkortelse } = currentSource;
        switch (sourceType) {
            case 'lov':
                return `(${forkortelse || 'FORKORTELSE'}, § xx)`;
            case 'bekendtgørelse':
                return `(bkg. nr. ${nummer || 'XXXX'} af ${formatDateForCitation(dato)}, § xx)`;
            case 'vejledning':
                return `(vejl. nr. ${nummer || 'XXXX'} af ${formatDateForCitation(dato)}, pkt. xx)`;
            case 'principmeddelelse':
                return `Ankestyrelsens principmeddelelse ${titel || 'XX-XX'}`;
            case 'databeskyttelsesforordning':
                return `(DBF, art. xx)`;
            case 'bog':
            case 'kapitel-i-bog':
            case 'hjemmeside':
            case 'rapport':
            case 'tidsskrift':
            case 'video-podcast':
                return `(${formatInTextAuthors(author)}, ${year})`;
            default:
                return '';
        }
    }

    const handleAddSource = () => {
        const formatted = formatSource();
        const inText = generateInTextCitation();
        
        if (formatted) {
            const entry: SourceEntry = {
                id: Math.random().toString(36).substr(2, 9),
                type: sourceType,
                formatted,
                inText,
                sortKey: (currentSource.author || currentSource.titel || '').toLowerCase().trim(),
                createdAt: Date.now()
            };

            setSourceList(prev => [...prev, entry].sort((a, b) => a.sortKey.localeCompare(b.sortKey)));
            setCurrentSource({ titel: '', forkortelse: '' });
            setUrlInput('');
        }
    }
    
    const handleFetchFromUrl = async () => {
        if (!urlInput.trim() || !urlInput.startsWith("https://www.retsinformation.dk")) {
            setFetchError("Indtast venligst en gyldig URL fra Retsinformation.dk.");
            return;
        }

        setIsFetchingUrl(true);
        setFetchError(null);

        try {
            const result = await extractLawInfoAction({ url: urlInput });
            const { titel, nummer, dato, lovbekendtgørelseNummer, lovbekendtgørelseDato, sourceType: extractedType } = result.data;
            
            if (extractedType) {
                setSourceType(extractedType);
            } else {
                setSourceType('lov'); 
            }

            setCurrentSource({
                titel,
                nummer,
                dato,
                lovbekendtgørelseNummer,
                lovbekendtgørelseDato,
            });

            if (user && firestore && result.usage) {
                const totalTokens = result.usage.inputTokens + result.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);

                const batch = writeBatch(firestore);
                const userRef = doc(firestore, 'users', user.uid);
                const tokenUsageCol = collection(firestore, 'users', user.uid, 'tokenUsage');

                const usageData = {
                    flowName: 'extractLawInfoFlow',
                    ...result.usage,
                    totalTokens: totalTokens,
                    createdAt: serverTimestamp(),
                    userId: user.uid,
                    userName: userProfile?.username || user.displayName || 'Anonym'
                };
                batch.set(doc(tokenUsageCol), usageData);

                if (pointsToAdd > 0) {
                    batch.update(userRef, { cohéroPoints: increment(pointsToAdd) });
                }

                const activitiesCol = collection(firestore, 'userActivities');
                const activityData = {
                    userId: user.uid,
                    userName: userProfile?.username || user.displayName || 'Anonym bruger',
                    actionText: `brugte Kildegeneratoren.`,
                    createdAt: serverTimestamp(),
                };
                batch.set(doc(activitiesCol), activityData);
                await batch.commit();
            }
        } catch (err: any) {
            console.error(err);
            setFetchError("Kunne ikke hente eller fortolke oplysninger fra URL'en. Prøv at indtaste manuelt.");
        } finally {
            setIsFetchingUrl(false);
        }
    };
    
    const renderFormFields = () => {
        const handleInputChange = (field: keyof SourceData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setCurrentSource(prev => ({ ...prev, [field]: e.target.value }));
        };

        const renderAmendmentFields = () => (
            <div className="space-y-4 pt-6 mt-6 border-t border-dashed border-amber-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Valgfri: Seneste ændring</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Ændringslov nr." value={currentSource.senestÆndretNummer || ''} onChange={handleInputChange('senestÆndretNummer')} className="bg-white/50" />
                    <Input placeholder="Dato (dd.mm.åååå)" value={currentSource.senestÆndretDato || ''} onChange={handleInputChange('senestÆndretDato')} className="bg-white/50" />
                </div>
            </div>
        );

        switch (sourceType) {
            case 'lov':
                return (
                    <div className="space-y-4">
                        <Input placeholder="Lovens officielle titel (f.eks. Lov om social service)" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                         <Input placeholder="Lovens forkortelse (f.eks. SEL)" value={currentSource.forkortelse || ''} onChange={handleInputChange('forkortelse')} required />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Lovbekendtgørelse nr." value={currentSource.lovbekendtgørelseNummer || ''} onChange={handleInputChange('lovbekendtgørelseNummer')} />
                            <Input placeholder="Dato (dd.mm.åååå)" value={currentSource.lovbekendtgørelseDato || ''} onChange={handleInputChange('lovbekendtgørelseDato')} />
                        </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-center text-slate-400 py-2">ELLER (hvis det er originalloven)</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Lov nr." value={currentSource.nummer || ''} onChange={handleInputChange('nummer')} />
                            <Input placeholder="Dato (dd.mm.åååå)" value={currentSource.dato || ''} onChange={handleInputChange('dato')} />
                        </div>
                        {renderAmendmentFields()}
                    </div>
                );
            case 'bekendtgørelse':
            case 'vejledning':
                  return (
                    <div className="space-y-4">
                        <Input placeholder="Fulde titel..." value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Nr." value={currentSource.nummer || ''} onChange={handleInputChange('nummer')} required />
                            <Input placeholder="Dato (dd.mm.åååå)" value={currentSource.dato || ''} onChange={handleInputChange('dato')} required />
                        </div>
                    </div>
                );
            case 'principmeddelelse':
                return <Input placeholder="Principmeddelelse nr. (f.eks. 158-12)" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />;
            case 'databeskyttelsesforordning':
                return <p className="text-center text-sm text-slate-500 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 italic">Denne kilde er standardiseret og kræver ikke yderligere input.</p>;
            case 'bog':
            case 'hjemmeside':
            case 'rapport':
            case 'video-podcast':
                return (
                    <div className="space-y-4">
                        <Input placeholder="Forfatter(e) (Efternavn, Initialer; Efternavn, Initialer)" value={currentSource.author || ''} onChange={handleInputChange('author')} required />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Årstal (f.eks. 2024)" value={currentSource.year || ''} onChange={handleInputChange('year')} required />
                            <Input placeholder="Titel" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                        </div>
                        {sourceType === 'bog' && <Input placeholder="Forlag" value={currentSource.publisher || ''} onChange={handleInputChange('publisher')} required />}
                        {sourceType === 'rapport' && <Input placeholder="Organisation / Udgiver" value={currentSource.organization || ''} onChange={handleInputChange('organization')} required />}
                        {(sourceType === 'hjemmeside' || sourceType === 'rapport' || sourceType === 'video-podcast') && <Input placeholder="URL (https://...)" value={currentSource.url || ''} onChange={handleInputChange('url')} required />}
                    </div>
                );
            case 'kapitel-i-bog':
                  return (
                    <div className="space-y-4">
                        <Input placeholder="Kapitlets forfatter(e)" value={currentSource.author || ''} onChange={handleInputChange('author')} required />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Udgivelsesår" value={currentSource.year || ''} onChange={handleInputChange('year')} required />
                            <Input placeholder="Kapitlets titel" value={currentSource.chapterTitle || ''} onChange={handleInputChange('chapterTitle')} required />
                        </div>
                        <Input placeholder="Bogens redaktør(er)" value={currentSource.bookEditor || ''} onChange={handleInputChange('bookEditor')} required />
                        <Input placeholder="Bogens titel" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Sideinterval (f.eks. 47-71)" value={currentSource.pageRange || ''} onChange={handleInputChange('pageRange')} required />
                            <Input placeholder="Forlag" value={currentSource.publisher || ''} onChange={handleInputChange('publisher')} required />
                        </div>
                    </div>
                );
            case 'tidsskrift':
                return (
                    <div className="space-y-4">
                        <Input placeholder="Forfatter(e)" value={currentSource.author || ''} onChange={handleInputChange('author')} required />
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input placeholder="Årstal" value={currentSource.year || ''} onChange={handleInputChange('year')} required />
                            <Input placeholder="Artiklens titel" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                        </div>
                        <Input placeholder="Tidsskriftets navn" value={currentSource.journalTitle || ''} onChange={handleInputChange('journalTitle')} required />
                        <div className="grid md:grid-cols-3 gap-4">
                            <Input placeholder="Årgang (vol)" value={currentSource.volume || ''} onChange={handleInputChange('volume')} required />
                            <Input placeholder="Nr. (issue)" value={currentSource.issue || ''} onChange={handleInputChange('issue')} />
                            <Input placeholder="Sider" value={currentSource.pageRange || ''} onChange={handleInputChange('pageRange')} />
                        </div>
                        <Input placeholder="DOI (valgfri)" value={currentSource.doi || ''} onChange={handleInputChange('doi')} />
                    </div>
                );
            default:
                return null;
        }
    };

    const formattedPreview = formatSource();
    const inTextPreview = generateInTextCitation();

    return (
    <div className="bg-[#FDFCF8] min-h-screen">
        <header className="bg-white border-b border-amber-100/50 sticky top-0 z-50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto py-6 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-lime-50 text-lime-600 rounded-2xl flex items-center justify-center">
                        <BookCopy className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-amber-950 uppercase tracking-tighter">Kildegenerator</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">APA 7 & Juridisk Standard</p>
                    </div>
                </div>
                {sourceList.length > 0 && (
                    <div className="flex items-center gap-2">
                         <Button variant="ghost" size="sm" onClick={() => { if(confirm('Slet hele kildelisten?')) setSourceList([]); }} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs">
                            <Trash2 className="w-4 h-4 mr-2"/> Ryd alt
                        </Button>
                    </div>
                )}
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-12 gap-8 items-start pb-32">
            <div className="lg:col-span-12 xl:col-span-7 space-y-8">
                {/* AUTO FETCH CARD */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-amber-100/60 shadow-xl shadow-amber-900/5 space-y-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-sky-50 rounded-xl">
                            <LinkIcon className="w-5 h-5 text-sky-600" />
                        </div>
                        <h2 className="text-lg font-black text-amber-950 uppercase tracking-tighter">Hent fra Retsinformation</h2>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative flex-grow group">
                            <Input 
                                value={urlInput}
                                onChange={(e) => { setUrlInput(e.target.value); setFetchError(null); }}
                                placeholder="Indsæt URL til lovtekst eller bekendtgørelse..."
                                className="pl-4 h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:bg-white transition-all text-sm"
                                disabled={isFetchingUrl}
                            />
                        </div>
                        <Button 
                            onClick={handleFetchFromUrl} 
                            disabled={isFetchingUrl || !urlInput} 
                            className="h-14 px-8 bg-slate-900 text-white hover:bg-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                        >
                            {isFetchingUrl ? <Loader2 className="w-5 h-5 animate-spin"/> : "Hent Data"}
                        </Button>
                    </div>
                    {fetchError && <p className="text-xs font-bold text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-pulse">{fetchError}</p>}
                </motion.section>

                {/* MANUAL ENTRY CARD */}
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-amber-100/60 shadow-xl shadow-amber-900/5 space-y-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-xl">
                                <Plus className="w-5 h-5 text-amber-600" />
                            </div>
                            <h2 className="text-lg font-black text-amber-950 uppercase tracking-tighter">Manuel Indtastning</h2>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {(['lov', 'bekendtgørelse', 'vejledning', 'principmeddelelse', 'bog', 'kapitel-i-bog', 'hjemmeside', 'rapport', 'tidsskrift', 'video-podcast'] as SourceType[]).map(type => (
                            <button 
                                key={type} 
                                onClick={() => { setSourceType(type); setCurrentSource({titel: '', forkortelse: ''}); }}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                                    ${sourceType === type 
                                        ? 'bg-amber-950 text-amber-400 border-amber-950 shadow-lg shadow-amber-900/20' 
                                        : 'bg-white text-slate-500 border-slate-100 hover:border-amber-200 hover:text-amber-900 hover:bg-amber-50'
                                    }`}
                            >
                                {type.replace(/-/g, ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="pt-4">
                        {renderFormFields()}
                    </div>
                </motion.section>

                {/* PREVIEW CARD */}
                {formattedPreview && (
                    <motion.section 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 space-y-8"
                    >
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">Litteraturliste</h4>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(formattedPreview.replace(/<em>/g, '').replace(/<\/em>/g, ''), 'full')} className="h-8 w-8 p-0 rounded-lg hover:bg-white">
                                        {copiedField === 'full' ? <Check className="w-4 h-4 text-green-600"/> : <Copy className="w-4 h-4 text-amber-900/40"/>}
                                    </Button>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-amber-200/50 shadow-sm min-h-[80px] flex flex-col justify-center">
                                    <p className="text-sm text-slate-800 leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: formattedPreview }} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-900/40">I teksten</h4>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(inTextPreview, 'in-text')} className="h-8 w-8 p-0 rounded-lg hover:bg-white">
                                        {copiedField === 'in-text' ? <Check className="w-4 h-4 text-green-600"/> : <Copy className="w-4 h-4 text-amber-900/40"/>}
                                    </Button>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-amber-200/50 shadow-sm min-h-[80px] flex flex-col justify-center">
                                    <p className="text-sm font-bold text-slate-900 font-mono tracking-tight">{inTextPreview}</p>
                                </div>
                            </div>
                        </div>
                        <Button 
                            onClick={handleAddSource} 
                            className="w-full h-14 bg-amber-950 text-amber-400 hover:bg-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-900/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Gem kilde til listen
                        </Button>
                    </motion.section>
                )}
            </div>
            
            <div className="lg:col-span-12 xl:col-span-5">
                <motion.section 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-8 rounded-[2.5rem] border border-amber-100/60 shadow-xl shadow-amber-900/5 lg:sticky lg:top-28"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-lime-50 rounded-xl">
                                <BookCopy className="w-5 h-5 text-lime-600" />
                            </div>
                            <h2 className="text-lg font-black text-amber-950 uppercase tracking-tighter">Din Litteraturliste</h2>
                        </div>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {sourceList.length} kilder
                        </span>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {sourceList.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                                        <Book className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm text-slate-400 font-bold">Ingen gemte kilder endnu...</p>
                                </div>
                            ) : (
                                sourceList.map((source, index) => (
                                    <motion.div 
                                        key={source.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group relative bg-slate-50/50 p-5 rounded-2xl border border-slate-100 hover:bg-white hover:border-amber-200 hover:shadow-lg hover:shadow-amber-900/5 transition-all"
                                    >
                                        <div className="pr-10">
                                            <p className="text-sm text-slate-800 leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: source.formatted }} />
                                            <div className="mt-3 flex items-center gap-4">
                                                <button 
                                                    onClick={() => copyToClipboard(source.formatted.replace(/<em>|<\/em>/g, ''), `list-full-${source.id}`)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-amber-600 transition-colors flex items-center gap-1.5"
                                                >
                                                    <Copy className="w-3 h-3" /> {copiedField === `list-full-${source.id}` ? 'Kopieret' : 'Fuld kilde'}
                                                </button>
                                                <button 
                                                    onClick={() => copyToClipboard(source.inText, `list-text-${source.id}`)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-sky-600 transition-colors flex items-center gap-1.5"
                                                >
                                                    <MessageSquare className="w-3 h-3" /> {copiedField === `list-text-${source.id}` ? 'Kopieret' : 'I teksten'}
                                                </button>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSourceList(prev => prev.filter(s => s.id !== source.id))}
                                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {sourceList.length > 0 && (
                        <div className="pt-8 mt-4 border-t border-amber-100 flex flex-col gap-3">
                            <Button 
                                onClick={() => {
                                    const fullText = sourceList.map(s => s.formatted.replace(/<em>|<\/em>/g, '')).join('\n\n');
                                    copyToClipboard(fullText, 'full_list_copy');
                                }}
                                className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-tight shadow-md hover:bg-black transition-all"
                            >
                                <Copy className="w-4 h-4 mr-2" /> {copiedField === 'full_list_copy' ? 'Kopieret alt!' : 'Kopier komplet liste'}
                            </Button>
                        </div>
                    )}
                </motion.section>
            </div>
        </main>
    </div>
    );
}

const KildeGeneratorPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#FDFCF8]">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Autentificerer...</p>
            </div>
        );
    }

    return <KildeGeneratorPageContent />;
};

export default KildeGeneratorPage;
