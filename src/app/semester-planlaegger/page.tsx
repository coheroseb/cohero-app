
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  CalendarDays, 
  ArrowLeft, 
  Link as LinkIcon, 
  Zap, 
  Sparkles, 
  Loader2,
  AlertTriangle,
  Info,
  Save,
  Plus
} from 'lucide-react';
import { useApp } from '@/app/provider';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp, setDoc, doc, writeBatch, increment, getDoc } from 'firebase/firestore';
import { generateSemesterPlanAction } from '@/app/actions';
import type { SemesterPlan } from '@/ai/flows/types';
import { useToast } from "@/hooks/use-toast";


function SemesterPlannerPageContent() {
    const { user, userProfile, refetchUserProfile } = useApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [icalUrl, setIcalUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePlan = async () => {
        if (!icalUrl || !user || !firestore) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await generateSemesterPlanAction({ icalUrl });
            
            const planRef = doc(collection(firestore, 'users', user.uid, 'semesterPlans'));
            const latestPlanRef = doc(firestore, 'users', user.uid, 'semesterPlans', 'latest');
            const userRef = doc(firestore, 'users', user.uid);
            
            const batch = writeBatch(firestore);

            const planDataToSave = {
                ...response.data,
                icalUrl: icalUrl,
                createdAt: serverTimestamp(),
            };

            batch.set(planRef, planDataToSave);
            batch.set(latestPlanRef, planDataToSave);

            if (response.usage) {
                const totalTokens = response.usage.inputTokens + response.usage.outputTokens;
                const pointsToAdd = Math.round(totalTokens * 0.05);

                const tokenUsageRef = doc(collection(firestore, 'users', user.uid, 'tokenUsage'));
                batch.set(tokenUsageRef, { flowName: 'generateSemesterPlan', ...response.usage, totalTokens, createdAt: serverTimestamp() });
                
                if (pointsToAdd > 0) {
                    batch.update(userRef, { cohéroPoints: increment(pointsToAdd) });
                }
            }

            await batch.commit();

            toast({
                title: "Semesterplan oprettet!",
                description: "Din nye plan er blevet gemt under 'Mine Semesterplaner'.",
            });
            
            router.push(`/mine-semesterplaner#${planRef.id}`);

        } catch (err: any) {
            console.error("Plan generation error:", err);
            setError(`Kunne ikke generere planen: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col">
      <header className="bg-white border-b border-amber-100 px-6 py-6 sticky top-24 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/portal" className="p-2 hover:bg-amber-50 rounded-xl transition-colors text-amber-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-amber-950 serif">Semester-Planlægger</h1>
            <p className="text-xs text-slate-500">Importer din studiekalender og få overblik</p>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        <div className="max-w-xl w-full text-center bg-white p-12 rounded-[3rem] border border-amber-100/60 shadow-lg">
          <div className="w-20 h-20 bg-lime-50 text-lime-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CalendarDays className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-amber-950 serif mb-4">Skab overblik over dit semester</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Indsæt dit iCal-link fra dit uddannelsessted (f.eks. TimeEdit), og lad vores AI organisere dit semester i en overskuelig tidslinje.
          </p>
          <div className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-grow">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="url"
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="Indsæt iCal-link her..."
                className="w-full pl-10"
              />
            </div>
            <Button onClick={handleGeneratePlan} disabled={isLoading || !icalUrl}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
          <div className="mt-8 pt-8 border-t border-amber-100/60">
            <div className="bg-amber-50 border-2 border-dashed border-amber-200 text-amber-900 p-4 rounded-xl flex items-start gap-3 text-left text-sm">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                <div>
                    <span className="font-bold">Hvor finder jeg mit iCal-link?</span>
                    <p className="text-xs mt-1">De fleste uddannelsessteder tilbyder et iCal-link til dit skema. Kig efter et kalender- eller abonnementsikon i dit skema-system (f.eks. TimeEdit).</p>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const SemesterPlannerPage = () => {
    const { user, isUserLoading } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.replace('/');
        }
    }, [user, isUserLoading, router]);

    if (isUserLoading || !user) {
        return <AuthLoadingScreen />;
    }

    return <SemesterPlannerPageContent />;
};

export default SemesterPlannerPage;
