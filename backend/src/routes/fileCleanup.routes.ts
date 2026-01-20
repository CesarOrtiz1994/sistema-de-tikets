import { Router } from 'express';
import fileCleanupController from '../controllers/fileCleanup.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin } from '../middlewares/permissions.middleware';

const router = Router();

// Todas las rutas requieren autenticación y permisos de super admin
router.use(authenticate);
router.use(isSuperAdmin());

/**
 * @route   POST /api/cleanup/manual
 * @desc    Ejecutar limpieza manual completa
 * @access  Private (Admin)
 */
router.post('/manual', fileCleanupController.runManualCleanup);

/**
 * @route   GET /api/cleanup/stats
 * @desc    Obtener estadísticas de almacenamiento
 * @access  Private (Admin)
 */
router.get('/stats', fileCleanupController.getStorageStats);

/**
 * @route   POST /api/cleanup/temp
 * @desc    Limpiar archivos temporales
 * @access  Private (Admin)
 */
router.post('/temp', fileCleanupController.cleanupTempFiles);

/**
 * @route   POST /api/cleanup/orphans
 * @desc    Limpiar archivos huérfanos
 * @access  Private (Admin)
 */
router.post('/orphans', fileCleanupController.cleanupOrphanFiles);

export default router;
