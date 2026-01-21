import { Router } from 'express';
import departmentAccessController from '../controllers/departmentAccess.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/departments/accessible
 * Obtiene departamentos accesibles para el usuario actual
 */
router.get(
  '/accessible',
  departmentAccessController.getAccessibleDepartments.bind(departmentAccessController)
);

/**
 * GET /api/departments/:departmentId/users-with-access
 * Obtiene usuarios con acceso a un departamento (Solo SUPER_ADMIN)
 */
router.get(
  '/:departmentId/users-with-access',
  authorize('SUPER_ADMIN'),
  departmentAccessController.getUsersWithAccess.bind(departmentAccessController)
);

/**
 * POST /api/departments/:departmentId/grant-access
 * Otorga acceso a un usuario (Solo SUPER_ADMIN)
 */
router.post(
  '/:departmentId/grant-access',
  authorize('SUPER_ADMIN'),
  departmentAccessController.grantAccess.bind(departmentAccessController)
);

/**
 * DELETE /api/departments/:departmentId/revoke-access/:userId
 * Revoca acceso de un usuario (Solo SUPER_ADMIN)
 */
router.delete(
  '/:departmentId/revoke-access/:userId',
  authorize('SUPER_ADMIN'),
  departmentAccessController.revokeAccess.bind(departmentAccessController)
);

/**
 * PUT /api/departments/:departmentId/set-default
 * Marca departamento como por defecto (Solo SUPER_ADMIN)
 */
router.put(
  '/:departmentId/set-default',
  authorize('SUPER_ADMIN'),
  departmentAccessController.setAsDefault.bind(departmentAccessController)
);

export default router;
