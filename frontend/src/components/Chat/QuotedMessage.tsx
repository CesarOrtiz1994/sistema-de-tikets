import { FiCornerDownRight, FiFile, FiImage } from 'react-icons/fi';
import type { MessageReceived } from '../../validators/socket.validator';

interface QuotedMessageProps {
  message: NonNullable<MessageReceived['replyTo']>;
  onClick?: () => void;
  compact?: boolean;
}

export default function QuotedMessage({ message, onClick, compact = false }: QuotedMessageProps) {
  
  const truncateMessage = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasAttachment = message.attachmentUrl && message.attachmentType;
  const isImage = message.attachmentType?.startsWith('image/');

  return (
    <div
      onClick={onClick}
      className={`flex flex-col gap-1 p-3 rounded-lg border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-900/30 dark:to-blue-900/10 ${
        onClick ? 'cursor-pointer hover:from-blue-100 hover:to-blue-100/50 dark:hover:from-blue-900/40 dark:hover:to-blue-900/20 transition-all' : ''
      } ${compact ? 'text-xs' : 'text-sm'} shadow-sm`}
    >
      {/* Header con icono y nombre */}
      <div className="flex items-center gap-2">
        <FiCornerDownRight className={`flex-shrink-0 text-blue-600 dark:text-blue-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
        <p className={`font-semibold text-blue-700 dark:text-blue-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          {message.user.name}
        </p>
      </div>
      
      {/* Contenido del mensaje citado */}
      <div className="pl-6">
        {hasAttachment ? (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            {isImage ? (
              <>
                <FiImage className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate font-medium">{message.attachmentName || 'Imagen'}</span>
              </>
            ) : (
              <>
                <FiFile className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate font-medium">{message.attachmentName || 'Archivo'}</span>
              </>
            )}
          </div>
        ) : (
          <p className={`text-gray-700 dark:text-gray-300 ${compact ? 'text-xs' : 'text-sm'} leading-relaxed italic`}>
            "{truncateMessage(message.message)}"
          </p>
        )}
        
        {/* Indicador de click para ir al mensaje */}
        {onClick && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 opacity-70">
            Click para ver mensaje original
          </p>
        )}
      </div>
    </div>
  );
}
