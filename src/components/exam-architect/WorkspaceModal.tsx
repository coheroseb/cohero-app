'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  FileText, 
  Book, 
  Download, 
  Loader2, 
  List, 
  Target, 
  Maximize, 
  Sparkles, 
  Zap, 
  ChevronUp, 
  Save, 
  Layers, 
  Compass,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import type { ExamBlueprint } from '@/ai/flows/types';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { twistBlueprintAction } from '@/app/actions';

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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white"
        >
          <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
            <button onClick={onClose} className="p-2.5 bg-white rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-all active:scale-90">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-10 overflow-y-auto">
            <div className="prose prose-indigo max-w-none text-slate-600 leading-relaxed font-medium">
               {content}
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

const WorkspaceColumn: React.FC<{ icon: any; title: string; children: React.ReactNode, color: string, onExpand?: () => void }> = ({ icon: Icon, title, children, color, onExpand }) => (
    <div className={`bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col overflow-hidden h-full group hover:border-indigo-100 transition-all`}>
        <div className={`flex-shrink-0 flex items-center justify-between gap-3 mb-6`}>
            <div className='flex items-center gap-3'>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} flex-shrink-0 shadow-sm transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900">{title}</h3>
            </div>
            {onExpand && (
              <Button variant="ghost" size="sm" onClick={onExpand} className="rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50">
                  <Maximize className="w-4 h-4" />
              </Button>
            )}
        </div>
        <div className="prose prose-sm max-w-none text-slate-500 leading-relaxed overflow-y-auto font-medium">
            {children}
        </div>
    </div>
);

const WorkspaceModal: React.FC<WorkspaceModalProps> = ({ isOpen, onClose, blueprint, caseDescription, onSave }) => {
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
      const result = await twistBlueprintAction({
        blueprintTitle: localBlueprint.title,
        currentProblemStatement: localBlueprint.draftProblemStatement,
        twist: twist,
      });
      
      setLocalBlueprint(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          draftProblemStatement: result.data.newProblemStatement,
          problemStatementTip: result.data.newTip
        };
      });

      toast({
        title: "Problemformulering twistet!",
        description: "En ny vinkel er blevet integreret i din plan.",
      });
      setTwist('');
      setShowTwist(false);
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
        if(expandedSection) setExpandedSection(null);
        else onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, expandedSection]);
  
  const handleDownload = async () => {
    if (!localBlueprint) return;
    setIsDownloading(true);
    try {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
        const { saveAs } = await import('file-saver');

        const doc = new Document({
            creator: "Cohéro",
            title: `Byggeplan: ${localBlueprint.title}`,
            sections: [{
                properties: {},
                children: [
                    new Paragraph({ text: localBlueprint.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                    
                    new Paragraph({ text: "Problemformulering", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: localBlueprint.draftProblemStatement, bold: true })], spacing: { after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: `Tip: ${localBlueprint.problemStatementTip}`, italics: true, color: "666666" })] }),

                    new Paragraph({ text: "Strategi & Rød Tråd", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                    new Paragraph({ text: localBlueprint.researchStrategy || "", spacing: { after: 200 } }),
                    new Paragraph({ children: [new TextRun({ text: localBlueprint.redThreadAdvice || "", italics: true })] }),

                    new Paragraph({ text: "Strukturplan", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                    ...(localBlueprint.sections?.flatMap(s => [
                        new Paragraph({ children: [new TextRun({ text: s.title, bold: true }), new TextRun({ text: ` (${s.weight})`, color: "888888" })] }),
                        new Paragraph({ text: s.focus, spacing: { after: 200 } }),
                    ]) || []),

                    new Paragraph({ text: "Teoretisk Stillads", heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
                    ...(localBlueprint.suggestedTheories?.flatMap(t => [
                        new Paragraph({ children: [new TextRun({ text: t.name, bold: true })] }),
                        new Paragraph({ children: [new TextRun({ text: t.why, italics: true })] }),
                        new Paragraph({ children: [new TextRun({ text: t.bookReference ? `Kilde: ${t.bookReference}` : "", size: 18 })], spacing: { after: 200 } }),
                    ]) || []),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Byggeplan - ${localBlueprint.title.substring(0, 40)}.docx`);
    } catch (e) {
        console.error(e);
        toast({ title: "Fejl", description: "Kunne ikke generere Word-fil.", variant: "destructive" });
    } finally {
        setIsDownloading(false);
    }
  };

  if (!isOpen || !localBlueprint) return null;
  
  const problemFormulationContent = (
    <div className="space-y-6">
      <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
        <h4 className='text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3'>Endelig Formulering</h4>
        <p className="font-bold text-slate-900 text-base leading-relaxed">
          {localBlueprint.draftProblemStatement}
        </p>
      </div>

      <div className="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100/50">
        <h4 className='text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3'>Vejlederens Tip</h4>
        <p className="text-sm text-indigo-900/80 italic leading-relaxed">
          "{localBlueprint.problemStatementTip}"
        </p>
      </div>

      <div className="pt-4">
        <button 
          onClick={() => setShowTwist(!showTwist)}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          {showTwist ? 'Skjul Twist' : 'Twist denne formulering'}
        </button>
        
        <AnimatePresence>
          {showTwist && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-6 bg-white border border-indigo-100 rounded-3xl space-y-4 shadow-sm">
                    <Textarea
                        placeholder="Tilføj en ny vinkel, f.eks: 'Jeg vil også have fokus på...' eller 'Gør det mere kritisk'"
                        value={twist}
                        onChange={(e) => setTwist(e.target.value)}
                        className="bg-slate-50 border-slate-100 rounded-xl text-sm min-h-[100px] resize-none"
                    />
                    <Button onClick={handleTwist} disabled={isTwisting || !twist} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                        {isTwisting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                        Integrér Twist
                    </Button>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
  
  const sectionsContent = (
    <div className="space-y-4">
      {localBlueprint.sections?.map((s, i) => (
        <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0">
             <span className="text-sm font-black text-slate-900 leading-none">{s.weight}</span>
           </div>
           <div>
             <h5 className="font-bold text-slate-900 text-sm mb-1">{s.title}</h5>
             <p className="text-xs text-slate-500 leading-relaxed">{s.focus}</p>
             {s.theoryLink && <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest">{s.theoryLink}</span>}
           </div>
        </div>
      ))}
    </div>
  );

  const theoriesContent = (
    <div className="grid gap-4">
      {localBlueprint.suggestedTheories?.map((t, i) => (
        <div key={i} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 group/theo hover:bg-white hover:border-indigo-100 transition-all">
          <h5 className="font-black text-slate-900 mb-2">{t.name}</h5>
          <p className="text-xs text-slate-600 leading-relaxed italic mb-3">"{t.why}"</p>
          {t.bookReference && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-500">
               <Book className="w-3 h-3" /> {t.bookReference}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const redThreadContent = (
    <div className="space-y-6">
       <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
             <Compass className="w-3.5 h-3.5" /> Strategi
          </h4>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">{localBlueprint.researchStrategy}</p>
       </div>
       <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/10">
          <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-3">
             <Layers className="w-3.5 h-3.5" /> Rød Tråd
          </h4>
          <p className="text-sm font-medium leading-relaxed italic opacity-90">"{localBlueprint.redThreadAdvice}"</p>
       </div>
    </div>
  );

  return (
    <>
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden"
    >
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 sm:px-10 py-5 flex justify-between items-center shadow-sm">
        <div className="max-w-xl">
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-1 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Akademisk Arbejdsrum
            </p>
            <h1 className="text-lg md:text-xl font-black text-slate-900 truncate">
                {localBlueprint.title}
            </h1>
        </div>
        <div className="flex items-center gap-3">
             <Button
                onClick={handleDownload}
                variant="outline"
                className="h-11 px-5 rounded-2xl font-bold border-slate-200 shadow-sm"
                disabled={isDownloading}
            >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Download className="w-4 h-4 mr-2"/>}
                <span className="hidden sm:inline">{isDownloading ? 'Genererer...' : 'Export Word'}</span>
            </Button>
            <Button
                onClick={() => onSave(localBlueprint)}
                className="h-11 px-6 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
            >
                <Save className="w-4 h-4 mr-2" />
                Gem
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={onClose}
              className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
        </div>
      </header>
      
      <div className="flex-grow overflow-y-auto w-full max-w-7xl mx-auto p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            
            <div className="space-y-8">
                 <WorkspaceColumn icon={Target} title="Problemformulering" color="text-rose-600 bg-rose-50" onExpand={() => setExpandedSection({ title: "Problemformulering", content: problemFormulationContent })}>
                   {problemFormulationContent}
                 </WorkspaceColumn>
                 <WorkspaceColumn icon={List} title="Strukturplan" color="text-blue-600 bg-blue-50" onExpand={() => setExpandedSection({ title: "Strukturplan", content: sectionsContent })}>
                   {sectionsContent}
                 </WorkspaceColumn>
            </div>

            <div className="space-y-8">
               <WorkspaceColumn icon={BookOpen} title="Teoretisk Stillads" color="text-indigo-600 bg-indigo-50" onExpand={() => setExpandedSection({ title: "Teoretisk Stillads", content: theoriesContent })}>
                   {theoriesContent}
                </WorkspaceColumn>
                 <WorkspaceColumn icon={Compass} title="Strategi & Rød Tråd" color="text-emerald-600 bg-emerald-50" onExpand={() => setExpandedSection({ title: "Strategi & Rød Tråd", content: redThreadContent })}>
                   {redThreadContent}
                 </WorkspaceColumn>
            </div>
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
      {expandedSection && (
          <ExpandedViewModal 
              title={expandedSection.title} 
              content={expandedSection.content} 
              onClose={() => setExpandedSection(null)} 
          />
      )}
    </AnimatePresence>
    </>
  );
};
export default WorkspaceModal;
