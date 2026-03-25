'use client';

import React, { useState } from 'react';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { Mail, Send, Users, Loader2, CheckCircle, Info, Save, LayoutTemplate, Eye, Edit3, Plus, MousePointerClick, MessageSquareWarning, Trash2, Sparkles, Building2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { sendBulkEmailAction, draftEmailAction } from '@/app/actions';

// We import ReactQuill to have a nice rich-text editor for emails (it's already in the project)
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(
    async () => {
        const { default: RQ } = await import("react-quill");
        const ReactQuillComponent = ({ forwardedRef, ...props }: any) => <RQ ref={forwardedRef} {...props} />;
        ReactQuillComponent.displayName = 'ReactQuillComponent';
        return ReactQuillComponent;
    },
    { ssr: false, loading: () => <div className="h-64 bg-slate-50 flex items-center justify-center rounded-xl animate-pulse font-bold text-slate-400">Loading Editor...</div> }
);
import 'react-quill/dist/quill.snow.css';

type TargetGroup = 'all' | 'Socialrådgiver' | 'Pædagog' | 'Lærer' | 'Sygeplejerske' | 'premium' | 'free' | 'specific' | 'institutions';

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

export default function AdminEmailsPage() {
    const { userProfile } = useApp();
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

    if (userProfile?.role !== 'admin' && userProfile?.membership !== 'Admin') {
        return <div className="p-20 text-center font-bold text-rose-600">Adgang nægtet. Kun for administratorer.</div>;
    }

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

    // -- ACTIONS --
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!subject.trim() || !htmlContent.trim() || isSending) return;

        let targets: { email: string, name: string }[] = [];

        if (targetGroup === 'institutions') {
            if (!institutions) return;
            targets = institutions.map(i => ({
                email: i.E_MAIL,
                name: i.INST_NAVN || 'Institution'
            }));
        } else {
            if (!users) return;
            targets = users.filter(u => {
                if (!u.email) return false;
                if (targetGroup === 'specific') return selectedEmails.includes(u.email);
                if (targetGroup === 'all') return true;
                if (targetGroup === 'premium') return ['Kollega+', 'Kollega++', 'Semesterpakken', 'Group Pro'].includes(u.membership || '');
                if (targetGroup === 'free') return u.membership === 'Kollega' || !u.membership;
                return u.profession === targetGroup;
            }).map(u => ({
                email: u.email,
                name: u.username || 'Kollega'
            }));
        }

        if (targets.length === 0) {
            toast({ variant: "destructive", title: "Ingen modtagere", description: "Fandt 0 modtagere." });
            return;
        }

        if (!confirm(`Er du sikker på at du vil sende denne e-mail til ${targets.length} modtagere?\n(Husk at trække vejret!)`)) return;

        setIsSending(true);
        try {
            const finalHtmlBytes = wrapEmailHtml(htmlContent, showNotificationFooter);
            const result = await sendBulkEmailAction({
                subject: subject.trim(),
                htmlBody: finalHtmlBytes,
                recipients: targets
            });

            if (result.success) {
                setSendStats({ count: result.sentCount, group: targetGroup });
                setSubject('');
                setHtmlContent('');
                setActiveTab('edit');
                setSelectedEmails([]);
                toast({ title: "Mails afsendt!", description: `Succes! Afsendt til ${result.sentCount} brugere.` });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.error("EMAIL ERROR:", error);
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
            toast({ title: "Skabelon gemt", description: `"${templateTitle}" kan nu indlæses fremover.` });
            setTemplateTitle('');
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fejl", description: "Kunne ikke gemme skabelon." });
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const loadTemplate = (html: string) => {
        if (htmlContent.trim() && !confirm("Dette vil overskrive dit nuværende indhold. Fortsæt?")) return;
        setHtmlContent(html);
        toast({ title: "Skabelon indlæst", description: "Editor opdateret." });
    };

    const handleGenerateDraft = async () => {
        if (!aiTopic.trim()) return;
        setIsGeneratingDraft(true);
        try {
            const res = await draftEmailAction(aiTopic);
            if (res.success && res.data) {
                setSubject(res.data.subject);
                if (htmlContent.trim() && !confirm("Dette vil overskrive dit nuværende indhold med AI udkastet. Fortsæt?")) {
                    setIsGeneratingDraft(false);
                    return;
                }
                setHtmlContent(res.data.htmlBody);
                setShowAiDraft(false);
                setAiTopic('');
                toast({ title: "AI Udkast genereret!", description: "Dit udkast er klar til redigering." });
            } else {
                toast({ variant: "destructive", title: "Fejl", description: res.message || "Kunne ikke generere udkast." });
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Fejl", description: "Der opstod en systemfejl." });
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    // -- EDITOR TOOLKIT --
    const insertButton = () => {
        const btnHtml = `<br/><div style="text-align: center;"><a href="https://platform.cohero.dk" style="display: inline-block; padding: 14px 32px; background-color: #451a03; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 12px; margin: 20px 0; font-size: 16px;">Klik Her</a></div><br/>`;
        setHtmlContent(prev => prev + btnHtml);
    };

    const insertInfoBox = () => {
        const boxHtml = `<br/><div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 24px; border-radius: 16px; margin: 20px 0; color: #92400e;"><strong style="display:block; margin-bottom:8px; font-size:18px; color:#78350f;">💡 Godt at vide</strong><p style="margin:0;">Skriv din infotekst her...</p></div><br/>`;
        setHtmlContent(prev => prev + boxHtml);
    };

    const insertDivider = () => {
        const hrHtml = `<br/><hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" /><br/>`;
        setHtmlContent(prev => prev + hrHtml);
    };

    const insertNamePlaceholder = () => {
        setHtmlContent(prev => prev + ' [Navn] ');
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
            <header className="space-y-2">
                <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-950 text-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                            <Mail className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-amber-950 serif">E-mail Editor (Advanced)</h1>
                    </div>
                </div>
                <p className="text-slate-500 font-medium italic">Byg flotte mails, brug skabeloner og udsend sikkert med Resend.</p>
            </header>

            <div className="grid lg:grid-cols-4 gap-8">
                
                {/* LEFT: Editor & Preview Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-amber-100 shadow-xl overflow-hidden flex flex-col min-h-[800px]">
                        
                        {/* TABS */}
                        <div className="flex items-center gap-2 p-4 border-b border-slate-100 bg-slate-50">
                            <button 
                                onClick={() => setActiveTab('edit')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'edit' ? 'bg-amber-950 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                            >
                                <Edit3 className="w-4 h-4" /> Redigér Indhold
                            </button>
                            <button 
                                onClick={() => setActiveTab('preview')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'preview' ? 'bg-amber-950 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 hover:text-slate-800'}`}
                            >
                                <Eye className="w-4 h-4" /> Live Forhåndsvisning
                            </button>
                        </div>

                        {/* EDIT TAB */}
                        {activeTab === 'edit' && (
                            <form onSubmit={handleSendEmail} className="flex flex-col flex-1 p-8 space-y-8">
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Målgruppe</label>
                                    <div className="flex flex-wrap gap-3">
                                        {[
                                            { id: 'all', label: 'Alle' },
                                            { id: 'premium', label: 'Premium' },
                                            { id: 'free', label: 'Gratis' },
                                            { id: 'Socialrådgiver', label: 'Soc.Rådg.' },
                                            { id: 'Pædagog', label: 'Pædagog' },
                                            { id: 'institutions', label: 'Institutioner' },
                                            { id: 'specific', label: 'Specifikke Brugere' }
                                        ].map((group) => (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() => setTargetGroup(group.id as TargetGroup)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${targetGroup === group.id ? 'bg-amber-950 text-white border-amber-950 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-amber-200'}`}
                                            >
                                                {group.label}
                                            </button>
                                        ))}
                                    </div>

                                    {targetGroup === 'specific' && (
                                        <div className="p-4 border border-slate-200 rounded-2xl space-y-3 bg-slate-50 mt-4">
                                            <Input 
                                                placeholder="Søg på navn eller e-mail..." 
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="h-12 bg-white rounded-xl"
                                            />
                                            <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
                                                {users?.filter(u => u.email && (u.username?.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())))
                                                    .slice(0, 100) // Limiting to prevent extreme lag
                                                    .map(u => (
                                                    <label key={u.id} className="flex items-center gap-3 p-3 bg-white hover:bg-amber-50 rounded-xl cursor-pointer transition-colors shadow-sm border border-slate-100">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedEmails.includes(u.email)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedEmails(prev => [...prev, u.email]);
                                                                else setSelectedEmails(prev => prev.filter(email => email !== u.email));
                                                            }}
                                                            className="w-4 h-4 rounded text-amber-900 focus:ring-amber-900"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-700">{u.username || 'Ukendt navn'} {u.membership && <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md ml-2">{u.membership}</span>}</span>
                                                            <span className="text-xs text-slate-500">{u.email} • {u.profession || 'Ingen profession'}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                                {users?.length === 0 && <p className="text-xs text-slate-400 p-2">Ingen brugere at vise.</p>}
                                            </div>
                                            {selectedEmails.length > 0 && (
                                                <div className="pt-2 flex justify-between items-center text-xs font-bold text-amber-900">
                                                    <span>{selectedEmails.length} valgt</span>
                                                    <button type="button" onClick={() => setSelectedEmails([])} className="hover:underline">Ryd alle</button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">E-mail Emne (Modtager ser dette)</label>
                                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="F.eks. Stor opdatering til platformen!" className="h-14 text-lg font-bold rounded-2xl" required />
                                </div>

                                {/* QUICK INSERT TOOLKIT */}
                                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/60 flex items-center gap-1"><Plus className="w-3 h-3"/> Quick-Insert Blokke</p>
                                        <button type="button" onClick={() => setShowAiDraft(prev => !prev)} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"><Sparkles className="w-3.5 h-3.5"/> Skriv Udkast med AI</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={insertButton} className="px-4 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-100 flex items-center gap-2 transition-colors"><MousePointerClick className="w-3 h-3"/> CTA Knap</button>
                                        <button type="button" onClick={insertNamePlaceholder} className="px-4 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-100 flex items-center gap-2 transition-colors"><Users className="w-3 h-3"/> Modtagers Navn</button>
                                        <button type="button" onClick={insertInfoBox} className="px-4 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-100 flex items-center gap-2 transition-colors"><MessageSquareWarning className="w-3 h-3"/> Info Boks</button>
                                        <button type="button" onClick={insertDivider} className="px-4 py-2 bg-white border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-100 flex items-center gap-2 transition-colors"><div className="w-4 h-[1px] bg-amber-900"></div> Linjeskift</button>
                                        <button type="button" onClick={() => setShowNotificationFooter(prev => !prev)} className={`px-4 py-2 border rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all ${showNotificationFooter ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                            {showNotificationFooter ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                            Notifikations-fodnote
                                        </button>
                                    </div>

                                    {showAiDraft && (
                                        <div className="mt-4 p-4 border border-amber-200 bg-white rounded-2xl shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-amber-900">Hvad skal mailen handle om?</label>
                                            <textarea 
                                                value={aiTopic}
                                                onChange={e => setAiTopic(e.target.value)}
                                                className="w-full text-sm p-4 border border-slate-200 rounded-xl focus:ring-amber-500 focus:border-amber-500 min-h-[100px] bg-slate-50"
                                                placeholder="Skriv stikord, f.eks.: Vi har netop lanceret en ny opslagstavle, prøv den i dag..."
                                            />
                                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                                <Button type="button" variant="ghost" className="h-9 text-xs font-bold" onClick={() => setShowAiDraft(false)}>Annuller</Button>
                                                <Button type="button" className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md font-bold text-xs" onClick={handleGenerateDraft} disabled={isGeneratingDraft || !aiTopic}>
                                                    {isGeneratingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Generér Udkast
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 flex-1 flex flex-col">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Indhold (Bliver indpakket i Cohéro Premium layout)</label>
                                    <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 flex-1 relative flex flex-col pb-12">
                                        <ReactQuill 
                                            theme="snow" 
                                            value={htmlContent} 
                                            onChange={setHtmlContent}
                                            className="react-quill-tall custom-scrollbar"
                                            modules={{
                                                toolbar: [
                                                    [{ 'header': [1, 2, 3, false] }],
                                                    ['bold', 'italic', 'underline', 'strike'],
                                                    [{'color': []}, {'background': []}],
                                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                    ['link'],
                                                    ['clean']
                                                ]
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex gap-4">
                                    <Button type="submit" disabled={isSending || usersLoading || !subject || !htmlContent} className="h-16 flex-1 rounded-2xl bg-amber-950 text-white shadow-2xl active:scale-95 transition-all text-lg group">
                                        {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send E-mail Kampagne Nu <Send className="w-5 h-5 ml-3" /></>}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* PREVIEW TAB */}
                        {activeTab === 'preview' && (
                            <div className="flex-1 overflow-y-auto bg-slate-800 p-8 flex justify-center items-start custom-scrollbar h-[800px]">
                                <div className="w-full max-w-full origin-top" dangerouslySetInnerHTML={{ __html: wrapEmailHtml(htmlContent, showNotificationFooter) }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Stats & Templates Sidebar */}
                <div className="space-y-6">
                    
                    {/* Skabeloner Box */}
                    <div className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-sm space-y-6">
                        <h3 className="font-bold text-amber-950 flex items-center gap-2"><LayoutTemplate className="w-5 h-5" /> Skabeloner</h3>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400">Gem aktuelle som skabelon</label>
                            <div className="flex gap-2">
                                <Input value={templateTitle} onChange={e => setTemplateTitle(e.target.value)} placeholder="Titel..." className="h-10 text-xs rounded-xl" />
                                <Button onClick={handleSaveTemplate} disabled={!templateTitle || !htmlContent || isSavingTemplate} className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3"><Save className="w-4 h-4" /></Button>
                            </div>
                        </div>

                        <hr className="border-slate-100" />
                        
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400">Gemte Mails</label>
                            {templatesLoading && <Loader2 className="w-5 h-5 animate-spin mx-auto text-amber-300" />}
                            {!templatesLoading && templates?.length === 0 && <p className="text-xs text-slate-400 italic text-center">Ingen skabeloner gemt endnu.</p>}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                {templates?.sort((a,b) => b.createdAt?.toMillis?.() - a.createdAt?.toMillis?.()).map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => loadTemplate(t.htmlContent)}
                                        className="w-full text-left p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-amber-50 hover:border-amber-200 transition-colors group"
                                    >
                                        <p className="text-sm font-bold text-slate-700 group-hover:text-amber-900 truncate">{t.title}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Klik for at indlæse</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats Box */}
                    <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest"><Users className="w-4 h-4" /> Brugere i alt</div>
                            <p className="text-4xl font-bold text-slate-700 serif italic">{usersLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : users?.filter(u => u.email).length || 0}</p>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-slate-200/50">
                            <div className="flex items-center gap-2 text-amber-600 font-black uppercase text-[10px] tracking-widest"><Building2 className="w-4 h-4" /> Institutioner i alt</div>
                            <p className="text-4xl font-bold text-amber-700 serif italic">{institutionsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : institutions?.length || 0}</p>
                        </div>
                        
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">Antallet af unikke modtagere på tværs af platformen.</p>
                    </div>

                    {sendStats && (
                        <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 animate-ink shadow-lg">
                            <div className="flex items-center gap-3 text-emerald-700 font-bold mb-2"><CheckCircle className="w-5 h-5" /> Succes!</div>
                            <p className="text-xs text-emerald-600 leading-relaxed font-medium">Kampagnen blev afsendt til <strong>{sendStats.count}</strong> brugere i "{sendStats.group}".</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Global Styles for Quill Editor Height overriding */}
            <style dangerouslySetInnerHTML={{ __html: `
                .react-quill-tall .ql-container {
                    min-height: 400px;
                    font-family: 'Inter', sans-serif;
                    font-size: 15px;
                }
                .react-quill-tall .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 16px;
                    background-color: #f8fafc;
                    border-top-left-radius: 2rem;
                    border-top-right-radius: 2rem;
                }
                .react-quill-tall .ql-editor {
                    padding: 24px;
                }
            `}} />
        </div>
    );
}
