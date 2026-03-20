importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const CACHE_NAME = 'cohero-v3';
const urlsToCache = [
  '/',
  '/portal',
  '/manifest.json',
  '/Lovportal.png'
];

const firebaseConfig = {
  apiKey: "AIzaSyAc9loZEcoQ4u0umlkioccfzp1kD0YURtI",
  authDomain: "studio-7870211338-fe921.firebaseapp.com",
  projectId: "studio-7870211338-fe921",
  storageBucket: "studio-7870211338-fe921.firebasestorage.app",
  messagingSenderId: "815145067598",
  appId: "1:815145067598:web:84e929ee06f58e67858f1f",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
// We only manually show a notification if the payload DOES NOT have a 'notification' property
// This prevents double notifications on Android/iOS
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received: ', payload);
  
  if (payload.notification) {
      // Browser will handle display automatically
      return;
  }

  // Fallback if only data is sent
  const notificationTitle = payload.data?.title || 'Ny besked fra Cohéro';
  const notificationOptions = {
    body: payload.data?.body || '',
    icon: 'https://cohero.dk/App_Icon.png',
    badge: 'https://cohero.dk/App_Icon.png',
    data: {
        url: payload.data?.url || '/portal'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const urlToOpen = new URL(event.notification.data?.url || '/portal', self.location.origin).href;
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.includes('_workstation') || url.pathname.includes('forwardAuthCookie')) return;
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
