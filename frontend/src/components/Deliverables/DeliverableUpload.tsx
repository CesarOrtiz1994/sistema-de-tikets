import { useState, useImperativeHandle, forwardRef } from 'react';
import { FiUpload, FiFile, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'sonner';
import { deliverablesService } from '../../services/deliverables.service';
import { compressImage, isCompressibleImage } from '../../utils/imageCompression';
import Card from '../common/Card';
import ModalButtons from '../common/ModalButtons';

export interface DeliverableUploadHandle {
  upload: () => Promise<void>;
  hasFile: boolean;
  isUploading: boolean;
}

interface DeliverableUploadProps {
  ticketId: string;
  onUploadSuccess: () => void;
  onCancel?: () => void;
  hideButtons?: boolean;
  onFileChange?: (hasFile: boolean) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

const DeliverableUpload = forwardRef<DeliverableUploadHandle, DeliverableUploadProps>(({
  ticketId,
  onUploadSuccess,
  onCancel,
  hideButtons = false,
  onFileChange,
  onUploadingChange
}, ref) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useImperativeHandle(ref, () => ({
    upload: handleUpload,
    hasFile: !!selectedFile,
    isUploading: uploading
  }), [selectedFile, uploading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      onFileChange?.(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      onFileChange?.(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    try {
      let fileToUpload = selectedFile;
      if (isCompressibleImage(selectedFile)) {
        toast.info('Comprimiendo imagen...');
        fileToUpload = await compressImage(selectedFile);
      }
      await deliverablesService.uploadDeliverable(ticketId, fileToUpload);
      toast.success('Entregable subido exitosamente');
      onUploadSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al subir el entregable';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Información importante */}
      <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Entregable Requerido</p>
            <p>
              Este departamento requiere que subas un archivo entregable al resolver el ticket.
              El solicitante revisará el archivo y podrá aprobarlo o rechazarlo.
            </p>
          </div>
        </div>
      </Card>

      {/* Zona de carga */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FiUpload className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Selecciona un archivo
              </label>
              <span className="text-gray-600 dark:text-gray-400"> o arrastra y suelta</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Máximo 100MB
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <FiFile className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                disabled={uploading}
              >
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <label
              htmlFor="file-upload"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
            >
              Cambiar archivo
            </label>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      {!hideButtons && (
        <div className="flex justify-end gap-3">
          <ModalButtons
            onCancel={onCancel || (() => {})}
            onConfirm={handleUpload}
            cancelText="Cancelar"
            confirmText="Subir Entregable"
            confirmIcon={<FiUpload className="w-4 h-4" />}
            loading={uploading}
            confirmDisabled={!selectedFile}
            variant="success"
          />
        </div>
      )}
    </div>
  );
});

DeliverableUpload.displayName = 'DeliverableUpload';
export default DeliverableUpload;
