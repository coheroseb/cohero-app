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
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { processBookTocAction, saveBookAction, fetchBookMetadataAction } from '@/app/actions';

interface TocItem {
    title: string;
    pageNumber: string;
}

export default function AdminBooksPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [isbn, setIsbn] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isIsbnLoading, setIsIsbnLoading] = useState(false);
    const [extractedToc, setExtractedToc] = useState<TocItem[]>([]);

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
            // Convert images to base64
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
                toc: extractedToc
            });

            if (res.success) {
                toast({
                    title: "Bog gemt",
                    description: `${title} er nu oprettet med ${extractedToc.length} afsnit.`,
                });
                router.push('/admin');
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

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-[950] text-slate-950 tracking-tight">Digitaliser Bog</h1>
                            <p className="text-sm font-bold text-slate-500">Upload indholdsfortegnelse og opret Vector-mapping</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline"
                            onClick={() => router.back()}
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
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: Upload & Info */}
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
                                        <div className="flex items-center gap-4">
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
