import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import { upload, validateFileSize } from '../config/multer';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateZod';
import { deleteFileSchema } from '../validators/upload.validator';
import { uploadLimiter, deletionLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   POST /api/upload/single
 * @desc    Subir un solo archivo
 * @access  Private
 */
router.post(
  '/single',
  uploadLimiter,
  upload.single('file'),
  validateFileSize,
  uploadController.uploadSingle
);

/**
 * @route   POST /api/upload/multiple
 * @desc    Subir múltiples archivos
 * @access  Private
 */
router.post(
  '/multiple',
  uploadLimiter,
  upload.array('files', 10),
  validateFileSize,
  uploadController.uploadMultiple
);

/**
 * @route   DELETE /api/upload
 * @desc    Eliminar archivo
 * @access  Private
 */
router.delete(
  '/',
  deletionLimiter,
  validateBody(deleteFileSchema),
  uploadController.deleteFile
);

export default router;
