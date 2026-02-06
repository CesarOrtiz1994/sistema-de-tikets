import { FiMessageCircle, FiX } from 'react-icons/fi';
import { toast } from 'sonner';

export const showNewMessageToast = (
  senderName: string,
  message: string,
  ticketNumber?: string,
  onClick?: () => void
) => {
  // Truncar mensaje si es muy largo
  const truncatedMessage = message.length > 60 
    ? message.substring(0, 60) + '...' 
    : message;

  toast.custom(
    (t) => (
      <div
        className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200"
        onClick={() => {
          onClick?.();
          toast.dismiss(t);
        }}
      >
        {/* Icono */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <FiMessageCircle className="w-5 h-5 text-white" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {senderName}
              </p>
              {ticketNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ticket {ticketNumber}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {truncatedMessage}
          </p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-right'
    }
  );
};

// Componente para solicitar permisos de notificación
export const NotificationPermissionBanner = ({ onRequestPermission }: { onRequestPermission: () => void }) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiMessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Habilita las notificaciones
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Recibe alertas cuando lleguen nuevos mensajes
            </p>
          </div>
        </div>
        <button
          onClick={onRequestPermission}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Habilitar
        </button>
      </div>
    </div>
  );
};
