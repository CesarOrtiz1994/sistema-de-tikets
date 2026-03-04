import { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiX } from 'react-icons/fi';
import { toast } from 'sonner';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';
import QuotedMessage from './QuotedMessage';
import { compressImage, isCompressibleImage, formatFileSize } from '../../utils/imageCompression';
import type { MessageReceived } from '../../validators/socket.validator';

interface ChatInputProps {
  ticketId: string;
  onSendMessage: (message: string, attachment?: { url: string; name: string; type: string; size: number }, replyToId?: string) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
  replyingTo?: MessageReceived | null;
  onCancelReply?: () => void;
}

const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.pdf'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export default function ChatInput({ ticketId, onSendMessage, onTyping, disabled = false, replyingTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus textarea cuando se activa reply
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Si el usuario empieza a escribir, enviar evento de typing
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      onTyping(true);
    }

    // Si el usuario borra todo el texto, detener typing inmediatamente
    if (value.length === 0 && isTyping) {
      setIsTyping(false);
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    // Resetear el timeout cada vez que el usuario escribe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Después de 2 segundos sin escribir, detener el indicador
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping(false);
    }, 2000);

    // Auto-resize del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      toast.error(`Tipo de archivo no permitido. Solo se permiten: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast.error('El archivo es demasiado grande. Tamaño máximo: 100MB');
      return;
    }

    // Comprimir imagen si es posible
    let finalFile = file;
    if (isCompressibleImage(file)) {
      try {
        toast.info('Comprimiendo imagen...');
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85
        });
        
        const originalSize = formatFileSize(file.size);
        const compressedSize = formatFileSize(compressed.size);
        const reduction = (((file.size - compressed.size) / file.size) * 100).toFixed(0);
        
        if (compressed.size < file.size) {
          finalFile = compressed;
          toast.success(`Imagen comprimida: ${originalSize} → ${compressedSize} (${reduction}% reducción)`);
        } else {
          toast.success(`Archivo seleccionado: ${file.name}`);
        }
      } catch (error) {
        console.error('[ChatInput] Error compressing image:', error);
        toast.warning('No se pudo comprimir la imagen, se usará el archivo original');
      }
    } else {
      toast.success(`Archivo seleccionado: ${file.name}`);
    }

    setSelectedFile(finalFile);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {

    if ((!message.trim() && !selectedFile) || disabled) {
      return;
    }

    if (message.trim().length > 5000) {
      toast.error('El mensaje es demasiado largo (máximo 5000 caracteres)');
      return;
    }

    try {
      let attachmentData;

      // Si hay archivo, subirlo primero
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        const token = localStorage.getItem('accessToken');
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

        const response = await axios.post(
          `${API_URL}/api/tickets/${ticketId}/messages/upload`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        attachmentData = response.data;
      }

      onSendMessage(message.trim() || '📎 Archivo adjunto', attachmentData, replyingTo?.id);
      
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      if (textareaRef.current) {
        textareaRef.current.style.height = '40px';
      }
    } catch (error) {
      console.error('[ChatInput] Error in handleSend:', error);
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Error al enviar el mensaje');
      } else {
        toast.error('Error al enviar el mensaje');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      {/* Mensaje citado */}
      {replyingTo && (
        <div className="mb-2 relative">
          <QuotedMessage 
            message={{
              id: replyingTo.id,
              message: replyingTo.message,
              userId: replyingTo.userId,
              createdAt: replyingTo.createdAt,
              attachmentUrl: replyingTo.attachmentUrl,
              attachmentName: replyingTo.attachmentName,
              attachmentType: replyingTo.attachmentType,
              user: replyingTo.user
            }} 
            compact 
          />
          <button
            onClick={onCancelReply}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded"
            title="Cancelar respuesta"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Adjuntar archivo (PNG, JPG, JPEG, SVG, PDF - máx 10MB)"
        >
          <FiPaperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            disabled={disabled}
            rows={1}
            className="w-full px-3 py-2.5 pr-16 border-0 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-600 resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            style={{ minHeight: '42px', maxHeight: '120px' }}
          />
          <div className="absolute bottom-2.5 right-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
            {message.length > 0 && `${message.length}/5000`}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedFile) || isUploading}
          className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
          title="Enviar mensaje (Enter)"
        >
          {isUploading ? <LoadingSpinner size="sm" /> : <FiSend className="w-5 h-5" />}
        </button>
      </div>

      {selectedFile && (
        <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <FiPaperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs text-blue-700 dark:text-blue-300 flex-1 truncate">
            {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 text-blue-600 dark:text-blue-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Quitar archivo"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mt-1.5 px-1 text-xs text-gray-400 dark:text-gray-500">
        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Enter</kbd> para enviar · <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Shift + Enter</kbd> nueva línea
      </div>
    </div>
  );
}
