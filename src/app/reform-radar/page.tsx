'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BrainCircuit, Loader2, Sparkles, UploadCloud, File, X, Scale, Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { analyzeReformPdfAction } from '@/app/actions';
import type { ReformAnalysis } from '@/ai/flows/types';

// PDF text extraction utility
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
    const strings = content.items.map(item => ('str' in item ? item.str : '')).join(' ');
    text += strings + '\n';
  }
  return text;
}

const CategoryIcon = ({ category }: { category: ReformAnalysis['category'] }) => {
    switch (category) {
        case 'Børn & Unge':
            return <Users className="w-5 h-5 text-blue-600" />;
        case 'Beskæftigelse':
            return <Briefcase className="w-5 h-5 text-emerald-600" />;
        case 'Voksne & Handicap':
            return <Scale className="w-5 h-5 text-rose-600" />;
        default:
            return <Scale className="w-5 h-5 text-slate-600" />;
    }
};

const FolketingetPageContent = () => {
    const [textInput, setTextInput] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<ReformAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        let contentToAnalyze = textInput.trim();
        
        if (!contentToAnalyze && pdfFile) {
            setIsLoading(true);
            setError(null);
            try {
                contentToAnalyze = await extractTextFromPdf(pdfFile);
            } catch (err) {
                console.error("PDF Extraction error", err);
                setError("Kunne ikke læse PDF-filen. Prøv venligst igen, eller kopiér teksten ind manuelt.");
                setIsLoading(false);
                return;
            }
        }
        
        if (!contentToAnalyze) return;

        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await analyzeReformPdfAction({ reformText: contentToAnalyze });
            setAnalysis(result.data);
        } catch (err) {
            console.error(err);
            setError("Der opstod en fejl under analysen. Prøv venligst igen.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
    <div className="bg-[#FDFCF8] min-h-screen">
      <header className="bg-white border-b border-amber-100/50">
        <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex items-center gap-4">
            <Link href="/portal" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                Reform-Radar
              </h1>
              <p className="text-base text-slate-500">
                Analyser politiske aftaler og lovforslag med AI.
              </p>
            </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        <section className="bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm">
            <h2 className="text-xl font-bold text-amber-950 serif mb-4">Analyser en politisk tekst</h2>
            <p className="text-sm text-slate-500 mb-6">Kopiér teksten fra en politisk aftale, et lovforslag eller en artikel fra ft.dk, og indsæt den herunder for at få en AI-drevet analyse af de vigtigste pointer for socialt arbejde.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
                <Textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="Indsæt tekst her..."
                    className="min-h-[250px] bg-slate-50 border-slate-200"
                />
                 <div>
                    {pdfFile ? (
                        <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-md h-full">
                            <div className="flex items-center gap-2">
                                <File className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-700 truncate">{pdfFile.name}</span>
                            </div>
                            <button onClick={() => setPdfFile(null)} className="p-1 text-slate-400 hover:text-red-600">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ) : (
                        <label htmlFor="pdf-upload" className="relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors">
                            <UploadCloud className="mx-auto h-8 w-8 text-slate-300" />
                            <span className="mt-2 block text-xs font-semibold text-slate-500">Eller upload en PDF-fil</span>
                            <input id="pdf-upload" name="pdf-upload" type="file" className="sr-only" accept=".pdf,application/pdf" onChange={(e) => { e.target.files && setTextInput('') ; e.target.files && setPdfFile(e.target.files[0])}} />
                        </label>
                    )}
                </div>
            </div>
            
            <Button onClick={handleAnalyze} disabled={isLoading || (!textInput.trim() && !pdfFile)} className="mt-4">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                {isLoading ? 'Analyserer...' : 'Analyser Tekst'}
            </Button>
        </section>

        {error && <p className="text-red-500 text-center">{error}</p>}
        
        {analysis && (
            <section className="animate-fade-in-up bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50">
                        <CategoryIcon category={analysis.category} />
                    </div>
                    <h2 className="text-2xl font-bold text-amber-950 serif">{analysis.title}</h2>
                </div>
                
                <div>
                    <h3 className="font-bold text-amber-800">Resumé</h3>
                    <p className="text-slate-600">{analysis.summary}</p>
                </div>
                 <div>
                    <h3 className="font-bold text-amber-800">Nøglepunkter</h3>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {analysis.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-amber-800">Betydning for Praksis</h3>
                    <p className="text-slate-600 whitespace-pre-wrap">{analysis.practiceImpact}</p>
                </div>
            </section>
        )}
      </main>
    </div>
  );
};

export default function ReformRadarPage() {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <FolketingetPageContent />;
}
