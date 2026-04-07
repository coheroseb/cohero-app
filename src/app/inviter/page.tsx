'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/app/provider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gift, 
    Mail, 
    Send, 
    Copy, 
    Check, 
    Users, 
    ShieldCheck, 
    Zap, 
    ArrowRight, 
    Sparkles,
    Loader2,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendReferralInviteAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function InviterPage() {
    const { user, userProfile, isUserLoading } = useApp();
    const { toast } = useToast();
    
    const [emails, setEmails] = useState<string[]>(['']);
    const [isSending, setIsSending] = useState(false);
    const [copied, setCopied] = useState(false);

    if (isUserLoading) return <AuthLoadingScreen />;
    if (!user || userProfile === undefined) return null;

    const referralCode = userProfile?.referralCode || 'DIN-KODE';
    const referralUrl = `https://cohero.dk/auth?mode=signup&ref=${referralCode}`;
    const referralCount = userProfile?.referralCount || 0;
    const progress = Math.min((referralCount / 10) * 100, 100);

    const handleAddEmail = () => setEmails([...emails, '']);
    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...emails];
        newEmails[index] = value;
        setEmails(newEmails);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        toast({
            title: "Link kopieret!",
            description: "Del det med dine medstuderende.",
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvites = async () => {
        const validEmails = emails.filter(e => e.includes('@') && e.includes('.'));
        if (validEmails.length === 0) {
            toast({
                title: "Ugyldige emails",
                description: "Indtast venligst mindst én gyldig email-adresse.",
                variant: "destructive"
            });
            return;
        }

        setIsSending(true);
        try {
            const res = await sendReferralInviteAction({
                emails: validEmails,
                inviterName: user.displayName || 'Din medstuderende',
                referralCode: referralCode
            });

            if (res.success) {
                toast({
                    title: "Invitationer sendt!",
                    description: `Vi har sendt ${validEmails.length} invitationer afsted.`,
                });
                setEmails(['']);
            }
        } catch (error) {
            toast({
                title: "Fejl",
                description: "Der skete en fejl under afsendelse. Prøv igen senere.",
                variant: "destructive"
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex p-4 bg-rose-100 text-rose-600 rounded-[32px] mb-4"
                    >
                        <Gift className="w-8 h-8" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Giv dine medstuderende <br /><span className="text-rose-600">en bedre studietid</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                        Inviter 10 personer til Cohéro, og vi kvitterer med <span className="text-slate-900 font-bold">1 måneds gratis Kollega+</span> som tak for hjælpen.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Progress Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center space-y-6"
                    >
                        <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    className="text-slate-50"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="currentColor"
                                    strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={440}
                                    strokeDashoffset={440 - (440 * progress) / 100}
                                    strokeLinecap="round"
                                    className="text-rose-600 transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black text-slate-900">{referralCount}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Af 10</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-xl text-slate-900">Din fremgang</h3>
                            <p className="text-slate-500 text-sm font-medium">
                                {referralCount === 0 
                                    ? "Du er i gang! Send din første invitation." 
                                    : referralCount < 10 
                                    ? `Du mangler kun ${10 - referralCount} mere for at få din bonus!` 
                                    : "Tillykke! Du har optjent din bonus."}
                            </p>
                        </div>

                        {progress === 100 && (
                            <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl flex items-center gap-2 border border-emerald-100 animate-bounce">
                                <Check className="w-5 h-5" />
                                <span className="font-bold text-sm">Bonus aktiveret!</span>
                            </div>
                        )}
                    </motion.div>

                    {/* Link Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-slate-900 p-8 rounded-[40px] shadow-2xl shadow-slate-900/10 flex flex-col justify-between"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400">
                                    <Zap className="w-5 h-5 fill-current" />
                                </div>
                                <h3 className="text-white font-bold text-xl">Del dit link</h3>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Kopier dit personlige link og del det direkte i din studiegruppes chat, på Facebook eller i en besked.
                            </p>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="relative group">
                                <input 
                                    readOnly 
                                    value={referralUrl}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-default pr-24"
                                />
                                <button 
                                    onClick={handleCopyLink}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Kopieret' : 'Kopier'}
                                </button>
                            </div>
                            
                            <div className="flex items-start gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                    Bonusen aktiveres automatisk når 10 nye brugere har oprettet sig via dit link. Én bonus pr. bruger.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Email Invitation Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 md:p-12 rounded-[48px] shadow-sm border border-slate-100"
                >
                    <div className="max-w-xl mx-auto space-y-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900">Send direkte indbydelser</h2>
                            <p className="text-slate-400 text-sm font-medium">Vi gør arbejdet for dig. Indtast deres mail, så sender vi en flot invitation.</p>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {emails.map((email, index) => (
                                    <motion.div 
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="relative"
                                    >
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <Input 
                                            type="email"
                                            placeholder="stud@uc.dk"
                                            value={email}
                                            onChange={(e) => handleEmailChange(index, e.target.value)}
                                            className="h-14 rounded-[20px] pl-12 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button 
                                    onClick={handleAddEmail}
                                    className="flex-1 h-14 rounded-[20px] border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-slate-300 hover:text-slate-500 transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Plus className="w-4 h-4" /> Tilføj endnu en
                                </button>
                                <Button 
                                    onClick={handleSendInvites}
                                    disabled={isSending}
                                    className="flex-[1.5] h-14 rounded-[20px] bg-rose-600 text-white font-black uppercase tracking-widest text-[13px] hover:bg-rose-700 active:scale-[0.98] transition-all shadow-lg shadow-rose-600/20"
                                >
                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>Send invitationer <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Benefits Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <BenefitCard 
                        icon={<Brain className="w-6 h-6" />}
                        title="AI-Sparring"
                        desc="Få adgang til ubegrænset hjælp til dine cases."
                    />
                    <BenefitCard 
                        icon={<Scale className="w-6 h-6" />}
                        title="Fuld Lovpakke"
                        desc="Læs alt i lovportalen uden begrænsninger."
                    />
                    <BenefitCard 
                        icon={<Gift className="w-6 h-6" />}
                        title="Kollega+"
                        desc="Oplev platformen præcis som de professionelle."
                    />
                </div>
            </div>
        </div>
    );
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-[32px] border border-slate-200/50 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-sm border border-slate-100">
                {icon}
            </div>
            <h4 className="font-bold text-slate-900">{title}</h4>
            <p className="text-[12px] text-slate-400 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}

function Plus({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    )
}

function Brain({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z"></path><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z"></path></svg>
    )
}

function Scale({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10"></path><path d="M12 3v18"></path><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path></svg>
    )
}
