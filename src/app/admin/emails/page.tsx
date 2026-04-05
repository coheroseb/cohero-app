
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { Mail, Send, Users, Loader2, CheckCircle, Save, LayoutTemplate, Eye, Edit3, Plus, MousePointerClick, MessageSquareWarning, Trash2, Sparkles, Building2, X, ChevronRight, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { sendBulkEmailAction, draftEmailAction } from '@/app/actions';
import { motion, AnimatePresence } from 'framer-motion';

// We import ReactQuill to have a nice rich-text editor for emails (it's already in the project)
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import("react-quill");
        const ReactQuillComponent = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
        ReactQuillComponent.displayName = 'ReactQuillComponent';
        return ReactQuillComponent;
    },
    { ssr: false, loading: () => <div className="h-64 bg-slate-50 flex items-center justify-center rounded-[2rem] animate-pulse font-black text-[10px] text-slate-300 uppercase tracking-widest">Indlæser Editor...</div> }
);
import 'react-quill/dist/quill.snow.css';

type TargetGroup = 'all' | 'Socialrådgiver' | 'Pædagog' | 'Lærer' | 'Sygeplejerske' | 'Andet' | 'premium' | 'Kollega+' | 'Semesterpakken' | 'Group Pro' | 'Kollega' | 'specific' | 'institutions';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  profession?: string;
  membership?: string;
}

interface Institution {
  id: string;
  INST_NAVN: string;
  E_MAIL: string;
}

interface EmailTemplate {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: any;
}

interface EmailCampaign {
  id: string;
  subject: string;
  htmlContent: string;
  targetGroup: string;
  sentCount: number;
  sentAt: any;
  adminName?: string;
}

export default function AdminEmailsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    // Editor State
    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [userSearch, setUserSearch] = useState('');
    
    // UI State
    const [isSending, setIsSending] = useState(false);
    const [sendStats, setSendStats] = useState<{ count: number, group: string } | null>(null);
    const [templateTitle, setTemplateTitle] = useState('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);
    const [showAiDraft, setShowAiDraft] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const [showNotificationFooter, setShowNotificationFooter] = useState(true);

    // Queries
    const usersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'users')) : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
    
    const institutionsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'institutions'), where('E_MAIL', '!=', '')) : null), [firestore]);
    const { data: institutions, isLoading: institutionsLoading } = useCollection<Institution>(institutionsQuery);

    const templatesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'emailTemplates')) : null), [firestore]);
    const { data: templates, isLoading: templatesLoading } = useCollection<EmailTemplate>(templatesQuery);

    const campaignsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'emailCampaigns')) : null), [firestore]);
    const { data: campaigns, isLoading: campaignsLoading } = useCollection<EmailCampaign>(campaignsQuery);

    // -- WRAPPER HTML --
    const wrapEmailHtml = (inner: string, showFooter: boolean) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
</head>
<body style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
    <div style="background-color: #f8fafc; padding: 40px 20px; width: 100%; box-sizing: border-box;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);">
            
            <div style="background-color: #451a03; padding: 32px 40px; text-align: center;">
                <img src="https://cohero.dk/main_logo.png" alt="Cohéro Logo" style="height: 40px; width: auto; max-width: 100%; display: block; margin: 0 auto;" />
            </div>
            
            <div style="padding: 40px; font-size: 16px; line-height: 1.6; color: #334155;">
                ${inner}
            </div>
            
            <div style="background-color: #f1f5f9; padding: 32px 40px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
                ${showFooter ? '<p style="margin-bottom: 8px;">Du modtager denne mail fordi du har takket ja til notifikationer fra Cohéro.</p>' : ''}
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Cohéro I/S. Alle rettigheder forbeholdes.</p>
            </div>
            
        </div>
    </div>
</body>
</html>
    `;

    // -- HELPERS --
    const getRecipientCount = (group: TargetGroup): number => {
        if (group === 'institutions') return institutions?.length || 0;
        if (!users) return 0;
        return users.filter(u => {
            if (!u.email) return false;
            if (group === 'specific') return selectedEmails.length;
            if (group === 'all') return true;
            
            const m = u.membership?.trim() || '';
            if (group === 'premium') return ['Kollega+', 'Semesterpakken', 'Group Pro'].includes(m);
            if (group === 'Kollega') return m === 'Kollega' || m === '';
            if (group === 'Kollega+') return m === 'Kollega+';
            if (group === 'Semesterpakken') return m === 'Semesterpakken';
            if (group === 'Group Pro') return m === 'Group Pro';
            
            return u.profession?.trim() === group;
        }).length;
    };

    // -- ACTIONS --
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!subject.trim() || !htmlContent.trim() || isSending) return;

        let targets: { email: string, name: string }[] = [];

        if (targetGroup === 'institutions') {
            if (!institutions) return;
            targets = institutions.map(i => ({ email: i.E_MAIL, name: i.INST_NAVN || 'Institution' }));
        } else {
            if (!users) return;
            targets = users.filter(u => {
                if (!u.email) return false;
                if (targetGroup === 'specific') return selectedEmails.includes(u.email);
                if (targetGroup === 'all') return true;
                
                const m = u.membership?.trim() || '';
                if (targetGroup === 'premium') return ['Kollega+', 'Semesterpakken', 'Group Pro'].includes(m);
                if (targetGroup === 'Kollega+') return m === 'Kollega+';
                if (targetGroup === 'Semesterpakken') return m === 'Semesterpakken';
                if (targetGroup === 'Group Pro') return m === 'Group Pro';
                if (targetGroup === 'Kollega') return m === 'Kollega' || m === '';
                
                return u.profession?.trim() === targetGroup;
            }).map(u => ({ email: u.email, name: u.username || 'Kollega' }));
        }

        if (targets.length === 0) {
            toast({ variant: "destructive", title: "Ingen modtagere", description: "Fandt 0 modtagere." });
            return;
        }

        if (!confirm(`Vil du udsende denne kampagne til ${targets.length} modtagere?`)) return;

        setIsSending(true);
        try {
            const finalHtmlBytes = wrapEmailHtml(htmlContent, showNotificationFooter);
            const result = await sendBulkEmailAction({
                subject: subject.trim(),
                htmlBody: finalHtmlBytes,
                recipients: targets
            });

            if (result.success) {
                if (firestore) {
                    await addDoc(collection(firestore, 'emailCampaigns'), {
                        subject: subject.trim(),
                        htmlContent: finalHtmlBytes,
                        targetGroup: targetGroup,
                        sentCount: result.sentCount,
                        sentAt: serverTimestamp(),
                    });
                }
                setSendStats({ count: result.sentCount, group: targetGroup });
                setSubject(''); setHtmlContent(''); setActiveTab('edit'); setSelectedEmails([]);
                toast({ title: "Mails afsendt!" });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fejl", description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveTemplate = async () => {
        if (!firestore || !templateTitle.trim() || !htmlContent.trim() || isSavingTemplate) return;
        setIsSavingTemplate(true);
        try {
            await addDoc(collection(firestore, 'emailTemplates'), {
                title: templateTitle.trim(),
                htmlContent: htmlContent,
                createdAt: serverTimestamp()
            });
            toast({ title: "Skabelon gemt" });
            setTemplateTitle('');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fejl" });
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const handleGenerateDraft = async () => {
        if (!aiTopic.trim()) return;
        setIsGeneratingDraft(true);
        try {
            const res = await draftEmailAction(aiTopic);
            if (res.success && res.data) {
                setSubject(res.data.subject);
                setHtmlContent(res.data.htmlBody);
                setShowAiDraft(false); setAiTopic('');
                toast({ title: "AI Udkast genereret!" });
            }
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    return (
        <div className="space-y-12 animate-ink pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
                <div>
                   <h1 className="text-3xl font-black text-slate-900 serif mb-2">Campaign Intelligence</h1>
                   <p className="text-slate-500 font-medium">Byg, segmentér og udsend professionelle e-mails til platformens kolleger.</p>
                </div>
                <div className="flex items-center gap-4 px-5 py-3 bg-emerald-50 border border-emerald-100/60 rounded-2xl">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 leading-none mb-1">Status</p>
                        <p className="text-xs font-bold text-emerald-900 leading-none">Resend API Online</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                
                {/* Main Editor */}
                <div className="xl:col-span-8 space-y-8">
                    <section className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[900px]">
                        
                        {/* Tabs Bar */}
                        <div className="flex items-center gap-1.5 p-6 bg-slate-50/50 border-b border-slate-100">
                            <button 
                                onClick={() => setActiveTab('edit')}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Edit3 className="w-4 h-4" /> Kampagne Editor
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            >
                                <Eye className="w-4 h-4" /> Live Preview
                            </button>
                        </div>

                        <div className="p-10 flex-1 flex flex-col">
                            {activeTab === 'edit' ? (
                                <form onSubmit={handleSendEmail} className="space-y-10 flex-1 flex flex-col">
                                    {/* Segmentation */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Målgruppe & Segmentering</label>
                                            <div className="flex items-center gap-2 text-indigo-600 px-3 py-1 bg-indigo-50 rounded-lg text-[10px] font-black uppercase">
                                                <Users className="w-3.5 h-3.5" /> {getRecipientCount(targetGroup)} Modtagere
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                                            <div className="flex flex-wrap gap-2">
                                                {['all', 'premium', 'Kollega', 'Kollega+', 'Semesterpakken', 'institutions', 'specific'].map(g => (
                                                    <button
                                                        key={g}
                                                        type="button"
                                                        onClick={() => setTargetGroup(g as TargetGroup)}
                                                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${targetGroup === g ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                                    >
                                                        {g === 'all' ? 'Alle' : g === 'premium' ? 'Premium (Samlet)' : g === 'institutions' ? 'Institutioner' : g === 'specific' ? 'Manuelt' : g}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Assistant */}
                                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                                        <div className="relative z-10 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                                                    <h3 className="text-xl font-black text-white serif">Magic Draft</h3>
                                                </div>
                                                <button type="button" onClick={() => setShowAiDraft(!showAiDraft)} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                                                    {showAiDraft ? 'Skjul' : 'Konfigurér'}
                                                </button>
                                            </div>

                                            {showAiDraft && (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <textarea 
                                                        placeholder="Beskriv hvad mailen skal handle om... f.eks. 'Nye eksamenssæt er loadet for pædagoger, husk at købe Premium for fuld adgang.'"
                                                        value={aiTopic}
                                                        onChange={e => setAiTopic(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm font-medium focus:ring-4 focus:ring-amber-500/10 transition-all outline-none min-h-[120px]"
                                                    />
                                                    <Button type="button" onClick={handleGenerateDraft} disabled={isGeneratingDraft || !aiTopic} className="w-full h-14 rounded-[1.5rem] bg-white text-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-100 shadow-xl shadow-white/5">
                                                        {isGeneratingDraft ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generér Kampagne Udkast'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                    </div>

                                    {/* Subject & Editor */}
                                    <div className="space-y-8 flex-1 flex flex-col">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">E-mail Emnefelt</label>
                                            <Input 
                                                value={subject} 
                                                onChange={e => setSubject(e.target.value)} 
                                                placeholder="Kampagne overskrift..." 
                                                className="h-14 font-black text-slate-900 serif text-xl border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 transition-all" 
                                            />
                                        </div>

                                        <div className="space-y-3 flex-1 flex flex-col">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Kampagne Indhold</label>
                                            <div className="bg-white rounded-[2.5rem] border border-slate-100 flex-1 relative flex flex-col pb-12 overflow-hidden shadow-inner">
                                                <ReactQuill 
                                                    theme="snow" 
                                                    value={htmlContent} 
                                                    onChange={setHtmlContent}
                                                    className="flex-1 custom-quill"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <Button 
                                            type="submit" 
                                            disabled={isSending || !subject || !htmlContent} 
                                            className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-lg serif uppercase tracking-widest shadow-2xl shadow-slate-900/20 active:scale-95 transition-all"
                                        >
                                            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <span className="flex items-center gap-4">Start Broadcast <Send className="w-6 h-6" /></span>}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="flex-1 bg-slate-100 rounded-[3rem] p-8 flex justify-center items-start min-h-[700px] overflow-y-auto">
                                   <div className="w-full max-w-2xl bg-white shadow-2xl rounded-2xl overflow-hidden" dangerouslySetInnerHTML={{ __html: wrapEmailHtml(htmlContent, showNotificationFooter) }} />
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-4 space-y-10">
                    
                    {/* Templates */}
                    <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <LayoutTemplate className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 serif">Skabeloner</h3>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Gem aktuelle udkast</label>
                            <div className="flex gap-2">
                                <Input value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} placeholder="Titel..." className="h-12 rounded-xl bg-slate-50 border-slate-100" />
                                <Button onClick={handleSaveTemplate} disabled={!templateTitle || !htmlContent || isSavingTemplate} className="h-12 w-12 rounded-xl bg-slate-900 text-white flex-shrink-0"><Save className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {templates?.sort((a,b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.()).map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => setHtmlContent(t.htmlContent)}
                                    className="w-full text-left p-5 rounded-[1.5rem] bg-slate-50 border border-slate-50 hover:border-indigo-200 transition-all group"
                                >
                                    <p className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{t.title}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klik for at indlæse</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* History */}
                    <section className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700">
                                <Mail className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 serif">Kampagne Historik</h3>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {campaigns?.sort((a,b) => b.sentAt?.toMillis?.() - a.sentAt?.toMillis?.()).map(c => (
                                <div key={c.id} className="p-5 bg-white border border-slate-100 rounded-[1.5rem] space-y-3 shadow-sm group">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 text-sm leading-tight max-w-[180px]">{c.subject}</p>
                                        <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase tracking-tighter">{c.sentCount} recipients</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.sentAt?.toDate ? c.sentAt.toDate().toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }) : 'Dato mangler'}</span>
                                        <button 
                                            onClick={() => { setSubject(c.subject); setHtmlContent(c.htmlContent); }}
                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                        >
                                            Genbrug
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-quill .ql-container {
                    min-height: 500px;
                    font-family: 'Inter', sans-serif;
                    font-size: 16px;
                    border: none !important;
                }
                .custom-quill .ql-toolbar {
                    border: none !important;
                    background-color: #f8fafc;
                    padding: 20px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .custom-quill .ql-editor {
                    padding: 40px !important;
                    color: #334155;
                }
                .custom-quill .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: italic;
                    left: 40px;
                }
            `}} />
        </div>
    );
}

