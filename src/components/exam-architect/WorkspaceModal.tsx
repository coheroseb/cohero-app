'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { X, FileText, Book, ArrowRight, HelpCircle, Copy, Check, Download, Loader2, List, Tags, FlaskConical, Target, Maximize, Sparkles, Zap, ChevronDown, Save } from 'lucide-react';
import type { ExamBlueprint } from '@/ai/flows/types';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';


interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: ExamBlueprint | null;
  caseDescription: string;
  onSave: (blueprint: ExamBlueprint) => void;
}

const ExpandedViewModal: React.FC<{ title: string; content: React.ReactNode; onClose: () => void }> = ({ title, content, onClose }) => {
    if (!content) return null;
  
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50">
        <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-lg flex flex-col max-h-[90vh]">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-amber-950">{title}</h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 overflow-y-auto">
            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
               {content}
            </div>
          </div>
        </div>
      </div>
    );
  };

const WorkspaceColumn: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode, color: string, onExpand?: () => void }> = ({ icon, title, children, color, onExpand }) => (
    <div className={`bg-white p-6 rounded-2xl border border-amber-100/60 flex flex-col overflow-hidden h-full`}>
        <div className={`flex-shrink-0 flex items-center justify-between gap-3 mb-4`}>
            <div className='flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-amber-950 serif">{title}</h3>
            </div>
            {onExpand && (
              <Button variant="ghost" size="sm" onClick={onExpand} aria-label={`Udvid ${title}`}>
                  <Maximize className="w-4 h-4" />
              </Button>
            )}
        </div>
        <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed overflow-y-auto">
            {children}
        </div>
    </div>
);



const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, blueprint, caseDescription, onSave }) => {
  const [copiedTitle, setCopiedTitle] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<{ title: string; content: React.ReactNode } | null>(null);

  const [localBlueprint, setLocalBlueprint] = useState(blueprint);
  const [twist, setTwist] = useState('');
  const [showTwist, setShowTwist] = useState(false);
  const [isTwisting, setIsTwisting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalBlueprint(blueprint);
  }, [blueprint]);
  
  const handleTwist = async () => {
    if (!localBlueprint || !twist) return;
    setIsTwisting(true);
    try {
      // This functionality is currently disabled as it requires a more complex AI flow update.
      // The original `twistProblemFormulationAction` expects a different data structure.
      console.warn("Twist functionality is disabled.");
      toast({
        variant: "destructive",
        title: "Funktion deaktiveret",
        description: "Twist-funktionen er midlertidigt ude af drift.",
      });
      // const result = await twistProblemFormulationAction({
      //   originalProblemFormulation: localBlueprint.problemStatementTip, // This needs to be adapted
      //   originalResearchQuestions: [], // This needs to be adapted from sections
      //   twist: twist,
      // });
      // setLocalBlueprint(prev => ({ ...prev, ...result.data }));
    } catch (e) {
      console.error("Failed to twist formulation:", e);
      toast({
        variant: "destructive",
        title: "Fejl",
        description: "Kunne ikke generere nyt forslag. Prøv igen.",
      });
    } finally {
      setIsTwisting(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if(expandedSection) {
            setExpandedSection(null);
        } else {
            onClose();
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, expandedSection]);
  
  const handleDownload = async () => {
    if (!localBlueprint) return;
    setIsDownloading(true);

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
    const { saveAs } = await import('file-saver');

    const createSection = (title: string, children: (Paragraph | undefined)[]) => [
        new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
        }),
        ...children.filter((p): p is Paragraph => p !== undefined),
    ];

    const problemFormulationParagraphs = [
      new Paragraph({ text: 'Tip til Problemformulering', heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
      new Paragraph({ text: localBlueprint.problemStatementTip, italics: true }),
    ];

    const sectionsParagraphs = localBlueprint.sections?.flatMap(s => [
        new Paragraph({ text: s.title, style: "strong" }),
        new Paragraph({ text: s.focus }),
        new Paragraph({ text: `Vægt: ${s.weight}`, size: 18, color: "808080" }),
        new Paragraph({ text: '' }),
    ]);

    const theoriesParagraphs = localBlueprint.suggestedTheories?.flatMap(t => [
        new Paragraph({ text: t.name, style: "strong" }),
        new Paragraph({ text: `Relevans: ${t.why}`, italics: true }),
        new Paragraph({ text: t.bookReference ? `Kilde: ${t.bookReference}` : '', size: 18, color: "808080" }),
        new Paragraph({ text: '' }),
    ]);
    
    const redThreadParagraph = [new Paragraph(localBlueprint.redThreadAdvice || '')];
    
    const doc = new Document({
        creator: "Cohéro",
        title: `Arkitekt-tegning: ${caseDescription}`,
        sections: [{
            properties: {},
            children: [
                new Paragraph({ text: caseDescription, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                ...createSection("Problemformulering", problemFormulationParagraphs),
                ...createSection("Strukturforslag", sectionsParagraphs || []),
                ...createSection("Teoretisk Stillads", theoriesParagraphs || []),
                ...createSection("Den Røde Tråd", redThreadParagraph),
            ],
        }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Cohéro Opgave-Arkitekt - ${caseDescription.substring(0, 30).replace(/[/\\?%*:|"<>]/g, '-')}.docx`);
        setIsDownloading(false);
    });
  };
  
  const handleInternalSave = () => {
    if (localBlueprint) {
      onSave(localBlueprint);
    }
  }

  if (!isOpen || !localBlueprint) return null;
  
  const problemFormulationContent = (
    <div className="space-y-4">
      <h4 className='font-bold text-amber-950'>Tip til Problemformulering</h4>
      <blockquote className="border-l-4 border-amber-300 pl-4 italic">
        {localBlueprint.problemStatementTip}
      </blockquote>
      {showTwist && (
          <div className="mt-6 pt-6 border-t border-dashed border-purple-200 animate-fade-in-up">
              <h4 className="text-base font-bold text-amber-950 serif mb-4">Twist Problemformuleringen</h4>
              <div className="space-y-4">
                  <Textarea
                      placeholder="Skriv en ny vinkel, en refleksion eller en justering til dit emne her..."
                      value={twist}
                      onChange={(e) => setTwist(e.target.value)}
                      rows={4}
                  />
                  <Button onClick={handleTwist} disabled={true} className="w-full">
                      <Zap className="w-4 h-4 mr-2" />
                      Generer nyt forslag (Deaktiveret)
                  </Button>
              </div>
          </div>
      )}
    </div>
  );
  
  const sectionsContent = <ul className="list-decimal list-outside pl-5 space-y-3">{localBlueprint.sections?.map((s, i) => <li key={i}><strong>{s.title} ({s.weight}):</strong> {s.focus}</li>)}</ul>;
  const theoriesContent = <div className="space-y-4">{localBlueprint.suggestedTheories?.map((t, i) => <div key={i}><p className="font-bold">{t.name}</p><p className="text-xs italic">{t.why}</p>{t.bookReference && <p className='text-xs mt-1'><span className='font-semibold'>Kilde:</span> {t.bookReference}</p>}</div>)}</div>;
  const redThreadContent = <p>{localBlueprint.redThreadAdvice}</p>;

  return (
    <>
    <div className="fixed inset-0 z-[100] bg-[#FDFCF8] p-4 sm:p-8 flex flex-col">
      <header className="flex-shrink-0 flex justify-between items-center mb-6">
        <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase text-amber-700 tracking-wider">Arbejdsrum</p>
            <h1 className="text-xl md:text-2xl font-bold text-amber-950 serif truncate">
                {caseDescription}
            </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button
                onClick={() => setShowTwist(!showTwist)}
                variant="outline"
                className="flex items-center gap-2 group"
            >
                <Sparkles className="w-4 h-4 text-purple-500 transition-transform group-hover:scale-125" />
                <span className="hidden sm:inline">Twist</span>
            </Button>
             <Button
                onClick={handleDownload}
                variant="outline"
                className="flex items-center gap-2"
                disabled={isDownloading}
            >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4"/>}
                <span className="hidden sm:inline">{isDownloading ? 'Genererer...' : 'Download'}</span>
            </Button>
            <Button
                onClick={handleInternalSave}
                variant="outline"
                className="flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Gem</span>
            </Button>
            <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-amber-900 bg-white/50 rounded-full hover:bg-amber-100 transition-colors"
            >
            <X className="w-6 h-6" />
            </button>
        </div>
      </header>
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
          
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 -mr-2">
               <WorkspaceColumn icon={<Target className="w-5 h-5"/>} title="Problemformulering" color="text-rose-700 bg-rose-50" onExpand={() => setExpandedSection({ title: "Problemformulering", content: problemFormulationContent })}>
                 {problemFormulationContent}
               </WorkspaceColumn>
               <WorkspaceColumn icon={<List className="w-5 h-5"/>} title="Strukturforslag" color="text-sky-700 bg-sky-50" onExpand={() => setExpandedSection({ title: "Strukturforslag", content: sectionsContent })}>
                 {sectionsContent}
               </WorkspaceColumn>
          </div>

          
          <div className="flex flex-col gap-6 overflow-y-auto pr-2 -mr-2">
             <WorkspaceColumn icon={<BookOpen className="w-5 h-5"/>} title="Teoretisk Stillads" color="text-indigo-700 bg-indigo-50" onExpand={() => setExpandedSection({ title: "Teoretisk Stillads", content: theoriesContent })}>
                 {theoriesContent}
              </WorkspaceColumn>
               <WorkspaceColumn icon={<Layers className="w-5 h-5"/>} title="Den Røde Tråd" color="text-emerald-700 bg-emerald-50" onExpand={() => setExpandedSection({ title: "Den Røde Tråd", content: redThreadContent })}>
                 {redThreadContent}
               </WorkspaceColumn>
          </div>
      </div>
    </div>
    {expandedSection && (
        <ExpandedViewModal 
            title={expandedSection.title} 
            content={expandedSection.content} 
            onClose={() => setExpandedSection(null)} 
        />
    )}
    </>
  );
};
export default WorkspaceModal;
