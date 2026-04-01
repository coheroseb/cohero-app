'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FeatureWalkthrough from '@/components/FeatureWalkthrough';
import { useApp } from '@/app/provider';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function WelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile } = useApp();
  const firestore = useFirestore();
  
  const callbackUrl = searchParams?.get('callbackUrl') || '/portal';

  const onComplete = async () => {
    if (user && firestore) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid), {
          hasSeenFeatureIntro: true
        });
      } catch (err) {
        console.error("Failed to mark feature intro as seen:", err);
      }
    }
    router.push(callbackUrl);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <FeatureWalkthrough onComplete={onComplete} isPage={true} userProfile={userProfile} />
    </div>
  );
}
