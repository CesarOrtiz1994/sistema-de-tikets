import { useState } from 'react';
import { FiUpload, FiX, FiFile } from 'react-icons/fi';
import { FileFieldProps } from '../../types/fieldTypes';

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
  className = ''
}: FileFieldProps) {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (maxFiles && selectedFiles.length > maxFiles) {
      alert(`Solo puedes subir un máximo de ${maxFiles} archivo(s)`);
      return;
    }

    if (maxSize) {
      const oversizedFiles = selectedFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        alert(`Algunos archivos exceden el tamaño máximo de ${maxSize / 1024 / 1024}MB`);
        return;
      }
    }

    setFiles(selectedFiles);
    onChange?.(multiple ? selectedFiles : selectedFiles[0]);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(multiple ? newFiles : newFiles[0]);
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
      
      <div className={`
        border-2 border-dashed rounded-lg p-6
        transition-colors
        ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
        ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'hover:border-purple-500 dark:hover:border-purple-500'}
      `}>
        <input
          id={id || name}
          name={name}
          type="file"
          onChange={handleFileChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          accept={accept}
          multiple={multiple}
          className="hidden"
        />
        
        <label
          htmlFor={id || name}
          className={`flex flex-col items-center justify-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FiUpload className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {multiple ? 'Haz clic para seleccionar archivos' : 'Haz clic para seleccionar un archivo'}
          </span>
          {maxSize && (
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Tamaño máximo: {maxSize / 1024 / 1024}MB
            </span>
          )}
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <FiFile className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50"
              >
                <FiX />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {helpText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
