'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function SagRedirectPage({ params }: { params: { sagId: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main page, with a hash to scroll to the item
    router.replace(`/folketinget#sag-${params.sagId}`);
  }, [router, params.sagId]);

  return <AuthLoadingScreen />;
}
