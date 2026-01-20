import api from './api';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
  thumbnailUrl?: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: UploadedFile;
}

export interface MultipleUploadResponse {
  success: boolean;
  message: string;
  data: UploadedFile[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class UploadService {
  /**
   * Subir un solo archivo
   */
  async uploadSingle(
    file: File,
    options?: {
      processImage?: boolean;
      createThumbnail?: boolean;
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.processImage !== undefined) {
      formData.append('processImage', String(options.processImage));
    }
    
    if (options?.createThumbnail !== undefined) {
      formData.append('createThumbnail', String(options.createThumbnail));
    }

    const token = localStorage.getItem('accessToken');
    
    const response = await axios.post<UploadResponse>(
      `${API_BASE_URL}/api/upload/single`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            });
          }
        }
      }
    );

    return response.data.data;
  }

  /**
   * Subir múltiples archivos
   */
  async uploadMultiple(
    files: File[],
    options?: {
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    const token = localStorage.getItem('accessToken');
    
    const response = await axios.post<MultipleUploadResponse>(
      `${API_BASE_URL}/api/upload/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          if (options?.onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            options.onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            });
          }
        }
      }
    );

    return response.data.data;
  }

  /**
   * Eliminar un archivo
   */
  async deleteFile(filePath: string): Promise<void> {
    await api.delete('/api/upload', {
      data: { filePath }
    });
  }

  /**
   * Validar tipo de archivo
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  /**
   * Validar tamaño de archivo
   */
  validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verificar si es imagen
   */
  isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Obtener preview de imagen
   */
  getImagePreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Error al leer el archivo'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export default new UploadService();
