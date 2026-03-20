'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToLovPortal() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/lov-portal');
  }, [router]);
  return null;
}