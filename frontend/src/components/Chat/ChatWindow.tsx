import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useUnreadMessages } from '../../contexts/UnreadMessagesContext';
import { ticketMessagesService } from '../../services/ticketMessages.service';
import { toast } from 'sonner';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import ChatTypingIndicator from './ChatTypingIndicator';
import ChatSearch from './ChatSearch';
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
  
  const { markAsRead } = useUnreadMessages();

  const [messages, setMessages] = useState<MessageReceived[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isJoined, setIsJoined] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const typingTimeoutRef = useRef<{ [userId: string]: ReturnType<typeof setTimeout> }>({});
  
  // Estados de búsqueda
  const [searchResults, setSearchResults] = useState<MessageReceived[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  
  // Estado de respuesta
  const [replyingTo, setReplyingTo] = useState<MessageReceived | null>(null);

  // Verificar si el chat debe estar habilitado
  const isChatVisible = !!assignedToId; // Mostrar chat si hay agente asignado (incluso cerrado/cancelado)
  const isChatEnabled = isChatVisible && ticketStatus !== 'CLOSED' && ticketStatus !== 'CANCELLED'; // Permitir enviar solo si no está cerrado/cancelado

  // Cargar historial de mensajes al montar (si el chat es visible)
  useEffect(() => {
    const loadHistory = async () => {
      if (!isChatVisible) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        console.log('[ChatWindow] Loading message history for ticket:', ticketId);
        const { messages: historyMessages, total } = await ticketMessagesService.getMessages(ticketId);
        console.log('[ChatWindow] History loaded:', historyMessages.length, 'messages of', total, 'total');
        // Invertir el orden para mostrar más recientes abajo
        setMessages(historyMessages.reverse());
        setHasMoreMessages(historyMessages.length < total);
        
        // Marcar mensajes como leídos al abrir el chat
        await markAsRead(ticketId);
        console.log('[ChatWindow] Messages marked as read for ticket:', ticketId);
      } catch (error) {
        console.error('[ChatWindow] Error loading history:', error);
        toast.error('Error al cargar historial de mensajes');
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, isChatVisible]);

  useEffect(() => {
    if (!isConnected || !isChatEnabled) {
      return;
    }

    joinTicket(ticketId);
    setIsJoined(true);

    const unsubscribeMessages = onMessageReceived((message) => {
      console.log('[ChatWindow] Message received from socket:', message);
      setMessages((prev) => {
        console.log('[ChatWindow] Adding message to state. Current count:', prev.length);
        // Evitar duplicados
        if (prev.some(m => m.id === message.id)) {
          console.log('[ChatWindow] Message already exists, skipping');
          return prev;
        }
        return [...prev, message];
      });
    });

    onTyping((data) => {
      if (data.isTyping) {
        setTypingUsers((prev) => new Set(prev).add(data.userName));

        if (typingTimeoutRef.current[data.userId]) {
          clearTimeout(typingTimeoutRef.current[data.userId]);
        }

        // Timeout de 4 segundos (2s de debounce + 2s de margen)
        typingTimeoutRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userName);
            return newSet;
          });
          delete typingTimeoutRef.current[data.userId];
        }, 4000);
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
      unsubscribeMessages();
      leaveTicket(ticketId);
      setIsJoined(false);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [isConnected, ticketId, joinTicket, leaveTicket, onMessageReceived, onTyping, isChatEnabled]);

  const handleSendMessage = async (message: string, attachment?: { url: string; name: string; type: string; size: number }, replyToId?: string) => {
    console.log('[ChatWindow] handleSendMessage called', { ticketId, message, hasAttachment: !!attachment, replyToId });
    try {
      await sendMessage(ticketId, message, attachment, replyToId);
      console.log('[ChatWindow] Message sent successfully');
      setReplyingTo(null); // Limpiar respuesta después de enviar
    } catch (err: any) {
      console.error('[ChatWindow] Error sending message:', err);
      
      // Manejar errores de rate limiting
      if (err.message?.includes('rate limit') || err.message?.includes('demasiado rápido')) {
        toast.error('Estás enviando mensajes demasiado rápido. Por favor espera un momento.');
      } else {
        toast.error('Error al enviar mensaje. Por favor intenta de nuevo.');
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    console.log('[ChatWindow] handleTyping called', { ticketId, isTyping });
    sendTyping(ticketId, isTyping);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { messages: results } = await ticketMessagesService.searchMessages(ticketId, query);
      setSearchResults(results);
      setCurrentSearchIndex(0);
      
      if (results.length > 0) {
        setHighlightedMessageId(results[0].id);
        toast.success(`${results.length} mensaje${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''}`);
      } else {
        setHighlightedMessageId(null);
        toast.info('No se encontraron mensajes');
      }
    } catch (error) {
      console.error('[ChatWindow] Error searching messages:', error);
      toast.error('Error al buscar mensajes');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setCurrentSearchIndex(0);
    setHighlightedMessageId(null);
  };

  const handleNavigateSearch = (index: number) => {
    setCurrentSearchIndex(index);
    if (searchResults[index]) {
      setHighlightedMessageId(searchResults[index].id);
    }
  };

  const handleReply = (message: MessageReceived) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const scrollToMessage = (messageId: string) => {
    setHighlightedMessageId(messageId);
    // El scroll automático se maneja en ChatMessageList con el useEffect
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMoreMessages) return;

    setIsLoadingMore(true);
    try {
      const currentOffset = messages.length;
      console.log('[ChatWindow] Loading more messages. Offset:', currentOffset);
      
      const { messages: olderMessages, total } = await ticketMessagesService.getMessages(
        ticketId,
        50,
        currentOffset
      );
      
      console.log('[ChatWindow] Loaded', olderMessages.length, 'older messages');
      
      if (olderMessages.length > 0) {
        // Invertir y agregar al inicio, filtrando duplicados
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = olderMessages.reverse().filter(m => !existingIds.has(m.id));
          return [...newMessages, ...prev];
        });
        setHasMoreMessages(messages.length + olderMessages.length < total);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('[ChatWindow] Error loading more messages:', error);
      toast.error('Error al cargar mensajes antiguos');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Mostrar mensaje si el chat no es visible (ticket sin asignar)
  if (!isChatVisible) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-center px-6 py-8 max-w-md">
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Chat no disponible
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            El chat estará disponible una vez que el ticket sea asignado a un agente.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Cargando mensajes...
          </p>
        </div>
      </div>
    );
  }

  if (isChatEnabled && !isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Conectando al chat...
          </p>
        </div>
      </div>
    );
  }

  if (isChatEnabled && !isJoined) {
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
      {/* Barra de búsqueda */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <ChatSearch
          onSearch={handleSearch}
          onClear={handleClearSearch}
          results={searchResults}
          currentIndex={currentSearchIndex}
          onNavigate={handleNavigateSearch}
          isSearching={isSearching}
        />
      </div>
      
      <ChatMessageList 
        messages={messages} 
        highlightedMessageId={highlightedMessageId}
        onReply={handleReply}
        scrollToMessage={scrollToMessage}
        onLoadMore={loadMoreMessages}
        isLoadingMore={isLoadingMore}
        hasMoreMessages={hasMoreMessages}
      />
      {isChatEnabled && typingUsers.size > 0 && (
        <ChatTypingIndicator users={Array.from(typingUsers)} />
      )}
      {isChatEnabled ? (
        <ChatInput 
          ticketId={ticketId} 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
        />
      ) : (
        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            {ticketStatus === 'CLOSED' ? '🔒 El ticket está cerrado. No se pueden enviar más mensajes.' : '❌ El ticket está cancelado. No se pueden enviar más mensajes.'}
          </p>
        </div>
      )}
    </div>
  );
}
