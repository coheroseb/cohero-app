'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Gavel, Plus, Copy, Trash2, Link as LinkIcon, Loader2, BookCopy, AlertTriangle, Book, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { extractLawInfoAction } from '@/app/actions';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { writeBatch, doc, serverTimestamp, increment, collection } from 'firebase/firestore';

type SourceType = 'lov' | 'bekendtgørelse' | 'vejledning' | 'principmeddelelse' | 'databeskyttelsesforordning' | 'bog' | 'kapitel-i-bog';

interface SourceData {
    // Common fields
    titel: string;
    nummer?: string;
    dato?: string;
    // Amendment fields
    senestÆndretNummer?: string;
    senestÆndretDato?: string;
    // Special field for 'lov'
    lovbekendtgørelseNummer?: string;
    lovbekendtgørelseDato?: string;
    forkortelse?: string;
    // Book fields
    author?: string;
    year?: string;
    publisher?: string;
    // Chapter in book fields
    chapterTitle?: string;
    bookEditor?: string;
    pageRange?: string;
}

const formatDateForCitation = (dateString?: string): string => {
    if (!dateString) return '';
    // Handles dd.mm.åååå, dd/mm/åååå, and dd.m.åå formats
    const parts = dateString.split(/[\.\/]/);
    if (parts.length !== 3) return dateString; // Return original if format is unexpected
    const [day, month, year] = parts;
    const monthNames = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
    const monthIndex = parseInt(month, 10) - 1;

    if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateString;
    
    // Ensure year is 4 digits
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


// Main component
function KildeGeneratorPageContent() {
    const { user, userProfile } = useApp();
    const firestore = useFirestore();
    const [sourceType, setSourceType] = useState<SourceType>('lov');
    const [currentSource, setCurrentSource] = useState<Partial<SourceData>>({titel: '', forkortelse: ''});
    const [sourceList, setSourceList] = useState<string[]>([]);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [url, setUrl] = useState('');
    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const copyToClipboard = (text: string, field: string) => {
        if(!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const formatSource = () => {
        const { titel, nummer, dato, senestÆndretNummer, senestÆndretDato, lovbekendtgørelseNummer, lovbekendtgørelseDato, author, year, publisher, chapterTitle, bookEditor, pageRange } = currentSource;
        
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
                base = `<em>${titel}</em>, jf. bkg. nr. ${nummer} af ${formatDateForCitation(dato)}`;
                if (senestÆndretNummer && senestÆndretDato) {
                     base += `, som senest ændret ved bkg. nr. ${senestÆndretNummer} af ${formatDateForCitation(senestÆndretDato)}`;
                }
                 base += '.';
                break;
            case 'vejledning':
                if (!titel || !nummer || !dato) return '';
                base = `<em>${titel}</em>, jf. vejl. nr. ${nummer} af ${formatDateForCitation(dato)}`;
                if (senestÆndretNummer && senestÆndretDato) {
                    base += `, som senest ændret ved vejl. nr. ${senestÆndretNummer} af ${formatDateForCitation(senestÆndretDato)}`;
                }
                base += '.';
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
                const formattedBookAuthors = formatBibliographyAuthors(author);
                base = `${formattedBookAuthors}. (${year}). <em>${titel}</em>. ${publisher}.`;
                break;
            case 'kapitel-i-bog':
                if (!author || !year || !chapterTitle || !bookEditor || !titel || !pageRange || !publisher) return '';
                const chapterAuthors = formatBibliographyAuthors(author);
                const formattedEditors = formatEditorNamesForCitation(bookEditor);
                base = `${chapterAuthors}. (${year}). ${chapterTitle}. I ${formattedEditors} (Red.), <em>${titel}</em> (s. ${pageRange}). ${publisher}.`;
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
                if (!titel) return 'Ankestyrelsens principmeddelelse XX-XX';
                // Remove potential surrounding text to just get the number if necessary, but here we assume 'titel' is the ID
                return `Ankestyrelsens principmeddelelse ${titel}`;
            case 'databeskyttelsesforordning':
                return `(DBF, art. xx)`;
            case 'bog':
            case 'kapitel-i-bog':
                {
                    if (!author || !year) return `(Forfatter, Årstal)`;
                    const inTextAuthors = formatInTextAuthors(author);
                    return `(${inTextAuthors}, ${year})`;
                }
            default:
                return '';
        }
    }

    const handleAddSource = () => {
        const formatted = formatSource();
        if (formatted) {
            setSourceList(prev => [...prev, formatted]);
            setCurrentSource({
                titel: '',
                nummer: '',
                dato: '',
                lovbekendtgørelseNummer: '',
                lovbekendtgørelseDato: '',
                senestÆndretNummer: '',
                senestÆndretDato: '',
                forkortelse: '',
                author: '',
                year: '',
                publisher: '',
                chapterTitle: '',
                bookEditor: '',
                pageRange: '',
            });
        }
    }
    
    const handleFetchFromUrl = async () => {
        if (!url.trim() || !url.startsWith("https://www.retsinformation.dk")) {
            setFetchError("Indtast venligst en gyldig URL fra Retsinformation.dk.");
            return;
        }

        setIsFetchingUrl(true);
        setFetchError(null);

        try {
            const result = await extractLawInfoAction({ url });
            const { titel, nummer, dato, lovbekendtgørelseNummer, lovbekendtgørelseDato, sourceType: extractedType } = result.data;
            
            if (extractedType) {
                setSourceType(extractedType);
            } else {
                setSourceType('lov'); // Fallback to 'lov'
            }

            setCurrentSource({
                titel,
                nummer,
                dato,
                lovbekendtgørelseNummer,
                lovbekendtgørelseDato,
                senestÆndretNummer: '',
                senestÆndretDato: '',
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
            <div className="space-y-2 pt-4 mt-4 border-t border-dashed border-amber-200">
                <p className="text-xs font-bold text-slate-400">Valgfri: Seneste ændring</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <Input placeholder="Ændringslov nr." value={currentSource.senestÆndretNummer || ''} onChange={handleInputChange('senestÆndretNummer')} />
                    <Input placeholder="Dato (dd.mm.åååå)" value={currentSource.senestÆndretDato || ''} onChange={handleInputChange('senestÆndretDato')} />
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
                         <p className="text-xs text-center text-slate-400">ELLER (hvis det er originalloven)</p>
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
                         {renderAmendmentFields()}
                    </div>
                );
            case 'principmeddelelse':
                return <Input placeholder="Principmeddelelse nr. (f.eks. 158-12)" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />;
            case 'databeskyttelsesforordning':
                return <p className="text-center text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">Denne kilde er standardiseret og kræver ikke yderligere input.</p>;
            case 'bog':
                return (
                    <div className="space-y-4">
                        <Input placeholder="Forfatter(e)" value={currentSource.author || ''} onChange={handleInputChange('author')} required />
                        <p className="text-xs text-slate-400 -mt-2 pl-1">Efternavn, Initialer. Adskil flere med semikolon (;).</p>
                        <Input placeholder="Udgivelsesår (f.eks. 2023)" value={currentSource.year || ''} onChange={handleInputChange('year')} required />
                        <Input placeholder="Titel" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                        <Input placeholder="Forlag" value={currentSource.publisher || ''} onChange={handleInputChange('publisher')} required />
                    </div>
                );
            case 'kapitel-i-bog':
                 return (
                    <div className="space-y-4">
                        <Input placeholder="Kapitlets forfatter(e)" value={currentSource.author || ''} onChange={handleInputChange('author')} required />
                        <p className="text-xs text-slate-400 -mt-2 pl-1">Efternavn, Initialer. Adskil flere med semikolon (;).</p>
                        <Input placeholder="Udgivelsesår" value={currentSource.year || ''} onChange={handleInputChange('year')} required />
                        <Input placeholder="Kapitlets titel" value={currentSource.chapterTitle || ''} onChange={handleInputChange('chapterTitle')} required />
                        <Input placeholder="Bogens redaktør(er)" value={currentSource.bookEditor || ''} onChange={handleInputChange('bookEditor')} required />
                        <p className="text-xs text-slate-400 -mt-2 pl-1">Efternavn, Initialer. Adskil flere med semikolon (;).</p>
                        <Input placeholder="Bogens titel" value={currentSource.titel || ''} onChange={handleInputChange('titel')} required />
                        <Input placeholder="Sideinterval (f.eks. 47-71)" value={currentSource.pageRange || ''} onChange={handleInputChange('pageRange')} required />
                        <Input placeholder="Forlag" value={currentSource.publisher || ''} onChange={handleInputChange('publisher')} required />
                    </div>
                );
            default:
                return null;
        }
    };


    const formattedSourcePreview = formatSource();
    const inTextCitationPreview = generateInTextCitation();
    const isLegalSource = sourceType !== 'bog' && sourceType !== 'kapitel-i-bog';

    return (
    <>
        <div className="bg-[#FDFCF8] min-h-screen">
        <header className="bg-white border-b border-amber-100/50">
            <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-lime-50 text-lime-600 rounded-2xl flex items-center justify-center mb-4">
                <Gavel className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif mb-3">
                Kildegenerator
            </h1>
            <p className="text-base text-slate-500 max-w-2xl">
                Opret korrekte kildehenvisninger til bøger og juridiske kilder efter APA 7-standarden.
            </p>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8 grid lg:grid-cols-2 gap-12 items-start">
            <section>
                <h2 className="text-2xl font-bold text-amber-950 serif mb-6">Tilføj kilde</h2>
                <div className="bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm space-y-8">
                    
                    <div>
                        <label className="block text-sm font-bold text-amber-950 mb-4">Udfyld automatisk fra Retsinformation.dk</label>
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    value={url}
                                    onChange={(e) => { setUrl(e.target.value); setFetchError(null); }}
                                    placeholder="Indsæt URL til lovtekst..."
                                    className="pl-10"
                                    disabled={isFetchingUrl}
                                />
                            </div>
                            <Button onClick={handleFetchFromUrl} disabled={isFetchingUrl} className="w-24">
                                {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin"/> : "Hent"}
                            </Button>
                        </div>
                        {fetchError && <p className="text-xs text-red-500 mt-2">{fetchError}</p>}
                        <p className="text-xs text-slate-400 mt-2">Denne funktion virker bedst med love og lovbekendtgørelser.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <hr className="flex-grow border-amber-100/80"/>
                        <span className="text-center text-slate-400 font-bold text-sm">ELLER</span>
                        <hr className="flex-grow border-amber-100/80"/>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-amber-950 mb-4">Udfyld manuelt</label>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {(['lov', 'bekendtgørelse', 'vejledning', 'principmeddelelse', 'bog', 'kapitel-i-bog'] as SourceType[]).map(type => (
                                <Button key={type} variant={sourceType === type ? "secondary" : "outline"} onClick={() => { setSourceType(type); setCurrentSource({titel: '', forkortelse: ''}); }} className="capitalize justify-center h-12">
                                    {(type === 'bog' || type === 'kapitel-i-bog') && <Book className="w-4 h-4 mr-2" />}
                                    {type.replace(/-/g, ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-amber-100/50 pt-8">
                        {renderFormFields()}
                    </div>
                    
                    {formattedSourcePreview && (
                        <div className="border-t border-amber-100/50 pt-8 space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-amber-950">
                                        Til litteraturlisten
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(formattedSourcePreview.replace(/<em>/g, '_').replace(/<\/em>/g, '_'), 'full')}>
                                        {copiedField === 'full' ? <Check className="w-4 h-4 text-green-600"/> : <Copy className="w-4 h-4"/>}
                                    </Button>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-lg text-xs text-slate-700 font-mono" dangerouslySetInnerHTML={{ __html: formattedSourcePreview }}>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-amber-950">
                                        Henvisning i teksten
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(inTextCitationPreview, 'in-text')}>
                                       {copiedField === 'in-text' ? <Check className="w-4 h-4 text-green-600"/> : <Copy className="w-4 h-4"/>}
                                    </Button>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-lg text-xs text-slate-700 font-mono">
                                    {inTextCitationPreview}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 italic">
                                  {isLegalSource 
                                      ? (sourceType === 'principmeddelelse' ? "Henvisninger til principmeddelelser skrives direkte i teksten som vist ovenfor." : "Første gang en lov nævnes, skrives den fulde titel efterfulgt af forkortelsen i parentes, f.eks.: Lov om social service (SEL). Ved efterfølgende henvisninger bruges kun forkortelsen.")
                                      : "Bøger og kapitler følger APA 7-standarden. Ved citat tilføjes sidetal, f.eks.: (Husted, 2013, s. 220)."
                                  }
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end items-center pt-6 border-t border-amber-100/50">
                    <Button onClick={handleAddSource} disabled={!formattedSourcePreview} className="group">
                        <Plus className="w-4 h-4 mr-2" /> Tilføj til liste
                    </Button>
                    </div>
                </div>
            </section>
            
            <section className="lg:sticky lg:top-24">
                <h2 className="text-2xl font-bold text-amber-950 serif mb-6">Din Kildeliste ({sourceList.length})</h2>
                <div className="bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm space-y-6 min-h-[400px] flex flex-col">
                    <Textarea
                        readOnly
                        value={sourceList.map(s => s.replace(/<em>/g, '_').replace(/<\/em>/g, '_')).join('\n\n')}
                        className="flex-grow bg-slate-50/50 border-slate-100 text-sm leading-relaxed"
                        rows={15}
                        placeholder="Din genererede kildeliste vil blive vist her..."
                    />
                    <div className="flex justify-between items-center pt-6 border-t border-amber-100/50">
                        <Button onClick={() => setSourceList([])} variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                            <Trash2 className="w-4 h-4 mr-2"/> Ryd liste
                        </Button>
                        <Button onClick={() => copyToClipboard(sourceList.map(s => s.replace(/<em>|<\/em>/g, '')).join('\n\n'), 'fulllist')} disabled={sourceList.length === 0}>
                            <Copy className="w-4 h-4 mr-2"/> {copiedField === 'fulllist' ? 'Kopieret!' : 'Kopier liste'}
                        </Button>
                    </div>
                </div>
            </section>
        </main>
        </div>
        
    </>
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
                <p className="mt-4 text-slate-500 font-semibold">Indlæser...</p>
            </div>
        );
    }

    return <KildeGeneratorPageContent />;
};

export default KildeGeneratorPage;
