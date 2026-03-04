/**
 * Utilidad para comprimir imágenes en el cliente antes de subirlas al servidor
 * Reduce el uso de ancho de banda y mejora la velocidad de carga
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  maxSizeMB: 2
};

/**
 * Comprime una imagen en el navegador
 * @param file Archivo de imagen a comprimir
 * @param options Opciones de compresión
 * @returns Promise con el archivo comprimido
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Solo comprimir imágenes
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // No comprimir SVG (son vectoriales)
  if (file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calcular nuevas dimensiones manteniendo aspect ratio
          let { width, height } = img;
          
          if (width > opts.maxWidth) {
            height = (height * opts.maxWidth) / width;
            width = opts.maxWidth;
          }
          
          if (height > opts.maxHeight) {
            width = (width * opts.maxHeight) / height;
            height = opts.maxHeight;
          }

          // Crear canvas para redimensionar
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Determinar formato de salida: preservar PNG para transparencia
          const isPng = file.type === 'image/png';
          const outputType = isPng ? 'image/png' : 'image/jpeg';
          const outputExt = isPng ? '.png' : '.jpg';

          // Convertir a blob con compresión
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Error al comprimir la imagen'));
                return;
              }

              // Verificar si la compresión redujo el tamaño
              if (blob.size >= file.size) {
                // Si el archivo comprimido es más grande, usar el original
                resolve(file);
                return;
              }

              // Crear nuevo archivo con el blob comprimido
              const compressedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, outputExt),
                {
                  type: outputType,
                  lastModified: Date.now()
                }
              );

              resolve(compressedFile);
            },
            outputType,
            isPng ? undefined : opts.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Verifica si un archivo es una imagen comprimible
 */
export function isCompressibleImage(file: File): boolean {
  const compressibleTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  return compressibleTypes.includes(file.type);
}

/**
 * Formatea el tamaño de archivo en formato legible
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
