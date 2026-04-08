'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { acceptLatestTermsAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

interface TermsConsentModalProps {
    isOpen: boolean;
    userId: string;
    latestVersion: string;
    onAccepted: () => void;
}

export default function TermsConsentModal({ isOpen, userId, latestVersion, onAccepted }: TermsConsentModalProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleAccept = async () => {
        setLoading(true);
        try {
            const result = await acceptLatestTermsAction(userId);
            if (result.success) {
                toast({
                    title: "Betingelser accepteret",
                    description: `Du har nu accepteret version ${latestVersion} af vores betingelser.`,
                });
                onAccepted();
            } else {
                toast({
                    variant: "destructive",
                    title: "Der skete en fejl",
                    description: "Prøv venligst igen senere.",
                });
            }
        } catch (error) {
            console.error("Accept terms error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 md:p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="bg-amber-950 p-10 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-900/40 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
                                    <ShieldCheck className="w-8 h-8 text-amber-400" />
                                </div>
                                <h2 className="text-3xl font-black serif mb-4">Opdaterede Betingelser</h2>
                                <p className="text-amber-100/70 text-sm leading-relaxed max-w-md italic">
                                    Vi har opdateret vores handelsbetingelser for at sikre dig den bedste oplevelse. Du skal acceptere den nye version ({latestVersion}) for at fortsætte.
                                </p>
                            </div>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-all">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                                        <FileText className="w-5 h-5 text-amber-950" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Gennemsigtighed</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                            Vi har gjort vores betingelser lettere at forstå og mere transparente omkring dine rettigheder.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-amber-200 transition-all">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                                        <CheckCircle2 className="w-5 h-5 text-amber-950" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Data Beskyttelse</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                            Opdateret information omkring hvordan vi behandler dine data i overensstemmelse med GDPR.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={handleAccept}
                                    disabled={loading}
                                    className="w-full h-16 bg-amber-950 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all hover:bg-rose-950 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Accepter & Fortsæt <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                                
                                <p className="text-center text-[10px] text-slate-400 font-medium">
                                    Ved at klikke på knappen accepterer du vores <Link href="/terms-of-service" target="_blank" className="text-amber-900 underline font-black">handelsbetingelser</Link>.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
