import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeFirebase } from './config';

export const requestNotificationPermission = async (userId: string) => {
  const { firestore, firebaseApp } = initializeFirebase();
  if (!firestore) return;

  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
        throw new Error("Push-notifikationer understøttes ikke i denne browser.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error("Tilladelse blev ikke givet. Tjek dine browser-indstillinger.");
    }

    const messaging = getMessaging(firebaseApp);
    
    // Use the main service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    
    const token = await getToken(messaging, { 
        vapidKey: 'BPzedfrAgPwtnL2Gri9xh0DdA_qQH500Gh8tOOuV5FYU0ZKZhIWcr19oVV8P9SYgedy7_eQ2rWilxzlzQ6PQ3t4',
        serviceWorkerRegistration: registration
    });

    if (token) {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token)
        });
        return token;
    }
  } catch (error: any) {
    console.error('Notification error:', error);
    throw error;
  }
};

export const onForegroundMessage = () => {
    try {
        const { firebaseApp } = initializeFirebase();
        const messaging = getMessaging(firebaseApp);
        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
        });
    } catch (e) {
        console.warn('Messaging not supported');
    }
};
