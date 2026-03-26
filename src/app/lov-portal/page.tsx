'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

// Disable SSR for the main viewer to prevent 500 errors during pre-rendering
// since it relies heavily on client-side state and browser-only Firebase initialization.
const LovPortalViewer = dynamic(
    () => import('@/components/lov-portal/LovPortalViewer').then(mod => mod.LovPortalViewer),
    { ssr: false, loading: () => <AuthLoadingScreen /> }
);

export default function LovPortalPage() {
    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <LovPortalViewer />
        </Suspense>
    );
}
