import { Request, Response } from 'express';
import fileCleanupJob from '../jobs/fileCleanup.job';
import fileCleanupService from '../services/fileCleanup.service';
import logger from '../config/logger';

class FileCleanupController {
  /**
   * Ejecutar limpieza manual
   */
  async runManualCleanup(_req: Request, res: Response) {
    try {
      logger.info('Limpieza manual solicitada por usuario');
      
      const result = await fileCleanupJob.runManualCleanup();

      return res.status(200).json({
        success: true,
        message: 'Limpieza manual completada',
        data: result
      });
    } catch (error: any) {
      logger.error('Error en limpieza manual:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al ejecutar limpieza manual'
      });
    }
  }

  /**
   * Obtener estadísticas de almacenamiento
   */
  async getStorageStats(_req: Request, res: Response) {
    try {
      const stats = await fileCleanupService.getStorageStats();

      return res.status(200).json({
        success: true,
        message: 'Estadísticas obtenidas',
        data: stats
      });
    } catch (error: any) {
      logger.error('Error obteniendo estadísticas:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Limpiar archivos temporales
   */
  async cleanupTempFiles(req: Request, res: Response) {
    try {
      const { daysOld = 1 } = req.body;
      
      const stats = await fileCleanupService.cleanupTempFiles(daysOld);

      return res.status(200).json({
        success: true,
        message: 'Archivos temporales limpiados',
        data: stats
      });
    } catch (error: any) {
      logger.error('Error limpiando archivos temporales:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al limpiar archivos temporales'
      });
    }
  }

  /**
   * Limpiar archivos huérfanos
   */
  async cleanupOrphanFiles(req: Request, res: Response) {
    try {
      const { daysOld = 30 } = req.body;
      
      const stats = await fileCleanupService.cleanupOrphanFiles(daysOld);

      return res.status(200).json({
        success: true,
        message: 'Archivos huérfanos limpiados',
        data: stats
      });
    } catch (error: any) {
      logger.error('Error limpiando archivos huérfanos:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al limpiar archivos huérfanos'
      });
    }
  }
}

export default new FileCleanupController();
