import * as cron from 'node-cron';
import fileCleanupService from '../services/fileCleanup.service';
import logger from '../config/logger';

class FileCleanupJob {
  private tempFilesJob: cron.ScheduledTask | null = null;
  private orphanFilesJob: cron.ScheduledTask | null = null;
  private emptyDirsJob: cron.ScheduledTask | null = null;
  private storageStatsJob: cron.ScheduledTask | null = null;

  /**
   * Iniciar todos los jobs de limpieza
   */
  start() {
    logger.info('Iniciando jobs de limpieza de archivos...');

    // Job 1: Limpiar archivos temporales cada hora
    this.tempFilesJob = cron.schedule('0 * * * *', async () => {
      logger.info('Ejecutando limpieza de archivos temporales...');
      try {
        const stats = await fileCleanupService.cleanupTempFiles(1); // Archivos de más de 1 día
        logger.info(`Limpieza de temp completada: ${stats.filesDeleted} archivos eliminados, ${this.formatBytes(stats.spaceFreed)} liberados`);
      } catch (error) {
        logger.error('Error en job de limpieza de archivos temporales:', error);
      }
    });

    // Job 2: Limpiar archivos huérfanos cada día a las 2 AM
    this.orphanFilesJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Ejecutando limpieza de archivos huérfanos...');
      try {
        const stats = await fileCleanupService.cleanupOrphanFiles(30); // Archivos de más de 30 días
        logger.info(`Limpieza de huérfanos completada: ${stats.filesDeleted} archivos eliminados, ${this.formatBytes(stats.spaceFreed)} liberados`);
      } catch (error) {
        logger.error('Error en job de limpieza de archivos huérfanos:', error);
      }
    });

    // Job 3: Limpiar directorios vacíos cada semana (domingos a las 3 AM)
    this.emptyDirsJob = cron.schedule('0 3 * * 0', async () => {
      logger.info('Ejecutando limpieza de directorios vacíos...');
      try {
        const removed = await fileCleanupService.cleanupEmptyDirectories();
        logger.info(`Limpieza de directorios completada: ${removed} directorios eliminados`);
      } catch (error) {
        logger.error('Error en job de limpieza de directorios vacíos:', error);
      }
    });

    // Job 4: Reportar estadísticas de almacenamiento cada día a las 6 AM
    this.storageStatsJob = cron.schedule('0 6 * * *', async () => {
      logger.info('Generando reporte de estadísticas de almacenamiento...');
      try {
        const stats = await fileCleanupService.getStorageStats();
        logger.info('=== ESTADÍSTICAS DE ALMACENAMIENTO ===');
        logger.info(`Total de archivos: ${stats.totalFiles}`);
        logger.info(`Tamaño total: ${this.formatBytes(stats.totalSize)}`);
        logger.info(`Imágenes: ${stats.imageFiles} archivos (${this.formatBytes(stats.imageSize)})`);
        logger.info(`Documentos: ${stats.documentFiles} archivos (${this.formatBytes(stats.documentSize)})`);
        logger.info(`Temporales: ${stats.tempFiles} archivos (${this.formatBytes(stats.tempSize)})`);
        logger.info('=====================================');
      } catch (error) {
        logger.error('Error generando estadísticas de almacenamiento:', error);
      }
    });

    logger.info('Jobs de limpieza iniciados:');
    logger.info('- Archivos temporales: cada hora');
    logger.info('- Archivos huérfanos: diario a las 2 AM');
    logger.info('- Directorios vacíos: domingos a las 3 AM');
    logger.info('- Estadísticas: diario a las 6 AM');
  }

  /**
   * Detener todos los jobs
   */
  stop() {
    logger.info('Deteniendo jobs de limpieza de archivos...');
    
    if (this.tempFilesJob) {
      this.tempFilesJob.stop();
      this.tempFilesJob = null;
    }
    
    if (this.orphanFilesJob) {
      this.orphanFilesJob.stop();
      this.orphanFilesJob = null;
    }
    
    if (this.emptyDirsJob) {
      this.emptyDirsJob.stop();
      this.emptyDirsJob = null;
    }
    
    if (this.storageStatsJob) {
      this.storageStatsJob.stop();
      this.storageStatsJob = null;
    }

    logger.info('Jobs de limpieza detenidos');
  }

  /**
   * Ejecutar limpieza manual inmediata
   */
  async runManualCleanup() {
    logger.info('Ejecutando limpieza manual...');
    
    try {
      // Limpiar archivos temporales
      const tempStats = await fileCleanupService.cleanupTempFiles(1);
      logger.info(`Temp: ${tempStats.filesDeleted} archivos eliminados`);

      // Limpiar archivos huérfanos
      const orphanStats = await fileCleanupService.cleanupOrphanFiles(30);
      logger.info(`Huérfanos: ${orphanStats.filesDeleted} archivos eliminados`);

      // Limpiar directorios vacíos
      const dirsRemoved = await fileCleanupService.cleanupEmptyDirectories();
      logger.info(`Directorios: ${dirsRemoved} eliminados`);

      // Obtener estadísticas
      const stats = await fileCleanupService.getStorageStats();
      
      logger.info('Limpieza manual completada');
      
      return {
        tempFiles: tempStats,
        orphanFiles: orphanStats,
        directoriesRemoved: dirsRemoved,
        storageStats: stats
      };
    } catch (error) {
      logger.error('Error en limpieza manual:', error);
      throw error;
    }
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

export default new FileCleanupJob();
