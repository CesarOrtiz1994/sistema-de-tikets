import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/dateUtils';
import { FiFile, FiImage, FiDownload, FiMaximize2 } from 'react-icons/fi';
import ImagePreviewModal from './ImagePreviewModal';
import type { MessageReceived } from '../../validators/socket.validator';

interface ChatMessageListProps {
  messages: MessageReceived[];
}

export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center px-4 py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
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
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      {messages.map((message) => {
        const isOwnMessage = message.userId === user?.id;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
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
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}>
                    {message.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Message bubble */}
              <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                  isOwnMessage
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}>
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 text-purple-600 dark:text-purple-400">
                      {message.user.name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.message}
                  </p>
                  
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
                          <div className={`absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg ${
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
