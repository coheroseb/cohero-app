'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Evidence, ApaReference } from './types';
import { extractApaMetadataAction } from '@/app/actions';

// PDF text extraction utility (same as in page.tsx)
async function extractTextFromPdf(file: File): Promise<string> {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/build/pdf.mjs');
    const pdfjsVersion = '4.10.38'; 
    GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
  
    const buffer = await file.arrayBuffer();
    const loadingTask = getDocument({data: new Uint8Array(buffer)});
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
        text += strings + '\n';
    }
    return text;
}

interface ApaReferenceEditorProps {
    item: Evidence & { id: string };
    onSave: (id: string, ref: ApaReference) => void;
    onCancel: () => void;
    locale: string;
    storage: any;
    toast: any;
}

export const ApaReferenceEditor: React.FC<ApaReferenceEditorProps> = ({ item, onSave, onCancel, locale, storage, toast }) => {
    const [formData, setFormData] = useState<ApaReference>(item.apaRef || {
        authors: '',
        year: '',
        title: '',
        source: '',
        url: item.url || '',
        doi: '',
        fullAPA: ''
    });
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAiAnalyze = async () => {
        if (!item.storagePath && !item.url) return;
        setIsAnalyzing(true);
        try {
            let text = '';
            if (item.storagePath) {
                const { ref, getBlob } = await import('firebase/storage');
                const storageRef = ref(storage, item.storagePath);
                const blob = await getBlob(storageRef);
                const file = new File([blob], item.fileName || 'document', { type: blob.type });
                
                if (file.type === 'application/pdf') {
                    text = await extractTextFromPdf(file);
                } else {
                    text = await file.text();
                }
            } else if (item.url) {
                // For external URLs, we might not be able to extract text directly due to CORS
                // But let's assume the action can handle it or prompt for it
                toast({ title: "Bemærk", description: locale === 'da' ? "Kunne ikke læse ekstern URL. Indtast venligst metadata manuelt." : "Could not read external URL. Please enter metadata manually." });
            }

            if (text) {
                const res = await extractApaMetadataAction({
                    fileName: item.fileName || 'document',
                    fileContent: text
                });
                setFormData(res.data);
                toast({ title: "AI Analyse færdig", description: "Metadata er blevet autoudfyldt." });
            }
        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: "Fejl", description: "Kunne ikke analysere dokumentet." });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = () => {
        const { authors, year, title, source, url, doi } = formData;
        if (!authors || !title) return;
        const full = `${authors} (${year || 'n.d.'}). ${title}. ${source}.${doi ? ` https://doi.org/${doi}` : ''}${url && !doi ? ` ${url}` : ''}`;
        setFormData({ ...formData, fullAPA: full });
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 space-y-8 border border-slate-100">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-700 shadow-inner">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">APA Reference</h3>
                    <p className="text-[13px] text-slate-400 font-medium">Tilføj metadata for at skabe en korrekt APA 7 citation.</p>
                    
                    {(item.storagePath || item.url) && (
                        <div className="pt-2">
                            <Button 
                                onClick={handleAiAnalyze} 
                                disabled={isAnalyzing}
                                variant="outline"
                                className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest border-indigo-100 text-indigo-600 hover:bg-indigo-50 bg-indigo-50/30"
                            >
                                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                {isAnalyzing ? 'Analyserer...' : 'Analysér med AI'}
                            </Button>
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Forfattere (Sortér efter efternavn)</label>
                        <Input value={formData.authors} onChange={e => setFormData({...formData, authors: e.target.value})} placeholder="F.eks. Jensen, A., & Nielsen, B." className="h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Årstal</label>
                        <Input value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="2024" className="h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Udgiver / Kilde</label>
                        <Input value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} placeholder="Journal of AI" className="h-14 rounded-2xl" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Titel</label>
                        <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Den store AI bølge" className="h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">DOI</label>
                        <Input value={formData.doi} onChange={e => setFormData({...formData, doi: e.target.value})} placeholder="10.1234/5678" className="h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">URL</label>
                        <Input value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://..." className="h-14 rounded-2xl" />
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                    <Button onClick={handleGenerate} variant="ghost" className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl">Generér fuld citation</Button>
                    <Textarea 
                        value={formData.fullAPA} 
                        onChange={e => setFormData({...formData, fullAPA: e.target.value})} 
                        placeholder="Jensen, A. (2024). Titel på værk. Kilde."
                        className="min-h-[100px] rounded-2xl bg-slate-50 border-transparent text-[13px] font-medium leading-relaxed italic"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button onClick={onCancel} variant="ghost" className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400">Annuller</Button>
                    <Button onClick={() => onSave(item.id, formData)} className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-900/10">Gem Reference</Button>
                </div>
            </motion.div>
        </div>
    );
};
