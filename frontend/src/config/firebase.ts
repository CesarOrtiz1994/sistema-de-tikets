import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Solo inicializar si hay config
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: Messaging | null = null;

/**
 * Inicializar Firebase y obtener instancia de Messaging
 */
async function getMessagingInstance(): Promise<Messaging | null> {
  if (messaging) return messaging;
  if (!hasConfig) {
    console.warn('[Firebase] No Firebase config found. Push notifications disabled.');
    return null;
  }

  const supported = await isSupported();
  if (!supported) {
    console.warn('[Firebase] Messaging not supported in this browser.');
    return null;
  }

  try {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    return messaging;
  } catch (error) {
    console.error('[Firebase] Error initializing:', error);
    return null;
  }
}

/**
 * Solicitar permisos de notificación y obtener token FCM
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[Firebase] Notification permission denied');
      return null;
    }

    const msg = await getMessagingInstance();
    if (!msg) return null;

    // Registrar service worker para push en background
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    console.log('[Firebase] FCM token obtained:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('[Firebase] Error getting FCM token:', error);
    return null;
  }
}

/**
 * Escuchar mensajes push en foreground
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (!messaging) {
    // Intentar inicializar de forma lazy
    getMessagingInstance().then((msg) => {
      if (msg) {
        onMessage(msg, callback);
      }
    });
    return null;
  }

  const unsubscribe = onMessage(messaging, callback);
  return unsubscribe;
}

/**
 * Verificar si push notifications están soportadas
 */
export async function isPushSupported(): Promise<boolean> {
  if (!hasConfig) return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  return await isSupported();
}

/**
 * Obtener el estado actual de permisos
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
