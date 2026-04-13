
'use client';

import React from 'react';
import { LovPortalViewer } from '@/components/lov-portal/LovPortalViewer';
import NativeLawViewer from '@/components/native/NativeLawViewer';
import { Capacitor } from '@capacitor/core';

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
