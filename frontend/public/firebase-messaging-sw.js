/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config se inyecta al registrar el SW o se usa directamente
// El SW recibe la config via postMessage desde el cliente
let firebaseConfig = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initFirebase();
  }
});

function initFirebase() {
  if (!firebaseConfig) return;

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Manejar notificaciones push en background
  messaging.onBackgroundMessage((payload) => {

    const notificationTitle = payload.notification?.title || 'Nueva notificación';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: payload.data?.type || 'default',
      data: payload.data || {},
      actions: [
        {
          action: 'open',
          title: 'Ver',
        },
      ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Manejar click en la notificación
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla y navegar
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url,
          });
          return;
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      return clients.openWindow(url);
    })
  );
});
