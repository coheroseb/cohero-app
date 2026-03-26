
'use client';

import React from 'react';
import { LovPortalViewer } from '@/components/lov-portal/LovPortalViewer';

export default function LawViewPage() {
    // The viewer already uses useParams() to detect lawId
    return <LovPortalViewer />;
}
