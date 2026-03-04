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
      return;
    }
    
    try {
      setIsLoading(true);
      const counts = await unreadMessagesService.getUnreadCounts();
      setUnreadCounts(counts);
    } catch (error) {
      console.error('[UnreadMessagesContext] Error loading unread counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar conteos al montar y cuando cambia el usuario
  useEffect(() => {
    if (user) {
      loadCounts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Escuchar notificaciones de mensajes no leídos para actualizar contadores
  useEffect(() => {
    if (!user || !socket) return;


    const handleUnreadNotification = (data: { ticketId: string; messageId: string; senderId: string; senderName: string }) => {
      
      // Incrementar contador para este ticket
      setUnreadCounts(prev => ({
        ...prev,
        [data.ticketId]: (prev[data.ticketId] || 0) + 1
      }));
    };

    socket.on('unread-message-notification', handleUnreadNotification);

    return () => {
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
