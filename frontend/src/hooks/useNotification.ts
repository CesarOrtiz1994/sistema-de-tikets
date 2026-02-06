import { useEffect, useState, useCallback } from 'react';

export const useNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return Notification.permission;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
    return null;
  }, []);

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window
  };
};
