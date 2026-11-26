import { useState, useImperativeHandle, forwardRef } from 'react';
import { FiUpload, FiFile, FiX, FiAlertCircle, FiPlus } from 'react-icons/fi';
import { toast } from 'sonner';
import { deliverablesService } from '../../services/deliverables.service';
import { compressImage, isCompressibleImage, formatFileSize } from '../../utils/imageCompression';
import Card from '../common/Card';
import ModalButtons from '../common/ModalButtons';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 50;

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

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const DeliverableUpload = forwardRef<DeliverableUploadHandle, DeliverableUploadProps>(({
  ticketId,
  onUploadSuccess,
  onCancel,
  hideButtons = false,
  onFileChange,
  onUploadingChange
}, ref) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useImperativeHandle(ref, () => ({
    upload: handleUpload,
    hasFile: selectedFiles.length > 0,
    isUploading: uploading
  }), [selectedFiles, uploading]);

  const updateFiles = (files: File[]) => {
    setSelectedFiles(files);
    onFileChange?.(files.length > 0);
  };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const existingKeys = new Set(selectedFiles.map(fileKey));
    const next = [...selectedFiles];

    for (const file of Array.from(incoming)) {
      if (existingKeys.has(fileKey(file))) continue;
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" supera el máximo de ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        toast.error(`Puedes subir máximo ${MAX_FILES} archivos por entregable`);
        break;
      }
      next.push(file);
      existingKeys.add(fileKey(file));
    }

    updateFiles(next);
  };

  const removeFile = (index: number) => {
    updateFiles(selectedFiles.filter((_, i) => i !== index));
  };

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
    if (uploading) return;
    addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    // Permite volver a seleccionar el mismo archivo después de quitarlo
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Por favor selecciona al menos un archivo');
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);
    try {
      const filesToUpload = await Promise.all(
        selectedFiles.map(file => (isCompressibleImage(file) ? compressImage(file) : file))
      );
      await deliverablesService.uploadDeliverable(ticketId, filesToUpload);
      toast.success(
        filesToUpload.length > 1
          ? `Entregable con ${filesToUpload.length} archivos subido exitosamente`
          : 'Entregable subido exitosamente'
      );
      onUploadSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.status === 413
        ? 'Los archivos superan el tamaño total permitido por el servidor. Intenta con menos archivos o archivos más ligeros.'
        : error.response?.data?.error || 'Error al subir el entregable';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="space-y-4">
      {/* Información importante */}
      <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <FiAlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Entregable Requerido</p>
            <p>
              Este departamento requiere que subas el entregable al resolver el ticket. Puedes adjuntar
              uno o varios archivos; el solicitante revisará el entregable completo y podrá aprobarlo o rechazarlo.
            </p>
          </div>
        </div>
      </Card>

      {/* Zona de carga */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />

        {selectedFiles.length === 0 ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FiUpload className="w-12 h-12 text-gray-400" />
            </div>
            <div>
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Selecciona archivos
              </label>
              <span className="text-gray-600 dark:text-gray-400"> o arrastra y suelta</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hasta {MAX_FILES} archivos, máximo {MAX_FILE_SIZE_MB}MB cada uno
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <li
                  key={fileKey(file)}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <FiFile className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-gray-900 dark:text-white truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    disabled={uploading}
                    title="Quitar archivo"
                  >
                    <FiX className="w-5 h-5 text-gray-500" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {selectedFiles.length} de {MAX_FILES} archivos • {formatFileSize(totalSize)}
              </span>
              {selectedFiles.length < MAX_FILES && (
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer font-medium"
                >
                  <FiPlus className="w-4 h-4" />
                  Agregar más archivos
                </label>
              )}
            </div>
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
            confirmDisabled={selectedFiles.length === 0}
            variant="success"
          />
        </div>
      )}
    </div>
  );
});

DeliverableUpload.displayName = 'DeliverableUpload';
export default DeliverableUpload;
