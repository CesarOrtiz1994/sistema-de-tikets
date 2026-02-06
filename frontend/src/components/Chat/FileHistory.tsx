import { useState, useEffect } from 'react';
import { ticketAttachmentsService, TicketAttachment, AttachmentStats } from '../../services/ticketAttachments.service';
import { toast } from 'sonner';

interface FileHistoryProps {
  ticketId: string;
}

export default function FileHistory({ ticketId }: FileHistoryProps) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [stats, setStats] = useState<AttachmentStats | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    loadAttachments();
    loadStats();
  }, [ticketId, selectedType]);

  const loadAttachments = async () => {
    setIsLoading(true);
    try {
      const type = selectedType === 'all' ? undefined : selectedType;
      const { attachments: data } = await ticketAttachmentsService.getAttachments(ticketId, type);
      setAttachments(data);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('Error al cargar archivos adjuntos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await ticketAttachmentsService.getStats(ticketId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getFullFileUrl = (url: string): string => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${API_URL}${url}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isImage = (type: string) => type.startsWith('image/');

  const handleDownload = (attachment: TicketAttachment) => {
    const link = document.createElement('a');
    link.href = getFullFileUrl(attachment.attachmentUrl);
    link.download = attachment.attachmentName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterButtons = [
    { value: 'all', label: 'Todos', icon: '📁', count: stats?.totalCount || 0 },
    { value: 'image', label: 'Imágenes', icon: '🖼️', count: stats?.categories.images || 0 },
    { value: 'document', label: 'Documentos', icon: '📄', count: stats?.categories.documents || 0 },
    { value: 'video', label: 'Videos', icon: '🎥', count: stats?.categories.videos || 0 },
    { value: 'audio', label: 'Audio', icon: '🎵', count: stats?.categories.audio || 0 },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header con estadísticas */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Archivos Adjuntos
        </h3>
        {stats && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.totalCount} archivo{stats.totalCount !== 1 ? 's' : ''} • {formatFileSize(stats.totalSize)}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex gap-2 overflow-x-auto">
          {filterButtons.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedType(filter.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
              {filter.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  selectedType === filter.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}>
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de archivos */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : attachments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-lg font-medium">No hay archivos adjuntos</p>
            <p className="text-sm">Los archivos compartidos en el chat aparecerán aquí</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Preview */}
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {isImage(attachment.attachmentType) ? (
                    <img
                      src={getFullFileUrl(attachment.attachmentUrl)}
                      alt={attachment.attachmentName}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setPreviewImage({
                        url: getFullFileUrl(attachment.attachmentUrl),
                        name: attachment.attachmentName
                      })}
                    />
                  ) : (
                    <div className="text-5xl">
                      {attachment.attachmentType.startsWith('application/pdf') ? '📄' :
                       attachment.attachmentType.startsWith('video/') ? '🎥' :
                       attachment.attachmentType.startsWith('audio/') ? '🎵' : '📎'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={attachment.attachmentName}>
                    {attachment.attachmentName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.attachmentSize)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {attachment.user.name}
                  </p>
                </div>

                {/* Botón de descarga */}
                <button
                  onClick={() => handleDownload(attachment)}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Descargar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de preview de imagen */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕ Cerrar
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <p className="text-white text-center mt-4">{previewImage.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
