'use client';

import React, { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Capacitor } from '@capacitor/core';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useApp } from '@/app/provider';
import { useRouter } from 'next/navigation';
import { identifyReformAction, generateParagraphDiffAction } from '@/app/actions';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import type { LawConfig } from '@/ai/flows/types';

// Disable SSR for the main viewer to prevent 500 errors during pre-rendering
const LovPortalViewer = dynamic(
    () => import('@/components/lov-portal/LovPortalViewer').then(mod => mod.LovPortalViewer),
    { ssr: false, loading: () => <AuthLoadingScreen /> }
);

const NativeLovPortal = dynamic(
    () => import('@/components/native/NativeLovPortal'),
    { ssr: false, loading: () => <AuthLoadingScreen /> }
);

export default function LovPortalPage() {
    const [isNative, setIsNative] = useState(false);
    const [laws, setLaws] = useState<LawConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const firestore = useFirestore();
    const { user, userProfile } = useApp();
    const router = useRouter();

    // Reform Analysis State
    const [analysisState, setAnalysisState] = useState({
        isAnalyzing: false,
        step: '',
        progress: 0,
        result: null as any
    });

    useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    useEffect(() => {
        if (!firestore || !isNative) return;
        const q = query(collection(firestore, 'laws'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LawConfig[];
            setLaws(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [firestore, isNative]);

    const handleAnalyzeReform = async (q: string) => {
        setAnalysisState(prev => ({ ...prev, isAnalyzing: true, step: 'identifying', progress: 10 }));
        try {
            const candidates = await identifyReformAction({ query: q });
            if (candidates?.data?.candidates?.length > 0) {
                const best = candidates.data.candidates[0];
                setAnalysisState(prev => ({ ...prev, step: 'analyzing', progress: 40 }));
                
                const diff = await generateParagraphDiffAction({
                    targetLawTitle: best.title,
                    newBillXmlUrl: best.xmlUrl,
                    oldLawXmlUrl: best.xmlUrl.includes('LF') ? best.xmlUrl.replace('LF', 'LBK') : best.xmlUrl // Simplified logic
                });
                
                setAnalysisState(prev => ({ ...prev, isAnalyzing: false, progress: 100, result: diff?.data }));
            } else {
                setAnalysisState(prev => ({ ...prev, isAnalyzing: false, step: 'no-results' }));
            }
        } catch (e) {
            console.error(e);
            setAnalysisState(prev => ({ ...prev, isAnalyzing: false }));
        }
    };

    if (isNative) {
        return (
            <Suspense fallback={<AuthLoadingScreen />}>
                <NativeLovPortal 
                    laws={laws}
                    isLoading={isLoading}
                    onLawClick={(id) => router.push(`/lov-portal/view/${id}`)}
                    isPremium={userProfile?.membership === 'plus' || userProfile?.membership === 'plusplus'}
                    onAnalyzeReform={handleAnalyzeReform}
                    analysisState={analysisState}
                />
            </Suspense>
        );
    }

    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <LovPortalViewer />
        </Suspense>
    );
}
