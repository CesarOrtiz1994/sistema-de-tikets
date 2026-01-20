import { Request, Response } from 'express';
import uploadService from '../services/upload.service';
import logger from '../config/logger';
import { ALLOWED_IMAGE_TYPES } from '../config/multer';

class UploadController {
  /**
   * Subir un solo archivo
   */
  async uploadSingle(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionó ningún archivo'
        });
      }

      const { processImage, createThumbnail } = req.body;
      let filePath = req.file.path;
      let thumbnailUrl = null;

      // Procesar imagen si se solicita y es una imagen
      if (processImage === 'true' && ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        filePath = await uploadService.processImage(filePath, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
          format: 'jpeg'
        });
      }

      // Crear thumbnail si se solicita y es una imagen
      if (createThumbnail === 'true' && ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        const thumbnailPath = await uploadService.createThumbnail(filePath);
        const relativePath = thumbnailPath.replace(/\\/g, '/');
        thumbnailUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/${relativePath}`;
      }

      // Actualizar file path si fue procesado
      if (filePath !== req.file.path) {
        req.file.path = filePath;
        req.file.filename = filePath.split('/').pop() || req.file.filename;
      }

      const fileInfo = uploadService.getFileInfo(req.file);

      logger.info(`Archivo subido exitosamente: ${fileInfo.filename}`);

      return res.status(200).json({
        success: true,
        message: 'Archivo subido exitosamente',
        data: {
          ...fileInfo,
          thumbnailUrl
        }
      });
    } catch (error: any) {
      logger.error('Error subiendo archivo:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al subir el archivo'
      });
    }
  }

  /**
   * Subir múltiples archivos
   */
  async uploadMultiple(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron archivos'
        });
      }

      const uploadedFiles = req.files.map(file => uploadService.getFileInfo(file));

      logger.info(`${uploadedFiles.length} archivos subidos exitosamente`);

      return res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} archivos subidos exitosamente`,
        data: uploadedFiles
      });
    } catch (error: any) {
      logger.error('Error subiendo archivos:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al subir los archivos'
      });
    }
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(req: Request, res: Response) {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: 'La ruta del archivo es requerida'
        });
      }

      await uploadService.deleteFile(filePath);

      logger.info(`Archivo eliminado: ${filePath}`);

      return res.status(200).json({
        success: true,
        message: 'Archivo eliminado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error eliminando archivo:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el archivo'
      });
    }
  }
}

export default new UploadController();
