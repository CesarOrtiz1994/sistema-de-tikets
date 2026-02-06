import { useEffect, useState } from 'react';
import { FiWifi, FiWifiOff, FiAlertCircle } from 'react-icons/fi';

interface ConnectionStatusBannerProps {
  isConnected: boolean;
  reconnectAttempts?: number;
}

export default function ConnectionStatusBanner({ isConnected, reconnectAttempts = 0 }: ConnectionStatusBannerProps) {
  const [showConnected, setShowConnected] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setWasDisconnected(true);
    } else if (wasDisconnected) {
      // Mostrar mensaje de "Conectado" brevemente después de reconectar
      setShowConnected(true);
      const timer = setTimeout(() => {
        setShowConnected(false);
        setWasDisconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, wasDisconnected]);

  // No mostrar nada si está conectado y no acabamos de reconectar
  if (isConnected && !showConnected) {
    return null;
  }

  // Mensaje de reconectado exitosamente
  if (isConnected && showConnected) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
        <div className="px-4 py-2 flex items-center gap-2">
          <FiWifi className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
          <span className="text-sm font-medium text-green-800 dark:text-green-300">
            Conectado
          </span>
        </div>
      </div>
    );
  }

  // Mensaje de desconectado/reconectando
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="px-4 py-2 flex items-center gap-2">
        {reconnectAttempts > 0 ? (
          <>
            <FiAlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Reconectando... (intento {reconnectAttempts})
            </span>
          </>
        ) : (
          <>
            <FiWifiOff className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Conexión perdida. Intentando reconectar...
            </span>
          </>
        )}
      </div>
    </div>
  );
}
