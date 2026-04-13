'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AuthLoadingScreen from '@/components/AuthLoadingScreen';

export default function SagRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const sagId = params?.sagId as string;

  useEffect(() => {
    if (sagId) {
      // Redirect to the main page, with a hash to scroll to the item
      router.replace(`/folketinget#sag-${sagId}`);
    }
  }, [router, sagId]);

  return <AuthLoadingScreen />;
}
