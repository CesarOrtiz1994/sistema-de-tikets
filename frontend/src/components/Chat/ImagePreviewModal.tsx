import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiDownload } from 'react-icons/fi';

interface ImagePreviewModalProps {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}

export default function ImagePreviewModal({ imageUrl, imageName, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Guardar el valor original del overflow
    const originalOverflow = document.body.style.overflow;
    
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restaurar el valor original
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      // Fetch la imagen para evitar problemas de CORS
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Crear URL temporal del blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Crear link de descarga
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = imageName;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback: intentar descarga directa
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full mx-4">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
          <h3 className="text-white font-medium truncate pr-4">{imageName}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Descargar imagen"
            >
              <FiDownload className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Cerrar (Esc)"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-center h-full">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Footer hint */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-white/60 text-sm">
            Presiona <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> o el botón <kbd className="px-2 py-1 bg-white/10 rounded">✕</kbd> para cerrar
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
