'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, 
    CheckCircle2, 
    Check, 
    Users, 
    User as UserIcon, 
    Lock as LockIcon, 
    Info, 
    ScrollText, 
    Target, 
    Link as LinkIcon, 
    Loader2,
    BookOpen,
    Sparkles,
    Undo2, 
    Redo2,
    FileText, MoreVertical, X, Wand2, Lightbulb, PlayCircle, Minimize2, RefreshCcw, Send, Settings, Save, Download, PenTool, LayoutTemplate, Layers, MousePointer2, Activity
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import('react-quill');
        const QuillWrapper = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
        QuillWrapper.displayName = 'ReactQuillWrapper';
        return QuillWrapper;
    },
    { ssr: false }
);
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PortfolioEntry, Evidence } from './types';
import { User } from 'firebase/auth';
import { getLivePortfolioFeedbackAction, designSectionOutlineAction, detectAiContentAction } from '@/app/actions';

interface FocusedPortfolioWorkspaceProps {
    newPortfolioEntry: any;
    setNewPortfolioEntry: (v: any) => void;
    handleSavePortfolioEntry: (e?: React.FormEvent, silent?: boolean) => void;
    isAutoSaving: boolean;
    lastSaved: Date | null;
    setIsAddingPortfolioEntry: (v: boolean) => void;
    setEditingPortfolioEntry: (v: PortfolioEntry | null) => void;
    editingPortfolioEntry: PortfolioEntry | null;
    evidence: Evidence[] | undefined;
    locale: string;
    existingAssignments: string[];
    user: User | null;
    contacts?: any[];
    members?: any[];
    group?: any;
}

const CustomToolbar = () => (
    <div id="quill-toolbar" className="flex justify-center border-none border-b border-indigo-100/50 pb-2 mb-4 bg-transparent gap-2 items-center w-full sticky top-0 z-50">
        <span className="ql-formats">
            <button className="ql-undo px-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <Undo2 className="w-4 h-4 cursor-pointer stroke-[2.5]" />
            </button>
            <button className="ql-redo px-2 text-slate-400 hover:text-indigo-600 transition-colors">
                <Redo2 className="w-4 h-4 cursor-pointer stroke-[2.5]" />
            </button>
        </span>
        <div className="h-4 w-px bg-slate-200 mx-2"></div>
        <span className="ql-formats mr-2">
            <select className="ql-header bg-transparent text-slate-600 font-bold border-none outline-none text-[12px] uppercase tracking-widest cursor-pointer hover:bg-slate-50 rounded px-2" defaultValue="">
                <option value="1">TITEL</option>
                <option value="2">AFSNIT</option>
                <option value="">NORMAL</option>
            </select>
        </span>
        <div className="h-4 w-px bg-slate-200 mx-2"></div>
        <span className="ql-formats">
            <button className="ql-bold px-2 text-slate-400 hover:text-indigo-600 transition-colors"></button>
            <button className="ql-italic px-2 text-slate-400 hover:text-indigo-600 transition-colors"></button>
            <button className="ql-underline px-2 text-slate-400 hover:text-indigo-600 transition-colors"></button>
            <button className="ql-strike px-2 text-slate-400 hover:text-indigo-600 transition-colors"></button>
        </span>
        <div className="h-4 w-px bg-slate-200 mx-2"></div>
        <span className="ql-formats">
            <button className="ql-list px-2 text-slate-400 hover:text-indigo-600 transition-colors" value="ordered"></button>
            <button className="ql-list px-2 text-slate-400 hover:text-indigo-600 transition-colors" value="bullet"></button>
        </span>
        <div className="h-4 w-px bg-slate-200 mx-2"></div>
        <span className="ql-formats">
            <button className="ql-clean px-2 text-slate-400 hover:text-rose-500 transition-colors"></button>
        </span>
    </div>
);

const QUILL_MODULES = {
    toolbar: {
        container: "#quill-toolbar",
        handlers: {
            undo: function() {
                // @ts-ignore
                this.quill.history.undo();
            },
            redo: function() {
                // @ts-ignore
                this.quill.history.redo();
            }
        }
    },
    history: {
        delay: 500,
        maxStack: 200,
        userOnly: true
    },
    keyboard: {
        bindings: {
            tab: {
                key: 9,
                handler: function() { return true; }
            },
            shiftEnter: {
                key: 13,
                shiftKey: true,
                handler: function(range: any, context: any) {
                    // @ts-ignore
                    this.quill.insertText(range.index, '\n');
                    // @ts-ignore
                    this.quill.setSelection(range.index + 1);
                    return false;
                }
            }
        }
    }
};

export const FocusedPortfolioWorkspace: React.FC<FocusedPortfolioWorkspaceProps> = ({ 
    newPortfolioEntry, 
    setNewPortfolioEntry, 
    handleSavePortfolioEntry, 
    setIsAddingPortfolioEntry, 
    setEditingPortfolioEntry, 
    editingPortfolioEntry, 
    evidence, 
    locale, 
    existingAssignments,
    isAutoSaving,
    lastSaved,
    user,
    contacts = [],
    members = [],
    group = null
}) => {
    const [localContent, setLocalContent] = useState(newPortfolioEntry.content);
    const [localTitle, setLocalTitle] = useState(newPortfolioEntry.title);

    const quillRef = useRef<any>(null);
    const [editorSelection, setEditorSelection] = useState<any>(null);
    const [isInsertingReference, setIsInsertingReference] = useState<string | null>(null);

    const handleInsertEvidenceReference = (evidenceItem: Evidence) => {
        if (!quillRef.current) return;

        try {
            const editor = quillRef.current.getEditor();
            const index = editorSelection ? editorSelection.index : (editor.getLength() - 1);
            
            let citationIntro = '';
            if (evidenceItem.apaRef && evidenceItem.apaRef.authors) {
                 const year = evidenceItem.apaRef.year || 'n.d.';
                 const authors = evidenceItem.apaRef.authors;
                 const mainAuthor = authors.split(',')[0].split(' ')[0] || authors.split(' ')[0];
                 citationIntro = `(${mainAuthor}, ${year}`;
            } else {
                 citationIntro = `(${evidenceItem.title}`;
            }

            const citation = `${citationIntro}) `;

            editor.insertText(index, citation);
            editor.setSelection(index + citation.length);

            if (!newPortfolioEntry.linkedEvidenceIds?.includes(evidenceItem.id)) {
                 setNewPortfolioEntry((prev: any) => ({
                     ...prev,
                     linkedEvidenceIds: [...(prev.linkedEvidenceIds || []), evidenceItem.id]
                 }));
            }
        } catch (e) {
            console.error("Citation error:", e);
        }
    };

    // Sync local state when the entry changes (e.g. switching between items)
    useEffect(() => {
        if (newPortfolioEntry.content !== localContent) {
            setLocalContent(newPortfolioEntry.content);
        }
        if (newPortfolioEntry.title !== localTitle) {
            setLocalTitle(newPortfolioEntry.title);
        }
    }, [newPortfolioEntry.title, editingPortfolioEntry?.id]);

    const handleContentChange = (content: string) => {
        setLocalContent(content);
    };

    const handleTitleChange = (title: string) => {
        setLocalTitle(title);
    };

    // Debounce content synchronization to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localContent !== newPortfolioEntry.content) {
                setNewPortfolioEntry((prev: any) => ({ ...prev, content: localContent }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localContent]);

    const [liveFeedback, setLiveFeedback] = useState<{strength: string, improvement: string, score: number} | null>(null);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);

    // AI Detection
    const [aiDetectionResult, setAiDetectionResult] = useState<{score: number, explanation: string} | null>(null);
    const [isCheckingAi, setIsCheckingAi] = useState(false);

    const handleDetectAi = async () => {
        const cleanContent = localContent.replace(/<[^>]*>/g, '').trim();
        if (cleanContent.length < 50) return;
        
        setIsCheckingAi(true);
        try {
            const res = await detectAiContentAction({ text: cleanContent });
            setAiDetectionResult({ score: res.aiProbabilityScore, explanation: res.explanation });
        } catch (e) {
            console.error("AI check error", e);
        } finally {
            setIsCheckingAi(false);
        }
    };

    const isForside = localTitle.toLowerCase().trim() === 'forside' || localTitle.toLowerCase().includes('forside');
    const [showForsideHelper, setShowForsideHelper] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    useEffect(() => {
        // Automatically show the wizard if the title mentions "forside" and the content is mostly empty
        if (isForside && localContent.replace(/<[^>]*>/g, '').trim().length < 20) {
            setShowForsideHelper(true);
        } else {
            setShowForsideHelper(false);
        }
    }, [isForside, localContent]);

    const vejledere = contacts?.filter(c => c.title && c.title.toLowerCase().includes('vejleder')) || [];

    const handleGenerateForside = () => {
        const includedMembers = members?.filter(m => selectedMembers.includes(m.id)) || [];
        const includedContacts = vejledere.filter(c => selectedContacts.includes(c.id));

        const memberText = includedMembers.length > 0 ? includedMembers.map(m => m.nickname || m.email.split('@')[0]).join('<br>') : '';
        const contactText = includedContacts.length > 0 ? includedContacts.map(c => `${c.title || 'Kontakt'}: ${c.name} (${c.organization})`).join('<br>') : '';

        const htmlToInsert = `
            <h1 style="text-align: center; font-size: 3em;">${group?.name || 'Projekt'}</h1>
            <p style="text-align: center;"><br></p>
            ${memberText ? `<p style="text-align: center;"><strong>Udarbejdet af:</strong></p><p style="text-align: center;">${memberText}</p><p style="text-align: center;"><br></p>` : ''}
            ${contactText ? `<p style="text-align: center;"><strong>Kontakter:</strong></p><p style="text-align: center;">${contactText}</p><p style="text-align: center;"><br></p>` : ''}
            <p style="text-align: center;"><strong>Afleveringsdato:</strong> ${new Date().toLocaleDateString(locale === 'da' ? 'da-DK' : 'en-US')}</p>
            <p style="text-align: center;"><br></p>
        `;

        setLocalContent(htmlToInsert);
        setShowForsideHelper(false);
    };

    const isSectionEmpty = localContent.replace(/<[^>]*>/g, '').trim().length < 50;
    const [showInspiration, setShowInspiration] = useState(false);
    const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
    const [outlineResult, setOutlineResult] = useState<any | null>(null);

    const isLitteraturliste = localTitle.toLowerCase().replace(/\s/g, '').includes('litteraturliste');
    const [showLitteraturHelper, setShowLitteraturHelper] = useState(false);
    const [selectedLiterature, setSelectedLiterature] = useState<string[]>([]);

    useEffect(() => {
        if (evidence) {
            const literatureIds = evidence.filter((e: any) => e.apaRef?.authors).map((e: any) => e.id);
            if (selectedLiterature.length === 0) {
                setSelectedLiterature(literatureIds);
            }
        }
    }, [evidence]);

    // Problemformulering
    const isProblemformulering = localTitle.toLowerCase().replace(/\s/g, '').includes('problemformulering');

    useEffect(() => {
        if (isLitteraturliste) {
            setShowLitteraturHelper(true);
            setShowInspiration(false);
        } else {
            setShowLitteraturHelper(false);
            if (!isForside && !isProblemformulering && isSectionEmpty && localTitle.trim().length > 2) {
                setShowInspiration(true);
            } else {
                setShowInspiration(false);
            }
        }
    }, [isLitteraturliste, isForside, isProblemformulering, isSectionEmpty, localTitle]);

    const [showProblemHelper, setShowProblemHelper] = useState(false);
    const [problemDraft, setProblemDraft] = useState('');
    const [isGeneratingProblem, setIsGeneratingProblem] = useState(false);
    const [problemSuggestedEvidence, setProblemSuggestedEvidence] = useState<string[]>([]);

    useEffect(() => {
        setShowProblemHelper(isProblemformulering);
    }, [isProblemformulering]);

    const handleGenerateProblemformulering = async () => {
        if (!problemDraft.trim()) return;
        setIsGeneratingProblem(true);
        setProblemSuggestedEvidence([]);
        try {
            const evidenceContext = evidence?.map((e: any) => e.title).join(', ') || 'Ingen empiri';
            const req = {
                sectionTitle: 'Problemformulering',
                assignmentContext: `Brugerens egne tanker: "${problemDraft}". Tilgængelig empiri: ${evidenceContext}. Opgaveramme: ${newPortfolioEntry.assignment || 'ikke angivet'}.`,
                groupName: group?.name || '',
                evidence: evidence?.map((e: any) => ({ title: e.title, description: e.description || '', tags: e.tags || [], type: e.type || 'document' })) || []
            };
            const res = await designSectionOutlineAction(req);
            // Save the suggested evidence references
            if (res.suggestedEvidence && res.suggestedEvidence.length > 0) {
                setProblemSuggestedEvidence(res.suggestedEvidence);
            }
            // Build a nicely formatted problem statement scaffold
            const htmlToInsert = `
                <p><strong>${res.startingSentence}</strong></p>
                <p><br></p>
                <p><em>Vi ønsker at undersøge følgende:</em></p>
                <p><br></p>
                ${res.outline.map((o: string) => `<p>- ${o}</p>`).join('')}
                <p><br></p>
            `;
            setLocalContent(htmlToInsert);
        } catch (e) {
            console.error('Problem generation error:', e);
        } finally {
            setIsGeneratingProblem(false);
        }
    };

    const handleGenerateLitteraturliste = () => {
        const includedLiterature = evidence?.filter((e: any) => selectedLiterature.includes(e.id)) || [];
        
        const sorted = [...includedLiterature].sort((a: any, b: any) => {
             const authorA = a.apaRef?.authors || '';
             const authorB = b.apaRef?.authors || '';
             return authorA.localeCompare(authorB);
        });

        const htmlToInsert = `
            <h1 style="text-align: center; font-size: 2em;">Litteraturliste</h1>
            <p><br></p>
            ${sorted.map(item => {
                const text = item.apaRef?.fullAPA || `${item.apaRef?.authors} (${item.apaRef?.year}). ${item.apaRef?.title}. ${item.apaRef?.source}.`;
                return `<p style="padding-left: 2em; text-indent: -2em; margin-bottom: 1em;">${text}</p>`;
            }).join('')}
            <p><br></p>
        `;

        setLocalContent(htmlToInsert);
    };

    const handleGenerateInspiration = async () => {
        setIsGeneratingOutline(true);
        try {
            const evidenceData = evidence?.map((e: any) => ({
                 title: e.title || '',
                 description: e.description || '',
                 tags: e.tags || [],
                 type: e.type || 'document'
            }));
            const req = {
                 sectionTitle: localTitle,
                 assignmentContext: newPortfolioEntry.assignment || '',
                 groupName: group?.name || '',
                 evidence: evidenceData
            };
            const res = await designSectionOutlineAction(req);
            setOutlineResult(res);
        } catch (e) {
            console.error("Inspiration failed:", e);
        } finally {
            setIsGeneratingOutline(false);
        }
    };

    const handleInsertOutline = () => {
        if (!outlineResult) return;
        const htmlToInsert = `
            <p><strong>${outlineResult.startingSentence}</strong></p>
            <p><br></p>
            <p><em>Nøglepunkter at dække:</em></p>
            ${outlineResult.outline.map((o: string) => `<p>- ${o}</p>`).join('')}
            <p><br></p>
            ${outlineResult.suggestedEvidence.length > 0 ? `<p><em>Relevant empiri:</em></p>${outlineResult.suggestedEvidence.map((e: string) => `<p>- ${e}</p>`).join('')}<p><br></p>` : ''}
        `;
        setLocalContent(htmlToInsert);
        setOutlineResult(null);
        setShowInspiration(false);
    };

    // AI Live Feedback
    useEffect(() => {
        const cleanContent = localContent.replace(/<[^>]*>/g, '').trim();
        if (cleanContent.length < 20) return; // Vise allerede ved kortere tekst

        const timer = setTimeout(async () => {
            setIsGettingFeedback(true);
            try {
                const linkedTitleRefs = newPortfolioEntry.linkedEvidenceIds
                    .map((id: string) => evidence?.find(e => e.id === id)?.title)
                    .filter(Boolean)
                    .join(', ');

                const result = await getLivePortfolioFeedbackAction({
                    title: localTitle,
                    content: cleanContent,
                    assignmentGuidelines: newPortfolioEntry.assignment || '',
                    linkedEvidenceTitles: linkedTitleRefs || 'Ingen empiriske kilder knyttet.'
                });

                if (result.feedback) {
                    setLiveFeedback(result.feedback as any);
                }
            } catch (e) {
                console.error("Feedback error", e);
            } finally {
                setIsGettingFeedback(false);
            }
        }, 3000); // 3 seconds of inactivity
        return () => clearTimeout(timer);
    }, [localContent, localTitle, newPortfolioEntry.assignment, newPortfolioEntry.linkedEvidenceIds, evidence]);

    // Debounce title synchronization to parent
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localTitle !== newPortfolioEntry.title) {
                setNewPortfolioEntry((prev: any) => ({ ...prev, title: localTitle }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localTitle]);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white flex flex-col md:flex-row overflow-hidden font-sans"
        >
            <div className="flex-grow flex flex-col h-full bg-[#fcfcfc] overflow-y-auto custom-scrollbar pt-12 pb-32 px-6 md:px-20 relative">
                <div className="max-w-3xl mx-auto w-full space-y-12">
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-12"
                    >
                        <button onClick={() => { setIsAddingPortfolioEntry(false); setEditingPortfolioEntry(null); }} className="flex items-center gap-2.5 text-slate-400 hover:text-slate-900 transition-all group/back">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/back:bg-slate-900 group-hover/back:text-white transition-all">
                                <ArrowLeft className="w-3.5 h-3.5 group-hover/back:-translate-x-0.5 transition-transform" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{locale === 'da' ? 'Forlad Fokus-tilstand' : 'Leave Focus Mode'}</span>
                        </button>
                        
                        <div className="flex items-center gap-6 bg-white/50 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm transition-all hover:shadow-md">
                            {isAutoSaving ? (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    {locale === 'da' ? 'Gemmer...' : 'Saving...'}
                                </div>
                            ) : lastSaved ? (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {locale === 'da' ? 'Gemt ' : 'Saved '} {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                                    {locale === 'da' ? 'Klar' : 'Ready'}
                                </div>
                            )}
                            <div className="w-px h-3 bg-slate-200"></div>
                            <div className="flex items-center gap-3">
                                <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (localContent.replace(/<[^>]*>/g, '').length / 2000) * 100)}%` }} className="h-full bg-slate-900" />
                                </div>
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{localContent.replace(/<[^>]*>/g, '').length} {locale === 'da' ? 'tegn' : 'chars'}</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        <input 
                            value={localTitle} 
                            onChange={e => handleTitleChange(e.target.value)} 
                            placeholder={locale === 'da' ? 'Overskrift på afsnittet...' : 'Title of the section...'}
                            className="w-full text-5xl md:text-7xl font-black text-slate-900 placeholder:text-slate-100 border-none bg-transparent focus:ring-0 p-0 tracking-tight leading-tight selection:bg-indigo-100"
                            autoFocus
                        />
                        <div className="flex items-center gap-3 group/tag">
                            <div className="w-1 h-6 bg-slate-200 group-focus-within/tag:bg-indigo-500 rounded-full transition-colors"></div>
                            <input 
                                list="existing-assignments"
                                value={newPortfolioEntry.assignment} 
                                onChange={e => setNewPortfolioEntry({...newPortfolioEntry, assignment: e.target.value})} 
                                placeholder={locale === 'da' ? 'Uddannelse / Fag' : 'Subject / Course...'}
                                className="text-[13px] font-black text-slate-400 focus:text-indigo-600 placeholder:text-slate-200 border-none bg-transparent focus:ring-0 p-0 uppercase tracking-[0.3em] transition-all"
                            />
                        </div>
                    </motion.div>

                    {showForsideHelper && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-indigo-50/50 border border-indigo-100/50 rounded-[32px] p-8 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-indigo-900 tracking-tight">{locale === 'da' ? 'Auto-generer Forside' : 'Auto-generate Title Page'}</h4>
                                    <p className="text-[13px] font-medium text-indigo-500">{locale === 'da' ? 'Systemet kan automatisk sætte forsiden op baseret på din kontaktbog og gruppe.' : 'The system can format the title page based on your contacts and group.'}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-8">
                                {(members && members.length > 0) && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{locale === 'da' ? 'Studerende (Udarbejdet af)' : 'Students (Prepared by)'}</p>
                                        <div className="flex flex-wrap gap-3">
                                            {members.map((m: any) => (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => setSelectedMembers(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                                    className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all border outline-none ${selectedMembers.includes(m.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-indigo-900 border-indigo-100 hover:border-indigo-300'}`}
                                                >
                                                    {m.nickname || m.email.split('@')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(vejledere && vejledere.length > 0) && (
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{locale === 'da' ? 'Vejledere' : 'Supervisors'}</p>
                                        <div className="flex flex-wrap gap-3">
                                            {vejledere.map((c: any) => (
                                                <button 
                                                    key={c.id}
                                                    onClick={() => setSelectedContacts(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                                                    className={`px-5 py-3 rounded-2xl text-[13px] font-bold transition-all border outline-none ${selectedContacts.includes(c.id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-indigo-900 border-indigo-100 hover:border-indigo-300'}`}
                                                >
                                                    {c.title || 'Vejleder'}: {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <Button onClick={handleGenerateForside} className="w-full h-14 rounded-2xl bg-indigo-900 text-white font-black uppercase tracking-widest text-[12px] shadow-xl shadow-indigo-900/10 active:scale-95 transition-all">
                                    {locale === 'da' ? 'Indsæt Forside Struktur' : 'Insert Title Page'}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {showProblemHelper && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-amber-50/60 border border-amber-100/60 rounded-[32px] p-8 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-amber-500 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                                    <Lightbulb className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-amber-900 tracking-tight">{locale === 'da' ? 'Hjælp til Problemformulering' : 'Problem Statement Helper'}</h4>
                                    <p className="text-[13px] font-medium text-amber-600">
                                        {locale === 'da' ? 'Skriv frit hvad du måske gerne vil undersøge – AI\'en hjælper dig med at forme det til en akademisk problemformulering.' : 'Write freely what you want to investigate. The AI will help you shape it into an academic problem statement.'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <textarea
                                    value={problemDraft}
                                    onChange={e => setProblemDraft(e.target.value)}
                                    placeholder={locale === 'da' ? 'Skriv dine tanker her... F.eks. "Jeg er interesseret i at undersøge, hvordan unge håndterer stress på SoMe, og hvad det gør ved deres selvbillede..."' : 'Write your thoughts here...'}
                                    rows={4}
                                    className="w-full bg-white/70 border border-amber-100 rounded-2xl px-5 py-4 text-[14px] text-slate-800 font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 focus:outline-none resize-none leading-relaxed transition-all"
                                />

                                <Button
                                    onClick={handleGenerateProblemformulering}
                                    disabled={isGeneratingProblem || !problemDraft.trim()}
                                    className="w-full h-14 rounded-2xl bg-amber-500 text-white font-black uppercase tracking-widest text-[12px] shadow-xl shadow-amber-500/20 active:scale-95 transition-all hover:bg-amber-600 disabled:opacity-40"
                                >
                                    {isGeneratingProblem ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                    {locale === 'da' ? (isGeneratingProblem ? 'Former problemformulering...' : 'Hjælp mig med problemformuleringen') : (isGeneratingProblem ? 'Formulating...' : 'Help me formulate this')}
                                </Button>
                            </div>

                            {problemSuggestedEvidence.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 pt-6 border-t border-amber-100/70">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-3">{locale === 'da' ? 'Empiri der er brugt som grundlag:' : 'Evidence used as basis:'}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {problemSuggestedEvidence.map((title, idx) => {
                                            const matched = evidence?.find((e: any) => e.title === title || e.title.toLowerCase().includes(title.toLowerCase()));
                                            return (
                                                <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 rounded-2xl text-[12px] font-bold text-amber-800 shadow-sm">
                                                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                    <span className="truncate max-w-[220px]">{matched?.title || title}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[11px] text-amber-500 font-medium mt-3">{locale === 'da' ? 'Du finder disse dokumenter under Empiri-fanen.' : 'You can find these documents under the Evidence tab.'}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {showLitteraturHelper && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-violet-50/60 border border-violet-100/60 rounded-[32px] p-8 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-violet-600 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-violet-600/20">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-violet-900 tracking-tight">{locale === 'da' ? 'Automatisk Litteraturliste' : 'Auto Bibliography'}</h4>
                                    <p className="text-[13px] font-medium text-violet-500">{locale === 'da' ? 'Vælg hvilke empiriske kilder der skal inkluderes. Listen opdateres øjeblikkeligt.' : 'Choose which sources to include. The list updates instantly.'}</p>
                                </div>
                            </div>

                            {(evidence && evidence.filter((e: any) => e.apaRef?.authors).length > 0) ? (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-3">
                                        {evidence.filter((e: any) => e.apaRef?.authors).map((e: any) => (
                                            <button
                                                key={e.id}
                                                onClick={() => {
                                                    setSelectedLiterature(prev =>
                                                        prev.includes(e.id)
                                                            ? prev.filter(id => id !== e.id)
                                                            : [...prev, e.id]
                                                    );
                                                }}
                                                className={`px-4 py-2.5 rounded-2xl text-[12px] font-bold transition-all border outline-none flex items-center gap-2 ${
                                                    selectedLiterature.includes(e.id)
                                                        ? 'bg-violet-600 text-white border-violet-600 shadow-md scale-105'
                                                        : 'bg-white text-violet-900 border-violet-100 hover:border-violet-300'
                                                }`}
                                            >
                                                <FileText className="w-3 h-3 shrink-0" />
                                                <span className="truncate max-w-[200px]">{e.apaRef?.authors ? `${e.apaRef.authors} (${e.apaRef.year || '?'})` : e.title}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <Button
                                        onClick={handleGenerateLitteraturliste}
                                        disabled={selectedLiterature.length === 0}
                                        className="w-full h-14 rounded-2xl bg-violet-900 text-white font-black uppercase tracking-widest text-[12px] shadow-xl shadow-violet-900/10 active:scale-95 transition-all disabled:opacity-40"
                                    >
                                        <Wand2 className="w-5 h-5 mr-2" />
                                        {locale === 'da' ? `Genér liste med ${selectedLiterature.length} kilde${selectedLiterature.length !== 1 ? 'r' : ''}` : `Generate list with ${selectedLiterature.length} source${selectedLiterature.length !== 1 ? 's' : ''}`}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-violet-400 font-medium text-[13px]">
                                    {locale === 'da'
                                        ? 'Ingen empiri med APA-metadata fundet. Upload dokumenter og lad AI\'en hente metadata automatisk.'
                                        : 'No evidence with APA metadata found. Upload documents and let the AI fetch metadata automatically.'}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {showInspiration && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-indigo-50/50 border border-indigo-100/50 rounded-[32px] p-8 shadow-sm overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-[18px] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                    <Lightbulb className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-indigo-900 tracking-tight">{locale === 'da' ? 'Få hjælp fra empirien' : 'Integrate your evidence'}</h4>
                                    <p className="text-[13px] font-medium text-indigo-500">{locale === 'da' ? 'Få skræddersyet inspiration til dette afsnit tænkt sammen med jeres uploadede empiri.' : 'Get custom inspiration for this section integrated with your uploaded evidence.'}</p>
                                </div>
                            </div>
                            
                            {!outlineResult ? (
                                <Button onClick={handleGenerateInspiration} disabled={isGeneratingOutline} className="w-full mt-4 h-14 rounded-2xl bg-indigo-900 text-white font-black uppercase tracking-widest text-[12px] shadow-xl shadow-indigo-900/10 active:scale-95 transition-all outline-none">
                                    {isGeneratingOutline ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                    {locale === 'da' ? (isGeneratingOutline ? 'Læser og krydstjekker empiri...' : 'Inspirer mig') : (isGeneratingOutline ? 'Reading and cross-referencing evidence...' : 'Inspire me')}
                                </Button>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-6">
                                    {outlineResult.encouragement && (
                                         <p className="text-[12px] font-bold text-indigo-600">{outlineResult.encouragement}</p>
                                    )}

                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{locale === 'da' ? 'Forslag til indledende sætning' : 'Suggestion for starting sentence'}</h5>
                                        <p className="text-[15px] italic text-slate-800 leading-relaxed border-l-4 border-indigo-200 pl-4 py-1">
                                            "{outlineResult.startingSentence}"
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{locale === 'da' ? 'Nøglepunkter at overveje' : 'Key points to consider'}</h5>
                                        <ul className="space-y-3">
                                            {outlineResult.outline.map((point: string, idx: number) => (
                                                <li key={idx} className="flex gap-3 text-[14px] text-slate-700 font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></div>
                                                    <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {outlineResult.suggestedEvidence.length > 0 && (
                                        <div className="pt-4 border-t border-indigo-100/50">
                                            <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">{locale === 'da' ? 'Relevant empiri at koble på:' : 'Relevant evidence to attach:'}</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {outlineResult.suggestedEvidence.map((e: string, idx: number) => (
                                                    <span key={idx} className="px-3 py-1.5 bg-white text-indigo-600 rounded-xl text-[11px] font-bold border border-indigo-100 shadow-sm flex items-center gap-1.5"><FileText className="w-3 h-3"/> {e}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 flex gap-4">
                                        <Button onClick={() => setOutlineResult(null)} variant="ghost" className="flex-1 rounded-2xl h-12 font-bold text-slate-400 hover:text-slate-900 border-none shrink-0 border-indigo-100 bg-white shadow-sm border">
                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                            {locale === 'da' ? 'Prøv igen' : 'Try again'}
                                        </Button>
                                        <Button onClick={handleInsertOutline} className="flex-1 rounded-2xl h-12 bg-indigo-900 text-white font-black uppercase tracking-widest text-[11px] hover:bg-indigo-800 outline-none shadow-xl shadow-indigo-900/10">
                                            {locale === 'da' ? 'Brug som kladde' : 'Use as draft'}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-16 min-h-[70vh] quill-focused-workspace selection:bg-indigo-100"
                    >
                        <CustomToolbar />
                        <ReactQuill 
                            forwardedRef={quillRef}
                            theme="snow"
                            value={localContent} 
                            onChange={handleContentChange} 
                            onChangeSelection={(selection) => {
                                if (selection) setEditorSelection(selection);
                            }}
                            placeholder={locale === 'da' ? 'Det tomme ark er en mulighed – begynd at skrive her...' : 'The blank page is a possibility – start writing here...'}
                            modules={QUILL_MODULES}
                            className="text-xl md:text-2xl text-slate-800 leading-[1.8] border-none font-serif pt-4"
                        />
                    </motion.div>

                    <style jsx global>{`
                        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
                        
                        .quill-focused-workspace .ql-container {
                            font-family: 'Libre Baskerville', serif !important;
                            font-size: inherit;
                            border: none !important;
                            color: #1a1a1a;
                            background: transparent !important;
                        }
                        .quill-focused-workspace .ql-editor {
                            padding: 0;
                            min-height: 70vh;
                            line-height: 1.8;
                            background: transparent !important;
                        }
                        .quill-focused-workspace .ql-editor p {
                            margin-bottom: 0; /* Nu fungerer normalt Enter fuldstændig som et simpelt linjeskift (<br>) */
                        }
                        .quill-focused-workspace .ql-toolbar {
                            border: none !important;
                            border-bottom: 1px solid rgba(241, 245, 249, 0.5) !important;
                            padding: 1.5rem 0 !important;
                            position: sticky;
                            top: 0;
                            z-index: 50;
                            background: rgba(252, 252, 252, 0.85);
                            backdrop-filter: blur(12px) saturate(180%);
                            display: flex;
                            justify-content: center;
                            gap: 0.5rem;
                            transition: all 0.3s ease;
                        }
                        .quill-focused-workspace .ql-toolbar:hover {
                            background: rgba(255, 255, 255, 0.95);
                        }
                        .quill-focused-workspace .ql-formats {
                            margin-right: 2rem !important;
                        }
                        .quill-focused-workspace .ql-picker-label, .quill-focused-workspace .ql-stroke {
                            color: #94a3b8 !important;
                            stroke: #94a3b8 !important;
                        }
                        .quill-focused-workspace .ql-active .ql-stroke, .quill-focused-workspace .ql-active .ql-picker-label {
                            color: #4f46e5 !important;
                            stroke: #4f46e5 !important;
                        }
                    `}</style>
                </div>
            </div>

            <div className="w-full md:w-80 lg:w-96 border-l border-slate-100 bg-white shadow-2xl flex flex-col h-full relative z-10">
                <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-grow">
                    
                    {/* Hurtig-Reference */}
                    {evidence && evidence.length > 0 && (
                        <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/50 shadow-inner">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-2 mb-4">
                                <LinkIcon className="w-4 h-4 text-indigo-500" /> {locale === 'da' ? 'Indsæt Kildereference' : 'Insert Source Reference'}
                            </label>
                            <p className="text-[11px] font-medium text-slate-500 mb-4 leading-relaxed">
                                {locale === 'da' ? 'Klik for at indsætte en henvisning der hvor markøren er.' : 'Click to insert a citation at cursor.'}
                            </p>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                {[...evidence].sort((a: any, b: any) => (a.apaRef?.authors || a.title).localeCompare(b.apaRef?.authors || b.title)).map(e => (
                                    <button 
                                        key={e.id}
                                        onClick={() => handleInsertEvidenceReference(e)}
                                        className="text-left px-3 py-2.5 bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-[11px] font-bold transition-all border border-slate-200 shadow-sm truncate flex items-center gap-2 active:scale-95"
                                    >
                                        <FileText className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                                        <span className="truncate">
                                            {e.apaRef?.authors ? `${e.apaRef.authors.split(',')[0]} (${e.apaRef.year || '?'})` : e.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{locale === 'da' ? 'Afsnittets Status' : 'Section Status'}</label>
                        <div className="grid grid-cols-1 gap-2">
                            {['draft', 'review', 'final'].map((s) => (
                                <button 
                                    key={s}
                                    onClick={() => setNewPortfolioEntry({...newPortfolioEntry, status: s as any})}
                                    className={`h-12 px-4 rounded-xl flex items-center justify-between text-[11px] font-black uppercase tracking-widest transition-all ${newPortfolioEntry.status === s ? 'bg-indigo-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {s === 'draft' ? (locale === 'da' ? 'Udkast' : 'Draft') : s === 'review' ? (locale === 'da' ? 'Til Gennemsyn' : 'In Review') : (locale === 'da' ? 'Færdig' : 'Final')}
                                    {newPortfolioEntry.status === s && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI Detection Tool */}
                    <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/50 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{locale === 'da' ? 'AI Tjek' : 'AI Check'}</label>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 mb-4 leading-relaxed">
                            {locale === 'da' ? 'Tjek om teksten ser for "kunstig" eller AI-genereret ud.' : 'Check if the text looks too artificial or AI-generated.'}
                        </p>
                        {aiDetectionResult ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`text-2xl font-black ${aiDetectionResult.score > 60 ? 'text-rose-500' : aiDetectionResult.score > 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {aiDetectionResult.score}%
                                    </div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                        {aiDetectionResult.score > 60 ? 'Høj sandsynlighed for AI' : aiDetectionResult.score > 30 ? 'Mulig AI / Robotagtig' : 'Menneskeligt'}
                                    </div>
                                </div>
                                <p className="text-[11px] font-bold text-slate-600 leading-relaxed bg-white p-3 border border-slate-100 rounded-xl shadow-sm">
                                    {aiDetectionResult.explanation}
                                </p>
                                <Button onClick={() => setAiDetectionResult(null)} variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {locale === 'da' ? 'Ryd tjek' : 'Clear Check'}
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleDetectAi} 
                                disabled={isCheckingAi || localContent.replace(/<[^>]*>/g, '').trim().length < 50}
                                className="w-full h-12 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-widest shadow-sm hover:shadow-md hover:border-emerald-200 hover:text-emerald-600 transition-all disabled:opacity-50"
                            >
                                {isCheckingAi ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                                {locale === 'da' ? 'Analysér Tekst' : 'Analyze Text'}
                            </Button>
                        )}
                    </div>

                    {/* Live Feedback */}
                    {(liveFeedback || isGettingFeedback) && (
                        <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100/50 shadow-inner relative overflow-hidden transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                <Sparkles className="w-24 h-24 text-indigo-900" />
                            </div>
                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                                    {isGettingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-900 block">AI Live-Feedback</label>
                            </div>
                            
                            {liveFeedback ? (
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Det gør du godt</p>
                                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{liveFeedback.strength}</p>
                                    </div>
                                    <div className="h-px bg-indigo-100/50 w-full"></div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest mb-1">Forslag til forbedring</p>
                                        <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{liveFeedback.improvement}</p>
                                    </div>
                                    <div className="h-px bg-indigo-100/50 w-full"></div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black uppercase text-indigo-500 tracking-widest">Foreløbig score</p>
                                        <p className="text-[14px] font-black text-indigo-900">{liveFeedback.score} <span className="text-[9px] text-indigo-400">/ 10</span></p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[11px] font-bold text-indigo-400 relative z-10 animate-pulse">Læser og analyserer din seneste sætning...</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/50 shadow-inner">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block flex items-center gap-2">
                            <ScrollText className="w-3.5 h-3.5" /> {locale === 'da' ? 'Vejledning & Krav' : 'Guideline & Limits'}
                        </label>
                        <div className="space-y-3">
                            <Textarea 
                                value={newPortfolioEntry.assignment} 
                                onChange={e => setNewPortfolioEntry({...newPortfolioEntry, assignment: e.target.value})} 
                                placeholder={locale === 'da' ? 'Indtast vejledning her...' : 'Enter guideline here...'}
                                className="text-[12px] font-medium italic bg-white border-slate-100 rounded-2xl min-h-[120px] focus:ring-4 focus:ring-indigo-500/5 transition-all p-4 shadow-sm"
                            />
                            <div className="relative">
                                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    value={newPortfolioEntry.characterLimit} 
                                    onChange={e => setNewPortfolioEntry({...newPortfolioEntry, characterLimit: e.target.value})} 
                                    placeholder={locale === 'da' ? 'Krav til tegn (fx 2400)' : 'Char limit (e.g. 2400)'}
                                    className="pl-12 text-[11px] font-black uppercase tracking-widest h-14 bg-white border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{locale === 'da' ? 'Privatliv' : 'Privacy'}</label>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setNewPortfolioEntry({...newPortfolioEntry, isPrivate: false})}
                                className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase transition-all ${!newPortfolioEntry.isPrivate ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                            >
                                <Users className="w-3.5 h-3.5" /> Fælles
                            </button>
                            <button 
                                onClick={() => setNewPortfolioEntry({...newPortfolioEntry, isPrivate: true})}
                                className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 text-[11px] font-black uppercase transition-all ${newPortfolioEntry.isPrivate ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                            >
                                <LockIcon className="w-3.5 h-3.5" /> Privat
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{locale === 'da' ? 'Knyttet Empiri' : 'Linked Evidence'}</label>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{newPortfolioEntry.linkedEvidenceIds.length}</span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {user && evidence?.map(e => (
                                <button 
                                    key={e.id}
                                    onClick={() => {
                                        const ids = [...newPortfolioEntry.linkedEvidenceIds];
                                        if (ids.includes(e.id)) {
                                            setNewPortfolioEntry({...newPortfolioEntry, linkedEvidenceIds: ids.filter(id => id !== e.id)});
                                        } else {
                                            setNewPortfolioEntry({...newPortfolioEntry, linkedEvidenceIds: [...ids, e.id]});
                                        }
                                    }}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-3 text-left transition-all border ${newPortfolioEntry.linkedEvidenceIds.includes(e.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${newPortfolioEntry.linkedEvidenceIds.includes(e.id) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                        <LinkIcon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className={`text-[11px] font-black truncate uppercase tracking-tight ${newPortfolioEntry.linkedEvidenceIds.includes(e.id) ? 'text-indigo-900' : 'text-slate-600'}`}>{e.title}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{e.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                    <Button onClick={handleSavePortfolioEntry} size="lg" className="w-full h-16 bg-indigo-900 text-white hover:bg-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-950/20 text-[14px] font-black tracking-widest uppercase group/save border-none">
                        <Check className="w-5 h-5 group-hover/save:scale-125 transition-transform" />
                        {editingPortfolioEntry ? (locale === 'da' ? 'Gem ændringer' : 'Save changes') : (locale === 'da' ? 'Opret afsnit' : 'Create section')}
                    </Button>
                </div>
            </div>
            
            <datalist id="existing-assignments">
                {existingAssignments.map(name => (
                    <option key={name} value={name} />
                ))}
            </datalist>
        </motion.div>
    );
};
