'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Gift, Loader2, Copy, Check, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { nanoid } from 'nanoid';
import { useToast } from "@/hooks/use-toast";

interface RedemptionCode {
    id: string;
    code: string;
    membershipLevel: string;
    durationInMonths: number;
    createdAt: { toDate: () => Date };
    redeemedBy?: string;
    redeemedAt?: { toDate: () => Date };
}

const AdminMarketingPage = () => {
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const codesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'redemptionCodes')) : null), [firestore]);
    const { data: codes, isLoading, error } = useCollection<RedemptionCode>(codesQuery);

    const sortedCodes = useMemo(() => {
        if (!codes) return [];
        return [...codes].sort((a, b) => (b.createdAt?.toDate()?.getTime() || 0) - (a.createdAt?.toDate()?.getTime() || 0));
    }, [codes]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [numCodes, setNumCodes] = useState(1);
    const [membershipLevel, setMembershipLevel] = useState('Kollega+');
    const [duration, setDuration] = useState(1);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const handleGenerateCodes = async () => {
        if (!firestore || isGenerating) return;
        setIsGenerating(true);

        const generatedCodes = [];
        for (let i = 0; i < numCodes; i++) {
            const newCode = nanoid(8).toUpperCase();
            generatedCodes.push({
                code: newCode,
                membershipLevel: membershipLevel,
                durationInMonths: duration,
                createdAt: serverTimestamp(),
                redeemedBy: null,
                redeemedAt: null,
            });
        }
        
        try {
            const colRef = collection(firestore, 'redemptionCodes');
            await Promise.all(generatedCodes.map(codeData => addDoc(colRef, codeData)));
            toast({
                title: 'Koder genereret!',
                description: `${numCodes} nye kode(r) er blevet oprettet.`,
            });
        } catch (err) {
             console.error("Error generating codes:", err);
             toast({
                variant: 'destructive',
                title: 'Fejl',
                description: 'Kunne ikke generere koder.',
            });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="space-y-8 animate-ink">
            <section className="bg-white p-10 rounded-[3rem] border border-amber-100 shadow-sm">
                <h3 className="text-xl font-bold text-amber-950 serif mb-6 flex items-center gap-3"><PlusCircle className="w-5 h-5"/>Generér nye koder</h3>
                <div className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold">Antal</label>
                        <Input type="number" value={numCodes} onChange={e => setNumCodes(Math.max(1, Number(e.target.value)))} />
                    </div>
                    <div>
                        <label className="text-xs font-bold">Medlemskab</label>
                        <select value={membershipLevel} onChange={e => setMembershipLevel(e.target.value)} className="w-full h-10 px-3 border border-input rounded-md text-sm">
                            <option>Kollega+</option>
                            <option>Semesterpakken</option>
                            <option>Kollega++</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold">Varighed (mdr.)</label>
                        <Input type="number" value={duration} onChange={e => setDuration(Math.max(1, Number(e.target.value)))} />
                    </div>
                    <Button onClick={handleGenerateCodes} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null} Generér
                    </Button>
                </div>
            </section>
            
            <section className="bg-white rounded-[3rem] border border-amber-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-amber-50">
                    <h3 className="text-xl font-bold text-amber-950 serif flex items-center gap-3"><Gift className="w-5 h-5"/>Eksisterende Koder</h3>
                </div>
                {isLoading && <div className="h-48 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-300"/></div>}
                {error && <div className="p-10 text-red-500">Fejl: {error.message}</div>}
                {!isLoading && sortedCodes && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Kode</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Oprettet</th>
                                    <th className="px-6 py-3">Indløst</th>
                                    <th className="px-6 py-3 text-right">Handling</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-50">
                                {sortedCodes.map(code => (
                                    <tr key={code.id}>
                                        <td className="px-6 py-4 font-mono font-bold">{code.code}</td>
                                        <td className="px-6 py-4">{code.membershipLevel} ({code.durationInMonths} mdr.)</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${code.redeemedBy ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {code.redeemedBy ? 'Brugt' : 'Aktiv'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">{code.createdAt.toDate().toLocaleDateString('da-DK')}</td>
                                        <td className="px-6 py-4 text-xs">{code.redeemedAt ? code.redeemedAt.toDate().toLocaleDateString('da-DK') : '-'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(code.code)}>
                                                {copiedCode === code.code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminMarketingPage;
