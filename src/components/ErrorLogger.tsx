'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { usePathname } from 'next/navigation';

export function ErrorLogger({ user, userProfile }: { user: any; userProfile: any }) {
    const { toasts } = useToast();
    const firestore = useFirestore();
    const pathname = usePathname();
    const loggedToastIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!firestore) return;

        // Check for new destructive toasts
        toasts.forEach(toast => {
            if (toast.variant === 'destructive' && !loggedToastIds.current.has(toast.id)) {
                loggedToastIds.current.add(toast.id);

                // Log to Firestore
                addDoc(collection(firestore, 'systemErrors'), {
                    toastId: toast.id,
                    title: toast.title?.toString() || 'Ingen titel',
                    description: toast.description?.toString() || 'Ingen beskrivelse',
                    path: pathname,
                    userId: user?.uid || 'anonymous',
                    userName: userProfile?.username || user?.displayName || 'Ukendt',
                    userEmail: user?.email || 'N/A',
                    timestamp: serverTimestamp(),
                    status: 'new'
                }).catch(err => {
                    console.error('[ErrorLogger] Failed to log system error:', err);
                });
            }
        });

        // Cleanup old IDs to keep memory low (though 1000 is small)
        if (loggedToastIds.current.size > 100) {
            const ids = Array.from(loggedToastIds.current);
            loggedToastIds.current = new Set(ids.slice(-50));
        }

    }, [toasts, firestore, user, userProfile, pathname]);

    return null;
}
