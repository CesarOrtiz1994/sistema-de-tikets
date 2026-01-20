import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

interface UploadedFileInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url: string;
}

class UploadService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Procesar y optimizar imagen
   */
  async processImage(
    filePath: string,
    options: ProcessImageOptions = {}
  ): Promise<string> {
    try {
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 80,
        format = 'jpeg'
      } = options;

      const processedPath = filePath.replace(
        path.extname(filePath),
        `-processed.${format}`
      );

      await sharp(filePath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat(format, { quality })
        .toFile(processedPath);

      // Eliminar archivo original
      fs.unlinkSync(filePath);

      logger.info(`Imagen procesada: ${processedPath}`);
      return processedPath;
    } catch (error) {
      logger.error('Error procesando imagen:', error);
      throw new Error('Error al procesar la imagen');
    }
  }

  /**
   * Crear thumbnail de imagen
   */
  async createThumbnail(
    filePath: string,
    width: number = 200,
    height: number = 200
  ): Promise<string> {
    try {
      const ext = path.extname(filePath);
      const thumbnailPath = filePath.replace(ext, `-thumb${ext}`);

      await sharp(filePath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .toFile(thumbnailPath);

      logger.info(`Thumbnail creado: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      logger.error('Error creando thumbnail:', error);
      throw new Error('Error al crear thumbnail');
    }
  }

  /**
   * Obtener información del archivo subido
   */
  getFileInfo(file: Express.Multer.File): UploadedFileInfo {
    const relativePath = file.path.replace(/\\/g, '/');
    const url = `${this.baseUrl}/${relativePath}`;

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: relativePath,
      url
    };
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Archivo eliminado: ${filePath}`);
      }

      // Intentar eliminar thumbnail si existe
      const ext = path.extname(filePath);
      const thumbnailPath = filePath.replace(ext, `-thumb${ext}`);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
        logger.info(`Thumbnail eliminado: ${thumbnailPath}`);
      }
    } catch (error) {
      logger.error('Error eliminando archivo:', error);
      throw new Error('Error al eliminar archivo');
    }
  }

  /**
   * Validar y limpiar archivos temporales antiguos
   */
  async cleanupOldFiles(directory: string, daysOld: number = 7): Promise<void> {
    try {
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          logger.info(`Archivo antiguo eliminado: ${filePath}`);
        }
      }
    } catch (error) {
      logger.error('Error limpiando archivos antiguos:', error);
    }
  }
}

export default new UploadService();
