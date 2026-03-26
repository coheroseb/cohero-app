
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/provider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, DocumentData, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Loader2, CheckCircle, XCircle, ChevronDown, FileText, ThumbsUp, ThumbsDown, AlertTriangle, ListChecks, Trash2 } from 'lucide-react';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface SecondOpinion extends DocumentData {
  id: string;
  input: {
    grade: string;
    assignmentText: string;
    feedback?: string;
  };
  analysis: {
    isComplaintJustified: boolean;
    strengths: string[];
    weaknesses: string[];
    riskAssessment: string[];
    alignmentWithCriteria: string[];
    suggestedNextSteps: string[];
  };
  createdAt: {
    toDate: () => Date;
  };
  user?: {
      id: string;
      username: string;
  }
}

const DetailView = ({ opinion }: { opinion: SecondOpinion }) => {
    return (
      <div className="p-8 bg-slate-50 space-y-8">
        <div>
          <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500"/>Opgavebesvarelse</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap p-4 bg-white rounded-lg border">{opinion.input.assignmentText}</p>
        </div>
        {opinion.input.feedback && (
          <div>
            <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500"/>Bedømmers Feedback</h4>
            <p className="text-sm text-slate-600 whitespace-pre-wrap italic p-4 bg-white rounded-lg border">"{opinion.input.feedback}"</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-200">
          <div>
            <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2"><ThumbsUp className="w-5 h-5 text-emerald-500"/>Styrker</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
              {opinion.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2"><ThumbsDown className="w-5 h-5 text-rose-500"/>Svagheder</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
              {opinion.analysis.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
         <div className="pt-8 border-t border-slate-200">
            <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500"/>Risikovurdering ved klage</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                {opinion.analysis.riskAssessment.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
         <div className="pt-8 border-t border-slate-200">
            <h4 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2"><ListChecks className="w-5 h-5 text-blue-500"/>Forslag til næste skridt</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
                {opinion.analysis.suggestedNextSteps.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
        </div>
      </div>
    );
};


const SecondOpinionsPage = () => {
    const { user, userProfile, isUserLoading } = useApp();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [opinions, setOpinions] = useState<SecondOpinion[]>([]);
    const [opinionsLoading, setOpinionsLoading] = useState(true);
    const [expandedOpinionId, setExpandedOpinionId] = useState<string | null>(null);

    const usersQuery = useMemoFirebase(() => (
      firestore && userProfile?.role === 'admin' ? query(collection(firestore, 'users')) : null
    ), [firestore, userProfile]);
    const { data: users, isLoading: usersLoading } = useCollection<any>(usersQuery);

    useEffect(() => {
        if (!firestore || !users || users.length === 0) {
            if(!usersLoading) setOpinionsLoading(false);
            return;
        }

        const fetchOpinions = async () => {
            setOpinionsLoading(true);
            const allOpinions: SecondOpinion[] = [];

            const opinionPromises = users.map(async (user) => {
                const opinionsColRef = collection(firestore, 'users', user.id, 'secondOpinions');
                const opinionsSnap = await getDocs(query(opinionsColRef, orderBy('createdAt', 'desc')));
                
                opinionsSnap.forEach(docSnap => {
                    if (docSnap.id !== 'latest') {
                        allOpinions.push({
                            id: docSnap.id,
                            user: { id: user.id, username: user.username || 'Ukendt' },
                            ...docSnap.data()
                        } as SecondOpinion);
                    }
                });
            });

            await Promise.all(opinionPromises);
            
            allOpinions.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
            
            setOpinions(allOpinions);
            setOpinionsLoading(false);
        };

        fetchOpinions();

    }, [firestore, users, usersLoading]);

    const toggleDetails = (opinionId: string) => {
        setExpandedOpinionId(prevId => (prevId === opinionId ? null : opinionId));
    };

    const handleDeleteOpinion = async (userId: string, opinionId: string) => {
        if (!firestore || !window.confirm('Er du sikker på, du vil slette denne second opinion? Handlingen kan ikke fortrydes.')) return;
        
        try {
            const opinionRef = doc(firestore, 'users', userId, 'secondOpinions', opinionId);
            await deleteDoc(opinionRef);
            setOpinions(prev => prev.filter(op => op.id !== opinionId));
            toast({
                title: "Slettet",
                description: "Second opinion er blevet slettet.",
            });
        } catch (error) {
            console.error("Error deleting second opinion:", error);
            toast({
                variant: "destructive",
                title: "Fejl",
                description: "Kunne ikke slette. Se konsollen for detaljer.",
            });
        }
    };
    
    if (isUserLoading || !userProfile) {
        return <AuthLoadingScreen />;
    }

    if (userProfile.role !== 'admin') {
        router.push('/portal');
        return <AuthLoadingScreen />;
    }
    
    const isLoading = usersLoading || opinionsLoading;

    return (
        <TooltipProvider>
            <div className="bg-[#FDFCF8] min-h-screen">
                <header className="bg-white border-b border-amber-100/50">
                    <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 flex items-center gap-4">
                        <Link href="/admin" className="p-3 bg-amber-50 text-amber-900 rounded-2xl hover:bg-amber-100 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-amber-950 serif">
                                Second Opinions
                            </h1>
                            <p className="text-base text-slate-500">
                                Oversigt over alle gennemførte analyser.
                            </p>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto p-4 md:p-8">
                    <div className="bg-white p-8 rounded-[2rem] border border-amber-100/60 shadow-sm">
                        {isLoading ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin"/></div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 rounded-l-lg">Bruger</th>
                                            <th scope="col" className="px-6 py-3">Dato</th>
                                            <th scope="col" className="px-6 py-3">Karakter</th>
                                            <th scope="col" className="px-6 py-3 text-center">Grundlag for klage?</th>
                                            <th scope="col" className="px-6 py-3 text-right rounded-r-lg">Handlinger</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {opinions.map(opinion => (
                                        <React.Fragment key={opinion.id}>
                                            <tr className="bg-white border-b border-amber-100/50 hover:bg-amber-50/50">
                                                <td className="px-6 py-4 font-semibold text-amber-950">{opinion.user?.username}</td>
                                                <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                                    {opinion.createdAt?.toDate().toLocaleDateString('da-DK', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 font-bold">{opinion.input.grade}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {opinion.analysis.isComplaintJustified ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto"/>
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-500 mx-auto"/>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end">
                                                    <Button variant="outline" size="sm" onClick={() => toggleDetails(opinion.id)}>
                                                        <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${expandedOpinionId === opinion.id ? 'rotate-180' : ''}`} />
                                                        {expandedOpinionId === opinion.id ? 'Skjul' : 'Vis'} detaljer
                                                    </Button>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteOpinion(opinion.user!.id, opinion.id)} className="ml-1 text-slate-400 hover:text-red-600">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Slet permanent</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                            {expandedOpinionId === opinion.id && (
                                                <tr>
                                                    <td colSpan={5} className="p-0 bg-slate-50 border-b border-amber-200">
                                                        <DetailView opinion={opinion} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </TooltipProvider>
    );
};

export default SecondOpinionsPage;
