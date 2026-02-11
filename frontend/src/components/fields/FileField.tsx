import { useState, useRef, DragEvent } from 'react';
import { FiUpload, FiX, FiFile, FiImage, FiCheckCircle } from 'react-icons/fi';
import { FileFieldProps } from '../../types/fieldTypes';
import uploadService, { UploadedFile, UploadProgress } from '../../services/upload.service';
import { compressImage, isCompressibleImage } from '../../utils/imageCompression';
import ProgressBar from '../common/ProgressBar';
import ValidationError from '../common/ValidationError';

export default function FileField({
  id,
  name,
  label,
  helpText,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  fieldType,
  className = ''
}: FileFieldProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    await processFiles(selectedFiles);
  };

  const processFiles = async (selectedFiles: File[]) => {
    setValidationErrors([]);
    const errors: string[] = [];

    // Validar cantidad
    if (maxFiles && selectedFiles.length > maxFiles) {
      errors.push(`Solo puedes subir un máximo de ${maxFiles} archivo(s)`);
      setValidationErrors(errors);
      return;
    }

    // Validar cada archivo
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      // Validación estricta por tipo de campo
      const fileTypeValidation = validateFileTypeByField(file, fieldType);
      if (!fileTypeValidation.valid) {
        errors.push(`${file.name}: ${fileTypeValidation.error}`);
        continue;
      }

      // Validar tipo de archivo según accept
      if (accept && accept !== '*/*') {
        const isValid = validateFileType(file, accept);
        if (!isValid) {
          const acceptedFormats = accept.split(',').map(t => t.trim()).join(', ');
          errors.push(`${file.name}: Tipo de archivo no permitido. Solo se aceptan estos formatos: ${acceptedFormats}`);
          continue;
        }
      }

      // Validar tamaño
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        errors.push(`${file.name}: El archivo excede el tamaño máximo de ${maxSizeMB} MB`);
        continue;
      }

      validFiles.push(file);
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setFiles(validFiles);

    // Generar previews para imágenes
    const newPreviews: { [key: string]: string } = {};
    for (const file of validFiles) {
      if (uploadService.isImage(file)) {
        try {
          const preview = await uploadService.getImagePreview(file);
          newPreviews[file.name] = preview;
        } catch (error) {
          console.error('Error generando preview:', error);
        }
      }
    }
    setPreviews(prev => ({ ...prev, ...newPreviews }));

    // Subir archivos automáticamente
    await uploadFiles(validFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    setUploading(true);
    const uploaded: UploadedFile[] = [];

    for (let file of filesToUpload) {
      try {
        // Comprimir imágenes antes de subir
        if (isCompressibleImage(file)) {
          try {
            file = await compressImage(file);
          } catch {
            // Si falla la compresión, subir el original
          }
        }
        const isImage = uploadService.isImage(file);
        const uploadedFile = await uploadService.uploadSingle(file, {
          processImage: isImage,
          createThumbnail: isImage,
          onProgress: (progress: UploadProgress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress.percentage
            }));
          }
        });
        uploaded.push(uploadedFile);
      } catch (error: any) {
        console.error('Error subiendo archivo:', error);
        setValidationErrors(prev => [...prev, `Error al subir ${file.name}`]);
      }
    }

    setUploadedFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
    
    // Notificar cambio al formulario - SIEMPRE enviar array
    const allUploadedFiles = [...uploadedFiles, ...uploaded];
    onChange?.(allUploadedFiles);
  };

  const removeFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];
    
    if (fileToRemove) {
      try {
        await uploadService.deleteFile(fileToRemove.path);
      } catch (error) {
        console.error('Error eliminando archivo:', error);
      }
    }

    const newUploadedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newUploadedFiles);
    // SIEMPRE enviar array
    onChange?.(newUploadedFiles);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  };

  // Función para validar tipo de archivo según el tipo de campo
  const validateFileTypeByField = (file: File, fieldType?: string): { valid: boolean; error?: string } => {
    const mimeType = file.type.toLowerCase();
    const isImage = mimeType.startsWith('image/');

    switch (fieldType) {
      case 'IMAGE':
        if (!isImage) {
          return {
            valid: false,
            error: 'Solo se permiten imágenes en este campo'
          };
        }
        break;
      
      case 'FILE':
        if (isImage) {
          return {
            valid: false,
            error: 'Este campo solo acepta documentos, no imágenes'
          };
        }
        break;
      
      case 'MULTIFILE':
        // MULTIFILE acepta tanto imágenes como documentos
        break;
      
      default:
        // Si no se especifica fieldType, permitir todo
        break;
    }

    return { valid: true };
  };

  // Función para validar tipo de archivo según extensiones permitidas
  const validateFileType = (file: File, acceptString: string): boolean => {
    if (!acceptString || acceptString === '*/*') return true;

    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    const mimeType = file.type.toLowerCase();

    // Dividir el string de accept en partes
    const acceptedTypes = acceptString.toLowerCase().split(',').map(t => t.trim());

    for (const acceptedType of acceptedTypes) {
      // Verificar por extensión (.jpg, .png, etc.)
      if (acceptedType.startsWith('.')) {
        if (fileExtension === acceptedType) {
          return true;
        }
      }
      // Verificar por MIME type (image/*, image/jpeg, etc.)
      else if (acceptedType.includes('*')) {
        const [mainType] = acceptedType.split('/');
        const [fileMimeMain] = mimeType.split('/');
        if (mainType === fileMimeMain) {
          return true;
        }
      }
      // Verificar MIME type exacto
      else if (mimeType === acceptedType) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={id || name} 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div 
        className={`
          border-2 border-dashed rounded-lg p-6
          transition-all duration-200
          ${error || validationErrors.length > 0 ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'hover:border-purple-500 dark:hover:border-purple-500'}
          ${isDragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 scale-105' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id={id || name}
          name={name}
          type="file"
          onChange={handleFileChange}
          onBlur={onBlur}
          disabled={disabled || uploading}
          required={required}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        
        <label
          htmlFor={id || name}
          className={`flex flex-col items-center justify-center ${disabled || uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FiUpload className={`w-8 h-8 mb-2 ${isDragging ? 'text-purple-500' : 'text-gray-400 dark:text-gray-500'}`} />
          <span className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {isDragging 
              ? 'Suelta los archivos aquí' 
              : multiple 
                ? 'Haz clic o arrastra archivos aquí' 
                : 'Haz clic o arrastra un archivo aquí'
            }
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {fieldType?.toUpperCase() === 'IMAGE' 
              ? 'Solo imágenes' 
              : fieldType?.toUpperCase() === 'FILE' 
                ? 'Solo documentos' 
                : fieldType?.toUpperCase() === 'MULTIFILE'
                  ? 'Imágenes y documentos'
                  : accept 
                    ? `Tipos: ${accept}` 
                    : 'Todos los archivos'}
          </span>
          {maxSize && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              Tamaño máximo: {(maxSize / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </label>
      </div>

      {/* Archivos en proceso de subida */}
      {files.length > 0 && uploading && (
        <div className="space-y-3 mt-4">
          {files.map((file, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                {uploadService.isImage(file) && previews[file.name] ? (
                  <img 
                    src={previews[file.name]} 
                    alt={file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <FiFile className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {uploadService.formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              {uploadProgress[file.name] !== undefined && (
                <ProgressBar 
                  percentage={uploadProgress[file.name]} 
                  showLabel={true}
                  animated={true}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archivos subidos exitosamente */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Archivos subidos ({uploadedFiles.length})
          </p>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {file.thumbnailUrl ? (
                  <img 
                    src={file.thumbnailUrl} 
                    alt={file.originalName}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : uploadService.isImage({ type: file.mimetype } as File) ? (
                  <FiImage className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <FiFile className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {uploadService.formatFileSize(file.size)}
                  </p>
                </div>
                <FiCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50 flex-shrink-0"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {helpText && !error && validationErrors.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{helpText}</p>
      )}
      
      {error && (
        <ValidationError message={error} className="mt-2" />
      )}

      {validationErrors.length > 0 && (
        <div className="mt-2 space-y-1">
          {validationErrors.map((err, idx) => (
            <ValidationError key={idx} message={err} />
          ))}
        </div>
      )}
    </div>
  );
}
