import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { unreadMessagesService, UnreadCounts } from '../services/unreadMessages.service';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';

interface UnreadMessagesContextType {
  unreadCounts: UnreadCounts;
  getUnreadCount: (ticketId: string) => number;
  markAsRead: (ticketId: string) => Promise<void>;
  refreshCounts: () => Promise<void>;
  isLoading: boolean;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({});
  const [isLoading, setIsLoading] = useState(true);

  // Cargar conteos iniciales
  const loadCounts = async () => {
    if (!user) {
      console.log('[UnreadMessagesContext] No user, skipping loadCounts');
      return;
    }
    
    try {
      console.log('[UnreadMessagesContext] Loading unread counts for user:', user.id);
      setIsLoading(true);
      const counts = await unreadMessagesService.getUnreadCounts();
      console.log('[UnreadMessagesContext] Loaded counts:', counts);
      setUnreadCounts(counts);
    } catch (error) {
      console.error('[UnreadMessagesContext] Error loading unread counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar conteos al montar y cuando cambia el usuario
  useEffect(() => {
    console.log('[UnreadMessagesContext] useEffect triggered, user:', user?.id);
    if (user) {
      loadCounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Escuchar notificaciones de mensajes no leídos para actualizar contadores
  useEffect(() => {
    if (!user || !socket) return;

    console.log('[UnreadMessagesContext] Setting up unread notification listener for user:', user.id);

    const handleUnreadNotification = (data: { ticketId: string; messageId: string; senderId: string; senderName: string }) => {
      console.log('[UnreadMessagesContext] Unread notification received:', data);
      
      // Incrementar contador para este ticket
      setUnreadCounts(prev => ({
        ...prev,
        [data.ticketId]: (prev[data.ticketId] || 0) + 1
      }));
    };

    socket.on('unread-message-notification', handleUnreadNotification);

    return () => {
      console.log('[UnreadMessagesContext] Cleaning up unread notification listener');
      socket.off('unread-message-notification', handleUnreadNotification);
    };
  }, [user?.id, socket]);

  const getUnreadCount = (ticketId: string): number => {
    return unreadCounts[ticketId] || 0;
  };

  const markAsRead = async (ticketId: string): Promise<void> => {
    try {
      await unreadMessagesService.markAsRead(ticketId);
      
      // Actualizar contador local inmediatamente
      setUnreadCounts(prev => ({
        ...prev,
        [ticketId]: 0
      }));
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  };

  const refreshCounts = async (): Promise<void> => {
    console.log('[UnreadMessagesContext] refreshCounts called');
    await loadCounts();
  };

  return (
    <UnreadMessagesContext.Provider
      value={{
        unreadCounts,
        getUnreadCount,
        markAsRead,
        refreshCounts,
        isLoading
      }}
    >
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext);
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
}
