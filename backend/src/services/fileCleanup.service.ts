import fs from 'fs';
import path from 'path';
import logger from '../config/logger';

export interface CleanupStats {
  filesScanned: number;
  filesDeleted: number;
  spaceFreed: number;
  errors: number;
}

class FileCleanupService {
  private uploadsDir = 'uploads';

  /**
   * Limpiar archivos temporales antiguos
   * @param daysOld - Días de antigüedad para considerar un archivo como huérfano
   */
  async cleanupTempFiles(daysOld: number = 1): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      spaceFreed: 0,
      errors: 0
    };

    const tempDir = path.join(this.uploadsDir, 'temp');
    
    if (!fs.existsSync(tempDir)) {
      logger.info('Directorio temp no existe, saltando limpieza');
      return stats;
    }

    try {
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      await this.cleanDirectory(tempDir, now, maxAge, stats);

      logger.info(`Limpieza de archivos temporales completada:`, stats);
    } catch (error) {
      logger.error('Error en limpieza de archivos temporales:', error);
      stats.errors++;
    }

    return stats;
  }

  /**
   * Limpiar archivos huérfanos (archivos sin referencia en BD)
   * @param daysOld - Días de antigüedad para considerar un archivo como huérfano
   */
  async cleanupOrphanFiles(daysOld: number = 200): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      spaceFreed: 0,
      errors: 0
    };

    try {
      const now = Date.now();
      const maxAge = daysOld * 24 * 60 * 60 * 1000;

      // Limpiar imágenes antiguas
      const imagesDir = path.join(this.uploadsDir, 'images');
      if (fs.existsSync(imagesDir)) {
        await this.cleanDirectoryRecursive(imagesDir, now, maxAge, stats);
      }

      // Limpiar documentos antiguos
      const documentsDir = path.join(this.uploadsDir, 'documents');
      if (fs.existsSync(documentsDir)) {
        await this.cleanDirectoryRecursive(documentsDir, now, maxAge, stats);
      }

      logger.info(`Limpieza de archivos huérfanos completada:`, stats);
    } catch (error) {
      logger.error('Error en limpieza de archivos huérfanos:', error);
      stats.errors++;
    }

    return stats;
  }

  /**
   * Limpiar directorios vacíos
   */
  async cleanupEmptyDirectories(): Promise<number> {
    let directoriesRemoved = 0;

    try {
      const imagesDir = path.join(this.uploadsDir, 'images');
      const documentsDir = path.join(this.uploadsDir, 'documents');

      if (fs.existsSync(imagesDir)) {
        directoriesRemoved += await this.removeEmptyDirectories(imagesDir);
      }

      if (fs.existsSync(documentsDir)) {
        directoriesRemoved += await this.removeEmptyDirectories(documentsDir);
      }

      logger.info(`Directorios vacíos eliminados: ${directoriesRemoved}`);
    } catch (error) {
      logger.error('Error limpiando directorios vacíos:', error);
    }

    return directoriesRemoved;
  }

  /**
   * Obtener estadísticas de uso de almacenamiento
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    imageFiles: number;
    imageSize: number;
    documentFiles: number;
    documentSize: number;
    tempFiles: number;
    tempSize: number;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      imageFiles: 0,
      imageSize: 0,
      documentFiles: 0,
      documentSize: 0,
      tempFiles: 0,
      tempSize: 0
    };

    try {
      // Estadísticas de imágenes
      const imagesDir = path.join(this.uploadsDir, 'images');
      if (fs.existsSync(imagesDir)) {
        const imageStats = await this.getDirectoryStats(imagesDir);
        stats.imageFiles = imageStats.files;
        stats.imageSize = imageStats.size;
      }

      // Estadísticas de documentos
      const documentsDir = path.join(this.uploadsDir, 'documents');
      if (fs.existsSync(documentsDir)) {
        const docStats = await this.getDirectoryStats(documentsDir);
        stats.documentFiles = docStats.files;
        stats.documentSize = docStats.size;
      }

      // Estadísticas de archivos temporales
      const tempDir = path.join(this.uploadsDir, 'temp');
      if (fs.existsSync(tempDir)) {
        const tempStats = await this.getDirectoryStats(tempDir);
        stats.tempFiles = tempStats.files;
        stats.tempSize = tempStats.size;
      }

      stats.totalFiles = stats.imageFiles + stats.documentFiles + stats.tempFiles;
      stats.totalSize = stats.imageSize + stats.documentSize + stats.tempSize;

      logger.info('Estadísticas de almacenamiento:', stats);
    } catch (error) {
      logger.error('Error obteniendo estadísticas de almacenamiento:', error);
    }

    return stats;
  }

  /**
   * Limpiar un directorio específico
   */
  private async cleanDirectory(
    dirPath: string,
    now: number,
    maxAge: number,
    stats: CleanupStats
  ): Promise<void> {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      
      try {
        const fileStats = fs.statSync(filePath);

        if (fileStats.isDirectory()) {
          await this.cleanDirectory(filePath, now, maxAge, stats);
          continue;
        }

        stats.filesScanned++;

        // Verificar si el archivo es antiguo
        if (now - fileStats.mtimeMs > maxAge) {
          const fileSize = fileStats.size;
          fs.unlinkSync(filePath);
          stats.filesDeleted++;
          stats.spaceFreed += fileSize;
          logger.info(`Archivo eliminado: ${filePath} (${this.formatBytes(fileSize)})`);
        }
      } catch (error) {
        logger.error(`Error procesando archivo ${filePath}:`, error);
        stats.errors++;
      }
    }
  }

  /**
   * Limpiar directorio recursivamente
   */
  private async cleanDirectoryRecursive(
    dirPath: string,
    now: number,
    maxAge: number,
    stats: CleanupStats
  ): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      try {
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          await this.cleanDirectoryRecursive(itemPath, now, maxAge, stats);
        } else {
          stats.filesScanned++;

          // Verificar si el archivo es antiguo
          if (now - itemStats.mtimeMs > maxAge) {
            const fileSize = itemStats.size;
            fs.unlinkSync(itemPath);
            stats.filesDeleted++;
            stats.spaceFreed += fileSize;
            logger.info(`Archivo huérfano eliminado: ${itemPath} (${this.formatBytes(fileSize)})`);
          }
        }
      } catch (error) {
        logger.error(`Error procesando ${itemPath}:`, error);
        stats.errors++;
      }
    }
  }

  /**
   * Eliminar directorios vacíos recursivamente
   */
  private async removeEmptyDirectories(dirPath: string): Promise<number> {
    let removed = 0;

    if (!fs.existsSync(dirPath)) {
      return removed;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      try {
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          removed += await this.removeEmptyDirectories(itemPath);
        }
      } catch (error) {
        logger.error(`Error procesando directorio ${itemPath}:`, error);
      }
    }

    // Verificar si el directorio está vacío después de procesar subdirectorios
    const remainingItems = fs.readdirSync(dirPath);
    if (remainingItems.length === 0 && dirPath !== this.uploadsDir) {
      try {
        fs.rmdirSync(dirPath);
        removed++;
        logger.info(`Directorio vacío eliminado: ${dirPath}`);
      } catch (error) {
        logger.error(`Error eliminando directorio vacío ${dirPath}:`, error);
      }
    }

    return removed;
  }

  /**
   * Obtener estadísticas de un directorio
   */
  private async getDirectoryStats(dirPath: string): Promise<{ files: number; size: number }> {
    let files = 0;
    let size = 0;

    if (!fs.existsSync(dirPath)) {
      return { files, size };
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      try {
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          const subStats = await this.getDirectoryStats(itemPath);
          files += subStats.files;
          size += subStats.size;
        } else {
          files++;
          size += itemStats.size;
        }
      } catch (error) {
        logger.error(`Error obteniendo stats de ${itemPath}:`, error);
      }
    }

    return { files, size };
  }

  /**
   * Formatear bytes a formato legible
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default new FileCleanupService();
