
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';
import { Capacitor } from '@capacitor/core';

const LovPortalViewer = dynamic(
    () => import('@/components/lov-portal/LovPortalViewer').then(mod => mod.LovPortalViewer),
    { ssr: false, loading: () => <AuthLoadingScreen /> }
);

const NativeLawViewer = dynamic(
    () => import('@/components/native/NativeLawViewer'),
    { ssr: false, loading: () => <AuthLoadingScreen /> }
);

export default function LawViewPage() {
    const [isNative, setIsNative] = React.useState(false);

    React.useEffect(() => {
        setIsNative(Capacitor.isNativePlatform());
    }, []);

    if (isNative) {
        return <NativeLawViewer />;
    }

    return <LovPortalViewer />;
}
