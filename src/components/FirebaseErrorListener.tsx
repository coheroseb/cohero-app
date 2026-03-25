'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx.
*/
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Diagnostic logging to find the source of the permission-denied error
      console.error(`[Firestore Diagnostic] Permission Denied at path: ${err.request.path}. Operation: ${err.request.method}`);
      // Defer state update to avoid "Cannot update a component while rendering a different component"
      // This happens if the error is emitted during another component's render cycle.
      setTimeout(() => {
        setError(err);
      }, 0);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // On re-render, if an error exists in state, throw it.
  // This will be caught by the nearest Error Boundary.
  if (error) {
    throw error;
  }

  return null;
}
