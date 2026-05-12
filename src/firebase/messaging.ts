import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initializeFirebase } from './config';

export const requestNotificationPermission = async (userId: string, silent: boolean = false) => {
  const { firestore, firebaseApp } = initializeFirebase();
  if (!firestore) return;

  try {
    if (Capacitor.isNativePlatform()) {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
            permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
            throw new Error('Tilladelse blev ikke givet i appen. Gå til indstillinger for at aktivere.');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Timeout: Systemet svarede ikke på anmodningen om notifikationer. Er din app konfigureret korrekt i Xcode? (Husk at Push Notifications kræver en fysisk iPhone og 'Push Notifications' capability i Xcode)"));
            }, 10000);

            // Add listeners BEFORE calling register()
            PushNotifications.addListener('registration', async ({ value: token }) => {
                clearTimeout(timeout);
                try {
                    const userRef = doc(firestore, 'users', userId);
                    await updateDoc(userRef, {
                        fcmTokens: arrayUnion(token)
                    });
                    resolve(token);
                } catch (e) {
                    reject(e);
                }
            });

            PushNotifications.addListener('registrationError', (error: any) => {
                clearTimeout(timeout);
                reject(new Error("Apple Push Fejl: " + JSON.stringify(error)));
            });

            // NOW call register
            PushNotifications.register().catch(e => {
                clearTimeout(timeout);
                reject(new Error("Kunne ikke registrere for push: " + e.message));
            });
        });
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
        throw new Error("Push-notifikationer understøttes ikke i denne browser.");
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error("Tilladelse blev ikke givet. Tjek dine browser-indstillinger.");
    }

    const messaging = getMessaging(firebaseApp);
    
    // 1. Trigger registration
    await navigator.serviceWorker.register('/service-worker.js');
    
    // 2. Wait for it to be fully ready and active (most robust way)
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration || !registration.active) {
        throw new Error("Service worker er ikke aktiv. Prøv at genindlæse appen.");
    }
    
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
    }
  } catch (error: any) {
    if (silent) {
      console.warn('Notification permission failed silently:', error.message);
      return null;
    }
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
