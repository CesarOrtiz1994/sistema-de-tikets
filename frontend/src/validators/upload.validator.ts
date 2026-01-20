import { z } from 'zod';

// Tipos de archivo permitidos
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/csv'
];

export const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// Tamaños máximos
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Schema para validar archivo individual
export const fileSchema = z.custom<File>((file) => {
  if (!(file instanceof File)) {
    return false;
  }
  
  // Validar tipo
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return false;
  }
  
  // Validar tamaño según tipo
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
}, {
  message: 'Archivo no válido. Verifica el tipo y tamaño.'
});

// Schema para validar múltiples archivos
export const filesSchema = z.array(fileSchema).max(10, {
  message: 'Máximo 10 archivos permitidos'
});

// Función para validar archivo con mensajes personalizados
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Validar tipo
  if (!ALL_ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido: ${file.type}`
    };
  }
  
  // Validar tamaño según tipo
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  const maxSizeMB = maxSize / 1024 / 1024;
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${maxSizeMB}MB`
    };
  }
  
  return { valid: true };
}

// Función para validar múltiples archivos
export function validateFiles(files: File[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (files.length > 10) {
    errors.push('Máximo 10 archivos permitidos');
    return { valid: false, errors };
  }
  
  files.forEach((file, index) => {
    const result = validateFile(file);
    if (!result.valid && result.error) {
      errors.push(`Archivo ${index + 1} (${file.name}): ${result.error}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
