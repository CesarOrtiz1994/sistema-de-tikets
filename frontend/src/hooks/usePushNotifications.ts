import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  requestNotificationPermission,
  onForegroundMessage,
  isPushSupported,
  getNotificationPermissionStatus,
} from '../config/firebase';
import { notificationsService } from '../services/notifications.service';
import { useNotificationStore } from '../store/notificationStore';

/**
 * Hook que gestiona push notifications:
 * - Verifica soporte del navegador
 * - Solicita permisos
 * - Registra token FCM en el backend
 * - Escucha mensajes push en foreground y muestra toast
 * - Maneja click en notificaciones push (background)
 */
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const registeredRef = useRef(false);
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  // Verificar soporte al montar
  useEffect(() => {
    isPushSupported().then((supported) => {
      setIsSupported(supported);
      setPermission(getNotificationPermissionStatus());
    });
  }, []);

  // Enviar config de Firebase al Service Worker
  useEffect(() => {
    if (!isSupported) return;

    const sendConfigToSW = async () => {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'FIREBASE_CONFIG',
        config: {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        },
      });
    };

    sendConfigToSW().catch(console.error);
  }, [isSupported]);

  // Solicitar permisos y registrar token
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Tu navegador no soporta notificaciones push');
      return false;
    }

    const token = await requestNotificationPermission();
    setPermission(getNotificationPermissionStatus());

    if (token) {
      setFcmToken(token);

      // Registrar token en el backend
      if (!registeredRef.current) {
        try {
          await notificationsService.registerFcmToken(token, 'web');
          registeredRef.current = true;
          toast.success('Notificaciones push activadas');
        } catch (error) {
          console.error('[Push] Error registering FCM token:', error);
          toast.error('Error al activar notificaciones push');
        }
      }
      return true;
    }

    if (Notification.permission === 'denied') {
      toast.error('Notificaciones bloqueadas. Habilítalas en la configuración del navegador.');
    }
    return false;
  }, [isSupported]);

  // Auto-registrar si ya tiene permisos concedidos
  useEffect(() => {
    if (isSupported && permission === 'granted' && !registeredRef.current) {
      requestPermission();
    }
  }, [isSupported, permission, requestPermission]);

  // Escuchar mensajes push en foreground
  useEffect(() => {
    if (!isSupported || permission !== 'granted') return;

    const unsubscribe = onForegroundMessage((payload: any) => {
      console.log('[Push] Foreground message:', payload);

      const title = payload.notification?.title || 'Nueva notificación';
      const body = payload.notification?.body || '';
      const ticketId = payload.data?.ticketId;

      // Mostrar toast
      toast(title, {
        description: body,
        duration: 6000,
        action: ticketId
          ? {
              label: 'Ver',
              onClick: () => navigate(`/tickets/${ticketId}`),
            }
          : undefined,
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isSupported, permission, navigate, addNotification]);

  // Escuchar clicks en notificaciones push (desde el SW)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.url) {
        navigate(event.data.url);
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  // Desregistrar token al hacer logout
  const unregisterToken = useCallback(async () => {
    if (fcmToken) {
      try {
        await notificationsService.unregisterFcmToken(fcmToken);
        registeredRef.current = false;
        setFcmToken(null);
      } catch (error) {
        console.error('[Push] Error unregistering FCM token:', error);
      }
    }
  }, [fcmToken]);

  return {
    isSupported,
    permission,
    fcmToken,
    requestPermission,
    unregisterToken,
  };
}
