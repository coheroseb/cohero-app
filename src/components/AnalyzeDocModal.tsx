
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Sparkles, Loader2, ExternalLink, Lock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeFtDocumentAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/app/provider';

interface AnalyzeDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    title: string;
    pdfUrl: string;
    htmUrl: string;
  };
}

const AnalyzeDocModal: React.FC<AnalyzeDocModalProps> = ({ isOpen, onClose, document }) => {
  const { userProfile } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isPremiumUser = userProfile && ['Kollega+', 'Semesterpakken', 'Kollega++'].includes(userProfile.membership);

  const handleAnalyze = async () => {
    if (!isPremiumUser || !document.htmUrl) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeFtDocumentAction({
        documentUrl: document.htmUrl,
        documentTitle: document.title,
      });
      setAnalysis(result.data.explanation);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError('Kunne ikke analysere dokumentet. Prøv venligst igen.');
      toast({
        variant: 'destructive',
        title: 'Analyse Fejlede',
        description: err.message || 'Der skete en uventet fejl.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    setAnalysis(null);
    setError(null);
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-amber-950/60 backdrop-blur-md" onClick={handleClose}></div>
      
      <div className="relative bg-[#FDFCF8] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-8 border-b border-amber-100 bg-white flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-950 serif line-clamp-2 pr-4">{document.title}</h2>
            <button onClick={handleClose} className="p-2 hover:bg-amber-50 rounded-xl transition-colors shrink-0">
                <X className="w-6 h-6 text-amber-900" />
            </button>
        </div>

        <div className="p-10">
          {!analysis && !isLoading && (
            <div className="flex flex-col sm:flex-row gap-4">
              <a href={document.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="outline" className="w-full h-14">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Åbn Originalt Dokument
                </Button>
              </a>
              {isPremiumUser ? (
                  <Button onClick={handleAnalyze} className="w-full sm:flex-1 h-14" disabled={isLoading}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyser med AI
                  </Button>
              ) : (
                <Link href="/upgrade" className="flex-1">
                    <Button className="w-full h-14 bg-amber-400 text-amber-900 hover:bg-amber-300">
                        <Lock className="w-4 h-4 mr-2"/>
                        Opgrader for at analysere
                    </Button>
                </Link>
              )}
            </div>
          )}

          {isLoading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
              <p className="mt-4 text-sm font-semibold text-slate-600">AI'en læser dokumentet for dig... Dette kan tage et øjeblik.</p>
            </div>
          )}

          {error && <p className="text-center text-red-500 py-12">{error}</p>}
          
          {analysis && (
            <div className="max-h-[60vh] overflow-y-auto pr-4">
                <div className="prose prose-sm max-w-none prose-h3:font-bold prose-h3:text-amber-800" dangerouslySetInnerHTML={{ __html: analysis }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyzeDocModal;

  