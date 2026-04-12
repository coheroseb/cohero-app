'use client';

export const maxDuration = 300;

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Brain,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  X,
  FileSearch,
  Zap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { analyzeAdminDocumentAction } from '@/app/actions';

export default function AdminDocumentAnalyzerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>(['Overskrift på opgaven?', 'Hvad er de tre vigtigste pointer?', 'Hvilke love refereres der til?']);
  const [newQuestion, setNewQuestion] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ results: { question: string, answer: string }[], overallConclusion: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (selectedFile.size > 8 * 1024 * 1024) { // 8MB Limit for Vercel Server Actions
          toast({
            variant: 'destructive',
            title: "Filen er for stor",
            description: "Vælg venligst en PDF under 8MB (Vercel begrænsning).",
          });
          return;
      }
      setFile(selectedFile);
      setAnalysisResult(null);
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1];
        setPdfBase64(base64 || null);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      toast({
        variant: 'destructive',
        title: "Ugyldig fil",
        description: "Vælg venligst en PDF-fil.",
      });
    }
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const runAnalysis = async () => {
    if (!pdfBase64) {
      toast({
        variant: 'destructive',
        title: "Fil mangler",
        description: "Upload venligst en PDF-fil først.",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        variant: 'destructive',
        title: "Spørgsmål mangler",
        description: "Tilføj venligst mindst ét spørgsmål.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await analyzeAdminDocumentAction({
        pdfBase64,
        questions
      });

      if (response && response.data) {
        setAnalysisResult(response.data);
        toast({
          title: "Analyse færdig",
          description: "AI har gennemgået dit dokument.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: "Fejl",
        description: "Der opstod en fejl under analysen.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-inter pb-20">
      
      {/* HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-full hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FileSearch className="w-6 h-6 text-indigo-600" />
                Admin Dokument Analysator
              </h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Internt værktøj til dybdeborende PDF-analyse</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
               Admin Only
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-10 grid lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: UPLOAD & QUESTIONS */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* UPLOAD SECTION */}
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">1. Vælg dokument</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'bg-indigo-50/30 border-indigo-200' : 'bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-white'}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="application/pdf"
              />
              {file ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 truncate max-w-[250px]">{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-500">
                    Skift fil
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white text-slate-300 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 shadow-sm">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-600">Klik for at uploade PDF</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Eller træk og slip filen her</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* QUESTIONS SECTION */}
          <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">2. Analyse Spørgsmål</h3>
              <span className="text-[10px] font-bold text-slate-300">{questions.length} spørgsmål</span>
            </div>

            <div className="space-y-3 mb-6">
              <AnimatePresence mode="popLayout">
                {questions.map((q, i) => (
                  <motion.div 
                    key={i}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl group"
                  >
                    <div className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 flex-1">{q}</p>
                    <button 
                      onClick={() => removeQuestion(i)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="Tilføj nyt spørgsmål..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
                className="rounded-xl border-slate-200 focus:ring-indigo-600"
              />
              <Button 
                onClick={addQuestion}
                className="rounded-xl bg-slate-900 text-white shrink-0"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </section>

          <Button 
            onClick={runAnalysis}
            disabled={isAnalyzing || !pdfBase64 || questions.length === 0}
            className="w-full h-16 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Analyserer dokument...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-3 fill-current" />
                Kør AI Analyse
              </>
            )}
          </Button>
        </div>

        {/* RIGHT COLUMN: RESULTS */}
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm min-h-[600px] flex flex-col overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Analyseresultater</h3>
              </div>
              {analysisResult && (
                <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Klar</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-8 space-y-8 overflow-y-auto max-h-[700px]">
              <AnimatePresence mode="wait">
                {isAnalyzing ? (
                  <motion.div 
                    key="analyzing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 gap-6 text-center"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-indigo-400/20 blur-3xl rounded-full animate-pulse"></div>
                      <div className="w-20 h-20 bg-white border border-indigo-100 rounded-3xl flex items-center justify-center shadow-xl relative z-10">
                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-bold text-slate-800">Gennemgår siden...</h4>
                       <p className="text-sm text-slate-400 font-medium">Gemini 2.5 Flash læser dit dokument og udtrækker svar.</p>
                    </div>
                  </motion.div>
                ) : analysisResult ? (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-10"
                  >
                    {/* RESULTS LIST */}
                    <div className="space-y-6">
                      {analysisResult.results.map((res, i) => (
                        <div key={i} className="space-y-3">
                          <div className="flex items-center gap-2 px-1">
                            <span className="w-5 h-5 rounded bg-indigo-950 text-indigo-400 flex items-center justify-center text-[10px] font-bold">Q</span>
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900">{res.question}</h4>
                          </div>
                          <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm text-slate-600 leading-relaxed font-medium">
                            {res.answer}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CONCLUSION */}
                    {analysisResult.overallConclusion && (
                      <div className="space-y-4">
                         <div className="flex items-center gap-2 px-1">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Overordnet Konklusion</h4>
                          </div>
                          <div className="p-8 bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] italic text-indigo-900 leading-relaxed font-medium">
                            {analysisResult.overallConclusion}
                          </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-6 opacity-30 select-none grayscale">
                    <div className="w-32 h-32 bg-slate-50 rounded-full border border-slate-100 flex items-center justify-center">
                       <FileSearch className="w-16 h-16 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 max-w-[200px]">Upload et dokument og kør analysen for at se resultater her</p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* PDF PREVIEW IF UPLOADED */}
            {file && (
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dokument Preview</h4>
                  <button 
                    onClick={() => { setFile(null); setPdfBase64(null); setAnalysisResult(null); }}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-500 hover:scale-105 transition-all"
                  >
                    <X className="w-3 h-3" /> Fjern fil
                  </button>
                </div>
                <div className="h-[200px] w-full bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                   {/* Simplified preview - in a real app would use a library or iframe */}
                   <div className="flex flex-col items-center gap-3 opacity-50">
                      <FileText className="w-10 h-10 text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400">{file.name}</p>
                   </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
