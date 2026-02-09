import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import socketService from '../services/socket.service';
import { useNotificationStore } from '../store/notificationStore';
import type { Notification } from '../services/notifications.service';

/**
 * Hook que escucha notificaciones en tiempo real via Socket.io
 * y muestra toast notifications con sonner.
 * Debe usarse en el Layout principal (una sola vez).
 */
export function useNotifications() {
  const { addNotification, fetchUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  const handleNotification = useCallback(
    (data: Notification) => {
      // Agregar al store
      addNotification(data);

      // Mostrar toast
      const ticketId = data.data?.ticketId;

      toast(data.title, {
        description: data.message,
        duration: 6000,
        icon: undefined,
        action: ticketId
          ? {
              label: 'Ver',
              onClick: () => navigate(`/tickets/${ticketId}`),
            }
          : undefined,
      });
    },
    [addNotification, navigate]
  );

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [handleNotification]);

  // Also re-fetch unread count when socket reconnects
  useEffect(() => {
    const unsubscribe = socketService.onConnectionChange((connected) => {
      if (connected) {
        fetchUnreadCount();
      }
    });

    return unsubscribe;
  }, [fetchUnreadCount]);
}
