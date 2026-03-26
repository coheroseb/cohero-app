
'use client';

import React, { Suspense } from 'react';
import { LovPortalViewer } from '@/components/lov-portal/LovPortalViewer';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function LovPortalPage() {
    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <LovPortalViewer />
        </Suspense>
    );
}
