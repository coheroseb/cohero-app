'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToSemesterplaner() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/mine-semesterplaner');
  }, [router]);
  return null;
}
