import fs from 'fs';
import path from 'path';
import { TicketStatus } from '@prisma/client';
import logger from '../config/logger';
import prisma from '../config/database';

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
   * Limpiar archivos de images/documents que ya no se necesitan.
   * - Archivos de tickets: solo se eliminan cuando TODOS los tickets que los usan están
   *   resueltos/cerrados/cancelados y pasaron `daysAfterClosure` días desde su cierre/resolución.
   * - Archivos de branding: nunca se eliminan.
   * - Archivos sin ninguna referencia: se eliminan si tienen más de `daysAfterClosure` días.
   * @param daysAfterClosure - Días después del cierre/resolución del ticket para eliminar sus archivos
   */
  async cleanupOrphanFiles(daysAfterClosure: number = 60): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      spaceFreed: 0,
      errors: 0
    };

    try {
      const now = Date.now();
      const maxAge = daysAfterClosure * 24 * 60 * 60 * 1000;

      // Si falla la consulta a BD se aborta sin eliminar nada
      const references = await this.buildFileReferences();

      const imagesDir = path.join(this.uploadsDir, 'images');
      if (fs.existsSync(imagesDir)) {
        await this.cleanDirectoryRecursive(imagesDir, now, maxAge, references, stats);
      }

      const documentsDir = path.join(this.uploadsDir, 'documents');
      if (fs.existsSync(documentsDir)) {
        await this.cleanDirectoryRecursive(documentsDir, now, maxAge, references, stats);
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
   * Construir mapa de archivos referenciados en BD.
   * Valor: null = archivo en uso (no eliminar); número = fecha (ms) desde la que puede contarse el plazo.
   */
  private async buildFileReferences(): Promise<Map<string, number | null>> {
    const references = new Map<string, number | null>();
    const filePattern = /uploads\/(?:images|documents)\/[^"'\s?#)\\]+/g;

    const register = (source: string | null | undefined, finishedAt: number | null) => {
      if (!source) return;
      for (const match of source.matchAll(filePattern)) {
        const filePath = match[0];
        const current = references.get(filePath);
        if (current === null) continue;
        if (finishedAt === null) {
          references.set(filePath, null);
        } else {
          references.set(filePath, Math.max(current ?? 0, finishedAt));
        }
      }
    };

    const branding = await prisma.brandingConfig.findMany({
      select: { logoUrl: true, logoSmallUrl: true, loginBgImageUrl: true }
    });
    for (const config of branding) {
      register(config.logoUrl, null);
      register(config.logoSmallUrl, null);
      register(config.loginBgImageUrl, null);
    }

    const finishedStatuses: TicketStatus[] = [
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
      TicketStatus.CANCELLED
    ];

    const tickets = await prisma.ticket.findMany({
      select: {
        status: true,
        formData: true,
        resolvedAt: true,
        closedAt: true,
        updatedAt: true,
        deletedAt: true,
        messages: { select: { attachmentUrl: true }, where: { attachmentUrl: { not: null } } },
        deliverables: { select: { fileUrl: true, files: { select: { fileUrl: true } } } }
      }
    });

    for (const ticket of tickets) {
      let finishedAt: number | null = null;

      if (finishedStatuses.includes(ticket.status)) {
        const dates = [ticket.closedAt, ticket.resolvedAt]
          .filter((d): d is Date => d !== null)
          .map(d => d.getTime());
        finishedAt = dates.length > 0
          ? Math.max(...dates)
          : ticket.updatedAt.getTime();
      } else if (ticket.deletedAt) {
        finishedAt = ticket.deletedAt.getTime();
      }

      register(JSON.stringify(ticket.formData), finishedAt);
      ticket.messages.forEach(m => register(m.attachmentUrl, finishedAt));
      ticket.deliverables.forEach(d => {
        register(d.fileUrl, finishedAt);
        d.files.forEach(f => register(f.fileUrl, finishedAt));
      });
    }

    return references;
  }

  /**
   * Buscar referencia de un archivo (o de su imagen original si es un thumbnail)
   */
  private getFileReference(
    filePath: string,
    references: Map<string, number | null>
  ): number | null | undefined {
    if (references.has(filePath)) {
      return references.get(filePath);
    }

    const originalPath = filePath.replace(/-thumb(\.[^./]+)$/, '$1');
    if (originalPath !== filePath && references.has(originalPath)) {
      return references.get(originalPath);
    }

    return undefined;
  }

  /**
   * Limpiar directorio recursivamente respetando las referencias de BD
   */
  private async cleanDirectoryRecursive(
    dirPath: string,
    now: number,
    maxAge: number,
    references: Map<string, number | null>,
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
          await this.cleanDirectoryRecursive(itemPath, now, maxAge, references, stats);
        } else {
          stats.filesScanned++;

          const reference = this.getFileReference(itemPath.replace(/\\/g, '/'), references);

          // En uso por un ticket abierto o por el branding
          if (reference === null) {
            continue;
          }

          // Referenciado: contar desde el cierre/resolución. Sin referencia: desde la subida.
          const referenceDate = reference === undefined ? itemStats.mtimeMs : reference;

          if (now - referenceDate > maxAge) {
            const fileSize = itemStats.size;
            fs.unlinkSync(itemPath);
            stats.filesDeleted++;
            stats.spaceFreed += fileSize;
            const reason = reference === undefined ? 'sin referencia' : 'ticket cerrado/resuelto';
            logger.info(`Archivo eliminado (${reason}): ${itemPath} (${this.formatBytes(fileSize)})`);
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
