import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/dateUtils';
import { FiFile, FiImage, FiDownload, FiMaximize2, FiClock, FiCheck, FiAlertCircle, FiRefreshCw, FiCornerDownLeft } from 'react-icons/fi';
import { MessageStatus } from '../../types/messageStatus';
import ImagePreviewModal from './ImagePreviewModal';
import QuotedMessage from './QuotedMessage';
import type { MessageReceived } from '../../validators/socket.validator';

interface ChatMessageListProps {
  messages: MessageReceived[];
  onRetryMessage?: (tempId: string) => void;
  highlightedMessageId?: string | null;
  onReply?: (message: MessageReceived) => void;
  scrollToMessage?: (messageId: string) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMoreMessages?: boolean;
}

export default function ChatMessageList({ messages, onRetryMessage, highlightedMessageId, onReply, scrollToMessage, onLoadMore, isLoadingMore, hasMoreMessages }: ChatMessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const highlightedMessageRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Helper para construir URL completa de archivos
  const getFullFileUrl = (url: string): string => {
    // Si ya es una URL completa (comienza con http:// o https://), retornarla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // Si es una URL relativa, construir la URL completa con el backend
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${API_URL}${url}`;
  };

  useEffect(() => {
    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldScrollToBottom]);

  // Detectar scroll hacia arriba para cargar más mensajes
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !onLoadMore) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      // Si el usuario hace scroll hacia arriba cerca del inicio
      if (scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
        const previousScrollHeight = scrollHeight;
        
        onLoadMore();
        
        // Mantener posición de scroll después de cargar
        setTimeout(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight + scrollTop;
        }, 100);
      }
      
      // Detectar si el usuario está cerca del final
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScrollToBottom(isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onLoadMore, hasMoreMessages, isLoadingMore]);

  // Scroll al mensaje resaltado cuando cambia
  useEffect(() => {
    if (highlightedMessageId && highlightedMessageRef.current) {
      highlightedMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedMessageId]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center px-4 py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-brand-gradient rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            No hay mensajes aún
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Envía el primer mensaje para iniciar la conversación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
    >
      {/* Indicador de carga de mensajes antiguos */}
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      
      {/* Indicador de que hay más mensajes */}
      {hasMoreMessages && !isLoadingMore && messages.length > 0 && (
        <div className="flex justify-center py-2">
          <button
            onClick={onLoadMore}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            ↑ Cargar mensajes más antiguos
          </button>
        </div>
      )}
      
      {messages.map((message) => {
        const isOwnMessage = message.userId === user?.id;

        const isHighlighted = highlightedMessageId === message.id;
        
        return (
          <div
            key={message.id}
            ref={isHighlighted ? highlightedMessageRef : null}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isHighlighted ? 'animate-pulse' : ''}`}
          >
            <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className="flex-shrink-0">
                {message.user.profilePicture ? (
                  <img
                    src={message.user.profilePicture}
                    alt={message.user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-gray-800"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                    isOwnMessage 
                      ? 'bg-brand-gradient' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {message.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message bubble */}
              <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 shadow-sm transition-all ${isHighlighted ? 'ring-2 ring-yellow-400 dark:ring-yellow-500' : ''} ${
                  isOwnMessage
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}>
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400">
                      {message.user.name}
                    </p>
                  )}
                  
                  {/* Mensaje citado */}
                  {message.replyTo && (
                    <div className="mb-2">
                      <QuotedMessage 
                        message={message.replyTo} 
                        onClick={() => scrollToMessage?.(message.replyTo!.id)}
                        compact
                      />
                    </div>
                  )}
                  {!message.replyTo && message.replyToId && (
                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      ⚠️ Respondiendo a un mensaje (ID: {message.replyToId.substring(0, 8)}...)
                    </div>
                  )}
                  
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.message}
                  </p>
                  
                  {/* Botón de responder */}
                  {onReply && (
                    <button
                      onClick={() => onReply(message)}
                      className={`mt-2 flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity ${
                        isOwnMessage ? 'text-white/80 hover:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title="Responder a este mensaje"
                    >
                      <FiCornerDownLeft className="w-3 h-3" />
                      Responder
                    </button>
                  )}

                  {/* Indicador de estado para mensajes propios */}
                  {isOwnMessage && (message as any).status && (
                    <div className="flex items-center gap-1 mt-1">
                      {(message as any).status === MessageStatus.SENDING && (
                        <FiClock className="w-3 h-3 animate-pulse" title="Enviando..." />
                      )}
                      {(message as any).status === MessageStatus.SENT && (
                        <FiCheck className="w-3 h-3" title="Enviado" />
                      )}
                      {(message as any).status === MessageStatus.ERROR && (
                        <>
                          <FiAlertCircle className="w-3 h-3 text-red-300" title="Error al enviar" />
                          {onRetryMessage && (message as any).tempId && (
                            <button
                              onClick={() => onRetryMessage((message as any).tempId)}
                              className="ml-1 text-xs underline hover:text-white flex items-center gap-1"
                              title="Reintentar envío"
                            >
                              <FiRefreshCw className="w-3 h-3" />
                              Reintentar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Archivo adjunto */}
                  {message.attachmentUrl && (
                    <div className="mt-2">
                      {message.attachmentType?.startsWith('image/') ? (
                        <div className="relative group">
                          <img 
                            src={getFullFileUrl(message.attachmentUrl)} 
                            alt={message.attachmentName || 'Imagen adjunta'}
                            className={`max-w-sm w-full rounded-lg cursor-pointer transition-all shadow-lg ${
                              isOwnMessage
                                ? 'border-2 border-white/30 hover:border-white/50'
                                : 'border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                            }`}
                            onClick={() => setPreviewImage({ 
                              url: getFullFileUrl(message.attachmentUrl!), 
                              name: message.attachmentName || 'Imagen' 
                            })}
                            loading="lazy"
                          />
                          {/* Overlay con botón de expandir */}
                          <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none ${
                            isOwnMessage ? 'bg-black/20' : 'bg-black/30'
                          }`}>
                            <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg">
                              <FiMaximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            </div>
                          </div>
                          {/* Info de la imagen */}
                          {message.attachmentName && (
                            <div className={`mt-1 text-xs truncate ${
                              isOwnMessage ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {message.attachmentName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <a
                          href={getFullFileUrl(message.attachmentUrl)}
                          download={message.attachmentName}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer ${
                            isOwnMessage
                              ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                          }`}
                          title={`Descargar ${message.attachmentName}`}
                        >
                          {message.attachmentType === 'application/pdf' ? (
                            <FiFile className="w-5 h-5" />
                          ) : (
                            <FiImage className="w-5 h-5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {message.attachmentName}
                            </p>
                            {message.attachmentSize && (
                              <p className="text-xs opacity-75">
                                {(message.attachmentSize / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                          <FiDownload className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                  {formatDate(message.createdAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
      
      {/* Modal de preview de imagen */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          imageName={previewImage.name}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
