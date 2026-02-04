import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { ticketMessagesService } from '../../services/ticketMessages.service';
import { toast } from 'sonner';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatTypingIndicator from './ChatTypingIndicator';
import LoadingSpinner from '../common/LoadingSpinner';
import type { MessageReceived } from '../../validators/socket.validator';

interface ChatWindowProps {
  ticketId: string;
  ticketStatus?: string;
  assignedToId?: string | null;
}

export default function ChatWindow({ ticketId, ticketStatus, assignedToId }: ChatWindowProps) {
  const {
    isConnected,
    joinTicket,
    leaveTicket,
    sendMessage,
    sendTyping,
    onMessageReceived,
    onTyping
  } = useSocket();

  const [messages, setMessages] = useState<MessageReceived[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isJoined, setIsJoined] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const typingTimeoutRef = useRef<{ [userId: string]: ReturnType<typeof setTimeout> }>({});

  // Verificar si el chat debe estar habilitado
  const isChatEnabled = assignedToId && ticketStatus !== 'CLOSED' && ticketStatus !== 'CANCELLED';

  // Cargar historial de mensajes al montar (solo si el chat está habilitado)
  useEffect(() => {
    const loadHistory = async () => {
      if (!isChatEnabled) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        console.log('[ChatWindow] Loading message history for ticket:', ticketId);
        const { messages: historyMessages } = await ticketMessagesService.getMessages(ticketId);
        console.log('[ChatWindow] History loaded:', historyMessages.length, 'messages');
        setMessages(historyMessages);
      } catch (error) {
        console.error('[ChatWindow] Error loading history:', error);
        toast.error('Error al cargar historial de mensajes');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [ticketId, isChatEnabled]);

  useEffect(() => {
    if (!isConnected || !isChatEnabled) {
      return;
    }

    joinTicket(ticketId);
    setIsJoined(true);

    onMessageReceived((message) => {
      setMessages((prev) => [...prev, message]);
    });

    onTyping((data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Set(prev).add(data.userName));

        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
        }

        typingTimeoutRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userName);
            return newSet;
          });
          delete typingTimeoutRef.current[data.userId];
        }, 3000);
      } else {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userName);
          return newSet;
        });
        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
          delete typingTimeoutRef.current[data.userId];
        }
      }
    });

    return () => {
      console.log('[ChatWindow] Leaving ticket and clearing timeouts');
      leaveTicket(ticketId);
      setIsJoined(false);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [isConnected, ticketId, joinTicket, leaveTicket, onMessageReceived, onTyping]);

  const handleSendMessage = async (message: string, attachment?: { url: string; name: string; type: string; size: number }) => {
    console.log('[ChatWindow] handleSendMessage called', { ticketId, message, hasAttachment: !!attachment });
    try {
      await sendMessage(ticketId, message, attachment);
      console.log('[ChatWindow] Message sent successfully');
    } catch (err) {
      console.error('[ChatWindow] Error sending message:', err);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    console.log('[ChatWindow] handleTyping called', { ticketId, isTyping });
    sendTyping(ticketId, isTyping);
  };

  // Mostrar mensaje si el chat está deshabilitado
  if (!isChatEnabled) {
    let message = '';
    let icon = '';

    if (!assignedToId) {
      message = 'El chat estará disponible una vez que el ticket sea asignado a un agente.';
      icon = '👤';
    } else if (ticketStatus === 'CLOSED') {
      message = 'El chat no está disponible porque el ticket ha sido cerrado.';
      icon = '🔒';
    } else if (ticketStatus === 'CANCELLED') {
      message = 'El chat no está disponible porque el ticket ha sido cancelado.';
      icon = '❌';
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center px-6 py-8 max-w-md">
          <div className="text-5xl mb-4">{icon}</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Chat no disponible
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>
      </div>
    );
  }

  if (!isConnected || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {!isConnected ? 'Conectando al chat...' : 'Cargando mensajes...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Uniéndose al chat...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ChatMessageList messages={messages} />
      {typingUsers.size > 0 && (
        <ChatTypingIndicator users={Array.from(typingUsers)} />
      )}
      <ChatInput 
        ticketId={ticketId} 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!isConnected}
      />
    </div>
  );
}
